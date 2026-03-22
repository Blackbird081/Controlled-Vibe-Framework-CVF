# CVF Agent Handoff Template Canonicalization Delta

> Date: `2026-03-22`  
> Scope: promote one canonical agent-handoff template into `docs/reference/`

---

## Change Summary

This delta records the addition of one canonical handoff template so pause / resume / transfer events can preserve truthful tranche state.

The new canonical artifact is:

- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`

## Why This Was Added

- recent whitepaper-completion work now spans multiple governed packets and tranches
- ad-hoc handoff notes are too easy to make incomplete or overly optimistic
- the scope-clarification packet requires future work to remain realization-first and truthful

## Operational Effect

After this delta:

- users and agents have one canonical place to copy a handoff pattern from
- handoffs are expected to name repo truth, active tranche truth, next governed move, and non-negotiable scope rules
- the template is indexed as a durable reference artifact rather than a transient chat note

## Files Updated

- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/README.md`
- `docs/INDEX.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/baselines/CVF_AGENT_HANDOFF_TEMPLATE_CANONICALIZATION_DELTA_2026-03-22.md`

## Verification

- `python governance/compat/check_docs_governance_compat.py --enforce` -> PASS
- `python governance/compat/check_baseline_update_compat.py --enforce` -> PASS
- `python governance/compat/check_release_manifest_consistency.py --enforce` -> PASS
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> PASS

## Final Readout

> CVF now has one canonical agent-handoff template for pause/transfer events, reducing restart ambiguity and helping future work stay aligned with governed scope.
