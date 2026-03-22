# CVF GC-021 GC-022 Role Clarification Delta

Memory class: SUMMARY_RECORD

> Date: 2026-03-22
> Scope: clarify the boundary between fast-lane governance and memory governance so agents do not confuse process simplification with storage class

## Problem Closed

`GC-021` and `GC-022` were both correct, but the wording still allowed one costly misunderstanding:

- `Fast Lane` could be misread as "summary record by default"
- `Full Lane` could be misread as "everything becomes full record"

That is not the intended model.

## Clarified Truth

- `GC-021` decides lane selection and minimum evidence burden
- `GC-022` decides the durable memory class of each resulting artifact

So:

- fast-lane audit/review can still be `FULL_RECORD`
- implementation delta remains `SUMMARY_RECORD`
- index and reference navigation remain `POINTER_RECORD`

## Changes Made

- clarified `CVF_FAST_LANE_GOVERNANCE_GUARD.md`
- clarified `CVF_MEMORY_GOVERNANCE_GUARD.md`
- added a crosswalk to `CVF_MEMORY_RECORD_CLASSIFICATION.md`
- updated fast-lane templates with explicit default output memory class
- updated policy and control-matrix wording
- tightened compat gates so this separation does not drift later

## Verification

- `python governance/compat/check_fast_lane_governance_compat.py --enforce`
- `python governance/compat/check_memory_governance_compat.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Closing Readout

> `GC-021` is now explicitly about execution-lane choice, while `GC-022` is explicitly about durable memory class. The overlap in wording has been reduced so agents do not create hidden token cost by storing the wrong granularity of evidence.
