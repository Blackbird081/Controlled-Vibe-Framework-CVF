# CVF Enterprise Admin Console — Phase C + D Detailed Roadmap
*Date: 2026-04-18 | Parent: `CVF_ENTERPRISE_ADMIN_ROADMAP_V2_2026-04-17.md`*
*Status: READY TO EXECUTE — Phase C0 gate required before C1*

> **Context:** Phase 0 + A + B đã merged tại commit `213c1961`. Foundation hoạt động: RBAC middleware, admin layout, FinOps dashboard (read-only), Audit Log viewer, Tool Registry inventory (static), Approvals redirect. Phase C bổ sung control actions — quota engine, tool registry policy, HITL expansion.
>
> **Nguyên tắc giữ nguyên từ V2:** (1) Reuse trước khi build mới. (2) Read adapter trước write UI. (3) Mọi write-action R2/R3 có rollback path + audit event. (4) Khai báo GC binding trước khi bắt đầu mỗi phase.

---

## Trạng thái hiện tại (post Phase 0+A+B)

### Files đang active — agent PHẢI đọc trước khi làm

| File | Vai trò | Điểm cần biết |
|---|---|---|
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/control-plane-events.ts` | Canonical event store | Unified `UnifiedAuditEvent` + `CostEvent`. Append-only JSON. GC-022 FULL class. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execute-telemetry.ts` | Cost telemetry emitter | Gọi từ `execute/route.ts:387`. Emit `CostEvent` + `UnifiedAuditEvent`. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/enterprise-access.ts` | RBAC helper | `canAccessAdmin(role)` — dùng cho mọi admin route mới. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/admin-session.ts` | Server component guard | `requireAdminSession(path)` — gọi ở đầu mỗi admin page. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/tool-registry-catalog.ts` | Tool catalog (static) | Mock tools hiện tại. C3 sẽ convert sang dynamic. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/approvals/page.tsx` | HITL UI gốc | C4 sẽ extend, không replace. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | Execute path | C2 thêm quota check tại đây, sau `applySafetyFilters`. |
| `EXTENSIONS/CVF_GUARD_CONTRACT/src/enterprise/enterprise-org.ts` | Org/Team schema | `OrganizationRecord`, `TeamRecord`, `EnterpriseUserProfile`. |

### Known deviations từ Roadmap V2 (đã documented)

- **D1:** `control-plane-events.ts` là file store mới, KHÔNG reuse `governanceLedger()`. ADR cần viết trong C0.
- **D3:** Double sidebar (main sidebar có Enterprise group + admin layout có sidebar riêng). Fix trong C0.
- **D2:** Tool Registry là static catalog. Fix trong C3.

---

## Phase C0 — Alignment Hotfix (2–3 ngày)

**GC Binding:** GC-018 (R1 action), GC-022 (ADR = evidence record)
**Gate:** C0 phải DONE và merged trước khi bất kỳ ai bắt đầu C1.

### C0.1 — Fix R1: Fail-closed audit secret

**Files:** `middleware.ts:44`, `src/app/api/admin/audit/route.ts:7`

**Current (insecure):**

```ts
const INTERNAL_AUDIT_SECRET = process.env.CVF_INTERNAL_AUDIT_SECRET || 'cvf-internal-audit';
```

**Fix:**

```ts
const INTERNAL_AUDIT_SECRET = process.env.CVF_INTERNAL_AUDIT_SECRET;
if (!INTERNAL_AUDIT_SECRET) {
  throw new Error('CVF_INTERNAL_AUDIT_SECRET env var is required');
}
```

Cho middleware (runtime, không thể throw at module level): nếu missing thì skip audit POST silently nhưng log error, KHÔNG dùng fallback string.

### C0.2 — Fix R2: Audit delivery observability

**File:** `middleware.ts:57`

**Current:**

```ts
void fetch(auditUrl, { ... }).catch(() => undefined);
```

**Fix:**

```ts
void fetch(auditUrl, { ... }).catch((error) => {
  console.error('[CVF AUDIT DELIVERY FAILED]', pathname, error);
});
```

### C0.3 — Fix D3: Double sidebar

