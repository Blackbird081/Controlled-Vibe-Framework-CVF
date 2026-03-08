# CVF INCREMENTAL TEST LOG ROTATION GUARD

> **Type:** Governance Guard  
> **Effective:** 2026-03-07  
> **Status:** Active  
> **Applies to:** `docs/CVF_INCREMENTAL_TEST_LOG.md` and `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_*.md`  
> **Enforced by:** `governance/compat/check_incremental_test_log_rotation.py`

---

## 1. PURPOSE

`CVF_INCREMENTAL_TEST_LOG.md` must remain readable enough for:

- human audit,
- focused regression selection,
- skip-scope review,
- release evidence reconstruction.

CVF requires append-only traceability, but append-only does not mean unlimited growth in a single active file.

This guard standardizes when the active test log must be rotated and where historical windows must be archived.

---

## 2. CANONICAL MODEL

`docs/CVF_INCREMENTAL_TEST_LOG.md` remains the canonical:

- entrypoint,
- active working window,
- archive index.

Historical windows move to:

- `docs/logs/CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md`

The active file is still the first file every tester must read.

---

## 3. ROTATION THRESHOLDS

> **NON-NEGOTIABLE:**  
> Rotate the active incremental test log when either threshold is exceeded:

- active file line count `> 3000`
- active batch count `> 100`

These thresholds are chosen to preserve:

- fast manual review,
- grep/navigation speed,
- lower audit fatigue,
- lower chance of missing a recent batch in long evidence chains.

---

## 4. POST-ROTATION TARGET

After rotation:

- the active file SHOULD retain the current rules/preamble,
- the active execution window SHOULD be reduced to the most recent working set,
- the active execution window MUST be no larger than:
  - `40` most recent batches, or
  - the configured keep window used by the rotation utility.

The purpose is not to compress evidence, but to keep the active decision surface small enough for repeated daily use.

---

## 5. ARCHIVE LOCATION AND NAMING

Approved archive location:

- `docs/logs/`

Required archive filename pattern:

```text
CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md
```

Examples:

- `CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md`
- `CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_02.md`

Do not create ad-hoc filenames such as:

- `old_test_log.md`
- `test_log_backup.md`
- `CVF_INCREMENTAL_TEST_LOG_old.md`

---

## 6. REQUIRED ROTATION WORKFLOW

When threshold is reached:

1. run the rotation utility:
   - `python scripts/rotate_cvf_incremental_test_log.py`
2. verify the active file still contains:
   - purpose/rules,
   - archive index,
   - newest active batches
3. verify archive file was created under `docs/logs/`
4. run the rotation guard:
   - `python governance/compat/check_incremental_test_log_rotation.py --enforce`
5. if the batch also ran tests, update the active log window in the same batch

---

## 7. ENFORCEMENT

Violations include:

- letting the active file exceed the threshold without rotation,
- moving history out of the active file without adding an archive index,
- creating archive files outside `docs/logs/`,
- creating archive files with non-CVF naming.

### Automated Check

```bash
# Advisory
python governance/compat/check_incremental_test_log_rotation.py

# Strict
python governance/compat/check_incremental_test_log_rotation.py --enforce
```

---

## 8. FINAL CLAUSE

CVF keeps evidence append-only by chain, not by forcing one file to grow forever.

The active log must stay reviewable.
The archive must stay recoverable.
