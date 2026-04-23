# CVF W118-T1 Unified Persistent Knowledge Store + Minimal Audit Roadmap

> Date: 2026-04-23
> Status: PLANNED
> Memory class: SUMMARY_RECORD
> Scope class: ENTERPRISE KNOWLEDGE RUNTIME / HARDENING
> Predecessor: W117-T1 CLOSED DELIVERED 2026-04-23
> Authorization: docs/baselines/CVF_GC018_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_AUTHORIZATION_2026-04-23.md
> Wave ID: W118

---

## 0. Problem Statement

W117-T1 closed the D1.4b gap (writable store + admin CRUD + Wave 2 live regression). Three residual gaps remain:

**Gap 1 — Dual code paths not unified:**
`knowledge-retrieval.ts:getEffectiveCollections()` merges two separate sources at query time:

```ts
const allCollections = [
  ...knowledgeStore.getCollections(),         // W117 admin CRUD
  ...Array.from(_runtimeCollections.values()), // W116 downstream ingest
];
```

`_runtimeCollections` is a raw `Map` in `knowledge-retrieval.ts`, not routed through the `KnowledgeStore` interface. Two mutation surfaces exist. Cannot inspect all live collections through a single API.

**Gap 2 — Admin collections not persistent:**
`InProcessKnowledgeStore` is a pure in-memory `Map`. Server restart clears all admin-added collections and chunks. The seeded `KNOWLEDGE_COLLECTIONS` re-appear on cold start, but anything the admin added via API is gone.

**Gap 3 — No audit trail for knowledge mutations:**
`POST/DELETE` to `/api/admin/knowledge/**` mutate the store with no audit record. No timestamp, no actor, no event log.

---

## 1. Goal

> Single `KnowledgeStore` interface handles both admin CRUD (persistent) and runtime ingest (ephemeral). Admin-added collections survive server restarts via a local file-backed JSON adapter. All mutations produce an append-only audit entry readable via API. Wave 2 live tests continue to pass.

---

## 2. Architecture Boundary

### Allowed

- `src/lib/knowledge-store.ts` — extend interface + add `PersistentKnowledgeStore` implementation
- `src/lib/knowledge-retrieval.ts` — remove `_runtimeCollections` Map; route `registerRuntimeCollection` through `KnowledgeStore`
- `src/app/api/knowledge/ingest/route.ts` — call `knowledgeStore.registerEphemeral()` instead of `_runtimeCollections.set()`
- New `src/app/api/admin/knowledge/audit/route.ts` — GET endpoint returning audit log
- `.data/knowledge-store.json` — gitignored local persistence file; created on first mutation

### Not Allowed

- External DB (PostgreSQL, Redis, MongoDB, etc.)
- Embedding APIs or semantic/vector search
- Changes to `scopeAllowsCollection` or RBAC/session logic
- Changes to `getKnowledgeCollectionScopes` (policy-reader scope overrides remain separate)
- Persisting ephemeral (W116 downstream ingest) collections to disk
- Audit log mutations via API (read-only)
- Fixing the 3 pre-existing DeepSeek test failures (separate concern)

---

## 3. Current State

```
knowledge-retrieval.ts
  ├── _runtimeCollections: Map<string, KnowledgeCollectionDefinition>   ← W116 (remove)
  ├── knowledgeStore: InProcessKnowledgeStore                           ← W117
  └── getEffectiveCollections()
        → [...knowledgeStore.getCollections(), ..._runtimeCollections]  ← simplify to one call
```

After W118:

```
knowledge-retrieval.ts
  └── knowledgeStore: UnifiedKnowledgeStore
        → getCollections()          returns persistent + ephemeral
        → registerEphemeral()       replaces _runtimeCollections.set()
        → (file-backed for persistent collections only)

getEffectiveCollections()
  → knowledgeStore.getCollections()   ← single call, no spread
```

---

## 4. Checkpoints

### CP1 — Knowledge Store Unification

**Deliver:**

Extend `KnowledgeStore` interface with:

```ts
interface KnowledgeStore {
  // existing methods (unchanged)
  getCollections(): KnowledgeCollectionDefinition[];
  getCollection(id: string): KnowledgeCollectionDefinition | undefined;
  upsertCollection(def: KnowledgeCollectionDefinition): void;
  deleteCollection(id: string): void;
  addChunk(collectionId: string, chunk: KnowledgeChunk): void;
  deleteChunk(collectionId: string, chunkId: string): void;
  // new
  registerEphemeral(collection: KnowledgeCollectionDefinition): void;
  getEphemeralCollectionIds(): string[];
}
```

- `registerEphemeral` stores collection in a separate internal `Map` (never persisted).
- `getCollections()` returns `[...persistentCollections, ...ephemeralCollections]` — single merged view.
- `src/lib/knowledge-retrieval.ts`: remove `_runtimeCollections` Map; remove `registerRuntimeCollection` function; replace internal usages with `knowledgeStore.registerEphemeral()` and `knowledgeStore.getEphemeralCollectionIds()`.
- Keep `getRegisteredCollectionIds` as a re-export shim: `export const getRegisteredCollectionIds = () => knowledgeStore.getEphemeralCollectionIds()` — this preserves W116 test compatibility without modifying the tests.
- `src/app/api/knowledge/ingest/route.ts`: call `knowledgeStore.registerEphemeral(collection)` instead of `_runtimeCollections.set()`.
- `getEffectiveCollections()` becomes a single `knowledgeStore.getCollections()` call.

