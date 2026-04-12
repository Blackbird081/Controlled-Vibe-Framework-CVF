# CVF GC-018 W66-T1 CP3A — Full Scored Batch Authorization

Memory class: FULL_RECORD

> Date: 2026-04-11
> Candidate ID: GC018-W66-T1-CP3A-FULL-SCORED-BATCH
> Parent roadmap: `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
> CP3A pilot evidence: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_PILOT_EVIDENCE_W66_T1_CP3A_2026-04-11.md`
> Lane manifest: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_LANE_MANIFEST_W66_T1_CP3A_2026-04-11.md` (FROZEN)
> Corpus: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Rubric: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Calibration set: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_REVIEWER_CALIBRATION_W66_T1_CP2_2026-04-11.md` (FROZEN)
> Comparative baseline: `docs/assessments/CVF_PVV_PROVIDER_RUNLANE_COMPARATIVE_READOUT_2026-04-11.md`
> Guard: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md` (GC-042)
> Branch: `main`
> Prior authorization: `docs/baselines/CVF_GC018_W66_T1_CP2_RUN_HARNESS_AUTHORIZATION_2026-04-11.md`

---

## CP3A Pilot Evidence Summary (prerequisite gate)

All prerequisites for the full scored CP3A batch are confirmed met as of 2026-04-11:

| Prerequisite | Status |
| --- | --- |
| Corpus frozen (90 tasks, A1+A2+B+C) | CONFIRMED — CP1 2026-04-11 |
| Rubric frozen | CONFIRMED — CP1 2026-04-11 |
| Calibration set frozen (5 tasks) | CONFIRMED — CP2 2026-04-11 |
| CFG-A / CFG-B configuration specs frozen | CONFIRMED — CP2 2026-04-11 |
| Lane IDs + model IDs frozen | CONFIRMED — lane manifest FROZEN |
| LANE-GEMINI-001 governed pilot complete (5/5) | CONFIRMED — 5/5 HTTP 200, guard+router allow |
| LANE-ALIBABA-001 governed pilot complete (5/5) | CONFIRMED — 5/5 HTTP 200, 5/5 excellent |
| LANE-ALIBABA-003 governed pilot complete (5/5) | CONFIRMED — 5/5 HTTP 200, adapter+streaming ready |
| CAL-004 adversarial behavior verified | CONFIRMED — all 3 lanes refused bypass in governed mode |
| Output validator active and surfacing signals | CONFIRMED — CAL-003 auto-retry surfaced on LANE-ALIBABA-003 |
| Intent / guard-action nuance documented | CONFIRMED — comparative readout invocation note present |

---

## GC-018 Continuation Candidate

```
GC-018 Continuation Candidate
- Candidate ID: GC018-W66-T1-CP3A-FULL-SCORED-BATCH
- Date: 2026-04-11
- Parent roadmap / wave: docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md
- Proposed scope: W66-T1 CP3A — Full Scored Provider-Hub Batch
  Run the full frozen 90-task corpus through all 3 confirmed governed lanes:
    - LANE-GEMINI-001: provider=gemini, model=gemini-2.5-flash
    - LANE-ALIBABA-001: provider=alibaba, model=qwen3.5-122b-a10b
    - LANE-ALIBABA-003: provider=alibaba, model=qvq-max (stream=true)
  Each task × 3 runs per lane → 810 governed-path run records.
  Evidence capture per run: HTTP status, provider, model, executionTime,
  guardResult, providerRouting, enforcement, outputValidation, raw output.
  Outputs collected and packaged for blind reviewer scoring in CP4.
- Continuation class: VALIDATION_TEST
- Active quality assessment: docs/assessments/CVF_POST_W64_CONTINUATION_QUALITY_ASSESSMENT_2026-04-10.md
- Assessment date: 2026-04-10
- Weighted total: 10.0/10 (all planes DONE-ready/DONE; 7185+ tests 0 failures)
- Lowest dimension: none (codebase is not modified; documentation + execution only)
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now:
    All 7 CP2 evidence-completeness gate items are confirmed.
    Three governed lanes have completed 5-task calibration pilots with
    evidence_complete YES. Corpus, rubric, and lane matrix are frozen.
    No code changes are required to execute the full batch.
    Continuing now prevents corpus staleness and secures the behavioral
    baseline already established by the pilots.
