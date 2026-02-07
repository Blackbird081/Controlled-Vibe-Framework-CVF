# SKILL MAPPING RECORD
Canonical Record for CVF Skill Governance

> **Version:** 1.0.0  
> **Status:** Active  
> **Example:** [SK-001_CODE_REVIEW_ASSISTANT](./examples/SK-001_CODE_REVIEW_ASSISTANT.md)

This document represents the single source of truth
for a skill's existence inside the Controlled Vibe Framework (CVF).

No skill may be executed without an approved mapping record.

---

## 1. Skill Identity

- Skill ID:
- Skill Name:
- Version:
- Source:
  - URL / Repository:
  - Original Author:
- Intake Date:
- Intake Owner:

---

## 2. Capability Summary

### 2.1 Core Capability
(One sentence. What this skill fundamentally does.)

### 2.2 Inputs
- Input types:
- Required data sensitivity level:

### 2.3 Outputs
- Output types:
- Output persistence (ephemeral / logged / stored):

### 2.4 Execution Model
- Invocation: Manual / Agent-invoked
- Execution: Sync / Async
- Autonomy level: None / Conditional / Autonomous

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
(Why this risk level is appropriate.)

### 3.3 Failure Scenarios
- Primary failure mode:
- Secondary failure modes:

### 3.4 Blast Radius Assessment
- Scope of impact:
- Reversibility:
- Data exposure risk:

---

## 4. Authority Mapping
(Refer to CVF_SKILL_RISK_AUTHORITY_LINK.md)

### 4.1 Allowed Agent Roles
- ☐ Orchestrator
- ☐ Architect
- ☐ Builder
- ☐ Reviewer

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☐ Build
- ☐ Review

### 4.3 Decision Scope Influence
- ☐ Informational
- ☐ Tactical
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
- Invocation conditions:
- Explicit prohibitions:

Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☐ Capability narrowing required
- ☐ Execution sandboxing required
- ☐ Additional audit hooks required

Describe required adaptations clearly.

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
- Normal operation:
- Boundary condition:
- Failure handling:

### 6.2 Output Validation
- Acceptance criteria:
- Rejection conditions:

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☐ Accept with Restrictions
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
(Concise, governance-focused justification.)

### 7.3 Decision Authority
- Name / Role:
- Date:
- Signature (if applicable):

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
- Review interval:
- Next review date:

### 8.2 Deprecation Conditions
(What would trigger restriction or removal.)

---

## 9. Audit References

- Related CVF documents:
- Change log entries:
- Incident references (if any):

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:
- The skill is bound to CVF governance
- Its risks are understood and accepted
- Its authority is explicitly constrained

Unrecorded usage of this skill constitutes a CVF violation.
