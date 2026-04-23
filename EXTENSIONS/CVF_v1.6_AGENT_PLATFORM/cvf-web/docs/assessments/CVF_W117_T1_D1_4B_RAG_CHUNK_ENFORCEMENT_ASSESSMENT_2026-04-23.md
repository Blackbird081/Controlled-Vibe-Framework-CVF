# CVF W117-T1 D1.4b RAG Chunk Enforcement — Post-Delivery Assessment

> Date: 2026-04-23
> Memory class: FULL_RECORD
> Tranche: W117-T1
> Status: CLOSED DELIVERED

## 1. Delivery Summary

All 5 checkpoints delivered. D1.4b deferred note retired.

| CP | Deliverable | Tests | Result |
|----|-------------|-------|--------|
| CP1 | `InProcessKnowledgeStore` + `knowledge-retrieval.ts` seeded | 13/13 | PASS |
| CP2 | Admin CRUD API (4 routes, 5 endpoints) | 17/17 | PASS |
| CP3 | Admin UI — Add/Delete collections + chunks | build clean | PASS |
| CP4 | Execute-path integration test | 4/4 | PASS |
| CP5 | Wave 2 live regression (Alibaba) | 4/4 | PASS |

## 2. Test Delta

- New tests: **+34** (13 CP1 + 17 CP2 + 4 CP4)
- Full suite: **2246 pass / 3 pre-existing fail** (same 3 as W116 baseline)
- Pre-existing failures: `useModals.test.ts`, `providers.integration.test.ts`, `route.front-door-rewrite.deepseek.live.test.ts` — all DeepSeek/modal unrelated to W117

## 3. Architecture Boundary Compliance

| Rule | Status |
|------|--------|
| No external DB / vector store | MET — in-process Map only |
| No embedding/semantic search | MET |
| Org/team scope enforcement unchanged | MET — `scopeAllowsCollection` untouched |
| RBAC/session/auth unchanged | MET — reused `requireAdminApiSession` |
| W116 `_runtimeCollections` path preserved | MET — separate code path, not removed |

## 4. Wave 2 Live Regression Evidence

Test file: `src/app/api/execute/route.retrieval.live.test.ts`

| Test | Result | Duration |
|------|--------|----------|
| exec-playbook chunk injected via scoped retrieval | PASS | 2831ms |
| engineering-runbook chunk injected via scoped retrieval | PASS | 3885ms |
| cross-tenant: org_a drops org_b chunk — KNOWLEDGE_SCOPE_FILTER_APPLIED audited | PASS | 4317ms |
| global governance collection available to all tenant sessions | PASS | 7784ms |

## 5. Known Gaps / Deferred Items

| Gap | Severity | Notes |
|-----|----------|-------|
| Store not file-backed across server restarts | LOW | In-process Map; additions lost on server restart. Seed from `KNOWLEDGE_COLLECTIONS` re-applied on cold start. Future W118 candidate. |
| W116 `_runtimeCollections` + W117 `InProcessKnowledgeStore` are two separate code paths | LOW | No conflict; W116 path handles downstream project ingest; W117 handles admin CRUD. Unification is a future concern. |
| No chunk-level audit log | LOW | Admin mutations are session-only; no append-only audit trail. Future governance hardening candidate. |

## 6. Exit Criteria Verification

- [x] Hardcoded `KNOWLEDGE_COLLECTIONS` constant replaced by writable store (execute-path reads `knowledgeStore.getCollections()`)
- [x] Admin can add/delete collections and chunks via API
- [x] Admin UI updated with Add/Delete controls
- [x] Execute path reads from writable store (CP4 integration test proves this)
- [x] Wave 2 live tests 4/4 pass
- [x] D1.4b intentionally deferred note in `AGENT_HANDOFF.md` — RETIRED

## 7. Governance Artifacts

- GC-018: `docs/baselines/CVF_GC018_W117_T1_D1_4B_RAG_CHUNK_ENFORCEMENT_AUTHORIZATION_2026-04-23.md`
- GC-026: `docs/baselines/CVF_GC026_TRACKER_SYNC_W117_T1_CLOSED_2026-04-23.md`
- AGENT_HANDOFF.md: W117-T1 CLOSED DELIVERED
- AGENTS.md: Latest Closed Roadmap pointer advanced to W117
