# SKILL MAPPING RECORD

This document defines the official CVF governance record
for a single skill.

---

## 1. SKILL IDENTIFICATION

Skill ID: CVF_CORE_SKILL_PREFLIGHT_GOVERNANCE
Skill Name: CVF Core - Skill Preflight Governance
Skill Source:
- [x] Internal (CVF-owned)
- [ ] External (third-party / community / vendor)

Source Reference:
- governance/toolkit/03_CONTROL/SKILL_PREFLIGHT_RECORD.md
- governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md

Record Status:
- [ ] Draft
- [x] Active
- [ ] Deprecated
- [ ] Forbidden

Decision Owner: CVF Governance
Record Created At: 2026-03-01
Last Reviewed At: 2026-03-01

---

## 2. CAPABILITY DEFINITION

### 2.1 Core Capability (ONE sentence only)

Standardize and enforce pre-code skill checks before Build/Execute actions.

---

### 2.2 Inputs

- Intended action summary
- Current phase/role/risk declaration
- Candidate skill IDs
- Mapping record references

---

### 2.3 Outputs

- Skill preflight decision (PASS/FAIL)
- Mandatory declaration text
- Trace link for audit

---

### 2.4 Execution Model

- [ ] Manual (human-triggered)
- [x] Assisted (agent + human)
- [ ] Autonomous (agent-only)

Execution Notes:
- Must be completed before any artifact modification.

---

## 3. CVF RISK MAPPING

### 3.1 Assigned Risk Level

Primary Risk Level:
- [ ] R0
- [x] R1
- [ ] R2
- [ ] R3

Justification:
- Governance documentation and gate control, reversible at repository level.

---

### 3.2 Worst-Case Scenario

- Wrong preflight decision allows non-compliant execution.
- Affects governance trace quality and audit reliability.
- Reversible by rollback and corrected records.

---

### 3.3 Blast Radius

- [ ] Single file / task
- [x] Module / workflow
- [x] Repository-wide
- [ ] External systems / people

---

## 4. AUTHORITY MAPPING

### 4.1 Allowed Agent Roles

This skill may ONLY be used by:
- [ ] Observer
- [x] Analyst
- [x] Builder
- [x] Reviewer
- [x] Governor

---

### 4.2 Allowed CVF Phases

This skill may ONLY be used in:
- [ ] Intake
- [x] Design
- [x] Build
- [x] Review
- [ ] Freeze

---

### 4.3 Decision Influence Scope

Using this skill may:
- [x] Provide information only
- [x] Suggest actions
- [x] Modify artifacts
- [ ] Trigger workflows
- [ ] Affect external systems

---

## 5. CONSTRAINTS & SAFEGUARDS

Mandatory Constraints:
- No coding before preflight PASS.
- Must cite mapping record path for each declared skill.

Forbidden Actions:
- Declaring undeclared skills after coding starts.
- Marking PASS when phase/risk compatibility is unknown.

Human Approval Required:
- [x] Never
- [ ] Sometimes (specify)
- [ ] Always

---

## 6. CVF FIT DECISION

Final Decision:
- ❌ Reject
- ⚠️ Accept with Restrictions
- ✅ Accept (CVF-Compliant)

Decision Rationale:
- Required to enforce the framework-level Skill Preflight rule consistently.

---

## 7. UAT & VALIDATION NOTES

Has this skill passed UAT?
- [x] Yes
- [ ] No
- [ ] Not required

Validation Notes:
- Covered by missing Skill Preflight refusal test in Agent UAT suite.

---

## 8. CHANGELOG

| Date | Change | Decision Owner |
|---|---|---|
| 2026-03-01 | Initial active record | CVF Governance |

---

## 9. FINAL STATEMENT

This skill is governed by CVF.

Any use outside the boundaries defined in this record:
-> Invalidates the output
-> Triggers governance review

End of Skill Mapping Record.
