# CVF GC-018 Authorization — W118-T1 Unified Persistent Knowledge Store + Minimal Audit

> Date: 2026-04-23
> Memory class: SUMMARY_RECORD
> Authorization class: GC-018 (Tranche Authorization)
> Wave: W118-T1
> Predecessor: W117-T1 CLOSED DELIVERED 2026-04-23

---

## 1. Problem Statement

W117-T1 delivered a writable in-process knowledge store for admin CRUD operations and left two deferred gaps:

**Gap 1 — Dual code paths (W116 + W117 not unified):**
`knowledge-retrieval.ts` currently maintains two separate collections sources merged at query time:
- `_runtimeCollections` Map — W116 downstream project ingest, session-scoped, ephemeral
- `knowledgeStore` (`InProcessKnowledgeStore`) — W117 admin CRUD, in-process Map

Both feed `getEffectiveCollections()` via a `[...store, ...runtime]` spread. This works but creates a split identity: two code paths, two mutation surfaces, two separate test concerns. A caller cannot inspect all live collections through a single interface.

**Gap 2 — No persistence (admin collections lost on restart):**
`InProcessKnowledgeStore` is a pure in-memory `Map`. Any collection or chunk added via the admin API is lost when the Next.js server restarts. This makes admin-added knowledge unreliable in practice.

**Gap 3 — No audit trail for knowledge mutations:**
Admin `POST/DELETE` calls on `/api/admin/knowledge/**` mutate the store but write no audit evidence. There is no record of who added or deleted a collection or chunk, or when.

---

## 2. Authorization Conditions

This tranche is authorized under the following conditions:

1. W117-T1 is CLOSED DELIVERED — the writable store and admin CRUD API exist and are tested.
2. The unification must preserve the semantic distinction between *persistent* (admin CRUD) and *ephemeral* (W116 downstream ingest) collections. Ephemeral collections must never be written to the persistence file.
3. The persistence adapter must use only the local filesystem (`.data/knowledge-store.json`, gitignored). No external DB, no cloud storage, no embedding service.
4. The audit trail is append-only and in-process only (no external SIEM in this wave). It may be exported as an API but must not gate or block existing mutations.
5. Scope enforcement logic (`scopeAllowsCollection`) must remain untouched.
6. Wave 2 live tests (`execute/route.retrieval.live.test.ts` 4/4) must continue to pass after all changes.
7. Full release gate (`python scripts/run_cvf_release_gate_bundle.py --json`) must PASS at CP4.

---

## 3. Authorized Scope

| CP | Deliverable | Files |
|----|-------------|-------|
| CP1 | Knowledge Store Unification | `knowledge-store.ts`, `knowledge-retrieval.ts`, `api/knowledge/ingest/route.ts` |
| CP2 | JSON Persistence Adapter | `knowledge-store.ts` (new `PersistentKnowledgeStore`) |
| CP3 | Minimal Audit Trail | `knowledge-store.ts` (audit log), new `api/admin/knowledge/audit/route.ts` |
| CP4 | Regression Evidence | new test files, Wave 2 live regression |

---

## 4. Boundary Constraints (Binding)

- No external database (PostgreSQL, Redis, MongoDB, etc.)
- No embedding APIs or vector search
- No changes to `scopeAllowsCollection`, RBAC roles, or session auth
- Ephemeral (W116 runtime ingest) collections are NOT persisted to disk
- Audit log is read-only at the API surface — it cannot be cleared or modified via API
- This tranche does NOT fix the 3 pre-existing DeepSeek test failures (separate concern)
- No changes to `getKnowledgeCollectionScopes` (policy-reader scope overrides remain separate)

---

## 5. Authorization Decision

**AUTHORIZED** — W118-T1 may proceed under the conditions and boundary constraints above.

Implementation roadmap: `docs/roadmaps/CVF_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_ROADMAP_2026-04-23.md`