**Files:** `src/components/Sidebar.tsx:294-333`, `src/app/admin/layout.tsx`

**Fix:**

- Xóa toàn bộ Enterprise group (lines 294–333) khỏi `Sidebar.tsx`.
- Thay bằng 1 link duy nhất: `"🏢 Enterprise Console"` → `/admin/finops`. Chỉ render nếu `userRole in {owner, admin}`.
- Admin layout giữ nguyên sidebar riêng của nó.

### C0.4 — ADR event store

**Tạo file:** `docs/baselines/CVF_ADR_CONTROL_PLANE_EVENT_STORE_2026-04-18.md`

Nội dung phải trả lời 3 câu hỏi:

1. Tại sao không dùng `governanceLedger()` cho `CostEvent`/`UnifiedAuditEvent`?
2. Canonical source-of-truth cho admin control plane events là `control-plane-events.ts`. `governanceLedger` là ledger cho governance workflow events (phase changes, knowledge compile...). Hai concerns khác nhau.
3. Khi nào thì migrate storage (R3 deferred tới Phase D2)?

### C0.5 — GC-023 evidence note (governance debt)

Thêm comment ngắn trong ADR file trên: "control-plane-events.ts (299 dòng) đã pass GC-023 pre-commit hook tại commit 213c1961. Không cần exception registry entry vì 299 < threshold của class `general_source`."

### C0 Acceptance Gate

- `npm run lint` (max-warnings=0) pass.
- `npm run test` pass.
- `npm run test:e2e` pass (đặc biệt `admin-rbac.spec.ts`).
- `CVF_INTERNAL_AUDIT_SECRET` missing → server start error (không phải silent fallback).
- Vào `/admin/finops` với `developer` → redirect về `/`.
- Main sidebar: chỉ còn 1 link "Enterprise Console" cho admin/owner.

---

## Phase C1 — Policy Substrate (3–4 ngày)

**GC Binding:** GC-022 (policy events = FULL class), GC-023 (pre-flight trước mọi file mới)
**Prerequisite:** C0 merged.

**Mục tiêu:** Định nghĩa các policy types và read adapter trước khi mở write UI. Không có write-action nào trong phase này.

### C1.1 — Policy event types

**File mới:** `src/lib/policy-events.ts` (tách khỏi `control-plane-events.ts` để tránh vượt GC-023)

```ts
export interface QuotaPolicy {
  kind: 'quota-policy';
  teamId: string;
  orgId: string;
  softCapUSD: number;
  hardCapUSD: number;
  period: 'monthly' | 'weekly' | 'daily';
  setBy: string;
  setAt: string;
}

export interface QuotaOverride {
  kind: 'quota-override';
  teamId: string;
  orgId: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;      // TTL — hardcoded 24h
  reason: string;
}

export interface ToolPolicy {
  kind: 'tool-policy';
  toolId: string;
  allowedRoles: TeamRole[];
  setBy: string;
  setAt: string;
}
```

Persist vào `control-plane-events.ts` store (extend `ControlPlaneEvent` union type).

### C1.2 — Policy read adapter

**File mới:** `src/lib/policy-reader.ts`

```ts
export async function getActiveQuotaPolicy(teamId: string): Promise<QuotaPolicy | null>
export async function getActiveQuotaOverride(teamId: string): Promise<QuotaOverride | null>
export async function getActiveToolPolicy(toolId: string): Promise<ToolPolicy | null>
export async function getAllToolPolicies(): Promise<Map<string, ToolPolicy>>
```

Logic: đọc từ `control-plane-events.ts` store, filter by kind, lấy record mới nhất theo `setAt`.

### C1.3 — Display policy trên admin pages (read-only)

- `/admin/finops`: thêm section "Active Quota Rules" — hiển thị QuotaPolicy hiện tại mỗi team. Nếu chưa có → "No quota set".
- `/admin/tool-registry`: thêm column "Policy Override" — hiển thị ToolPolicy nếu có. Vẫn chưa có toggle.

### C1 Acceptance Gate

- `policy-reader.ts` có unit tests cover `getActiveQuotaPolicy`, `getActiveToolPolicy`.
- `/admin/finops` render "No quota set" khi store trống.
- Không có write endpoint nào trong C1.

