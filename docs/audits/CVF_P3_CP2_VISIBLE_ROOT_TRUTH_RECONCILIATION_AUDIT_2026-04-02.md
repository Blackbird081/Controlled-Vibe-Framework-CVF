# CVF P3 CP2 Visible Root Truth Reconciliation Audit

Memory class: FULL_RECORD

> Decision type: `GC-019` structural truth audit
> Pre-public phase: `P3`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID: `GC019-P3-CP2-VISIBLE-ROOT-TRUTH-RECONCILIATION-2026-04-02`
- Date: `2026-04-02`
- Proposed target:
  - reconcile active pre-public classification truth with the real visible repository root
  - remove stale root claims for `.claude/`, `.vscode/`, `public/`, and `REVIEW/`
  - treat git-worktree `.git` as a transport artifact rather than a governed root file
- Proposed change class:
  - `classification / continuity reconciliation`
- Active roadmap anchor:
  - `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`

## 2. Scope

- in scope:
  - `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
  - `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
  - `governance/compat/check_prepublic_p3_readiness.py`
  - active pre-public reference docs and handoff continuity
- affected consumers:
  - `GC-037` lifecycle classification
  - `GC-039` pre-public readiness
  - agent handoff / pre-public protocol readers
- out of scope:
  - any new physical folder move
  - `v1.0/` and `v1.1/` relocation
  - publication-model selection

## 3. Findings

- actual visible roots on disk do not include `.claude/`, `.vscode/`, `public/`, or `REVIEW/`
- active registry/doc canon still claimed those roots were part of visible-root truth
- secondary git worktrees expose `.git` as a root-level pointer file, which caused `GC-039` to fail as if it were an unclassified public-facing root file
- active canon also still implied `REVIEW/` was a live visible root, while current review truth has long since moved under `docs/reviews/`

## 4. Risk Assessment

- structural risk:
  - `LOW`
  - no runtime path or package relocation is involved
- governance risk:
  - `MEDIUM` if left unresolved
  - stale classification truth would make future `P3` move sets less trustworthy
- rollback risk:
  - `LOW`
  - changes are registry/doc/checker only

## 5. Recommendation

- recommended action:
  - reconcile registry and docs immediately before any further `P3` move discussion
- why now:
  - future safe relocation depends on the repo having one accurate visible-root inventory
  - worktree isolation should not create false positives in `GC-039`

## 6. Verification Plan

- commands:
  - `python governance/compat/test_check_prepublic_p3_readiness.py`
  - `python governance/compat/check_repository_lifecycle_classification.py --enforce`
  - `python governance/compat/check_repository_exposure_classification.py --enforce`
  - `python governance/compat/check_prepublic_p3_readiness.py --enforce`
  - `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/check_agent_handoff_guard_compat.py --base HEAD --head HEAD --enforce`
  - `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
- success criteria:
  - no stale visible-root entries remain in lifecycle canon
  - worktree `.git` pointer no longer trips `GC-039`
  - active docs stop describing `REVIEW/` as a current visible root

## 7. Rollback Plan

- rollback unit:
  - `P3 / CP2` visible-root truth reconciliation batch
- rollback trigger:
  - an omitted root turns out to be intentionally visible and canonical after all
  - checker changes hide a real governed root-file obligation
- rollback action:
  - revert registry/checker/doc batch together

## Final Readout

> `AUDIT READY` — This batch is a safety-first truth reconciliation required before any further physical `P3` relocation can be trusted.
