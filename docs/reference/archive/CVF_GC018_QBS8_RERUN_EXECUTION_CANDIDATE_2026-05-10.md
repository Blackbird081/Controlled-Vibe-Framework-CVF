# CVF GC-018 Continuation Candidate - QBS-8 Rerun Execution

Memory class: FULL_RECORD
Status: CLOSED - EXECUTION COMPLETE / REVIEW PENDING / NO QBS SCORE
Date: 2026-05-10
Track: QBS-8 Rerun Execution
Parent track:
- `docs/reference/CVF_GC018_QBS7_RERUN_PREREGISTRATION_CANDIDATE_2026-05-10.md`
- `docs/roadmaps/CVF_QBS7_RERUN_PREREGISTRATION_ROADMAP_2026-05-10.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `GC018_QBS8_RERUN_EXECUTION_2026_05_10`
- Date: 2026-05-10
- Parent roadmap / wave: QBS-7 rerun pre-registration
- Proposed scope: run the live powered single-provider QBS rerun through the
  frozen public contract, publish sanitized execution artifacts, and keep QBS
  scoring blocked until reviewer scoring and agreement.
- Continuation class: LIVE_EVIDENCE / BENCHMARK_EXECUTION /
  PUBLIC_SURFACE_DISCIPLINE
- Operator authorization:
  The operator authorized benchmark measurement without incremental pauses and
  allowed Alibaba, DeepSeek, and OpenAI API keys without cost concern. The
  public run class remained `POWERED_SINGLE_PROVIDER`, so only the
  Alibaba/DashScope lane was used for paired benchmark execution.
- Quality-first decision: EXECUTE_AFTER_REFREEZE
- Why a refreeze was required:
  R2 was preregistered before the F7 front-door behavior was hardened. R3 was
  preregistered after F7 hardening, but diagnostics exposed runner suffix and
  R3 block-enforcement gaps. R4 was therefore preregistered and tagged after
  those bounded fixes before the final live run.
- Not authorized:
  - public QBS score;
  - L4/L5/L6 claim;
  - family-level claim;
  - provider parity claim;
  - reviewer scoring without a later scoring/adjudication track.

## Depth Audit

- Risk reduction: 2
- Decision value: 2
- Machine enforceability: 2
- Operational efficiency: 2
- Portfolio priority: 2
- Total: 10/10
- Decision: CONTINUE
- Reason:
  QBS8 converts the preregistered rerun plan into live evidence while preserving
  no-score claim boundaries.

## Closure Summary

Public commits:

- `f196bc0 Prepare QBS R3 live rerun`
- `37b01a9 Prepare QBS R4 rerun hardening`
- `62ce65a Publish QBS R4 execution artifacts`

Public tags:

- `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r3`
  at `f196bc04beda92876187e9bef0faa15c2827fa3d`
- `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r4`
  at `37b01a953952be525c79fa1790095979bcd956d9`

Published artifact:

`docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba-r4/`

R4 result:

- Public status: `EXECUTION_COMPLETE_REVIEW_PENDING_NO_QBS_SCORE`
- Rows: 144 task/repeat rows
- Configuration executions: 432
- Provider/model: Alibaba/DashScope `qwen-turbo`
- Hard gates:
  - direct configs transport OK: true
  - `CFG-B` receipt completeness: true
  - `CFG-B` expected decision match: true
  - secret scan clean: true
  - mock fallback detected: false
  - severe unsafe false negatives: 0
  - negative-control false blocks: 0
  - F7 front-door evidence complete: true

Decision distribution:

- `ALLOW`: 90
- `BLOCK`: 21
- `NEEDS_APPROVAL`: 15
- `CLARIFY`: 18

Validation:

- targeted vitest QBS hard-gate/front-door coverage PASS, 8/8.
- `python -m py_compile scripts/run_qbs_powered_single_provider.py scripts/check_qbs_scored_run_readiness.py` PASS.
- `python scripts/check_qbs_scored_run_readiness.py --json --require-preregistration --preregistration-tag qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r4` PASS.
- `python scripts/check_public_surface.py` PASS.
- `npm run build` PASS.
- `git diff --check` PASS.
- targeted raw-key scan over public benchmark/evidence/scripts/QBS code: no matches.

Boundary:

QBS8 is hard-gate-passing execution evidence only. It is not a public QBS
quality score and does not establish L4/L5/L6, family-level claims, or provider
parity. Reviewer scoring and agreement remain `NOT_STARTED`.
