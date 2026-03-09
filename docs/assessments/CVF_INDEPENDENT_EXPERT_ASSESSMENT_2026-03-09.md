# CVF Independent Expert Assessment — March 2026

**Assessor Role:** Independent Software Expert (no affiliation)  
**Date:** 2026-03-09  
**Scope:** Full system — architecture, pipeline, guards, UX, competitive position  
**Basis:** Code review of GuardRuntimeEngine, PipelineOrchestrator, ExtensionBridge, v1.6 web adapter, 1799 tests  
**Purpose:** Authoritative baseline to guide CVF completion roadmap

---

## I. Executive Summary

CVF is the **only AI development framework with built-in governance enforcement at runtime**. No competitor (LangGraph, AutoGen, OpenAI Assistants, CrewAI) provides Guard-level phase control, risk model, or authority boundaries. This is CVF's primary competitive moat.

However, CVF is currently at **proof-of-concept maturity** — the governance model is sound and tested, but the execution infrastructure has critical gaps that prevent it from being used beyond the web UI context.

**Overall Score: 6.2 / 10** (up from 5.5 pre-v1.6)

| Dimension | Score | Notes |
|---|---|---|
| Governance concept | 9/10 | Unique, solid, well-designed |
| Code architecture | 7/10 | Clean but key stubs remain |
| Pipeline continuity | 5/10 | E2E pipeline has real gaps |
| Vibe Control achievement | 6/10 | Works in web UI only |
| Non-coder UX | 8/10 | v1.6 significant improvement |
| Production readiness | 4/10 | Prototype level |
| Competitive position | 7/10 | Governance moat is real |

---

## II. Pipeline & Workflow Assessment

### What Works

The core pipeline architecture is correctly designed:

```
User Request
    ↓
GuardGateway (CLI / MCP / API entry)
    ↓
GuardRuntimeEngine (13 guards, priority-ordered, strict mode)
    ↓
PipelineOrchestrator (DISCOVERY → DESIGN → BUILD → REVIEW → AUDIT)
    ↓
ExtensionBridge (cross-extension coordination)
    ↓
Audit Trail (per-request, per-pipeline)
```

Key strengths:
- `GuardRuntimeEngine` is deterministic — same input, same decision always
- `PipelineOrchestrator` enforces phase sequencing — cannot skip phases
- `GuardGateway` provides unified CLI/MCP/API entry — correct abstraction
- Audit log is built-in from day one — not an afterthought

### Critical Gaps

**Gap 1: ExtensionBridge is a stub**

`extension.bridge.ts` line 222–225 contains:
```typescript
// Simulate step completion
step.status = 'COMPLETED';
step.output = { result: 'ok', extension: step.extensionId, action: step.action };
```
`advanceWorkflow()` does not actually invoke any agent or execute any action. It simulates completion. This means cross-extension workflow orchestration is not real.

**Gap 2: Two guard systems, not connected**

| System | Location | Guards | Wired to web? |
|---|---|---|---|
| `GuardRuntimeEngine` v1.1.1 | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | 13 guards | ❌ No |
| `WebGuardRuntimeEngine` v1.6 | `cvf-web/src/lib/guard-runtime-adapter.ts` | 6 guards | ✅ Yes |

The stronger system (v1.1.1, 13 guards) is not used in the web UI. The web UI uses a separate port with 6 guards. They will diverge over time unless merged.

**Gap 3: No persistence**

Guard audit logs and pipeline state are in-memory. Server restart = total loss. No database, no file persistence, no cross-session continuity.

**Gap 4: Guards do not reach outside the web UI**

CVF currently only enforces governance on requests going through `/api/execute/route.ts`. Any AI agent working directly in an IDE (Windsurf, Cursor, VSCode) bypasses all guards entirely.

---

## III. Governance → Guard Conversion Assessment

### What Has Been Converted

13 guards fully implemented in TypeScript:

