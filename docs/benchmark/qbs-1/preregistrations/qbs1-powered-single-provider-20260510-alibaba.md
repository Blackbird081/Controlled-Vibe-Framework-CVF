# QBS-1 Pre-Registration - Alibaba Powered Single Provider

Status: `PREREGISTERED_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_NO_SCORED_RUN
```

## Frozen Inputs

- Methodology:
  `docs/benchmark/quality-benchmark-suite-methodology.md`
- Claim ladder:
  `docs/benchmark/quality-benchmark-suite-claim-ladder.md`
- Corpus:
  `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Scoring rubric:
  `docs/benchmark/qbs-1/scoring-rubric.md`
- Runner contract:
  `docs/benchmark/qbs-1/runner-contract.md`
- Artifact layout:
  `docs/benchmark/qbs-1/artifact-layout.md`
- Provider/model manifest:
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba.json`
- Config prompt manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba.md`

## Public/Private Boundary

Public sanitized artifacts, if execution is later authorized, will be written
under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba/`

Local/private raw artifacts must remain outside the public repo. Raw API keys,
provider request logs, unredacted outputs, unredacted reviewer packets, and
operator-only environment captures must not be committed.

## Execution Boundary

This pre-registration does not authorize scored execution. A future operator
approval must explicitly authorize live scored execution and confirm budget,
credential availability, stop conditions, and reviewer availability.

If any frozen input changes after the tag is created, this run-set version is
invalid and a new pre-registration tag is required.
