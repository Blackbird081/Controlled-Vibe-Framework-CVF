# QBS-1 Runner And Corpus Planning

Status: `QBS7_RERUN_PREREGISTERED_NO_PUBLIC_QBS_SCORE`

QBS-1 is the first implementation planning packet for the CVF Quality Benchmark
Suite. It translates the public methodology into concrete runner, corpus,
scoring, artifact, and pre-registration requirements.

This folder does not contain scored benchmark results. The first calibration
pilot is published under
[`../runs/qbs1-calibration-20260509-three-provider/`](../runs/qbs1-calibration-20260509-three-provider/README.md)
as harness proof only.

## Planning Packet

- [Corpus Candidate](corpus-candidate.md)
- [Powered Single-Provider Corpus V1](powered-single-provider-corpus-v1.json)
- [Runner Contract](runner-contract.md)
- [Scoring Rubric](scoring-rubric.md)
- [Artifact Layout](artifact-layout.md)
- [Pre-Registration Template](preregistration-template.md)
- [Scored Run Readiness](scored-run-readiness.md)
- [Alibaba Powered Single-Provider Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba.md)
- [QBS-6 Hard-Gate Remediation](hard-gate-remediation-qbs6.md)
- [QBS-7 Rerun Pre-Registration Plan](rerun-plan-qbs7.md)
- [Alibaba Powered Single-Provider R2 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r2.md)

Runner entry point:

```bash
python scripts/run_qbs_calibration_pilot.py --preregistration-tag qbs/preregister/<run-id>
```

Readiness checker:

```bash
python scripts/check_qbs_scored_run_readiness.py --json
```

## Gate State

| Gate | State |
|---|---|
| QBS-1 corpus design | `UNLOCKED` |
| QBS-1 powered corpus JSON | `READY_FOR_PREREGISTRATION` |
| QBS-1 runner harness design | `CALIBRATION_RUNNER_AVAILABLE` |
| QBS-1 calibration pilot | `PASS_NO_QBS_SCORE` |
| QBS-1 scored-run readiness packet | `PASS` |
| QBS-1 scored-run pre-registration | `PREREGISTERED` as `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba` |
| QBS-1 powered execution | `FAILED_NO_SCORE` for `qbs1-powered-single-provider-20260510-alibaba` |
| QBS-6 hard-gate remediation | `COMPLETE_RERUN_BLOCKED` |
| QBS-7 rerun pre-registration | `PREREGISTERED` as `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r2` |
| QBS-1 scored claim | `BLOCKED` until hard gates pass and reviewer scoring completes |
| Family-level claims under `POWERED_SINGLE_PROVIDER` | `BLOCKED` |
| Public QBS score | `NOT_CLAIMED` |

## Next Authorized Work

QBS-8 may execute the R2 rerun only after explicit live-cost authorization,
credential availability, stop conditions, and reviewer readiness are confirmed.
QBS-7 itself is only a frozen rerun pre-registration packet.
