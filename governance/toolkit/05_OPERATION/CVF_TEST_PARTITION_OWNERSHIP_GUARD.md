# CVF Test Partition Ownership Guard

**Control ID:** `GC-024`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active durability boundary for governed test surfaces that have already been split into canonical sub-files.
**Applies to:** governed test partition ownership where CVF has already extracted tranche-local or subsystem-local tests into canonical destination files.
**Enforced by:** `governance/compat/check_test_partition_ownership.py`

## Purpose

- keep intentional large-test splits durable once they are made
- stop future batches from silently appending new tests back into the old monolithic file
- preserve maintainability gains by making canonical ownership machine-readable

## Rule

When CVF extracts tranche-local or subsystem-local tests out of an oversized test file, that split must stay durable.

For each governed split covered by this guard:

- one canonical destination file owns the extracted test surface
- one or more legacy files are explicitly forbidden from reintroducing that surface
- ownership is stored in a registry so enforcement stays machine-readable

### Current Active Ownership

At the active baseline, the first enforced partition is:

- scope: `CPF Context Builder`
- canonical file: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.builder.test.ts`
- forbidden legacy file: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`

Forbidden symbols in the legacy file include:

- `ContextBuildContract`
- `createContextBuildContract`
- `ContextBuildBatchContract`
- `createContextBuildBatchContract`

### Required Workflow

When a test surface is intentionally split:

1. mark the canonical file as the owner
2. mark the old file as forbidden for that surface
3. register the partition in `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
4. run `python governance/compat/check_test_partition_ownership.py --enforce`

### Violation Conditions

Violations include:

- reintroducing owned symbols into a forbidden legacy file
- missing canonical file
- incomplete ownership registry entry
- mutating an existing partition definition without going through the protected baseline path enforced by the checker

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_test_partition_ownership.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`
- ownership registry mutations are baseline-protected inside the checker

Strict command:

```bash
python governance/compat/check_test_partition_ownership.py --enforce
```

## Related Artifacts

- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- `governance/compat/check_test_partition_ownership.py`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

## Final Clause

Splitting a large test file is not complete until the split becomes durable.

CVF therefore treats canonical test ownership as a governed boundary, not a suggestion.
