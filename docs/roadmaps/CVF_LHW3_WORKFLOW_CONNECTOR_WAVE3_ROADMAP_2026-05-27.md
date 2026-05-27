# CVF LHW3 Workflow Connector Wave 3 Roadmap

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: roadmap

Date: 2026-05-27

---

## Authorization / Decision

Authorized by operator direction on 2026-05-27: "Tiếp tục roadmap mới, quy tắc
cũ: yêu cầu 'nạp kiến thức từ legacy, hoàn chỉnh thêm các workflow — ưu tiên
flow đã có miếng rời rạc, chỉ còn thiếu chuẩn kết nối' để có giá trị."

LHW2 is CLOSED_PASS_BOUNDED_AFTER_CLEANUP. Session state `nextAllowedMove`
confirms: "next legacy absorption should prioritize high-value workflow
connectors with existing disconnected pieces." LHW3 is the direct continuation.

## Scope / Target / Owner Boundary

Target: three documentation connector specs binding existing proven runtime
pieces into coherent readout and routing chains.

Owner: CVF session-continuity and roadmap steering surface.

Allowed files per tranche: connector spec (new), work order (status update),
session continuity. No `.ts`/`.tsx`/`.js`/`.py` file. No `EXTENSIONS/`. No
receipt envelope schema. No public-sync repo.

## Purpose

LHW3 closes the third legacy workflow connector wave. LHW1 established the
horizontal layer: skill pack → workflow chain → context profile. LHW2 completed
vertical connectors: memory event loop, recovery packet, tool-approval handoff.
LHW3 fills the remaining gaps where runtime surfaces (W4, V3, CB1, VI2, MA1)
are closed and proven but no connector standard ties them into output-facing
chains:

- T1 — Operational Failure Trend Readout Connector
- T2 — Request Clarification Re-Intake Loop Connector
- T3 — Spec-Change Workflow Packet Connector

All three tranches are documentation-only. No source code, runtime module, live
provider route, or provider behavior is changed in LHW3.

## Operator Direction

The operator requested: "Tiếp tục roadmap mới, quy tắc cũ — ưu tiên flow đã
có miếng rời rạc, chỉ còn thiếu chuẩn kết nối."

LHW3 follows this direction by targeting flows where runtime pieces (W4, V3,
CB1, VI2, MA1, WR1, C8) already exist as proven closed tranches but no
connector standard ties them into a coherent output or handoff chain.

## Authority Chain

- LHW2 roadmap: `docs/roadmaps/CVF_LHW2_WORKFLOW_CONNECTOR_COMPLETION_ROADMAP_2026-05-27.md`
  — Status: CLOSED_PASS_BOUNDED_AFTER_CLEANUP
- LHW1 roadmap: `docs/roadmaps/CVF_LHW1_LEGACY_WORKFLOW_CONNECTOR_ABSORPTION_ROADMAP_2026-05-27.md`
  — Status: CLOSED_PASS_BOUNDED
- LH1 ledger: `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`
  — Remaining triggers for `abtop`, `Human System Harness`, `OpenSpec`
- Active session: `CVF_SESSION/ACTIVE_SESSION_STATE.json`
  — nextAllowedMove: "next legacy absorption should prioritize high-value
    workflow connectors with existing disconnected pieces"

## Knowledge Absorption Blind-Spot Control Block

Control standard:
`docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md`

Scope sources resolved before this roadmap:

- `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md`
- `docs/reference/CVF_LEGACY_HARVEST_SCAN_MAP_2026-05-24.md`
- `docs/reviews/CVF_W4_OPERATIONAL_BENCHMARK_SCORECARD_COMPLETION_2026-05-24.md`
- `docs/reviews/CVF_WR1_WORKFLOW_RECOVERY_STATE_PROOF_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_CB1_CONTEXT_BUDGET_REQUEST_SHAPING_READOUT_COMPLETION_2026-05-25.md`
- `docs/reviews/CVF_VI2_ROUTE_REQUEST_CONTEXT_PROFILE_READOUT_COMPLETION_2026-05-25.md`
- `docs/reference/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md`
- `docs/reviews/CVF_LHW2_T1_MEMORY_EVENT_CAPTURE_WORKFLOW_RECEIPT_LOOP_CONNECTOR_COMPLETION_2026-05-27.md`

Source families addressed per LH1 ledger triggers:

