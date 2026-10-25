# CVF AUTONOMOUS EXTENSION

Standard Governance Block for Autonomous Skills

> **Version:** 1.0.0  
> **Status:** Active  
> **Purpose:** Enforce governance constraints directly inside each skill file.

---

## 1. Why This Exists

CVF assumes end users do **not** read code.
Therefore the skill itself must carry:

- Risk boundaries
- Authority constraints
- Execution stop conditions
- Validation hooks
- UAT linkage

If these are missing, the skill is **not autonomous-ready**.

---

## 2. Required Block (Template)

Insert the following block inside every CVF skill:

```markdown
## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- Template: [AGENT_AI_UAT_CVF_TEMPLATE](../../../governance/skill-library/uat/AGENT_AI_UAT_CVF_TEMPLATE.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền
```

---

## 3. Enforcement Rule

If a skill is missing this block, it is **not approved** for autonomous execution.
