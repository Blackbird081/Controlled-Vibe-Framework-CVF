# CVF_COMMANDS — v1.1
Version: 1.1 | Status: STABLE | Layer: Interface | Compatible: v1.0 baseline (additive)

Purpose: Intent chuẩn hóa cho hành động; mỗi command yêu cầu artifact bắt buộc và binding tới Archetype/Preset/AU.

## Taxonomy
- Governance: CVF:PROPOSE, CVF:DECIDE, CVF:FREEZE
- Design: CVF:DESIGN, CVF:REFINE
- Execution: CVF:EXECUTE
- Audit: CVF:REVIEW, CVF:AUDIT

## Artifact bắt buộc (tóm tắt)
- PROPOSE: proposal, scope boundary, assumptions
- DECIDE: decision statement, rationale, impact scope
- FREEZE: freeze declaration, frozen scope
- DESIGN: design notes, alternatives
- REFINE: before/after diff, no scope expansion
- EXECUTE: Action Unit definition, linked Input/Output spec
- REVIEW: findings, compliance verdict
- AUDIT: audit report, violation list

## Binding chuẩn (v1.1)
- CVF:PROPOSE → Archetype: Exploration/Analysis → Preset: Exploration/Analysis → AU type: Proposal
- CVF:DECIDE → Archetype: Decision → Preset: Decision Policy → AU type: Decision Record
- CVF:DESIGN → Archetype: Planning/Analysis → Preset: Planning/Analysis → AU type: Design Note
- CVF:REFINE → Archetype: Planning/Analysis → Preset: Planning/Analysis → AU type: Refine Note
- CVF:EXECUTE → Archetype: Execution → Preset: Execution Policy → AU type: Execution Task
- CVF:REVIEW → Archetype: Supervisor/Analysis → Preset: Supervisor/Analysis → AU type: Review Record
- CVF:AUDIT → Archetype: Supervisor → Preset: Supervisor Policy → AU type: Audit Record

| Command | Archetype | Preset | AU type | Required artifacts |
| --- | --- | --- | --- | --- |
| CVF:PROPOSE | Exploration / Analysis | Exploration / Analysis | Proposal | Proposal, scope boundary, assumptions |
| CVF:DECIDE | Decision | Decision Policy | Decision Record | Decision statement, rationale, impact scope |
| CVF:DESIGN | Planning / Analysis | Planning / Analysis | Design Note | Design notes, alternatives, constraints |
| CVF:REFINE | Planning / Analysis | Planning / Analysis | Refine Note | Before/after diff, unchanged intent proof |
| CVF:EXECUTE | Execution | Execution Policy | Execution Task | AU definition, INPUT/OUTPUT spec links, trace path |
| CVF:REVIEW | Supervisor / Analysis | Supervisor / Analysis | Review Record | Findings, compliance verdict, accept/reject |
| CVF:AUDIT | Supervisor | Supervisor Policy | Audit Record | Audit report, violation list, follow-up actions |

## Enforcement
Mọi action phải chỉ ra 1 command + 1 archetype + 1 preset + 1 AU, và phải link INPUT/OUTPUT spec khi applicable. Hành động thiếu liên kết được coi là out-of-framework.
