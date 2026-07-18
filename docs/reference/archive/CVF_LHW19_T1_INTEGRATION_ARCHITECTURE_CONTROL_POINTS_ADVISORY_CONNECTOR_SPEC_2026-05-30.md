# CVF LHW19 T1 — Integration Architecture & Control Points Advisory Connector Spec

Contract ID: `cvf.integrationArchitectureControlPointsAdvisory.lhw19.t1.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW19 T1

GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the canonical Integration Architecture (4 integration points) and Control Points
(5 control points CP1-CP5) from CVF_Restructure against existing CVF owner surfaces.
Establishes the advisory boundary for future Integration SDK adapter work and serves
as the canonical reference for how external agent frameworks connect to CVF governance.

## Scope / Applies To

Applies to any future CVF surface that integrates with external agent frameworks
(LangChain, CrewAI, AutoGen, OpenAI Agents) or that implements adapter-layer logic.
Does NOT authorize adapter implementation code in this wave.

## CVF Owner Surfaces

| Control Point | Owner module |
| --- | --- |
| CP1 Intent Gate | `CVF_ECO_v1.0_INTENT_VALIDATION` + `/api/execute` intake |
| CP2 Plan Validator | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` phase gate + `cvf_advance_pipeline_stage` |
| CP3 Tool Gateway | `CVF_ECO_v2.5_MCP_SERVER` + Delta D3 `cvf_invoke_cli_stage` whitelist |
| CP4 Runtime Guard | EL-2 `worker-timeout-handler.ts` + EL-3 `reviewer-deadlock-handler.ts` |
| CP5 Result Validator | `CVF_GUARD_CONTRACT` + `GovernanceEvidenceReceipt` |
| Adapter boundary | `CVF_ECO_v2.5_MCP_SERVER` (current neutral integration point) |

---

## Advisory Type

`integrationArchitectureControlPointsAdvisoryType`

---

## Canonical Integration Architecture

**Source:** `CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Integration Architecture.md`

CVF position in the AI stack:

```
User
 ↓
AI Application
 ↓
Agent Framework (LangChain / CrewAI / AutoGen / OpenAI Agents / ...)
 ↓
CVF Governance Layer   ← CVF's position
 ↓
Execution Runtime / Tools / APIs
```

CVF acts as **AI Governance Middleware** — similar to API Gateway + Security Layer
but for AI Agents. Agents must not bypass CVF to reach tools.

### 4 Integration Points

**Point 1 — Intent Integration**
User prompt → Intent Adapter → CVF Intent Validation.
Adapter normalizes prompt, attaches metadata, emits intent event.
Current CVF owner: `CVF_ECO_v1.0_INTENT_VALIDATION`.

**Point 2 — Planner Integration**
Agent Planner → Plan Adapter → CVF Plan Validation.
Adapter sends: plan structure, tools required, execution steps.
Current CVF owner: `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` phase gate.

**Point 3 — Tool Gateway Integration** (most critical)
Agent → CVF Tool Gateway → Tool/API.
No direct tool calls. Gateway enforces: tool permissions, parameter validation, rate limits.
Current CVF owner: `CVF_ECO_v2.5_MCP_SERVER` (MCP tools as governed interface).

**Point 4 — Execution Runtime Integration**
Agent Runtime → Execution Monitor → CVF Runtime Guard.
Monitor sends: execution state, resource usage, loop detection.
Current CVF owner: EL-2 worker timeout + EL-3 reviewer deadlock.

### Future Adapter Layer Structure (advisory)

When implementation tranches are authorized:

```
/cvf-integrations/
├── adapters/
│   ├── langchain.adapter.ts
│   ├── crewai.adapter.ts
│   └── generic.agent.adapter.ts
├── gateways/
│   └── tool.gateway.ts
└── runtime/
    └── execution.monitor.ts
```

Each adapter maps: framework workflow events → CVF governance events.
Adapter code is **rejected from this LHW wave (doc-only scope)** —
requires live implementation tranche with operator authorization per target framework.

---

## 5 Control Points — CVF Owner Map

**Source:** `CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Control Points.md`

| CP | Name | CVF owner (current) | Coverage |
| --- | --- | --- | --- |
| CP1 | Intent Entry | `CVF_ECO_v1.0_INTENT_VALIDATION` + intake gate | IMPLEMENTED |
| CP2 | Planning Phase | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` + `cvf_advance_pipeline_stage` stage order | PARTIAL — plan risk evaluation advisory only |
| CP3 | Tool Access | `CVF_ECO_v2.5_MCP_SERVER` + Delta D3 `cvf_invoke_cli_stage` whitelist | IMPLEMENTED (bounded) |
| CP4 | Execution Runtime | EL-2 timeout + EL-3 deadlock handlers | IMPLEMENTED |
| CP5 | Result Validation | `CVF_GUARD_CONTRACT` + `GovernanceEvidenceReceipt` decision field | IMPLEMENTED |

Governance principle: **CVF must act as mandatory control gateway — no direct tool calls,
no direct execution, no unvalidated outputs.**

---

## Advisory Readout Fields

```typescript
integrationArchitectureControlPointsAdvisoryType:
  "cvf.integrationArchitectureControlPointsAdvisory.lhw19.t1.v1"
integrationAdvisory: {
  cp1IntentGate: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  cp2PlanValidator: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  cp3ToolGateway: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  cp4RuntimeGuard: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  cp5ResultValidator: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  adapterLayerStatus: "ADVISORY_ONLY"
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Integration Architecture.md`
- Source: `.private_reference/legacy/CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Control Points.md`
- MCP Server: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`
- LHW18 T2 positioning: `docs/reference/CVF_LHW18_T2_CVF_POSITIONING_GOVERNANCE_LAYER_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`

## Claim Boundary

This spec is documentation-only advisory. Adapter implementation code and event bus
implementation require separate governed tranches. CP2 Plan Validator has partial
coverage only — full plan risk evaluation requires a separate tranche.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No adapter implementation code
- No event bus implementation
- No public release readiness claim
