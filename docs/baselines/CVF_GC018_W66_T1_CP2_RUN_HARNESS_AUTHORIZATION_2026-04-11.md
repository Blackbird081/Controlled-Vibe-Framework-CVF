# CVF GC-018 W66-T1 CP2 — Run Harness Authorization

Memory class: FULL_RECORD

> Date: 2026-04-11
> Candidate ID: GC018-W66-T1-CP2-RUN-HARNESS
> Parent roadmap: `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
> CP1 closure: `docs/reviews/CVF_W66_T1_CP1_PVV_CORPUS_RUBRIC_FREEZE_REVIEW_2026-04-11.md`
> Corpus: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Rubric: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Guard: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md` (GC-042)
> Branch: `main`

---

## GC-018 Continuation Candidate

```
GC-018 Continuation Candidate
- Candidate ID: GC018-W66-T1-CP2-RUN-HARNESS
- Date: 2026-04-11
- Parent roadmap / wave: docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md
- Proposed scope: W66-T1 CP2 — Run Harness Setup
  (1) finalize CFG-A and CFG-B configuration specifications;
  (2) produce 5-task reviewer calibration set with scoring guidance;
  (3) define evidence capture schema and verification plan;
  (4) confirm evidence completeness can reach 100% before CP3 runs begin.
  CP2 governance deliverables are DOCUMENTATION class.
  CP3 (actual runs) is separately authorized after infrastructure + human freeze confirmation.
- Continuation class: VALIDATION_TEST
- Active quality assessment: docs/assessments/CVF_POST_W64_CONTINUATION_QUALITY_ASSESSMENT_2026-04-10.md
- Assessment date: 2026-04-10
- Weighted total: 10.0/10 (all planes DONE-ready/DONE; 7185+ tests 0 failures; W66-T1 CP1 test delta = 0)
- Lowest dimension: none (all at ceiling for governance documentation work)
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now:
    CP1 delivered a frozen corpus + rubric. CP2 governance deliverables (configuration
    spec + calibration set) are the next prerequisite before any run can be valid.
    Zero code impact. Zero contract changes. Zero test delta. No quality risk.
- Quality protection commitments:
    1. No production code, test, or contract changes in CP2 governance deliverables.
    2. Configuration specs define the boundary between CFG-A and CFG-B without
       modifying either the CVF core or the Anthropic API integration.
    3. Calibration scoring guidance is advisory only — it does not pre-score the
       frozen corpus; reviewers must score independently before seeing guidance.
    4. Corpus and rubric remain frozen; CP2 does not modify them.
- Why now:
    CP1 closed 2026-04-11. CP2 configuration specification is the direct next gate
    before any scored run can begin. Without concrete CFG-A/B definitions, reviewers
    cannot begin calibration and CP3 cannot be authorized.
- Active-path impact: NONE
- Risk if deferred:
    CP3 runs start without a clear baseline definition; CFG-A becomes undefined and
    the comparison is ungoverned; value claims cannot be supported.
- Lateral alternative considered: YES
- Why not lateral shift:
    No lateral alternative produces a well-defined comparison. CFG-A must be specified
    before the first comparative run.
- Real decision boundary improved: YES — configuration spec is a prerequisite gate
- Expected enforcement class: GOVERNANCE_DECISION_GATE (via GC-042)
- Required evidence if approved:
    - CVF_PRODUCT_VALUE_VALIDATION_CONFIG_SPEC_W66_T1_CP2_2026-04-11.md (FROZEN)
    - CVF_PRODUCT_VALUE_VALIDATION_REVIEWER_CALIBRATION_W66_T1_CP2_2026-04-11.md
    - CP2 closure review in docs/reviews/
    - Human operator must confirm: (a) infrastructure live, (b) reviewer pool assigned,
      (c) corpus + rubric freeze confirmed by human reviewer, before CP3 is opened.

Depth Audit
- Risk reduction: 2 (configuration spec prevents ungoverned comparison)
- Decision value: 2 (calibration set is a prerequisite for reviewer agreement)
- Machine enforceability: 1 (configuration adherence is process-enforced, not automated)
- Operational efficiency: 2 (structured harness prevents ad-hoc run variance)
- Portfolio priority: 2 (named next step in AGENT_HANDOFF.md)
- Total: 9
- Decision: CONTINUE
- Reason: CP1 CLOSED; corpus + rubric FROZEN; CP2 configuration spec + calibration set
  are zero-risk documentation prerequisites for CP3 runs; quality posture EXCELLENT.

Authorization Boundary
- Authorized now: YES
- Next batch name: W66-T1 CP2 — Run Harness Governance Deliverables
- Scope: DOCUMENTATION artifacts only; no code changes; no infrastructure execution
- CP3 (Blind Comparative Evaluation Runs) is NOT authorized by this document;
  CP3 requires its own fresh GC-018 after: (1) human freeze confirmation,
  (2) infrastructure live confirmation, (3) reviewer pool assigned.
```

---

## Configuration Specification — CFG-A vs CFG-B

### CFG-A — Direct Baseline

| Field | Value |
|---|---|
| Configuration ID | `CFG-A` |
| Label | Direct baseline |
| Model | `claude-sonnet-4-6` |
| API | Anthropic Messages API (`POST /v1/messages`) |
| SDK | `@anthropic-ai/sdk` latest |
| System prompt | Standard assistant default — no governance instruction, no role constraint, no policy gate. Exact text: `"You are a helpful AI assistant."` |
| Input format | `user` turn: task title + task prompt/input + required context, formatted as plain text |
| Max tokens | 2048 (same as CFG-B) |
| Temperature | 0.3 (deterministic for reproducibility) |
| Governance events | None — provider default safety only |
| Trace capture | Anthropic `request_id` + ISO-8601 started_at / completed_at |
| Evidence captured | raw_input, raw_output, request_id, started_at, completed_at |
| Audit log | None |
| Reviewer packet | raw output only (no governance metadata) |

