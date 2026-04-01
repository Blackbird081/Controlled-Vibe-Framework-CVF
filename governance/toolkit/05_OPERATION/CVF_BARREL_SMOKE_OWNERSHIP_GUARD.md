# CVF Barrel Smoke Ownership Guard

**Control ID:** `GC-034`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active maintainability boundary for governed barrel smoke tests.
**Applies to:** governed package barrel smoke files, currently `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`.
**Enforced by:** `governance/compat/check_cpf_public_surface_maintainability.py`

## Purpose

- preserve the dedicated/public-smoke role of barrel tests
- stop canonical split ownership from collapsing back into `tests/index.test.ts`
- keep tranche-local behavioral coverage in dedicated files where it belongs

## Rule

Governed barrel smoke files must remain:

- small enough to stay readable
- limited to public-surface smoke coverage
- free of reintroduced forbidden ownership patterns already assigned to dedicated files

For the active CPF surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts` must stay under the active smoke-test threshold
- imports must route through `../src/index` plus approved helper files
- forbidden patterns registered against this file in `CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` must not reappear

The canonical maintainability authority is:

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_cpf_public_surface_maintainability.py`
- ownership registry truth remains governed by `governance/compat/check_test_partition_ownership.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/index.test.ts`
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- `governance/compat/check_cpf_public_surface_maintainability.py`
- `governance/compat/check_test_partition_ownership.py`

## Final Clause

Barrel smoke is a governed ownership surface, not a fallback home for everything that no longer has a place.
