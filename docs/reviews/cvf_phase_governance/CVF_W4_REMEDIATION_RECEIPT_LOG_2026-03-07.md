# CVF W4 Remediation Receipt Log - 2026-03-07

## Header

- source artifact: `docs/reviews/cvf_phase_governance/CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json`
- schemaVersion: `2026-03-07`
- adapter: `FILE_BACKED_REMEDIATION_ADAPTER`
- receiptCount: `6`

## Action Summary

- INTERRUPTED: `3`
- RESUMED: `3`

## Step Summary

- mark_runtime_recovery_pending: `1`
- mark_trace_ready_for_append: `1`
- persist_resume_evidence: `1`
- prepare_retry_from_latest_checkpoint: `1`
- schedule_deterministic_replay_verification: `1`
- verify_checkpoint_integrity: `1`

## Proposal Scope

- proposalIds: `proposal-remediation-export-001`
- firstRecordedAt: `1772904960933`
- lastRecordedAt: `1772904960939`

## Receipts

| Receipt ID | Action | Proposal | Step | Recorded At |
|---|---|---|---|---|
| `RESUMED:proposal-remediation-export-001:persist_resume_evidence` | `RESUMED` | `proposal-remediation-export-001` | `persist_resume_evidence` | `1772904960933` |
| `RESUMED:proposal-remediation-export-001:schedule_deterministic_replay_verification` | `RESUMED` | `proposal-remediation-export-001` | `schedule_deterministic_replay_verification` | `1772904960935` |
| `RESUMED:proposal-remediation-export-001:mark_trace_ready_for_append` | `RESUMED` | `proposal-remediation-export-001` | `mark_trace_ready_for_append` | `1772904960936` |
| `INTERRUPTED:proposal-remediation-export-001:verify_checkpoint_integrity` | `INTERRUPTED` | `proposal-remediation-export-001` | `verify_checkpoint_integrity` | `1772904960937` |
| `INTERRUPTED:proposal-remediation-export-001:prepare_retry_from_latest_checkpoint` | `INTERRUPTED` | `proposal-remediation-export-001` | `prepare_retry_from_latest_checkpoint` | `1772904960938` |
| `INTERRUPTED:proposal-remediation-export-001:mark_runtime_recovery_pending` | `INTERRUPTED` | `proposal-remediation-export-001` | `mark_runtime_recovery_pending` | `1772904960939` |
