# QBS-1 Runner Contract

Status: `RUNNER_CONTRACT_READY_NO_IMPLEMENTATION_CLAIM`

This contract defines what the QBS-1 runner must do before any scored benchmark
run can produce a public claim.

## Runner Inputs

| Input | Required | Notes |
|---|---|---|
| `run_id` | yes | Stable ID used in paths, tags, manifests, and receipts. |
| `run_class` | yes | `CALIBRATION_PILOT`, `POWERED_SINGLE_PROVIDER`, `POWERED_MULTI_PROVIDER`, or `REGRESSION_MONITOR`. |
| `criteria_version` | yes | Public methodology commit or tag. |
| `corpus_manifest` | yes | Frozen task list and expected decisions. |
| `provider_model_manifest` | yes | Provider/model/output limits for all configs. |
| `config_prompt_manifest` | yes | `CFG-A0`, `CFG-A1`, and `CFG-B` definitions and hashes. |
| `reviewer_plan` | yes | Human/model judge plan and blinding rules. |
| `artifact_root` | yes | Run output directory. |
| `preregistration_tag` | required for scored runs | Public tag `qbs/preregister/<run-id>`. |

## Runner Configs

The runner executes each task through:

- `CFG-A0`: raw direct model baseline.
- `CFG-A1`: structured direct control using the frozen neutral prompt.
- `CFG-B`: actual CVF governed path.

`CFG-B` must call the live CVF governed execution path. A direct-model prompt
that imitates CVF does not satisfy the contract.

## Repeat Policy

| Run Class | Repeat Requirement |
|---|---|
| `CALIBRATION_PILOT` | N=1 allowed |
| `POWERED_SINGLE_PROVIDER` | N=3 required |
| `POWERED_MULTI_PROVIDER` | N=3 required |
| `REGRESSION_MONITOR` | Declared in run manifest |

## Required Runner Steps

1. Validate public-surface and secret safety before run.
2. Load frozen manifests.
3. Verify pre-registration tag for scored runs.
4. Verify provider/model pairing and output limits.
5. Generate prompt-diff manifest.
6. Execute every task/config/repeat.
7. Capture raw output with secret redaction.
8. Capture governance receipt for every successful `CFG-B` run.
9. Normalize reviewer-visible outputs for blinding.
10. Score objective gates.
11. Produce reviewer packets.
12. Merge reviewer scores after adjudication.
13. Compute aggregate paired statistics.
14. Compute cost, latency, and evidence-completeness tables.
15. Produce claim statement and limitations statement.

## Failure Rules

| Failure | Runner Behavior |
|---|---|
| Missing pre-registration tag for scored run | stop with `INVALID_PREREGISTRATION` |
| Missing `CFG-B` receipt on successful governed run | hard-gate failure |
| Raw secret detected in artifact | stop with `INVALID_SECRET_EXPOSURE` |
| Provider/model mismatch across paired configs | stop with `INVALID_PAIRING` |
| Mock fallback in live governance claim | hard-gate failure |
| Judge model version changes mid-run | stop with `INVALID_JUDGE_DRIFT` |

## Output Summary

The runner must produce enough machine-readable artifacts for an independent
reviewer to reconstruct:

- what ran;
- which provider/model produced each output;
- which prompt/config produced each output;
- which governance decision was made;
- which cost/latency signals were captured;
- which gates passed or failed;
- which claim, if any, is allowed.

