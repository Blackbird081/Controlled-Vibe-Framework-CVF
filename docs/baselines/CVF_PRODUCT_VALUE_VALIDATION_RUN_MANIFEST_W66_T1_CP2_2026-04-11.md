# CVF Product Value Validation Run Manifest — W66-T1 CP2

Memory class: FULL_RECORD

> Run set ID: PVV-RUNS-W66-T1-CP2
> Date: 2026-04-11 (created at CP1 close; CP2 execution requires separate authorization)
> Corpus ID: PVV-CORPUS-W66-T1-CP1
> Rubric ID: PVV-RUBRIC-W66-T1-CP1
> Assessment target: `docs/assessments/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_W66_T1_CP5_*.md` (future)
> Owner: CVF Governance Agent
> Run state: **PLANNED** — CP2 execution requires fresh GC-018 authorization and confirmed reviewer pool
> Guard: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md` (GC-042)

---

## 1. Run Set Overview

This manifest governs the CP2 (Instrumented Run Harness) and CP3 (Blind Comparative Evaluation) phases of the PVV wave.

### CP2 scope
- Connect CVF governed path to trace capture infrastructure
- Verify evidence completeness for all run types
- Validate that reviewer packet generation is stable before scored runs begin

### CP3 scope
- Execute baseline (CFG-A) vs. CVF governed path (CFG-B) on the 90-task frozen corpus
- 3 runs per task per configuration = 540 minimum runs
- Human reviewers score all outputs against the frozen rubric
- Blinded scoring for usefulness and quality dimensions

### Minimum total runs
- 90 tasks × 2 configurations × 3 runs = **540 runs**

---

## 2. Compared Configurations

| Configuration ID | Label | Description | Model/version | Notes |
|---|---|---|---|---|
| `CFG-A` | Direct baseline | LLM direct call without CVF orchestration, governance routing, or evidence capture; minimal safety defaults from provider only | To be confirmed at CP2 auth | Must use same model family as CFG-B |
| `CFG-B` | CVF governed path | Full CVF product flow: governance routing, policy gates, skill contracts, evidence capture, audit log | Current CVF main branch | Primary validation target |
| `CFG-C` | CVF reduced-control diagnostic | CVF with selected controls disabled for isolation analysis | Optional — requires separate CP2 auth scope | Only if needed to isolate control value |

---

## 3. Freeze Checklist

Status at CP1 close (2026-04-11):

- [x] Corpus frozen — PVV-CORPUS-W66-T1-CP1 (FROZEN 2026-04-11)
- [x] Rubric frozen — PVV-RUBRIC-W66-T1-CP1 (FROZEN 2026-04-11)
- [ ] Compared configurations frozen — PENDING (requires CP2 GC-018 authorization)
- [ ] Task IDs locked — DONE at corpus freeze; confirmed at CP2 start
- [ ] Reviewer pool assigned — PENDING (requires CP2 GC-018 authorization)
- [ ] Evidence retention path declared — PENDING (requires CP2 infrastructure setup)

**If any box is unchecked when runs begin, the run set is not valid for final scoring.**

---

## 4. Execution Rules (to be confirmed at CP2 authorization)

- **Runs per task per configuration**: 3 (minimum for reproducibility)
- **Timeout / retry rule**: Run timeout to be set at 5 minutes per task; retry once on timeout; if retry also times out, record as `TIMEOUT` with full trace
- **Prompt mutation rule**: Zero mutation — task wording must be identical between configurations; any deviation must be documented and the run flagged as `LOWER_CONFIDENCE`
- **Output capture rule**: Full raw output captured verbatim; no truncation; stored in evidence retention path
- **Trace capture rule**: CVF trace ID, governance event log, policy gate verdicts captured per run; CFG-A runs capture provider-level trace only
- **Failed-run rerun rule**: Runs with `execution_status: FAILED` may be rerun once with the same configuration; if rerun also fails, record both runs as FAILED and exclude from scoring with documentation
- **Reviewer assignment rule**: Each reviewer assigned to a specific task scope; reviewer rotation designed to ensure no reviewer scores all runs for a single task across both configurations (reduces bias)

---

## 5. Evidence Completeness Requirements

Every scored run must have all of the following present. Any run missing any field is classified as `TRACE_INCOMPLETE` and cannot contribute to audit completeness score.

- [ ] task_id
- [ ] configuration_id
- [ ] run_id (globally unique)
- [ ] run_number (1, 2, or 3 within the task × configuration set)
- [ ] trace_id (CVF trace or provider trace)
- [ ] raw_input (verbatim prompt)
- [ ] raw_output (verbatim output)
- [ ] started_at (timestamp)
- [ ] completed_at (timestamp)
- [ ] governance_events (CVF policy gate verdicts or empty list for CFG-A)
- [ ] reviewer_verdict (full rubric scores)
- [ ] failure_taxonomy (primary + secondary)
- [ ] evidence_complete: YES | NO

**Audit completeness gate**: 100% of scored runs must have `evidence_complete: YES`. Any run with `NO` causes Gate D to FAIL.

---

## 6. Run Record Template

One block per run (unique combination of task × configuration × run number).

```text
### Run: <RUN-ID>