---

## Phase C2 — Quota Engine (4–5 ngày)

**GC Binding:** GC-018 (hard cap suspend = R2 action, cần rollback path)
**Prerequisite:** C1 merged + `policy-reader.ts` active.

**Nguyên tắc:** Soft cap notify → Hard cap block → Override với TTL. Không có auto-suspend không có notice.

### C2.1 — Quota Rule UI (write action)

**File:** `src/app/admin/finops/page.tsx` + server action mới

Thêm form "Set Quota" vào `/admin/finops`:

- Fields: `teamId` (select), `softCapUSD`, `hardCapUSD`, `period`.
- Submit → POST `/api/admin/quota/policy` → append `QuotaPolicy` event vào store.
- Hiển thị current policy, nút "Edit" (tạo event mới, không xóa cũ — append-only).

**File mới:** `src/app/api/admin/quota/policy/route.ts`

- Auth: `requireAdminSession`.
- Validate: `hardCapUSD > softCapUSD > 0`.
- Emit: `QuotaPolicy` event + `UnifiedAuditEvent { eventType: 'QUOTA_POLICY_SET', riskLevel: 'R1' }`.

### C2.2 — Soft cap check + notification

**File:** `src/lib/execute-telemetry.ts`

Sau khi emit `CostEvent`, check `getActiveQuotaPolicy(teamId)`. Nếu total monthly cost ≥ `softCapUSD`:

- Emit `UnifiedAuditEvent { eventType: 'QUOTA_SOFT_CAP_REACHED', riskLevel: 'R1' }`.
- Log warning (in-app notification nếu có, nếu không thì console.warn — không block execution).

### C2.3 — Hard cap enforcement

**File:** `src/app/api/execute/route.ts` (sau `applySafetyFilters`, trước provider call)

```ts
const quotaCheck = await checkTeamQuota(session?.teamId);
if (quotaCheck.exceeded) {
  return NextResponse.json(
    { success: false, error: 'Team quota exceeded. Contact admin for override.', quotaInfo: quotaCheck },
    { status: 429 }
  );
}
```

**File mới:** `src/lib/quota-guard.ts` — tách quota logic ra khỏi execute route để tuân GC-023.

```ts
export async function checkTeamQuota(teamId?: string): Promise<{ exceeded: boolean; reason?: string; currentUSD: number; hardCapUSD: number }>
```

### C2.4 — Emergency Override (R2 action)

**File:** `/admin/finops/page.tsx` + API mới

Nút "Grant Emergency Override" (chỉ Owner mới thấy, không phải Admin):

- Form: `teamId`, `reason` (bắt buộc), TTL = 24h hardcoded.
- Submit → POST `/api/admin/quota/override`.
- Emit: `QuotaOverride` event + `UnifiedAuditEvent { eventType: 'QUOTA_OVERRIDE_GRANTED', riskLevel: 'R2' }`.
- `checkTeamQuota` kiểm tra `QuotaOverride` còn TTL trước khi block.

**Rollback:** POST `/api/admin/quota/override/revoke` → append `QuotaOverrideRevoked` event (không delete, append-only). Emit audit event `QUOTA_OVERRIDE_REVOKED`.

### C2 Acceptance Gate

- Unit tests cho `quota-guard.ts`: no policy → pass; soft cap reached → warning; hard cap → block; override active → pass.
- E2E: gọi execute với team đã vượt hard cap → nhận 429.
- `/admin/finops` hiển thị current quota + override status.
- Owner có nút "Grant Override", Admin thì không.

---

## Phase C3 — Tool Registry Actions (4–5 ngày)

**GC Binding:** GC-018 (tool disable = R1/R2, tùy tool risk level)
**Prerequisite:** C1 merged (ToolPolicy type đã defined).

### C3.1 — Dynamic tool inventory

**File:** `src/lib/tool-registry-catalog.ts` → convert từ static array sang dynamic.

- Giữ nguyên `TOOL_REGISTRY_CATALOG` như seed/fallback.
- Thêm `getToolInventory(): Promise<ToolCatalogEntry[]>` — merge static catalog với `getAllToolPolicies()` để hiển thị policy override nếu có.

