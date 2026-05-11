# CVF Quality Benchmark Suite

The CVF Quality Benchmark Suite (QBS) is the public methodology for measuring
whether CVF improves control over AI and agent execution compared with direct
model use.

QBS is intentionally published before benchmark scores are claimed. The method
defines what would count as evidence, which baselines are fair, which claims are
allowed, and which gates can invalidate a result.

Start here:

- [Methodology](quality-benchmark-suite-methodology.md)
- [Claim Ladder](quality-benchmark-suite-claim-ladder.md)
- [Standards Alignment](quality-benchmark-suite-standards-alignment.md)
- [QBS-1 Runner And Corpus Planning](qbs-1/README.md)
- [QBS-1 Calibration Runs](runs/qbs1-calibration-20260509-three-provider/README.md)

## Current Status

Status: `QBS30_R9_CALIBRATION_FAILURE_ANALYSIS_COMPLETE_NO_NEW_SCORE`

As of 2026-05-11, CVF has public live provider and release-gate evidence, but
no public QBS quality score has been claimed. Any future QBS result must name
the provider, model, corpus version, run class, criteria version, run date, and
claim level.

Release-gate evidence proves governed operability. QBS is the separate method
for measuring quality and control value; no QBS score is claimed until a
powered run is published.

QBS-1 runner and corpus planning is now published. A three-provider calibration
pilot has also passed as harness proof only. A scored-run readiness packet now
adds the aggregate-only powered corpus JSON and readiness checker. The first
planned single-provider scored run is publicly pre-registered and has executed
on Alibaba/DashScope `qwen-turbo`, but it failed hard gates. No public QBS
score or quality-level claim is made. QBS-6 records bounded hard-gate
remediation. QBS-7 freezes a new R2 rerun pre-registration with the F7
ambiguous-request entrypoint routed through the intent-first clarification
path. QBS-8 re-freezes the live rerun target as R4 after bounded F7 router and
R3 block-enforcement hardening, then completes the live Alibaba/DashScope
`qwen-turbo` execution with hard gates passing. QBS-9 re-executes the same
contract as R5 with a redacted reviewer output bundle and completes
model-assisted scoring. Reviewer agreement passes, but the measured quality
delta does not support an L4/L5 claim. QBS-10 identifies the primary root cause
as missing or too-terse user-facing output for governed non-ALLOW outcomes and
adds deterministic block, clarify, approval, and front-door clarification
guidance. QBS-10 is remediation only; it publishes no new benchmark score.
QBS-11 executed and scored the post-remediation R6 run. Hard gates passed and
the median `CFG-B` vs `CFG-A1` delta improved to `-0.125`, but reviewer
agreement failed the claim gate (`kappa=0.5043578866178171`,
`rho=0.5987420572601858`). No public QBS score or L4/L5 claim is made.
QBS-12 analyzes the R6 disagreement pattern and remediates the clearest
remaining defects: generic approval-gated security output, unsupported provider
benchmark numbers, and excess meta-commentary on simple transformations. QBS-12
publishes no new score.
QBS-13 executed and scored the post-QBS12 R7 run. Hard gates passed, but
reviewer agreement failed the claim gate (`kappa=0.46363630803481326`,
`rho=0.5329992930685284`) and the median `CFG-B` vs `CFG-A1` delta remained
`-0.125`. No public QBS score or L4/L5 claim is made.
QBS-14 analyzes reviewer drift across R5/R6/R7 and concludes that another live
rerun should not be pre-registered until reviewer calibration and residual
`CFG-B` quality work are completed.
QBS-15 creates the first fixed reviewer calibration anchor set and updates the
reviewer scorer so future runs can opt into explicit calibration guidance.
QBS-16 adjudicates the high-disagreement anchors with a third model adjudicator
fallback and publishes a reviewer rubric addendum. This is still no-score and
does not unlock R8 without a revised reviewer plan. QBS-17 runs that
calibration-only check with OpenAI and DeepSeek reviewers. Inter-reviewer
agreement passes on the anchor set (`kappa=0.7365591397849462`,
`rho=0.7935131868283122`), but reviewer-vs-QBS16-reference alignment fails due
to rework-label instability and unresolved anchor/reference conflicts. R8
remains blocked. QBS-18 cleans the anchor/reference conflict, normalizes the
rework rubric, and reruns the calibration-only check. The rerun passes
(`kappa=0.9046321525885559`, `rho=0.9219234991142461`) but still publishes no
QBS score. QBS-19 freezes the R8 reviewer plan and pre-registers the next
Alibaba/DashScope `qwen-turbo` powered single-provider run. QBS-20 executes
and scores R8. Hard gates pass, but reviewer agreement fails
(`kappa=0.5004684065769088`, `rho=0.5702347881140457`), the median
`CFG-B` vs `CFG-A1` quality delta remains `-0.125`, and no public QBS score or
L4/L5 claim is made. QBS-21 analyzes the R8 post-score failure: one OpenAI
reviewer alias was missing, reviewer drift remained highest in builder-handoff
and cost/provider families, and `CFG-B` ALLOW-task quality remained below the
direct structured baseline. QBS-22 remediates scorer completeness and targeted
ALLOW output-quality instructions without running a new score. QBS-23 freezes
the post-remediation R9 pre-registration. No R9 execution or score is claimed
by pre-registration. QBS-24 executes and scores R9. Hard gates pass and paired
score completeness is restored (`432` paired scores), but reviewer agreement
fails (`kappa=0.37156033151334533`, `rho=0.43818074648985417`) and no public
QBS score or L4/L5 claim is made. QBS-25 analyzes R9 and concludes that the
next blocker is reviewer drift plus residual ALLOW-task quality, not scorer
completeness. QBS-26 turns the R9 failure surface into 35 provisional
calibration anchors covering all 8 QBS families. QBS-27 adjudicates all 35
anchors with the Alibaba/DashScope `qwen-turbo` model-adjudicator fallback.
QBS-28 cleans that adjudication into a 35-item calibration reference for future
reviewer scoring. QBS-29 runs a calibration-only OpenAI/DeepSeek reviewer
agreement check on that reference. Inter-reviewer agreement passes by Spearman
(`rho=0.6546663721124177`) but overall calibration fails because
OpenAI-vs-reference alignment misses the gate. The result is still no-score
and no-claim; another live rerun remains blocked. QBS-30 classifies the
blocker as OpenAI-vs-reference alignment plus rework-label instability and
requires rubric/reference remediation before another calibration-only check.

