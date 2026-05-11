# QBS-35 Live Run Preflight Remediation

Status: `QBS35_LIVE_RUN_PREFLIGHT_READY_NO_NEW_SCORE`

QBS-35 adds deterministic env/key/workspace preflight for QBS live execution,
reviewer scoring, calibration-only review, and anchor adjudication entry
points. It does not execute a live QBS run, does not mutate historical scores,
and does not make an L4/L5 claim.

## Context

QBS-20 exposed a near-miss where key lookup checked the wrong local env
locations before the operator corrected the command. QBS-35 moves that
boundary into shared tooling so live/reviewer/adjudicator scripts fail early
and do not print raw key values.

## Implementation

New shared script/module:

- `scripts/preflight_qbs_live_run.py`

Wired entry points:

- `scripts/run_qbs_powered_single_provider.py`
- `scripts/score_qbs_model_assisted_reviewers.py`
- `scripts/check_qbs_reviewer_calibration_agreement.py`
- `scripts/adjudicate_qbs_calibration_anchors.py`

Preflight behavior:

- Verifies public-sync remote before public artifact scripts proceed.
- Resolves the canonical provenance package env file when `--env-file` is not
  supplied:
  `Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local`
- Fails if an explicit `--env-file` resolves inside the public-sync clone.
- Prints only `PRESENT` or `MISSING` for key aliases, never raw values.
- Supports CLI self-test and JSON summary output.

## Claim Boundary

This is operational hardening only. It does not change QBS score logic,
reviewer scoring, adjudication references, or public quality claims.

## Verification

Commands run:

```bash
python -m py_compile scripts/preflight_qbs_live_run.py scripts/run_qbs_powered_single_provider.py scripts/score_qbs_model_assisted_reviewers.py scripts/check_qbs_reviewer_calibration_agreement.py scripts/adjudicate_qbs_calibration_anchors.py
python scripts/preflight_qbs_live_run.py --label qbs35-self-test --json
python scripts/preflight_qbs_live_run.py --label qbs35-public-env-negative --env-file .env.local
python scripts/run_qbs_powered_single_provider.py --help
python scripts/adjudicate_qbs_calibration_anchors.py --help
```

Results:

- Python compile: PASS
- Self-test: PASS; resolved the provenance package-local env file
- Negative public-sync env-file test: PASS by failing closed
- CLI help checks: PASS

