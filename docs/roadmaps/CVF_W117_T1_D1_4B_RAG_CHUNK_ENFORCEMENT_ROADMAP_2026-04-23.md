# CVF W117-T1 D1.4b RAG Chunk Enforcement Roadmap

> Date: 2026-04-23
> Status: PLANNED
> Memory class: SUMMARY_RECORD
> Scope class: ENTERPRISE KNOWLEDGE RUNTIME / HARDENING
> Predecessor: Enterprise Admin Phase D (CLOSED), Wave 1 Retrieval Partitioning (CLOSED), W116-T1 (Downstream Knowledge Pipeline — prerequisite)
> Wave ID: W117
> Deferred from: CVF_ENTERPRISE_ADMIN_RETRIEVAL_PARTITIONING_ROADMAP_2026-04-18.md

## 0. Problem Statement

Enterprise Admin Phase D closed with a deliberate gap:

> D1.4b (RAG chunk enforcement) intentionally deferred — no real retrieval adapter exists; plumbing (`orgId`/`teamId` `_scope` param) is in place.

The current `knowledge-retrieval.ts` stores all knowledge collections in a hardcoded `KNOWLEDGE_COLLECTIONS` constant in source code. This means:
- Admins cannot add, update, or delete knowledge chunks without modifying source and redeploying.
- The scope enforcement logic (orgId/teamId filtering) works correctly, but it operates on data that cannot change at runtime.
- The gap between "scope enforcement proven" and "scope enforcement operational" is a writable knowledge store.

## 1. Goal

> Admin can add, update, and delete knowledge collections and chunks through the Enterprise Admin UI without touching source code. The existing org/team scope enforcement continues to operate on this writable store. Live tests confirm the enforcement is not broken.

## 2. Architecture Boundary

Allowed changes:
- `src/lib/knowledge-retrieval.ts` — replace hardcoded constant with writable store interface
- New `src/lib/knowledge-store.ts` — writable in-process store (file-backed JSON is acceptable for this wave; no production DB required)
- New API routes under `src/app/api/admin/knowledge/` — CRUD for collections and chunks
- `src/components/admin/AdminKnowledgePartitioningControls.tsx` — Add/Edit/Delete UI
- Existing Wave 2 live tests (`execute/route.retrieval.live.test.ts`) must continue to pass

Not allowed:
- External vector stores, embedding APIs, semantic search
- Changes to org/team scope enforcement logic (it already works — preserve it)
- Changes to session/auth handling or RBAC roles
- Changes to downstream workspace knowledge (that is W116)

## 3. Current State

From `src/lib/knowledge-retrieval.ts`:
```ts
const KNOWLEDGE_COLLECTIONS: KnowledgeCollectionDefinition[] = [
  { id: 'cvf-global-governance', orgId: null, teamId: null, chunks: [...] },
  { id: 'cvf-exec-playbook',     orgId: 'org_cvf', teamId: 'team_exec', chunks: [...] },
  { id: 'cvf-engineering-runbooks', orgId: 'org_cvf', teamId: 'team_eng', chunks: [...] },
  // ...
];
```

Scope enforcement (`queryKnowledgeChunks`) already filters by `orgId`/`teamId`. The Wave 2 live tests prove this enforcement works. The only gap is that the data source is static.

From `src/app/api/admin/tool-registry/knowledge-scope/route.ts`: scope *assignments* can already be persisted (POST writes to policy events). But the chunk *content* itself is not writable.

## 4. Checkpoints

### CP1: Writable Knowledge Store

Deliver:
- New `src/lib/knowledge-store.ts` with interface:
  ```ts
  interface KnowledgeStore {
    getCollections(): KnowledgeCollectionDefinition[];
    getCollection(id: string): KnowledgeCollectionDefinition | undefined;
    upsertCollection(def: KnowledgeCollectionDefinition): void;
    deleteCollection(id: string): void;
    addChunk(collectionId: string, chunk: KnowledgeChunk): void;
    deleteChunk(collectionId: string, chunkId: string): void;
  }
  ```
- Implementation: in-process `Map<string, KnowledgeCollectionDefinition>` seeded from a JSON file (`knowledge-store.json` in a `.data/` directory gitignored at root).
- If `.data/knowledge-store.json` does not exist at startup, seed from the existing hardcoded `KNOWLEDGE_COLLECTIONS` constant and write the seed file.
- `knowledge-retrieval.ts` calls `knowledgeStore.getCollections()` instead of reading the constant.

