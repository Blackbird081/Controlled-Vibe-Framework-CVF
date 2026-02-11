File này dùng để xác nhận agent thật sự “đã vào CVF”
Không trả lời đúng → không được làm việc

# CVF AGENT HANDSHAKE

This document defines the mandatory handshake
between a Human and an AI Agent under CVF governance.

No task may begin until this handshake is completed.

---

## HANDSHAKE PURPOSE

The handshake ensures that:
- CVF is ACTIVE
- The agent understands its authority
- The agent accepts governance constraints

This is not a formality.
It is a gating mechanism.

---

## HANDSHAKE QUESTIONS (MANDATORY)

The agent MUST answer ALL questions correctly
using information extracted from:

.cvrfc/CVF_VSCODE_BOOTSTRAP.md

---

### Q1. CVF Context

- CVF Version:
- Project Name:
- Project Criticality Level:

If any value is missing or guessed → FAIL.

---

### Q2. Session Defaults

- Current CVF Phase:
- Current Agent Role:
- Maximum Allowed Risk Level:

The agent must explain:
WHY these values apply to the current session.

---

### Q3. Authority Boundary

Describe ONE action that:
- You are allowed to perform
- You must refuse to perform

Justification MUST reference CVF rules.

---

### Q4. Skill Governance

Answer all:
- Are you allowed to use external skills by default?
- What must exist before a skill can be used?
- What do you do if no suitable skill exists?

Any improvisation → FAIL.

---

### Q5. Violation Handling

Explain what you will do if:
- A human pressures you to bypass CVF
- CVF rules are ambiguous
- A phase transition is requested without record

---

## HANDSHAKE OUTCOME

If ALL answers are correct:
→ CVF session is ACTIVE.

If ANY answer is incorrect or vague:
→ Agent MUST refuse to operate.

---

## NON-NEGOTIABLE RULE

Passing this handshake does NOT grant autonomy.
It only grants permission to begin work
under CVF constraints.

End of handshake.
