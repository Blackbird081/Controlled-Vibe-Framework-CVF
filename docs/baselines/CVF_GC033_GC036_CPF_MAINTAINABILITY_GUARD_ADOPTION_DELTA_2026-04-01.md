# CVF GC-033 to GC-036 Maintainability Guard Adoption Delta — 2026-04-01

Memory class: SUMMARY_RECORD

## Scope

- extension: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION`
- governance scope: maintainability hardening for public barrel surfaces, barrel smoke ownership, shared batch helper adoption, and canon summary/evidence separation
- objective: finish the active maintainability remediation line and make it durable through mandatory guards

## Delivered

- added shared contract helper:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts`
- added shared batch-test builders:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`
- refactored governed CPF batch contracts to route through the shared helper:
  - `agent.definition.capability.batch.contract.ts`
  - `agent.scope.resolution.batch.contract.ts`
  - `agent.registration.batch.contract.ts`
  - `gateway.auth.batch.contract.ts`
  - `route.match.batch.contract.ts`
  - `reverse.prompting.batch.contract.ts`
  - `design.batch.contract.ts`
  - `orchestration.batch.contract.ts`
  - `boardroom.batch.contract.ts`
  - `boardroom.transition.gate.batch.contract.ts`
  - `boardroom.round.batch.contract.ts`
  - `boardroom.multi.round.batch.contract.ts`
- refactored governed CPF dedicated tests to adopt shared builders where shapes repeat:
  - `agent.definition.capability.batch.contract.test.ts`
  - `agent.registration.batch.contract.test.ts`
  - `route.match.batch.contract.test.ts`
  - `orchestration.batch.contract.test.ts`
  - `boardroom.batch.contract.test.ts`
  - `boardroom.multi.round.batch.contract.test.ts`
- added maintainability canon:
  - `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- activated mandatory maintainability guards:
  - `GC-033` `CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md`
  - `GC-034` `CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md`
  - `GC-035` `CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md`
  - `GC-036` `CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md`

## Governance Integration

- added repo gates:
  - `governance/compat/check_cpf_public_surface_maintainability.py`
  - `governance/compat/check_cpf_batch_helper_adoption.py`
  - `governance/compat/check_canon_summary_evidence_separation.py`
- added unit tests for all three new gates
- wired the gates into:
  - `governance/compat/run_local_governance_hook_chain.py`
  - `.github/workflows/documentation-testing.yml`
- synchronized rule discovery surfaces:
  - `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
  - `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
  - `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`
  - `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
  - `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
  - `docs/INDEX.md`
  - `README.md`
  - `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Verification

- `npm run check` (CPF) -> PASS
- `npx vitest run tests/agent.definition.capability.batch.contract.test.ts tests/agent.registration.batch.contract.test.ts tests/route.match.batch.contract.test.ts tests/orchestration.batch.contract.test.ts tests/boardroom.batch.contract.test.ts tests/boardroom.multi.round.batch.contract.test.ts` -> PASS
- `python governance/compat/test_check_cpf_public_surface_maintainability.py` -> PASS
- `python governance/compat/test_check_cpf_batch_helper_adoption.py` -> PASS
- `python governance/compat/test_check_canon_summary_evidence_separation.py` -> PASS
- `python governance/compat/check_cpf_public_surface_maintainability.py --enforce` -> PASS
- `python governance/compat/check_cpf_batch_helper_adoption.py --enforce` -> PASS
- `python governance/compat/check_canon_summary_evidence_separation.py --enforce` -> PASS

## Outcome

- all four planned maintainability directions are now active and machine-enforced
- future CPF tranche work must preserve thin public barrels, clean barrel smoke ownership, shared batch/helper adoption, and summary/evidence separation by default
- maintainability improvements are no longer one-time cleanup only; they now sit on the same governance footing as other active CVF repo gates
