# QBS-1 Pre-Registration - Alibaba Powered Single Provider R2

Status: `PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260510-alibaba-r2`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r2`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260510-alibaba-r2
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r2
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r2.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r2.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r2.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: PREREGISTERED_RERUN_PLAN_NO_SCORED_RUN
parent_failed_run: qbs1-powered-single-provider-20260510-alibaba
remediation_track: QBS6-HARD-GATE-REMEDIATION-AND-RERUN-PLANNING
rerun_track: QBS7-RERUN-PREREGISTRATION
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
  `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260510-alibaba-r2.json`
- Config prompt manifest:
  `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260510-alibaba-r2.json`
- Reviewer plan:
  `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260510-alibaba-r2.md`

## Rerun Delta From Original Run

The original run
`qbs1-powered-single-provider-20260510-alibaba` remains a failed/no-score
execution. This R2 pre-registration does not revise, overwrite, or rescore that
artifact.

R2 freezes two rerun deltas:

1. QBS6 runtime remediation is included for `CFG-B` safety-filter receipt
   completeness and R2 approval escalation.
2. F7 ambiguous non-coder tasks keep the corpus expectation `CLARIFY`, but the
   valid `CFG-B` entrypoint is the intent-first front door clarification path,
   not direct `POST /api/execute`.

For all non-F7 tasks, `CFG-B` remains direct governed execution through
`POST /api/execute`.

## Public/Private Boundary

Public sanitized artifacts, if execution is later authorized, will be written
under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r2/`

Local/private raw artifacts must remain outside the public repo. Raw API keys,
provider request logs, unredacted outputs, unredacted reviewer packets, and
operator-only environment captures must not be committed.

## Execution Boundary

This pre-registration does not authorize scored execution. A future operator
approval must explicitly authorize live scored rerun execution and confirm
budget, credential availability, stop conditions, dev-server/session stability,
and reviewer availability.

If any frozen input changes after the tag is created, this run-set version is
invalid and a new pre-registration tag is required.
