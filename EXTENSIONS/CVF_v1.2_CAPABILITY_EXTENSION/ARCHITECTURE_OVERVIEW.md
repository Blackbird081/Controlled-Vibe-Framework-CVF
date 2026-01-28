# Architecture Overview

## Purpose
Tài liệu này mô tả **kiến trúc tổng thể** của Controlled Vibe Framework (CVF) v1.2,
với trọng tâm là **governance-first architecture** và **agent-agnostic design**.

Mục tiêu:
- Giải thích CVF hoạt động như thế nào ở mức kiến trúc
- Làm rõ luồng quyền lực và dữ liệu
- Tránh hiểu CVF là agent framework hoặc execution engine

---

## Architectural Philosophy

CVF được thiết kế dựa trên nguyên tắc:

> **Control before capability.  
> Governance before execution.**

CVF không tối ưu cho tốc độ hay tự động hóa,
mà tối ưu cho **kiểm soát, trách nhiệm và auditability**.

---

## High-Level Architecture

```

+---------------------------+
|        CVF Core           |
|  (Governance & Authority) |
+-------------+-------------+
|
v
+---------------------------+
|     CVF Extensions        |
| (Capability / Governance) |
+-------------+-------------+
|
v
+---------------------------+
|     Skill Contracts       |
| (Behavior Specification) |
+-------------+-------------+
|
v
+---------------------------+
|     Skill Registry        |
| (Resolution & Gating)    |
+-------------+-------------+
|
v
+---------------------------+
|     Agent Adapter         |
| (Translation Layer)      |
+-------------+-------------+
|
v
+---------------------------+
|     Agent / Model         |
| (Execution Only)         |
+---------------------------+

```

---

## Core Components

### 1. CVF Core
CVF Core định nghĩa:
- Phase model
- Decision model
- Authority hierarchy
- Audit principles

CVF Core **không thay đổi** theo extension.

---

### 2. CVF Extensions
Extensions mở rộng CVF theo **chiều sâu**, không theo chiều rộng.

Ví dụ:
- Capability governance (v1.2)
- Risk models
- Lifecycle policies

Extension **không được phá core**.

---

### 3. Skill Contract
Skill Contract là:
- Mô tả hành vi capability
- Ràng buộc governance
- Chuẩn audit

Skill Contract:
- Không phải code
- Không phải prompt
- Không phải tool config

---

### 4. Skill Registry
Skill Registry:
- Kiểm tra điều kiện sử dụng capability
- Resolve contract phù hợp
- Áp dụng deny-first policy

Registry **không thực thi**.

---

### 5. Agent Adapter
Agent Adapter là lớp:
- Chuyển intent thành format agent hiểu
- Thu output theo spec
- Không có quyền quyết định

Agent Adapter **có thể thay thế**.

---

### 6. Agent / Model
Agent hoặc model:
- Chỉ thực hiện yêu cầu đã được phê duyệt
- Không có quyền governance
- Không biết toàn bộ hệ thống

---

## Data Flow vs Authority Flow

### Authority Flow (Top-down)
```

CVF Core → Extension → Contract → Registry → Adapter → Agent

```

### Data Flow (Bottom-up)
```

Agent → Adapter → Registry → CVF Audit Log

```

Quyền lực và dữ liệu **đi ngược chiều nhau**.

---

## Execution Model

CVF sử dụng **explicit execution model**:

- Không auto-execution
- Không hidden chaining
- Không autonomous decision

Mọi execution:
- Phải được quyết định trước
- Phải audit được
- Phải trace được

---

## Non-Executable Capabilities

CVF hỗ trợ capability **không thực thi**:
- Analysis
- Review
- Validation

Chúng tuân theo cùng kiến trúc,
nhưng dừng trước Agent Adapter.

---

## Isolation & Decoupling

CVF được thiết kế để:
- Thay agent không ảnh hưởng governance
- Thay model không ảnh hưởng contract
- Thay tool không ảnh hưởng registry

---

## Architectural Guarantees

Kiến trúc CVF đảm bảo:
- No agent dominance
- No silent behavior change
- No hidden execution
- Full accountability

---

## Canonical Status

Tài liệu này là **mô tả kiến trúc chính thức** của CVF v1.2.

Mọi triển khai CVF phải tuân thủ kiến trúc này
mới được coi là **CVF-compliant**.
```

