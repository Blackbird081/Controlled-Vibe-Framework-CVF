# CVF Pre-Public P3 Readiness Guard

**Control ID:** `GC-039`
**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active pre-public relocation stop-boundary rule.
**Applies to:** any future authorization, planning packet, or execution wave that attempts to open `P3` structural relocation for the repository.
**Enforced by:** `governance/compat/check_prepublic_p3_readiness.py`

## Purpose

- stop `P3` relocation from opening on top of incomplete preparation
- force phase-gate truth, root-file exposure truth, public-docs curation truth, and export-readiness truth to exist before any physical move wave is considered
- keep restructuring aligned with the later publication model instead of treating relocation as an isolated cleanup act

## Rule

Before any `P3` structural relocation authorization proceeds:

- `P0`, `P1`, and `P2` must each be formally closed
- visible root files must be exposure-classified, not only directories
- every `PUBLIC_DOCS_ONLY` root must declare public-content audit status
- every `PUBLIC_EXPORT_CANDIDATE` extension must declare export-readiness status
- the publication decision memo must carry a live re-assessment boundary
- any future physical relocation wave must execute on a dedicated `restructuring/p3-*` branch, not directly on `cvf-next`
- any future physical relocation wave must use a secondary git worktree so structural changes are isolated from the canonical working tree

This guard does not itself authorize `P3`.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_prepublic_p3_readiness.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md`
- `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
- `governance/compat/CVF_ROOT_FOLDER_LIFECYCLE_REGISTRY.json`
- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`

## Final Clause

If `P3` is going to change structure, the repository must first prove it is ready for that conversation.
