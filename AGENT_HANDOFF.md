# CVF Relocation Lane Handoff — 2026-04-03

> Branch: `restructuring/p3-cp2-retained-internal-root-relocation`
> Remote tracking branch: `origin/restructuring/p3-cp2-retained-internal-root-relocation`
> Exact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff
> Workspace: `D:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF-P3-CP2`
> Current local HEAD: `5b287c46`
> Current remote checkpoint: `4369a231`
> State: **P4/CP13 COMMITTED LOCALLY ON ISOLATED RELOCATION LANE** — `P3/CP2` remains the only delivered physical relocation wave; `P3/CP3` and `P3/CP4` remain `HOLD`; `P3/CP5` foundation-anchor pivot remains active; `P4/CP1-P4/CP13` are complete on this lane; all three shortlisted candidates uplifted to `READY_FOR_EXPORT`

---

## Scope

- External agent memory files: non-canonical convenience only; resume from repo truth first
- This handoff is only for the pre-public relocation / packaging / publication-boundary lane
- Do not use this handoff for canonical tranche continuation on `cvf-next`
- Canonical master-architecture / tranche handoff lives here:
  - `D:/UNG DUNG AI/TOOL AI 2026/Controlled-Vibe-Framework-CVF/AGENT_HANDOFF.md`

## Current Branch Posture

- working tree is clean after commit
- branch is ahead of remote by multiple committed checkpoints:
  - local-only checkpoints: `P4/CP12`, relocation handoff split, `P4/CP13`
- no uncommitted `P4/CP14+` WIP remains in this worktree

## Stable Delivered Record

- `P3/CP1`
  - retired `CVF Edit/`, `CVF_Important/`, and `CVF_Restructure/` from visible root
- `P3/CP2`
  - relocated `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` into `ECOSYSTEM/reference-roots/retained-internal/`
- `P3/CP3`
  - re-assessment concluded `HOLD`
- `P3/CP4`
  - canonical landing-path re-assessment concluded `HOLD`
- `P3/CP5`
  - strategy pivot approved
  - `v1.0/` and `v1.1/` preserved as visible frozen foundation anchors
- `P4/CP1-P4/CP5`
  - curated front-door, docs-mirror boundary, export shortlist, packaging boundary, and navigation definition completed
- `P4/CP6`
  - root front-door content sync completed
- `P4/CP7-P4/CP9`
  - first-wave shortlist implementation completed for:
    - `CVF_v3.0_CORE_GIT_FOR_AI`
    - `CVF_GUARD_CONTRACT`
    - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- `P4/CP10`
  - shortlist wave consolidation completed
- `P4/CP11`
  - first readiness re-assessment completed
  - all three shortlisted candidates remained `NEEDS_PACKAGING`
- `P4/CP12`
  - documentation and packaging-gap cleanup committed locally
  - all four P4/CP11 gaps closed (READMEs rewritten + `better-sqlite3` moved to optionalDependencies)
  - all three shortlisted candidates still remained `NEEDS_PACKAGING`
- `P4/CP13`
  - second bounded readiness re-assessment completed
  - all three shortlisted candidates uplifted to `READY_FOR_EXPORT`
  - all three criteria passed: documentation clarity, support obligations, capability boundaries

## Current Assessment

- the low-risk physical relocation objective succeeded once, for the retained/internal pair
- forcing additional physical relocation after that was correctly stopped
- `v1.0/` and `v1.1/` are now treated as architecture-significant anchors, not as obvious next move targets
- the readiness evaluation objective is now complete: all three shortlisted candidates are `READY_FOR_EXPORT`
- the remaining unresolved issue is:
  - how to handle the publication decision (registry target, versioning policy, distribution model)
  - how to handle canonical landing back to `cvf-next` under `GC-039`

## Hard Boundaries

- no new physical `P3` relocation wave is approved
- do not move `v1.0/` or `v1.1/`
- do not treat `REVIEW/` as a valid next relocation payload root
- do not treat any isolated relocation diff as landed on `cvf-next`
- do not treat `NEEDS_PACKAGING` as `READY_FOR_EXPORT`
- do not open package publication, public docs mirror execution, or landing-path override from this handoff alone

## Required Reads

- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/INDEX.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md`
- `docs/baselines/CVF_P4_CP13_SHORTLIST_SECOND_READINESS_REASSESSMENT_DELTA_2026-04-03.md`

## Default Next Step

- if continuing locally in this worktree:
  - start from `P4/CP13`
  - all three candidates are now `READY_FOR_EXPORT`
  - next bounded packet is a publication decision packet (`P4/CP14`)
  - that packet must address: registry target, versioning policy, distribution model, and GC-039 landing path to `cvf-next`
- if remote parity is required before more work:
  - push all local checkpoints (`P4/CP12` + relocation handoff split + `P4/CP13`) first
  - then open the publication decision packet

## Verification Pattern

- run targeted governance guards for changed files
- run full `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- keep this lane isolated on `restructuring/p3-*` branch + secondary worktree until governance defines a landing path
