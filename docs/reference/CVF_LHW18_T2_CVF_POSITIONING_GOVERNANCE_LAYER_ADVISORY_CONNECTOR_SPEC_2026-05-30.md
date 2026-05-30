# CVF LHW18 T2 — CVF Positioning Governance Layer Advisory Connector Spec

Contract ID: `cvf.cvfPositioningGovernanceLayerAdvisory.lhw18.t2.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW18 T2

GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Establish the canonical advisory boundary for CVF's position in the AI ecosystem:
CVF = Governance & Safety Layer, not Agent OS or execution runtime. Documents
framework-neutrality principle and integration boundary against existing CVF owner surfaces.
Directly addresses the 2026-05-17 external reviewer finding that CVF's CLI/benchmark
capabilities were not visible because of positioning confusion.

## Scope / Applies To

Applies to all CVF public-facing documentation, catalog entries, and integration discussions.
Does NOT authorize Integration SDK adapter code (cvf-langgraph, cvf-crewai etc.) — those
require a separate live implementation tranche.

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Governance positioning doctrine | `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md` |
| Policy Engine | `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.2_LLM_RISK_ENGINE` |
| Audit Layer | JSONL evidence receipts + `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` |
| Integration point (neutral) | `CVF_ECO_v2.5_MCP_SERVER` (MCP = framework-neutral integration boundary) |
| Public positioning | `README.md` + `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` |

---

## Advisory Type

`cvfPositioningGovernanceLayerAdvisoryType`

---

## Canonical Positioning Statement

**From `Review CVF_2.md` (operator-authored):**

```
CVF = Governance & Safety Layer for AI Agents
     (not: AI Agent Operating System)
```

Architecture stack:

```
Application Layer
      ↓
Agent Framework (LangGraph / CrewAI / Autogen / OpenAI Agents / ...)
      ↓
CVF Governance Layer   ← CVF's position
      ↓
LLM Runtime (OpenAI / Claude / vLLM / ...)
```

CVF role: **policy + control plane** — not execution engine.

---

## Comparison Table (Canonical)

| System | Role |
| --- | --- |
| LangGraph | agent orchestration |
| CrewAI | multi-agent collaboration |
| Autogen | conversational agents |
| OpenAI Agents | tool agents |
| **CVF** | **governance + safety + workflow control** |

CVF does not compete with agent frameworks — it complements them.
Any agent framework can use CVF as its governance layer.

---

## Framework Neutrality Principle

CVF must not be biased toward any specific agent framework.

**Correct framing:** `CVF integration for LangGraph`
**Incorrect framing:** `CVF for LangGraph` (implies CVF is a LangGraph plugin)

The MCP server (`CVF_ECO_v2.5_MCP_SERVER`) is the current framework-neutral integration
boundary. It exposes CVF governance capabilities to any client that speaks MCP.

---

## 3 Module Advisory (from Review CVF_2.md)

### Integration Layer (concept-only)

CVF should eventually have `cvf-integrations/` with adapters for major frameworks.
Each adapter maps: workflow events, agent events, tool usage into CVF governance receipts.

**Current status:** `CVF_ECO_v2.5_MCP_SERVER` serves as the neutral integration point.
Specific framework adapters are **rejected from this LHW wave (doc-only scope) —
requires live implementation tranche; eligible for separate adapter roadmap**.

### Policy Engine (absorbed)

CVF policy engine already exists: `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.2_LLM_RISK_ENGINE`.
Enforces: phase must be approved, skill must be declared, tests must exist.
Owner surface is fully established — no new module needed.

### Audit Layer (absorbed)

CVF audit layer already exists: JSONL evidence receipts + `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME`.
Records: agent decisions, code change history, review results, governance receipts.
Owner surface is fully established — no new module needed.

---

## Public Positioning Advisory

The 2026-05-17 external reviewer concluded CVF's CLI and benchmark capabilities did not exist
because the public catalog did not surface them. This was a **documentation failure, not a
capability gap** (per GC-024 rule already in place).

Advisory: any future public-facing CVF document must:
1. Lead with "CVF = Governance & Safety Layer" framing, not "Agent OS"
2. Surface CLI (`CVF_ECO_v2.2_GOVERNANCE_CLI`), benchmark, and MCP capabilities explicitly
3. Use the framework-comparison table above when explaining CVF's position

---

## Advisory Readout Fields

```typescript
cvfPositioningGovernanceLayerAdvisoryType:
  "cvf.cvfPositioningGovernanceLayerAdvisory.lhw18.t2.v1"
positioningAdvisory: {
  canonicalPosition: "GOVERNANCE_SAFETY_LAYER"
  frameworkNeutralityApplied: boolean
  integrationBoundary: "MCP_SERVER" | "ADAPTER_PENDING"
  policyEngineOwner: string
  auditLayerOwner: string
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF Edit/Review CVF_2.md`
- Positioning doctrine: `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- Public catalog: `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` (public-sync)
- GC-024 catalog rule: `CLAUDE.md` Public Catalog Update Rule

## Claim Boundary

This spec is documentation-only advisory. It does not authorize Integration SDK adapter
implementation, hosted readiness, production readiness, or public release readiness.
Framework adapter code requires a separate governed implementation tranche.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No Integration SDK adapter code
- No public release readiness claim