**File:** `src/app/api/admin/tool-registry/route.ts` — update để trả về inventory + policy state.

### C3.2 — Whitelist/Blacklist toggle UI

**File:** `src/app/admin/tool-registry/page.tsx`

Mỗi tool card thêm:

- Toggle per role (owner/admin/developer/reviewer/viewer).
- Submit → POST `/api/admin/tool-registry/policy`.
- Show "Locked until Phase C" label thay bằng active toggles.

**File mới:** `src/app/api/admin/tool-registry/policy/route.ts`

- Auth: `requireAdminSession`.
- Validate: không thể remove `owner` khỏi bất kỳ tool nào.
- Emit: `ToolPolicy` event + `UnifiedAuditEvent { eventType: 'TOOL_POLICY_UPDATED', riskLevel: 'R1' }`.

### C3.3 — Runtime enforcement

**Files:** `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/phase-gate.guard.ts`, `risk-gate.guard.ts`

Thêm check `getActiveToolPolicy(toolId)` trong guard evaluation. Nếu user role không trong `allowedRoles` → block với `GuardResult { passed: false, reason: 'Tool disabled for role' }`.

**Điều kiện:** Tool phải có `toolId` trong request context để lookup policy. Nếu không có `toolId` → skip policy check (backward compatible).

### C3 Acceptance Gate

- Tool inventory hiển thị dynamic (static catalog + policy overlay).
- Toggle Owner role khỏi tool → error validation.
- Set tool policy → execute path với role bị block → 403.
- Unit tests cho `getActiveToolPolicy`, runtime enforcement.

---

## Phase C4 — Approvals/HITL Expansion (3–4 ngày)

**GC Binding:** GC-018 (approval actions = R2/R3), GC-023 (approvals/page.tsx có thể vượt threshold nếu thêm nhiều)
**Prerequisite:** C2 + C3 merged.

**Nguyên tắc:** Mở rộng `/approvals` hiện có, KHÔNG tạo queue mới.

### C4.1 — Full tool payload view

**File:** `src/app/approvals/page.tsx`

Thêm expandable "Payload" section cho mỗi pending request (hiện chỉ hiện `reason`):

```ts
interface ApprovalRequest {
  // existing fields...
  toolPayload?: Record<string, unknown>;  // thêm field này
  toolId?: string;
}
```

Hiển thị `toolPayload` trong collapsible `<details>` để Admin xem đầy đủ context trước khi approve.

### C4.2 — Timeout auto-reject

**File:** `src/app/approvals/page.tsx` + `src/app/api/approvals/route.ts` (tạo nếu chưa có)

- Hiển thị countdown timer cho request còn trong `pending` state.
- Server-side: khi `GET /api/approvals`, filter requests có `expiresAt < now` → tự động mark `expired` + emit `UnifiedAuditEvent { eventType: 'APPROVAL_EXPIRED', outcome: 'EXPIRED' }`.
- Không cần cron job — lazy expiry khi page load.

### C4.3 — Filter by tool + risk

**File:** `src/app/approvals/page.tsx`

Thêm filter form (tương tự audit-log viewer):

- Filter by: `toolId`, `riskLevel` (R1/R2/R3), `phase`, `status`.
- `/admin/approvals` redirect với `?riskLevel=R3` pre-filled (đã có từ Phase B).

### C4.4 — Emit audit events cho approve/reject actions

**File:** `src/app/approvals/page.tsx` (hoặc server action)

Khi Admin approve/reject:

- POST `/api/admin/audit` với `{ eventType: 'APPROVAL_DECIDED', actorId, action: 'APPROVE'|'REJECT', riskLevel, reason }`.
- Hiện tại chỉ update state in-memory — C4 phải persist decision vào control-plane-events store.

> **GC-023 note:** Nếu `approvals/page.tsx` vượt threshold sau C4.1–C4.4, tách thành `ApprovalRequestCard.tsx`, `ApprovalFilters.tsx`, `ApprovalHistory.tsx`.

### C4 Acceptance Gate

- Pending request hiển thị full tool payload.
- Request quá `expiresAt` → auto-expire khi page load, emit audit event.
- Approve/reject → persist audit event trong control-plane-events store.
- Filter form hoạt động đúng với all 4 filter params.
- Unit tests cho auto-expiry logic.

