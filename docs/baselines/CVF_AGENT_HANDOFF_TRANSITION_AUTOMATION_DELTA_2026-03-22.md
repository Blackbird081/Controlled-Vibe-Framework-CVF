# CVF Agent Handoff Transition And Automation Delta

> Date: 2026-03-22
> Scope: define GC-020 transition semantics and add automated repo-level enforcement

---

## Summary

This delta closes the gap between the handoff template and the actual trigger rules for `GC-020`.

CVF now defines transition semantics before the handoff template is used, and adds one compat gate so the handoff control chain can be checked automatically.

---

## Why This Delta Exists

The previous handoff standard established that pause/transfer handoffs were mandatory, but it still left one ambiguity:

- when exactly is work considered `continue`
- when is it only a short `break`
- when does it become a real `pause`
- when is it a `shift handoff` or `agent transfer`

Without that classification layer, the template risks becoming a generic checklist instead of a governed checkpoint.

---

## What Changed

- added `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- updated `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`
- updated `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- updated `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- updated `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- added `governance/compat/check_agent_handoff_guard_compat.py`
- updated `governance/compat/run_local_governance_hook_chain.py`
- updated `docs/INDEX.md`
- updated `docs/CVF_INCREMENTAL_TEST_LOG.md`

---

## Outcome

CVF now has:

- one canonical transition taxonomy for stop/resume/transfer states
- one explicit rule that transition classification comes before handoff writing
- one automated compat gate that verifies the GC-020 chain stays aligned across policy, guard docs, template, control matrix, and hook-chain integration

---

## Verification

- `python governance/compat/check_agent_handoff_guard_compat.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

---

## Closure Note

> CVF now treats handoff not only as a mandatory checkpoint, but as a classified transition with automated repo-level alignment checks.
