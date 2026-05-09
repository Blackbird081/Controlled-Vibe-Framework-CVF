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

## Current Status

Status: `METHODOLOGY_READY_NO_PUBLIC_QBS_RESULT`

As of 2026-05-09, CVF has public live provider and release-gate evidence, but
no public QBS quality score has been claimed. Any future QBS result must name
the provider, model, corpus version, run class, criteria version, run date, and
claim level.

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

This folder contains public benchmark methodology only. Raw internal reviews,
handoffs, calibration packets, and uncurated run logs remain outside the public
surface. Curated evidence summaries belong under `docs/evidence/`.

