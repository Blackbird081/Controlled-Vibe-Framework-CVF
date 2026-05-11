# QBS-1 Reviewer Plan - Alibaba Powered Single Provider R9

Status: `PREREGISTERED_POST_QBS22_REMEDIATION_REVIEWER_PLAN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260511-alibaba-r9`

## Scope

R9 is the post-QBS22 remediation rerun for the Alibaba/DashScope powered
single-provider lane. It reuses the R8 corpus, provider/model, repeats,
configuration set, and claim gates.

The intended delta is limited to:

- scorer completeness hardening: every reviewer response must cover every
  blinded alias or fail closed/retry before agreement artifacts are published;
- governed `CFG-B` ALLOW output-quality prompt constraints for language
  preservation, tone preservation, builder-handoff specificity, product/docs
  completeness, and provider/model tradeoff boundaries.

## Reviewers

- Reviewer A: model-assisted reviewer `openai:gpt-4o-mini`.
- Reviewer B: model-assisted reviewer `deepseek:deepseek-chat`.

Reviewer scoring must use:

- prompt version: `qbs18-calibration-only-rerun-v1`
- calibration reference:
  `docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json`

## Scoring Command

After the R9 live execution artifact exists and includes a redacted reviewer
output bundle, scoring must use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260511-alibaba-r9 --prompt-version qbs18-calibration-only-rerun-v1 --calibration-anchors docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
```

The scorer must fail closed if any expected alias is missing after bounded
semantic retries.

## Blinding

Output-quality reviewers receive randomized labels per task. They do not see
config names, provider/model identifiers, governance receipts, latency, cost,
or receipt metadata.

Governance, traceability, reliability, and cost axes are computed from
machine-readable R9 artifacts, not from blinded subjective reviewer copies.

## Agreement

Reviewer agreement is computed over ordinal quality scores. Confident aggregate
claims require quadratic-weighted Cohen kappa >= 0.60 or Spearman rho >= 0.60.
If this gate fails, QBS-24 must publish reviewer-agreement failure and no
public QBS score.

## Claim Boundary

R9 may only support a public claim if all hard gates, reviewer agreement, and
claim-ladder thresholds pass. Pre-registration alone makes no quality claim.
Family-level, L5, L6, and provider-parity claims remain blocked under the
single-provider run class.
