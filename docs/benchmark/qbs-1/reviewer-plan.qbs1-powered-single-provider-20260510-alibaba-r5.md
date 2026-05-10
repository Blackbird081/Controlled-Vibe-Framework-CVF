# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R5

Status: `PREREGISTERED_REVIEWER_SCORING_PLAN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r5`

## Scope

R5 is the reviewer-scoring run-set for QBS9. It re-executes the R4
hard-gate-passing contract while retaining a public redacted output bundle for
scoring.

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
machine-readable R5 artifacts, not from blinded subjective reviewer copies.

## Agreement

Reviewer agreement is computed over ordinal quality scores. Confident aggregate
claims require quadratic-weighted Cohen kappa >= 0.60 or Spearman rho >= 0.60.
If this gate fails, QBS9 must publish `REVIEWER_AGREEMENT_INSUFFICIENT` and no
public QBS score.
