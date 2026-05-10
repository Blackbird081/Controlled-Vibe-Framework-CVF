# QBS-1 Pre-Registration - Alibaba Powered Single Provider R5

Status: `PREREGISTERED_REVIEWER_SCORING_RUN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r5`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r5`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r5
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r5
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r5.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r5.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r5.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_REVIEWER_SCORING_RUN_NO_QBS_SCORE
parent_hard_gate_run: qbs1-powered-single-provider-20260510-alibaba-r4
reviewer_output_bundle_required: true
reviewer_judges:
  - openai:gpt-4o-mini
  - deepseek:deepseek-chat
```

## Rerun Delta

R5 re-executes the R4 hard-gate-passing run-set with a public
`redacted-reviewer-output-bundle.json` so QBS9 can score full generated outputs
instead of short previews.

## Public/Private Boundary

Public sanitized artifacts will be written under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r5/`

The reviewer bundle may include full generated outputs after secret redaction.
Raw provider request logs, API keys, provider request IDs, and local env details
remain private.
