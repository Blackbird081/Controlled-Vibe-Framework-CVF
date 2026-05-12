# QBS-1 Pre-Registration - Alibaba Powered Single Provider R10

Status: `QBS40_R10_PREREGISTERED_NO_SCORED_RUN`

Run ID: `qbs1-powered-single-provider-20260512-alibaba-r10`

Required tag:

`qbs/preregister/qbs1-powered-single-provider-20260512-alibaba-r10`

## Run Declaration

```yaml
run_id: qbs1-powered-single-provider-20260512-alibaba-r10
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
artifact_root: docs/benchmark/runs/qbs1-powered-single-provider-20260512-alibaba-r10
reviewer_plan: docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260512-alibaba-r10.md
provider_model_manifest: docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260512-alibaba-r10.json
config_prompt_manifest: docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260512-alibaba-r10.json
allowed_claim_target: L4
family_level_claims_allowed: false
public_status_before_execution: QBS40_R10_PREREGISTERED_NO_SCORED_RUN
parent_scored_run: qbs1-powered-single-provider-20260511-alibaba-r9
post_remediation_packets:
  - docs/benchmark/qbs-1/qbs33-rework-decoupling.md
  - docs/benchmark/qbs-1/qbs34-reviewer-completeness-retry.md
  - docs/benchmark/qbs-1/qbs35-live-run-preflight.md
  - docs/benchmark/qbs-1/r9-calibration-reference-qbs36.md
  - docs/benchmark/qbs-1/r9-calibration-agreement-qbs37.md
  - docs/benchmark/qbs-1/qbs38-runtime-governance-family-mapper.md
  - docs/benchmark/qbs-1/qbs39-family-conditional-allow-output-contract.md
reviewer_output_bundle_required: true
reviewer_prompt_version: qbs40-r10-post-qbs39-scored-run-v1
reviewer_calibration_reference: docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json
reviewer_rubric_addendum: docs/benchmark/qbs-1/r9-reviewer-rubric-remediation-qbs31.md
reviewer_judges:
  - openai:gpt-4o-mini
  - deepseek:deepseek-chat
```

## Rerun Delta

R10 reuses the R9 live execution contract and full eight-family corpus. The
intended delta is limited to the QBS-33 through QBS-39 remediation sequence:

- dual-published reviewer and derived rework views;
- bounded missing-alias reviewer retry and redacted completeness diagnostics;
- deterministic env/key/workspace preflight;
- QBS36 model-only available-provider triangulated calibration reference;
- QBS37 post-triangulation reviewer calibration diagnostics;
- QBS38 governance-family metadata in the governed path;
- QBS39 family-conditional ALLOW output contracts for chronic negative
  families.

No public score is claimed by pre-registration.

## Execution Command

The live run is cost-bearing and must not be started unless the operator
explicitly confirms live cost:

```bash
python scripts/run_qbs_powered_single_provider.py --run-id qbs1-powered-single-provider-20260512-alibaba-r10 --confirm-live-cost --retain-redacted-outputs
```

After live execution artifacts exist, reviewer scoring should use:

```bash
python scripts/score_qbs_model_assisted_reviewers.py --run-id qbs1-powered-single-provider-20260512-alibaba-r10 --prompt-version qbs40-r10-post-qbs39-scored-run-v1 --calibration-anchors docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json --missing-alias-retry-attempts 2 --completeness-diagnostics-output docs/benchmark/runs/qbs1-powered-single-provider-20260512-alibaba-r10/reviewer-completeness-diagnostics.jsonl
```

## Public/Private Boundary

Public sanitized artifacts will be written under:

`docs/benchmark/runs/qbs1-powered-single-provider-20260512-alibaba-r10/`

The reviewer bundle may include full generated outputs after secret redaction.
Raw provider request logs, API keys, provider request IDs, and local env details
remain private.

Pre-registration does not authorize a public QBS score, family-level claim,
provider-parity claim, or human-gold claim.