---

## Phase D1 — Egress Safety (1.5 tuần)

**GC Binding:** GC mới cần khai báo `GC-Egress-Filter` trước khi bắt đầu. Server-side, không bypass-able.
**Prerequisite:** C4 merged. Egress filter phải build sau khi execute path đã ổn định.

**Điểm chặn đúng:** `execute/route.ts:126` — sau `buildExecutionPrompt`, trước `applySafetyFilters`. Prompt tồn tại ở đây, không nơi nào khác.

### D1.1 — DLP Filter core

**File mới:** `src/lib/dlp-filter.ts`

```ts
export interface DLPMatch {
  patternId: string;
  label: string;
  matchCount: number;
}

export interface DLPResult {
  redacted: string;
  matches: DLPMatch[];
  wasRedacted: boolean;
}

export async function applyDLPFilter(text: string): Promise<DLPResult>
```

Logic: đọc `DLPPolicy` events từ `control-plane-events.ts` store (lấy patterns mới nhất), apply regex theo thứ tự. Redact bằng `[REDACTED:<label>]`.

**Layered approach (tránh chỉ dùng regex thuần):**

1. **Layer 1 — Preset patterns (built-in, không thể tắt):** Credit card (Luhn-compatible), API key patterns (`sk-`, `Bearer`, AWS `AKIA`), Vietnamese CCCD (12 chữ số), email trong system prompt context.
2. **Layer 2 — Admin-defined regex:** Từ `DLPPolicy` events do admin khai báo qua UI.
3. **Layer 3 — Allowlist:** Patterns được whitelist không bị redact (e.g., model names, CVF internal tokens).

### D1.2 — Hook vào execute path

**File:** `src/app/api/execute/route.ts:126`

```ts
const userPrompt = buildExecutionPrompt(body as ExecutionRequest);

// DLP egress filter — must run before safety filters and provider call
const dlpResult = await applyDLPFilter(userPrompt);
if (dlpResult.wasRedacted) {
  await appendAuditEvent({
    eventType: 'DLP_REDACTION_APPLIED',
    actorId: session?.userId ?? 'service-account',
    actorRole: session?.role ?? 'admin',
    targetResource: body.templateName ?? 'unknown',
    action: 'EGRESS_FILTER',
    outcome: 'REDACTED',
    payload: { matchCount: dlpResult.matches.length, patterns: dlpResult.matches.map(m => m.label) },
  });
}
const filteredPrompt = dlpResult.redacted;
// replace userPrompt with filteredPrompt in all downstream uses
```

> **GC-023 note:** `execute/route.ts` sẽ tăng thêm ~15 dòng. Nếu vượt threshold, tách DLP hook sang `src/lib/egress-pipeline.ts` nhận `(prompt, session, body)` và trả về `filteredPrompt`.

### D1.3 — DLP Admin Panel

**File mới:** `src/app/admin/dlp/page.tsx`
**File mới:** `src/app/api/admin/dlp/policy/route.ts`

UI tại `/admin/dlp`:

- Hiển thị preset patterns (read-only, không thể tắt).
- Form thêm custom regex: `label`, `pattern` (regex string), `enabled`.
- Preview panel: paste text → xem masked output real-time (client-side preview với patterns hiện tại).
- Submit → append `DLPPolicy` event vào store.

**DLPPolicy event type** (thêm vào `policy-events.ts` từ C1):

```ts
export interface DLPPolicy {
  kind: 'dlp-policy';
  patterns: Array<{ id: string; label: string; regex: string; enabled: boolean }>;
  setBy: string;
  setAt: string;
}
```

### D1.4 — RAG Knowledge Partitioning

**File:** `src/lib/knowledge-context-injector.ts` (đã tồn tại — chỉ thêm tenant filter)

Hiện tại knowledge injection không filter theo user. Thêm `orgId`/`teamId` filter:

```ts
export async function buildKnowledgeSystemPrompt(
  intent: string,
  options?: { orgId?: string; teamId?: string }
): Promise<string | null>
```

