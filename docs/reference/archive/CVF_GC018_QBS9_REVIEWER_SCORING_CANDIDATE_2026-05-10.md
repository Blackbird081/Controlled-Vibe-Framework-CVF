# CVF GC-018 Continuation Candidate - QBS-9 Reviewer Scoring And Agreement

Memory class: FULL_RECORD
Status: CLOSED - REVIEWER SCORED / NO PUBLIC QBS CLAIM
Date: 2026-05-10
Track: QBS-9 Reviewer Scoring And Agreement
Parent track:
- `docs/reference/CVF_GC018_QBS8_RERUN_EXECUTION_CANDIDATE_2026-05-10.md`
- `docs/roadmaps/CVF_QBS8_RERUN_EXECUTION_ROADMAP_2026-05-10.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `GC018_QBS9_REVIEWER_SCORING_2026_05_10`
- Proposed scope: create reviewer-scoring-ready output retention, run a
  pre-registered R5 benchmark execution with redacted full outputs, score with
  two model-assisted reviewers, compute reviewer agreement, and publish claim
  boundary.
- Continuation class: REVIEWER_SCORING / BENCHMARK_ANALYSIS /
  CLAIM_DISCIPLINE
- Operator authorization: continuing benchmark work using available Alibaba,
  OpenAI, and DeepSeek keys without cost concern.
- Quality-first decision: SCORE_WITH_NO_OVERCLAIM
- Why R5 was required:
  R4 hard gates passed, but public artifacts only included previews and output
  hashes. QBS9 could not legitimately score output quality from previews, so R5
  reran the same contract with a public redacted reviewer output bundle.

## Closure Summary

Public commits:

- `acd3538 Prepare QBS R5 reviewer scoring run`
- `5860a16 Publish QBS R5 reviewer scoring artifacts`

Public tag:

- `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r5`
  at `acd3538f7ca2bb45b21db836f86e4e45d7ed083e`

Published artifact:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r5/`

R5 execution:

- 48 tasks x 3 repeats x 3 configs = 432 configuration executions.
- Initial R5 full run had one transient validation false block on
  `QBS1-F3-T03` repeat 1.
- Resume reran mismatched/missing `CFG-B` rows only and produced final hard-gate
  pass.
- Final hard gates:
  - direct configs transport OK: true
  - `CFG-B` receipt completeness: true
  - `CFG-B` expected decision match: true
  - secret scan clean: true
  - mock fallback detected: false
  - severe unsafe false negatives: 0
  - negative-control false blocks: 0
  - F7 front-door evidence complete: true

Reviewer scoring:

- Reviewer A: OpenAI `gpt-4o-mini`
- Reviewer B: DeepSeek `deepseek-chat`
- Prompt version: `qbs9-model-assisted-reviewer-v1`
- Batch shape: one task per call, 9 blinded outputs per task.
- Reviewer calls: 96 total.
- Agreement:
  - quadratic-weighted Cohen kappa: `0.7138606707187487`
  - Spearman rho: `0.7864500452029551`
  - paired score count: 432
  - agreement status: PASS

Claim analysis:

- Public status: `QBS9_REVIEWER_SCORED_NO_PUBLIC_QBS_CLAIM`
- Median normalized quality delta `CFG-B` vs `CFG-A1`: `-0.25`
- Bootstrap 95% CI: `[-0.3125, -0.25]`
- Median normalized quality delta `CFG-B` vs `CFG-A0`: `-0.25`
- Median heavy/reject improvement `CFG-B` vs `CFG-A1`: `-1.0`
- L4 pass: false

Validation:

- targeted vitest QBS hard-gate/front-door coverage PASS, 8/8.
- `python -m py_compile scripts/run_qbs_powered_single_provider.py scripts/check_qbs_scored_run_readiness.py scripts/score_qbs_model_assisted_reviewers.py` PASS.
- `python scripts/check_qbs_scored_run_readiness.py --json --require-preregistration --preregistration-tag qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r5` PASS.
- `python scripts/check_public_surface.py` PASS.
- `git diff --check` PASS.
- targeted raw-key scan over public benchmark/evidence/scripts/QBS code: no
  matches.

Boundary:

QBS9 closes the scored reviewer track with no public QBS claim. Agreement
passed, but measured output-quality uplift did not meet L4. No L4/L5/L6,
family-level claim, or provider parity claim is allowed.
