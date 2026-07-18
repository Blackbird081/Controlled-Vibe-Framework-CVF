# CVF LHW1 Context Profile Connector — Specification

Memory class: FULL_RECORD

docType: reference

Status: ACTIVE

Contract version: `cvf.contextProfileConnector.lhw1.t3.v1`

Date: 2026-05-27

Authority: `docs/work_orders/CVF_WO_LHW1_T3_CONTEXT_PROFILE_CONNECTOR_2026-05-27.md`

---

## Purpose

A normative document connecting non-coder context capture fields, VI2
route request context profile readout fields, and VI3 agent memory capture
record fields to the T2 workflow packet — with compaction and relevance
rules drawn from the caveman/Workflow GoClaw legacy sources (LH1 ledger).

**Named context gap addressed (from T2 completion review):** The T2
connector's Section 2 phase table records `intake_pending` → `design_ready`
requires "context profile readiness confirmed" as evidence to enter
`design_ready`. Neither T1 nor T2 defined which VI2
`routeRequestContextProfile` fields must be populated. This connector
specifies that mapping.

`canReinject: false` is preserved from VI3 and M1/M2 boundaries. This
connector does not relax that constraint.

## Scope

Applies to all CVF governed workflow packets that use the T2 workflow chain
state connector and receive a VI2 `requestContextReadout` or a VI3
`captureRecord` from `/api/execute` responses.

Source authority:

- VI2: `docs/reviews/archive/CVF_VI2_ROUTE_REQUEST_CONTEXT_PROFILE_READOUT_COMPLETION_2026-05-25.md`
- VI3: `docs/reviews/archive/CVF_VI3_AGENTMEMORY_CAPTURE_RECORD_READOUT_COMPLETION_2026-05-25.md`
- LH1 ledger: `docs/reference/archive/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`
- T2: `docs/reference/CVF_LHW1_WORKFLOW_CHAIN_STATE_CONNECTOR_SPEC_2026-05-27.md`

---

## Section 1 — Purpose, Named Context Gap, and Claim Boundary

This connector is a documentation artifact. It does not modify
`route-request-context-readout.ts`, `audit-memory-receipt.ts`,
`route.ts`, or any `/api/execute` file. No TypeScript, JavaScript, or
Python file is modified.

What this connector does:
- Maps non-coder context capture fields to workflow packet destinations.
- Specifies which VI2 `requestContextReadout` fields must be present for
  the `intake_pending` → `design_ready` phase advance.
- Specifies compaction and relevance rules as advisory guidelines.
- Cross-references VI3 `captureRecord` for session role assignment.

What this connector does not do:
- No raw memory reinjection of any kind.
- No provider route behavior change.
- No LLM-based context scoring.
- No caveman full runtime budget engine implementation.
- No Workflow GoClaw full session classification runtime.
- No receipt envelope extension.

`canReinject: false` is preserved from VI3 and M1/M2 boundaries.
This connector does not relax that constraint. Context flows forward
into the workflow packet; it does not flow back into the provider prompt.

---

## Section 2 — Context Capture Field Mapping

A mapping of non-coder input fields to their workflow packet destination.
Use VI2 and VI3 field names verified against the current source files:
`route-request-context-readout.ts` and `audit-memory-receipt.ts`.

| Input field | Source surface | Workflow packet field | Compaction rule |
|---|---|---|---|
| User goal / outcome request | Non-coder form input | `workflowSpec.phases[intake].inputs` | Summarize to one sentence if > 500 chars (Rule 2) |
| Skill pack selected | C8 `/api/execute` readout | `packId` in T1 connector record | Exact value; no truncation |
| Readiness signals (`requestContextReadout.readiness`, `requestContextReadout.profile`) | VI2 `requestContextReadout` | Intake phase context profile header | Map `readiness` level verbatim; drop sub-signals that have no phase mapping (Rule 1) |
| Missing signals (`requestContextReadout.missingSignals`) | VI2 `requestContextReadout` | `workflowSpec.phases[intake].successCriteria` gap note | List each missing signal as a named gap; phase does not advance until resolved or waived (Rule 4) |
| Policy actor role (`captureRecord.policyContext.actorRole`) | VI3 `auditMemoryReceipt.captureRecord` | T2 Section 2 phase-role assignment (`Primary role` column) | Exact token; do not infer role from other fields |

Notes:
- `requestContextReadout.missingSignals` is the current VI2 field. Each item
  is a named missing context signal (for example
  `target_user_or_audience` or `constraints_or_success_criteria`).
- `captureRecord.policyContext.actorRole` is the current VI3 capture-record
  role field. `RouteAuditMemoryContext.sessionRole` exists as route input
  context, but it is not a `captureRecord.sessionRole` field.
