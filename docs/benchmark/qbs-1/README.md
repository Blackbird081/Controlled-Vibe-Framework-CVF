# QBS-1 Runner And Corpus Planning

Status: `QBS30_R9_CALIBRATION_FAILURE_ANALYSIS_COMPLETE_NO_NEW_SCORE`

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
- [QBS-12 Reviewer Disagreement And Residual Quality Remediation](reviewer-disagreement-remediation-qbs12.md)
- [QBS-14 Reviewer Calibration Plan](reviewer-calibration-plan-qbs14.md)
- [QBS-14 Reviewer Drift Analysis JSON](reviewer-drift-analysis-qbs14.json)
- [QBS-15 Reviewer Calibration Anchors](reviewer-calibration-anchors-qbs15.md)
- [QBS-15 Reviewer Calibration Anchors JSON](reviewer-calibration-anchors-qbs15.json)
- [QBS-16 Anchor Adjudication](reviewer-anchor-adjudication-qbs16.md)
- [QBS-16 Anchor Adjudication JSON](reviewer-calibration-adjudication-qbs16.json)
- [QBS-16 Reviewer Rubric Addendum](reviewer-rubric-addendum-qbs16.md)
- [QBS-17 Reviewer Calibration-Only Agreement Check](reviewer-calibration-agreement-qbs17.md)
- [QBS-17 Reviewer Calibration-Only Agreement JSON](reviewer-calibration-agreement-qbs17.json)
- [QBS-18 Calibration Reference Cleanup And Rerun](reviewer-calibration-cleanup-and-rerun-qbs18.md)
- [QBS-18 Cleaned Calibration Reference JSON](reviewer-calibration-reference-qbs18.json)
- [QBS-18 Calibration Rerun JSON](reviewer-calibration-agreement-qbs18-rerun.json)
- [QBS-18 Rework Rubric Normalization](reviewer-rework-rubric-normalization-qbs18.md)
- [QBS-19 R8 Reviewer Plan Freeze](r8-reviewer-plan-freeze-qbs19.md)
- [QBS-21 R8 Post-Score Analysis](r8-post-score-analysis-qbs21.md)
- [QBS-21 R8 Post-Score Analysis JSON](r8-post-score-analysis-qbs21.json)
- [QBS-22 Scorer Completeness And ALLOW Quality Remediation](scorer-completeness-and-allow-quality-remediation-qbs22.md)
- [QBS-23 R9 Pre-Registration](r9-preregistration-qbs23.md)
- [QBS-25 R9 Post-Score Analysis](r9-post-score-analysis-qbs25.md)
- [QBS-25 R9 Post-Score Analysis JSON](r9-post-score-analysis-qbs25.json)
- [QBS-26 R9 Calibration Anchors](r9-calibration-anchors-qbs26.md)
- [QBS-26 R9 Calibration Anchors JSON](r9-calibration-anchors-qbs26.json)
- [QBS-27 R9 Anchor Adjudication](r9-anchor-adjudication-qbs27.md)
- [QBS-27 R9 Anchor Adjudication JSON](r9-anchor-adjudication-qbs27.json)
- [QBS-28 R9 Cleaned Calibration Reference](r9-calibration-reference-qbs28.md)
- [QBS-28 R9 Cleaned Calibration Reference JSON](r9-calibration-reference-qbs28.json)
- [QBS-29 R9 Calibration-Only Reviewer Agreement](r9-calibration-agreement-qbs29.md)
- [QBS-29 R9 Calibration-Only Reviewer Agreement JSON](r9-calibration-agreement-qbs29.json)
- [QBS-30 R9 Calibration Failure Analysis](r9-calibration-failure-analysis-qbs30.md)
- [QBS-30 R9 Calibration Failure Analysis JSON](r9-calibration-failure-analysis-qbs30.json)
- [Alibaba Powered Single-Provider R6 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r6.md)
- [Alibaba Powered Single-Provider R7 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r7.md)
- [Alibaba Powered Single-Provider R8 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260510-alibaba-r8.md)
- [Alibaba Powered Single-Provider R9 Pre-Registration](preregistrations/qbs1-powered-single-provider-20260511-alibaba-r9.md)

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
| QBS-11 R6 execution | `HARD_GATES_PASS_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM` |
| QBS-11 R6 reviewer agreement | `FAIL` with kappa `0.5043578866178171`, rho `0.5987420572601858` |
| QBS-12 residual quality remediation | `REMEDIATION_COMPLETE_NO_NEW_SCORE` |
| QBS-13 R7 pre-registration | `PREREGISTERED_POST_QBS12_REMEDIATION_RUN_NO_QBS_SCORE` |
| QBS-13 R7 execution | `HARD_GATES_PASS_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM` |
| QBS-13 R7 reviewer agreement | `FAIL` with kappa `0.46363630803481326`, rho `0.5329992930685284` |
| QBS-14 reviewer drift analysis | `CALIBRATION_REQUIRED_NO_NEW_SCORE` |
| QBS-15 reviewer calibration anchors | `ANCHORS_READY_NO_NEW_SCORE` |
| QBS-16 anchor adjudication | `ADJUDICATION_COMPLETE_NO_NEW_SCORE` |
| QBS-17 calibration-only reviewer agreement | `FAIL_NO_NEW_SCORE` with kappa `0.7365591397849462`, rho `0.7935131868283122`, but reviewer-vs-reference alignment failed |
| QBS-18 cleaned-reference calibration rerun | `PASS_NO_NEW_SCORE` with kappa `0.9046321525885559`, rho `0.9219234991142461` |
| QBS-19 R8 reviewer plan freeze | `PREREGISTERED_NO_SCORED_RUN` as `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r8` |
| QBS-20 R8 execution | `HARD_GATES_PASS_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM` |
| QBS-20 R8 reviewer agreement | `FAIL` with kappa `0.5004684065769088`, rho `0.5702347881140457` |
| QBS-21 R8 post-score analysis | `COMPLETE_NO_NEW_SCORE` |
| QBS-22 scorer completeness + ALLOW quality remediation | `REMEDIATION_COMPLETE_NO_NEW_SCORE` |
| QBS-23 R9 pre-registration | `PREREGISTERED_NO_SCORED_RUN` as `qbs/preregister/qbs1-powered-single-provider-20260511-alibaba-r9` |
| QBS-24 R9 execution | `HARD_GATES_PASS_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM` |
| QBS-24 R9 reviewer agreement | `FAIL` with kappa `0.37156033151334533`, rho `0.43818074648985417` |
| QBS-25 R9 post-score analysis | `COMPLETE_NO_NEW_SCORE` |
| QBS-26 R9 calibration anchors | `READY_NO_NEW_SCORE` with 35 provisional anchors across all 8 QBS families |
| QBS-27 R9 anchor adjudication | `COMPLETE_NO_NEW_SCORE` with 35 model-adjudicated anchors |
| QBS-28 R9 cleaned calibration reference | `READY_NO_NEW_SCORE` with 35 cleaned reference items |
| QBS-29 R9 calibration-only reviewer agreement | `FAIL_NO_NEW_SCORE`; inter-reviewer PASS by Spearman, OpenAI-vs-reference FAIL |
| QBS-30 R9 calibration failure analysis | `COMPLETE_NO_NEW_SCORE`; rerun remains blocked pending rubric/reference remediation |
| QBS-1 scored claim | `NO_PUBLIC_QBS_CLAIM` |
| Family-level claims under `POWERED_SINGLE_PROVIDER` | `BLOCKED` |
| Public QBS score | `NOT_CLAIMED` |

## Next Authorized Work

QBS-29 runs a calibration-only reviewer agreement check against the QBS-28
reference. Inter-reviewer agreement passes by Spearman, but OpenAI-vs-reference
alignment fails, so another live rerun remains blocked. QBS-30 classifies the
failure as OpenAI-vs-reference alignment plus rework-label instability. The
next track should remediate the rubric/reference mismatch.
