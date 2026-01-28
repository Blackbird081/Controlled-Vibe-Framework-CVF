# Skill Registry Security Model — Example

## Purpose
Tài liệu này mô tả **các nguyên tắc và cơ chế bảo mật**
áp dụng cho Skill Registry trong Controlled Vibe Framework (CVF).

Mục tiêu:
- Ngăn registry bị lạm dụng như điểm leo thang quyền lực
- Bảo vệ registry khỏi injection, spoofing và silent override
- Đảm bảo mọi quyết định đều traceable và audit được

---

## Core Principle

> **Registry is a security boundary, not a convenience layer.**

Registry tồn tại để **ngăn sai**, không phải để làm mọi thứ dễ hơn.

---

## Threat Model

Registry phải giả định:

- Agent có thể bị compromised
- Adapter có thể bị lỗi
- External input luôn không đáng tin

Registry **KHÔNG BAO GIỜ** tin runtime context.

---

## Protected Assets

Registry bảo vệ:

- Capability identity
- Version integrity
- Risk classification
- Lifecycle state
- Adapter bindings

Mất bất kỳ yếu tố nào
→ mất kiểm soát hệ thống.

---

## Authentication & Identity

- Registry chỉ chấp nhận request từ runtime hợp lệ
- Agent identity phải:
  - Explicit
  - Non-spoofable
  - Logged

Registry không chấp nhận anonymous resolution.

---

## Authorization Rules

Registry phải kiểm tra:

- Agent permission scope
- Capability eligibility
- Risk clearance level

Không có implicit allow.
Không có default grant.

---

## Version Integrity Protection

Registry phải:

- Reject version override
- Reject fuzzy matching
- Reject dynamic remapping

Chỉ version explicit mới được resolve.

---

## Lifecycle State Enforcement

Registry phải hard-enforce:

- ACTIVE → allow
- DEPRECATED → allow + warn
- RETIRED → deny

Không có runtime bypass.

---

## Risk Control Enforcement

Registry phải verify:

- Required controls tồn tại
- Approval state hợp lệ
- Escalation rules được tuân thủ

Thiếu control → deny.

---

## Anti-Tampering Measures

Registry phải chống:

- Registry poisoning
- Capability shadowing
- Adapter substitution
- Time-of-check / time-of-use attacks

Mọi thay đổi registry:
- Immutable log
- Signed
- Reviewable

---

## Injection Prevention

Registry không xử lý:

- Prompt
- Script
- Executable payload

Registry chỉ xử lý metadata có schema cứng.

---

## Failure Behavior

Khi có lỗi:
- Fail closed
- Không fallback
- Không silent retry

Error phải rõ ràng và log đầy đủ.

---

## Audit & Monitoring

Registry phải log:

- Caller identity
- Requested capability + version
- Authorization decision
- Denial reason (nếu có)

Log phải:
- Append-only
- Immutable
- Tamper-evident

---

## Forbidden Practices

BỊ CẤM:

- Auto-approval
- Dynamic privilege escalation
- Agent-specific exceptions
- Hidden allowlists

---

## Example Attack Scenarios

### Attack: Agent attempts to resolve deprecated capability
→ Registry returns warning + logs attempt

### Attack: Agent attempts to resolve retired capability
→ Registry denies + escalates audit

### Attack: Adapter swapped at runtime
→ Registry detects mismatch → deny

---

## Canonical Status

Tài liệu này là **ví dụ chuẩn** cho lớp bảo mật registry trong CVF v1.2.

Mọi triển khai registry không tuân theo
→ **không an toàn**.
```

