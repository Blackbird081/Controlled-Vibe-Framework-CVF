# CVF Test Partition Ownership Guard Adoption Delta

Memory class: SUMMARY_RECORD
Date: `2026-03-23`
Scope: make extracted governed test partitions durable so large legacy test files do not silently absorb the same surface again

---

## What Changed

This batch introduces `GC-024`:

- rule: `governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`
- checker: `governance/compat/check_test_partition_ownership.py`
- registry: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

It also wires the new guard into:

- `CVF_MASTER_POLICY.md`
- `CVF_GOVERNANCE_CONTROL_MATRIX.md`
- local pre-push governance hook chain
- CI workflow `documentation-testing.yml`

---

## First Active Partition

Initial enforced ownership:

- scope: `CPF Context Builder`
- canonical file:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.builder.test.ts`
- forbidden legacy file:
  - `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`

Forbidden patterns in the legacy file:

- `ContextBuildContract`
- `createContextBuildContract`
- `ContextBuildBatchContract`
- `createContextBuildBatchContract`

---

## File Annotations

The guarded split is also marked in code:

- `tests/index.test.ts` now carries a `do not add Context Builder tests here` note
- `tests/context.builder.test.ts` now carries the canonical ownership note

This keeps the rule visible to humans before the checker is even run.

---

## Verification

The batch is valid only if all of the following pass:

- `python -m py_compile governance/compat/check_test_partition_ownership.py`
- `python governance/compat/check_test_partition_ownership.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

---

## Result

The `Context Builder` split is no longer just a one-time cleanup.

It is now a governed boundary:

- canonical file owns the surface,
- legacy file is forbidden from re-absorbing it,
- CI and local governance hooks enforce that boundary.