| Family | LH1 disposition | LH1 remaining trigger | LHW3 tranche |
| --- | --- | --- | --- |
| `abtop` + observability | PARTIALLY_ABSORBED | Reopen only for runtime observability dashboard or live failure-class trend readout | T1 |
| `CVF_AUDIT_LOG_md` | PARTIALLY_ABSORBED | Reopen for user-facing audit timeline/readout | T1 advisory |
| `Human System Harness` | PARTIALLY_ABSORBED | Reopen for noncoder request clarification or workflow recovery proof | T2 |
| `caveman` | DEFER_DEMAND_GATED | Reopen for request-context budget/readout quality when selector or memory context grows | T2 advisory |
| `OpenSpec` | PARTIALLY_ABSORBED | Reopen only if spec-change workflow is selected | T3 |
| `De_xuat.md` | PARTIALLY_ABSORBED | Reopen for integration SDK/runtime readiness only with concrete user flow | T3 advisory |

Accepted-source rule: each tranche reads the detailed legacy source files for
its family before implementation. Do not scope from summaries alone.

Blind-spot adversarial roles:

- Workflow Architect: each connector must create an actual output chain, not
  another prose inventory.
- Non-Coder Value Reviewer: connected flows must help a non-coder or agent
  understand what happened and what to do next.
- Governance Auditor: receipts, boundaries, and no hidden runtime claim in any
  section.
- Integration Maintainer: connector fields must be wirable to existing CVF
  owner surfaces without broad rewrites.

Stop rule: if any tranche requires runtime execution, raw memory reinjection,
external skill ingestion, database mutation, or provider behavior changes, stop
and return to Orchestrator.

Blind-spot verdict: CLEAR.

Basis: all scope sources exist; LH1 ledger triggers are named per family;
no new source family is opened without a ledger trigger; Candidate 7 external
ingestion remains HOLD; adversarial roles above completed; no runtime, provider,
or memory reinjection surface is claimed in T1/T2/T3.

## Candidate Screen

| Priority | Connector | Existing runtime pieces | Gap being closed | Disposition |
| --- | --- | --- | --- | --- |
| 1 | Operational Failure Trend Readout | W4 scorecard, V3 diagnostic classes, WR1 recovery readout, live receipt diagnostics | W4 reports per-call metrics; V3 classifies failures; no connector ties recurring failure classes into a trend readout chain showing drift/overconstraint signals | ACCEPT for T1 |
| 2 | Request Clarification Re-Intake Loop | CB1 request shaping, VI2 context profile missingSignals, C8 pack selection, WR1 advisory hold | CB1 identifies missing signals and contamination; no connector defines the standard clarification request packet that routes back through the intake loop | ACCEPT for T2 |
| 3 | Spec-Change Workflow Packet | W1 phase vocabulary, MA1 transfer packet, LHW1-T2 workflow chain, OpenSpec grammar | W1 defines workflow phases; MA1 defines role transfer; no connector specifies how a mid-workflow spec-change request packages its delta and re-enters the handoff chain | ACCEPT for T3 |

## Recommended Sequence

### LHW3-T1 — Operational Failure Trend Readout Connector

Deliverables:

- A connector spec mapping W4 scorecard metric fields and V3 diagnostic classes
  into a failure-trend readout chain:
  - field mapping: W4 scorecard event → V3 class → trend signal → recommended
    operator action
  - drift signal table: which W4 metric combinations indicate overconstraint,
    underperformance, or instability
  - readout shape: what a trend readout packet looks like for an operator or
    next agent (not live dashboard — doc-only)
  - boundary table: doc-only versus runtime-proven rows
- Source Verification Table covering every W4 and V3 field cited.

No `.ts`/`.tsx` or `EXTENSIONS/` file modified.

### LHW3-T2 — Request Clarification Re-Intake Loop Connector

Deliverables:

- A connector spec turning each CB1 missingSignal or contamination flag into a
  standard clarification request packet that routes back through the C8 intake
  loop:
  - CB1 signal class → clarification request type (missing-context, noisy-context,
    ambiguous-outcome, contaminated-pack)
  - minimum fields per clarification request packet (actor, signal, original
    packId, returnPath)
  - loop re-entry standard: how the clarification response closes the loop and
    returns to C8 pack selection
  - boundary table: doc-only versus runtime-proven rows
- Source Verification Table covering every CB1 and VI2 field cited.

Dispatch only after T1 is CLOSED_PASS.

### LHW3-T3 — Spec-Change Workflow Packet Connector

