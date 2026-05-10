# QBS-1 Pre-Registration - Alibaba Powered Single Provider R8

Status: `PREREGISTERED_POST_QBS18_CALIBRATION_RUN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r8`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r8`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r8
run_class: POWERED_SINGLE_PROVIDER
criteria_version: public-qbs-methodology-v2
corpus_version: qbs1-powered-single-provider-corpus-v1-2026-05-10
provider: alibaba
model: qwen-turbo
configs:
  - CFG-A0
  - CFG-A1
  - CFG-B
repeat_count: 3
task_count: 48
planned_configuration_executions: 432
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r8
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r8.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r8.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r8.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_POST_QBS18_CALIBRATION_RUN_NO_QBS_SCORE
parent_scored_run: qbs1-powered-single-provider-20260510-alibaba-r7
post_calibration_packet: docs/benchmark/qbs-1/reviewer-calibration-cleanup-and-rerun-qbs18.md
reviewer_output_bundle_required: true
reviewer_prompt_version: qbs18-calibration-only-rerun-v1
reviewer_calibration_reference: docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
reviewer_judges:
  - openai:gpt-4o-mini
  - deepseek:deepseek-chat
```

## Rerun Delta

R8 reuses the R7 live execution contract. The intended delta is limited to the
reviewer plan and scoring calibration:

- reviewer prompt lineage is frozen to `qbs18-calibration-only-rerun-v1`;
- calibration context uses the QBS18 cleaned reference;
- rework labels use the QBS18 normalization boundary;
- no historical R5/R6/R7 scores are changed.

No public score is claimed by pre-registration.

## Public/Private Boundary

Public sanitized artifacts will be written under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r8/`

The reviewer bundle may include full generated outputs after secret redaction.
Raw provider request logs, API keys, provider request IDs, and local env details
remain private.

## Live-Run Boundary

The pre-registration tag only freezes the plan. The live run still requires an
operator-supplied DashScope-compatible key and explicit live-cost approval via
the runner command.
