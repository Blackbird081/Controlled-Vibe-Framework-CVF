# CVF Guard Registry Guard

**Guard Class:** `META_GUARD`
**Status:** Active mandatory discoverability rule for governance guard surfaces.
**Applies to:** All humans and AI agents creating, renaming, deleting, or materially revising guard files in `governance/toolkit/05_OPERATION/`.
**Enforced by:** `governance/compat/check_guard_registry.py`

## Purpose

- keep every active guard discoverable from the repo front door
- prevent orphaned guard files that exist on disk but are invisible in README or the knowledge base
- ensure guard creation and maintenance stay synchronized with the human-readable guard index

## Rule

When a guard file is created, renamed, deleted, or materially revised in `governance/toolkit/05_OPERATION/`, the same change batch MUST keep registration truthful in both of these locations:

- `README.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`

Minimum registration checklist:

1. the guard file exists with its final filename
2. the filename appears in `README.md`
3. the filename appears in `docs/CVF_CORE_KNOWLEDGE_BASE.md`
4. registration changes ship in the same commit batch as the guard change

This registry rule governs discoverability only. It complements, but does not replace, the stronger guard authoring contract in `GC-030`.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_guard_registry.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

The registry gate intentionally checks the complete on-disk guard inventory instead of trusting a hand-maintained count inside this document.

## Related Artifacts

- `README.md`
- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md`
- `governance/compat/check_guard_registry.py`

## Final Clause

A guard that cannot be discovered cannot be relied on.

Registration is the minimum truth layer for every guard: if a worker cannot find it from the repo front door, governance has already drifted.
