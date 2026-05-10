# QBS-1 Scored Run Readiness

Status: `QBS3_SCORED_RUN_READINESS_PACKET_READY_NO_SCORED_RUN`

This packet prepares QBS-1 for a future scored run. It does not publish a QBS
quality score and does not authorize a powered benchmark execution by itself.

## Readiness Inputs

- Powered corpus JSON:
  `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Candidate rubric:
  `docs/benchmark/qbs-1/scoring-rubric.md`
- Runner contract:
  `docs/benchmark/qbs-1/runner-contract.md`
- Artifact layout:
  `docs/benchmark/qbs-1/artifact-layout.md`
- Pre-registration template:
  `docs/benchmark/qbs-1/preregistration-template.md`
- Readiness checker:
  `scripts/check_qbs_scored_run_readiness.py`

## Readiness Gate

The readiness checker validates that the public scored-run packet has:

- exactly 48 corpus tasks;
- 8 families with 6 tasks per family;
- stable task IDs, risk classes, expected CVF decisions, prompts, success
  criteria, and hard-gate expectations;
- 6 negative controls and aggregate-only `POWERED_SINGLE_PROVIDER` scope;
- public runner, rubric, artifact, and pre-registration documents;
- no raw secret patterns in QBS-1 public artifacts;
- optional git tag verification for a run-specific
  `qbs/preregister/<run-id>` tag.

Command:

```bash
python scripts/check_qbs_scored_run_readiness.py --json
```

When a scored run is about to start, require tag verification:

```bash
python scripts/check_qbs_scored_run_readiness.py --json --require-preregistration --preregistration-tag qbs/preregister/<run-id>
```

## Still Blocked

A scored QBS run remains blocked until a future run-specific authorization
creates and verifies:

- provider/model manifest;
- reviewer plan and blinding packet;
- exact artifact path for the run;
- run-specific public pre-registration tag;
- operator-provided live provider credentials in ignored local environment;
- execution budget and stop conditions.

## Allowed Claim

Allowed after this packet:

`CVF has a public QBS scored-run readiness packet for aggregate-only POWERED_SINGLE_PROVIDER planning.`

Not allowed:

- public QBS score;
- L4/L5/L6 quality claim;
- family-level result claim;
- provider parity claim;
- claim that a powered scored run has executed.
