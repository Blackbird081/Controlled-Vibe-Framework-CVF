# CVF GC-018 Continuation Candidate - QBS-2 Calibration Pilot

Memory class: FULL_RECORD
Status: AUTHORIZED - CALIBRATION PILOT COMPLETE / SCORED RUN BLOCKED
Date: 2026-05-09
Track: QBS-2 Calibration Pilot
Parent track:
- `docs/reference/CVF_GC018_QBS1_RUNNER_CORPUS_CANDIDATE_2026-05-09.md`
- `docs/roadmaps/CVF_QBS1_RUNNER_CORPUS_PLANNING_ROADMAP_2026-05-09.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `GC018_QBS2_CALIBRATION_PILOT_2026_05_09`
- Date: 2026-05-09
- Parent roadmap / wave: QBS-1 runner and corpus planning
- Proposed scope: implement and run a small QBS calibration pilot across the
  three configured provider lanes: Alibaba/DashScope, DeepSeek, and OpenAI.
- Continuation class: TRUTH_CLAIM / LIVE_EVIDENCE / BENCHMARK_PREPARATION
- Active quality assessment:
  `docs/reviews/CVF_QBS_PUBLIC_METHODOLOGY_INDEPENDENT_REVIEW_2026-05-09.md`
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now:
  the accepted public methodology and QBS-1 planning packet unlocked runner and
  corpus calibration. A calibration pilot provides concrete evidence that the
  direct-model, neutral-control, and governed-CVF paths can run across multiple
  live provider lanes before any scored benchmark is attempted.
- Quality protection commitments:
  - calibration only;
  - no public QBS score;
  - no L4/L5/L6 quality claim;
  - no family-level claim;
  - no provider parity claim;
  - raw provider keys remain local and ignored;
  - public artifact status must remain `CALIBRATION_DIRECTIONAL_NO_QBS_SCORE`.
- Remediation target if not expanding:
  runner design would remain unproven, and the next scored-run proposal would
  carry avoidable implementation risk.
- Why now:
  the operator authorized use of Alibaba, DeepSeek, and OpenAI keys, and the
  public repo already contains the methodology, QBS-1 planning packet, and
  pre-registration rule.
- Active-path impact: LIMITED
- Risk if deferred:
  public methodology would remain structurally strong but operationally
  uncalibrated.
- Lateral alternative considered: YES
- Why not lateral shift:
  adding new CVF features or skills would not improve the immediate evidence
  quality gap.
- Real decision boundary improved: YES
- Expected enforcement class:
  GOVERNANCE_DECISION_GATE
- Required evidence if approved:
  - public calibration runner implementation;
  - public `qbs/preregister/<run-id>` tag for the calibration run;
  - live provider execution across Alibaba, DeepSeek, and OpenAI;
  - curated public artifacts under `docs/benchmark/runs/<run-id>/`;
  - public README and claim-boundary alignment;
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
  the pilot turns the accepted method into live, inspectable, multi-provider
  runner evidence while preserving the no-score boundary.

## Authorization Boundary

- Authorized now: YES
- Batch name: `QBS2-CALIBRATION-PILOT`
- Explicitly authorized:
  - calibration runner implementation;
  - calibration pre-registration tag;
  - live calls to Alibaba/DashScope, DeepSeek, and OpenAI using local ignored
    operator keys;
  - curated public calibration artifacts.
- Explicitly not authorized:
  - scored QBS benchmark;
  - public QBS score;
  - powered effect-size claim;
  - family-level quality claim;
  - provider parity claim.

## Closure Summary

- Calibration run ID:
  `qbs1-calibration-20260509-three-provider`
- Final pre-registration tag:
  `qbs/preregister/qbs1-calibration-20260509-three-provider-r5`
- Public result:
  `CALIBRATION_PILOT_PASS_NO_PUBLIC_QBS_SCORE`
- Public artifact folder:
  `docs/benchmark/runs/qbs1-calibration-20260509-three-provider/`
- Public artifact commit:
  `4a405cf Publish QBS-1 calibration pilot results`

