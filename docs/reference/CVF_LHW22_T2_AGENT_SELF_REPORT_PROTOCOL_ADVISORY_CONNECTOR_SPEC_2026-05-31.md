# CVF LHW22 T2 Agent Self-Report Protocol Advisory Connector Spec

Contract ID: `cvf.agentSelfReportProtocolAdvisory.lhw22.t2.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW22 T2

GC-018: `docs/baselines/CVF_GC018_LHW22_AGENT_INTELLIGENCE_FOUNDATIONS_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for Agent Self-Report protocols.
This spec absorbs the legacy learning-plane self-report signals and maps them as future additive advisory fields for the `/api/execute` endpoint.

No runtime codebase, route, or response schema is modified in this wave.

## Scope / Applies To

Applies to private-provenance documentation for the CVF agent execution protocol. No runtime telemetry capture, self-reporting execution, or active learning-plane mutation is authorized.

## S2. Design

### Agent Execution Lifecycle

Source: `.private_reference/legacy/CVF_Important/ADDING_LEARNING PLANE/CVF_AGENT_RUNTIME_PROTOCOL.md`

Every agent task execution is modeled as a 8-stage structured lifecycle:

1. **Task Assignment**: Receive task, type, domain, complexity, and risk level.
2. **Context Initialization**: Receive relevant memory, tool availability, and constraints.
3. **Planning (Optional)**: Generate plan steps and initial confidence score.
4. **Execution**: Perform work within boundaries and constraints.
5. **Tool Interaction (Optional)**: Execute structured tool calls and track outcomes.
6. **Output Generation**: Produce structured results, assumptions, and limitations.
7. **Self-Report**: Report internal signals (uncertainty, difficulty, strategy).
8. **Finalization**: Mark task as completed or failed with final rationale.

### Self-Report Signal Structure

The agent must report its internal execution telemetry at the self-report stage:

```json
{
  "confidence": 0.81,
  "uncertainty_sources": [
    "incomplete specification of requirement X",
    "unverified return parameter from tool Y"
  ],
  "difficulty_estimate": 0.65,
  "strategy_used": "decomposition + iterative refinement"
}
```

## S3. Contract

The publication fields for Agent Self-Report mapping are:

```typescript
agentSelfReportProtocolAdvisoryType:
  "cvf.agentSelfReportProtocolAdvisory.lhw22.t2.v1"
agentSelfReportSpec: {
  confidence: number // 0.0 to 1.0 confidence score
  uncertaintySources: string[] // List of identified ambiguity or risk items
  difficultyEstimate: number // 0.0 to 1.0 difficulty rating of the task
  strategyUsed: string // Concise description of execution strategy
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These fields are not integrated into the runtime execute route or receipt structure in this wave.

## S4. Integration Guidance

- Integrating clients should prompt or require agents to populate the self-report fields in their JSON output schemas upon completing a task.
- These self-report parameters will be captured by future learning-plane intake bridges (such as the `LearningSignalIntakeBridge` and `FeedbackLedgerContract`) to analyze failure patterns and calibrate the truth/reputation scores.
- Standardize on 0.0 to 1.0 float scales for confidence and difficulty estimate.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Legacy Agent Runtime Protocol exists | `ADDING_LEARNING PLANE/CVF_AGENT_RUNTIME_PROTOCOL.md` | PASS |
| 8-stage lifecycle is defined | `CVF_AGENT_RUNTIME_PROTOCOL.md` Section 3 | PASS |
| Self-Report schema has confidence, uncertainty, difficulty, strategy | `CVF_AGENT_RUNTIME_PROTOCOL.md` Section 10 | PASS |
| Current execute API endpoint exists | `route.ts` | PASS |
| This tranche modifies execute route or receipt schemas | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime agent reporting, active telemetry monitoring, `/api/execute` endpoint modifications, public readiness, or production readiness.
