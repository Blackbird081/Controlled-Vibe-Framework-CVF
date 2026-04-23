# CVF W116-T1 — Downstream Knowledge Pipeline — Delivery Assessment

**Date:** 2026-04-23
**Class:** PRODUCT_VALUE / GOVERNED_RUNTIME_ENHANCEMENT
**Tranche:** W116-T1
**Status:** DELIVERED — all 5 checkpoints closed

---

## Summary

W116-T1 implements the Downstream Knowledge Pipeline — allowing governed AI runs to inject
project-specific context from a downstream workspace's `knowledge/` folder.

The pipeline is fully unit-tested (16 targeted tests, 16/16 pass) and fully integrated with
the existing `/api/execute` governance path without regression.

---

## Checkpoint Delivery Record

### CP1 — Workspace Knowledge Folder Convention

| Item | Status |
|---|---|
| `.cvf/manifest.json` `knowledgePath` field | Added in `scripts/new-cvf-workspace.ps1` |
| `knowledge/` folder + README.md stub created by bootstrap | Done |
| Doctor script check-12: warn-only when `knowledgePath` declared but folder missing | Done in `scripts/check_cvf_workspace_agent_enforcement.ps1` |
| WARN/PASS/FAIL colour in doctor print loop | Fixed |
| AGENTS template updated with knowledge folder first-read item | Done |

### CP2 — File Ingestion Script

| Item | Status |
|---|---|
| `scripts/ingest_cvf_downstream_knowledge.ps1` | Created |
| Reads all `.md` files from `KnowledgePath` | Done |
| Splits into ≤400-word paragraph-level chunks | Done |
| Keyword extraction (top-20 by frequency, ≥4 chars) | Done |
| Outputs `knowledge/_index.json` with `collectionId`, `chunks`, metadata | Done |
| Prints next-step instructions pointing to `/api/knowledge/ingest` | Done |

### CP3 — POST /api/knowledge/ingest Endpoint

| Item | Status |
|---|---|
| Route: `src/app/api/knowledge/ingest/route.ts` | Created |
| Input validation: `collectionId` required, `chunks` non-empty, each chunk typed | Done |
| `registerRuntimeCollection` export added to `knowledge-retrieval.ts` | Done |
| `getRegisteredCollectionIds` export for test introspection | Done |
| Session-scoped in-process store (`_runtimeCollections` Map) | Done |
| Returns `{ accepted: N, collectionId }` | Done |
| Unit tests: `route.test.ts` — 9/9 pass | Done |

### CP4 — Execute-path Integration + knowledgeCollectionId + UI

| Item | Status |
|---|---|
| `collectionId` filter added to `queryKnowledgeChunks` | Done |
| `getEffectiveCollections` includes runtime collections | Done |
| `knowledgeCollectionId` field added to `ExecutionRequest` type | Done |
| `/api/execute` threads `knowledgeCollectionId` into retrieval | Done |
| Knowledge Governance page: "4. Load Project Knowledge" tab | Done |
| Tab: collection ID input, JSON paste area, Load button, result card | Done |

### CP5 — Live Evidence: Positive Delta

| Assertion | Test | Result |
|---|---|---|
| BASELINE: project-specific query on empty collection returns 0 chunks | `w116-cp5-delta.test.ts` | PASS |
| INGEST: POST returns `{ accepted: 5 }` | `w116-cp5-delta.test.ts` | PASS |
| DELTA: after ingest, same query returns `chunkCount > 0` | `w116-cp5-delta.test.ts` | PASS |
| DELTA: top chunk score > 0 for high-relevance query | `w116-cp5-delta.test.ts` | PASS |
| DELTA: domain-specific sub-query (alert rules) retrieves correct chunk | `w116-cp5-delta.test.ts` | PASS |
| DELTA: observability query retrieves Kubernetes/Prometheus chunk | `w116-cp5-delta.test.ts` | PASS |
| NON-REGRESSION: global query without collectionId returns results | `w116-cp5-delta.test.ts` | PASS |

Total CP5 evidence tests: 7/7 pass

---

## Test Delta

| Suite | Tests | Pass |
|---|---|---|
| `route.test.ts` (CP3 unit) | 9 | 9 |
| `w116-cp5-delta.test.ts` (CP5 delta) | 7 | 7 |
| **Total new** | **16** | **16** |

Full suite baseline (excluding 3 pre-existing DeepSeek live API failures): **2205 + 16 = 2221 pass**.
Pre-existing failures are in `route.front-door-rewrite.deepseek.live.test.ts` — live provider content
mismatch, not caused by W116-T1 changes.

---

## Files Changed

### New files
- `scripts/ingest_cvf_downstream_knowledge.ps1` — CP2 ingestion script
- `src/app/api/knowledge/ingest/route.ts` — CP3 ingest endpoint
- `src/app/api/knowledge/ingest/route.test.ts` — CP3 unit tests (9 tests)
- `src/app/api/knowledge/ingest/w116-cp5-delta.test.ts` — CP5 delta evidence (7 tests)

### Modified files
- `scripts/new-cvf-workspace.ps1` — CP1: `knowledgePath` manifest field + folder creation
- `scripts/check_cvf_workspace_agent_enforcement.ps1` — CP1: check-12 warn-only + colour fix
- `governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md` — CP1: knowledge folder in first-read list
- `src/lib/knowledge-retrieval.ts` — CP3+CP4: `_runtimeCollections`, `registerRuntimeCollection`, `collectionId` filter
- `src/lib/ai/types.ts` — CP4: `knowledgeCollectionId` field on `ExecutionRequest`
- `src/app/api/execute/route.ts` — CP4: thread `knowledgeCollectionId` into retrieval
- `src/app/(dashboard)/governance/knowledge/page.tsx` — CP4: "Load Project Knowledge" tab

---

## Architecture Boundary Respected

- Runtime collection store is **session-scoped in-process** — no file writes, no DB changes.
- Existing global collections and tenant-scoped collections are **unaffected**.
- Non-regression confirmed: global queries without `collectionId` continue to use all accessible collections.
- `knowledgeCollectionId` on execute request is **optional** — backwards-compatible.

---

## Exit Criteria Status

| Criterion | Met |
|---|---|
| `knowledge/` folder convention in bootstrap + manifest | YES |
| Ingestion script produces `_index.json` with typed chunks | YES |
| `POST /api/knowledge/ingest` returns `{ accepted: N }` | YES |
| `queryKnowledgeChunks` with `collectionId` returns downstream chunks | YES |
| `knowledgeInjection.chunkCount > 0` possible via `knowledgeCollectionId` | YES |
| Positive delta evidence: baseline 0 → post-ingest > 0 | YES |
| Non-regression: global path unchanged | YES |
| All new tests pass | YES (16/16) |
