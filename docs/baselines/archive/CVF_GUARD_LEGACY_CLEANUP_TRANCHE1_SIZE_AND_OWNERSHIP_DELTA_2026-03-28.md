# CVF Guard Legacy Cleanup Tranche 1 Size And Ownership Delta 2026-03-28

Memory class: SUMMARY_RECORD
Status: completed first legacy guard cleanup tranche under the `GC-030` adoption wave.

## Scope

- upgrade the highest-risk legacy guard group `SIZE_AND_OWNERSHIP` to the `GC-030` authoring contract
- keep rule semantics intact while standardizing metadata, sections, and enforcement-surface documentation

## Guards Upgraded

- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`

## What Changed

1. normalized all three guards to the `GC-030` structure:
   - top-level title
   - metadata block
   - `Purpose`
   - `Rule`
   - `Enforcement Surface`
   - `Related Artifacts`
   - `Final Clause`
2. preserved the active policy semantics for thresholds, exception registries, and ownership workflow
3. made baseline-protection posture explicit for the registry-driven guards in this family

## Residual Legacy Count

Before this tranche:

- legacy pre-`GC-030` guards remaining: `29`

After this tranche:

- legacy pre-`GC-030` guards remaining: `26`

## Verification

- `python governance/compat/check_guard_authoring_standard.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Next Recommended Group

- `CONTINUITY_AND_DECISION`

This is the next highest-value legacy family because its failure mode is usually cross-reference drift between guard docs, templates, bootstrap routing, control matrix entries, and hook or CI wiring.