Trong execute path, pass `session?.orgId` và `session?.teamId` vào options. Knowledge chunks không có matching org/team scope → bị loại khỏi context.

**Admin UI:** `/admin/tool-registry` (Phase C3 đã có) — thêm tab "Knowledge Partitioning": cho phép admin set org/team scope per knowledge collection.

### D1 Acceptance Gate

- Unit tests `dlp-filter.ts`: preset patterns redact đúng; custom patterns từ store apply; allowlist bypass đúng.
- Integration: gọi execute với prompt chứa credit card number → response không chứa số thẻ; audit event `DLP_REDACTION_APPLIED` được emit.
- `/admin/dlp` preview panel hoạt động client-side.
- RAG filter: user `orgId=org_a` không nhận knowledge chunks của `org_b`.

---

## Phase D2 — Enterprise Hardening (1 tuần)

**GC Binding:** GC-018 (break-glass = R3 action — highest risk), GC-022 (tất cả events = FULL class)
**Prerequisite:** D1 merged.

### D2.1 — SIEM Webhook Export

**File mới:** `src/app/api/admin/siem/route.ts`
**File mới:** `src/app/admin/settings/page.tsx` (nếu chưa có)

Config tại `/admin/settings` → "SIEM Integration":

- Fields: `webhookUrl`, `signingSecret`, `enabled`, `eventTypes` (filter: audit only / cost only / all).
- Persist dưới dạng `SIEMConfig` event trong store.

**SIEM emit hook** tại `appendAuditEvent()` trong `control-plane-events.ts`:

```ts
// After writing to local store, if SIEM config exists and enabled:
await forwardToSIEM(record);
```

**File mới:** `src/lib/siem-forwarder.ts`

```ts
export async function forwardToSIEM(event: ControlPlaneEvent): Promise<void>
```

Format output: JSON-over-HTTPS, `X-CVF-Signature: hmac-sha256(<payload>)`. Compatible với Splunk HEC (`event` field wrapper) và Elastic ingest (`@timestamp` field).

Fire-and-forget với `console.error` on fail (tương tự audit delivery pattern từ middleware).

### D2.2 — Signed CSV Export

**File:** `src/lib/control-plane-events.ts` — update `exportAuditEventsToCsv()`

Thêm HMAC-SHA256 signature trailer ở cuối CSV:

```
# CVF-AUDIT-SIGNATURE: hmac-sha256:<hex>
# CVF-AUDIT-SIGNED-AT: 2026-04-18T00:00:00.000Z
# CVF-AUDIT-RECORD-COUNT: 42
```

Key: `CVF_AUDIT_SIGNING_KEY` env var. Nếu missing → export CSV nhưng không có signature, thêm warning header `# WARNING: UNSIGNED EXPORT`.

**File mới:** `tools/verify-audit-csv.ts` — CLI script cho CISO verify CSV:

```bash
npx ts-node tools/verify-audit-csv.ts --file cvf-audit-log.csv --key <signing-key>
```

### D2.3 — Break-Glass Procedure

**Document:** `docs/guides/CVF_BREAK_GLASS_PROCEDURE.md`

Nội dung: ai có quyền, điều kiện nào kích hoạt, procedure step-by-step, post-incident review requirements.

**Code mechanism:**

- `CVF_BREAK_GLASS_TOKEN` env var. Nếu set, token này có thể bypass `requireAdminSession()` một lần.
- **File:** `src/lib/admin-session.ts` — thêm break-glass path:

```ts
const breakGlassToken = request.headers.get('x-cvf-break-glass');
if (breakGlassToken && breakGlassToken === process.env.CVF_BREAK_GLASS_TOKEN) {
  await appendAuditEvent({
    eventType: 'BREAK_GLASS_USED',
    actorId: 'break-glass',
    actorRole: 'owner',
    targetResource,
    action: 'EMERGENCY_ACCESS',
    riskLevel: 'R3',
    outcome: 'GRANTED',
  });
  // Rotate token hint — actual rotation requires ops action
  console.error('[CVF BREAK GLASS USED] Rotate CVF_BREAK_GLASS_TOKEN immediately.');
  return BREAK_GLASS_SESSION;
}
```

