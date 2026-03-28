# CVF Active Window Registry Adoption Delta 2026-03-28

Memory class: SUMMARY_RECORD

Status: completed adoption batch that turns canonical active trace/log windows into a registry-governed classified surface instead of a hard-coded protection list.

## Scope

- introduce one canonical active-window registry
- classify all current active windows into grouped management classes
- require future dedicated rotation guards to register their active window in the same model
- feed archive protection directly from the registry rather than from ad-hoc path constants

## Delivered Changes

1. Added machine-readable registry:
   - `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
2. Added grouped management map:
   - `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`
3. Added enforcement gate:
   - `governance/compat/check_active_window_registry.py`
4. Added regression coverage:
   - `governance/compat/test_check_active_window_registry.py`
   - `scripts/test_cvf_active_archive.py`
5. Added new governance control:
   - `governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`
6. Rewired generic archive cleanup:
   - `scripts/cvf_active_archive.py` now reads protected active windows from the registry

## Current Registered Windows

- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md`

## Policy Result

- active-window grouping is now canonical and repo-wide, not a one-off cleanup note
- future dedicated rotation guards are expected to register their active window in the same batch
- generic archive cleanup no longer depends on maintainers remembering to hard-code each new active window manually

## Verification

- `python governance/compat/test_check_active_window_registry.py`
- `python scripts/test_cvf_active_archive.py`
- `python governance/compat/check_active_window_registry.py --enforce`
- `python governance/compat/run_local_governance_hook_chain.py --hook pre-push`
