# GC-018 Candidate - QBS11 Post-Remediation Rerun

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-11 authorizes a post-QBS10 remediation rerun of the QBS-1 powered
single-provider benchmark contract.

## Motivation

QBS-10 remediated the largest QBS-9 quality defect: missing or too-terse
user-facing output for governed non-ALLOW states. QBS-11 tests whether that
remediation changes the measured reviewer-scored benchmark outcome.

## Authorized Scope

- Create and publish R6 pre-registration.
- Freeze the R6 contract with a run-specific tag.
- Execute the live Alibaba/DashScope `qwen-turbo` powered run.
- Retain redacted reviewer outputs.
- Score with model-assisted OpenAI and DeepSeek reviewers.
- Publish artifacts with no claim unless hard gates, agreement, and claim
  thresholds pass.

## Explicit Non-Scope

- No raw API key disclosure.
- No unredacted provider request logs.
- No family-level or provider-parity claim under single-provider scope.
- No L4/L5 public claim if reviewer agreement or score thresholds fail.

## Closure

Public pre-registration commit:

`bdd7b9f Preregister QBS R6 remediation rerun`

Public pre-registration tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r6`

Public artifact commit:

`aaab722 Publish QBS R6 scored artifacts`

Result:

`QBS11_R6_REVIEWER_AGREEMENT_FAIL_NO_PUBLIC_QBS_CLAIM`
