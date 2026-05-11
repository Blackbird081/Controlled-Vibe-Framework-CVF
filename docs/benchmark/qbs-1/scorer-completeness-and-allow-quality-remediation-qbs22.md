# QBS-22 Scorer Completeness And ALLOW Quality Remediation

Status: `QBS22_REMEDIATION_COMPLETE_NO_NEW_SCORE`

Date: 2026-05-11

## Scope

QBS-22 remediates the two actionable issues found in QBS-21:

- scorer completeness: one OpenAI reviewer response in R8 omitted alias
  `OUT-04`, producing `431` paired scores instead of `432`;
- governed `CFG-B` ALLOW quality: normal planning, builder handoff,
  documentation, cost/provider, and simple transformation tasks still trailed
  the direct structured baseline.

This is remediation only. It does not execute a live rerun, mutate R8 scores,
or claim QBS quality.

## Scorer Completeness Remediation

`scripts/score_qbs_model_assisted_reviewers.py` now validates every parsed
reviewer response against the full blinded alias map for that task.

The scorer now rejects:

- missing aliases;
- unknown aliases;
- duplicate scored outputs;
- non-list `scores` payloads.

If a reviewer returns an incomplete semantic score set, the scorer retries the
reviewer call with a bounded semantic retry loop. If the response is still
incomplete, scoring fails closed before publishing agreement or scored-results
artifacts.

New targeted test:

`scripts/test_qbs_reviewer_score_completeness.py`

Coverage:

- complete alias set accepted;
- missing alias rejected;
- unknown alias rejected;
- duplicate output rejected.

## Governed ALLOW Output Remediation

`buildExecutionPrompt()` now adds stronger output-contract instructions for
ALLOW-path quality:

- use the same natural language as the user's request unless translation is
  requested;
- preserve requested tone for short rewrites and simple transformations;
- avoid fenced markdown blocks unless the user asks for a file or code block;
- for product briefs, plans, and documentation, include purpose, users, scope,
  key steps/features, success measures, constraints, and next actions;
- for developer handoffs, include scope, likely files/modules, implementation
  notes, tests, security/data considerations, rollback notes, and verification;
- for provider/model tradeoff tasks without measured data or supplied
  candidates, avoid naming a specific provider/model as the final answer and
  provide qualitative lane criteria plus verification steps instead.

This targets the QBS-21 residuals:

- `QBS1-F8-T03`: tone preservation for a friendly rewrite;
- `QBS1-F4-T03`: no unsupported named-model recommendation when asked for
  general tradeoffs;
- `QBS1-F1-T03`: keep the output in the user's language and include product
  brief essentials;
- builder handoff family: add implementable verification/security/rollback
  detail.

## Validation

Targeted validation:

```bash
python scripts/test_qbs_reviewer_score_completeness.py
python -m py_compile scripts/score_qbs_model_assisted_reviewers.py scripts/test_qbs_reviewer_score_completeness.py scripts/analyze_qbs_r8_post_score.py
npm run test:run -- src/lib/execute-prompt-contract.test.ts src/app/api/execute/route.qbs-hard-gates.test.ts
```

Results:

- Python completeness tests: `4 passed`
- Python compile: PASS
- Vitest targeted: `2 files / 9 tests passed`

## Decision

QBS-22 removes the known scorer-completeness defect and adds targeted ALLOW
quality controls. It still does not prove that a future full run will pass
reviewer agreement or L4 thresholds.

The next track may freeze a new run-specific reviewer/execution plan only if it
keeps the same claim gates and explicitly cites QBS-22 as remediation. A future
live rerun must remain no-claim until hard gates, reviewer agreement, and
claim-ladder thresholds all pass.

## Claim Boundary

No public QBS score, L4/L5 claim, family-level claim, or provider-parity claim
is made by QBS-22.