- task_id: <TASK-ID>
- configuration_id: CFG-A | CFG-B
- run_number: 1 | 2 | 3
- trace_id: <provider-trace-id or cvf-trace-id>
- started_at: <ISO-8601>
- completed_at: <ISO-8601>
- execution_status: SUCCESS | FAILED | TIMEOUT | INVALID
- raw_output_path: <path or storage reference>
- trace_path: <path or storage reference>
- governance_log_path: <path or storage reference>
- reviewer_verdict_path: <path or storage reference>
- evidence_complete: YES | NO
- rerun_of: <RUN-ID> | N/A
- notes: <free text>
```

---

## 7. Reviewer Assignment Table (to be populated at CP2 authorization)

| Reviewer ID | Task scope | Blind status | Escalation role | Notes |
|---|---|---|---|---|
| `REV-001` | TBD | `BLINDED` | `PRIMARY` | Corpus A families |
| `REV-002` | TBD | `BLINDED` | `PRIMARY` | Corpus A families |
| `REV-003` | TBD | `BLINDED` | `SECONDARY` | Corpus B + C |
| `REV-004` | TBD | `BLINDED` | `TIE-BREAK` | Disagreement resolution only |

Reviewer pool must be confirmed and documented before CP2 runs begin.

---

## 8. Calibration Protocol

Before first scored run:

1. All reviewers complete 5 calibration tasks (pre-selected from the corpus)
2. Calibration results are reviewed together (not blinded)
3. Scoring discrepancies ≥2 points on any dimension are discussed and resolved
4. Calibration kappa is calculated; if < 0.70, additional calibration rounds are required
5. Calibration completion is documented before any production runs begin

---

## 9. Blinding Protocol

- During quality scoring (usefulness, correctness, completeness, justification, actionability): reviewer receives only the task description and the output; configuration label is NOT shown
- During governance scoring: reviewer may see whether the output included a governance event log (since CFG-A will not have one); this is considered acceptable unblinding for governance scoring only
- Any accidental configuration identity leak must be documented; affected runs are flagged as `LOWER_CONFIDENCE` for quality dimensions

---

## 10. Invalidating Conditions

A run set is **invalidated** if any of the following occur:

- Corpus wording changed after freeze (any change except documented malformed-task correction)
- Rubric scoring criteria changed after freeze
- Any scored run has missing evidence and `evidence_complete: NO`
- Configuration drift between runs (different model versions used within the same configuration without disclosure)
- Reviewer identity leaked into blinded scoring and demonstrably affected the result
- Post-run task removal performed without documented malformed-task approval

Invalidated run sets must be documented; a fresh run set may be opened only with a new CP2 authorization.

---

## 11. CP2 Authorization Requirements

A fresh GC-018 authorization for CP2 must include:

- Confirmed execution infrastructure (API access, trace capture, storage)
- Confirmed reviewer pool (at least 3 reviewers assigned)
- Confirmed model versions for CFG-A and CFG-B
- Confirmed evidence retention path
- Calibration session scheduled before run start
- Run execution window (target start date and target completion date)

---

## 12. Evidence Ledger

- Corpus packet: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md`
- Rubric packet: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md`
- Raw run storage: PENDING — to be declared at CP2 authorization
- Reviewer packet: PENDING — to be populated per reviewer at CP2 authorization
- Final assessment: PENDING — `docs/assessments/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_W66_T1_CP5_*.md` (future)

---

*Created: 2026-04-11 (at CP1 close)*
*Run state: PLANNED — execution requires fresh CP2 GC-018 authorization*
*Minimum runs when authorized: 540 (90 tasks × 2 configurations × 3 runs)*
