# Whitepaper Section 7 Rewrite Proposal
> **Date:** 2026-03-21
> **Purpose:** Clean Enterprise Architect rewrite proposal for Section 7 of `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
> **Status:** Proposal only — for review before any whitepaper revision is accepted

---

## Proposed Replacement for Section 7

## 7. Architectural Truth Layers

This section separates three different architectural statement types:

1. **Current Frozen Invariants**
2. **Migration Guardrails**
3. **Target-State Design Principles**

These categories must never be mixed.

---

### 7.1 Current Frozen Invariants

These are already true in the current codebase and governance posture.

1. **Canonical 5-Phase Loop**
   - `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`

2. **Current Risk Model**
   - `R0 -> R3`

3. **Current Guard Baseline**
   - shared hardened default: `8 guards`
   - full runtime preset: `15 guards`

4. **Continuation Governance**
   - any future expansion or restructuring requires continuation authorization through the current governance process

These are baseline truths, not proposals.

---

### 7.2 Migration Guardrails

These rules are for safe change during a restructuring wave.

1. **Merge before create**
   - prefer merging overlapping capabilities into existing modules instead of introducing duplicate top-level modules

2. **Backward compatibility first**
   - preserve critical compatibility paths during transition

3. **Rollback is mandatory**
   - every restructuring phase must define an explicit rollback path

4. **Learning plane is last**
   - adaptive behavior must not be introduced before the lower layers are stable

5. **Risk-model migration is a separate decision**
   - no migration from `R0-R3` to another risk taxonomy without explicit approval

6. **Boundary strengthening before physical consolidation**
   - contracts, interfaces, and ownership boundaries must stabilize before aggressive source-tree consolidation

These are migration rules, not present runtime invariants.

---

### 7.3 Target-State Design Principles

These are the intended long-term design principles for a future converged platform.

1. **Control Plane does not execute**
   - it produces plans, policies, and authorizations

2. **Execution Plane does not decide policy**
   - it executes within approved boundaries

3. **Agents do not own secrets or durable context**
   - these remain system-governed assets

4. **Agents do not call AI providers directly**
   - provider access is mediated by a governed model gateway

5. **Agents do not access knowledge stores directly**
   - knowledge access flows through governed knowledge interfaces

6. **New architecture should converge through stronger boundaries**
   - the system should become more explicit, more governable, and easier to audit

These are design intentions, not current implementation truths.

---

## Why This Rewrite Is Better

This structure removes the single largest ambiguity in the current section:

- what is already true now
- what governs migration
- what belongs only to the target state

It also makes later architecture review easier because objections can be categorized correctly:

- “This violates a current invariant”
- “This violates a migration guardrail”
- “This conflicts with target-state design”

That is the correct EA-level separation.
