# CVF v1.7 Runtime Artifact Ignore Delta — 2026-03-23

Memory class: SUMMARY_RECORD
## Purpose

Prevent generated runtime telemetry / audit artifacts under `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE` from repeatedly dirtying the worktree and confusing review cycles.

## Changes

- added explicit `.gitignore` entries for:
  - `cvf_audit.jsonl`
  - `cvf_lessons.json`
  - `cvf_rollback.jsonl`
  - `cvf_telemetry_elegance.jsonl`
  - `cvf_telemetry_mistakes.jsonl`
  - `cvf_telemetry_verification.jsonl`

## Result

- generated operational artifacts remain local-only
- review / commit state is cleaner
- future `W6` and post-cycle reviews are less likely to be polluted by ephemeral runtime files
