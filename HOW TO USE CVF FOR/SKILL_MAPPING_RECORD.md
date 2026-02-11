Mỗi skill = 1 record
Không có record → skill không tồn tại trong CVF

# SKILL MAPPING RECORD

This document defines the official CVF governance record
for a single skill.

A skill without this record is FORBIDDEN.

---

## 1. SKILL IDENTIFICATION

Skill ID:
Skill Name:
Skill Source:
- [ ] Internal (CVF-owned)
- [ ] External (third-party / community / vendor)

Source Reference:
(link / repo / documentation)

Record Status:
- [ ] Draft
- [ ] Active
- [ ] Deprecated
- [ ] Forbidden

Decision Owner:
Record Created At:
Last Reviewed At:

---

## 2. CAPABILITY DEFINITION

### 2.1 Core Capability (ONE sentence only)

Describe what the skill DOES.
(No marketing, no justification.)

---

### 2.2 Inputs

List all required inputs:
- Type
- Sensitivity (low / medium / high)
- Validation requirements

---

### 2.3 Outputs

List all produced outputs:
- Type
- Persistence (temporary / stored / external)
- Potential downstream impact

---

### 2.4 Execution Model

- [ ] Manual (human-triggered)
- [ ] Assisted (agent + human)
- [ ] Autonomous (agent-only)

Execution Notes:
(limitations, assumptions)

---

## 3. CVF RISK MAPPING

### 3.1 Assigned Risk Level

Primary Risk Level:
- [ ] R0
- [ ] R1
- [ ] R2
- [ ] R3

Justification:
(why this level, not lower)

---

### 3.2 Worst-Case Scenario

Describe the worst realistic failure:
- What breaks?
- Who is affected?
- Can it be reversed?

---

### 3.3 Blast Radius

- [ ] Single file / task
- [ ] Module / workflow
- [ ] Repository-wide
- [ ] External systems / people

---

## 4. AUTHORITY MAPPING

### 4.1 Allowed Agent Roles

This skill may ONLY be used by:
- [ ] Observer
- [ ] Analyst
- [ ] Builder
- [ ] Reviewer
- [ ] Governor

---

### 4.2 Allowed CVF Phases

This skill may ONLY be used in:
- [ ] Intake
- [ ] Design
- [ ] Build
- [ ] Review
- [ ] Freeze

---

### 4.3 Decision Influence Scope

Using this skill may:
- [ ] Provide information only
- [ ] Suggest actions
- [ ] Modify artifacts
- [ ] Trigger workflows
- [ ] Affect external systems

---

## 5. CONSTRAINTS & SAFEGUARDS

Mandatory Constraints:
- (e.g. read-only, no deletion, dry-run only)

Forbidden Actions:
- (explicitly disallowed behaviors)

Human Approval Required:
- [ ] Never
- [ ] Sometimes (specify)
- [ ] Always

---

## 6. CVF FIT DECISION

Final Decision:
- ❌ Reject
- ⚠️ Accept with Restrictions
- ✅ Accept (CVF-Compliant)

Decision Rationale:
(reference CVF rules, not opinions)

---

## 7. UAT & VALIDATION NOTES

Has this skill passed UAT?
- [ ] Yes
- [ ] No
- [ ] Not required

Validation Notes:
(what was tested, what was not)

---

## 8. CHANGELOG

| Date | Change | Decision Owner |
|-----|-------|----------------|
|     |       |                |

---

## 9. FINAL STATEMENT

This skill is governed by CVF.

Any use outside the boundaries defined in this record:
→ Invalidates the output
→ Triggers governance review

End of Skill Mapping Record.

Agent trước khi dùng skill bắt buộc phải nói:

“Using skill <Skill ID>
governed by SKILL_MAPPING_RECORD.md
Allowed Phase: Build
Allowed Risk: R1”

Không nói → vi phạm CVF.