- If either field is absent in a future implementation, record the value as
  unknown and stop for source re-verification; do not infer.

---

## Section 3 — Compaction and Relevance Rules

Advisory guidelines drawn from caveman (budget/relevance filtering) and
Workflow GoClaw (session classification and context cache) legacy sources,
per LH1 ledger dispositions. Rules are advisory — they guide a future
implementer; they do not describe current route behavior.

1. **Relevance rule** *(caveman, budget/relevance filtering)*: Only context
   fields with a direct mapping to a workflow packet field (Section 2 table)
   are included in the handoff. Fields that do not map to any packet field
   are dropped at intake.

2. **Compaction rule** *(caveman, budget/relevance filtering)*: If a context
   field exceeds 500 characters, it must be summarized to a single sentence
   before being placed in the workflow packet. The raw value is not passed
   downstream.

3. **Noise filter rule** *(Workflow GoClaw, context cache)*: Repeated,
   contradictory, or out-of-scope signals (e.g. references to other projects,
   unrelated providers, or prior session state) are excluded from the current
   workflow packet.

4. **Missing-signal rule** *(Workflow GoClaw, session classification)*: If a
   required context field is absent (e.g. `missingSignals` is non-empty for a
   required signal), the intake phase records it as a `successCriteria` gap.
   The phase does not advance to `design_ready` until the gap is resolved or
   explicitly waived by the Orchestrator.

5. **Memory boundary rule** *(VI3 + M1/M2 boundaries)*: No field from this
   connector may be marked `canReinject: true`. Context flows forward into
   the workflow packet; it does not flow back into the provider prompt as
   raw memory.

---

## Section 4 — Context-to-Workflow Handoff Mapping

Describes how mapped fields flow through the T2 state connector phases.
No `cvf-web` or route file is modified.

**At `intake_pending`:** The following context fields must be present before
the phase can advance to `design_ready`:
- User goal / outcome request (non-empty, compacted per Rule 2)
- Skill pack selection (`packId` non-null)
- VI2 `requestContextReadout.readiness` level (any value, including LOW;
  LOW triggers a `successCriteria` gap note but does not auto-block)
- VI2 `missingSignals`: if non-empty, each signal is recorded as a named
  gap in `workflowSpec.phases[intake].successCriteria`; Orchestrator must
  resolve or waive each gap before `design_ready` entry

**At `design_ready`:** The Implementer's MA1 `## 3 Source Packet` receives:
- compacted user goal
- `packId`
- intake context profile (VI2 `requestContextReadout.profile` and
  `readiness`)
- list of resolved/waived gaps from intake (for traceability)

**At `build_running`:** Context fields relevant to `build_running`:
- `packId` remains active
- original user goal remains for output alignment
- VI2 `profile` and `readiness` retained as advisory only
- raw VI2 sub-signals (token counts, word counts) are dropped as stale
  (Rule 3)

**At `review_pending`:** The Reviewer needs:
- original user goal (for outcome alignment check)
- skill pack name/`packId` (to verify output matches selected pack)
- the initial `missingSignals` list (to verify outstanding gaps were
  addressed)
- VI3 `captureRecord.policyContext.actorRole` (for role-gate audit
  confirmation)

**At `freeze_ready`:** Context fields archived in the receipt:
- user goal summary (compacted form)
- `packId`
- resolved/waived gap list
- VI3 `captureRecord` reference (by audit receipt id, not raw value)
- `canReinject: false` restated explicitly in final receipt

---

## Section 5 — What Remains Demand-Gated

Per LH1 ledger dispositions, the following items were NOT absorbed in T3:

- **`caveman` full runtime context budget engine**: remains
  `DEFER_DEMAND_GATED`. Reopen only when request-context budget or readout
  quality is a concrete proven need with a fresh GC-018.
- **`Workflow GoClaw` full session classification runtime**: remains
  `PARTIALLY_ABSORBED`. Reopen only when context profile packaging after
  selector/memory traffic exists.
- **LLM-based scoring of context relevance**: not in scope. The Section 3
  rules are deterministic/heuristic, not semantic.
- **Raw memory reinjection**: permanently blocked per M1/M2/VI3. No T3
  continuation may relax this.

This section closes the LHW1 absorption loop for T3 scope.

---

## Claim Boundary

This connector is a documentation artifact only. It does not claim runtime
context enforcement, VI2 field injection into the provider prompt, VI3 memory
reinjection, route behavior change, receipt envelope extension, LLM context
scoring, caveman runtime engine, Workflow GoClaw full session classification,
role-gate implementation, public-sync, hosted readiness, production readiness,
or freeze release.

Contract version: `cvf.contextProfileConnector.lhw1.t3.v1`.
