# QBS-1 Runner And Corpus Planning

Status: `QBS11_R6_PREREGISTRATION_IN_PROGRESS_NO_QBS_SCORE`

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
- [Alibaba Powered Single-Provider R3 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r3.md)
- [Alibaba Powered Single-Provider R4 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r4.md)
- [Alibaba Powered Single-Provider R5 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r5.md)
- [QBS-10 Quality Delta Root-Cause And Remediation](quality-delta-root-cause-qbs10.md)
- [Alibaba Powered Single-Provider R6 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r6.md)

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
| QBS-8 live rerun run-set | `PREREGISTERED` as `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r4` |
| QBS-8 live rerun execution | `EXECUTION_COMPLETE_REVIEW_PENDING` for `qbs1-powered-single-provider-20260510-alibaba-r4` |
| QBS-9 reviewer scoring | `REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM` for `qbs1-powered-single-provider-20260510-alibaba-r5` |
| QBS-10 quality delta remediation | `REMEDIATION_COMPLETE_NO_NEW_SCORE` |
| QBS-11 R6 pre-registration | `PREREGISTERED_POST_QBS10_REMEDIATION_RUN_NO_QBS_SCORE` |
| QBS-1 scored claim | `NO_PUBLIC_QBS_CLAIM` |
| Family-level claims under `POWERED_SINGLE_PROVIDER` | `BLOCKED` |
| Public QBS score | `NOT_CLAIMED` |

## Next Authorized Work

QBS-11 R6 is the next pre-registered post-remediation run. It must execute,
retain a redacted reviewer output bundle, pass hard gates, complete reviewer
scoring, and pass agreement before any quality claim can be considered.
