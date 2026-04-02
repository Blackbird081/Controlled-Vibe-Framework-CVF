# CVF P3 CP3 Frozen Version Root Dependency Audit

Memory class: FULL_RECORD

> Decision type: `GC-019` structural dependency audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID: `GC019-P3-CP3-FROZEN-VERSION-ROOT-DEPENDENCY-AUDIT-2026-04-02`
- Date: `2026-04-02`
- Proposed target:
  - audit real relocation readiness for `v1.0/` and `v1.1/`
  - determine whether either frozen root may safely enter a future physical move set
- Proposed change class:
  - `dependency audit / relocation gating`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- in scope:
  - `v1.0/`
  - `v1.1/`
  - active docs, onboarding surfaces, release/navigation docs, and non-doc runtime/tooling references that still point at these roots
- affected consumers:
  - `GC-037` lifecycle classification
  - `GC-038` exposure classification
  - `GC-039` pre-public `P3` readiness
  - future `GC-019` relocation packets for frozen roots
- out of scope:
  - any physical folder move
  - any rename
  - publication model selection

## 3. Findings

- `v1.0/` and `v1.1/` are each small roots by file count:
  - `v1.0/`: `33` files
  - `v1.1/`: `33` files
- size is not the blocker; inbound dependency footprint is the blocker
- active docs still reference `v1.0` heavily, especially:
  - `docs/cheatsheets/version-picker.md` (`24`)
  - `docs/VERSION_COMPARISON.md` (`18`)
  - `docs/concepts/version-evolution.md` (`15`)
  - `docs/reference/CVF_IN_VSCODE_GUIDE.md` (`11`)
  - `docs/HOW_TO_APPLY_CVF.md` (`10`)
- active docs still reference `v1.1` even more heavily, especially:
  - `docs/cheatsheets/version-picker.md` (`32`)
  - `docs/reference/CVF_IN_VSCODE_GUIDE.md` (`26`)
  - `docs/CVF_ARCHITECTURE_DECISIONS.md` (`20`)
  - `docs/VERSION_COMPARISON.md` (`18`)
  - `docs/HOW_TO_APPLY_CVF.md` (`18`)
- non-doc active surfaces still point to these roots:
  - `CLAUDE.md`
  - `CVF_ECOSYSTEM_ARCHITECTURE.md`
  - `START_HERE.md`
  - `governance/toolkit/README.md`
  - `governance/compat/core-manifest.json`
  - guard/runtime scope allowlists in:
    - `EXTENSIONS/CVF_GUARD_CONTRACT/src/guards/scope.guard.ts`
    - `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/guards/scope.guard.ts`
    - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/guards/scope.guard.ts`
- current lifecycle/exposure truth remains correct:
  - `v1.0/` = `FROZEN_REFERENCE / INTERNAL_ONLY`
  - `v1.1/` = `FROZEN_REFERENCE / INTERNAL_ONLY`
- conclusion:
  - relocation readiness is `NOT_READY`
  - these roots still behave as active reference anchors even though they are frozen

## 4. Risk Assessment

- structural risk:
  - `HIGH` for premature move
  - path churn would ripple across active docs, onboarding, scope guards, and release/navigation surfaces
- governance risk:
  - `MEDIUM`
  - a move before dependency reduction would make pre-public classification truth less trustworthy
- rollback risk:
  - `MEDIUM`
  - rollback is possible, but reference repair would be noisy and easy to miss

## 5. Recommendation

- recommended action:
  - do not move `v1.0/` or `v1.1/` in the next physical `P3` wave
  - preserve both as frozen visible roots until a later curation wave explicitly reduces active dependency footprint
- prerequisite before any future move discussion:
  - reduce active doc/onboarding references
  - remove or re-anchor runtime/tooling scope assumptions where appropriate
  - prepare a separate public-navigation replacement path for beginner/core guidance

## 6. Verification Plan

- commands:
  - `rg -n --glob '!v1.0/**' --glob '!v1.1/**' --glob '!node_modules/**' --glob '!docs/**' "v1\.0/|../v1\.0/|../../v1\.0/|\bv1\.0\b|v1\.1/|../v1\.1/|../../v1\.1/|\bv1\.1\b" .`
  - `rg -n --glob "*.md" "v1\.0/|../v1\.0/|../../v1\.0/|\bv1\.0\b" docs`
  - `rg -n --glob "*.md" "v1\.1/|../v1\.1/|../../v1\.1/|\bv1\.1\b" docs`
  - `python governance/compat/check_repository_lifecycle_classification.py --enforce`
  - `python governance/compat/check_repository_exposure_classification.py --enforce`
  - `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- success criteria:
  - canon explicitly says `v1.0/` and `v1.1/` are blocked from near-term relocation
  - future agents can see why these roots are different from `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/`

## 7. Rollback Plan

- rollback unit:
  - `P3 / CP3` frozen version root dependency audit batch
- rollback trigger:
  - active dependency footprint was materially overstated
  - one or both roots are later proven to have a safe migration path already in place
- rollback action:
  - revert the audit/review/delta/readiness updates together

## Final Readout

> `AUDIT READY` — `v1.0/` and `v1.1/` remain frozen visible roots with too much live dependency footprint for safe relocation in the next `P3` move set.