# QBS-23 R9 Pre-Registration

Status: `QBS23_R9_PREREGISTERED_NO_SCORED_RUN`

QBS-23 freezes the post-QBS22 R9 rerun plan. This packet does not execute a
live run and does not claim a QBS score.

## Inputs Frozen

- Run ID: `qbs1-powered-single-provider-20260511-alibaba-r9`
- Required tag:
  `qbs/preregister/qbs1-powered-single-provider-20260511-alibaba-r9`
- Corpus: `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Config manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260511-alibaba-r9.json`
- Provider/model manifest:
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260511-alibaba-r9.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260511-alibaba-r9.md`
- Artifact root:
  `docs/benchmark/runs/qbs1-powered-single-provider-20260511-alibaba-r9/`

## Remediation Lineage

R9 cites:

- QBS-21 R8 post-score analysis:
  `docs/benchmark/qbs-1/r8-post-score-analysis-qbs21.md`
- QBS-22 scorer completeness and ALLOW quality remediation:
  `docs/benchmark/qbs-1/scorer-completeness-and-allow-quality-remediation-qbs22.md`
- QBS18 cleaned calibration reference:
  `docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json`

## Execution Boundary

R9 may be executed only after the pre-registration tag points to the freeze
commit. The live run must use:

```bash
python scripts/run_qbs_powered_single_provider.py --run-id qbs1-powered-single-provider-20260511-alibaba-r9 --confirm-live-cost --retain-redacted-outputs
```

Reviewer scoring must then use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260511-alibaba-r9 --prompt-version qbs18-calibration-only-rerun-v1 --calibration-anchors docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
```

## Claim Boundary

No public QBS score, L4/L5 claim, family-level claim, or provider-parity claim
is made by QBS-23. Any future claim requires R9 live execution, hard-gate pass,
reviewer agreement pass, and claim-ladder threshold pass without loosening
thresholds.
