# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R10

Status: `QBS40_R10_PREREGISTERED_REVIEWER_PLAN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260512-alibaba-r10`

## Scope

R10 is the post-QBS39 rerun candidate for the Alibaba/DashScope powered
single-provider lane. It reuses the R9 corpus, provider/model, repeats,
configuration set, and aggregate-only claim boundary.

The intended delta is limited to QBS-33 through QBS-39 remediation: reviewer
completeness retry, deterministic preflight, QBS36 triangulated calibration
reference, QBS37 diagnostic calibration result, QBS38 governance-family
metadata, and QBS39 family-conditional ALLOW output contracts.

## Reviewers

- Reviewer A: model-assisted reviewer `openai:gpt-4o-mini`.
- Reviewer B: model-assisted reviewer `deepseek:deepseek-chat`.

Reviewer scoring must use:

- prompt version: `qbs40-r10-post-qbs39-scored-run-v1`
- calibration reference:
  `docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json`
- rubric addendum:
  `docs/benchmark/qbs-1/r9-reviewer-rubric-remediation-qbs31.md`

## Scoring Command

After the R10 live execution artifact exists and includes a redacted reviewer
output bundle, scoring must use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260512-alibaba-r10 --prompt-version qbs40-r10-post-qbs39-scored-run-v1 --calibration-anchors docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json --missing-alias-retry-attempts 2 --completeness-diagnostics-output docs/benchmark/runs/qbs1-powered-single-provider-20260512-alibaba-r10/reviewer-completeness-diagnostics.jsonl
```

The scorer must fail closed if any expected alias is missing after bounded
parse and missing-alias retries. Redacted diagnostics may record missing alias
metadata and output lengths, but must not dump raw full outputs by default.

## Blinding

Output-quality reviewers receive randomized labels per task. They do not see
config names, provider/model identifiers, governance receipts, latency, cost,
or receipt metadata.

Governance, traceability, reliability, and cost axes are computed from
machine-readable R10 artifacts, not from blinded subjective reviewer copies.

## Rework Disclosure

R10 reviewer-scoring artifacts must publish both:

- reviewer-supplied rework labels, preserving R6-R9 comparability;
- derived rework labels from the QBS31 quality-to-rework mapping.

The scored-run claim gate remains reviewer-rework-based unless a later public
methodology change explicitly revises the gate.

## Agreement

Reviewer agreement is computed over ordinal quality scores. Confident aggregate
claims require quadratic-weighted Cohen kappa >= 0.60 or Spearman rho >= 0.60.
If this gate fails, R10 must publish reviewer-agreement failure and no public
QBS score.

## Claim Boundary

R10 may only support a public claim if all hard gates, reviewer agreement, and
claim-ladder thresholds pass. Pre-registration alone makes no quality claim.
Family-level, L5, L6, provider-parity, and human-gold claims remain blocked
under the single-provider run class and model-only adjudication boundary.
