# CVF Shared Batch Helper Adoption Guard

**Control ID:** `GC-035`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active maintainability rule for governed CPF batch-contract and batch-test families.
**Applies to:** governed CPF batch contracts and selected dedicated batch tests on the active continuation line.
**Enforced by:** `governance/compat/check_cpf_batch_helper_adoption.py`

## Purpose

- stop repeated batch-contract patterns from being copied tranche after tranche
- keep deterministic batch identity and dominant-resolution logic centralized once the family has stabilized
- reduce fixture drift by requiring shared batch-test builders where repeated shapes already exist

## Rule

For the active governed CPF batch family:

- governed batch contracts listed by the checker must adopt the shared helper module:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts`
- governed dedicated batch tests listed by the checker must adopt the shared builder module:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`

This guard applies after the helper exists. New tranche files in the governed family must extend the shared helper instead of cloning the old logic.

The canonical maintainability authority is:

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_cpf_batch_helper_adoption.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`
- `governance/compat/check_cpf_batch_helper_adoption.py`

## Final Clause

Once CVF pays the cost to extract a stable helper, future governed work must use it by default.
