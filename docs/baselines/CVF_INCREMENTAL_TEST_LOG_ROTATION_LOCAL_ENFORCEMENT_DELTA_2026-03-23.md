# CVF Incremental Test Log Rotation Local Enforcement Delta

Memory class: SUMMARY_RECORD

Status: canonical receipt for bringing the incremental test log rotation guard into the local pre-push hook chain and rotating the active log back under the governed review window.

## Why

- `docs/CVF_INCREMENTAL_TEST_LOG.md` exceeded the governed active-window line threshold.
- The rotation guard already existed and was enforced in CI, but local hook-chain execution did not block pushes before rotation happened.

## What changed

- added `check_incremental_test_log_rotation.py --enforce` to the local pre-push hook chain in `governance/compat/run_local_governance_hook_chain.py`
- rotated `docs/CVF_INCREMENTAL_TEST_LOG.md` using `scripts/rotate_cvf_incremental_test_log.py`
- created the next archive window under `docs/logs/`
- updated the governance control matrix note to reflect local pre-push enforcement

## Outcome

- the active incremental test log is back within governed thresholds
- local pre-push now blocks future overgrowth instead of waiting for CI
- append-only evidence remains recoverable through the archive chain
