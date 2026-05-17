# CVF GC-018 Continuation Candidate - QBS-7 Rerun Pre-Registration

Memory class: FULL_RECORD
Status: CLOSED - RERUN PREREGISTERED / NO SCORED RUN
Date: 2026-05-10
Track: QBS-7 Rerun Pre-Registration
Parent track:
- `docs/reference/CVF_GC018_QBS6_HARD_GATE_REMEDIATION_CANDIDATE_2026-05-10.md`
- `docs/roadmaps/CVF_QBS6_HARD_GATE_REMEDIATION_ROADMAP_2026-05-10.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `GC018_QBS7_RERUN_PREREGISTRATION_2026_05_10`
- Date: 2026-05-10
- Parent roadmap / wave: QBS-6 hard-gate remediation and rerun planning
- Proposed scope: create a new public R2 run-set pre-registration and tag for
  rerun readiness, including the F7 ambiguous-request entrypoint decision.
- Continuation class: BENCHMARK_PREPARATION / GOVERNANCE_DECISION_GATE /
  PUBLIC_SURFACE_DISCIPLINE
- Active failed evidence:
  `docs/benchmark/runs/qbs1-powered-single-provider-20260510-alibaba/`
- Quality-first decision: PREREGISTER_RERUN_BEFORE_EXECUTION
- Why pre-registration is better than immediate rerun:
  QBS5 remains failed/no-score evidence. The rerun must freeze the changed
  `CFG-B` F7 entrypoint before any new live execution can be treated as fair
  benchmark evidence.
- Authorized work:
  - publish R2 run pre-registration;
  - publish R2 provider/model, config/entrypoint, and reviewer manifests;
  - publish a QBS7 rerun-plan note;
  - update public status and claim boundaries;
  - create and push the `qbs/preregister/...-r2` tag.
- Not authorized:
  - live scored rerun;
  - public QBS score;
  - L4/L5/L6 claim;
  - family-level claim;
  - provider parity claim;
  - changing the QBS5 failed result.

## Depth Audit

- Risk reduction: 2
- Decision value: 2
- Machine enforceability: 2
- Operational efficiency: 2
- Portfolio priority: 2
- Total: 10/10
- Decision: CONTINUE
- Reason:
  QBS7 freezes the rerun contract and prevents a silent entrypoint change
  between QBS5 failure analysis and any future QBS8 live rerun.

## Authorization Boundary

- Authorized now: YES
- Batch name: `QBS7-RERUN-PREREGISTRATION`
- Explicitly authorized:
  - public rerun pre-registration packet;
  - public preregistration tag;
  - readiness-checker status update for R2 tags;
  - private handoff/provenance update.
- Explicitly not authorized:
  - live provider rerun;
  - reviewer scoring;
  - QBS score publication.

## Closure Summary

- Public commit:
  `361ff91 Preregister QBS rerun packet`
- Public run ID:
  `qbs1-powered-single-provider-20260510-alibaba-r2`
- Public pre-registration tag:
  `qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r2`
- Tag SHA:
  `361ff91fb441b4fef1bdc4f9a7d78f0ed8a2a5e4`
- F7 decision:
  `QBS1-F7-T01` through `QBS1-F7-T06` keep expected decision `CLARIFY`, but
  valid `CFG-B` evidence must pass through the intent-first front door and
  clarification loop before execute handoff can count.
- Validation:
  `python scripts/check_qbs_scored_run_readiness.py --json --require-preregistration --preregistration-tag qbs/preregister/qbs1-powered-single-provider-20260510-alibaba-r2`
  PASS, public status `QBS7_RERUN_PREREGISTERED_NO_SCORED_RUN`.
- Boundary:
  QBS7 does not run or score a benchmark. QBS5 remains failed/no-score.