Deliverables:

- A connector spec mapping a mid-workflow spec-change request into a MA1-
  compatible change packet:
  - change-trigger table: which W1 phases allow a spec-change request, which
    block it until phase boundary
  - change packet fields: delta description, affected phase range, MA1
    sections impacted, re-entry phase token, approver role
  - MA1 sections R/O/N/A per change-trigger phase
  - explicit statement: "This connector does not grant authority to mutate a
    running workflow. The change packet is a governance record, not an executor."
  - boundary table: doc-only versus runtime-proven rows
- Source Verification Table covering every W1 and MA1 field cited.

Dispatch only after T1 + T2 are CLOSED_PASS.

## Non-Goals

- Runtime enforcement of any connector binding
- Extension of W4, V3, CB1, VI2, or WR1 runtime behavior
- New memory tiers, raw memory reinjection, or `canReinject=true`
- Live observability dashboard or live failure alerting
- Tool/MCP/database execution authority
- Receipt envelope schema changes
- External skill ingestion or Candidate 7 ingestion
- Provider behavior changes
- Hosted readiness, production readiness, or public release readiness
- Any tranche beyond T3 without a fresh roadmap and GC-018

## Work Plan

| Tranche | Deliverable | Gate |
| --- | --- | --- |
| T1 | Operational Failure Trend Readout Connector spec (5 sections) | None — open |
| T2 | Request Clarification Re-Intake Loop Connector spec (5 sections) | T1 CLOSED_PASS |
| T3 | Spec-Change Workflow Packet Connector spec (5 sections) | T1 + T2 CLOSED_PASS |

Each tranche: Fast Lane audit → work order → spec → completion review → session
continuity update → commit.

## Acceptance Criteria

- [x] T1 spec created; W4 scorecard fields and V3 classes used verbatim; Source
  Verification Table complete; drift signal table honest
- [x] T2 spec created; all CB1 signal classes mapped to clarification request
  types; loop re-entry standard present; boundary table honest
- [x] T3 spec created; all W1 change-trigger phases mapped; MA1 sections marked
  R/O/N/A; `runtimeExecutionAuthorized=false` (change packet is not an executor);
  LHW3 roadmap updated to `CLOSED_PASS_BOUNDED`
- [x] No `.ts`/`.tsx`/`.js`/`.py` file in diff across all three tranches
- [x] Session continuity updated after each tranche

## Closure

LHW3 is `CLOSED_PASS_BOUNDED`.

Delivered connector specs:

- T1: `docs/reference/CVF_LHW3_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_SPEC_2026-05-27.md`
- T2: `docs/reference/CVF_LHW3_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_SPEC_2026-05-27.md`
- T3: `docs/reference/CVF_LHW3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_SPEC_2026-05-27.md`

Completion reviews:

- `docs/reviews/CVF_LHW3_T1_OPERATIONAL_FAILURE_TREND_READOUT_CONNECTOR_COMPLETION_2026-05-27.md`
- `docs/reviews/CVF_LHW3_T2_REQUEST_CLARIFICATION_RE_INTAKE_LOOP_CONNECTOR_COMPLETION_2026-05-27.md`
- `docs/reviews/CVF_LHW3_T3_SPEC_CHANGE_WORKFLOW_PACKET_CONNECTOR_COMPLETION_2026-05-27.md`

Boundary: LHW3 closes documentation connector standards only. It does not claim
runtime observability, live clarification execution, spec-change enforcement,
receipt schema extension, provider behavior change, hosted readiness,
production readiness, or public release readiness.

## Verification

Roadmap-level:

- source files cited and LH1 triggers mapped per family;
- connector specs are in English and use existing CVF field names only;
- every boundary table row is honest about current status (doc-only vs proven);
- no runtime, provider, or memory claim without live proof.

Implementation-level (per work order):

- Source Verification Table required for any field cited from a runtime source;
  guessed or "confirm later" fields block closure;
- no `.ts`, `.tsx`, `.js`, `.py` file modified in T1/T2/T3;
- GC-023 file size guard: each spec < 250 lines; split at 200 if needed.

## Claim Boundary

LHW3 is a connector-normalization tranche. It does not claim runtime observability
dashboard, live failure alerting, live clarification loop execution, spec-change
workflow enforcement, memory reinjection, tool/MCP/database execution, provider
behavior changes, receipt envelope extensions, external skill ingestion, hosted
readiness, production readiness, or public release readiness.
