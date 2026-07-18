# CVF LHW21 T1 Event Taxonomy Schema Advisory Connector Spec

Contract ID: `cvf.eventTaxonomySchemaAdvisory.lhw21.t1.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW21 T1

GC-018: `docs/baselines/CVF_GC018_LHW21_INTEGRATION_CONNECTION_POINT_ADVISORY_WAVE_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for framework authors.
The schema mirrors the current IS1 generic-agent adapter taxonomy and keeps the
external integration direction inbound:

```text
Framework -> CVF Connection Point -> Governance Engine
```

This tranche does not create framework-specific adapters or authorize runtime
execution.

## Scope / Applies To

Applies to documentation for external framework authors connecting inbound to
CVF through the neutral connection point. No runtime adapter, route, or event
bus is authorized.

## S2. Design

### Canonical IS1 Taxonomy

Source: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/generic-agent-adapter.ts`

| `AgentEventType` | `ControlPoint` | Current adapter coverage |
| --- | --- | --- |
| `INTENT` | `CP1_INTENT` | `IMPLEMENTED` |
| `PLAN` | `CP2_PLAN` | `PARTIAL` |
| `TOOL_CALL` | `CP3_TOOL` | `IMPLEMENTED` |
| `EXECUTION` | `CP4_RUNTIME` | `IMPLEMENTED` |
| `RESULT` | `CP5_RESULT` | `IMPLEMENTED` |

`mapAgentEventToCvf()` maps each canonical event to one CVF control point and
returns an advisory mapping result with `runtimeAdapterAuthorized=false`.

### INT1 Transport Bridge

Source: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`

The MCP connection point currently accepts a dotted transport vocabulary.
This advisory records the bridge without claiming a runtime conversion layer:

| Canonical IS1 event | INT1 transport event |
| --- | --- |
| `INTENT` | `intent.received` |
| `PLAN` | `plan.created` |
| `TOOL_CALL` | `tool.requested` |
| `EXECUTION` | `execution.state` |
| `RESULT` | `result.produced` |

## S3. Contract

The following fields are doc-only publication fields for connection-point
authors:

```typescript
eventTaxonomySchemaAdvisoryType:
  "cvf.eventTaxonomySchemaAdvisory.lhw21.t1.v1"
publishedEventSchema: {
  canonicalEventType:
    "INTENT" | "PLAN" | "TOOL_CALL" | "EXECUTION" | "RESULT"
  controlPoint:
    "CP1_INTENT" | "CP2_PLAN" | "CP3_TOOL" | "CP4_RUNTIME" | "CP5_RESULT"
  transportEvent:
    "intent.received" | "plan.created" | "tool.requested" |
    "execution.state" | "result.produced"
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These publication fields are not added to runtime source in this tranche.

## S4. Integration Guidance

- Framework authors should emit the matching lifecycle event into CVF.
- Callers remain responsible for routing advisory results to the relevant CVF
  owner surface.
- The current neutral connection point is INT1 `cvf_emit_agent_event`.
- A runtime bridge, event bus, or framework adapter requires a separate
  governed implementation tranche and live governance proof.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Five canonical event values exist | `generic-agent-adapter.ts` lines 16-21 | PASS |
| Five control-point values exist | `generic-agent-adapter.ts` line 25 | PASS |
| Canonical mapping function exists | `mapAgentEventToCvf()` line 101 | PASS |
| Adapter result keeps literal false invariant | `runtimeAdapterAuthorized` lines 57 and 116 | PASS |
| Five dotted transport values exist | `index.ts` `INT1_ALLOWED_EVENT_TYPES` | PASS |
| This tranche changes runtime code | Changed-file review | N/A with reason: doc-only tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance
documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not
claim a runtime event bus, automatic event conversion, hard-gate enforcement,
framework adapter implementation, public readiness, or production readiness.
