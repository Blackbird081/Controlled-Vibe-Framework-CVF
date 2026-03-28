
Memory class: SUMMARY_RECORD


> Date: 2026-03-22
> Scope: adopt a two-speed governance model so additive tranche-local work can move faster without losing structural control

## Intent

Reduce token cost and procedural weight on low-risk additive work while keeping the critical controls intact.

The adopted model is:

- keep `GC-018` for opening waves or tranches
- keep `GC-019` full-lane handling for real boundary changes
- keep tests, gates, baseline delta, clean commit, and tranche closure checkpoints mandatory
- allow `Fast Lane` only for additive work inside an already-authorized tranche

## Why This Delta Exists

The previous governance posture was safe, but it made some realization-first tranches expensive in time and token cost because every control point tended to accumulate a full packet shape.

That cost is not justified when:

- tranche scope is already settled
- the work is additive
- rollback is bounded
- no structural or authority boundary is changing

## Adopted Split

### Fast Lane

Allowed for:

- contract extraction
- wrapper-to-real-contract uplift
- consumer proof
- deterministic packaging
- additive runtime helper

Only when all of the following remain true:

- already-authorized tranche
- additive only
- no physical merge
- no ownership transfer
- no runtime-authority change
- no target-state claim expansion
- no concept-to-module creation

### Full Lane

Still mandatory for:

- physical merge
- module created from concept-only target
- ownership transfer
- runtime authority or control boundary change
- target-state claim expansion
- tranche scope expansion

## Changes Made

- added `governance/toolkit/05_OPERATION/CVF_FAST_LANE_GOVERNANCE_GUARD.md`
- added `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md`
- added `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md`
- registered the rule in `CVF_MASTER_POLICY`
- registered control `GC-021` in `CVF_GOVERNANCE_CONTROL_MATRIX`
- added `governance/compat/check_fast_lane_governance_compat.py`
- added the new compat gate to `run_local_governance_hook_chain.py`

## Resulting Governance Truth

CVF now has a canonical two-speed model:

- `Full Lane` for boundary-changing work
- `Fast Lane` for low-risk additive work inside already-approved tranche boundaries

This does **not** weaken the existing hard controls.

It narrows where heavy documentation is truly necessary and where tranche-local lightweight evidence is enough.

## Verification

- `python governance/compat/check_fast_lane_governance_compat.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Closing Readout

> `GC-021` gives CVF a practical way to move faster on realization-first work without turning every additive control point into a full packet burden. The structure stays governed; the unnecessary token and process cost is reduced.
