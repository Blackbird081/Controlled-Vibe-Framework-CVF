# CVF GC-018 Continuation Template Delta

> Date: `2026-03-20`
> Type: Baseline delta
> Control anchor: `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018`
> Purpose: Standardize the reusable packet for any future attempt to reopen a materially delivered roadmap

---

## Change Summary

This delta adds a reusable continuation-candidate template for `GC-018`.

New canonical artifact:

- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`

Related documentation was updated so the template is now linked from:

- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`

## Why This Delta Exists

Before this batch, CVF already had:

- the rule
- the score thresholds
- the repository gate

But it did not yet have one standard reusable packet that tells a future proposer exactly how to present a valid reopening candidate.

This delta closes that workflow gap.

## Resulting Governance Readout

- `GC-018` now has policy, automation, and a reusable proposal template
- future continuation decisions can be compared more consistently across waves
- reopening a depth-frozen roadmap now has a clearer entry procedure, not just a stop rule

## Verification

- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
