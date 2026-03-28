# CVF Active Window Classification

Memory class: POINTER_RECORD

Status: canonical grouped management map for all active trace/log windows protected from generic archive cleanup.

## Purpose

- classify every canonical active trace/log window into stable management groups
- give archive tooling, rotation guards, and future contributors one shared source of truth
- keep active-window protection scalable as CVF adds more evidence chains

## Canonical Registry

Machine-readable source:

- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`

Governance gate:

- `governance/compat/check_active_window_registry.py`

Generic archive consumer:

- `scripts/cvf_active_archive.py`

## Group Map

| Window Class | Purpose | Typical shape | Current windows |
|---|---|---|---|
| `GLOBAL_APPEND_ONLY_LOG_WINDOW` | cross-cutting operational log window shared across repo-wide evidence workflows | active file at `docs/` root, archive chain in `docs/logs/` | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| `SCOPED_APPEND_ONLY_TRACE_WINDOW` | scope-local trace window owned by one review or governance scope | active file near the scope, archive chain in scoped `logs/` folder | `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` |

## Registration Rule

Every dedicated rotation guard that defines a canonical active window must register that window in the active-window registry in the same change batch.

Registration is not optional because the registry drives:

- archive protection
- grouped management
- future auditability of active-window growth

## Management Rules

### `GLOBAL_APPEND_ONLY_LOG_WINDOW`

- use for shared log windows that many workflows may reference
- archive target should stay under `docs/logs/`
- these windows are usually high-traffic and cross-cutting

### `SCOPED_APPEND_ONLY_TRACE_WINDOW`

- use for scope-local traces that belong to one review, plane, or module lineage
- archive target should stay beside the active scope under a scoped `logs/` folder
- these windows should not be mixed into unrelated global archive chains

## Related Artifacts

- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `governance/compat/check_active_window_registry.py`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
- `scripts/cvf_active_archive.py`

## Final Clause

Active windows are not just big files. They are governed operational surfaces and must be grouped, registered, and protected as such.
