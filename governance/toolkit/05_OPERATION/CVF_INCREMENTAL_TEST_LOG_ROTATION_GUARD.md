# CVF Incremental Test Log Rotation Guard

**Guard Class:** `DOCS_AND_MEMORY_HYGIENE_GUARD`
**Status:** Active rotation contract for the canonical incremental test log window.
**Applies to:** `docs/CVF_INCREMENTAL_TEST_LOG.md` and `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_*.md`.
**Enforced by:** `governance/compat/check_incremental_test_log_rotation.py`, `governance/compat/check_active_window_registry.py`, `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`

## Purpose

- keep the active test log readable for human audit and focused regression review
- preserve append-only traceability without letting a single file grow forever
- maintain a clear split between the current working window and archived historical windows

## Rule

`docs/CVF_INCREMENTAL_TEST_LOG.md` remains the canonical entrypoint, active working window, and archive index. Rotate the active file when either threshold is exceeded:

- active file line count `> 3000`
- active batch count `> 100`

### Canonical Model

Historical windows move to:

- `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md`

The active file stays the first file every tester must read.

### Post-Rotation Target

After rotation:

- the active file SHOULD retain the current rules and preamble
- the active execution window SHOULD be reduced to the most recent working set
- the active execution window MUST be no larger than:
  - `40` most recent batches, or
  - the configured keep window used by the rotation utility

### Archive Location And Naming

Approved archive location:

- `docs/logs/`

Required filename pattern:

```text
CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md
```

Do not create ad-hoc filenames such as `old_test_log.md`, `test_log_backup.md`, or `CVF_INCREMENTAL_TEST_LOG_old.md`.

### Required Workflow

1. run `python scripts/rotate_cvf_incremental_test_log.py`
2. verify the active file still contains purpose, rules, archive index, and newest active batches
3. verify the archive file was created under `docs/logs/`
4. run `python governance/compat/check_incremental_test_log_rotation.py --enforce`
5. if the same batch also ran tests, update the active log window in the same batch

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_incremental_test_log_rotation.py`
- active-window registration and archive-protection sync are enforced through `governance/compat/check_active_window_registry.py`
- the guard blocks unrotated oversized active logs, broken archive placement, and non-canonical archive naming
- remediation requires rotating the log, preserving the archive index, and keeping the active window reviewable

Strict command:

```bash
python governance/compat/check_incremental_test_log_rotation.py --enforce
```

Violations include:

- letting the active file exceed threshold without rotation
- moving history out of the active file without adding an archive index
- creating archive files outside `docs/logs/`
- creating archive files with non-CVF naming

## Related Artifacts

- `governance/compat/check_incremental_test_log_rotation.py`
- `governance/compat/check_active_window_registry.py`
- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `scripts/rotate_cvf_incremental_test_log.py`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/logs/`

## Final Clause

CVF keeps evidence append-only by chain, not by forcing one file to grow forever. The active log must stay reviewable and the archive must stay recoverable.
