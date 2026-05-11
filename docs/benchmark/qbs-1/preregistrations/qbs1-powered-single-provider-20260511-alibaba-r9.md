# QBS-1 Pre-Registration - Alibaba Powered Single Provider R9

Status: `PREREGISTERED_POST_QBS22_REMEDIATION_RUN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260511-alibaba-r9`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260511-alibaba-r9`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260511-alibaba-r9
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260511-alibaba-r9
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260511-alibaba-r9.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260511-alibaba-r9.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260511-alibaba-r9.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_POST_QBS22_REMEDIATION_RUN_NO_QBS_SCORE
parent_scored_run: qbs1-powered-single-provider-20260510-alibaba-r8
post_remediation_packet: docs/benchmark/qbs-1/scorer-completeness-and-allow-quality-remediation-qbs22.md
reviewer_output_bundle_required: true
reviewer_prompt_version: qbs18-calibration-only-rerun-v1
reviewer_calibration_reference: docs/benchmark/qbs-1/reviewer-calibration-reference-qbs18.json
reviewer_judges:
  - openai:gpt-4o-mini
  - deepseek:deepseek-chat
```

## Rerun Delta

R9 reuses the R8 live execution contract. The intended delta is limited to:

- scorer completeness fail-closed/retry behavior for missing reviewer aliases;
- governed `CFG-B` ALLOW output-quality prompt constraints after QBS-22.

No public score is claimed by pre-registration.

## Public/Private Boundary

Public sanitized artifacts will be written under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260511-alibaba-r9/`

The reviewer bundle may include full generated outputs after secret redaction.
Raw provider request logs, API keys, provider request IDs, and local env details
remain private.
