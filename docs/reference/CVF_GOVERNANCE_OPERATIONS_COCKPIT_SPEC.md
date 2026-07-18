# CVF Governance Operations Cockpit Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: product_spec

Date: 2026-05-29

Phase: A — documentation spec only

---

## Purpose

Define the canonical CVF Governance Operations Cockpit: an operator-grade
dashboard specification mapping each cockpit element to an existing CVF
governance surface with verified source paths, refresh cadence, and drill-down
routes.

This is Phase A only. Phase B (cvf-web UI wiring) requires a separate GC-018.

This closes CVF 25.05 Gap 5: CVF has per-call advisory outputs but no
aggregated operator-grade dashboard spec.

## Scope / Applies To

Applies to: CVF product governance steering surface. Target: documentation-only
cockpit spec. No UI implementation.

---

## S1 — Purpose and Claim Boundary

### Purpose

CVF's governance pipeline produces per-call advisory outputs across LHW
connectors, W4 scorecards, V3 diagnostics, and release gates. An operator or
governance reviewer has no single-surface view of what is healthy, what is
degraded, and what needs attention.

This cockpit spec defines the canonical dashboard surface: what an operator
sees, at what refresh cadence, with what drill-down paths, and which CVF
surface sources each element.

### Claim Boundary

This is a product specification. It does not claim runtime dashboard wiring,
cvf-web UI changes, live data aggregation, or production readiness. Phase B
wiring requires a separate GC-018.

---

## S2 — Cockpit Elements

### Element 1: Provider Lane Health

**What:** Per-provider status indicators with active/healthy/degraded/down states.

**Source:** LHW10-T3 `providerHealthAdvisoryType`
- Source path: `docs/reference/CVF_LHW10_T3_PROVIDER_HEALTH_DEGRADATION_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` — S2 advisory types

**Refresh cadence:** Per-call (each `/api/execute` receipt updates lane state)

**Drill-down:** Click provider lane → show latest 10 execution receipts with
latency, HTTP status, diagnostic class

**Layout:** horizontal lane bar (one per provider) with green/yellow/red/grey state
indicator

### Element 2: Release Gate Status

**What:** Current release gate bundle pass/fail status with last run timestamp.

**Source:** W4 `OperationalBenchmarkScorecard` → `clarityStatus`
- Source path: `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` line 75
- Values: `clean`, `marginal`, `degraded`, `failing`, `no_data`

**Refresh cadence:** Per release gate run (operator-triggered)

**Drill-down:** Click → show individual gate results with pass/fail detail

**Layout:** status card with icon, last run time, pass ratio

### Element 3: Latest Receipt

**What:** Most recent governance evidence receipt ID, decision, and timestamp.

**Source:** V3 `ExecutionDiagnostic` contract
- Source path: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-diagnostics.ts` lines 16–38
- Fields: `receiptId`, `stage`, `class`, `safeMessage`

**Refresh cadence:** Per-call

**Drill-down:** Click → view full receipt chain with all stage receipts

**Layout:** compact receipt card with decision badge (ALLOW/DENY/ESCALATE)

### Element 4: Policy Block/Allow Ratio

**What:** Ratio of policy-blocked vs. allowed executions over the current session.

**Source:** V3 `ExecutionDiagnosticClass` aggregation
- Source path: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-diagnostics.ts` lines 16–38
- Classes: `policy_blocked`, `approval_required`, `routing_denied` (blocked);
  all other `live`-mode receipts (allowed)

**Refresh cadence:** Per-call, with session-level aggregation

**Drill-down:** Click → show blocked executions with policy reason and recommendation

**Layout:** ratio bar (blocked count / total count) with percentage

### Element 5: Quota / Cost Preflight

**What:** Estimated token consumption and cost for current session.

**Source:** CB1 `budgetTier` + provider cost tier
- Source path: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/budget.ts`
- Fields: `budgetTier` (`minimal`, `standard`, `expanded`)

**Refresh cadence:** Per-call accumulation

**Drill-down:** Click → show per-provider cost breakdown

**Layout:** cost bar with tier indicator and estimated session total

### Element 6: Failed Workflow Packs

**What:** List of workflow pack executions that failed or required human
intervention.

**Source:** MA1 transfer packet `## 7. Dissent And Review Ledger` + V3 diagnostic
- Source path: `docs/reference/archive/CVF_INTERNAL_MULTI_AGENT_WORK_TRANSFER_PACKET_STANDARD_2026-05-26.md` — Section 7

**Refresh cadence:** Per failure event

**Drill-down:** Click → show MA1 dissent ledger for that execution

**Layout:** list of failed packs with reason, retry count, and escalation status

### Element 7: Role Rejection Events

**What:** Count and list of executions where G1 identity gate denied a role.

