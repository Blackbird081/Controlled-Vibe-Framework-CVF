# GC-018 Candidate - QBS13 Post-QBS12 Rerun

Date: 2026-05-10

Status: `CLOSED_COMPLETE_NO_PUBLIC_QBS_CLAIM`

## Candidate

QBS-13 authorizes a post-QBS12 remediation rerun of the QBS-1 powered
single-provider benchmark contract.

## Motivation

QBS-12 remediated three residual quality drivers after QBS-11 R6: generic
approval-gated security output, unsupported provider benchmark-numbering, and
excess meta-commentary on simple transformations. QBS-13 tests whether those
changes improve the scored outcome.

## Authorized Scope

- Create and publish R7 pre-registration.
- Freeze the R7 contract with a run-specific tag.
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

`556edd3 Preregister QBS R7 remediation rerun`

Public pre-registration tag:

`qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r7`

Public artifact commit:

`e66c556 Publish QBS R7 scored artifacts`

Result:

`QBS13_R7_REVIEWER_AGREEMENT_FAIL_NO_PUBLIC_QBS_CLAIM`
