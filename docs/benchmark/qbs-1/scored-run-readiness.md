# QBS-1 Scored Run Readiness

Memory class: POINTER_RECORD

Status: `QBS3_SCORED_RUN_READINESS_PACKET_READY_NO_SCORED_RUN`

## Purpose

Record the readiness packet that prepares QBS-1 for a future powered scored
run, so the steps before execution are explicit and the boundary against
"readiness equals scored result" is firm.

## Scope

Readiness inputs, gates, and checks required before a scored run is
authorized. This file does not publish a QBS quality score and does not
authorize execution by itself.

## Source

Predecessor evidence anchors:

- `runner-contract.md`
- `corpus-candidate.md`
- `scoring-rubric.md`
- `preregistration-template.md`
- `../quality-benchmark-suite-methodology.md`

## Protocol

Operators run the readiness checker, pre-register the run via tag, and only
then may execute the powered run. The checker's exit status is the public
readiness signal.

## Enforcement

The readiness checker (`scripts/check_qbs_scored_run_readiness.py`) is the
enforcement surface. Without a passing readiness check and a verified
pre-registration tag, the runner refuses to execute as a scored run.

## Boundaries

This readiness packet does not authorize:

- skipping pre-registration when execution begins;
- treating readiness PASS as a scored claim;
- citing readiness PASS in public docs as benchmark evidence.

## Related Artifacts

- `README.md`
- `runner-contract.md`
- `corpus-candidate.md`
- `scoring-rubric.md`
- `artifact-layout.md`
- `preregistration-template.md`

This packet prepares QBS-1 for a future scored run. It does not publish a
QBS quality score and does not authorize a powered benchmark execution by
itself.

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

## Claim Boundary

This readiness packet claims only that the documented prerequisites are
defined and the readiness checker is published. It does not claim a scored
run has been executed, does not claim a public QBS quality score, and does
not authorize publishing a scored claim without a fully-executed
pre-registered run.
