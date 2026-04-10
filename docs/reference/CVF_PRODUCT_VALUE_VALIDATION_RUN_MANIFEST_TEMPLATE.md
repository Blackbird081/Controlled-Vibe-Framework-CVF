# CVF Product Value Validation Run Manifest Template

Memory class: POINTER_RECORD

> Purpose: execution manifest template for a governed comparative validation run
> Default output memory class for a filled run manifest: `FULL_RECORD`
> Rule: every scored run must be traceable from corpus → configuration → output → reviewer verdict

---

## 1. Run Set Metadata

- Run set ID:
- Date:
- Corpus ID:
- Rubric ID:
- Assessment target:
- Owner:
- Execution window:
- Run state: `PLANNED` | `IN_PROGRESS` | `COMPLETE` | `INVALIDATED`

## 2. Compared Configurations

| Configuration ID | Label | Description | Model/version | Notes |
|---|---|---|---|---|
| `CFG-A` | Direct baseline |  |  |  |
| `CFG-B` | CVF governed path |  |  |  |
| `CFG-C` | Optional diagnostic mode |  |  |  |

## 3. Freeze Checklist

- [ ] corpus frozen
- [ ] rubric frozen
- [ ] compared configurations frozen
- [ ] task IDs locked
- [ ] reviewer pool assigned
- [ ] evidence retention path declared

If any box is unchecked, the run set is not valid for final scoring.

## 4. Execution Rules

- runs per task per configuration:
- timeout / retry rule:
- prompt mutation rule:
- output capture rule:
- trace capture rule:
- failed-run rerun rule:
- reviewer assignment rule:

## 5. Evidence Completeness Requirements

Every run must include:

- task ID
- configuration ID
- run ID
- trace ID
- raw input
- raw output
- timestamps
- governance events
- reviewer verdict
- failure taxonomy

## 6. Run Record Template

```text
### Run: <RUN-ID>

- task_id:
- configuration_id:
- trace_id:
- started_at:
- completed_at:
- execution_status: `SUCCESS` | `FAILED` | `TIMEOUT` | `INVALID`
- raw_output_path:
- trace_path:
- governance_log_path:
- reviewer_verdict_path:
- evidence_complete: `YES` | `NO`
- rerun_of:
- notes:
```

## 7. Reviewer Assignment Table

| Reviewer ID | Task scope | Blind status | Escalation role |
|---|---|---|---|
| `REV-001` |  | `BLINDED` | `PRIMARY` |
| `REV-002` |  | `BLINDED` | `SECONDARY` |

## 8. Invalidating Conditions

- corpus changes after freeze
- rubric changes after freeze
- missing evidence for any scored run
- configuration drift not disclosed
- reviewer identity leakage into blinded scoring that materially affects the result

## 9. Evidence Ledger

- corpus packet:
- rubric packet:
- raw run storage:
- reviewer packet:
- final assessment:

