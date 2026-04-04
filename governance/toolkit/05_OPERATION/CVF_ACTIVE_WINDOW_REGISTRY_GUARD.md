# CVF Active Window Registry Guard

**Control ID:** `GC-031`
**Guard Class:** `META_GUARD`
**Status:** Active registry contract for canonical active trace/log windows protected from generic archive cleanup.
**Applies to:** All humans and AI agents creating, revising, or relying on dedicated rotation guards, canonical active windows, and generic archive-cleanup tooling.
**Enforced by:** `governance/compat/check_active_window_registry.py`, `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`, `scripts/cvf_active_archive.py`

## Purpose

- classify every canonical active trace/log window into a durable management group
- ensure every dedicated rotation guard registers its active window in one machine-readable registry
- guarantee generic archive cleanup protects canonical active windows automatically instead of relying on ad-hoc hard-coded exceptions

## Rule

Every canonical active trace/log window owned by a dedicated rotation guard MUST be registered in `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`.

This registry is the canonical source for:

1. active-window classification
2. protected-path sync into generic archive cleanup
3. future review of which windows are operational inputs versus archive candidates

### Mandatory Registry Fields

Each registered active window MUST declare:

- `id`
- `windowClass`
- `activePath`
- `archiveDir`
- `archivePattern`
- `rotationGuard`
- `rotationCheck`
- `rotationScript`
- `protectionMode`
- `status`

### Required Operating Rule

If a new or materially revised rotation guard creates or changes a canonical active window, the same batch MUST also:

1. register or update the active window in `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
2. keep the corresponding active window protected in `scripts/cvf_active_archive.py` through the registry-fed protection model
3. update `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`

Failing any of these means the active window is not governance-complete.

### Baseline Protection Rule

Existing registry entries are protected governance state. They must not be silently mutated or removed in the normal commit path.

Additive registration of genuinely new active windows is allowed, but existing protected active-window records require explicit reviewed governance change.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_active_window_registry.py`
- generic archive cleanup consumes the protected active-window set through `scripts/cvf_active_archive.py`
- local pre-push and CI must reject rotation-guard changes that are not reflected in the active-window registry and classification map

## Related Artifacts

- `governance/compat/check_active_window_registry.py`
- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`

## Final Clause

If CVF cannot name and classify its active windows canonically, generic cleanup will eventually treat operational truth as disposable history.
