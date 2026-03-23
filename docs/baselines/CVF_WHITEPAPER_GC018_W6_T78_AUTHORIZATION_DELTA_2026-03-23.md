# CVF Whitepaper GC-018 W6-T78 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T78 — Safety Runtime RefusalRouter, LLMAdapter, Deploy & PR Gateway Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 4 contract gaps in CVF_v1.7.1_SAFETY_RUNTIME)

## Scope

Provide dedicated test coverage for 4 contracts in CVF_v1.7.1_SAFETY_RUNTIME:

- `kernel/04_refusal_router/refusal.router.ts` — RefusalRouter.evaluate:
  R0→blocked=false/allow; R4→blocked+block+message; R3→blocked+needs_approval;
  R2+driftDetected→blocked+clarify
- `kernel-architecture/runtime/llm_adapter.ts` — LLMAdapter.generate:
  wrong/no token→throws "Direct LLM access blocked"; correct token+provider→delegates;
  no provider+message→"CVF response: <msg>"
- `skills/dev-automation/deploy.gateway.ts` — deployArtifact / registerDeployClient:
  no client→throws; register+deploy→calls client with correct params and returns result
- `skills/dev-automation/pr.gateway.ts` — createPRFromArtifact / registerPRClient:
  no client→throws; register+create→branchName=cvf/<proposalId>/title/files passed correctly

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/safety-runtime-refusal-router-llm-deploy-pr.test.ts` | CVF_v1.7.1_SAFETY_RUNTIME | 179 | 12 |

## GC-023 Compliance

- New test file: 179 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7.1_SAFETY_RUNTIME | 579 | 591 | +12 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes 4 RefusalRouter, LLMAdapter, deploy gateway and
PR gateway dedicated test coverage gaps in CVF_v1.7.1_SAFETY_RUNTIME.
