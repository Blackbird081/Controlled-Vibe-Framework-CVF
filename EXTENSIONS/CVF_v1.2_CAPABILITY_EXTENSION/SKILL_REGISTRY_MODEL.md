# Skill Registry Model

## Purpose
Tài liệu này định nghĩa **mô hình registry chính thức** cho các skill và capability
trong Controlled Vibe Framework (CVF).

Registry là:
- Điểm tra cứu
- Điểm kiểm soát
- Điểm quyết định cuối trước execution

---

## Core Principle

> **Registry does not store skills.  
> Registry authorizes capability execution.**

---

## Registry Responsibilities

Registry **PHẢI**:

- Resolve capability ID & version
- Enforce lifecycle state
- Expose risk metadata
- Gate execution eligibility
- Support audit trace

Registry **KHÔNG**:

- Lưu implementation
- Gọi external system
- Chứa agent logic

---

## Registry Object Model

Mỗi registry entry đại diện cho **một capability version**.

### Required Fields

- Capability ID
- Version
- Lifecycle State
- Risk Level
- Required Controls
- Adapter Reference
- Contract Reference

Không đủ field
→ entry không hợp lệ.

---

## Lifecycle States

Registry hỗ trợ các trạng thái:

- `ACTIVE` — cho phép execution
- `DEPRECATED` — cho phép nhưng cảnh báo
- `RETIRED` — không execution, chỉ audit

Registry **KHÔNG** tự động chuyển trạng thái.

---

## Version Resolution Rules

- Resolution dựa trên:
  - Explicit version
  - Context constraints
- Không có:
  - Auto-upgrade
  - Silent fallback
- Version mismatch → error rõ ràng

---

## Risk Enforcement

Registry phải:
- Check risk level
- Verify control readiness
- Reject nếu control thiếu

Registry không được:
- Hạ risk
- Override assessment

---

## Adapter Binding

- Registry chỉ trỏ tới adapter
- Adapter chịu trách nhiệm execution
- Registry không biết logic bên trong

Adapter không hợp lệ
→ execution bị từ chối.

---

## Contract Binding

- Capability gắn với contract version
- Contract thay đổi → capability version mới
- Registry không map chéo contract

---

## Execution Flow

1. Request capability
2. Resolve registry entry
3. Check lifecycle state
4. Validate risk controls
5. Return execution handle

Registry **không thực thi** capability.

---

## Failure Modes

Registry phải fail khi:

- Capability không tồn tại
- Version không hợp lệ
- Lifecycle không cho phép
- Risk control thiếu

Fail phải:
- Deterministic
- Traceable

---

## Audit & Trace

Registry phải log:

- Capability ID
- Version
- Resolution outcome
- Risk checks
- Adapter reference

Không log → coi như execution không hợp lệ.

---

## Forbidden Behavior

BỊ CẤM:

- Hidden redirect
- Dynamic remap
- Auto enable deprecated
- Agent-specific branching

---

## Canonical Status

Tài liệu này là **nguồn chân lý duy nhất** cho mô hình registry trong CVF.

Registry vi phạm tài liệu này
→ không phải CVF-compliant.
```

