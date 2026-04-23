# GC-018 Authorization — W117-T1 D1.4b RAG Chunk Enforcement

**Date:** 2026-04-23
**Memory class:** SUMMARY_RECORD
**Authorization class:** GC-018 (Continuation Candidate Authorization)
**Lane:** Fast Lane (GC-021)
**Risk tier:** R1 — additive runtime change; no auth/RBAC/guard logic touched

---

## Candidate Summary

| Field | Value |
| ----- | ----- |
| Tranche | W117-T1 |
| Title | D1.4b RAG Chunk Enforcement |
| Class | ENTERPRISE KNOWLEDGE RUNTIME / HARDENING |
| Roadmap | docs/roadmaps/CVF_W117_T1_D1_4B_RAG_CHUNK_ENFORCEMENT_ROADMAP_2026-04-23.md |
| Predecessor | W116-T1 CLOSED DELIVERED 2026-04-23 |
| Deferred from | CVF_ENTERPRISE_ADMIN_RETRIEVAL_PARTITIONING_ROADMAP_2026-04-18.md (D1.4b) |

---

## Problem Statement

The `KNOWLEDGE_COLLECTIONS` constant in `src/lib/knowledge-retrieval.ts` is hardcoded in
source. Org/team scope enforcement already works correctly (Wave 1, W96). The only remaining
gap is that the data is static — admins cannot add, update, or delete knowledge chunks
without modifying source and redeploying. This tranche makes the store writable.

---

## Authorization Conditions — All MET

| Condition | Evidence |
| --------- | -------- |
| Scope enforcement proven (Wave 1) | `execute/route.retrieval.live.test.ts` 4/4 pass |
| Knowledge injection pipeline production-ready | W101/W102 CLOSED DELIVERED |
| Downstream ingestion path proven (W116) | W116-T1 CLOSED DELIVERED 2026-04-23 |
| W116 runtime collection store de-risks in-process write | `_runtimeCollections` Map pattern validated 16/16 tests |
| No active tranche | Post-W116 posture confirmed |

---

## Scope Authorized

### CP1 — Writable KnowledgeStore
- New `src/lib/knowledge-store.ts` — in-process `Map<string, KnowledgeCollectionDefinition>`
- Seeded from existing `KNOWLEDGE_COLLECTIONS` constant at module load time
- `knowledge-retrieval.ts` reads from store instead of constant
- Interface: `getCollections / getCollection / upsertCollection / deleteCollection / addChunk / deleteChunk`

### CP2 — Admin CRUD API
- `POST /api/admin/knowledge/collections` — create collection
- `PUT /api/admin/knowledge/collections/[id]` — update scope/name/description
- `DELETE /api/admin/knowledge/collections/[id]` — delete collection + all chunks
- `POST /api/admin/knowledge/collections/[id]/chunks` — add chunk
- `DELETE /api/admin/knowledge/collections/[id]/chunks/[chunkId]` — delete chunk
- All require admin role (existing RBAC)

### CP3 — Admin UI Update
- `AdminKnowledgePartitioningControls.tsx` gains Add Collection form, Add Chunk per collection, Delete buttons
- Existing scope assignment controls preserved

### CP4 — Execute-Path Integration Test
- Confirm collection added via CP2 API is retrievable via `/api/execute` in same session
- `knowledgeInjection` field still populated

### CP5 — Wave 2 Live Regression
- Re-confirm 4/4 Wave 2 live tests pass against writable store
- Release gate PASS

---

## Boundary Constraints (Binding)

- **No external DB** — in-process Map only; no PostgreSQL/Redis/MongoDB
- **No vector embeddings or semantic search**
- **Scope enforcement logic unchanged** — `scopeAllowsCollection` logic in `knowledge-retrieval.ts` must not be modified
- **No RBAC/session/auth changes**
- **W116 downstream `_runtimeCollections` path preserved** — runtime ingest continues to work alongside writable store

---

## Authorization Decision

**AUTHORIZED** — proceed with W117-T1 CP1 through CP5.

Post-W117 posture: the "D1.4b intentionally deferred" note in `AGENT_HANDOFF.md` is retired.
No further knowledge-store work is required until a persistent-DB wave is authorized.
