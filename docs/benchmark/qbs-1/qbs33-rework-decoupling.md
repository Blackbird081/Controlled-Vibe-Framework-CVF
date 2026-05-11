# QBS-33 Rework Decoupling Remediation

Status: `QBS33_REWORK_DECOUPLING_READY_NO_NEW_SCORE`

QBS-33 implements the first remediation tranche after the QBS-32 calibration
failure. It changes scoring support only; it does not execute a live QBS run,
does not mutate historical scores, and does not make an L4/L5 claim.

## Decision

QBS-31 established a universal quality-to-rework mapping:

| Raw quality | Derived rework |
| ---: | --- |
| `0` | `REJECT` |
| `1` | `HEAVY` |
| `2` | `HEAVY` |
| `3` | `LIGHT` |
| `4` | `NONE` |

Codex reviewed the QBS-28 cleaned reference and found `0` mapping exceptions
across all 35 anchors. That supports a derived-rework view for calibration, but
not a silent scored-run gate change.

## Implementation

- `scripts/check_qbs_reviewer_calibration_agreement.py` now accepts
  `--rework-mode {reviewer,derived}`.
- `reviewer` mode preserves historical reviewer-supplied labels.
- `derived` mode evaluates rework match using the QBS-31 mapping from the
  reviewer's raw quality score.
- `scripts/score_qbs_model_assisted_reviewers.py` now records both
  `reviewer_rework` and `derived_rework` for every reviewer score.
- Scored-run artifacts expose both rework views, but the claim gate remains
  reviewer-rework-based for R6-R9 comparability.

## Claim Boundary

QBS-33 does not claim that derived rework is a better ground truth. It is a
calibration transparency view used to separate quality agreement from unstable
reviewer-labeled rework. Any future R10 pre-registration must disclose that
reviewer rework remains the claim gate and derived rework is published only as
an additional view.

## Verification

Commands run:

```bash
python -m py_compile scripts/score_qbs_model_assisted_reviewers.py scripts/check_qbs_reviewer_calibration_agreement.py scripts/test_qbs_reviewer_score_completeness.py
python scripts/test_qbs_reviewer_score_completeness.py
python scripts/check_qbs_reviewer_calibration_agreement.py --help
```

Results:

- Python compile: PASS
- Reviewer completeness tests: `5 passed / 0 failed`
- Calibration agreement CLI help: PASS, includes `--rework-mode`

