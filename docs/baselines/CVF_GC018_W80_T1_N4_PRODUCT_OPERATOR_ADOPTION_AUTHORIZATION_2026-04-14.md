# GC-018 Authorization — W80-T1 N4 Product/Operator Adoption

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W80-T1 — N4 Product/Operator Adoption
> Wave: N4 of CVF-native completion matrix (optional — operator-elected)
> Class: REALIZATION
> Lane: Fast Lane (GC-021) — new cvf-web routes + lib + tests; no CPF contract changes
> Prerequisite assessment: `docs/assessments/CVF_POST_W79_CONTINUATION_QUALITY_ASSESSMENT_2026-04-14.md`

---

## 1. Authorization Subject

Execute W80-T1 — N4 Product/Operator Adoption: expose the knowledge-native CPF lifecycle
contracts as governed API surfaces in `CVF_v1.6_AGENT_PLATFORM` (cvf-web).

---

## 2. Mandate

Expose `CompiledKnowledgeArtifactContract`, `KnowledgeMaintenanceContract`, and
`KnowledgeRefactorContract` as operator-accessible API routes in cvf-web.
This is the first product-layer adoption of the knowledge-native CPF capabilities delivered
in W72-W76. No CPF contract changes; no policy default changes.

---

## 3. Authorized Scope

| Deliverable | Description |
|---|---|
| `src/lib/server/knowledge-governance.ts` | Server-side wrapper functions for knowledge CPF contracts |
| `POST /api/governance/knowledge/compile/route.ts` | Compile + optional govern a knowledge artifact |
| `POST /api/governance/knowledge/maintain/route.ts` | Run maintenance evaluation on an approved artifact |
| `POST /api/governance/knowledge/refactor/route.ts` | Get refactor proposal from a maintenance result with issues |
| `route.test.ts` for each route | vitest tests (4-5 per route) |

---

## 4. Hard Boundaries

- Do NOT change any CPF contract files (`.ts` in EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/)
- Do NOT change the HYBRID / NO SINGLE DEFAULT policy decision
- Do NOT create new UI pages in this tranche (API-only)
- Do NOT create a new barrel or modify existing barrels
- Routes follow the exact same auth + response pattern as `governance/external-assets/`
- Lib functions are pure wrappers — no persistence, no registry writes

---

## 5. CPF Contracts Surfaced

| Contract | Method | Route |
|---|---|---|
| `CompiledKnowledgeArtifactContract` | `.compile()` + optional `.govern()` | `POST /api/governance/knowledge/compile` |
| `KnowledgeMaintenanceContract` | `.evaluate()` | `POST /api/governance/knowledge/maintain` |
| `KnowledgeRefactorContract` | `.recommend()` | `POST /api/governance/knowledge/refactor` |

All contracts imported from `cvf-control-plane-foundation` (already exported via knowledge barrel).

---

## 6. Exit Criteria for W80-T1

- `src/lib/server/knowledge-governance.ts` implemented with 3 wrapper functions
- 3 route files implemented under `src/app/api/governance/knowledge/`
- 3 test files with at minimum 4 tests each (401 auth, 400 body validation, 200 success, 500 error)
- `tsc` clean in cvf-web
- All new vitest tests pass; no regressions
- GC-026 tracker sync committed
- `AGENT_HANDOFF.md` updated with W80-T1 CLOSED DELIVERED

---

*GC-018 Authorization: APPROVED*
*Tranche: W80-T1 — N4 Product/Operator Adoption*
*Date: 2026-04-14*
