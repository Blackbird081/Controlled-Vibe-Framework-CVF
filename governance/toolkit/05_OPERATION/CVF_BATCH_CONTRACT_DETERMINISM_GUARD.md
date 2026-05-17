# CVF Batch Contract Determinism Guard

**Control ID:** `GC-040`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active mandatory determinism rule for governed CPF and EPF batch-contract families.
**Applies to:** governed batch contracts under `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/` and `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/`.
**Enforced by:** `governance/compat/check_batch_contract_determinism.py`

## Purpose

- keep governed batch identity deterministic across tranche waves instead of drifting file by file
- prevent `batchId` from silently reintroducing volatile suffixes after `batchHash` has already captured batch state
- keep injected clocks truthful by forcing batch wrappers to thread `now` into nested contract creation

## Rule

For governed CPF and EPF batch contracts:

1. `batchId` MUST be derived from `batchHash` only.
2. `batchIdParts` or equivalent post-`batchHash` entropy MUST NOT be added back into governed batch identity derivation.
3. when a governed batch wrapper instantiates a nested non-batch contract internally and owns `now`, it MUST pass `now: this.now` into that nested contract.
4. once the deterministic pattern is established, future tranche files must extend it instead of cloning weaker variants.

The canonical maintainability authority for this rule is:

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`

The active continuity reminder for this rule is:

- `AGENT_HANDOFF.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_batch_contract_determinism.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `AGENT_HANDOFF.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts`
- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash.ts`
- `governance/compat/check_batch_contract_determinism.py`

## Final Clause

If a batch contract can drift its clock source or identity semantics tranche by tranche, CVF loses the very determinism it is trying to govern.
