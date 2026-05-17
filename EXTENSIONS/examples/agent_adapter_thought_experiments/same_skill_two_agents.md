
# Same Skill, Two Agents

## Purpose
Tài liệu này làm rõ cách **một capability (skill)**
có thể được sử dụng bởi **nhiều agent khác nhau**
mà không phá vỡ kiểm soát, audit hoặc governance của CVF.

---

## Core Principle

> **Capabilities are agent-agnostic.  
> Agents are capability consumers.**

---

## Problem Statement

Câu hỏi thường gặp:
- Một skill có thể dùng cho hai agent không?
- Có cần copy skill?
- Có gây xung đột không?

Câu trả lời CVF:
- **Không copy**
- **Không agent-coupled**
- **Không behavior divergence ngầm**

---

## Capability vs Agent

| Capability | Agent |
|-----------|------|
| Định nghĩa quyền | Người sử dụng quyền |
| Versioned | Không version theo capability |
| Risk-scoped | Context-scoped |
| Registry-managed | Runtime-bound |

Agent **không sở hữu** capability.

---

## Correct Model

Một capability:
- Được đăng ký **một lần**
- Có contract rõ ràng
- Có risk cố định

Nhiều agent:
- Gọi capability qua registry
- Bị áp cùng rule
- Bị audit như nhau

---

## Agent Context Binding

Khác biệt giữa agent nằm ở:
- Context truyền vào
- Policy áp thêm
- Approval flow

Không nằm ở:
- Capability logic
- Contract semantics

---

## Execution Flow Example

1. Agent A request capability X
2. Registry resolve X@v1
3. Risk controls enforced
4. Adapter executes

5. Agent B request capability X
6. Registry resolve X@v1
7. Risk controls enforced
8. Adapter executes

→ Không có branching theo agent.

---

## Forbidden Patterns

BỊ CẤM:

- Fork capability theo agent
- Hardcode agent name
- Inject agent-specific prompt
- Conditional logic trong capability

Nếu cần behavior khác:
→ **Capability mới**.

---

## Audit Implications

Audit log phải thể hiện:
- Capability ID
- Version
- Agent ID
- Context snapshot

Agent khác ≠ audit khác.

---

## When to Split Capability

Chỉ tách khi:
- Semantics khác
- Risk khác
- Authority khác

Không tách vì:
- Agent preference
- Style khác
- Prompt khác

---

## Canonical Status

Tài liệu này là **chuẩn duy nhất** cho việc dùng một skill cho nhiều agent trong CVF.

Mọi triển khai khác
→ không CVF-compliant.
```

