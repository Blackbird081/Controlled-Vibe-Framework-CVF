# CVF Foundational Concept Labeling Delta

> Date: `2026-03-20`
> Scope: foundational concept docs and version-picker guidance
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `docs alignment delta`

---

## 1. Purpose

This delta records a terminology cleanup across foundational concept docs.

Goal:

- reduce confusion between historical doctrine and active runtime truth
- make it clearer which docs describe the current canonical loop
- preserve early CVF theory without letting it masquerade as the active default model

---

## 2. Changes Applied

- `docs/concepts/core-philosophy.md`
  - updated examples and further-reading links to foreground the canonical controlled loop

- `docs/concepts/governance-model.md`
  - added an explicit note that this doc explains foundational governance doctrine
  - linked readers to the controlled execution loop for the active reference path

- `docs/concepts/risk-model.md`
  - added an explicit note that older 4-phase references are historical foundation
  - linked readers to the controlled execution loop for the active canonical model

- `docs/cheatsheets/version-picker.md`
  - renamed the feature row from generic `4-Phase Process` to `Original 4-Phase Foundation`
  - updated the final checklist so readers verify the canonical controlled loop first

---

## 3. Verification

- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

---

## 4. Resulting Status

After this delta:

- foundational doctrine remains available and readable
- active/runtime-truth guidance is easier to distinguish from historical foundation
- readers are less likely to confuse legacy 4-phase theory with the canonical controlled execution loop used on the active reference path
