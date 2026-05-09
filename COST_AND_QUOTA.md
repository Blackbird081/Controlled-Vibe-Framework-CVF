# Cost And Quota

CVF treats provider cost as a governance concern.

## Current Guardrail

Live provider proof is explicit and opt-in:

- local release proof requires an operator-supplied live key
- hosted release proof runs only through a protected workflow
- the workflow requires the confirmation input `RUN_LIVE_GATE`
- raw keys are redacted from job output and evidence

## Operator Responsibilities

Before running live gates:

- choose the provider lane
- set provider budget/quota limits in the provider console
- set environment secrets only in trusted local or GitHub environments
- avoid sharing local `.env` files
- review generated evidence before publishing summaries

## Product Direction

Deeper cost/quota guardrails should include:

- per-provider budget warning thresholds
- per-run max token and max call limits
- monthly spend counters where provider APIs expose them
- stop rules for repeated retries or timeout storms
- browser-visible cost posture before triggering live jobs

Managed storage is optional. Local-first remains the baseline.

