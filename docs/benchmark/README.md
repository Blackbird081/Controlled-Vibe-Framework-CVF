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

Status: `QBS1_CALIBRATION_PILOT_PASS_NO_PUBLIC_QBS_SCORE`

As of 2026-05-09, CVF has public live provider and release-gate evidence, but
no public QBS quality score has been claimed. Any future QBS result must name
the provider, model, corpus version, run class, criteria version, run date, and
claim level.

Release-gate evidence proves governed operability. QBS is the separate method
for measuring quality and control value; no QBS score is claimed until a
powered run is published.

QBS-1 runner and corpus planning is now published. A three-provider calibration
pilot has also passed as harness proof only. It is not a powered QBS score and
does not authorize public quality-level claims.

Scored runs remain blocked until a run-specific `qbs/preregister/<run-id>` tag
freezes the exact corpus, configs, provider/model list, reviewer plan, and
artifact path.

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
