# CVF Integrations Tab & Runtime Store Roadmap

Memory class: SUMMARY_RECORD

Status: AUTHORIZED — ready for Codex execution (2026-05-17)

## Authorization / Decision

Operator authorized this tranche on 2026-05-17. Decision: build an
Integrations tab inside the Settings modal so Non-coders can connect an
external runtime store (Supabase or any HTTP endpoint) by copy/pasting
credentials — without touching Netlify environment variables or any dev
tooling. Once connected, the Runtime Monitor at `/runtime` reads live agent
events from that store instead of the local JSONL file unavailable on Netlify.

Risk ceiling: R1. No destructive actions. Fallback to local JSONL is
guaranteed when no store is configured or the connection fails.

## Purpose

The Runtime Monitor page (`/runtime`) currently shows empty panels on Netlify
because its data source is a local filesystem JSONL file that does not exist
in a cloud deploy. Non-coders who access the app via Netlify see no live agent
activity.

This tranche resolves the gap by:

1. Adding a fourth **Integrations** tab to the existing Settings modal.
2. Letting the user pick a store provider (None / Supabase / HTTP) and paste
   credentials directly in the UI.
3. Building a server-side adapter that reads from the chosen store and feeds
   the Runtime Monitor — with silent fallback to local mode when not configured.

## Scope

Owner surface: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`

Files to create (8):

- `src/lib/integrations-config.ts`
- `src/components/IntegrationsTab.tsx`
- `src/lib/server/integration-store.ts`
- `src/lib/server/integration-store.test.ts`
- `src/app/api/integrations/test/route.ts`
- `src/app/api/integrations/test/route.test.ts`
- `src/lib/hooks/useRuntimeStore.ts`
- `src/lib/server/supabase-schema.sql`

Files to modify (4):

- `src/components/Settings.tsx` — add Integrations tab
- `src/app/api/runtime/observability/route.ts` — pass adapter
- `src/lib/server/runtime-observability.ts` — accept adapter option
- `src/app/(dashboard)/runtime/page.tsx` — pass config header
- `src/components/index.ts` — export IntegrationsTab

## Non-Goals

- Billing control or multi-tenant quota enforcement
- Guaranteed delivery of every agent event to the store
- Any UI route beyond Settings modal and Runtime Monitor
- Changes to governance contracts, CPF, or public-sync repo
- Supabase authentication / OAuth flows — anon key only

## Work Plan

Steps 1-3 are independent. Step 4 depends on 3. Steps 5-6 depend on 1.
Step 7 depends on 3 and 4. Step 8 depends on 1 and 5. Step 9 depends on
4, 6, and 8. Step 10 is final wiring.

---

### Step 1 — Types & localStorage layer

**Create:** `src/lib/integrations-config.ts`

Exports:

```typescript
export type IntegrationProvider = 'supabase' | 'http' | 'none';

export interface SupabaseIntegrationConfig { url: string; anonKey: string; }
export interface HttpIntegrationConfig { endpoint: string; bearerToken: string; }

export interface IntegrationsConfig {
  runtimeStore: {
    provider: IntegrationProvider;
    supabase: SupabaseIntegrationConfig;
    http: HttpIntegrationConfig;
  };
}

export const defaultIntegrationsConfig: IntegrationsConfig;
export const INTEGRATIONS_STORAGE_KEY = 'cvf_integrations';

export function loadIntegrationsConfig(): IntegrationsConfig;
export function saveIntegrationsConfig(config: IntegrationsConfig): void;

// Encode/decode for x-cvf-integration-config request header (base64 JSON)
export function encodeIntegrationsHeader(config: IntegrationsConfig): string;
export function decodeIntegrationsHeader(header: string): IntegrationsConfig | null;
```

Implementation notes:

- `loadIntegrationsConfig` guards `typeof window === 'undefined'` before
  touching localStorage; catches JSON parse errors; deep-merges with default.
- `decodeIntegrationsHeader` catches any parse error and returns null.
- Use `Buffer.from(...).toString('base64')` / reverse for encode/decode.
- No test file for this step — tested indirectly via Step 3 tests.

---

### Step 2 — API route: test connection

**Create:** `src/app/api/integrations/test/route.ts`

```typescript
export interface IntegrationTestRequest {
  provider: 'supabase' | 'http' | 'none';
  supabase?: { url: string; anonKey: string };
  http?: { endpoint: string; bearerToken: string };
}

