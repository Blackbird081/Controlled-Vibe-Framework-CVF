# CVF Federated Plane Convergence Roadmap Proposal
> **Date:** 2026-03-21
> **Document Type:** Restructuring proposal
> **Status:** Proposal only — not authorized for implementation
> **Purpose:** Provide an alternative to big-bang source-tree restructuring for future CVF convergence

---

## Executive Position

This roadmap proposes a **federated, extension-preserving restructuring path** for CVF.

It is intentionally different from a big-bang move into:

- `/src/control_plane`
- `/src/execution_plane`
- `/src/governance`
- `/src/learning_plane`

The core idea is:

- keep the current extension-based repo physically stable first
- converge architecture through logical plane ownership, contracts, and facades
- only consider physical consolidation after convergence proves itself

---

## Why This Proposal Exists

The current repository is already organized around explicit extension modules under `EXTENSIONS/`.

That structure has value:

- version lineage
- ownership clarity
- controlled integration
- bounded rollout

Replacing it immediately with a new physical tree risks coupling too many changes together.

This proposal reduces that risk.

---

## Core Principles

1. **Logical convergence before physical consolidation**
2. **Extension lineage is preserved unless there is proven benefit to collapse it**
3. **Boundary strengthening comes before tree restructuring**
4. **Rollback remains practical at every phase**
5. **Plane ownership is explicit, even if source layout remains federated**

---

## Target Outcome

The system should converge into four logical planes:

- `Control`
- `Execution`
- `Governance`
- `Learning`

But those planes do not need to become immediate top-level source directories on day one.

Instead, each extension should be classified by:

- primary plane
- secondary plane dependencies
- ownership role
- integration contract
- migration status

---

## Proposed Phases

### Phase 0 — Plane Ownership Inventory

**Goal:** classify the current extensions into logical planes without moving them physically.

Work:

- assign each extension a primary logical plane
- identify cross-plane dependencies
- identify overlaps that require merge, not duplication
- classify each module as `KEEP`, `MERGE`, `DEPRECATE`, or `FACADE`

Outputs:

- plane ownership matrix
- dependency map
- overlap register

Gate:

- no unclassified critical extension remains

---

### Phase 1 — Contract and Boundary Convergence

**Goal:** stabilize shared contracts and interaction boundaries across extensions.

Work:

- standardize plane-facing interfaces
- define canonical facades for governance, execution, knowledge, and orchestration
- reduce direct cross-extension leakage
- harden shared type and policy boundaries

Outputs:

- contract matrix
- facade definitions
- cross-plane interaction rules

Gate:

- critical interactions routed through agreed contracts

---

### Phase 2 — Federated Plane Facades

**Goal:** present the system as converged planes without forcing a big-bang filesystem move.

Work:

- create plane-level façade packages or entrypoints
- expose stable plane-oriented APIs
- preserve underlying extension modules behind those facades

Outputs:

- federated control plane facade
- federated execution plane facade
- federated governance plane facade
- federated learning plane facade

Gate:

- plane-level usage is possible without immediate physical consolidation

---

### Phase 3 — Merge Overlaps, Not Trees

**Goal:** collapse duplicated responsibilities before collapsing directories.

Work:

- merge overlapping gateway/router/strategy concepts
- merge overlapping audit/consensus concepts
- merge overlapping context/knowledge packaging concepts
- rationalize capability/identity/governance overlaps

Outputs:

- overlap-closure receipts
- merged ownership definitions

Gate:

- no major duplicate subsystem remains in active architecture

---

### Phase 4 — Optional Physical Consolidation Study

**Goal:** decide whether the repo still needs a physical `/src/...` plane tree after logical convergence is complete.

Work:

- compare operational cost of staying federated vs physically consolidating
- evaluate developer ergonomics
- evaluate build/test complexity
- evaluate rollback complexity

Possible outcomes:

1. keep extension-based physical layout
2. partially consolidate selected subsystems
3. fully consolidate into a new physical tree

Gate:

- physical consolidation is justified by evidence, not preference

---

## Comparison with Big-Bang Physical Restructure

| Criterion | Big-Bang Physical Restructure | Federated Plane Convergence |
|---|---|---|
| Immediate disruption | High | Low |
| Rollback complexity | High | Medium |
| Fit with current repo | Low | High |
| Preservation of extension lineage | Low | High |
| Ability to test convergence incrementally | Low | High |
| EA recommendation | Conditional at best | Preferred |

---

## Why This Is the Better Proposal

This approach is better because it separates:

- architectural convergence
- ownership cleanup
- contract stabilization
- physical filesystem change

Those should not be forced into one move unless the repository has already proven it needs that collapse.

For CVF, that proof does not exist yet.

---

## Decision Posture

This roadmap is a **proposal for review**, not an execution plan.

It should be compared directly against the existing restructuring roadmap before any final roadmap is chosen.

The right next step is:

1. review this proposal
2. compare it with the current big-bang roadmap
3. decide which one better fits CVF’s actual architecture and governance posture
