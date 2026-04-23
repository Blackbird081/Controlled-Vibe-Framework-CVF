<!-- Memory class: SUMMARY_RECORD -->

# GC-026 Progress Tracker Sync Note

- Workline: W118-T1 — Unified Persistent Knowledge Store + Minimal Audit
- Trigger source: W118-T1 CLOSED DELIVERED 2026-04-23
- Previous pointer: W117-T1 — D1.4b RAG Chunk Enforcement (CLOSED 2026-04-23)
- New pointer: W118-T1 — Unified Persistent Knowledge Store + Minimal Audit (CLOSED 2026-04-23)
- Last canonical closure: W118-T1
- Current active tranche: W119-T1 PLANNED by fresh GC-018 after W118 closure.
- Next governed move: Implement W119-T1 non-coder adoption proof and evidence UX within the bounded GC-018 authorization.
- Canonical tracker updated: 2026-04-23

---

## W118-T1 Closure Summary

**Class:** PRODUCT_VALUE / GOVERNED_RUNTIME_ENHANCEMENT  
**Fast Lane (GC-021)**  
**Roadmap:** `docs/roadmaps/CVF_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_ROADMAP_2026-04-23.md`  
**GC-018:** `docs/baselines/CVF_GC018_W118_T1_UNIFIED_PERSISTENT_KNOWLEDGE_STORE_AUTHORIZATION_2026-04-23.md`

### Checkpoints Delivered

**CP1 — Knowledge Store Unification**
- `KNOWLEDGE_COLLECTIONS` seed data extracted to `src/lib/knowledge-seed.ts` (no runtime imports — breaks circular dependency risk)
- `KnowledgeChunk` + `KnowledgeCollectionDefinition` types moved to `src/lib/knowledge-store.ts`; re-exported from `knowledge-retrieval.ts` for backward compatibility
- `InProcessKnowledgeStore` extended: `registerEphemeral()`, `getEphemeralCollectionIds()`, `getAuditLog()`
- `_runtimeCollections` Map removed from `knowledge-retrieval.ts`
- `registerRuntimeCollection()` removed; `getRegisteredCollectionIds()` retained as shim re-export → W116 ingest tests pass without modification
- `getEffectiveCollections()` simplified to single `knowledgeStore.getCollections()` call
- `ingest/route.ts` uses `knowledgeStore.registerEphemeral()` instead of `registerRuntimeCollection()`

**CP2 — JSON Persistence Adapter**
- `FileBackedKnowledgeStore extends InProcessKnowledgeStore` — constructor loads from `.data/knowledge-store.json` or seeds from `KNOWLEDGE_COLLECTIONS` and persists; mutation overrides call `_persist()` (write-to-`.tmp` + `renameSync`)
- Ephemeral collections (`_ephemeral` Map) are excluded from file serialization
- Singleton factory: `NODE_ENV === 'test'` → `InProcessKnowledgeStore`; else → `FileBackedKnowledgeStore(path)`
- `_storeAutoSeeds` guard in `knowledge-retrieval.ts` prevents `ensureStoreSeeded()` from double-seeding the file-backed store in production
- `.data/` is already gitignored

**CP3 — Minimal Audit Trail**
- `KnowledgeStoreAuditEntry` interface: `{ ts, action, collectionId, chunkId?, source }`
- Append-only `_auditLog` in `InProcessKnowledgeStore`; all CRUD mutations audited (`source: admin_api`); `registerEphemeral` audited (`source: runtime_ingest`); `seed()` is NOT audited (infrastructure bootstrap)
- `GET /api/admin/knowledge/audit` route — admin session required; returns `{ entries: KnowledgeStoreAuditEntry[] }`; audit log is in-memory per server session, does not persist across restarts

**CP4 — Regression Evidence**
- `src/app/api/admin/knowledge/w118-cp4-regression.test.ts` — 11 assertions: persistence round-trip, real file I/O seed/write/reload checks, ephemeral exclusion, unified getCollections, downstream ingest queryability, scope filter on ephemeral, audit count (2 mutations = 2 entries), seed not counted, register_ephemeral source
- `src/app/api/admin/knowledge/audit/route.test.ts` — 3 assertions: empty log, mutation-populated log, 403 auth guard
- Wave 2 live regression: 4/4 pass (exec-playbook, engineering-runbooks, cross-tenant drop, global governance)
- Release gate: `python scripts/run_cvf_release_gate_bundle.py --json` → `gate_result: PASS`, all 8 checks PASS

### Test Delta

| Suite | Before W118 | After W118 | Delta |
|---|---|---|---|
| Targeted W118 regression coverage | 0 | 14 | +14 |
| Pre-existing failures | 3 | 3 | 0 |

W118 regression files: `src/app/api/admin/knowledge/audit/route.test.ts` (+3), `src/app/api/admin/knowledge/w118-cp4-regression.test.ts` (+11 after CP2 evidence hardening)

### Architecture Boundary (preserved)

- In-process store only — no external DB, no Redis, no Postgres
- File-backed persistence is single-process, `.data/` folder only
- Org/team scope enforcement unchanged (`scopeAllowsCollection` untouched)
- Ephemeral collections (W116 downstream ingest) are never persisted — session-scoped only
- Audit log is in-memory per server session — not persisted, not queryable across restarts
