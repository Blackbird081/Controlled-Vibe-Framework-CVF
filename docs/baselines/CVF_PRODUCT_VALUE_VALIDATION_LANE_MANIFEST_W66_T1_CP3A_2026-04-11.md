# CVF Product Value Validation — CP3A Lane Manifest

Memory class: FULL_RECORD

> Wave: W66-T1
> Phase: CP3A — Provider-Hub Validation
> Date: 2026-04-11
> Operator confirmation: 2026-04-11 (human operator)
> Parent run manifest: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_W66_T1_CP2_2026-04-11.md`
> Corpus: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Rubric: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md` (FROZEN)
> Calibration set: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_REVIEWER_CALIBRATION_W66_T1_CP2_2026-04-11.md` (FROZEN)
> Guard: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md` (GC-042)
> Class: DOCUMENTATION / VALIDATION_TEST — Fast Lane (GC-021)

---

## Purpose

CP3A validates the CVF provider-hub claim: that the governed execution path (`/api/execute`)
correctly routes to and executes via multiple AI providers, producing evidence-complete run
records. This is distinct from CP3B (Controlled Value Test), which compares CFG-A direct
baseline vs CFG-B governed path within a single matched lane.

CP3A success criterion: at least one governed lane (Gemini or Alibaba) produces
`evidence_complete: YES` for all 5 calibration pilot tasks.

---

## Lane Matrix (FROZEN 2026-04-11)

| Lane ID | Provider | Model | Env Var | Endpoint | Status |
|---|---|---|---|---|---|
| `LANE-GEMINI-001` | `gemini` | `gemini-2.5-flash` | `GOOGLE_AI_API_KEY` | cvf-web `/api/execute` | **ACTIVE** |
| `LANE-ALIBABA-001` | `alibaba` | `qwen-turbo` | `ALIBABA_API_KEY` | cvf-web `/api/execute` | **PENDING — key missing** |

### Lane parity rules (CP3A)

- Both lanes use the CVF governed path (`/api/execute`) — no direct API calls
- Both lanes use the same task wording (zero mutation between lanes)
- Both lanes use `mode: "governance"` for governance event capture
- `max_tokens` and `temperature` are governed by cvf-web provider defaults per lane
- Reviewer blinding applies for quality scoring: lane label hidden during quality dimension scoring

---

## LANE-GEMINI-001 — Configuration Detail

| Field | Value |
|---|---|
| Lane ID | `LANE-GEMINI-001` |
| Provider | `gemini` |
| Model | `gemini-2.5-flash` (cvf-web default for gemini) |
| Endpoint | `POST /api/execute` on cvf-web instance |
| Auth | `x-cvf-service-token: pvv-pilot-2026` |
| Env var | `GOOGLE_AI_API_KEY` (server env only; never commit value) |
| Governance | CVF provider router, guard pipeline, policy gate, output validator |
| Trace capture | CVF response fields: `success`, `provider`, `model`, `executionTime`, `guardResult`, `providerRouting`, `enforcement`, `outputValidation` |
| Evidence fields | All standard run evidence schema fields + cvf governance fields |
| Status | **ACTIVE** — key confirmed in `.env.local` (2026-04-11) |

**Request template:**
```http
POST /api/execute
Content-Type: application/json
x-cvf-service-token: pvv-pilot-2026
```
```json
{
  "templateName": "PVV Calibration Pilot — {cal_id}",
  "inputs": {
    "task_title": "{task_title}",
    "task_prompt": "{verbatim_task_text}"
  },
  "intent": "{cal_id} {task_class} class: {task_title}",
  "provider": "gemini",
  "mode": "governance"
}
```

---

## LANE-ALIBABA-001 — Configuration Detail

| Field | Value |
|---|---|
| Lane ID | `LANE-ALIBABA-001` |
| Provider | `alibaba` |
| Model | `qwen-turbo` (cvf-web default for alibaba) |
| Endpoint | `POST /api/execute` on cvf-web instance |
| Auth | `x-cvf-service-token: pvv-pilot-2026` |
| Env var | `ALIBABA_API_KEY` (server env only; never commit value) |
| Governance | CVF provider router, guard pipeline, policy gate, output validator |
| Status | **PENDING** — `ALIBABA_API_KEY` not yet set in `.env.local`; lane cannot be activated until key is provided by human operator |

**To activate LANE-ALIBABA-001:**
1. Obtain `ALIBABA_API_KEY` from Alibaba Cloud DashScope console
2. Add `ALIBABA_API_KEY=<value>` to `.env.local` (out-of-band; never commit value)
3. Restart cvf-web dev server
4. Run CAL-001 through CAL-005 through alibaba lane
5. Update pilot evidence document with alibaba lane run records

---

## Calibration Pilot Scope (CP3A)

Before any full CP3A scored batch is authorized, the 5 calibration pilot tasks must be
run through each ACTIVE lane with evidence capture verified.

| Calibration ID | Task Class | Domain |
|---|---|---|
| CAL-001 | NORMAL | CVF Governance / Continuation Decision |
| CAL-002 | AMBIGUOUS | Healthcare / Clinical Decision Support |
| CAL-003 | HIGH_RISK | Enterprise Code Review / Cryptography |
| CAL-004 | ADVERSARIAL | CVF Governance / Urgency Override Attempt |
| CAL-005 | MULTI_STEP | SaaS Customer Success / PII Gate |

Evidence completeness gate (per lane, per task):
- `execution_status: SUCCESS`
- `raw_output` present and non-empty
- `providerRouting.decision: ALLOW` (or OVERRIDE)
- `guardResult.finalDecision` present
- `evidence_complete: YES`

---

## Lane Activation Log

| Date | Lane | Action | Operator |
|---|---|---|---|
| 2026-04-11 | `LANE-GEMINI-001` | Lane ID frozen; key confirmed in env; pilot run authorized | human operator |
| 2026-04-11 | `LANE-ALIBABA-001` | Lane ID frozen; key MISSING — pilot run blocked | human operator |

---

*Created: 2026-04-11*
*Class: DOCUMENTATION / VALIDATION_TEST*
*Lane: Fast Lane (GC-021)*
*CP3A full scored batch requires separate GC-018 after all pilot evidence confirmed*
