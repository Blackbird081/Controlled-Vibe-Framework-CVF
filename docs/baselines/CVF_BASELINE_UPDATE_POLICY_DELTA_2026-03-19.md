# CVF Baseline Update Policy Delta

> Date: `2026-03-19`
> Type: Baseline delta / governance checkpoint
> Scope: Baseline maintenance policy and automated enforcement
> Baseline reference: `docs/baselines/CVF_CORE_COMPAT_BASELINE.md`

---

## 1. Change Summary

This delta records the transition from:

- baseline updates as strong documentation practice

to:

- baseline updates as mandatory enforced governance behavior

---

## 2. Triggering Change

The governance rule now requires that every accepted substantive fix/update must also produce a baseline update artifact.

This is no longer satisfied by normal logging alone.

Accepted artifact forms remain:

- baseline snapshot
- baseline delta/addendum
- post-fix assessment linked to the prior baseline

---

## 3. Enforcement Added

Automated enforcement added:

- `governance/compat/check_baseline_update_compat.py`
- `governance/compat/run_local_governance_hook_chain.py`
- CI workflow integration in `.github/workflows/documentation-testing.yml`
- local `pre-commit` wrapper hook
- local pre-push hook in `.githooks/pre-push`
- hook installer in `scripts/install-cvf-git-hooks.ps1`

Policy references updated:

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md`
- `docs/baselines/README.md`
- `docs/baselines/CVF_CORE_COMPAT_BASELINE.md`
- `docs/INDEX.md`

---

## 4. Verification Intent

Future reconciliation should now be faster because each substantive change is expected to leave behind:

- execution log evidence
- a stable baseline comparison anchor

This reduces review ambiguity and lowers re-audit cost.

---

## 5. Current Verdict

- Governance status: `UPGRADED`
- Rule status: `MANDATORY`
- Enforcement status: `ACTIVE`
- Local hook chain: `AVAILABLE`
- Comparison posture: `IMPROVED`
