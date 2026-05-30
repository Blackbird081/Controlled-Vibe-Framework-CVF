# CVF LHW18 T3 — Context Management Strategy Advisory Connector Spec

Contract ID: `cvf.contextManagementStrategyAdvisory.lhw18.t3.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW18 T3

GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Document the canonical context management strategy advisory for CVF agents — task-scope
minimization, context budget boundary, and progressive disclosure — against existing CVF
owner surfaces. Extends LHW17 T3 (Learning Plane advisory) with the concrete context
strategy from operator audit `De_xuat.md` and `Review CVF_5.md`.

## Scope / Applies To

Applies to any future CVF surface that manages context delivery to agents (context packager,
task scope enforcement, knowledge router). Does NOT authorize new context engine implementation
in this wave.

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Context packager | `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts` (AIF-C) |
| Task scope | `CVF_v1.2_CAPABILITY_EXTENSION` task-scope guard |
| Knowledge routing | `CVF_ECO_v1.4_RAG_PIPELINE` + AIF-B Graph Knowledge |
| Context profile | LHW15 T3 `contextProfilePackagingAdvisoryType` |
| Scale strategy | Failure Simulation Scenario 5 advisory (LHW18 T1) |

---

## Advisory Type

`contextManagementStrategyAdvisoryType`

---

## Core Strategy (from De_xuat.md + Review CVF_5.md)

**Problem:** When project scales to 150+ modules, LLM context overflow causes:
- agent loses understanding of global architecture
- code drifts from spec
- hallucinations increase

**CVF strategy:** Agent receives only the **minimum necessary context** for its current task.

```
Task execution context = task_spec + relevant_module + architecture_fragment
                         (NOT the entire project)
```

---

## 3 Context Management Advisory Principles

### P1 — Task Scope Minimization

Each agent execution must be scoped to exactly the context required for its current task.

**Current CVF implementation:** Task scope guard in `CVF_v1.2_CAPABILITY_EXTENSION`
limits agent action scope per task. Context packager (`memory-context-packager.ts`)
packages the relevant subset.

**Advisory:** Any future context engine expansion must preserve this constraint.
Expanding context beyond task scope requires explicit governance justification
(R1 level minimum) per task scope guard policy.

### P2 — Context Budget Boundary

Context delivery must respect the LLM's effective context window for the assigned task.

**Current CVF implementation:** `memory-context-packager.ts` handles packaging.
No explicit token budget enforcement exists yet.

**Advisory:** A future Context Budget Guard should enforce:
- `maxContextTokens` per task class (e.g., review task vs. implementation task)
- reject context packages that exceed budget
- escalate to human if task cannot be completed within budget

This is a `MACHINE_CHECK_CANDIDATE` for a future context engine tranche.

### P3 — Progressive Disclosure

Complex architecture should be revealed to agents incrementally, not all at once.

**Current CVF implementation:** LHW15 T3 `contextProfilePackagingAdvisoryType` establishes
the context profile packaging boundary. AIF-B Graph Knowledge enables targeted symbol
retrieval rather than full codebase injection.

**Advisory:** Progressive disclosure = the already-established behavior of context packager
+ graph knowledge retrieval. This is NOT a new doctrine — it is the confirmed name for
existing behavior, per `CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md` section 3.5.

---

## Scale Failure Advisory (Scenario 5 bridge)

Cross-reference with LHW18 T1 Scenario 5 (Project Scale):

The T1 advisory rates project scale stability as `MODERATE`. The root cause is that
`memory-context-packager.ts` cannot currently capture all cross-module dependencies
for large projects.

**Advisory path forward:**
1. Context Budget Guard (P2 above) — prevents overflow, forces explicit scope
2. Graph Knowledge Service (AIF-B) — enables targeted cross-module retrieval
3. Context Profile Packaging (LHW15 T3) — provides structured profile per task

These three form the current CVF context management stack. A future Context Engine
tranche would unify them under a single governed boundary.

---

## Advisory Readout Fields

```typescript
contextManagementStrategyAdvisoryType:
  "cvf.contextManagementStrategyAdvisory.lhw18.t3.v1"
contextManagementAdvisory: {
  taskScopeMinimization: "IMPLEMENTED" | "PARTIAL" | "ADVISORY_ONLY"
  contextBudgetBoundary: "ADVISORY_ONLY"
  progressiveDisclosure: "IMPLEMENTED_VIA_EXISTING_BEHAVIOR"
  contextPackagerOwner: string
  scalabilityRating: "MODERATE"
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF Edit/De_xuat.md` (mục 4)
- Source: `.private_reference/legacy/CVF Edit/Review CVF_5.md`
- Context packager: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/memory-context-packager.ts`
- LHW15 T3: `docs/reference/CVF_LHW15_T3_CONTEXT_PROFILE_PACKAGING_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- LHW18 T1: `docs/reference/CVF_LHW18_T1_FAILURE_SIMULATION_GAP_MAP_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`
- 2026-04-12 decision: `.private_reference/legacy/CVF_Important/REVIEW FOLDER/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md` (section 3.5, Progressive Disclosure)

## Claim Boundary

This spec is documentation-only advisory. It does not prove context budget enforcement,
cross-module architecture stability, or project-scale readiness. Context Budget Guard
implementation requires a separate governed tranche.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No new context engine code
- Progressive Disclosure is NOT a new doctrine — it is confirmed as existing behavior
- No public release readiness claim
