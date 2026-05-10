# QBS-19 R8 Reviewer Plan Freeze

Status: `QBS19_R8_PREREGISTERED_NO_SCORED_RUN`

QBS-19 freezes the run-specific reviewer plan for the next Alibaba/DashScope
powered single-provider run, R8. This packet does not execute a live run and
does not claim a QBS score.

## Inputs Frozen

- Run ID: `qbs1-powered-single-provider-20260510-alibaba-r8`
- Required tag:
  `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r8`
- Corpus: `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Config manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r8.json`
- Provider/model manifest:
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r8.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r8.md`
- Artifact root:
  `docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r8/`

## Reviewer Calibration Lineage

R8 uses the QBS18 reviewer calibration cleanup as scoring context:

- prompt version: `qbs18-calibration-only-rerun-v1`
- cleaned reference:
  `docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json`
- rework rubric normalization:
  `docs/benchmark/qbs-1/reviewer-rework-rubric-normalization-qbs18.md`

The QBS18 calibration-only rerun passed with weighted kappa
`0.9046321525885559` and Spearman rho `0.9219234991142461`. The reference is
still model-assisted calibration context, not human gold-label review.

## Execution Boundary

R8 may be executed only after the pre-registration tag points to the freeze
commit. The live run must use:

```bash
python scripts/run_qbs_powered_single_provider.py --run-id qbs1-powered-single-provider-20260510-alibaba-r8 --confirm-live-cost --retain-redacted-outputs
```

Reviewer scoring must then use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260510-alibaba-r8 --prompt-version qbs18-calibration-only-rerun-v1 --calibration-anchors docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
```

## Claim Boundary

No public QBS score, L4/L5 claim, family-level claim, or provider-parity claim
is made by QBS-19. Any future claim requires R8 live execution, hard-gate pass,
reviewer agreement pass, and claim-ladder threshold pass without loosening
thresholds.
