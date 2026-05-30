# CVF Generic MCP Adapter Integration Guide

Memory class: REFERENCE_GUIDE

Status: ACTIVE

Date: 2026-05-31

Contract: `cvf.genericMcpAdapter.int1.v1`

---

## Purpose

Explain how external agent frameworks (LangChain, CrewAI, AutoGen, OpenAI Agents,
or any custom agent) connect to CVF governance via the MCP interface.

## Scope / Applies To

Any agent framework that supports MCP tool calls, or any system that can make
HTTP/stdio calls to an MCP server.

## CVF Position in the Stack

```
AI Application
      ↓
Agent Framework (LangChain / CrewAI / AutoGen / Custom)
      ↓
CVF MCP Server  ← integration point
      ↓
CVF Governance Engine (Guard Contract + Policy Engine)
      ↓
LLM Runtime (Alibaba / DeepSeek / OpenAI / ...)
```

CVF is not an agent framework. It is the governance layer that your framework
calls through. Your framework continues to run normally — CVF adds control points.

---

## 4 Integration Points

### Point 1 — Intent Gate (CP1)

**When:** user sends a prompt or request to your agent.

**MCP call:** `cvf_check_phase_gate` or `cvf_evaluate_full`

```json
{
  "tool": "cvf_evaluate_full",
  "arguments": {
    "action": "user-intent",
    "phase": "intake_gate",
    "riskLevel": "R1",
    "role": "AI_AGENT",
    "context": "User requested: build a login feature"
  }
}
```

**CVF returns:** `{ decision: "ALLOW" | "BLOCK", ... }`

If `BLOCK` → stop the agent. If `ALLOW` → proceed to planning.

### Point 2 — Plan Validator (CP2)

**When:** your agent creates a workflow, task list, or execution plan.

**MCP call:** `cvf_validate_plan` *(new in INT-1)*

```json
{
  "tool": "cvf_validate_plan",
  "arguments": {
    "planSteps": ["read spec", "write auth module", "run tests"],
    "toolsRequired": ["file_read", "file_write", "test_runner"],
    "agentRole": "AI_AGENT",
    "planContext": "Implementing login feature"
  }
}
```

**CVF returns:** `{ advisoryDecision: "ALLOW_ADVISORY" | "REVIEW_RECOMMENDED" | "REJECT_ADVISORY", planRisk, forbiddenStepsDetected }`

Advisory only — your framework decides whether to act on the recommendation.

### Point 3 — Tool Gateway (CP3)

**When:** your agent wants to call a tool (file system, API, database, etc.).

**MCP call:** `cvf_check_risk_gate` before each tool call.

```json
{
  "tool": "cvf_check_risk_gate",
  "arguments": {
    "action": "file_write /src/auth.ts",
    "riskLevel": "R1",
    "role": "AI_AGENT"
  }
}
```

**CVF returns:** `{ allowed: true | false, riskLevel, ... }`

If `allowed: false` → do not call the tool.

### Point 4 — Execution Runtime (CP4)

**When:** your agent is running and you want to report execution state.

**MCP call:** `cvf_emit_agent_event` with `eventType: "execution.state"` *(new in INT-1)*

```json
{
  "tool": "cvf_emit_agent_event",
  "arguments": {
    "eventType": "execution.state",
    "agentId": "worker-agent-01",
    "payload": {
      "executionStep": "writing auth module",
      "resourceUsage": "normal"
    }
  }
}
```

---

## 5 CVF Governance Events

Map your framework's lifecycle hooks to these CVF events:

| CVF Event | Your Framework Hook | MCP Tool |
| --- | --- | --- |
| `intent.received` | on_user_message / on_prompt | `cvf_evaluate_full` |
| `plan.created` | on_plan_created / on_chain_start | `cvf_validate_plan` |
| `tool.requested` | before_tool_call / on_action | `cvf_check_risk_gate` |
| `execution.state` | on_agent_step / on_loop | `cvf_emit_agent_event` |
| `result.produced` | on_output / on_finish | `cvf_validate_output` |

---

## Quick Start

1. Start the CVF MCP Server:

```bash
cd EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER
npx ts-node src/index.ts
```

2. From your agent framework, connect via MCP stdio transport.

3. Add CVF governance calls at the 4 integration points above.

4. Check `decision: "ALLOW"` before proceeding at each gate.

---

## Owner Surface / Source Lineage

Owner: `CVF_ECO_v2.5_MCP_SERVER` — tools `cvf_validate_plan` + `cvf_emit_agent_event`.
Source: LHW19 T1 Integration Architecture advisory + LHW19 T2 Event Model advisory.
GC-018: `docs/baselines/CVF_GC018_INT1_GENERIC_MCP_ADAPTER_2026-05-31.md`.

## Protocol / Contract / Requirements

- External frameworks MUST call CVF MCP tools at the 4 integration points before proceeding.
- All tools return advisory decisions — the calling framework is responsible for enforcement.
- `cvf_validate_plan` must receive valid `planSteps` and `toolsRequired` arrays.
- `cvf_emit_agent_event` must use one of the 5 supported event types.
- `runtimeExecutionAuthorized=false` across all INT-1 tools — no execution blocking occurs.

## Enforcement / Verification

Verified via unit tests: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/tools/int1-adapter.test.ts` (8/8 PASS).
TypeScript check: PASS. MCP server line count: 868 (under 1000 hard limit).
Integration guide correctness is verified against LHW19 T1/T2 advisory specs.

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_INT1_GENERIC_MCP_ADAPTER_2026-05-31.md`
- LHW19 T1: `docs/reference/CVF_LHW19_T1_INTEGRATION_ARCHITECTURE_CONTROL_POINTS_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- LHW19 T2: `docs/reference/CVF_LHW19_T2_EVENT_MODEL_GOVERNANCE_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- LHW18 T2: `docs/reference/CVF_LHW18_T2_CVF_POSITIONING_GOVERNANCE_LAYER_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- MCP Server: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`

## Claim Boundary

This guide describes advisory integration only. CVF MCP tools return advisory
decisions — your framework is responsible for acting on them. No CVF tool in
INT-1 will automatically block your agent's execution.
`runtimeExecutionAuthorized=false` across all INT-1 tools.
