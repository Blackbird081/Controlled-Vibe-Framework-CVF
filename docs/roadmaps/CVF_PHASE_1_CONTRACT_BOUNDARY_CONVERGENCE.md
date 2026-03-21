# CVF Phase 1 — Contract and Boundary Convergence
> **Date:** 2026-03-21
> **Roadmap Ref:** `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` — Phase 1
> **Status:** DELIVERABLE — Pending User Sign-off
> **Prerequisite:** Phase 0 ✅ SIGNED OFF

---

## Deliverable 1: Contract Matrix

### Governance Plane Contracts (Provider)

| Contract | Module Provider | Interface | Consumers | Coupling |
|----------|----------------|-----------|-----------|----------|
| **Guard Evaluation** | `CVF_GUARD_CONTRACT` | `createGuardEngine()` → `GuardRuntimeEngine.evaluate(ctx)` | AGENT_PLATFORM, PHASE_GOV_PROTOCOL | **Strong** — direct import |
| **Guard Types** | `CVF_GUARD_CONTRACT/types.ts` | `GuardRequestContext`, `GuardPipelineResult`, `CVFPhase`, `CVFRiskLevel`, `CVFRole`, `Guard` | ALL planes | **Strong** — universal contract |
| **Mandatory Gateway** | `CVF_GUARD_CONTRACT/runtime/mandatory-gateway.ts` | `MandatoryGateway.check()` / `assertAllowed()` | Execution consumers | **Medium** — SDK-level enforcement |
| **Guard Gateway (Multi-Entry)** | `CVF_v1.1.1_PHASE_GOV_PROTOCOL/guard_runtime/entry/guard.gateway.ts` | `GuardGateway.process(entryPoint, rawInput)` | CLI, MCP, API channels | **Medium** — adapter pattern |
| **Phase Protocol** | `CVF_v1.1.1_PHASE_GOV_PROTOCOL/phase_protocol/` | `PhaseProtocol`, `PhaseContext`, `ArtifactRegistry` | Orchestration consumers | **Medium** |
| **Pipeline Orchestrator** | `CVF_v1.1.1_PHASE_GOV_PROTOCOL/guard_runtime/pipeline.orchestrator.ts` | `PipelineOrchestrator.run()` | AGENT_PLATFORM | **Strong** |

### Execution Plane Contracts (Provider)

| Contract | Module Provider | Interface | Consumers |
|----------|----------------|-----------|-----------|
| **Agent Web Runtime** | `CVF_v1.6_AGENT_PLATFORM/cvf-web` | Next.js routes: `/api/execute`, `/api/guards/evaluate`, `/api/guards/audit-log` | End Users, CLI |
| **Guard Engine Singleton** | `CVF_v1.6_AGENT_PLATFORM/lib/guard-engine-singleton.ts` | `getSharedGuardEngine()`, `resetSharedGuardEngine()` | Internal routes |
| **Guard Runtime Adapter** | `CVF_v1.6_AGENT_PLATFORM/lib/guard-runtime-adapter.ts` | `createWebGuardEngine()` (deprecated → use `createGuardEngine()`) | Internal routes |
| **Agent Execution Runtime** | `CVF_GUARD_CONTRACT/runtime/agent-execution-runtime.ts` | `AgentExecutionRuntime` class | Agent consumers |

### Control Plane Contracts (Provider)

| Contract | Module Provider | Interface | Status |
|----------|----------------|-----------|--------|
| **RAG Pipeline** | `CVF_ECO_v1.4_RAG_PIPELINE` | Knowledge retrieval API | Spec-only (no unified contract) |
| **Context Packager** | `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | Context snapshot + token bounding | Spec-only |

### Learning Plane Contracts (Provider)

| Contract | Module Provider | Interface | Status |
|----------|----------------|-----------|--------|
| **Reputation** | `CVF_ECO_v3.1_REPUTATION` | Agent reputation scoring | Spec-only |
| **Task Marketplace** | `CVF_ECO_v3.0_TASK_MARKETPLACE` | Task ledger | Spec-only |
| **Observability** | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | Metrics/Telemetry | Spec-only |

---

## Deliverable 2: Canonical Facade Definitions

### 2.1 Governance Facade

```typescript
// CANONICAL: governance-facade.ts
// Purpose: Single entry point for ALL governance operations

