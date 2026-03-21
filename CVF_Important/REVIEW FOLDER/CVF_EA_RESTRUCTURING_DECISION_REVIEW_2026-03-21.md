# Enterprise Architect Decision Review — Whitepaper Section 7 and Restructuring Path
> **Date:** 2026-03-21
> **Reviewer Role:** Independent Enterprise Software Architect
> **Purpose:** Clarify two critical decisions before any CVF restructuring wave is authorized
> **Scope:** `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` Section 7 and the restructuring direction proposed in `CVF_V2_RESTRUCTURING_ROADMAP.md`

---

## Executive Summary

Before CVF is restructured, two decisions must be made correctly:

1. **How Whitepaper Section 7 distinguishes current truth from target-state design**
2. **Whether the restructuring path should be big-bang source-tree replacement or federated convergence over the current extension-based repo**

My conclusion is:

- **Section 7 should not use one umbrella term like `Architecture Invariants` for both present truth and future target-state**
- **The best restructuring default is not big-bang `/src/control_plane` migration**
- **The best restructuring default is a federated, extension-preserving convergence model**

---

## Decision Area 1 — Whitepaper Section 7

### Current issue

The current whitepaper is much cleaner than before, but Section 7 still groups two different kinds of architectural statements under the same top-level frame:

- current frozen truths
- future target-state rules

Reference:

- `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md:246-260`

This creates a semantic problem:

- items `1-4` are **already true in the current system**
- items `5-10` are **not yet true in the current system**

Even with the split into `CURRENT` and `TARGET`, the top-level label `Architecture Invariants` still makes the target items sound stronger than they should be.

### Why this matters

In enterprise architecture, these three concepts must stay separate:

1. **Frozen Invariant**
   - already true
   - currently enforced
   - violating it means violating the present architecture

2. **Migration Guardrail**
   - rule for safe change
   - may not be a present runtime truth
   - applies during transition

3. **Target-State Design Principle**
   - desired end-state constraint
   - not yet guaranteed by current implementation

When these are mixed, downstream documents start to confuse:

- current baseline truth
- transition discipline
- future design intent

That confusion is especially dangerous in CVF because governance posture is already strict and continuation is explicitly gated.

### EA recommendation

Section 7 should be restructured into:

1. **Current Frozen Invariants**
2. **Migration Guardrails**
3. **Target-State Design Principles**

This is the cleanest and most defensible structure because it matches how enterprise programs separate:

- baseline architecture
- transition controls
- target architecture

### Decision

**Approved as the preferred architectural framing.**

---

## Decision Area 2 — Restructuring Path

### Current issue

The current roadmap proposal still assumes early physical restructuring into:

- `/src/control_plane/`
- `/src/execution_plane/`
- `/src/governance/`
- `/src/learning_plane/`
- `/src/shared/`

Reference:

- `CVF_V2_RESTRUCTURING_ROADMAP.md:75-79`

This is not a governance error anymore, because the document is now clearly labeled as a proposal. But from an EA perspective, it is still a strong implementation assumption.

### Why this is risky

The current CVF repo is not a blank monolith. It is an **extension-based platform** with explicit versioned modules under `EXTENSIONS/`, including:

- `CVF_GUARD_CONTRACT`
- `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
- `CVF_v1.6_AGENT_PLATFORM`
- multiple `CVF_ECO_*` and `CVF_v*` modules

That means a big-bang physical move has several risks:

1. **Ownership ambiguity**
   - logical ownership and physical ownership get changed at the same time

2. **Rollback complexity**
   - moving module boundaries and source tree layout together makes rollback harder

3. **Historical traceability loss**
   - versioned extension lineage becomes harder to reason about

4. **Boundary regression risk**
   - a physical merge can accidentally weaken boundaries before contracts are stabilized

5. **High integration blast radius**
   - too many concerns change in the same wave

### Better alternative: Federated Plane Convergence

The cleaner path is:

**keep the extension-based repo physically intact first, and converge it logically into planes**

That means:

- `control`, `execution`, `governance`, and `learning` become **logical plane ownership domains**
- each existing extension is mapped into one or more planes
- shared contracts, import rules, and integration facades are stabilized first
- physical consolidation remains optional and only comes later if justified by evidence

### Why this is the best default path

This path fits CVF better because it:

- preserves current extension lineage
- lowers blast radius
- improves reversibility
- aligns with the repo’s actual structure
- keeps governance and implementation change decoupled
- allows plane convergence to be measured before physical consolidation

### Decision

**Big-bang `/src/...` migration should not be the default restructuring path.**

**Federated Plane Convergence should be the default restructuring strategy.**

---

## Comparative Assessment

| Criterion | Big-Bang `/src/...` Migration | Federated Plane Convergence |
|---|---|---|
| Fit with current repo shape | Low | High |
| Rollback safety | Low | High |
| Boundary clarity during migration | Medium | High |
| Historical traceability | Low | High |
| Governance compatibility | Medium | High |
| Migration complexity | High | Medium |
| EA recommendation | No | Yes |

---

## Final EA Recommendation

### Whitepaper

Do not keep Section 7 as a mixed “invariants” block.

Replace it with:

1. `Current Frozen Invariants`
2. `Migration Guardrails`
3. `Target-State Design Principles`

### Roadmap

Do not treat `/src/control_plane` physical migration as the default first move.

Adopt:

**Federated Plane Convergence**

as the default proposal for the next restructuring wave.

---

## What Should Happen Next

1. Publish a standalone rewrite proposal for Whitepaper Section 7
2. Publish a separate restructuring roadmap proposal based on Federated Plane Convergence
3. Review both side-by-side with the current proposal documents
4. Only then decide which roadmap becomes the final candidate for a future authorized wave