export interface IntegrationTestResponse {
  ok: boolean;
  status: 'connected' | 'error' | 'disabled';
  latencyMs: number;
  detail?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse>
```

Logic per provider:

**none** → `{ ok: true, status: 'disabled', latencyMs: 0 }`

**supabase**:

1. Validate url and anonKey non-empty → error if missing
2. Parse url as URL object → error if malformed
3. Probe: `GET ${origin}/rest/v1/runtime_events?select=id&limit=1`
   with headers `apikey: anonKey` and `Authorization: Bearer anonKey`
   and `AbortSignal.timeout(5000)`
4. HTTP 200 or 406 → connected; other → error; fetch throw → error

**http**:

1. Validate endpoint non-empty → error if missing
2. `GET endpoint` with optional `Authorization: Bearer bearerToken`
   and `AbortSignal.timeout(5000)`
3. response.ok → connected; else → error; fetch throw → error

Security rule: NEVER log the anonKey or bearerToken value. Log only their
`.length` or whether they are present.

**Create:** `src/app/api/integrations/test/route.test.ts`

Required test cases (mock global fetch with vitest):

```text
1.  provider=none → ok:true, status:'disabled', latencyMs:0
2.  provider=supabase, url='', anonKey='' → ok:false, detail includes 'required'
3.  provider=supabase, url='not-a-url', anonKey='k' → ok:false, detail includes 'valid URL'
4.  provider=supabase, valid url+key, fetch→200 → ok:true, status:'connected'
5.  provider=supabase, fetch→406 → ok:true, status:'connected'
6.  provider=supabase, fetch→401 → ok:false, detail includes '401'
7.  provider=supabase, fetch throws → ok:false, status:'error'
8.  provider=http, endpoint='' → ok:false, detail includes 'required'
9.  provider=http, endpoint set, fetch→200 → ok:true, status:'connected'
10. provider=http, fetch throws → ok:false, status:'error'
11. provider=unknown → ok:false, detail includes 'Unknown'
```

Assert on `ok`, `status`, `detail` content only. Never assert on raw key
values.

---

### Step 3 — Server adapter layer

**Create:** `src/lib/server/integration-store.ts`

```typescript
export interface RuntimeStoreRecord {
  job_id: string; event_type: string; status: string;
  provider_lane: string | null; cwd_label: string;
  correlation_id: string; evidence_refs: string[];
  cost_quota: Record<string, unknown> | null;
  requested_at: string; recorded_at: string;
}

export interface IntegrationStoreAdapter {
  isAvailable(): boolean;
  fetchLatestJobs(limit: number): Promise<RuntimeStoreRecord[]>;
}

export class NullAdapter implements IntegrationStoreAdapter
export class SupabaseAdapter implements IntegrationStoreAdapter
export class HttpAdapter implements IntegrationStoreAdapter

export function buildIntegrationAdapter(
  clientConfig: IntegrationsConfig | null
): IntegrationStoreAdapter

export function storeRecordToJobEvent(
  record: RuntimeStoreRecord
): GovernanceJobEvent
```

`buildIntegrationAdapter` priority:

1. Env vars `SUPABASE_URL` + `SUPABASE_ANON_KEY` set → SupabaseAdapter
2. clientConfig provider='supabase' → SupabaseAdapter
3. clientConfig provider='http' → HttpAdapter
4. Anything else / null → NullAdapter

`SupabaseAdapter.fetchLatestJobs`:

- Endpoint: `${origin}/rest/v1/runtime_events?order=recorded_at.desc&limit=${limit}&select=*`
- Headers: `apikey`, `Authorization: Bearer`, `Accept: application/json`
- Timeout: `AbortSignal.timeout(8000)`
- Returns `[]` on any error

`HttpAdapter.fetchLatestJobs`:

- Endpoint: `${endpoint}?limit=${limit}`
- Optional `Authorization: Bearer` header if bearerToken set
- Returns `[]` on any error

`storeRecordToJobEvent` must fill all required fields of `GovernanceJobEvent`.
Non-obvious mappings:

- `eventId`: `store-${job_id}-${recorded_at}`
- `jobType`: `'provider_check'`
- `requestedBy`: `'external-store'`
- `role`: `'operator'`
- `decision`: `'allowed'`
- `handlerId`: `'integration-store'`
- `fixedArgv`: `[]`
- `costQuota`: `null`

**Create:** `src/lib/server/integration-store.test.ts`

Required test cases:

```text
NullAdapter:
  1. isAvailable() → false
  2. fetchLatestJobs(10) → []

SupabaseAdapter:
  3. url='', anonKey='k' → isAvailable() false
  4. url='https://x.supabase.co', anonKey='' → isAvailable() false
  5. both set → isAvailable() true
  6. fetchLatestJobs — fetch mock 200 + valid array → returns array
  7. fetchLatestJobs — fetch throws → []
  8. fetchLatestJobs — fetch 401 → []
  9. fetchLatestJobs — url malformed → []

HttpAdapter:
  10. endpoint='' → isAvailable() false
  11. endpoint set → isAvailable() true
  12. fetchLatestJobs — fetch 200 → returns array
  13. fetchLatestJobs — fetch throws → []

buildIntegrationAdapter:
  14. env SUPABASE_URL+SUPABASE_ANON_KEY set → SupabaseAdapter instance
  15. no env, provider='none' → NullAdapter
  16. no env, provider='supabase' → SupabaseAdapter
  17. no env, provider='http' → HttpAdapter
  18. clientConfig=null → NullAdapter

storeRecordToJobEvent:
  19. maps job_id → jobId
  20. provider_lane null → null, no crash
```

---

### Step 4 — Wire adapter into runtime-observability.ts

**Modify:** `src/lib/server/runtime-observability.ts`

Three additions only — do not rewrite the file:

1. Add import at top:

```typescript
import { type IntegrationStoreAdapter, storeRecordToJobEvent } from './integration-store';
```

2. Extend `RuntimeObservabilityOptions`:

```typescript
interface RuntimeObservabilityOptions {
  repoRoot?: string;
  appRoot?: string;
  now?: () => string;
  integrationAdapter?: IntegrationStoreAdapter;  // add this
}
```

3. Inside `getRuntimeObservabilitySnapshot`, replace the
`const jobs = listGovernanceJobs(...)` line with:

```typescript
let jobs: ReturnType<typeof listGovernanceJobs>;
if (options.integrationAdapter?.isAvailable()) {
  const records = await options.integrationAdapter.fetchLatestJobs(20);
  const mappedEvents = records.map(storeRecordToJobEvent);
  jobs = {
    auditPath: 'integration-store',
    events: mappedEvents,
    jobs: mappedEvents,
    costQuota: summarizeCostQuota({
      policy: { dailyGlobalLiveCallLimit: 0, cooldownSeconds: 0, windowHours: 24, providerLanes: {} },
      usage: { global: 0, byProvider: {} },
      windowEnd: generatedAt,
    }),
  };
} else {
  jobs = listGovernanceJobs({ repoRoot });
}
```

`getRuntimeObservabilitySnapshot` must become `async` after this change.
Update its return type to `Promise<RuntimeObservabilitySnapshot>`. Update
the existing test file (`runtime-observability.test.ts`) to `await` the
function calls — do not change test assertions, only add `await`.

---

### Step 5 — IntegrationsTab component

**Create:** `src/components/IntegrationsTab.tsx`

Keep under 200 lines (GC-023). Component is self-contained — reads/writes
localStorage directly via `loadIntegrationsConfig` / `saveIntegrationsConfig`.
Does NOT receive config as props.

```typescript
'use client';
import { useState, useEffect } from 'react';
import { Cloud, Link2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  loadIntegrationsConfig, saveIntegrationsConfig,
  type IntegrationsConfig, type IntegrationProvider, defaultIntegrationsConfig,
} from '@/lib/integrations-config';
import type { IntegrationTestResponse } from '@/app/api/integrations/test/route';
```

State:

```typescript
const [config, setConfig] = useState<IntegrationsConfig>(defaultIntegrationsConfig);
const [showAnonKey, setShowAnonKey] = useState(false);
const [showBearerToken, setShowBearerToken] = useState(false);
const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
const [testDetail, setTestDetail] = useState('');
const [saved, setSaved] = useState(false);
```

Hydration-safe load — same pattern as `useSettings` in `Settings.tsx`:

```typescript
useEffect(() => { setConfig(loadIntegrationsConfig()); }, []);
```

Bilingual labels (vi + en) — use `useLanguage()` from `@/lib/i18n`:

| Key | vi | en |
|---|---|---|
| title | 'Cloud Integrations' | 'Cloud Integrations' |
| subtitle | 'Kết nối store bên ngoài để Runtime Monitor hiển thị dữ liệu thực trên Netlify.' | 'Connect an external store so the Runtime Monitor shows live data on Netlify.' |
| providerLabel | 'Runtime Store Provider' | 'Runtime Store Provider' |
| none | 'None' | 'None' |
| noneDesc | 'Chỉ dùng dữ liệu local.' | 'Local data only.' |
| supabase | 'Supabase' | 'Supabase' |
| supabaseDesc | 'Dán Project URL và anon key từ Supabase dashboard.' | 'Paste Project URL and anon key from Supabase dashboard.' |
| http | 'Custom HTTP' | 'Custom HTTP' |
| httpDesc | 'Bất kỳ REST endpoint nào trả về mảng runtime_events.' | 'Any REST endpoint returning a runtime_events JSON array.' |
| projectUrl | 'Project URL' | 'Project URL' |
| anonKey | 'Anon Key (public)' | 'Anon Key (public)' |
| endpoint | 'Endpoint URL' | 'Endpoint URL' |
| bearerToken | 'Bearer Token (optional)' | 'Bearer Token (optional)' |
| show / hide | 'Hiện' / 'Ẩn' | 'Show' / 'Hide' |
| test | 'Test Connection' | 'Test Connection' |
| testing | 'Đang kiểm tra...' | 'Testing...' |
| save | 'Lưu' | 'Save' |
| savedLabel | 'Đã lưu!' | 'Saved!' |
| connected | 'Đã kết nối' | 'Connected' |
| notConnected | 'Chưa kết nối' | 'Not connected' |
| sqlNote | 'Cần tạo bảng runtime_events trong Supabase trước.' | 'Create the runtime_events table in Supabase first.' |

Layout sections (in order):
1. Header: `<Cloud />` icon + title + subtitle
2. Provider selector: 3 bordered buttons (None / Supabase / HTTP), active = indigo border
3. If provider='supabase': Project URL input + Anon Key password input (Show/Hide) + muted sqlNote text
4. If provider='http': Endpoint input + Bearer Token password input (Show/Hide)
5. If provider !== 'none': action row with [Test Connection] + status badge + [Save] button

Status badge:
- idle: nothing
- testing: `<Loader2 className="animate-spin" />` + label
- ok: `<CheckCircle2 />` green + label + latency if available
- error: `<XCircle />` red + label + detail text below

`handleTest()`:
```typescript
setTestStatus('testing');
const body = {
  provider: config.runtimeStore.provider,
  supabase: config.runtimeStore.supabase,
  http: config.runtimeStore.http,
};
try {
  const res = await fetch('/api/integrations/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json() as IntegrationTestResponse;
  setTestStatus(data.ok ? 'ok' : 'error');
  setTestDetail(data.detail ?? '');
} catch (err) {
  setTestStatus('error');
  setTestDetail(err instanceof Error ? err.message : 'Connection failed.');
}
```

`handleSave()`:
```typescript
saveIntegrationsConfig(config);
setSaved(true);
setTimeout(() => setSaved(false), 2000);
```

`handleProviderChange(p: IntegrationProvider)`:
```typescript
setConfig(prev => ({ ...prev, runtimeStore: { ...prev.runtimeStore, provider: p } }));
setTestStatus('idle');
setTestDetail('');
```

---

### Step 6 — useRuntimeStore hook

**Create:** `src/lib/hooks/useRuntimeStore.ts`

```typescript
'use client';
import { useEffect, useState } from 'react';
import {
  loadIntegrationsConfig, encodeIntegrationsHeader,
  type IntegrationsConfig, defaultIntegrationsConfig,
} from '../integrations-config';

export interface RuntimeStoreHeaders {
  'x-cvf-integration-config'?: string;
}

export function useRuntimeStore(): { headers: RuntimeStoreHeaders; isConfigured: boolean } {
  const [config, setConfig] = useState<IntegrationsConfig>(defaultIntegrationsConfig);
  useEffect(() => { setConfig(loadIntegrationsConfig()); }, []);

  const isConfigured = config.runtimeStore.provider !== 'none';
  const headers: RuntimeStoreHeaders = isConfigured
    ? { 'x-cvf-integration-config': encodeIntegrationsHeader(config) }
    : {};
  return { headers, isConfigured };
}
```

No separate test file — tested indirectly.

---

### Step 7 — Wire adapter into observability route

**Modify:** `src/app/api/runtime/observability/route.ts`

Replace entire file (currently 12 lines) with:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getRuntimeObservabilitySnapshot } from '@/lib/server/runtime-observability';
import { buildIntegrationAdapter } from '@/lib/server/integration-store';
import { decodeIntegrationsHeader } from '@/lib/integrations-config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const configHeader = request.headers.get('x-cvf-integration-config');
  const clientConfig = configHeader ? decodeIntegrationsHeader(configHeader) : null;
  const integrationAdapter = buildIntegrationAdapter(clientConfig);
  const snapshot = await getRuntimeObservabilitySnapshot({ integrationAdapter });
  return NextResponse.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
}
```

Update the existing route test file (`route.test.ts` in same folder) to mock
`getRuntimeObservabilitySnapshot` as async if it is not already.

---

### Step 8 — Add Integrations tab to Settings.tsx

**Modify:** `src/components/Settings.tsx` — four targeted changes only.
Do NOT rewrite the file. Current line count: 801. Adding ~20 lines.

Change 1 — Add import after last existing import line:
```typescript
import { IntegrationsTab } from './IntegrationsTab';
```

Change 2 — Extend tab type union (find the `useState` for `activeTab`):
```typescript
// Before:
useState<'providers' | 'preferences' | 'data'>('providers')
// After:
useState<'providers' | 'preferences' | 'data' | 'integrations'>('providers')
```

Change 3 — Add label key to both `vi` and `en` label objects
(after the existing `data:` entry in each):
```typescript
integrations: '🔗 Integrations',
```

Change 4 — In the tab bar `.map()` array, add `'integrations'`:
```typescript
// Before:
(['providers', 'preferences', 'data'] as const)
// After:
(['providers', 'preferences', 'data', 'integrations'] as const)
```

Change 5 — Add content block after the `{activeTab === 'data' && ...}` block:
```tsx
{activeTab === 'integrations' && (
  <IntegrationsTab />
)}
```

---

### Step 9 — Wire useRuntimeStore into runtime/page.tsx

**Modify:** `src/app/(dashboard)/runtime/page.tsx` — three targeted additions.

Addition 1 — Import after existing imports:
```typescript
import { useRuntimeStore } from '@/lib/hooks/useRuntimeStore';
```

Addition 2 — Inside `RuntimeMonitorPage` component, after the `useState` hooks:
```typescript
const { headers: runtimeHeaders } = useRuntimeStore();
```

Addition 3 — In the `load()` function, add headers to fetch:
```typescript
// Before:
const response = await fetch('/api/runtime/observability', { cache: 'no-store' });
// After:
const response = await fetch('/api/runtime/observability', {
  cache: 'no-store',
  headers: runtimeHeaders,
});
```

---

### Step 10 — Export + SQL schema

**Modify:** `src/components/index.ts` — add one line at end:
```typescript
export * from './IntegrationsTab';
```

**Create:** `src/lib/server/supabase-schema.sql`

```sql
-- CVF Runtime Events — Supabase schema
-- Run once: Supabase Dashboard → SQL Editor → New Query → paste → Run

create table if not exists runtime_events (
  id             bigserial    primary key,
  job_id         text         not null,
  event_type     text         not null,
  status         text         not null,
  provider_lane  text,
  cwd_label      text         not null default '',
  correlation_id text         not null,
  evidence_refs  jsonb        not null default '[]',
  cost_quota     jsonb,
  requested_at   timestamptz  not null,
  recorded_at    timestamptz  not null default now()
);

create index if not exists runtime_events_recorded_at_idx
  on runtime_events (recorded_at desc);

alter table runtime_events enable row level security;

create policy "anon_read" on runtime_events
  for select using (true);

-- Optional: enable INSERT for service_role (agent/CI hooks)
-- create policy "service_insert" on runtime_events
--   for insert with check (true);
```

---

## GC-023 Pre-flight

All new files are within GC-023 thresholds. No exception registry update needed.

| File | Class | Est. lines | Soft | Hard |
|---|---|---|---|---|
| `integrations-config.ts` | general_source | ~65 | 700 | ~1000 |
| `IntegrationsTab.tsx` | frontend_component | ~190 | 700 | ~1000 |
| `integration-store.ts` | general_source | ~130 | 700 | ~1000 |
| `integration-store.test.ts` | test_code | ~90 | 800 | ~1200 |
| `integrations/test/route.ts` | general_source | ~80 | 700 | ~1000 |
| `integrations/test/route.test.ts` | test_code | ~65 | 800 | ~1200 |
| `useRuntimeStore.ts` | general_source | ~30 | 700 | ~1000 |
| `supabase-schema.sql` | not governed | — | — | — |

Modified files — `Settings.tsx` is already soft-advisory (801 lines). Adding
~20 lines keeps it well within hard threshold. `IntegrationsTab` is extracted
to its own file, so no split of `Settings.tsx` is required.

## Acceptance Criteria

- [ ] Settings modal renders 4 tabs: AI Providers, Preferences, Data, Integrations
- [ ] Provider selector shows None / Supabase / HTTP options
- [ ] Supabase fields shown when Supabase selected; hidden when None or HTTP
- [ ] Test Connection returns correct status for none / supabase (200, 406, error) / http
- [ ] Save persists to localStorage key `cvf_integrations`
- [ ] Runtime Monitor passes `x-cvf-integration-config` header when store configured
- [ ] Runtime Monitor falls back to local JSONL when provider is 'none'
- [ ] `npm run test:run` — all tests pass (existing + new)
- [ ] `npm run check` — zero TypeScript errors
- [ ] `npm run lint` — zero warnings

## Verification / Evidence

After implementation, Codex must confirm:
- `npm run test:run` output: total pass count increased by new tests, zero failures
- `npm run check`: exit 0
- `npm run lint`: exit 0 with max-warnings=0
- Manual trace: Settings → Integrations tab renders without error
- Manual trace: Test Connection with provider=none returns disabled status

## Claim Boundary

Allowed claim: Non-coder can connect a Supabase project in the Settings UI
and Runtime Monitor will show live events from that project.

Not allowed: this does not claim billing control, guaranteed event delivery,
multi-tenant quota enforcement, or that every agent automatically writes to
the store (writing to the store requires a separate agent-side hook, not
covered by this tranche).

Fallback guaranteed: if no integration is configured or the adapter returns
an empty array, Runtime Monitor falls back silently to local JSONL behavior —
no regression to existing functionality.
