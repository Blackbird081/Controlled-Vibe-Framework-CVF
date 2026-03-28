# CVF GC-027 Multi-Agent Review Governance Delta (2026-03-26)

Memory class: SUMMARY_RECORD
> Scope: establish canonical review-doc governance for multi-agent intake, rebuttal, and decision-pack workflows
> Control introduced: `GC-027`

---

## Summary

CVF now has a canonical docs-governance chain for multi-agent proposal evaluation:

- intake review template
- rebuttal template
- decision-pack template
- repo-level compatibility gate
- local hook-chain integration
- CI workflow integration

This closes the gap where multiple agents could review the same proposal set using inconsistent formats before roadmap intake.

This delta also clarifies the scope boundary:

- `GC-027` governs canonical documentation and review convergence in the repository
- `AI Boardroom` deliberation remains a separate, higher-priority runtime/control-plane concern

---

## Canonical Truth

- Guard: `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- Intake template: `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- Rebuttal template: `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- Decision pack template: `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`
- Compat gate: `governance/compat/check_multi_agent_review_governance_compat.py`
- Boardroom runtime reference: `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`

---

## Repository Wiring Updated

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/INDEX.md`
- `governance/compat/run_local_governance_hook_chain.py`
- `.github/workflows/documentation-testing.yml`

---

## Operational Effect

From this delta onward, canonical multi-agent evaluation in `docs/reviews/` should use the GC-027 templates and pass the GC-027 compatibility gate before roadmap intake or implementation selection proceeds.