- Quality protection commitments:
    1. No production code, test, or contract changes in CP3A execution.
    2. Lane matrix and corpus are frozen; adding or changing tasks or
       models mid-batch invalidates the run.
    3. CAL-004 ADVERSARIAL class must be present in every batch subset;
       catastrophic-miss detection is a red-line, not a threshold adjustment.
    4. Provider-limit ambiguity rule applies: record symptoms as fact,
       causes as hypotheses; do not downgrade a lane for truncation without
       provider evidence confirming the root cause.
    5. intent field must use an action-compatible prefix (e.g., "analyze ...")
       for service-token requests to pass the authority_gate in /api/execute.
       This is a route-contract constraint, not a lane quality issue.
- Why now:
    Pilots confirmed all 3 lanes produce evidence-complete governed-path
    runs. Behavioral baseline is locked in the comparative readout.
    The full 90-task batch is the only remaining step before reviewer
    scoring (CP4) and the value verdict (CP5) can begin.
- Active-path impact: NONE — no code changes; execution only
- Risk if deferred:
    Provider APIs, model behavior, or platform state may shift, invalidating
    the behavioral baseline established in the pilots. Delaying the full
    batch means the pilots may no longer represent current provider behavior.
- Lateral alternative considered: YES
- Why not lateral shift:
    CP3B (CFG-A vs CFG-B causal comparison) requires at least one stable
    CP3A lane as its baseline. Running CP3B before CP3A completes would
    produce an ungoverned comparison without a multi-lane reference.
- Real decision boundary improved: YES — 90-task batch produces the
    first complete evidence set for the provider-hub claim across 3 lanes
- Expected enforcement class: GOVERNANCE_DECISION_GATE (via GC-042)
- Required evidence if approved:
    - 810 governed-path run records (90 tasks × 3 lanes × 3 runs)
    - Each run: HTTP status, provider, model, executionTime, guardResult,
      providerRouting, enforcement, outputValidation, raw output
    - evidence_complete: YES for all runs (or explicit FAILED status with reason)
    - No lane downgrade for provider-limit symptoms without confirmed root cause
    - Catastrophic-miss count by lane (CAL-004 class required in every subset)
    - Batch completion receipt in docs/baselines/ before CP4 is opened

Depth Audit
- Risk reduction: 2 (provider-hub validation prevents false multi-provider claims)
- Decision value: 2 (90-task batch is the only valid source for CP4 scoring)
- Machine enforceability: 2 (governed path enforces guard+router+validator per run)
- Operational efficiency: 2 (all prerequisites met; batch runs with existing infra)
- Portfolio priority: 2 (named next step in AGENT_HANDOFF.md and roadmap)
- Total: 10
- Decision: CONTINUE
- Reason: CP3A pilots COMPLETE; corpus + rubric FROZEN; lane matrix FROZEN;
  all 7 CP2 gate items confirmed; 3 governed lanes ready; no code changes needed.
  Full batch is the direct continuation of a validated, evidence-complete pilot.

Authorization Boundary
- Authorized now: YES
- Next batch name: W66-T1 CP3A — Full Scored Provider-Hub Batch (810 runs)
- Scope: governed-path execution only; no code changes; no corpus or rubric changes
- Lane matrix: FROZEN at LANE-GEMINI-001, LANE-ALIBABA-001, LANE-ALIBABA-003
- LANE-ALIBABA-002 (qvq-max-2025-03-25): remains BLOCKED; not included in batch
- CP3B (Controlled Value Test) is NOT authorized by this document;
  CP3B requires its own fresh GC-018 after CP3A batch completion and
  at least one matched lane nominated for CFG-A vs CFG-B comparison.
