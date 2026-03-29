# CVF W8-T1 CP1 Audit — Trust/Isolation Boundary Contract

Memory class: FULL_RECORD

> Tranche: W8-T1 — Trust Isolation and Model Gateway Boundary Convergence
> Control point: CP1 — TrustIsolationBoundaryContract
> Lane: Full Lane
> Date: 2026-03-29
> GC-018 authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W8_T1_TRUST_ISOLATION_MODEL_GATEWAY_BOUNDARY_2026-03-29.md`

---

## 1. Contract Delivered

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/trust.isolation.boundary.contract.ts`

Three operations:

| Operation | Input | Output | Decision surface |
|---|---|---|---|
| `declareTrustDomain` | `TrustDomainCriteria` | `TrustDomainDeclaration` | FULL_RUNTIME vs LIGHTWEIGHT_SDK selection |
| `evaluateIsolationScope` | `IsolationScopeRequest` | `IsolationScopeResult` | HARD_BLOCK / ESCALATE / PASS per scope class and risk level |
| `decideTrustPropagation` | `TrustPropagationRequest` | `TrustPropagationDecision` | DIRECT / GRAPH_GATED / BLOCKED |

---

## 2. Trust Domain Decision Logic (declareTrustDomain)

Full Safety Runtime (`CVF_v1.7.1_SAFETY_RUNTIME`) is required when ANY of:
- `requiresPolicySimulation = true`
- `requiresRiskEvaluation = true`
- `riskLevel = R2` or `R3`

Lightweight SDK (`CVF_ECO_v2.0_AGENT_GUARD_SDK`) is eligible when ALL of:
- `requiresPolicySimulation = false`
- `requiresRiskEvaluation = false`
- `riskLevel = R0` or `R1`

This resolves the previously undeclared trust domain split. The decision is code-traceable and deterministically hashed.

---

## 3. Isolation Scope Logic (evaluateIsolationScope)

| Scope | Condition | Enforcement | Boundary Status |
|---|---|---|---|
| WORKSPACE | write / modify / delete operation | HARD_BLOCK | BOUNDARY_BREACH |
| WORKSPACE | read operation | PASS | WITHIN_BOUNDARY |
| AGENT | R3 | HARD_BLOCK | BOUNDARY_BREACH |
| AGENT | R2 | ESCALATE | GOVERNANCE_GATE_REQUIRED |
| AGENT | R0/R1 | PASS | WITHIN_BOUNDARY |
| CAPABILITY | R3 | HARD_BLOCK | BOUNDARY_BREACH |
| CAPABILITY | R2 | ESCALATE | GOVERNANCE_GATE_REQUIRED |
| CAPABILITY | R0/R1 | PASS | WITHIN_BOUNDARY |

Workspace isolation enforcement aligns with the CVF Workspace Isolation Rule (CLAUDE.md): CVF root is maintenance-only; user projects must be sibling directories.

---

## 4. Trust Propagation Logic (decideTrustPropagation)

| Condition | Mode | Rationale |
|---|---|---|
| `requiresGovernanceApproval = true` | GRAPH_GATED | Explicit governance approval declared by caller |
| `propagationContext = "cross-plane"` | GRAPH_GATED | Cross-plane trust always requires governance gate |
| `propagationContext = "consumer-pipeline"` | DIRECT | Same-plane consumer pipeline propagation allowed |
| `propagationContext = "agent-to-agent"` | DIRECT | Same-plane agent propagation allowed |
| any other context | BLOCKED | Unknown contexts blocked by default |

Graph-based trust propagation (from `CVF_ECO_v2.4_GRAPH_GOVERNANCE/trust.propagator.ts`) is now explicitly gated. It may only run when the GRAPH_GATED mode is confirmed, not as a background operation.

---

## 5. W7 Chain Impact Assessment

| Chain Link | Impact | Evidence |
|---|---|---|
| Runtime | READ_ONLY | Contract reads trust domain criteria to classify; does not invoke CVF_v1.7.1_SAFETY_RUNTIME directly |
| Artifact | READ_ONLY | Isolation scope reads subject IDs; no artifact contract restructured |
| Trace | READ_ONLY | No trace contracts modified |
| Planner | READ_ONLY | No planner contracts modified |
| Decision | ADDITIVE | TrustDomainDeclaration, IsolationScopeResult, TrustPropagationDecision are new artifacts in the decision chain |
| Eval/Builder | NONE | Not referenced |
| Memory | NONE | Not referenced |

**Assessment:** No STRUCTURAL impacts detected. W7 chain is preserved. Rollback path: removing the new contract and its exports restores the v3.0-W7T10 baseline without side effects.

---

## 6. Determinism Compliance

- `declarationHash`: `computeDeterministicHash("w8-t1-cp1-trust-domain", ...)` — deterministic for same inputs
- `resultHash`: `computeDeterministicHash("w8-t1-cp1-isolation-scope", ...)` — deterministic for same inputs
- `decisionHash`: `computeDeterministicHash("w8-t1-cp1-trust-propagation", ...)` — deterministic for same inputs
- `now` injectable in `TrustIsolationBoundaryContractDependencies` — determinism pattern followed

---

## 7. GC-023 Compliance

- New contract file: `trust.isolation.boundary.contract.ts` (222 lines) — within `general_source` threshold (700 soft)
- New test file: `trust.isolation.boundary.contract.test.ts` (dedicated, never merged into `index.test.ts`)
- `index.ts` after export addition: 681 lines — within `general_source` advisory threshold

---

## 8. Test Coverage

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/trust.isolation.boundary.contract.test.ts`

| Group | Tests |
|---|---|
| declareTrustDomain — FULL_RUNTIME triggers | 6 |
| declareTrustDomain — LIGHTWEIGHT_SDK eligibility | 3 |
| declareTrustDomain — declaration fields | 4 |
| evaluateIsolationScope — WORKSPACE | 4 |
| evaluateIsolationScope — AGENT | 4 |
| evaluateIsolationScope — CAPABILITY | 3 |
| evaluateIsolationScope — result fields | 5 |
| decideTrustPropagation — GRAPH_GATED | 2 |
| decideTrustPropagation — DIRECT | 2 |
| decideTrustPropagation — BLOCKED | 2 |
| decideTrustPropagation — decision fields | 4 |
| Factory | 1 |
| **Total** | **40** |

---

## 9. Pass Condition Compliance (from GC-018 W8-T1)

| Required evidence | Status |
|---|---|
| Trust/isolation boundary contract clarification artifacts | DELIVERED — `trust.isolation.boundary.contract.ts` |
| W7 chain READ_ONLY/ADDITIVE confirmation | DELIVERED — section 5 above |
| Trust domain split decision code-traceable | DELIVERED — `declareTrustDomain` logic |
| Isolation boundary unified interface | DELIVERED — `evaluateIsolationScope` |
| Trust propagation gating | DELIVERED — `decideTrustPropagation` |
| Rollback posture | DELIVERED — additive; removing restores baseline |