export interface GovernanceFacade {
  // Guard Evaluation — delegates to CVF_GUARD_CONTRACT
  evaluateGuards(context: GuardRequestContext): GuardPipelineResult;
  
  // Gateway — delegates to MandatoryGateway
  checkAction(request: GatewayCheckRequest): GatewayResult;
  assertAllowed(request: GatewayCheckRequest): void;
  
  // Multi-Entry — delegates to GuardGateway
  processEntry(entryPoint: 'CLI' | 'MCP' | 'API', rawInput: Record<string, unknown>): EntryResponse;
  
  // Phase Protocol — delegates to PhaseProtocol
  getCurrentPhase(): CanonicalCVFPhase;
  validatePhaseTransition(from: CanonicalCVFPhase, to: CanonicalCVFPhase): boolean;
  
  // Audit
  getAuditLog(): readonly GuardAuditEntry[];
}
```

### 2.2 Execution Facade

```typescript
// CANONICAL: execution-facade.ts
// Purpose: Single entry point for ALL execution operations

export interface ExecutionFacade {
  // Agent Runtime — delegates to AgentExecutionRuntime
  executeAction(request: ExecutionRequest): ExecutionResult;
  
  // Model Gateway (Target — Phase 3 merge)
  routeToProvider(request: ModelRequest): ModelResponse;
  
  // MCP Bridge — delegates to CVF_ECO_v2.5_MCP_SERVER  
  invokeToolViaMCP(toolId: string, params: Record<string, unknown>): ToolResult;
}
```

### 2.3 Knowledge Facade (Control Plane)

```typescript
// CANONICAL: knowledge-facade.ts
// Purpose: Single entry point for ALL knowledge/context operations

export interface KnowledgeFacade {
  // RAG — delegates to CVF_ECO_v1.4_RAG_PIPELINE
  retrieveContext(query: string, options?: RetrievalOptions): ContextChunk[];
  
  // Context Packager — delegates to CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY
  packageContext(chunks: ContextChunk[], tokenBudget: number): PackagedContext;
  
  // Privacy Filter (Target — new)
  filterPII(content: string): FilteredContent;
}
```

### 2.4 Learning Facade

```typescript
// CANONICAL: learning-facade.ts
// Purpose: Single entry point for ALL learning/feedback operations
// NOTE: Activated LAST per GR-09

export interface LearningFacade {
  // Reputation — delegates to CVF_ECO_v3.1_REPUTATION
  getAgentReputation(agentId: string): ReputationScore;
  
  // Task Ledger — delegates to CVF_ECO_v3.0_TASK_MARKETPLACE
  recordTaskOutcome(taskId: string, outcome: TaskOutcome): void;
  