Scored runs remain blocked until a run-specific `qbs/preregister/<run-id>` tag
freezes the exact corpus, configs, provider/model list, reviewer plan, and
artifact path.

No public QBS score is claimed until reviewer scoring and agreement complete.

Latest powered execution artifact:

- [QBS-1 Alibaba Powered Single-Provider Execution](runs/qbs1-powered-single-provider-20260510-alibaba/README.md)
- [QBS-1 Alibaba Powered Single-Provider R4 Execution](runs/qbs1-powered-single-provider-20260510-alibaba-r4/README.md)
- [QBS-1 Alibaba Powered Single-Provider R5 Scored Review](runs/qbs1-powered-single-provider-20260510-alibaba-r5/README.md)
- [QBS-1 Alibaba Powered Single-Provider R6 Scored Review](runs/qbs1-powered-single-provider-20260510-alibaba-r6/README.md)
- [QBS-1 Alibaba Powered Single-Provider R7 Scored Review](runs/qbs1-powered-single-provider-20260510-alibaba-r7/README.md)
- [QBS-1 Alibaba Powered Single-Provider R8 Scored Review](runs/qbs1-powered-single-provider-20260510-alibaba-r8/README.md)
- [QBS-1 Alibaba Powered Single-Provider R9 Scored Review](runs/qbs1-powered-single-provider-20260511-alibaba-r9/README.md)
- [QBS-6 Hard-Gate Remediation](qbs-1/hard-gate-remediation-qbs6.md)
- [QBS-7 Rerun Pre-Registration Plan](qbs-1/rerun-plan-qbs7.md)
- [QBS-10 Quality Delta Root-Cause And Remediation](qbs-1/quality-delta-root-cause-qbs10.md)
- [QBS-12 Reviewer Disagreement And Residual Quality Remediation](qbs-1/reviewer-disagreement-remediation-qbs12.md)
- [QBS-14 Reviewer Calibration Plan](qbs-1/reviewer-calibration-plan-qbs14.md)
- [QBS-14 Reviewer Drift Analysis JSON](qbs-1/reviewer-drift-analysis-qbs14.json)
- [QBS-15 Reviewer Calibration Anchors](qbs-1/reviewer-calibration-anchors-qbs15.md)
- [QBS-15 Reviewer Calibration Anchors JSON](qbs-1/reviewer-calibration-anchors-qbs15.json)
- [QBS-16 Anchor Adjudication](qbs-1/reviewer-anchor-adjudication-qbs16.md)
- [QBS-16 Anchor Adjudication JSON](qbs-1/reviewer-calibration-adjudication-qbs16.json)
- [QBS-16 Reviewer Rubric Addendum](qbs-1/reviewer-rubric-addendum-qbs16.md)
- [QBS-17 Reviewer Calibration-Only Agreement Check](qbs-1/reviewer-calibration-agreement-qbs17.md)
- [QBS-17 Reviewer Calibration-Only Agreement JSON](qbs-1/reviewer-calibration-agreement-qbs17.json)
- [QBS-18 Calibration Reference Cleanup And Rerun](qbs-1/reviewer-calibration-cleanup-and-rerun-qbs18.md)
- [QBS-18 Cleaned Calibration Reference JSON](qbs-1/reviewer-calibration-reference-qbs18.json)
- [QBS-18 Calibration Rerun JSON](qbs-1/reviewer-calibration-agreement-qbs18-rerun.json)
- [QBS-18 Rework Rubric Normalization](qbs-1/reviewer-rework-rubric-normalization-qbs18.md)
- [QBS-19 R8 Reviewer Plan Freeze](qbs-1/r8-reviewer-plan-freeze-qbs19.md)
- [QBS-21 R8 Post-Score Analysis](qbs-1/r8-post-score-analysis-qbs21.md)
- [QBS-21 R8 Post-Score Analysis JSON](qbs-1/r8-post-score-analysis-qbs21.json)
- [QBS-22 Scorer Completeness And ALLOW Quality Remediation](qbs-1/scorer-completeness-and-allow-quality-remediation-qbs22.md)
- [QBS-23 R9 Pre-Registration](qbs-1/r9-preregistration-qbs23.md)
- [QBS-25 R9 Post-Score Analysis](qbs-1/r9-post-score-analysis-qbs25.md)
- [QBS-25 R9 Post-Score Analysis JSON](qbs-1/r9-post-score-analysis-qbs25.json)
- [QBS-26 R9 Calibration Anchors](qbs-1/r9-calibration-anchors-qbs26.md)
- [QBS-26 R9 Calibration Anchors JSON](qbs-1/r9-calibration-anchors-qbs26.json)
- [QBS-27 R9 Anchor Adjudication](qbs-1/r9-anchor-adjudication-qbs27.md)
- [QBS-27 R9 Anchor Adjudication JSON](qbs-1/r9-anchor-adjudication-qbs27.json)
- [QBS-28 R9 Cleaned Calibration Reference](qbs-1/r9-calibration-reference-qbs28.md)
- [QBS-28 R9 Cleaned Calibration Reference JSON](qbs-1/r9-calibration-reference-qbs28.json)
- [QBS-29 R9 Calibration-Only Reviewer Agreement](qbs-1/r9-calibration-agreement-qbs29.md)
- [QBS-29 R9 Calibration-Only Reviewer Agreement JSON](qbs-1/r9-calibration-agreement-qbs29.json)
- [QBS-30 R9 Calibration Failure Analysis](qbs-1/r9-calibration-failure-analysis-qbs30.md)
- [QBS-30 R9 Calibration Failure Analysis JSON](qbs-1/r9-calibration-failure-analysis-qbs30.json)
- [Alibaba Powered Single-Provider R9 Pre-Registration](qbs-1/preregistrations/qbs1-powered-single-provider-20260511-alibaba-r9.md)
- [Alibaba Powered Single-Provider R6 Pre-Registration](qbs-1/preregistrations/qbs1-powered-single-provider-20260510-alibaba-r6.md)
- [Alibaba Powered Single-Provider R7 Pre-Registration](qbs-1/preregistrations/qbs1-powered-single-provider-20260510-alibaba-r7.md)
- [Alibaba Powered Single-Provider R8 Pre-Registration](qbs-1/preregistrations/qbs1-powered-single-provider-20260510-alibaba-r8.md)

## What QBS Measures

QBS evaluates CVF as a governed execution system:

- output usefulness
- governance correctness
- agent scope control
- cost and quota visibility
- traceability and evidence receipts
- runtime reliability
- non-coder and operator value

QBS is not a model leaderboard and not an enterprise-readiness claim.

## Public Boundary

This folder contains public benchmark methodology and curated public run
artifacts. Raw internal reviews, handoffs, exploratory calibration notes, and
uncurated run logs remain outside the public surface. Curated evidence summaries
belong under `docs/evidence/`.
