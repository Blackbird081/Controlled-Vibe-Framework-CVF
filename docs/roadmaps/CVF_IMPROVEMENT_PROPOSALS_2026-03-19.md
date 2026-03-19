# CVF Improvement Proposals — 6 Essential Groups

> **Location:** `docs/roadmaps/CVF_IMPROVEMENT_PROPOSALS_2026-03-19.md`
> **Date:** 2026-03-19
> **Source:** Independent audit of CVF architecture
> **Status:** ✅ Implemented — verified 2026-03-19 (602 tests PASS)

---

## Overview

After comprehensive analysis, CVF's gaps concentrate in **6 essential groups**. These improvements target the **control layer tightness**, not architecture or concepts — which are already strong.

---

## Group 1 — State Machine Definition

**Problem:** Workflow has state machine structure but some transitions are incomplete:

- `Implementation → Review → Implementation` (fix bug loop) not explicit
- Failure states not fully defined: `Review failed`, `Spec conflict`, `Architecture mismatch`
- Without clear transitions for these cases, workflow can deadlock or run wrong direction

**Proposal:**

Define formal state machine for the entire framework:

| Element | Requirement |
|---------|-------------|
| States | All phases explicitly enumerated |
| Transitions | All valid transitions with conditions |
| Failure states | `review_failed`, `spec_conflict`, `architecture_mismatch` |
| Recovery states | `retry`, `rollback`, `human_intervention`, `spec_refinement` |

**Rule:** AI agent must not create new transitions. This makes workflow a **deterministic engineering pipeline**.

---

## Group 2 — Runtime Enforcement of Guards

**Problem:** CVF has many good guards (phase guard, spec binding, task scope, review gate, human checkpoint), but enforcement is at guideline level. If agent can modify spec, architecture, and code freely, guards are conventions only.

**Proposal:**

Define **agent permission model**:

| Agent | Permissions |
|-------|------------|
| Architect | Modify architecture |
| Developer | Modify code |
| Reviewer | Read-only code |
| Tester | Read-only architecture |

Guards enforced by: file scope, action scope, phase scope.

---

## Group 3 — Self-Review Verification

**Problem:** AI self-review has limitations: tendency to confirm own output, heavy reliance on LLM reasoning, weak rule-based validation.

**Proposal:**

Self-review must become **checklist validation**, not reasoning:

- ✔ State machine defined
- ✔ Transitions complete
- ✔ No unreachable states
- ✔ No deadlocks
- ✔ Code paths covered
- ✔ Architecture compliance verified
- ✔ Dependencies valid

This makes review **verifiable validation**, not AI opinion.

---

## Group 4 — Context Management

**Problem:** AI depends on context window. Large projects (spec + architecture + code) can overflow LLM capacity, causing AI to lose spec understanding and generate drifted code.

**Proposal:**

Define context management strategy:

- Agent receives only context necessary for current task
- Context includes: task spec, relevant module, architecture fragment
- NOT the entire project
- This keeps agent stable when project scales

---

## Group 5 — Specification Validation

**Problem:** CVF relies heavily on spec-driven development, but specs can have issues: missing, contradictory, or logically flawed. If spec is wrong, entire downstream pipeline is wrong.

**Proposal:**

Specification needs its own validation layer:

| Check | Description |
|-------|-------------|
| Spec review | Independent review of spec quality |
| Consistency check | No contradictions between spec sections |
| Completeness check | All required fields present |
| Logic validation | Business logic makes sense |

This ensures spec becomes a **reliable source of truth**.

---

## Group 6 — Failure Handling & Traceability

**Problem:** Framework describes normal workflow well but doesn't clarify what happens on failure: wrong code, multiple review failures, spec conflicts, inconsistent output.

**Proposal:**

Define failure handling strategy:

| Mechanism | Description |
|-----------|-------------|
| Retry limit | Maximum retry attempts per phase |
| Rollback | Return to last known good state |
| Human intervention | Escalation trigger conditions |
| Spec refinement | When to revise spec vs retry |
| Agent decision log | Every action traceable |
| Code change history | Full change audit trail |
| Review result history | All review outcomes recorded |

---

## Priority Matrix

| Group | Impact | Effort | Priority | Status |
|-------|--------|--------|----------|--------|
| 1. State Machine | Very High | Medium | P0 | ✅ Done |
| 2. Guard Enforcement | Very High | High | P0 | ✅ Done |
| 6. Failure Handling | High | Medium | P1 | ✅ Done |
| 3. Self-Review | High | Low | P1 | ✅ Done |
| 5. Spec Validation | Medium | Medium | P2 | ✅ Done |
| 4. Context Management | Medium | High | P2 | ✅ Done |

---

## Expected Outcome

After completing these 6 groups, CVF can achieve:

- **4/5 failure scenarios at ⭐⭐⭐⭐⭐ level**
- **1/5 scenario (spec error) at ⭐⭐⭐⭐ maximum** (physical limit of spec-driven systems)
- Pipeline becomes **near-deterministic AI development**
- Framework becomes **reliable governance standard** without changing core architecture
