# QBS-34 Reviewer Completeness Retry Remediation

Status: `QBS34_REVIEWER_COMPLETENESS_RETRY_READY_NO_NEW_SCORE`

QBS-34 implements bounded recovery for reviewer responses that return valid
JSON but omit one or more blinded output aliases. It does not execute a live
QBS run, does not mutate historical scores, and does not make an L4/L5 claim.

## Context

QBS-21 found that a reviewer response could be partial. QBS-22 made this fail
closed, but the retry path still asked the reviewer to score the entire payload
again. That is safe but lossy when only one alias is missing.

## Implementation

- `scripts/score_qbs_model_assisted_reviewers.py` now parses completeness
  validation errors.
- If the only defect is missing aliases, the scorer builds a narrowed retry
  payload containing only those aliases.
- Recovered alias scores are merged with the original valid scores and then
  revalidated against the full alias map.
- If the same missing-alias condition persists after bounded retry, the scorer
  can write a redacted diagnostic JSONL record.
- New CLI:
  - `--missing-alias-retry-attempts`
  - `--completeness-diagnostics-output`

Diagnostic records include task/reviewer/prompt/family metadata, missing
aliases, valid-score count, config/repeat maps, and output lengths. Raw full
outputs are not dumped by default.

## Claim Boundary

This is scoring robustness only. It does not change hard gates, reviewer
quality scores, rework mapping, R5-R9 historical artifacts, or public QBS
quality claims.

## Verification

Commands run:

```bash
python -m py_compile scripts/score_qbs_model_assisted_reviewers.py scripts/test_qbs_reviewer_score_completeness.py
python scripts/test_qbs_reviewer_score_completeness.py
python scripts/score_qbs_model_assisted_reviewers.py --help
```

Results:

- Python compile: PASS
- Reviewer completeness tests: `6 passed / 0 failed`
- Scorer CLI help: PASS, includes missing-alias retry and diagnostics flags

