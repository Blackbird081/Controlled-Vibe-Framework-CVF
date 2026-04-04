# CVF W8-T1 CP2 Audit — Model Gateway Boundary Contract

Memory class: FULL_RECORD

> Tranche: W8-T1 — Trust Isolation and Model Gateway Boundary Convergence
> Control point: CP2 — ModelGatewayBoundaryContract
> Lane: Full Lane
> Date: 2026-03-29
> Depends on: CP1 — TrustIsolationBoundaryContract (CLOSED DELIVERED)

---

## 1. Contract Delivered

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/model.gateway.boundary.contract.ts`

Four operations:

| Operation | Output | Purpose |
|---|---|---|
| `classifyGatewaySurfaces()` | `ModelGatewayBoundaryEntry[]` | Classifies all 20 gateway surfaces as FIXED_INPUT or IN_SCOPE |
| `declareKnowledgeLayerEntrypoint()` | `KnowledgeLayerEntrypointDeclaration` | Declares canonical Knowledge Layer → AI Gateway handoff boundary |
| `declareExecutionAuthority()` | `ModelGatewayExecutionAuthority` | Declares CPF (design-time) vs EPF (build-time) authority split |
| `generateBoundaryReport()` | `ModelGatewayBoundaryReport` | Combines all three into one deterministically hashed report |

---

## 2. Gateway Surface Classification

| Count | Status | Meaning |
|---|---|---|
| 18 | FIXED_INPUT | All existing CPF gateway contracts — frozen by W7; W8-T1 reads but does not restructure |
| 2 | IN_SCOPE | `knowledge-layer-entrypoint` + `model-gateway-execution-authority` — new W8-T1 declarations |
| **20** | **Total** | All surfaces accounted for — no ambiguous or undeclared surfaces remain |

FIXED_INPUT surfaces include: ai-gateway, ai-gateway-consumer-pipeline, ai-gateway-consumer-pipeline-batch, gateway-auth (3 variants), gateway-auth-log (3 variants), gateway-consumer (3 variants), gateway-pii-detection (3 variants), gateway-pii-detection-log (3 variants).

Decision pack pass condition 4 — "AI Gateway contract surfaces must be frozen as FIXED INPUT or IN SCOPE" — is now SATISFIED with code-traceable evidence.

---

## 3. Knowledge Layer Entrypoint Declaration

Previously undefined. Now declared:

- `knowledgeLayerOutputContract`: `ContextPackage` (CPF context.packager.contract.ts)
- `aiGatewayInputContract`: `GatewaySignalRequest` (CPF ai.gateway.contract.ts)
- `ownerPlane`: CONTROL_PLANE
- Conversion: `ControlPlaneConsumerPipelineContract` performs the ContextPackage → GatewaySignalRequest bridge
- This is the first architectural declaration of the Knowledge Layer → AI Gateway boundary

---

## 4. Model-Gateway Execution Authority Declaration

Previously ambiguous between CPF and EPF. Now declared:

**Control Plane owns (design-time):**
- intent validation and risk classification (INTAKE/DESIGN phases)
- phase gate enforcement
- context packaging and knowledge-layer query gating
- `ControlPlaneConsumerPipelineContract` → produces `ControlPlaneConsumerPackage`
- AI Gateway signal normalization (pre-invocation)

**Execution Plane owns (build-time):**
- actual model invocation — `ExecutionPipelineContract` (BUILD phase)
- `ExecutionPipelineReceipt`
- artifact staging and trace management post-invocation
- spec policy enforcement through `policy.gate.contract.ts`

**Canonical handoff (unchanged, locked by W7-T3 CP2):**
`ControlPlaneConsumerPackage` → `EPF ExecutionPipelineContract`

---

## 5. W7 Chain Impact Assessment

| Chain Link | Impact | Evidence |
|---|---|---|
| Runtime | READ_ONLY | Gateway surface classification reads existing contracts; no runtime restructuring |
| Artifact | READ_ONLY | Artifact staging ownership is declared (EPF), not modified |
| Trace | READ_ONLY | Trace ownership declared (EPF), not modified |
| Planner | READ_ONLY | No planner contract touched |
| Decision | ADDITIVE | ModelGatewayBoundaryReport is a new decision artifact; does not replace existing decision contracts |
| Eval/Builder | NONE | Not referenced |
| Memory | NONE | Not referenced |

**Assessment:** No STRUCTURAL impacts. CPF→EPF canonical handoff unchanged. Rollback: removing contract and exports restores baseline without side effects.

---

## 6. Downstream Readiness: Candidate B

With CP2 delivered, Candidate B (RAG + Context Engine convergence) can now declare its gateway assumptions:
- The 18 FIXED_INPUT surfaces are stable inputs for Candidate B
- The Knowledge Layer entrypoint is declared (`ContextPackage` → `GatewaySignalRequest`)
- The execution authority boundary is frozen (CPF=design-time, EPF=build-time)

Candidate B must declare which of these surfaces it treats as fixed and which it extends.

---

## 7. Test Coverage

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/model.gateway.boundary.contract.test.ts`

| Group | Tests |
|---|---|
| classifyGatewaySurfaces — counts | 3 |
| classifyGatewaySurfaces — IN_SCOPE | 2 |
| classifyGatewaySurfaces — FIXED_INPUT (parametrized) | 18 |
| classifyGatewaySurfaces — field completeness | 4 |
| declareKnowledgeLayerEntrypoint | 7 |
| declareExecutionAuthority | 9 |
| generateBoundaryReport | 8 |
| Factory | 1 |
| **Total** | **52** |

---

## 8. GC-023 Compliance

- `model.gateway.boundary.contract.ts`: 280 lines — within general_source threshold (700 soft)
- `model.gateway.boundary.contract.test.ts`: dedicated file, GC-024 compliant
- `index.ts` after CP2 export addition: ~697 lines — within general_source advisory threshold