**Source:** G1 identity gate — `role_resolution_denied` decision
- Source path: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-identity.ts`
- LHW11-T1 `sessionGovernancePostureType` at `posture_blocked`

**Refresh cadence:** Per rejection event

**Drill-down:** Click → show identity resolution trace with denied reason

**Layout:** count badge with expandable list

### Element 8: Evidence Export Queue

**What:** Count of evidence receipts awaiting export or with pending audit.

**Source:** Receipt store + LHW5-T2 `artifactExportBoundaryAdvisory`
- Source path: `docs/reference/archive/CVF_LHW5_ARTIFACT_EXPORT_BOUNDARY_ADVISORY_CONNECTOR_SPEC_2026-05-27.md` — S2 advisory types

**Refresh cadence:** Per export event

**Drill-down:** Click → show export queue with advisory type per item

**Layout:** queue count with status: exported / pending / blocked

### Element 9: Session Governance Posture

**What:** Current session posture with risk level and active advisories.

**Source:** LHW11-T1 `sessionGovernancePostureType` + `highestRiskAdvisory`
- Source path: `docs/reference/CVF_LHW11_T1_SESSION_GOVERNANCE_POSTURE_AGGREGATOR_CONNECTOR_SPEC_2026-05-28.md` — S3 field list
- Values: `posture_clear`, `posture_hold`, `posture_blocked`

**Refresh cadence:** Per governance event (intake, policy hit, approval change)

**Drill-down:** Click → show posture aggregation trace from LHW10-T1, LHW10-T3,
LHW9-T1, LHW8-T2 advisory inputs

**Layout:** posture badge (green/yellow/red) with risk advisory text

### Element 10: Memory Continuity Level

**What:** Current memory continuity level advisory (L0–L3).

**Source:** LHW13-T2 `memoryContinuityLevelAdvisoryType`
- Source path: `docs/reference/archive/CVF_LHW13_T2_MEMORY_CONTINUITY_LEVEL_ADVISORY_CONNECTOR_SPEC_2026-05-29.md` — S3 field list

**Refresh cadence:** Per memory snapshot or context change event

**Drill-down:** Click → show continuityLevelBoundaryNote with L0-L3 reasoning

**Layout:** level indicator (L0/L1/L2/L3) with boundary note

### Element 11: MCP/Tool Approval Posture

**What:** Current MCP tool approval posture from the admission gateway.

**Source:** LHW9-T1 `mcpApprovalAdvisoryType`
- Source path: `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` — S3 field list

**Refresh cadence:** Per MCP tool approval request

**Drill-down:** Click → show tool list with approval states

**Layout:** posture badge with tool count

---

## S3 — Cockpit Layout Specification

### Dashboard Grid

```
┌──────────────────────────────────────────────────────────────────┐
│  COCKPIT HEADER: Session Posture + Refresh Timestamp            │
├─────────────┬─────────────┬─────────────┬──────────────────────┤
│ Provider    │ Release     │ Policy      │ Latest               │
│ Lane Health │ Gate Status │ Block/Allow │ Receipt              │
│ (bar)       │ (card)      │ Ratio (bar) │ (card)               │
├─────────────┴─────────────┴─────────────┴──────────────────────┤
│                                                                  │
│  Failed Workflow Packs (list)   │  Evidence Export Queue (badge)│
│  Role Rejection Events (badge)  │  Quota/Cost Preflight (bar)  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Bottom Bar: Memory Level │ MCP Posture │ Last Diagnostic       │
└──────────────────────────────────────────────────────────────────┘
```

### Color Scheme

| State | Color | Meaning |
| --- | --- | --- |
| `healthy` / `clean` / `posture_clear` | Green (#22c55e) | No action needed |
| `marginal` / `degraded` / `posture_hold` | Yellow (#eab308) | Monitor closely |
| `failing` / `blocked` / `posture_blocked` | Red (#ef4444) | Action required |
| `no_data` / `unknown` | Grey (#6b7280) | Insufficient data |

---

## S4 — Refresh Cadence Summary

| Element | Cadence | Trigger |
| --- | --- | --- |
| Provider Lane Health | Per-call | `/api/execute` receipt |
| Release Gate Status | Per-run | Operator trigger |
| Latest Receipt | Per-call | `/api/execute` receipt |
| Policy Block/Allow Ratio | Per-call (session aggregate) | `/api/execute` receipt |
| Quota/Cost Preflight | Per-call (session aggregate) | `/api/execute` receipt |
| Failed Workflow Packs | Per-failure | Diagnostic class = policy_blocked or similar |
| Role Rejection Events | Per-rejection | G1 role_resolution_denied |
| Evidence Export Queue | Per-export | LHW5-T2 trigger |
| Session Governance Posture | Per-governance event | LHW11-T1 input change |
| Memory Continuity Level | Per-memory event | LHW13-T2 input change |
| MCP/Tool Approval Posture | Per-approval event | LHW9-T1 input change |

---

## S5 — Deferred Elements (Phase B)

Phase B wiring requires:
- `cvf-web` governance dashboard route under `/dashboard/governance`
- Live data aggregation from existing receipt store
- WebSocket or polling for per-call refresh
- Separate GC-018 + work order

Phase A is complete as a documentation spec.

---

## S6 — Runtime Boundary

| Element | Phase A status | Phase B requirement |
| --- | --- | --- |
| Provider Lane Health | Spec defined — LHW10-T3 source | Live aggregation from receipt store |
| Release Gate Status | Spec defined — W4 source | UI wired to release gate bundle output |
| Latest Receipt | Spec defined — V3 source | UI wired to receipt store |
| Policy Block/Allow Ratio | Spec defined — V3 source | Session-level aggregation |
| Quota/Cost Preflight | Spec defined — CB1 source | Token counting + cost estimation |
| Failed Workflow Packs | Spec defined — MA1 source | Dissent ledger readout |
| Role Rejection Events | Spec defined — G1 source | Identity resolution trace |
| Evidence Export Queue | Spec defined — LHW5-T2 source | Export queue state |
| Session Posture | Spec defined — LHW11-T1 source | Posture aggregation |
| Memory Continuity Level | Spec defined — LHW13-T2 source | Memory event binding |
| MCP/Tool Approval | Spec defined — LHW9-T1 source | Tool approval state |

Phase A closes CVF 25.05 Gap 5. Phase B is product enhancement beyond gap
closure.

## Claim Boundary

This is a product specification. It does not claim: runtime dashboard wiring,
cvf-web UI changes, live data aggregation, provider behavior changes, receipt
envelope schema changes, hosted readiness, production readiness, or public
release readiness.