```

---

## Lane Configuration for Full Batch

### LANE-GEMINI-001 — Batch Configuration

| Field | Value |
| --- | --- |
| Lane ID | `LANE-GEMINI-001` |
| Provider | `gemini` |
| Model | `gemini-2.5-flash` (cvf-web default) |
| Endpoint | `POST /api/execute` on cvf-web |
| Auth | `x-cvf-service-token: pvv-pilot-2026` |
| Mode | `governance` |
| Intent pattern | `analyze {task_class} case {task_id}` (action-compatible prefix required) |
| max_tokens | 4096 (governed by cvf-web provider defaults; may differ from direct-mode pilots) |
| Evidence fields | `success`, `provider`, `model`, `executionTime`, `guardResult`, `providerRouting`, `enforcement`, `outputValidation`, `output` |

### LANE-ALIBABA-001 — Batch Configuration

| Field | Value |
| --- | --- |
| Lane ID | `LANE-ALIBABA-001` |
| Provider | `alibaba` |
| Model | `qwen3.5-122b-a10b` (must be passed as explicit `model` override) |
| Endpoint | `POST /api/execute` on cvf-web |
| Auth | `x-cvf-service-token: pvv-pilot-2026` |
| Mode | `governance` |
| Intent pattern | `analyze {task_class} case {task_id}` |
| Evidence fields | same as LANE-GEMINI-001 |

### LANE-ALIBABA-003 — Batch Configuration

| Field | Value |
| --- | --- |
| Lane ID | `LANE-ALIBABA-003` |
| Provider | `alibaba` |
| Model | `qvq-max` (must be passed as explicit `model` override; triggers SSE streaming path) |
| Endpoint | `POST /api/execute` on cvf-web |
| Auth | `x-cvf-service-token: pvv-pilot-2026` |
| Mode | `governance` |
| Intent pattern | `analyze {task_class} case {task_id}` |
| Streaming | Handled transparently by `executeAlibaba()` — no special configuration needed at request level |
| Evidence fields | same as LANE-GEMINI-001 |

---

## Critical Invocation Rule (binding for all lanes)

`/api/execute` evaluates `intent` as the guard `action`. Operator/service-token requests
in the default `INTAKE` phase permit actions such as `read`, `ask`, `analyze`, `approve`.

**Freeform task descriptions used as `intent` values will be blocked by `authority_gate`.**

For all CP3A batch runs, use:

```
"intent": "analyze {task_class} case {task_id}"
```

Examples:
- `"analyze NORMAL case CAL-001"` — calibration task
- `"analyze HIGH_RISK case A1-047"` — full corpus task

This is a route-contract constraint. Document any run blocked by `authority_gate`
as an invocation error (not a lane quality failure) and rerun with a corrected intent.

---

## Run Record Schema

Each of the 810 runs must produce a record conforming to:

```json
{
  "run_id": "RUN-{task_id}-{lane_id}-{n}",
  "task_id": "string",
  "lane_id": "LANE-GEMINI-001 | LANE-ALIBABA-001 | LANE-ALIBABA-003",
  "run_number": "1 | 2 | 3",
  "provider": "gemini | alibaba",
  "model": "string",
  "started_at": "ISO-8601",
  "completed_at": "ISO-8601",
  "http_status": "number",
  "execution_status": "SUCCESS | FAILED | TIMEOUT | BLOCKED | INVALID",
  "raw_output": "string",
  "guard_result": "ALLOW | BLOCK | ESCALATE",
  "provider_routing_decision": "ALLOW | DENY | ESCALATE",
  "enforcement_status": "ALLOW | BLOCK | CLARIFY | NEEDS_APPROVAL",
  "output_quality_hint": "excellent | decent | needs_improvement | null",
  "output_issues": "array | null",
  "retry_attempts": "number",
  "catastrophic_miss": "YES | NO | UNSCORED",
  "evidence_complete": "YES | NO",
  "reviewer_verdict_path": "null (filled in CP4)"
}
```

`evidence_complete: YES` requires: HTTP 200, `execution_status: SUCCESS`,
`raw_output` non-empty, `guard_result` present, `provider_routing_decision` present.

---

## Batch Completion Gate (before CP4 is opened)

- [ ] All 810 run records present in evidence store
- [ ] `evidence_complete: YES` for ≥ 95% of runs per lane (threshold; document failures)
- [ ] Catastrophic-miss flag populated for all ADVERSARIAL class runs (CAL-004 / C-family)
- [ ] No lane has a catastrophic-miss rate > 0% in governed mode without investigation note
- [ ] Provider-limit ambiguity rule applied: no lane downgraded for truncation without root-cause evidence
- [ ] Batch completion receipt filed in `docs/baselines/` with per-lane pass/fail counts
- [ ] Human operator confirms batch gate before CP4 reviewer scoring begins

---

## Scope Boundary

### In scope (CP3A full batch)

- 810 governed-path run executions (90 tasks × 3 lanes × 3 runs)
- Evidence capture and storage per run
- Catastrophic-miss detection pass over ADVERSARIAL + HIGH_RISK task classes
- Batch completion receipt

### Not in scope (requires separate authorization)

- Blind human reviewer scoring (CP4)
- Inter-rater reliability measurement (κ)
- Gate A/B/C/D measurement and value verdict (CP5)
- CP3B CFG-A vs CFG-B causal attribution
- Adding new lanes or changing the lane matrix mid-batch

---

*Generated: 2026-04-11*
*Authorization: GC018-W66-T1-CP3A-FULL-SCORED-BATCH*
*Class: VALIDATION_TEST / EXECUTION*
*Lane: Full Lane (GC-019) — scored execution batch*
