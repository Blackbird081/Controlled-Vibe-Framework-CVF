# QBS-1 Pre-Registration - Alibaba Powered Single Provider R7

Status: `PREREGISTERED_POST_QBS12_REMEDIATION_RUN_NO_QBS_SCORE`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r7`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r7`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r7
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r7
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r7.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r7.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r7.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_POST_QBS12_REMEDIATION_RUN_NO_QBS_SCORE
parent_scored_run: qbs1-powered-single-provider-20260510-alibaba-r6
post_remediation_packet: docs/benchmark/qbs-1/reviewer-disagreement-remediation-qbs12.md
reviewer_output_bundle_required: true
reviewer_judges:
  - openai:gpt-4o-mini
  - deepseek:deepseek-chat
```

## Rerun Delta

R7 re-executes the R6 reviewer-scoring contract after QBS-12 remediation. The
intended delta is limited to:

- deterministic pre-approval safe work for `NEEDS_APPROVAL` responses;
- security/incident redaction and disclosure skeletons for approval-gated
  security tasks;
- governed prompt constraints that discourage unsupported provider benchmark
  numbers and excess meta-commentary on simple transformations.

No public score is claimed by pre-registration.

## Public/Private Boundary

Public sanitized artifacts will be written under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r7/`

The reviewer bundle may include full generated outputs after secret redaction.
Raw provider request logs, API keys, provider request IDs, and local env details
remain private.
