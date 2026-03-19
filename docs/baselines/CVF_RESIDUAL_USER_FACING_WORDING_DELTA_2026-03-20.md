# CVF Residual User-Facing Wording Delta

> Date: `2026-03-20`
> Scope: `README.md` and `docs/reference/CVF_IN_VSCODE_GUIDE.md`
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `docs alignment delta`

---

## 1. Purpose

This delta records the cleanup of residual user-facing wording that still implied the active CVF model was `4-phase` or only at a partial-integration posture.

Goal:

- keep historical `4-phase` references only where they are intentionally archival
- point readers at the most current whole-system readout
- make active VS Code guidance match the canonical controlled loop

---

## 2. Changes Applied

### README

- updated the "Current System Review" row to point to:
  - `docs/reviews/CVF_SYSTEM_UNIFICATION_REASSESSMENT_2026-03-20.md`
- replaced the older wording about whole-system unification being merely partial with the newer, more accurate "substantially aligned on the active reference path" posture

### VS Code guide

- `docs/reference/CVF_IN_VSCODE_GUIDE.md`
  - removed residual `4-phase` wording from active user guidance
  - aligned Vietnamese sections to the canonical `5-phase controlled loop`
  - updated starter prompts and mode descriptions so active guidance now uses `A -> B -> C -> D -> E`

---

## 3. Verification

- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

---

## 4. Resulting Status

After this delta:

- active user-facing guidance is more consistent with the current canonical execution model
- legacy `4-phase` language remains only in explicit historical reference contexts
- the README now directs readers to the latest independent reassessment rather than an outdated intermediate readout
