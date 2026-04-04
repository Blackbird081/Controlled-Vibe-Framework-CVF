# CVF Foundational Guard Automation Delta 2026-03-28

Memory class: SUMMARY_RECORD
Status: completed automation batch for the last six foundational guards that previously depended mainly on policy references or reviewer discipline.

## Scope

- automate the remaining foundational guard family through one shared compat gate
- wire the new gate into local pre-push and CI
- update the canonical ADR, Knowledge Base, README, and classification map so the new enforcement posture is truthful

## Guards Covered

- `CVF_ADR_GUARD.md`
- `CVF_ARCHITECTURE_CHECK_GUARD.md`
- `CVF_EXTENSION_VERSIONING_GUARD.md`
- `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
- `CVF_TEST_DEPTH_CLASSIFICATION_GUARD.md`
- `CVF_WORKSPACE_ISOLATION_GUARD.md`

## Delivered Changes

1. Added a dedicated shared gate:
   - `governance/compat/check_foundational_guard_surfaces.py`
2. Repointed the six guard docs above so `Enforced by` now names the actual compat gate plus their durable canonical artifacts.
3. Wired the new gate into:
   - `governance/compat/run_local_governance_hook_chain.py`
   - `.github/workflows/documentation-testing.yml`
4. Added regression coverage for the new gate in:
   - `governance/compat/test_check_foundational_guard_surfaces.py`
5. Updated canonical governance records:
   - `docs/CVF_ARCHITECTURE_DECISIONS.md`
   - `docs/CVF_CORE_KNOWLEDGE_BASE.md`
   - `README.md`
   - `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

## Post-Batch Posture

- all active guards are now standardized under `GC-030`
- all previously identified policy-only foundational guards now have machine enforcement
- the remaining hardening frontier is enforcement precision and regression depth, not missing automation ownership

## Verification

- `python governance/compat/test_check_foundational_guard_surfaces.py`
- `python governance/compat/check_foundational_guard_surfaces.py --base HEAD --head HEAD --enforce`
- `python governance/compat/check_guard_authoring_standard.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
