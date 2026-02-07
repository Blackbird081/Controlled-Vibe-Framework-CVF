# CVF SKILL ↔ RISK ↔ AUTHORITY LINKAGE
Canonical Binding Between Skills and CVF Governance

> **Version:** 1.0.0  
> **Status:** Active  
> **Depends on:** [CVF_RISK_AUTHORITY_MAPPING](./CVF_RISK_AUTHORITY_MAPPING.md)

## 1. Purpose

This document defines how every CVF Skill is bound to:
- Risk Level
- Authority Scope
- Agent Role
- CVF Phase

No skill may exist independently of this linkage.

This linkage precedes:
- Skill intake
- Skill adaptation
- Skill execution

---

## 2. Core Principle

In CVF:
- Skills do NOT have inherent power
- Skills BORROW authority from CVF context

Authority is granted temporarily,
under explicit conditions,
and can always be revoked.

---

## 3. Risk Levels (Canonical)

Each skill MUST be assigned exactly one primary risk level.

### R0 – Informational
- Read-only
- No decision influence
- No side effects

### R1 – Advisory
- Produces suggestions
- No autonomous execution
- Human confirmation required

### R2 – Assisted Execution
- Performs bounded actions
- Explicit invocation only
- Strong preconditions

### R3 – Autonomous Execution
- Executes multi-step actions
- High blast radius
- Requires explicit authorization
- Rare by design

### R4 – Critical / Blocked
- Severe or irreversible damage potential
- Cannot be safely constrained
- Execution BLOCKED by default
- Requires exceptional override process
- Emergency shutdown mandatory

---

## 4. Authority Dimensions

Skill authority is evaluated across four dimensions:

### 4.1 Agent Role
Which agent may invoke the skill:
- Orchestrator
- Architect
- Builder
- Reviewer

### 4.2 CVF Phase
In which phase the skill may operate:
- Discovery
- Design
- Build
- Review

Cross-phase execution is forbidden unless explicitly stated.

### 4.3 Decision Scope
What kind of decision the skill may influence:
- Informational
- Tactical
- Strategic

Strategic influence requires human oversight.

### 4.4 Execution Autonomy
- Never
- Conditional
- Always (discouraged)

---

## 5. Skill Authority Matrix

Every skill MUST define an explicit matrix:

| Dimension | Allowed | Forbidden |
|---------|--------|-----------|
| Agent Role | e.g. Architect | e.g. Builder |
| CVF Phase | e.g. Design | Build, Review |
| Decision Scope | Tactical | Strategic |
| Autonomy | Conditional | Fully autonomous |

Undefined = Forbidden by default.

---

## 6. Risk ↔ Authority Constraints

Risk level enforces hard limits:

### R0
- Any role
- Any phase
- No execution authority

### R1
- Limited roles
- No Build phase execution
- Advisory only

### R2
- Builder / Orchestrator only
- Build phase only
- Mandatory audit hooks

### R3
- Explicit human approval
- Isolated environment
- Continuous monitoring
- Emergency shutdown required

---

## 7. Enforcement Rule

If a skill invocation violates this linkage:
- The system MUST block execution
- The violation is logged as a governance failure
- The skill enters mandatory review

This is not a runtime error.
It is a framework breach.

---

## 8. Design Intent

This linkage exists to ensure:
- Skills never outgrow governance
- Capabilities never outrun responsibility
- CVF remains the single source of authority

Skills may evolve.
CVF authority does not.
