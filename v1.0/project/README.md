PROJECT TEMPLATE (CHUẨN)

# <project-name>

This project is built using the **Controlled Vibe Framework (CVF)**.

CVF enforces a phase-driven, rule-first workflow to ensure
clarity, traceability, and controlled collaboration
between humans and AI agents.

---

## 1. Project Purpose

Briefly describe:
- What problem this project solves
- Who it is for
- What is explicitly OUT of scope

Avoid implementation details.

---

## 2. Framework Used

This project strictly follows:

- Controlled Vibe Framework (CVF) v1.0
- Phase-driven development
- Decision logging
- Standardized commit conventions
- AI behavior constraints

All contributors (human or AI) must comply.

---

## 3. Current Phase Status

Refer to `PHASE_STATUS.md` for authoritative status.

Summary (optional):
- Active Phase: Phase A / B / C / D
- Locked Phases: Listed in PHASE_STATUS.md

---

## 4. How to Start (Mandatory)

Before writing any code:

1. Read:
   - VIBE_RULES.md
   - AI_AGENT_RULES.md
   - COMMIT_CONVENTION.md
   - PROJECT_INIT_CHECKLIST.md

2. Complete all checklist items.
3. Confirm Phase A is OPEN.

No production code is allowed before this.

---

## 5. Decision Policy

- All architectural or irreversible decisions
  MUST be recorded in `DECISIONS.md`
- Decisions without records are considered invalid.

---

## 6. Commit Policy

All commits must follow `COMMIT_CONVENTION.md`.

Non-compliant commits should not be merged.

---

## 7. AI Usage Policy

AI agents:
- Must follow CVF rules
- Must not cross locked phases
- Must not introduce decisions silently

AI output is treated as a suggestion
until validated by project rules.

---

## 8. Notes

This repository prioritizes:
- Thinking over speed
- Control over convenience
- Explicit structure over intuition