**Input template for CFG-A:**
```
Task: {task_title}

Context: {required_context}

{prompt_input}
```

### CFG-B — CVF Governed Path

| Field | Value |
|---|---|
| Configuration ID | `CFG-B` |
| Label | CVF governed path |
| Model | `claude-sonnet-4-6` (same as CFG-A) |
| API | cvf-web `/api/execute` (POST) |
| Governance | Provider routing enabled; PolicyGateContract; evidence capture; audit log |
| System prompt | CVF governance system prompt (as configured in cvf-web provider routing) |
| Input format | Same task title + prompt/input + required context, wrapped in CVF execute request body |
| Max tokens | 2048 (same as CFG-A) |
| Temperature | 0.3 (same as CFG-A) |
| Governance events | PolicyGateContract verdict, provider routing decision, safety classification |
| Trace capture | CVF `trace_id` + governance event log + policy gate verdicts + ISO-8601 timestamps |
| Evidence captured | All CFG-A fields + governance_events, trace_id, policy_gate_verdict, cvf_audit_log |
| Audit log | Generated per request, retained in evidence store |
| Reviewer packet | Raw output + governance event summary (reviewers are blinded to configuration label for quality scoring) |

**Input template for CFG-B:**
```json
{
  "task_id": "{task_id}",
  "run_number": {run_number},
  "configuration": "CFG-B",
  "provider": "anthropic",
  "model": "claude-sonnet-4-6",
  "system_context": "governance_enabled",
  "messages": [
    {
      "role": "user",
      "content": "Task: {task_title}\n\nContext: {required_context}\n\n{prompt_input}"
    }
  ],
  "max_tokens": 2048,
  "temperature": 0.3
}
```

### Parity Rules

For the comparison to be valid, the following must be identical across CFG-A and CFG-B:

- Same task wording (zero mutation between configurations)
- Same model (`claude-sonnet-4-6`)
- Same max_tokens (2048)
- Same temperature (0.3)
- Same run window (same calendar week for each task pair)
- Same output budget class
- Reviewer blinding for quality scoring (configuration label hidden during usefulness/correctness/completeness/justification/actionability scoring)

Any deviation from these parity rules must be documented per run and the affected run flagged as `LOWER_CONFIDENCE`.

---

## Evidence Capture Schema

### Minimum evidence fields per run

```json
{
  "run_id": "string (globally unique, format: RUN-{task_id}-{cfg}-{n})",
  "task_id": "string",
  "configuration_id": "CFG-A | CFG-B",
  "run_number": "1 | 2 | 3",
  "model_version": "claude-sonnet-4-6",
  "started_at": "ISO-8601",
  "completed_at": "ISO-8601",
  "raw_input": "string (verbatim prompt sent)",
  "raw_output": "string (verbatim response received)",
  "trace_id": "string (Anthropic request_id for CFG-A; CVF trace_id for CFG-B)",
  "governance_events": "array | null (null for CFG-A; governance verdicts for CFG-B)",
  "execution_status": "SUCCESS | FAILED | TIMEOUT | INVALID",
  "evidence_complete": "YES | NO",
  "reviewer_verdict_path": "string | null (filled after reviewer scoring)"
}
```

### Evidence completeness verification checklist (pre-CP3 gate)

Before CP3 is authorized, a pilot run of the 5 calibration tasks must confirm:

- [ ] CFG-A pilot: all 5 tasks produce a run record with `evidence_complete: YES`
- [ ] CFG-B pilot: all 5 tasks produce a run record with `evidence_complete: YES`
- [ ] CFG-B pilot: governance events are non-null for all 5 CFG-B runs
- [ ] CFG-A and CFG-B raw outputs are stored and retrievable for blinded reviewer access
- [ ] Run IDs are globally unique and stable (no collisions)
- [ ] Reviewer packet generation produces a blinded document (configuration label absent)
- [ ] Calibration reviewer agreement reaches kappa ≥ 0.70 before CP3 authorized

Human operator must confirm all 7 items before CP3 authorization is opened.

---

## CP2 Scope Boundary

### In scope (CP2 governance deliverables — this document + calibration set)

- Configuration specification (CFG-A and CFG-B defined above)
- Reviewer calibration task set (5 tasks from frozen corpus)
- Evidence capture schema
- Evidence completeness verification checklist

### In scope (CP2 human operator actions — required before CP3)

- Stand up execution infrastructure (API keys, cvf-web instance, storage)
- Run 5 calibration pilot tasks through both CFG-A and CFG-B
- Confirm all 7 evidence completeness items
- Assign reviewer pool (≥3 reviewers)
- Conduct reviewer calibration session
- Confirm human freeze of corpus + rubric (agent-authored freeze is prerequisite, not final confirmation)

### Not in scope (CP3 — separate authorization)

- The 540 scored comparative runs (90 tasks × 2 configurations × 3 runs)
- Blind scoring of all runs by human reviewers
- Gate A/B/C/D measurement

---

*Generated: 2026-04-11*
*Authorization: GC018-W66-T1-CP2-RUN-HARNESS*
*Class: VALIDATION_TEST / DOCUMENTATION*
*Lane: Fast Lane (GC-021)*
