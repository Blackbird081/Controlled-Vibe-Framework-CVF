# Scope and Non-Goals

## Purpose
Tài liệu này định nghĩa **phạm vi chính thức (Scope)** và **những điều CVF cố tình KHÔNG làm (Non-Goals)**.

Mục tiêu:
- Ngăn mở rộng scope không kiểm soát
- Tránh hiểu nhầm CVF là agent framework, toolchain, hoặc AI platform
- Bảo vệ tính ổn định lâu dài của CVF

---

## In-Scope (What CVF IS)

CVF tập trung vào **governance và kiểm soát hành vi AI**, không phải năng lực AI.

CVF bao gồm:

- Governance framework cho AI behavior
- Decision gating & approval model
- Capability definition & control
- Skill Contract specification
- Capability lifecycle & versioning
- Registry-based capability resolution
- Auditability & traceability
- Agent-agnostic architecture

CVF trả lời câu hỏi:
> “AI **được phép làm gì**, **khi nào**, và **trong điều kiện nào**?”

---

## Explicit Non-Goals (What CVF Is NOT)

CVF **KHÔNG** nhằm mục đích:

### 1. Agent Framework
- Không định nghĩa agent loop
- Không quản lý memory, planning, reflection
- Không cung cấp reasoning strategy

---

### 2. Tooling Platform
- Không cung cấp tool adapter
- Không quản lý API keys
- Không cung cấp SDK cho tool execution

---

### 3. Prompt Engineering System
- Không chứa prompt library
- Không tối ưu prompt
- Không chuẩn hóa prompt format

---

### 4. Model Management
- Không chọn model
- Không benchmark model
- Không tối ưu inference

---

### 5. Automation Engine
- Không scheduler
- Không workflow engine
- Không auto-chaining

---

### 6. Skill Marketplace
- Không catalog marketplace
- Không rating / discovery engine
- Không dynamic skill loading

---

## Out-of-Scope by Design

Các vấn đề sau **cố tình để ngoài CVF**:

- Performance optimization
- Cost optimization
- UX/UI layer
- Monitoring runtime metrics (ngoài audit)
- Business logic orchestration

Những thứ này **thuộc tầng trên** CVF.

---

## What CVF Enables (Indirectly)

CVF **không trực tiếp làm**, nhưng **cho phép xây dựng**:

- Secure AI systems
- Regulated AI workflows
- Multi-agent systems có kiểm soát
- Long-lived AI governance
- Enterprise-grade AI operations

---

## Scope Boundaries

CVF chỉ hoạt động ở **governance layer**.

Nếu một quyết định liên quan đến:
- “Làm thế nào” → agent / tool
- “Dùng model gì” → platform
- “Tối ưu ra sao” → infrastructure

👉 **Không thuộc CVF**.

---

## Evolution Constraints

Bất kỳ đề xuất nào:
- Làm CVF phụ thuộc agent
- Làm CVF phụ thuộc tool
- Mở auto-execution
- Mở autonomous decision

→ **Vi phạm scope**, không được chấp nhận.

---

## Canonical Status

Tài liệu này là **nguồn chân lý** cho phạm vi của CVF.

Mọi tính năng, extension, hoặc proposal
phải được đối chiếu với file này trước khi được chấp nhận.
```

