# DECISIONS - XD_App

## D-001 (2026-03-01)
- Decision: Adopt mandatory Skill Preflight before any Build/Execute action that modifies XD_App artifacts.
- Reason: Align project execution with CVF governance update that closes the "skill check exists but is skipped in real delivery" gap.
- Impact: No new Build work may start without a preflight PASS record.

## D-002 (2026-03-01)
- Decision: Use `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md` as the project trace file for pre-code skill checks.
- Reason: Keep execution evidence local to project docs for audit and root-cause analysis.
- Impact: Phase B -> C readiness and Phase C execution notes must reference the preflight record.
