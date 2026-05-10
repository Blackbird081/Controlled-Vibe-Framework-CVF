# QBS-1 Pre-Registration - Alibaba Powered Single Provider R4

Status: `PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r4`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r4`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r4
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r4
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r4.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r4.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r4.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN
parent_failed_run: qbs1-powered-single-provider-20260510-alibaba
supersedes_unexecuted_or_invalid_runs:
  - qbs1-powered-single-provider-20260510-alibaba-r2
  - qbs1-powered-single-provider-20260510-alibaba-r3
remediation_track: QBS8-RERUN-EXECUTION
```

## Rerun Delta

R4 re-freezes the live rerun target after two bounded fixes discovered during
R3 diagnostics:

- R2/R3-style F7 rows now use the front-door clarification path for any rerun
  suffix `-r2` or later.
- R3 prohibited secret/bypass/hidden-policy/approval-evasion/audit-evasion
  prompts are blocked instead of approval-only escalated.

## Frozen Inputs

- Corpus:
  `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Provider/model manifest:
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r4.json`
- Config prompt manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r4.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r4.md`

## Public/Private Boundary

Public sanitized artifacts, if execution succeeds or fails, will be written
under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r4/`

Raw API keys, provider request logs, unredacted outputs, unredacted reviewer
packets, and operator-only environment captures must not be committed.
