# CVF Tutorial And Concept Entrypoint Alignment Delta

> Date: `2026-03-20`
> Scope: tutorial and concept entrypoint documents
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `docs alignment delta`

---

## 1. Purpose

This delta records the cleanup of tutorial and concept entrypoints that still guided new readers toward the historical `4-phase` model before the canonical controlled loop.

Goal:

- make the first learning path reflect the active `INTAKE → DESIGN → BUILD → REVIEW → FREEZE` model
- keep the legacy `4-phase` material as historical context rather than front-door guidance

---

## 2. Changes Applied

### Tutorials

- `docs/tutorials/README.md`
  - tutorial overview now describes the first project through the canonical controlled loop

- `docs/tutorials/first-project.md`
  - updated learning outcome to the canonical controlled loop
  - changed Phase A wording from `Discovery` to `Intake`
  - added explicit `Freeze` closure to the tutorial summary and lessons learned
  - next-step links now send readers first to `controlled-execution-loop.md`

- `docs/tutorials/custom-skills.md`
  - prerequisite now points to the controlled execution loop

- `docs/tutorials/agent-platform.md`
  - clarified that 4 chat personas cover active execution phases while `FREEZE` is governed closure
  - updated handoff narrative and next-step links to the canonical loop

### Concepts

- `docs/concepts/README.md`
  - now lists `Controlled Execution Loop` as the active model
  - keeps `4-Phase Process` explicitly as historical foundation

- `docs/concepts/version-evolution.md`
  - added explicit note separating historical 4-phase origin from current canonical 5-phase posture
  - updated v1.6 description to reflect canonical-loop alignment more accurately

---

## 3. Verification

- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

---

## 4. Resulting Status

After this delta:

- tutorial and concept entrypoints no longer steer new readers into the legacy 4-phase model by default
- the canonical controlled loop is now the primary front-door learning path
- the historical 4-phase model remains available as contextual foundation, not as the active instructional default
