# SKILL MAPPING RECORD — CVF Web UX Redesign System

> **Skill ID:** cvf_web_ux_redesign_system  
> **Domain:** Product & UX  
> **Generated:** 2026-04-20

---

## 1. Skill Identity

- Skill ID: cvf_web_ux_redesign_system
- Skill Name: CVF Web UX Redesign System
- Version: 1.0.0
- Source:
  - URL / Repository: Controlled-Vibe-Framework-CVF
  - Original Author: CVF internal redesign synthesis
- Intake Date: 2026-04-20
- Intake Owner: CVF Governance

---

## 2. Capability Summary

### 2.1 Core Capability
Chuyển một lần redesign UX thành hệ thống rule/spec tái sử dụng cho các web build sau này, bao gồm visual DNA, layout system, component language, và implementation guardrails.

### 2.2 Inputs
- Input types: project surface, user roles, core flows, page list, must-preserve logic, visual direction
- Required data sensitivity level: Internal

### 2.3 Outputs
- Output types: Structured markdown UX system specification
- Output persistence (ephemeral / logged / stored): Logged

### 2.4 Execution Model
- Invocation: Agent-invoked
- Execution: Sync
- Autonomy level: Conditional

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☑ R1 – Advisory (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☐ R3 – Autonomous Execution (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
Skill này tạo ra design/spec guidance chứ không trực tiếp thay đổi runtime. Rủi ro chính nằm ở việc drift khỏi logic hoặc brand nếu thiếu preservation guard, nên R1 là phù hợp.

### 3.3 Failure Scenarios
- Primary failure mode: Redesign spec vượt scope presentation và lấn sang logic/runtime
- Secondary failure modes: Output quá cảm tính, thiếu rule cụ thể, hoặc reuse style không phù hợp ngữ cảnh mới

### 3.4 Blast Radius Assessment
- Scope of impact: Limited to design direction and implementation guidance
- Reversibility: Easy
- Data exposure risk: Internal

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☑ Orchestrator
- ☐ Architect
- ☑ Builder
- ☑ Reviewer

### 4.2 Allowed CVF Phases
- ☑ Discovery
- ☑ Design
- ☑ Build
- ☑ Review

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ Tactical
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
- Invocation conditions: Auto + Audit
- Explicit prohibitions: Không được ngầm đổi route, API, auth, state, hoặc data flow khi input chỉ yêu cầu UX/presentation

Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ Capability narrowing required
- ☐ Execution sandboxing required
- ☑ Additional audit hooks required

Required adaptations:
- Luôn buộc khai báo `Must Preserve`
- Luôn tách rõ design decision và implementation guardrail
- Luôn có responsive/a11y/state behavior rules

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
- Normal operation: Tạo reusable UX system spec từ một redesign brief hoàn chỉnh
- Boundary condition: Thiếu preservation constraints hoặc page inventory
- Failure handling: User yêu cầu đổi cả runtime/logic dưới vỏ bọc redesign

### 6.2 Output Validation
- Acceptance criteria: Có design DNA, component rules, surface blueprint, preservation guard, QA checklist
- Rejection conditions: Output generic, không actionable, hoặc trộn lẫn UX với logic changes

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ Accept with Restrictions
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
Skill có giá trị tái sử dụng cao cho web redesign và an toàn nếu giữ chặt preservation guard. Front-door posture nên ở mức review-required tại thời điểm intake.

### 7.3 Decision Authority
- Name / Role: CVF Governance
- Date: 2026-04-20
- Signature (if applicable):

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
- Review interval: 6 months
- Next review date: 2026-10-20

### 8.2 Deprecation Conditions
Nếu design DNA của CVF đổi lớn, hoặc skill nhiều lần dẫn tới spec drift / ambiguous delivery, phải rescreen và cập nhật.

---

## 9. Audit References

- Related CVF documents: CVF_CORPUS_RESCREEN_D2_MATRIX_2026-04-15.md, CVF_APP_REDESIGN_ROADMAP_V2_SYNTHESIZED_2026-04-19.md
- Change log entries: -
- Incident references (if any): -

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:
- The skill is bound to CVF governance
- Its risks are understood and accepted
- Its authority is explicitly constrained

Unrecorded usage of this skill constitutes a CVF violation.
