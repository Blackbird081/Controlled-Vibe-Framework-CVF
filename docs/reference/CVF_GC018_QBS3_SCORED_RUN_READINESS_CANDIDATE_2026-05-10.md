# CVF GC-018 Continuation Candidate - QBS-3 Scored Run Readiness

Memory class: FULL_RECORD
Status: AUTHORIZED - READINESS PACKET COMPLETE / SCORED RUN BLOCKED
Date: 2026-05-10
Track: QBS-3 Scored Run Readiness
Parent track:
- `docs/reference/CVF_GC018_QBS2_CALIBRATION_PILOT_CANDIDATE_2026-05-09.md`
- `docs/roadmaps/CVF_QBS2_CALIBRATION_PILOT_ROADMAP_2026-05-09.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `GC018_QBS3_SCORED_RUN_READINESS_2026_05_10`
- Date: 2026-05-10
- Parent roadmap / wave: QBS-2 calibration pilot
- Proposed scope: prepare the public QBS-1 packet for a future scored
  `POWERED_SINGLE_PROVIDER` run by adding a machine-readable 48-task corpus,
  scored-run readiness documentation, and validation tooling.
- Continuation class: TRUTH_CLAIM / STRUCTURAL / BENCHMARK_PREPARATION
- Active quality assessment:
  `docs/reviews/CVF_QBS_PUBLIC_METHODOLOGY_INDEPENDENT_REVIEW_2026-05-09.md`
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now:
  the calibration pilot proved harness viability, but scored execution would
  still be premature without a validated corpus packet and pre-registration
  readiness gate. This tranche reduces scored-run risk without claiming a QBS
  score.
- Quality protection commitments:
  - no scored QBS execution;
  - no public QBS score;
  - no L4/L5/L6 quality claim;
  - no family-level claim;
  - no provider parity claim;
  - scored execution remains blocked until a run-specific authorization and
    public `qbs/preregister/<run-id>` tag exist.
- Remediation target if not expanding:
  a future scored run would depend on prose-only corpus slots and manual review
  rather than a machine-checkable packet.
- Why now:
  QBS-2 ended with `QBS3-SCORED-RUN-READINESS` as the recommended next track,
  and the public repo already contains methodology, planning, and calibration
  artifacts.
- Active-path impact: LIMITED
- Risk if deferred:
  the project would jump from calibration directly to scoring without enough
  preflight validation.
- Lateral alternative considered: YES
- Why not lateral shift:
  additional provider or UI work would not improve the immediate benchmark
  readiness boundary.
- Real decision boundary improved: YES
- Expected enforcement class:
  GOVERNANCE_DECISION_GATE
- Required evidence if approved:
  - public powered single-provider corpus JSON;
  - public scored-run readiness document;
  - public readiness checker script;
  - public-surface scan pass;
  - provenance roadmap and handoff update.

## Depth Audit

- Risk reduction: 2
- Decision value: 2
- Machine enforceability: 2
- Operational efficiency: 2
- Portfolio priority: 2
- Total: 10/10
- Decision: CONTINUE
- Reason:
  QBS3 converts the next scored-run boundary from prose into a validated packet
  while preserving the no-score/no-execution constraint.

## Authorization Boundary

- Authorized now: YES
- Batch name: `QBS3-SCORED-RUN-READINESS`
- Explicitly authorized:
  - public 48-task corpus JSON for aggregate-only `POWERED_SINGLE_PROVIDER`;
  - readiness checker implementation;
  - public docs and claim-boundary wording updates;
  - validation checks that do not execute a scored benchmark.
- Explicitly not authorized:
  - scored QBS benchmark execution;
  - public QBS score;
  - powered effect-size claim;
  - family-level quality claim;
  - provider parity claim;
  - new live provider run for scored evidence.

## Closure Summary

- Public status:
  `QBS3_SCORED_RUN_READINESS_PACKET_READY_NO_PUBLIC_QBS_SCORE`
- Public readiness checker:
  `scripts/check_qbs_scored_run_readiness.py`
- Public corpus:
  `docs/benchmark/qbs-1/powered-single-provider-corpus-v1.json`
- Public readiness doc:
  `docs/benchmark/qbs-1/scored-run-readiness.md`
- Result:
  readiness checker PASS; scored execution remains blocked until a
  run-specific pre-registration tag and separate scored-run authorization exist.