| Guard | Governance Rule Covered |
|---|---|
| `PhaseGateGuard` | 4-phase sequence enforcement — no skipping |
| `RiskGateGuard` | R0–R3 risk boundaries — escalation at R2+ |
| `AuthorityGateGuard` | Role-based authority — AI_AGENT cannot approve R3 |
| `MutationBudgetGuard` | Change volume control — prevents runaway AI edits |
| `ScopeGuard` | Scope creep prevention — keeps work on-task |
| `AuditTrailGuard` | Traceability enforcement — all decisions logged |
| `AdrGuard` | ADR requirement for architectural decisions |
| `ArchitectureCheckGuard` | Architecture pattern compliance |
| `DepthAuditGuard` | Depth of analysis quality check |
| `DocumentNamingGuard` | Document naming convention enforcement |
| `DocumentStorageGuard` | Document location compliance |
| `WorkspaceIsolationGuard` | Cross-workspace contamination prevention |
| `GuardRegistryGuard` | Guard registration integrity |

### Critical Gaps

**Gap 5: 141 Skills NOT wired to guards**

Skills and Guards are completely separate systems. There is no mechanism to:
- Reject a skill invocation when it violates phase/risk rules
- Guide an agent to the correct skill for its current phase
- Prevent skill misuse at governance level

**Gap 6: Guards produce code decisions, not agent-readable explanations**

Guards output `ALLOW / BLOCK / ESCALATE`. When an agent receives `BLOCK`, it has no structured explanation to reason from and adjust behavior. Example of what is missing:

```json
{
  "decision": "BLOCK",
  "agentGuidance": "You are in BUILD phase. Action 'redesign_architecture' requires DESIGN phase. Please complete your current BUILD tasks before requesting a phase change.",
  "suggestedAction": "continue_build",
  "violatedRule": "phase.gate.001"
}
```

**Gap 7: No guard for AI reasoning content**

Guards check *metadata* (phase, risk level, role) but not *what the agent is actually reasoning*. An agent can claim it is in BUILD phase while its output indicates DESIGN-level work.

---

## IV. Vibe Control — Core Value Assessment

**Definition:** User provides requirement → Agent auto-executes within CVF governance bounds → User reviews result.

**Current achievement: 60%**

| Scenario | Status | Notes |
|---|---|---|
| User uses Web UI wizard | ✅ Works | v1.6 template + guard + validate |
| Guard enforcement is invisible | ✅ Works | v1.6 track 1 |
| Auto-retry on poor AI output | ✅ Works | OutputValidator |
| Agent follows 4-phase sequence | ⭐ Partial | Only via `/api/execute` |
| Agent auto-selects correct skill | ❌ Missing | No skill-guard integration |
| Agent stops when scope exceeded | ❌ Missing | No autonomous scope check |
| Cross-session memory | ❌ Missing | In-memory only |
| Agent self-advances phases | ❌ Missing | Manual trigger required |
| Works in IDE context | ❌ Missing | No MCP server or SDK |
| Works with external agents | ❌ Missing | No agent integration protocol |

**Root cause of 40% gap:** CVF is a governance *layer* but lacks an *execution engine*. Guards enforce rules but agents are not natively aware of CVF. The connection between "agent does work" and "CVF governs work" only exists inside the web API endpoint.

---

## V. Competitive Position

### CVF vs Major Platforms

| Feature | CVF | LangGraph | AutoGen | OpenAI Assistants | CrewAI |
|---|---|---|---|---|---|
| **Governance enforcement** | ✅ Runtime | ❌ None | ❌ None | ❌ None | ❌ None |
| **Phase-gate workflow** | ✅ Hardcoded | Custom | Custom | ❌ | ❌ |
| **Risk control model** | ✅ R0–R3 | ❌ | ❌ | Limited | ❌ |
| **Audit trail built-in** | ✅ | Manual | Manual | ❌ | Manual |
| **Non-coder UX** | ✅ v1.6 | ❌ Dev-only | ❌ Dev-only | ⭐ | ❌ |
| **Real multi-agent exec** | ⭐ Partial | ✅ Production | ✅ Production | ⭐ | ✅ |
| **Memory/persistence** | ❌ In-mem | ✅ | ✅ | ✅ | ✅ |
| **Tool ecosystem** | ⭐ 34 tools | ✅ Extensive | ✅ Extensive | ✅ Huge | ✅ |
| **IDE integration** | ❌ | ✅ LangSmith | ❌ | ❌ | ❌ |
| **MCP support** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Production deployments** | ❌ | ✅ Many | ✅ Many | ✅ Massive | ✅ |