**Acceptance:**

- All existing W116 ingest tests pass without modification (shim export preserves the import contract).
- All existing W117 admin CRUD tests pass without modification.
- `_runtimeCollections` reference does not appear in any non-test file.
- `getEffectiveCollections()` body no longer contains a spread merge.

---

### CP2 — JSON Persistence Adapter

**Deliver:**

New `FileBackedKnowledgeStore` class implementing `KnowledgeStore`:

- Extract `KNOWLEDGE_COLLECTIONS` static array to a new file `src/lib/knowledge-seed.ts` (no imports from `knowledge-store.ts` or `knowledge-retrieval.ts` — pure data). This avoids a circular import: `knowledge-store.ts` → `knowledge-retrieval.ts` → `knowledge-store.ts`.
- On construction: reads `KNOWLEDGE_STORE_PATH` (default `.data/knowledge-store.json`, gitignored) if it exists; if file does not exist, seeds from `knowledge-seed.ts` and writes the seed file.
- `upsertCollection`, `deleteCollection`, `addChunk`, `deleteChunk`: mutate in-memory Map then atomically write to file (write to `.tmp` then rename to avoid partial writes).
- `registerEphemeral` and `getEphemeralCollectionIds`: in-memory only — never written to file.
- `src/lib/knowledge-store.ts`: export `FileBackedKnowledgeStore` and swap `knowledgeStore` singleton to use it (configurable via `KNOWLEDGE_STORE_PATH` env var; falls back to in-memory if `NODE_ENV === 'test'`).

**Acceptance:**

- Unit test: mutate store → write confirmed → create new instance from same path → data matches.
- Unit test: ephemeral collections not present after reload.
- Unit test: seed file written if missing.
- Existing unit/integration tests unaffected (test environment uses in-memory path).

---

### CP3 — Minimal Audit Trail

**Deliver:**

In `KnowledgeStore` interface, add:

```ts
interface KnowledgeStoreAuditEntry {
  ts: string;            // ISO timestamp
  action: 'upsert_collection' | 'delete_collection' | 'add_chunk' | 'delete_chunk' | 'register_ephemeral';
  collectionId: string;
  chunkId?: string;
  source: 'admin_api' | 'runtime_ingest' | 'seed';
}

interface KnowledgeStore {
  // ...existing methods
  getAuditLog(): KnowledgeStoreAuditEntry[];
}
```

- Every mutation appends an entry (in-memory log, not persisted to file — cleared on server restart by design; see §6 Non-Goals).
- New `GET /api/admin/knowledge/audit` route — requires admin session; returns `{ entries: KnowledgeStoreAuditEntry[] }`.
- Seed operation does NOT produce audit entries (seed is infrastructure bootstrap, not an admin action).

**Acceptance:**

- Unit test: in a fresh store instance (seed disabled, zero entries), 3 explicit mutations → `getAuditLog()` returns exactly 3 entries with correct `action`/`collectionId`.
- Unit test: `getAuditLog()` does NOT include seed-phase entries (seed is not audited).
- Route test: `GET /api/admin/knowledge/audit` returns `200` with entries for admin session; `403` for non-admin.

---

### CP4 — Regression Evidence

**Deliver:**

Integration test `w118-cp4-regression.test.ts`:

1. **Persistence test**: add collection + chunk via store → serialize → deserialize → query → chunk is present.
2. **Ephemeral isolation test**: `registerEphemeral()` → serialize → deserialize → ephemeral collection NOT present.
3. **Downstream ingest path**: call `registerEphemeral()` → `queryKnowledgeChunks` → chunk returned; scope filter still applies.
4. **Audit chain test**: in a fresh store instance (seed disabled), 2 explicit admin mutations (e.g. `upsertCollection` + `addChunk`) → `getAuditLog().length === 2`; each entry has correct `action`, `collectionId`, and ISO `ts`.
5. **Wave 2 live regression**: `execute/route.retrieval.live.test.ts` 4/4 pass unchanged.

Release gate: `python scripts/run_cvf_release_gate_bundle.py --json` PASS.

Assessment: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/docs/assessments/CVF_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_ASSESSMENT_2026-04-23.md`

---

## 5. Verification Commands

```bash
# Unit + integration tests
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx vitest run src/lib/knowledge-store.test.ts src/app/api/knowledge/ingest/ src/app/api/admin/knowledge/

# Full live regression
npx vitest run src/app/api/execute/route.retrieval.live.test.ts

# Release gate
python scripts/run_cvf_release_gate_bundle.py --json
```

---

## 6. Non-Goals

- External database of any kind
- Vector/semantic search or embedding
- Persisting ephemeral (W116 runtime ingest) collections
- Persistent audit log (audit log is in-memory per server session)
- Fixing pre-existing DeepSeek test failures
- Knowledge versioning or diff/rollback

---

## 7. Exit Criteria

W118-T1 closes when:

- `_runtimeCollections` Map is removed from `knowledge-retrieval.ts`; single `KnowledgeStore` interface handles both persistent and ephemeral collections.
- Admin-added collections survive a simulated restart (persistence test passes).
- Ephemeral (W116) collections are provably not persisted (ephemeral isolation test passes).
- Audit log records every mutation with timestamp, action, and source.
- Wave 2 live tests 4/4 pass.
- Full release gate PASS.
- D1.4b note remains retired (no regressions).
