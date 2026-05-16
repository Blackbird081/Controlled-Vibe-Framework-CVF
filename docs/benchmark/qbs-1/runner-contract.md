# QBS-1 Runner Contract

Memory class: FULL_RECORD

Status: `RUNNER_CONTRACT_READY_NO_IMPLEMENTATION_CLAIM`

## Purpose

Define what the QBS-1 runner must do before any scored benchmark run can
produce a public claim, so reviewer-facing artifacts are reproducible and
bounded by a documented contract rather than ad-hoc runner behavior.

## Scope

Runner inputs, contract guarantees, prohibited shortcuts, and verification
expectations for QBS-1 scored runs. This file does not contain scored-run
results.

## Core Principle

A QBS-1 runner produces evidence, not claims. Every run must respect the
methodology, the corpus identity, the prompt-diff manifest, and the
reviewer plan. Skipping any element of the contract invalidates the run.

## Allowed

The runner may:

- execute pre-registered scored runs against frozen corpus/provider/prompt
  manifests;
- produce hard-gate, raw, paired, and reviewer-ready artifacts under the
  declared `artifact_root`;
- emit deterministic seeds, hashes, and run identity in the manifest;
- surface operational diagnostics (timing, retries, partial failures) in
  governed log form.

## Forbidden

The runner must not:

- run a scored execution without a public `qbs/preregister/<run-id>` tag;
- silently mutate the corpus, prompt manifest, or scoring rubric mid-run;
- substitute mock outputs for live provider calls in a scored run;
- omit prompt-diff manifest, run manifest, or receipt evidence;
- claim a level above the methodology's claim ladder.

## Rule

Every scored QBS-1 run must satisfy the inputs section below, produce the
required artifact set, and bind the run identity to a public pre-registration
tag. Any deviation requires a methodology revision.

## Exceptions

`CALIBRATION_PILOT` runs may skip live-provider strictness but must still
declare their calibration-only status in every artifact and the public
claim ladder treats them as directional only.

## Violations

A run with any of the following is `INVALID` and must not be cited as
scored evidence:

- missing pre-registration tag for `POWERED_*` run class;
- mismatched corpus/prompt/provider hash versus the tagged manifest;
- absent reviewer plan or absent reviewer artifacts;
- evidence completeness below the methodology threshold.

## Audit Requirements

Every scored run must publish:

- run manifest with hashes;
- prompt-diff manifest;
- receipts for each `CFG-B` call;
- reviewer artifacts;
- hard-gate result table;
- claim statement bound to the claim ladder.

## Related Artifacts

- `corpus-candidate.md`
- `scoring-rubric.md`
- `artifact-layout.md`
- `preregistration-template.md`
- `scored-run-readiness.md`
- `provider-routing-policy.md`
- `../quality-benchmark-suite-methodology.md`

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

## Current Calibration Runner

The public calibration runner is:

```bash
python scripts/run_qbs_calibration_pilot.py --preregistration-tag qbs/preregister/<run-id>
```

The runner is designed for `CALIBRATION_PILOT` only. It executes a small
three-task calibration corpus across `CFG-A0`, `CFG-A1`, and `CFG-B`, then
writes sanitized artifacts under `docs/benchmark/runs/<run-id>/`.

The calibration runner does not produce L4/L5/L6 evidence and does not create a
public QBS quality score.

## Current Scored-Run Readiness Checker

The public scored-run readiness checker is:

```bash
python scripts/check_qbs_scored_run_readiness.py --json
```

It validates the 48-task aggregate-only `POWERED_SINGLE_PROVIDER` corpus packet
and public artifact prerequisites. It does not execute a scored benchmark and
does not publish a QBS quality score.

Before scored execution, the checker must be run with tag verification:

```bash
python scripts/check_qbs_scored_run_readiness.py --json --require-preregistration --preregistration-tag qbs/preregister/<run-id>
```

## Current Powered Single-Provider Runner

The public execution runner for the first pre-registered single-provider lane
is:

```bash
python scripts/run_qbs_powered_single_provider.py --run-id <run-id> --confirm-live-cost --env-file <local ignored env file>
```

It executes the frozen Alibaba/DashScope `qwen-turbo` run and writes sanitized,
review-pending artifacts under the pre-registered artifact root. It does not
publish a QBS score; reviewer scoring and agreement remain a separate gate.

## Runner Configs

The runner executes each task through:

- `CFG-A0`: raw direct model baseline.
- `CFG-A1`: structured direct control using the frozen neutral prompt.
- `CFG-B`: actual CVF governed path.

`CFG-B` must call the live CVF governed execution path. A direct-model prompt
that imitates CVF does not satisfy the contract.

For R2/R3 reruns, the F7 ambiguous non-coder rows use the intent-first
front-door clarification entrypoint before any execute handoff can count as
valid `CFG-B` evidence.

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

## Invariant

This contract claims only the runner-level obligations above. It does not
claim a current implementation exists, does not claim any specific scored
run satisfies the contract, and does not authorize publishing a QBS claim
without a fully-executed pre-registered run.