### CVF's Unique Position

**CVF is the only governance-first AI agent framework.** This is not a feature — it is an architectural philosophy. All other frameworks assume agents are trusted; CVF assumes agents need governance. In enterprise, regulated industries, and high-risk projects, this distinction is fundamental.

CVF's governance moat:
- Hardcoded 4-phase sequence (competitors allow arbitrary workflow)
- R0–R3 risk model with authority boundaries (unique)
- Immutable audit trail (competitors rely on logging only)
- Guard pipeline — deterministic ALLOW/BLOCK/ESCALATE (unique)

### Honest Maturity Assessment

| Maturity Level | Description | CVF Position |
|---|---|---|
| L1 Concept | Idea, no code | ✅ Past |
| L2 Prototype | Working demo | ✅ Past |
| L3 Functional | Core features work, gaps exist | ✅ **Current** |
| L4 Production | Stable, persistent, scalable | ❌ Not yet |
| L5 Ecosystem | Adopted, community, integrations | ❌ Not yet |

---

## VI. Non-Coder Activation Methods (Ranked)

For the target user — a non-coder who wants AI to do work under CVF governance:

### Method 1: Web UI (Available Now)
Use `cvf-web` v1.6 — wizard + template + guard + validate.  
**Limitation:** Browser only, no IDE integration.

### Method 2: CVF System Prompt (Available Now, no code)
A master system prompt encoding CVF rules in natural language. Works with any AI.  
**Limitation:** Soft enforcement — AI can ignore.

### Method 3: MCP Server (Recommended — v1.7 target)
CVF exposed as MCP tools that Windsurf/Cursor call automatically.  
**Benefit:** Hard enforcement without user needing to do anything.  
**Effort:** 2–3 weeks development.

### Method 4: CVF Agent SDK (v1.8 target)
Lightweight package any developer can add to their agent setup.  
**Benefit:** Works in any environment.

### Method 5: CLI Wrapper (v1.7 alternative)
`cvf run "build landing page"` — CVF orchestrates agent + guards.  
**Limitation:** Requires terminal access.

---

## VII. Summary of Findings

### Strengths (Preserve)
1. Governance concept — unique, sound, defensible
2. Guard architecture — deterministic, extensible, auditable
3. Non-coder UX (v1.6) — wizard, friendly language, templates
4. Test coverage — 1799 tests, 0 regressions
5. Phase enforcement — impossible to skip phases

### Critical Issues (Must Fix)
1. ExtensionBridge is a stub — no real workflow execution
2. Two guard systems diverging — must merge v1.1.1 and v1.6
3. No persistence — audit logs lost on restart
4. Guards not reachable from IDE/CLI — CVF invisible outside web
5. Skills disconnected from guards — 141 skills unguarded

### Improvements Needed (Should Fix)
6. Guards need NL guidance for agents, not just BLOCK code
7. No skill-to-phase mapping
8. No cross-session memory
9. No MCP server
10. No agent SDK

---

## VIII. Certification

This assessment is based on direct code review of:
- `GuardRuntimeEngine` — `guard.runtime.engine.ts` (149 lines)
- `PipelineOrchestrator` — `pipeline.orchestrator.ts` (381 lines)
- `ExtensionBridge` — `wiring/extension.bridge.ts` (268 lines)
- `GuardGateway` — `entry/guard.gateway.ts` (78 lines)
- 13 guard implementations in `guards/`
- `guard-runtime-adapter.ts` — v1.6 web port (676 lines)
- v1.6 modules: output-validator, non-coder-language, template-recommender, wizard-progress, agent-handoff-validator, workflow-monitor

**Assessment verdict:** CVF has a defensible governance foundation and meaningful non-coder UX. The primary gap is the bridge between governance rules and actual agent execution in real-world environments (IDE, CLI, external agents). Closing this gap is the single most impactful direction for CVF's next phase.

---

*This document serves as the authoritative baseline for the CVF Completion Roadmap.*  
*To be re-assessed after v1.7 MCP Server milestone.*
