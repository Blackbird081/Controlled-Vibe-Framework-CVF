# CVF Reference Governed Loop Delta

> Date: `2026-03-20`
> Scope: SDK governed-loop helper and canonical reference doc
> Source roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
> Change class: `runtime + docs alignment delta`

---

## 1. Purpose

This delta records the addition of one explicit, reusable governed execution reference path.

Goal:

- strengthen the claim that CVF has at least one coder-facing end-to-end governed loop
- reduce dependence on scattered lower-level tests as the only proof of controlled-loop coherence
- give future demos and reassessments a stable executable anchor

---

## 2. Changes Applied

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts`
  - added `runReferenceGovernedLoop()` helper
  - added typed input/output contracts for the helper

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/index.ts`
  - exported the new helper types

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/tests/sdk.test.ts`
  - added end-to-end coverage for the reference governed loop helper

- `docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md`
  - documented the helper as a canonical governed reference path

---

## 3. Verification

- `cd EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL && npx vitest run tests/sdk.test.ts` -> `PASS`
- `cd EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL && npm run build` -> `PASS`
- `python governance/compat/check_docs_governance_compat.py --enforce` -> `PASS`
- `python governance/compat/check_baseline_update_compat.py --enforce` -> `PASS`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push` -> `PASS`

---

## 4. Resulting Status

After this delta:

- CVF has one reusable coder-facing governed execution helper on the active reference path
- freeze receipt and deterministic checkpoint evidence can be demonstrated from one SDK entrypoint
- the roadmap claim about a reference end-to-end governed loop is materially easier to audit and re-run
