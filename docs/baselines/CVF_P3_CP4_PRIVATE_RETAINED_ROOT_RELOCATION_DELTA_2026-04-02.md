# CVF P3 CP4 Delta — Private Retained Root Relocation

Memory class: SUMMARY_RECORD
Status: records the bounded `P3/CP4` relocation that moved two small private retained roots under `ECOSYSTEM/reference-roots/`.

## Purpose

- reduce visible-root clutter without deleting retained lineage
- preserve one explicit record that `CVF_SKILL_LIBRARY/` and `ui_governance_engine/` are no longer visible roots
- keep future agents from reinterpreting this cleanup as a broad relocation precedent

## Scope

- moved:
  - `CVF_SKILL_LIBRARY/` -> `ECOSYSTEM/reference-roots/CVF_SKILL_LIBRARY/`
  - `ui_governance_engine/` -> `ECOSYSTEM/reference-roots/ui_governance_engine/`
- updated:
  - lifecycle registry and lifecycle classification canon
  - exposure classification canon
  - `P3` readiness / protocol / roadmap / handoff / phase tracker
  - retained-root documentation inside `ECOSYSTEM/`

## Audit / Review Chain

- `docs/audits/CVF_P3_CP4_PRIVATE_RETAINED_ROOT_RELOCATION_AUDIT_2026-04-02.md`
- `docs/reviews/CVF_GC019_P3_CP4_PRIVATE_RETAINED_ROOT_RELOCATION_REVIEW_2026-04-02.md`

## Verification

- `python governance/compat/check_repository_lifecycle_classification.py --enforce`
- `python governance/compat/check_repository_exposure_classification.py --enforce`
- `python governance/compat/check_prepublic_p3_readiness.py --enforce`
- `python governance/compat/check_docs_governance_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/check_agent_handoff_guard_compat.py --base HEAD --head HEAD --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`

## Final Note

`P3/CP4` does not authorize broader relocation. It only proves that low-footprint private retained roots can be moved safely when the move set is tightly bounded and canon is updated in the same batch.
