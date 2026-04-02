# CVF P3 CP2 Delta — Visible Root Truth Reconciliation

Memory class: SUMMARY_RECORD
Status: records the non-relocation `P3/CP2` batch that reconciles active pre-public root truth with the actual repository/worktree surface.

## Purpose

- remove stale visible-root claims before any later `P3` relocation discussion
- keep `GC-037` and `GC-039` aligned with the real filesystem
- stop git-worktree transport state from being misread as governed publication structure

## Scope

- removed stale active root claims for:
  - `.claude/`
  - `.vscode/`
  - `public/`
  - `REVIEW/`
- reclassified local/worktree artifacts:
  - `.claude/` and `.vscode/` are local-only metadata, excluded from canonical visible-root inventory
  - root-file `.git` is ignored as a git-worktree transport artifact

## Canonical Documents Updated

- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `AGENT_HANDOFF.md`

## Guard / Registry Updates

- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
- `governance/compat/check_prepublic_p3_readiness.py`
- `governance/compat/test_check_prepublic_p3_readiness.py`

## Verification

- `python governance/compat/test_check_prepublic_p3_readiness.py`
- `python governance/compat/check_repository_lifecycle_classification.py --enforce`
- `python governance/compat/check_repository_exposure_classification.py --enforce`
- `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/check_agent_handoff_guard_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Final Note

This delta does not authorize any additional physical `P3` relocation. It only makes later relocation decisions safer by restoring one accurate structural baseline.