Acceptance:
- Deleting a collection from the store removes it from query results.
- Adding a new collection makes its chunks available for retrieval.
- Existing Wave 2 unit tests pass (they may need minimal updates to use the store interface instead of the constant).

### CP2: Admin CRUD API

Deliver:
- `POST /api/admin/knowledge/collections` — create collection `{ id, name, description, orgId, teamId }`
- `PUT /api/admin/knowledge/collections/[id]` — update name/description/scope
- `DELETE /api/admin/knowledge/collections/[id]` — delete collection + all its chunks
- `POST /api/admin/knowledge/collections/[id]/chunks` — add chunk `{ id, content, keywords }`
- `DELETE /api/admin/knowledge/collections/[id]/chunks/[chunkId]` — delete chunk

All routes require admin role (existing RBAC via `getServerSession` / admin role check).

Acceptance:
- POST → GET (via `getCollections()`) shows the new collection.
- DELETE → GET confirms removal.
- All routes return `403` for non-admin sessions.
- Unit tests cover each route.

### CP3: Admin UI Update

Deliver:
- `AdminKnowledgePartitioningControls.tsx` gains:
  - "Add Collection" form (name, description, orgId, teamId scope)
  - Per-collection "Add Chunk" form (content, keywords)
  - Delete button per collection and per chunk
  - Live list refresh after each mutation
- Existing scope assignment controls are preserved.

Acceptance:
- Admin can add a new collection with 2 chunks via UI.
- Admin can delete a chunk without deleting the collection.
- `tsc --noEmit + lint + build` clean after changes.
- Component test covers: add collection renders, delete collection renders.

### CP4: Execute-Path Uses Writable Store

Deliver:
- `/api/execute` knowledge retrieval path reads from `knowledgeStore` (not from hardcoded constant).
- A collection added via CP2 API is retrievable via `/api/execute` in the same server session.
- No raw `knowledgeContext` bypass from request body without tenant filtering.

Acceptance:
- Integration test: POST to `/api/admin/knowledge/collections` → POST to `/api/execute` → response includes injected chunk from new collection.
- Existing execute tests pass.
- `knowledgeInjection` response field still populated.

### CP5: Live Test Regression

Deliver:
- Re-run the Wave 2 live Playwright tests (`execute/route.retrieval.live.test.ts`):
  - W96-L-001: exec team session → exec-playbook chunk injected
  - W96-L-002: engineering team session → engineering-runbooks chunk injected
  - W96-L-003: org_a session drops org_b chunk (scope filter audited)
  - W96-L-004: global collection available to all
- All 4 must pass against the new writable store.
- Update the store seed data (`knowledge-store.json`) to match the existing test fixtures so the tests pass without code changes.
- Release gate PASS after CP5.

Acceptance:
- `4/4` Wave 2 live tests pass on Alibaba lane.
- Full release gate: `python scripts/run_cvf_release_gate_bundle.py --json` PASS.
- Assessment filed at `docs/assessments/CVF_W117_T1_D1_4B_RAG_CHUNK_ENFORCEMENT_ASSESSMENT_2026-04-23.md`.

## 5. Verification Rules

```bash
# Unit + integration tests + lint + build
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run test:run
npm run lint
npm run build

# Live regression (requires DASHSCOPE_API_KEY / ALIBABA_API_KEY)
npx playwright test tests/e2e/ --reporter=line
python scripts/run_cvf_release_gate_bundle.py --json
```

## 6. Non-Goals

- External database (PostgreSQL, MongoDB, Redis) — writable JSON file is sufficient for this wave.
- Vector embeddings or semantic search.
- Knowledge versioning or audit log of chunk changes (future concern).
- Importing chunks from downstream project knowledge files (that is W116).
- Cross-instance store synchronization (single-process deployment is the current target).

## 7. Dependency on W116

W117 can be developed independently of W116, but they share the knowledge injection path. The recommended sequencing is:

1. **W116 first**: prove file-based downstream knowledge ingestion into the session store.
2. **W117 second**: make the store writable and persistent, replacing the hardcoded constant.

If W116 is skipped or delayed, W117 can still proceed — it does not depend on the W116 ingestion script.

## 8. Exit Criteria

W117 closes when:
- Hardcoded `KNOWLEDGE_COLLECTIONS` constant is replaced by the writable store.
- Admin can add/delete collections and chunks via API and UI.
- Execute path reads from the writable store.
- Wave 2 live tests (4/4) still pass.
- Full release gate PASS.
- The "D1.4b intentionally deferred" note in `AGENT_HANDOFF.md` is retired.
