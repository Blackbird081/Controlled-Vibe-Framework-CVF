# CVF P3 CP3 Delta — Frozen Version Root Dependency Gate

Memory class: SUMMARY_RECORD
Status: records the non-relocation `P3/CP3` batch that audits `v1.0/` and `v1.1/` relocation readiness and explicitly blocks premature movement.

## Purpose

- distinguish frozen reference roots from retired low-value roots
- stop future `P3` waves from moving `v1.0/` or `v1.1/` just because they look legacy
- preserve one explicit dependency baseline before any later curation wave

## Scope

- audited live dependency footprint for:
  - `v1.0/`
  - `v1.1/`
- confirmed both roots remain:
  - `FROZEN_REFERENCE`
  - `INTERNAL_ONLY`
- codified current relocation status:
  - `NOT_READY`
  - no physical move authorized

## Canonical Documents Updated

- `docs/reference/CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION.md`
- `docs/reference/CVF_REPOSITORY_EXPOSURE_CLASSIFICATION.md`
- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `AGENT_HANDOFF.md`

## Audit / Review Chain

- `docs/audits/CVF_P3_CP3_FROZEN_VERSION_ROOT_DEPENDENCY_AUDIT_2026-04-02.md`
- `docs/reviews/CVF_GC019_P3_CP3_FROZEN_VERSION_ROOT_DEPENDENCY_REVIEW_2026-04-02.md`

## Verification

- `python governance/compat/check_repository_lifecycle_classification.py --enforce`
- `python governance/compat/check_repository_exposure_classification.py --enforce`
- `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/check_agent_handoff_guard_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Final Note

This delta does not authorize any physical relocation. It narrows the next safe `P3` move horizon by explicitly keeping `v1.0/` and `v1.1/` out of the near-term move set.