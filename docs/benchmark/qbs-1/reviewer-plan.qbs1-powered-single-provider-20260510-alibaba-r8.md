# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R8

Status: `PREREGISTERED_QBS18_CALIBRATED_REVIEWER_PLAN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r8`

## Scope

R8 is the post-QBS18 reviewer-plan freeze for the Alibaba/DashScope powered
single-provider lane. It reuses the R7 live execution contract and does not add
a new runtime remediation delta. The intended delta is limited to the scoring
method:

- QBS18 cleaned calibration reference:
  `docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json`
- QBS18 rework-label normalization:
  `docs/benchmark/qbs-1/reviewer-rework-rubric-normalization-qbs18.md`
- QBS18 calibration-only prompt lineage:
  `qbs18-calibration-only-rerun-v1`

## Reviewers

- Reviewer A: model-assisted reviewer `openai:gpt-4o-mini`.
- Reviewer B: model-assisted reviewer `deepseek:deepseek-chat`.

Both reviewer prompts are pinned by prompt version in the scoring command and
recorded in the published reviewer artifact.

## Scoring Command

After the R8 live execution artifact exists and includes a redacted reviewer
output bundle, scoring must use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260510-alibaba-r8 --prompt-version qbs18-calibration-only-rerun-v1 --calibration-anchors docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
```

## Blinding

Output-quality reviewers receive randomized labels per task. They do not see
config names, provider/model identifiers, governance receipts, latency, cost,
or receipt metadata.

Governance, traceability, reliability, and cost axes are computed from
machine-readable R8 artifacts, not from blinded subjective reviewer copies.

## Agreement

Reviewer agreement is computed over ordinal quality scores. Confident aggregate
claims require quadratic-weighted Cohen kappa >= 0.60 or Spearman rho >= 0.60.
If this gate fails, QBS-19 must publish reviewer-agreement failure and no
public QBS score.

## Calibration Boundary

The QBS18 cleaned reference is derived from QBS16 model adjudication plus QBS18
artifact consistency cleanup. It is not a human gold-label set. It may be used
only as reviewer calibration context and claim-gate evidence for reviewer-plan
stability. It must not mutate historical R5/R6/R7 scores.

## Claim Boundary

R8 may only support a public claim if all hard gates, reviewer agreement, and
claim-ladder thresholds pass. Pre-registration alone makes no quality claim.
Family-level, L5, L6, and provider-parity claims remain blocked under the
single-provider run class.
