# SKILL MAPPING RECORD — Copywriting Evaluation

> **Skill ID:** copywriting_evaluation  
> **Domain:** Marketing & SEO  
> **Generated:** 2026-02-07

---

## 1. Skill Identity

- Skill ID: copywriting_evaluation
- Skill Name: Copywriting Evaluation
- Version: 1.0.1
- Source:
  - URL / Repository: Internal CVF
  - Original Author: External / Unknown
- Intake Date: 2026-02-07
- Intake Owner: CVF Governance

---

## 2. Capability Summary

### 2.1 Core Capability
Copywriting Evaluation theo chuẩn CVF, tạo output có cấu trúc và giới hạn phạm vi.

### 2.2 Inputs
- Input types: Copy Text, Loại Copy, Target Audience, Mục tiêu CTA, Tone of Voice, Sản phẩm/Dịch vụ
- Required data sensitivity level: Internal

### 2.3 Outputs
- Output types: Structured markdown
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
Risk level R1 phù hợp với domain Marketing & SEO và được ràng buộc bởi governance summary.

### 3.3 Failure Scenarios
- Primary failure mode: Output vượt scope / thiếu kiểm soát
- Secondary failure modes: Thiếu input hoặc diễn giải sai context

### 3.4 Blast Radius Assessment
- Scope of impact: Limited
- Reversibility: Easy
- Data exposure risk: Internal

---

## 4. Authority Mapping
(Refer to CVF_SKILL_RISK_AUTHORITY_LINK.md)

### 4.1 Allowed Agent Roles
- ☑ Orchestrator
- ☐ Architect
- ☐ Builder
- ☑ Reviewer

### 4.2 Allowed CVF Phases
- ☑ Discovery
- ☑ Design
- ☐ Build
- ☐ Review

### 4.3 Decision Scope Influence
- ☐ Informational
- ☑ Tactical
- ☐ Strategic (requires human oversight)

### 4.4 Autonomy Constraints
- Invocation conditions: Auto + Audit
- Explicit prohibitions: Không vượt scope, không tự hành động ngoài yêu cầu

Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☑ No adaptation required
- ☐ Capability narrowing required
- ☐ Execution sandboxing required
- ☐ Additional audit hooks required

Describe required adaptations clearly.

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
- Normal operation: Happy path theo form input
- Boundary condition: Thiếu hoặc sai input bắt buộc
- Failure handling: Output vượt scope hoặc thiếu validation

### 6.2 Output Validation
- Acceptance criteria: Output đúng cấu trúc, bám scope, có next steps
- Rejection conditions: Không tuân thủ constraints hoặc output mơ hồ

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ Accept with Restrictions
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
Mapped into CVF governance with autonomous constraints enforced.

### 7.3 Decision Authority
- Name / Role: CVF Governance
- Date: 2026-02-07
- Signature (if applicable):

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
- Review interval: 6 months
- Next review date: 2026-08-06

### 8.2 Deprecation Conditions
Nếu skill bị thay đổi scope hoặc vi phạm governance → deprecate.

---

## 9. Audit References

- Related CVF documents: CVF_RISK_AUTHORITY_MAPPING, CVF_AUTONOMOUS_EXTENSION
- Change log entries: -
- Incident references (if any): -

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:
- The skill is bound to CVF governance
- Its risks are understood and accepted
- Its authority is explicitly constrained

Unrecorded usage of this skill constitutes a CVF violation.