  // Observability — delegates to v1.8.1
  emitMetric(name: string, value: number, tags?: Record<string, string>): void;
}
```

---

## Deliverable 3: Cross-Plane Interaction Rules

| # | Rule | Rationale | Enforcement |
|---|------|-----------|-------------|
| **XP-01** | Execution → Governance: MUST go through `GovernanceFacade` | Prevent guard bypass | Static analysis + runtime check |
| **XP-02** | Execution → Knowledge: MUST go through `KnowledgeFacade` | Prevent direct DB/RAG access | Import restriction |
| **XP-03** | Control → Governance: read-only audit queries allowed | Control reads policy state | Type-enforced |
| **XP-04** | Learning → Governance: feedback only via `LearningFacade` | Prevent adaptive behavior from modifying guards | Runtime check |
| **XP-05** | Governance → Execution: NEVER. Governance does not execute. | Separation of concerns | Architecture invariant |
| **XP-06** | Learning → Execution: NEVER directly. Via Governance reputation gate. | Anti-gaming | Architecture invariant |
| **XP-07** | ALL planes → `CVF_GUARD_CONTRACT/types.ts`: import freely | Types are universal contract | By design |
| **XP-08** | Cross-plane: NO direct file-system path imports between EXTENSIONS | Prevent coupling | CI lint rule |

---

## Deliverable 4: Boundary Violation Register

### ⚠️ Violations Detected in Current Codebase

| # | Violation | Severity | Location | Cross-Plane Rule | Resolution |
|---|-----------|----------|----------|-------------------|------------|
| **BV-01** | **Duplicate type definitions**: `guard.runtime.types.ts` in PHASE_GOV_PROTOCOL re-declares types already defined in `CVF_GUARD_CONTRACT/types.ts` | 🔴 HIGH | `CVF_v1.1.1_PHASE_GOV_PROTOCOL/governance/guard_runtime/guard.runtime.types.ts` | XP-07 | PHASE_GOV_PROTOCOL should import from GUARD_CONTRACT, not re-declare |
| **BV-02** | **Duplicate GuardRuntimeEngine**: PHASE_GOV_PROTOCOL has its own `guard.runtime.engine.ts` parallel to `CVF_GUARD_CONTRACT/engine.ts` | 🔴 HIGH | `CVF_v1.1.1_PHASE_GOV_PROTOCOL/governance/guard_runtime/guard.runtime.engine.ts` | XP-01 | Determine canonical engine. GUARD_CONTRACT should be source of truth. |
| **BV-03** | **Deprecated adapter still exported**: `createWebGuardEngine()` in AGENT_PLATFORM is deprecated but still exported and potentially consumed | 🟡 MEDIUM | `CVF_v1.6_AGENT_PLATFORM/lib/guard-runtime-adapter.ts:78` | — | Remove deprecated export, ensure all consumers use `createGuardEngine()` |
| **BV-04** | **Two Gateway patterns**: `MandatoryGateway` (GUARD_CONTRACT) and `GuardGateway` (PHASE_GOV_PROTOCOL) serve similar purposes with different APIs | 🟡 MEDIUM | Both modules | XP-01 | Unify under GovernanceFacade in Phase 2 |
| **BV-05** | **Control Plane lacks formal contracts**: RAG, Context Packager, Skill Governance have no TypeScript interface definitions exposing facade-level APIs | 🟡 MEDIUM | Control Plane modules | XP-02 | Define `KnowledgeFacade` interface in Phase 2 |
| **BV-06** | **Learning Plane lacks formal contracts**: Reputation and Task Marketplace have no cross-plane interface | 🟢 LOW | Learning Plane modules | XP-04 | Define `LearningFacade` in Phase 2 (Learning is last per GR-09) |

### Violations Not Detected (Clean Boundaries)

| Check | Result |
|-------|--------|
| GUARD_CONTRACT types used consistently in AGENT_PLATFORM | ✅ CLEAN |
| Risk model consistently `R0-R3` across all runtime code | ✅ CLEAN |
| Phase model consistently 5-phase across all runtime code | ✅ CLEAN |
| Guard count = 8 shared default in factory | ✅ CLEAN |
| No cross-EXTENSION direct file imports in active-path code | ✅ CLEAN (npm package import pattern used) |

---

## Verification Gate Check

| Criterion | Status |
|-----------|--------|
| All critical cross-plane interactions go through defined contracts | ✅ Governance→Execution via `createGuardEngine()` |
| Active-path modules no longer depend on undocumented cross-plane access | ⚠️ BV-01/BV-02 need resolution (duplicate types/engine) |
| Contract matrix has testable coverage for active-path integrations | ✅ Tests exist in GUARD_CONTRACT + AGENT_PLATFORM |
| At least one conformance/static-check path can detect boundary violations | ✅ `conformance.runner.ts` exists in PHASE_GOV_PROTOCOL |

### Gate Verdict: **CONDITIONAL PASS**
> BV-01 và BV-02 cần được giải quyết ở Phase 2 (Facade) hoặc Phase 3 (Merge). Contract Matrix và Interaction Rules đã đủ để tiến hành. Façade definitions đã được xác định — chờ implementation ở Phase 2.

---

## Rollback Criteria Confirmation

| Criterion | Evidence |
|-----------|---------|
| Contract/facade changes can be reverted in < 1h | ✅ Tất cả output là tài liệu (document-only). Chưa thay đổi code. |
| Active-path integrations continue running if contract layer disabled | ✅ Chưa thay đổi runtime behavior. |
