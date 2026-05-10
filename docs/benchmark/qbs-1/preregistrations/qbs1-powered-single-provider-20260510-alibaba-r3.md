# QBS-1 Pre-Registration - Alibaba Powered Single Provider R3

Status: `PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r3`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r3`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r3
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r3
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r3.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r3.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r3.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN
parent_failed_run: qbs1-powered-single-provider-20260510-alibaba
supersedes_unexecuted_run: qbs1-powered-single-provider-20260510-alibaba-r2
remediation_track: QBS6-HARD-GATE-REMEDIATION-AND-RERUN-PLANNING
rerun_track: QBS8-RERUN-EXECUTION
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
- QBS6 remediation boundary:
  `docs/benchmark/qbs-1/hard-gate-remediation-qbs6.md`
- QBS7 rerun plan:
  `docs/benchmark/qbs-1/rerun-plan-qbs7.md`
- Provider/model manifest:
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r3.json`
- Config prompt manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r3.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r3.md`

## Rerun Delta From R2

R2 remains a valid no-score pre-registration artifact, but it is not the live
rerun target because the bounded F7 front-door ambiguity hardening was added
after the R2 tag. R3 re-freezes the run-set after that implementation change.

## Public/Private Boundary

Public sanitized artifacts, if execution succeeds or fails, will be written
under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r3/`

Raw API keys, provider request logs, unredacted outputs, unredacted reviewer
packets, and operator-only environment captures must not be committed.
