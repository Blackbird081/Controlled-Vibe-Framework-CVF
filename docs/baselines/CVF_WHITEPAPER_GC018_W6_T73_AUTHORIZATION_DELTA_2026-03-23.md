# CVF Whitepaper GC-018 W6-T73 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T73 — Safety Runtime CVF-UI API Controllers & Creative Control Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 10 contract gaps in CVF_v1.7.1_SAFETY_RUNTIME)

## Scope

Provide dedicated test coverage for 10 contracts in CVF_v1.7.1_SAFETY_RUNTIME:

- `cvf-ui/cvf-api/ai-settings.controller.ts` — getAISettings / updateAISettings:
  defaults present; partial merge retains unchanged fields; persists updates
- `cvf-ui/cvf-api/audit.controller.ts` — recordAudit / getAudit:
  empty start; entry with model+tokens
- `cvf-ui/cvf-api/proposal.controller.ts` — createProposal / getProposal:
  short→APPROVED/riskScore=3; long(>500)→PENDING/riskScore=7; get-existing; get-unknown→null
- `cvf-ui/cvf-api/execution.controller.ts` — executeProposal:
  APPROVED→success+proposalId; PENDING→throws; unknown→throws
- `kernel/05_creative_control/audit.logger.ts` — AuditLogger.log/getEvents:
  type/message/timestamp present; accumulates
- `kernel/05_creative_control/lineage.store.ts` — LineageStore.add/getAll
- `kernel/05_creative_control/refusal.registry.ts` — RefusalRegistry.record/getAll
- `kernel/05_creative_control/creative_permission.policy.ts` — CreativePermissionPolicy.allow:
  creative_allowed=false→false; true+R0→true; true+R2→false
- `kernel/05_creative_control/creative_provenance.tagger.ts` — tag prepends [creative:controlled]
- `kernel/05_creative_control/creative.controller.ts` — CreativeController.adjust:
  disabled→passthrough; enabled+denied→passthrough; enabled+allowed→tagged expansion

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/safety-runtime-cvfui-api-creative-control.test.ts` | CVF_v1.7.1_SAFETY_RUNTIME | 232 | 25 |

## GC-023 Compliance

- New test file: 232 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7.1_SAFETY_RUNTIME | 478 | 503 | +25 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes 10 CVF-UI API controller and creative control layer
dedicated test coverage gaps in CVF_v1.7.1_SAFETY_RUNTIME.
