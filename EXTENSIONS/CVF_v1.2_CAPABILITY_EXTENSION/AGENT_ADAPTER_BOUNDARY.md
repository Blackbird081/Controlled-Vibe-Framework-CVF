# Agent Adapter Boundary

## Purpose
Tài liệu này định nghĩa **ranh giới quyền lực và trách nhiệm** giữa
**Controlled Vibe Framework (CVF)** và bất kỳ **Agent / Model / Runtime** nào.

Mục tiêu:
- Ngăn agent chiếm quyền quyết định
- Tránh agent-specific coupling
- Đảm bảo CVF luôn là authority tối cao

---

## Core Principle

> **CVF governs.  
> Agents execute.**

Agent tồn tại để **thực hiện** các quyết định đã được CVF phê duyệt,  
không phải để **tự suy diễn hoặc mở rộng quyền**.

---

## What Is an Agent Adapter

Agent Adapter là:
- Lớp trung gian giữa CVF và agent cụ thể
- Chịu trách nhiệm mapping:
  - CVF intent → agent-compatible format
  - agent output → CVF-auditable output

Agent Adapter **KHÔNG**:
- Định nghĩa governance
- Thay đổi Skill Contract
- Quyết định lifecycle

---

## Authority Hierarchy

Thứ tự quyền lực (từ cao xuống thấp):

1. CVF Core
2. CVF Extensions
3. Skill Contract
4. Skill Registry
5. Agent Adapter
6. Agent / Model

Agent **luôn ở đáy chuỗi quyền lực**.

---

## Hard Boundaries (NON-NEGOTIABLE)

Agent Adapter **KHÔNG ĐƯỢC**:

- Tự chọn capability
- Tự chọn version
- Tự bypass registry
- Tự bypass decision gate
- Tự mở rộng input/output ngoài contract
- Tự chain capability

Vi phạm bất kỳ điều nào → **outside CVF**.

---

## Allowed Responsibilities

Agent Adapter **CHỈ ĐƯỢC**:

- Format input đúng Skill Contract
- Gọi agent đúng execution context
- Thu thập output theo Output Spec
- Ghi audit log
- Báo lỗi trung thực

Không inference thêm logic.

---

## Thought Process Isolation

CVF **KHÔNG**:
- Yêu cầu agent lộ chain-of-thought
- Phụ thuộc vào reasoning nội bộ của agent

Agent Adapter:
- Chỉ xử lý **observable behavior**
- Không dựa vào “ý định suy đoán”

---

## Non-Executable Capabilities

Với capability `NON_EXECUTABLE`:
- Agent Adapter không gọi agent execution
- Chỉ trả về:
  - Validation
  - Assessment
  - Structured output (nếu có)

---

## Error Handling Rules

- Agent error ≠ CVF error
- Mọi failure phải:
  - Gắn capability_id
  - Gắn contract_version
  - Gắn execution_context

Agent Adapter **không được che giấu lỗi**.

---

## Adapter Swappability

Một Agent Adapter phải:
- Có thể thay thế mà không sửa CVF core
- Không mang logic business
- Không giữ state dài hạn

CVF **không phụ thuộc** agent nào cụ thể.

---

## Security Considerations

Agent Adapter:
- Không giữ secret lâu dài
- Không tự quản lý credential ngoài scope được cấp
- Không gọi external tool ngoài contract

---

## Canonical Status

Tài liệu này là **chuẩn ranh giới duy nhất** giữa CVF và agent.

Bất kỳ hệ thống nào cho agent vượt qua ranh giới này
→ **không còn là CVF**.
```



