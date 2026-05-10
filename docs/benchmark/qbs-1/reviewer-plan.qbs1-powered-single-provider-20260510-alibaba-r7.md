# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R7

Status: `PREREGISTERED_REVIEWER_SCORING_PLAN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r7`

## Scope

R7 is the post-QBS12 remediation reviewer-scoring run-set. It re-executes the
R6 contract after bounded improvements to approval-gated preparation output and
governed prompt directness/unsupported-metric constraints.

## Reviewers

- Reviewer A: model-assisted reviewer `openai:gpt-4o-mini`.
- Reviewer B: model-assisted reviewer `deepseek:deepseek-chat`.

Both reviewer prompts are pinned in the scoring script and recorded in the
published reviewer artifact.

## Blinding

Output-quality reviewers receive randomized labels per task. They do not see
config names, provider/model identifiers, governance receipts, latency, cost,
or receipt metadata.

Governance, traceability, reliability, and cost axes are computed from
machine-readable R7 artifacts, not from blinded subjective reviewer copies.

## Agreement

Reviewer agreement is computed over ordinal quality scores. Confident aggregate
claims require quadratic-weighted Cohen kappa >= 0.60 or Spearman rho >= 0.60.
If this gate fails, QBS-13 must publish `REVIEWER_AGREEMENT_INSUFFICIENT` and
no public QBS score.

## Claim Boundary

R7 may only support a public claim if all hard gates, reviewer agreement, and
claim-ladder thresholds pass. Pre-registration alone makes no quality claim.
