# CVF Guard Hardening Batch 2 + Rapid Audit Delta (2026-03-27)

Memory class: SUMMARY_RECORD
## Purpose

- harden the next known class of self-authorization gaps after the GC-023 incident
- close local enforcement blind spots where key guard checks existed in CI but not in the repo-managed pre-push chain
- leave one canonical rapid-audit record so future guard work starts from a known threat model instead of re-discovering the same bypass pattern

## Batch 2 Hardening

This batch hardens three additional mutable-registry guard surfaces:

- `governance/compat/check_python_automation_size.py`
- `governance/compat/check_test_partition_ownership.py`
- `governance/compat/check_progress_tracker_sync.py`

### New rule applied

For mutable registry-driven guards, existing protected baseline entries must not be silently rewritten in the normal commit path.

Applied outcomes:

- Python automation size:
  - threshold changes from baseline are blocked
  - existing exception mutations/removals are blocked
  - new exception entries are blocked in the normal path
- Test partition ownership:
  - existing partition mutations/removals are blocked
  - additive new partitions remain allowed
- Progress tracker sync:
  - existing workline mutations/removals are blocked
  - additive new worklines remain allowed
  - invalid registry regexes now fail closed

## Enforcement Coverage Tightening

The repo-managed local pre-push chain now also runs:

- `check_guard_registry.py`
- `check_guard_contract_compat.py`

CI now also runs:

- `check_python_automation_size.py` remains canonical CI enforcement until legacy soft-threshold debt is explicitly reconciled
- `check_guard_registry.py`

## Rapid Audit Method

Quick review heuristic used in this batch:

1. identify guards that trust mutable registry/config files directly from current state
2. check whether those guards compare against a protected baseline or a governed diff range
3. check whether they are enforced in at least one canonical local hook path and CI when appropriate
4. add regression tests for every newly hardened bypass pattern

## Rapid Audit Result

### Lower-risk guard shape

Diff/range-based compat guards are less exposed to the exact GC-023 failure mode because they evaluate changed ranges rather than trusting a mutable registry alone.

Examples:

- docs governance compat
- baseline update compat
- bug/test documentation compat
- depth-audit continuation compat
- multi-agent review compat
- boardroom runtime compat

### Higher-risk guard shape

Mutable-registry or mutable-threshold guards required explicit hardening because the guard can otherwise be weakened by editing its own source-of-truth in the same change set.

Hardened in this wave:

- governed file-size exception registry (`GC-023`, prior batch)
- Python automation size exception registry
- test partition ownership registry (`GC-024`)
- progress tracker sync registry (`GC-026`)

### Coverage gaps closed

- guard registry compatibility is now enforced in CI and the local pre-push chain
- cross-channel guard contract compat is now enforced in the local pre-push chain instead of CI only

### Coverage gap intentionally left visible

- Python automation size is hardened against registry self-authorization, but local pre-push enforcement was not enabled in this batch because the current repo still carries legacy soft-threshold debt in governed Python files without exception trail. CI remains the canonical enforcement surface until that debt is reconciled.

## Forward Rule

From this delta onward, any new guard that depends on a mutable registry or threshold file should ship with all of:

- protected-baseline comparison or diff-range enforcement
- regression tests for self-authorization attempts
- local hook-chain coverage where the control is meant to block before push
- CI coverage when the control protects repository truth beyond one local machine
