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

Status: `QBS8_RERUN_READY_NO_PUBLIC_QBS_SCORE`

As of 2026-05-09, CVF has public live provider and release-gate evidence, but
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
path. QBS-8 re-freezes the live rerun target as R3 after bounded F7 router
hardening.

Scored runs remain blocked until a run-specific `qbs/preregister/<run-id>` tag
freezes the exact corpus, configs, provider/model list, reviewer plan, and
artifact path.

The next live rerun target is
`qbs1-powered-single-provider-20260510-alibaba-r3`. No public QBS score is
claimed until hard gates pass and reviewer scoring completes.

Latest powered execution artifact:

- [QBS-1 Alibaba Powered Single-Provider Execution](runs/qbs1-powered-single-provider-20260510-alibaba/README.md)
- [QBS-6 Hard-Gate Remediation](qbs-1/hard-gate-remediation-qbs6.md)
- [QBS-7 Rerun Pre-Registration Plan](qbs-1/rerun-plan-qbs7.md)

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
