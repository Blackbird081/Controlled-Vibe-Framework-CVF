# CVF Federated Plane Convergence Roadmap Proposal — Revision 2
> **Date:** 2026-03-21
> **Document Type:** Restructuring proposal
> **Status:** Proposal only — not authorized for implementation
> **Purpose:** Revised federated restructuring proposal incorporating formal critique
> **Revision Note:** This version keeps the original federated strategy, but strengthens execution discipline by adding per-phase verification gates, rollback criteria, and a mandatory physical-consolidation decision review
> **Revision 2.1 Addendum:** Added baseline re-verify gate (R0-R3, 8/15 guards) in Phase 0, and highlighted independent subsystem rollback in Phase 3

---

## Executive Position

This roadmap keeps the same core architectural thesis:

- CVF should converge through **logical planes first**
- CVF should preserve the extension-based physical repo by default during early restructuring
- CVF should not start with a big-bang move into a new `/src/...` tree

However, this revision adopts two important corrections:

1. `Phase 4` is no longer optional  
2. every phase now has explicit verification gates and rollback criteria

That makes the federated strategy stronger not only as architecture, but as governance-ready execution planning.

---

## Why This Roadmap Exists

The current repository is already organized as a versioned extension ecosystem under `EXTENSIONS/`.

That structure has real value:

- version lineage
- controlled ownership
- bounded rollout
- integration traceability
- easier historical reasoning

A restructuring path that ignores this and collapses everything physically too early carries unnecessary blast radius.

This roadmap aims to:

- converge architecture without premature filesystem collapse
- preserve reversibility
- strengthen ownership and interfaces before changing tree shape

---

## Core Principles

1. **Logical convergence before physical consolidation**
2. **Extension lineage is preserved unless evidence proves consolidation is better**
3. **Boundary strengthening comes before tree restructuring**
4. **Each phase must prove success through measurable gates**
5. **Each phase must define rollback, not just forward motion**
6. **Physical consolidation is a governed decision, not a stylistic preference**

---

## Target Outcome

CVF converges into four logical planes:

- `Control`
- `Execution`
- `Governance`
- `Learning`

But physical convergence is not assumed at the start.

Instead, each extension is classified by:

- primary plane
- secondary plane dependencies
- ownership role
- integration contract
- migration status

---

## Proposed Phases

### Phase 0 — Plane Ownership Inventory

**Goal:** classify all critical extensions into explicit logical planes without moving them physically.

#### Work

- assign each extension a primary logical plane
- identify cross-plane dependencies
- identify overlaps that require `MERGE`, not duplicate creation
- classify each module as `KEEP`, `MERGE`, `DEPRECATE`, or `FACADE`
- identify modules that are active-path critical vs ecosystem-breadth only

#### Outputs

- plane ownership matrix
- dependency map
- overlap register
- active-path criticality register

#### Verification Gate

- 100% of critical extensions have a primary plane
- 100% of critical extensions have a lifecycle label: `KEEP`, `MERGE`, `DEPRECATE`, or `FACADE`
- no unresolved top-level overlap remains without an explicit owner
- no active-path module remains “unclassified”
- **baseline re-verified:** ownership matrix confirms current risk model = `R0-R3`, guard baseline = `8 shared default` / `15 full runtime preset`

#### Rollback Criteria

- all inventory artifacts can be reverted to the pre-phase baseline in under `1 hour`
- no code-path behavior changes are introduced in this phase

---

### Phase 1 — Contract and Boundary Convergence

**Goal:** stabilize contracts and interaction rules across extensions before façade exposure or physical restructuring.

#### Work

- standardize plane-facing interfaces
- define canonical facades for governance, execution, knowledge, and orchestration
- reduce direct cross-extension leakage
- harden shared type, policy, and interaction boundaries
- define boundary violations that must fail CI or conformance

#### Outputs

- contract matrix
- façade definitions
- cross-plane interaction rules
- boundary violation register

#### Verification Gate

- all critical cross-plane interactions go through defined contracts
- active-path modules no longer depend on undocumented cross-plane access
- contract matrix has testable coverage for active-path integrations
- at least one conformance or static-check path can detect boundary violations

#### Rollback Criteria

- contract and facade changes can be reverted in under `1 hour`
- active-path integrations continue to run if the new contract layer is disabled

---

