# CVF LHW19 T2 — Event Model Governance Advisory Connector Spec

Contract ID: `cvf.eventModelGovernanceAdvisory.lhw19.t2.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW19 T2

GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the CVF event model — 5 governance events that span the full agent lifecycle —
and map each to existing CVF governance receipt and handler surfaces. Establishes the
event model boundary as the advisory foundation for future event-driven governance
integration. Provides the missing link between CVF governance receipts and external
agent framework lifecycle hooks.

## Scope / Applies To

Applies to any future CVF surface implementing event-driven governance integration with
external agent frameworks. Does NOT authorize event bus implementation in this wave.

## CVF Owner Surfaces

| Event | CVF owner (current) |
| --- | --- |
| `intent.received` | `CVF_ECO_v1.0_INTENT_VALIDATION` intake |
| `plan.created` | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` phase gate |
| `tool.requested` | `CVF_ECO_v2.5_MCP_SERVER` tool call intake |
| `execution.state` | EL-2 `buildWorkerTimeoutReadout()` + EL-3 `buildReviewerDeadlockReadout()` |
| `result.produced` | `GovernanceEvidenceReceipt` decision + `CVF_GUARD_CONTRACT` result gate |

---

## Advisory Type

`eventModelGovernanceAdvisoryType`

---

## Canonical Event Model

**Source:** `CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Event Model.md`

CVF governance is **event-driven**: agent framework emits events, CVF governance engine
evaluates each event and returns an execution directive.

```
Agent System
     ↓
Event Emitted
     ↓
CVF Event Bus        ← advisory boundary; not yet implemented
     ↓
CVF Governance Engine
     ↓
Execution Directive (allow / deny / pause / sanitize)
     ↓
Agent System
```

Design principle: **CVF does not poll agent state. It acts on events.**
If an agent framework does not emit an event, execution must be blocked.

---

## 5 Governance Events — CVF Mapping

### Event 1 — `intent.received`

Fired when user sends a request.

Payload: `{ user_id, intent, domain, timestamp }`

CVF actions: validate intent, check domain access, apply initial policy.

Directive: `allow | deny`

**Current CVF owner:** `CVF_ECO_v1.0_INTENT_VALIDATION` + `/api/execute` intake.
**Coverage:** IMPLEMENTED for direct CVF requests. External framework adapter needed for
other clients.

---

### Event 2 — `plan.created`

Fired when agent creates a workflow or task decomposition.

Payload: `{ agent_id, plan_steps, tools_required }`

CVF actions: evaluate plan safety, detect forbidden steps, compute risk.

Directive: `approve | modify | reject`

**Current CVF owner:** `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` phase gate + `cvf_advance_pipeline_stage`.
**Coverage:** PARTIAL — pipeline stage enforcement exists; plan-level risk scoring advisory only.

---

### Event 3 — `tool.requested`

Fired each time agent wants to call a tool.

Payload: `{ agent_id, tool_name, parameters }`

CVF actions: check tool permissions, validate parameters, enforce rate limits.

Directive: `allow | restrict_parameters | deny`

**Current CVF owner:** `CVF_ECO_v2.5_MCP_SERVER` MCP tools + Delta D3 `cvf_invoke_cli_stage` whitelist.
**Coverage:** IMPLEMENTED (bounded) — tool whitelist enforced; full parameter validation advisory.

---

### Event 4 — `execution.state`

Fired during agent execution to signal runtime state.

Payload: `{ agent_id, execution_step, resource_usage }`

CVF actions: detect execution loops, enforce resource limits, flag unexpected behavior.

Directive: `continue | pause | terminate`

**Current CVF owner:** EL-2 `buildWorkerTimeoutReadout()` (timeout detection) + EL-3
`buildReviewerDeadlockReadout()` (deadlock detection).
**Coverage:** IMPLEMENTED for timeout + deadlock; general resource usage monitoring advisory.

---

### Event 5 — `result.produced`

Fired when agent generates output.

Payload: `{ agent_id, result, output_type }`

CVF actions: check data leakage, verify policy compliance, validate result integrity.

Directive: `release | sanitize | block`

**Current CVF owner:** `GovernanceEvidenceReceipt` (`decision: ALLOW | DENY | BLOCK`) +
`CVF_GUARD_CONTRACT` result-level guards.
**Coverage:** IMPLEMENTED — receipt captures decision; output sanitization advisory.

---

## Event-to-Receipt Mapping (canonical)

The CVF `GovernanceEvidenceReceipt` is the native representation of the `result.produced`
event directive. Future event model integration must ensure that events 1-4 produce
intermediate receipts or advisory records that feed into the final receipt.

```
intent.received  → intake receipt / decision
plan.created     → phase gate record
tool.requested   → MCP audit log
execution.state  → workerTimeoutReadout + reviewerDeadlockReadout
result.produced  → GovernanceEvidenceReceipt (authoritative)
```

---

## Event Bus — Advisory Boundary

The event bus (`event.bus.ts`, `event.dispatcher.ts`) described in CVF_Restructure
is **rejected from this LHW wave (doc-only scope) — requires live implementation
tranche; eligible for separate event-driven governance roadmap post-LHW**.

Current neutral integration boundary: `CVF_ECO_v2.5_MCP_SERVER` (MCP tools emit
implicit tool.requested events via the MCP protocol).

---

## Advisory Readout Fields

```typescript
eventModelGovernanceAdvisoryType: "cvf.eventModelGovernanceAdvisory.lhw19.t2.v1"
eventModelAdvisory: {
  intentReceivedCoverage: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  planCreatedCoverage: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  toolRequestedCoverage: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  executionStateCoverage: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  resultProducedCoverage: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  eventBusStatus: "ADVISORY_ONLY"
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Event Model.md`
- LHW19 T1: `docs/reference/CVF_LHW19_T1_INTEGRATION_ARCHITECTURE_CONTROL_POINTS_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- EL-2 handler: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/worker-timeout-handler.ts`
- EL-3 handler: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/reviewer-deadlock-handler.ts`
- MCP Server: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`

## Claim Boundary

This spec is documentation-only advisory. Event bus and dispatcher implementation require
separate governed tranches. CP2 plan.created event has partial coverage only.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No event bus implementation code
- No event dispatcher implementation code
- No public release readiness claim