- Emit `BreakGlassUsed` audit event với `riskLevel: 'R3'`.
- Log error tới stderr — alert on-call.
- Token rotation: manual ops action sau mỗi lần dùng (document trong procedure).

### D2.4 — Admin Impersonation / "View as User"

**Scope:** Owner only (không phải Admin).

**File mới:** `src/app/admin/impersonate/page.tsx`
**File mới:** `src/app/api/admin/impersonate/route.ts`

Flow:

1. Owner chọn userId từ `/admin/impersonate`.
2. POST `/api/admin/impersonate` → tạo `ImpersonationSession { realActorId, impersonatedUserId, startedAt, expiresAt: +1h }` trong store.
3. Mọi action trong session impersonation emit audit event với `payload: { impersonatedBy: realActorId }`.
4. Header `X-CVF-Impersonation-Active: true` hiển thị banner warning trong UI.
5. POST `/api/admin/impersonate/end` → kết thúc session, emit `ImpersonationEnded` event.

**Constraint:** Không thể impersonate Owner khác. Không thể impersonate trong break-glass session.

### D2 Acceptance Gate

- SIEM webhook nhận event khi admin action xảy ra.
- CSV export có signature trailer. `verify-audit-csv.ts` pass với đúng key, fail với sai key.
- Break-glass: request với valid token → access + `BREAK_GLASS_USED` event emitted + stderr log.
- Impersonation: Owner có `/admin/impersonate`; Admin không có; audit events emit với impersonation metadata.
- `CVF_BREAK_GLASS_PROCEDURE.md` tồn tại và có đủ 3 sections: conditions, procedure, post-incident.

---

## Cross-cutting Requirements (áp dụng mọi phase C + D)

| Yêu cầu | Chi tiết |
|---|---|
| **GC-023 pre-flight** | Trước mỗi file mới: check line count. Tách component sớm nếu có nguy cơ vượt threshold |
| **Audit emit** | Mọi write action phải emit `UnifiedAuditEvent` với `evidenceClass: 'FULL'` |
| **Role check** | Mọi admin API route phải gọi `canAccessAdmin(session.role)` |
| **Append-only** | Không delete/update records trong `control-plane-events.ts` store — chỉ append |
| **Test gate** | `npm run test` + `npm run lint` (max-warnings=0) pass trước mỗi merge |
| **Rollback path** | Mọi R2+ action phải có revoke/undo endpoint (append `*Revoked` event) |

---

## Timeline tổng hợp Phase C

```
Ngày 1–3   : C0 (Alignment Hotfix) — GATE bắt buộc
Ngày 4–7   : C1 (Policy Substrate) — policy types + read adapter
Ngày 8–12  : C2 (Quota Engine) — soft/hard cap + override
Ngày 13–17 : C3 (Tool Registry Actions) — dynamic + whitelist/blacklist
Ngày 18–21 : C4 (Approvals Expansion) — payload view + timeout + audit
Ngày 22–31 : D1 (Egress Safety) — DLP filter + RAG partitioning + Admin Panel
Ngày 32–39 : D2 (Enterprise Hardening) — SIEM + Signed CSV + Break-glass + Impersonation
```

**Tổng C + D: ~39 ngày (~8 tuần)**. Đây là toàn bộ scope còn lại của Enterprise Admin Console.

---

## Governance Audit Trail

| Tài liệu | Path | Vai trò |
|---|---|---|
| Roadmap gốc V1 | `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_2026-04-18.md` | Bản gốc ban đầu |
| Phản biện gốc | `docs/reviews/CVF_ENTERPRISE_ADMIN_ROADMAP_CRITICAL_REVIEW_2026-04-17.md` | Critical review V1 |
| Roadmap V2 | `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_V2_2026-04-17.md` | Final roadmap sau review |
| Implementation review | `docs/reviews/CVF_ENTERPRISE_ADMIN_PHASE0AB_IMPLEMENTATION_REVIEW_2026-04-18.md` | Audit Phase 0+A+B |
| Phase C+D detail (file này) | `docs/roadmaps/CVF_ENTERPRISE_ADMIN_ROADMAP_V2_1_PHASE_C_2026-04-18.md` | Spec Phase C0–C4 + D1–D2 |
