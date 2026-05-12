# QBS-40 R10 Checkpoint And Pre-Registration

Status: `QBS40_R10_PREREGISTERED_NO_SCORED_RUN`

Date: 2026-05-12

Run ID: `qbs1-powered-single-provider-20260512-alibaba-r10`

Pre-registration tag:

`qbs/preregister/qbs1-powered-single-provider-20260512-alibaba-r10`

## Checkpoint Decision

QBS-33 through QBS-39 completed the locked remediation sequence from the QBS
rerun remediation decision packet:

- QBS-33 added derived-rework support while preserving reviewer rework for
  scored-run comparability.
- QBS-34 added bounded missing-alias retry and redacted completeness
  diagnostics.
- QBS-35 added deterministic env/key/workspace preflight.
- QBS-36 rebuilt the R9 calibration reference through model-only
  available-provider triangulation across Alibaba/OpenAI/DeepSeek.
- QBS-37 ran post-triangulation calibration diagnostics and passed aggregate
  reviewer calibration gates.
- QBS-38 added benchmark/runtime governance-family metadata.
- QBS-39 added family-conditional ALLOW output contracts for the three chronic
  underperformance families.

This checkpoint freezes R10 pre-registration only. It does not execute a live
QBS run and does not claim a QBS score.

## R10 Frozen Scope

R10 remains a `POWERED_SINGLE_PROVIDER` Alibaba/DashScope lane so it can be
compared with R6 through R9:

- corpus: `qbs1-powered-single-provider-corpus-v1-2026-05-10`
- tasks: `48`
- configs: `CFG-A0`, `CFG-A1`, `CFG-B`
- repeats per task/config: `3`
- planned configuration executions: `432`
- provider/model under test: Alibaba/DashScope `qwen-turbo`
- reviewer models: OpenAI `gpt-4o-mini` and DeepSeek `deepseek-chat`
- reviewer calibration reference:
  `docs/benchmark/qbs-1/r9-calibration-reference-qbs36.json`
- reviewer rubric addendum:
  `docs/benchmark/qbs-1/r9-reviewer-rubric-remediation-qbs31.md`

R10 uses the QBS-39 runtime prompt/output contract state and the QBS-38
`qbsFamily` metadata path. It should publish both reviewer-supplied rework and
derived rework views when reviewer scoring is later run.

## Live-Cost Boundary

The live execution remains blocked until an operator explicitly runs the
pre-registered command with `--confirm-live-cost`.

Agents must not interpret this checkpoint, commit, tag, or push as permission
to start the live R10 run.

## Claim Boundary

Pre-registration alone makes no quality claim.

No public QBS score, L4/L5 claim, family-level claim, provider-parity claim, or
human-gold claim is made by this packet. R10 can support a public claim only if
the later live execution, reviewer scoring, hard gates, reviewer agreement, and
claim-ladder thresholds all pass.

## Public Artifacts Frozen By This Packet

- `docs/benchmark/qbs-1/preregistrations/qbs1-powered-single-provider-20260512-alibaba-r10.md`
- `docs/benchmark/qbs-1/provider-model-manifest.qbs1-powered-single-provider-20260512-alibaba-r10.json`
- `docs/benchmark/qbs-1/config-prompt-manifest.qbs1-powered-single-provider-20260512-alibaba-r10.json`
- `docs/benchmark/qbs-1/reviewer-plan.qbs1-powered-single-provider-20260512-alibaba-r10.md`

## Allowed Next Step

After the public commit and tag are pushed, the operator may run the
pre-registered R10 live execution only with explicit live-cost confirmation.
