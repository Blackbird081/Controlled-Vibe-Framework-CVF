# CVF LHW19 T3 — Strategic Compass Advisory Connector Spec

Contract ID: `cvf.strategicCompassAdvisory.lhw19.t3.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW19 T3

GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Establish the canonical CVF strategic compass advisory — mission, 3 strategic focuses,
anti-focus list, and phase timeline — against the current CVF positioning. Extends
LHW18 T2 ("CVF = Governance Layer") with long-range strategic boundary. Locks the
canonical "Kubernetes of AI Agents" framing and prevents future strategic drift.

## Scope / Applies To

Applies to all CVF public-facing documentation, roadmap decisions, and capability
boundary discussions. Does NOT authorize Agent Economy or Agent Coordination
implementation — those are future phases outside current scope.

## CVF Owner Surfaces

| Layer | Owner |
| --- | --- |
| Governance focus (Phase 1) | Current CVF v4.0.0 — `CVF_GUARD_CONTRACT`, `/api/execute`, EL/PM/WCE waves |
| Positioning doctrine | `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md` + LHW18 T2 |
| Phase timeline | This spec (advisory only) |
| Anti-focus boundary | This spec + LHW18 T2 |

---

## Advisory Type

`strategicCompassAdvisoryType`

---

## Canonical Mission Statement

**Source:** `CVF_Restructure/CVF_ECOSYSTEM/README.md` + `CVF_Strategic Compass.md`

> **Run AI agents safely at scale.**

CVF is **governance infrastructure for AI agents** — not an AI coding tool, IDE,
no-code platform, LLM provider, or agent builder.

The strategic north star:

> CVF becomes the Governance Infrastructure for Autonomous AI Agents.

Comparable infrastructure role:

| Infrastructure | Role |
| --- | --- |
| Internet | connects computers |
| Cloud | compute infrastructure |
| Kubernetes | container orchestration |
| **CVF** | **AI agent governance infrastructure** |

---

## 3 Strategic Focuses (Current Phase)

**Focus 1 — Agent Governance Engine** (Phase 1: 2025-2026, ACTIVE)

The core of CVF. Includes: Policy Engine, Rule Engine, Trust System,
Permission Control, Audit System.

CVF current state: substantially delivered via v4.0.0 (Guard Contract, EL wave,
Delta wave, WCE wave, Learning Plane foundation). Governance for small-scale
(10k agents equivalent) is the current boundary.

**Focus 2 — Agent Communication Protocol** (Phase 2: 2026-2028, FUTURE)

Agent-to-agent discovery, communication, and coordination protocol.
Similar to HTTP for web, TCP/IP for networks — "CVF Protocol for Agents."

Current CVF state: MCP Server provides the closest current analog.
Full agent communication protocol is out of current scope.

**Focus 3 — Agent Economy** (Phase 3: 2028-2031, FUTURE)

Task Market, Agent Reputation, Agent Payment, Agent Incentives.
Foundation for AI Labor Market.

Current CVF state: `CVF_ECO_v3.1_REPUTATION` provides reputation foundation.
Full Agent Economy is out of current scope.

---

## Strategic Anti-Focus (Hard Boundaries)

CVF must NOT build:
- AI models (not competing with OpenAI, Anthropic, Google)
- LLM frameworks (not competing with LangChain, LlamaIndex)
- AI applications (not competing with AI SaaS tools)

CVF is **infrastructure only** — not a product, not a platform, not an app.

These boundaries are consistent with:
- LHW18 T2 "CVF = Governance Layer, not Agent OS"
- `CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` public positioning

---

## Strategic Law

> **Control the rules, not the agents.**

CVF does not control agents directly.
CVF defines the rules within which agents operate.

This law maps to the CVF governance model: agents call `/api/execute`, CVF applies
policy and returns `ALLOW | DENY | BLOCK`. CVF never takes direct action — it returns
a governance directive.

---

## Phase Timeline Advisory

| Phase | Timeline | Focus | CVF current state |
| --- | --- | --- | --- |
| Phase 1 | 2025-2026 | Agent Governance Engine (10k agents) | ACTIVE — v4.0.0 GA |
| Phase 2 | 2026-2028 | Agent Communication Protocol (1M agents) | FUTURE — MCP is current analog |
| Phase 3 | 2028-2031 | Agent Economy (global AI labor market) | FUTURE — reputation foundation only |
| Phase 4 | 2031-2035 | AI Civilization Infrastructure (1B+ agents) | LONG-RANGE VISION |

**Claim boundary for timeline:** This is advisory framing, not a product roadmap commitment.
Phase 2-4 are directional markers, not authorized implementation scopes.

---

## Strategic Risk Advisory

Three risks documented in CVF_Restructure source:

1. **AI platforms build their own governance** (e.g., OpenAI Agent OS) — CVF response: become the neutral, framework-agnostic governance standard before platforms lock in proprietary layers.
2. **Frameworks add governance layers** — CVF response: integration adapter layer (LHW19 T1) makes CVF easy to add to any existing framework.
3. **CVF becomes too complex to adopt** — CVF response: MCP server as simplest integration path; LHW18 T2 framework-neutrality principle.

---

## Advisory Readout Fields

```typescript
strategicCompassAdvisoryType: "cvf.strategicCompassAdvisory.lhw19.t3.v1"
strategicAdvisory: {
  missionStatement: "Run AI agents safely at scale"
  currentPhase: "Phase1_AgentGovernanceEngine"
  activeScope: "GOVERNANCE_ENGINE_10K_AGENTS"
  antiFocusBoundary: "NO_LLM_NO_FRAMEWORK_NO_APP"
  strategicLaw: "CONTROL_RULES_NOT_AGENTS"
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW19_CVF_RESTRUCTURE_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF_Restructure/CVF_AI Systems/CVF_Roadmap/CVF_Strategic Compass.md`
- Source: `.private_reference/legacy/CVF_Restructure/CVF_ECOSYSTEM/README.md`
- LHW18 T2: `docs/reference/CVF_LHW18_T2_CVF_POSITIONING_GOVERNANCE_LAYER_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- Positioning doctrine: `docs/reference/CVF_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-07.md`
- Public catalog: `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md` (public-sync)

## Claim Boundary

This spec is documentation-only advisory. Phase timeline is directional only — not a
product roadmap commitment. Agent Economy and Agent Coordination are explicitly out of
current scope. No hosted readiness, production readiness, or public release readiness claim.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- Agent Economy / Coordination: NOT authorized in any tranche until Phase 2/3 explicitly opened by operator
- No public release readiness claim
