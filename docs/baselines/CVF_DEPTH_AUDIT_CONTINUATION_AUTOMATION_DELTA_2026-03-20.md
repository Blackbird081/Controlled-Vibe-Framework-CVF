# CVF Depth Audit Continuation Automation Delta

Date: `2026-03-20`  
Scope: Repository-level enforcement for `GC-018` continuation control  
Rule anchor: `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md#GC-018`

---

## Objective

Close the remaining automation gap for post-closure roadmap continuation so active-path changes cannot reopen breadth or semantic deepening without a reviewable depth-audit checkpoint.

---

## Change Summary

- Added repo-level checker: `governance/compat/check_depth_audit_continuation_compat.py`
- Added local enforcement in `governance/compat/run_local_governance_hook_chain.py`
- Added CI enforcement in `.github/workflows/documentation-testing.yml`
- Updated canonical policy and guard references to point at the automated continuation gate
- Updated the system-unification roadmap automation status to reflect that `GC-018` is now machine-enforced on the repository path

---

## Expected Governance Effect

- Once the roadmap is `MATERIALLY DELIVERED`, substantive active-path changes now require a reviewable continuation checkpoint.
- A continuation checkpoint must update the roadmap and at least one reviewable artifact under `docs/baselines/`, `docs/reviews/`, or `docs/reference/` that references `GC-018` or contains a `Depth Audit` marker.
- This does not automatically approve new breadth expansion. It enforces that the stop/continue decision is explicitly recorded before push/merge.

---

## Verification

- `python -m py_compile governance/compat/check_depth_audit_continuation_compat.py`
- `python governance/compat/check_depth_audit_continuation_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/check_depth_audit_continuation_compat.py --base 205cd86 --head f11a1a0 --enforce`
- `python governance/compat/check_docs_governance_compat.py --enforce`
- `python governance/compat/check_baseline_update_compat.py --enforce`
- `python governance/compat/check_release_manifest_consistency.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

---

## Reconciliation Note

This delta upgrades `GC-018` from a documented decision boundary with manual receipts into a repository-enforced continuation control on the active baseline.
