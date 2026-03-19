# CVF Front-Door Web Docs Canonicalization Delta

> Date: `2026-03-20`
> Scope: Web docs index metadata and non-coder phase-language wording
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `docs alignment delta`

---

## 1. Purpose

This delta records a final cleanup pass on the active Web documentation front door.

Goal:

- remove one remaining user-facing tutorial description that still summarized the flow as generic `4 phases`
- keep compatibility alias support without letting inline wording imply that the legacy phase model is still the active UI truth

---

## 2. Changes Applied

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/data/docs-data.ts`
  - updated the `first-project` tutorial description to advertise the canonical `intake -> design -> build -> review -> freeze` flow

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/non-coder-language.ts`
  - reworded inline alias-handling guidance so it reads as compatibility normalization rather than old-model instruction

---

## 3. Verification

- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/data/docs-data.test.ts src/app/docs/page.test.tsx src/lib/non-coder-language.test.ts` -> `PASS`
- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

---

## 4. Resulting Status

After this delta:

- the active Web docs index no longer markets CVF learning flow as a generic `4 phases` journey
- non-coder helper wording is cleaner about what is canonical versus compatibility-only
- remaining `4-phase` references on the active path are now intentionally historical or compatibility-boundary context rather than front-door instructional drift