### Phase 2 — Federated Plane Facades

**Goal:** expose stable plane-level APIs without forcing immediate physical consolidation.

#### Work

- create plane-level façade packages or entrypoints
- expose stable plane-oriented APIs
- preserve underlying extension modules behind those facades
- map active-path consumption to the façade layer

#### Outputs

- federated control plane facade
- federated execution plane facade
- federated governance plane facade
- federated learning plane facade
- adoption matrix for active-path modules

#### Verification Gate

- at least one active reference path uses plane-level facades instead of direct scattered calls
- backward compatibility remains intact for existing active-path entrypoints
- facade adoption is evidenced, not just declared
- disabling the facade layer does not permanently break the active path

#### Rollback Criteria

- facade entrypoints can be withdrawn in under `1 hour`
- underlying extension modules remain callable directly if the facade layer is rolled back

---

### Phase 3 — Merge Overlaps, Not Trees

**Goal:** remove duplicate subsystem responsibility before deciding whether to collapse directories.

#### Work

- merge overlapping gateway/router/strategy concepts
- merge overlapping audit/consensus concepts
- merge overlapping context/knowledge packaging concepts
- rationalize capability/identity/governance overlaps
- publish ownership closure receipts for each merged subsystem

#### Outputs

- overlap-closure receipts
- merged ownership definitions
- duplicate-subsystem removal register

#### Verification Gate

- no major duplicate top-level subsystem remains on the active path
- gateway/router/strategy overlap is formally closed
- audit/consensus overlap is formally closed
- context/knowledge overlap is formally closed
- merged boundaries are reflected in ownership and integration documentation

#### Rollback Criteria

- each subsystem merge can be reverted independently
- rollback of one merged subsystem does not require reverting all merged subsystems together

> [!TIP]
> **Design highlight:** Independent subsystem rollback là ưu điểm lớn nhất của Federated approach so với big-bang. Khi Gateway merge fail, chỉ revert Gateway — không cần revert Audit/Consensus hay Context/Knowledge cùng lúc.

---

### Phase 4 — Mandatory Physical Consolidation Review

**Goal:** force a governed decision on whether CVF should remain federated physically, partially consolidate, or fully consolidate.

This phase is mandatory because the system must not remain indefinitely in a “facade-only” state without an explicit architectural decision.

#### Work

- compare operational cost of staying federated vs physically consolidating
- evaluate developer ergonomics
- evaluate build/test complexity
- evaluate rollback complexity
- evaluate governance and ownership clarity
- evaluate evidence from Phases 0-3

#### Required Decision Options

1. keep extension-based physical layout
2. partially consolidate selected subsystems
3. fully consolidate into a new physical tree

#### Verification Gate

- a decision packet exists comparing all 3 options
- the packet includes cost, risk, rollback, governance, and ownership implications
- the final decision is justified by evidence, not taste or aesthetics
- the chosen physical posture is explicitly signed off

#### Rollback Criteria

- if the decision is “stay federated”, the federated architecture is declared complete and stable
- if the decision is “partial” or “full” consolidation, a separate implementation roadmap must exist before execution begins

---

## Comparison with Big-Bang Physical Restructure

| Criterion | Big-Bang Physical Restructure | Federated Plane Convergence Rev2 |
|---|---|---|
| Immediate disruption | High | Low |
| Rollback complexity | High | Medium |
| Fit with current repo | Low | High |
| Preservation of extension lineage | Low | High |
| Ability to validate convergence incrementally | Low | High |
| Governance discipline | Medium | High |
| EA recommendation | Conditional at best | Preferred |

---

## Why Revision 2 Is Better

Revision 2 keeps the strongest part of the federated strategy:

- logical convergence before physical collapse

But it removes the two biggest weaknesses of Revision 1:

- it no longer treats the physical-consolidation decision as optional
- it no longer leaves gates underspecified

That makes this version a more serious candidate for final review.

---

## Decision Posture

This roadmap is still a **proposal for review**, not an execution plan.

It should now be compared against:

1. the existing big-bang restructuring roadmap
2. the original federated proposal

The final roadmap should only be selected after side-by-side review.

---

## Recommended Next Step

1. review this revision against the critique
2. decide whether `Revision 2` replaces `Revision 1` as the preferred federated candidate
3. only then compare the preferred federated candidate against the big-bang roadmap for final selection
