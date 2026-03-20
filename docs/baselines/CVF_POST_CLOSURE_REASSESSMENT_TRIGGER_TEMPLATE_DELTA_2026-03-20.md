# CVF Post-Closure Reassessment Trigger Template Delta

> Date: `2026-03-20`
> Type: Baseline delta
> Purpose: Standardize the reassessment path that may legitimately follow a closed active wave

---

## Change Summary

This batch adds one reusable trigger template for the only non-continuation path that may legitimately follow active-wave closure:

- a fresh independent reassessment

New canonical artifact:

- `docs/reference/CVF_POST_CLOSURE_REASSESSMENT_TRIGGER_TEMPLATE.md`

Linked artifacts:

- `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
- `docs/reviews/CVF_SYSTEM_UNIFICATION_ACTIVE_WAVE_CLOSURE_REVIEW_2026-03-20.md`
- `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`

## Why This Delta Exists

After the active wave was closed, CVF already had:

- a standardized continuation path
- a `GC-018` gate
- a canonical defer packet for the current `P3` candidate

What remained asymmetric was the reassessment path.

This delta closes that gap so both legitimate next-step classes are now standardized:

- reassessment
- continuation candidate

## Resulting Readout

- the active wave remains closed
- future work still requires either reassessment or continuation handling
- both paths now have reusable reviewable templates

## Verification

- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
