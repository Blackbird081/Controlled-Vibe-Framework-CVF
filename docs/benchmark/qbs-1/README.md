# QBS-1 Runner And Corpus Planning

Status: `QBS1_PLANNING_READY_NO_SCORED_RUN`

QBS-1 is the first implementation planning packet for the CVF Quality Benchmark
Suite. It translates the public methodology into concrete runner, corpus,
scoring, artifact, and pre-registration requirements.

This folder does not contain scored benchmark results.

## Planning Packet

- [Corpus Candidate](corpus-candidate.md)
- [Runner Contract](runner-contract.md)
- [Scoring Rubric](scoring-rubric.md)
- [Artifact Layout](artifact-layout.md)
- [Pre-Registration Template](preregistration-template.md)

## Gate State

| Gate | State |
|---|---|
| QBS-1 corpus design | `UNLOCKED` |
| QBS-1 runner harness design | `UNLOCKED` |
| QBS-1 scored run | `BLOCKED` until `qbs/preregister/<run-id>` tag exists |
| Family-level claims under `POWERED_SINGLE_PROVIDER` | `BLOCKED` |
| Public QBS score | `NOT_CLAIMED` |

## Next Authorized Work

QBS-1 may proceed to runner implementation and calibration planning. A scored
run may not start until a run-specific pre-registration tag freezes the corpus,
criteria, configs, provider/model list, reviewer plan, and artifact path.

