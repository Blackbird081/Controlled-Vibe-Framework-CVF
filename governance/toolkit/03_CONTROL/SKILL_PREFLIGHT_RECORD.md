# SKILL PREFLIGHT RECORD

This record is mandatory before any Build/Execute action
that creates, edits, deletes, or publishes artifacts.

No preflight record -> Build/Execute is out-of-framework.

---

## 1. RECORD METADATA

Record ID:
Project:
Repository Path:
CVF Version:
Date (YYYY-MM-DD):
Prepared By:
Decision Owner:

---

## 2. EXECUTION CONTEXT

Current Phase:
- [ ] Intake
- [ ] Design
- [ ] Build
- [ ] Review
- [ ] Freeze

Current Role:
- [ ] Observer
- [ ] Analyst
- [ ] Builder
- [ ] Reviewer
- [ ] Governor

Active Risk Level:
- [ ] R0
- [ ] R1
- [ ] R2
- [ ] R3

Command:
- [ ] CVF:EXECUTE
- [ ] Other: ____________

Action Summary (ONE sentence):

Planned Artifact Changes:
- Files/paths:
- Change type: (create/update/delete)

---

## 3. SKILL SELECTION

List every skill intended for this action:

| Skill ID | Skill Name | Mapping Record Path | Allowed in Current Phase? | Allowed for Current Risk? | Status |
|---|---|---|---|---|---|
| | | | [ ] Yes [ ] No | [ ] Yes [ ] No | [ ] PASS [ ] FAIL |
| | | | [ ] Yes [ ] No | [ ] Yes [ ] No | [ ] PASS [ ] FAIL |

Rules:
- Every skill must have an existing mapping record.
- Any "No" in phase/risk compatibility -> FAIL.
- FAIL means do not start Build/Execute.

---

## 4. NO-SKILL HANDLING (IF APPLICABLE)

If no suitable skill exists:
- [ ] Build/Execute STOPPED
- [ ] Intake/Escalation record created

Reference:
(link/path to intake request or decision)

---

## 5. PREFLIGHT DECISION

Preflight Result:
- [ ] PASS (execution allowed)
- [ ] FAIL (execution blocked)

Blocking Reason (required if FAIL):

Required Follow-up:
- [ ] Add/approve skill mapping
- [ ] Adjust phase or risk
- [ ] Escalate to Architect/Governor
- [ ] Other: ____________

---

## 6. MANDATORY DECLARATION TEXT

The agent must declare before coding:

"Skill Preflight PASS.
Using skill(s): <Skill ID list>.
Mapped record(s): <path list>.
Phase: <phase>. Risk: <risk>.
Execution allowed under CVF."

---

## 7. EXECUTION TRACE LINK

Trace Path:
(where execution log and resulting artifacts are recorded)

Post-Execution Validation:
- [ ] Output stayed within declared skills
- [ ] No undeclared skill was used
- [ ] Deviations logged

---

## 8. CHANGELOG

| Date | Change | Owner |
|---|---|---|
| 2026-03-01 | Initial template created | CVF Governance |

---

End of Skill Preflight Record.
