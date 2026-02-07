# Architecture Design

> **Domain:** App Development  
> **Difficulty:** ⭐⭐⭐ Advanced — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
> - [App Requirements Spec](./01_app_requirements_spec.skill.md) — Cần requirements rõ ràng
> - [Tech Stack Selection](./02_tech_stack_selection.skill.md) — Cần biết tech stack sẽ dùng

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đã có requirements và tech stack
- Cần thiết kế cấu trúc hệ thống
- App có > 3 components cần coordinate

**Không phù hợp khi:**
- App đơn giản (1-2 files)
- Script ngắn, one-off task

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên app | ✅ | "TaskFlow Desktop" |
| **Tech Stack** | Stack đã chọn | ✅ | "Tauri + Vue 3 + SQLite" |
| **Core Features** | 3-5 features chính | ✅ | "Task CRUD, Categories, Search" |
| **App Type** | Loại kiến trúc | ✅ | "Desktop / CLI / Web SPA / API" |
| **Data Flow** | Data flows thế nào? | ✅ | "User → UI → Backend → DB → UI" |
| **External Integrations** | APIs/services bên ngoài? | ❌ | "None / REST API / File system" |
| **State Management** | Cần state phức tạp? | ❌ | "Simple / Medium / Complex" |
| **Security Requirements** | Bảo mật cần thiết? | ❌ | "Local only / Auth required" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Architecture Design Document

## Overview
[Brief description of the architecture approach]

## System Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        [App Name]                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │  Component  │ ──▶ │  Component  │ ──▶ │  Component  │   │
│   │      A      │     │      B      │     │      C      │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│                              │                               │
│                       ┌──────▼──────┐                       │
│                       │   Storage   │                       │
│                       └─────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Component Breakdown

### 1. [Component Name]
- **Responsibility:** [What it does]
- **Interface:** [How other components interact with it]
- **Dependencies:** [What it depends on]

### 2. [Component Name]
[Same structure]

## Directory Structure

\`\`\`
project/
├── src/
│   ├── [layer1]/
│   │   ├── [file1]
│   │   └── [file2]
│   ├── [layer2]/
│   └── [layer3]/
├── tests/
├── config/
└── [other folders]
\`\`\`

## Data Flow

1. [Step 1]: User does X
2. [Step 2]: Component A handles Y
3. [Step 3]: Data flows to B
4. [Step 4]: Result displayed

## Key Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| [Decision 1] | [Choice] | [Why] |
| [Decision 2] | [Choice] | [Why] |

## Error Handling Strategy
- [How errors are handled]
- [Error boundaries]
- [User feedback approach]
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có system diagram rõ ràng
- [ ] Mỗi component có responsibility defined
- [ ] Directory structure logical
- [ ] Data flow documented
- [ ] Key decisions explained

**Red flags (cần Reject):**
- ⚠️ Components không có clear boundaries
- ⚠️ Circular dependencies
- ⚠️ God component (làm mọi thứ)
- ⚠️ Thiếu error handling strategy

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Over-architecture | Match complexity với app size |
| God component | Max 3 responsibilities per component |
| Circular deps | Draw dependency graph, ensure one-way |
| No boundaries | Define clear interfaces between layers |
| Premature optimization | Start simple, refactor when needed |

---

## 💡 Tips

1. **Start Simple** — 3 layers thường đủ cho hầu hết apps
2. **One Responsibility** — Mỗi component làm 1 việc tốt
3. **Dependencies Flow Down** — UI → Logic → Data, không ngược lại
4. **Draw Before Code** — Diagram trước, code sau
5. **Error First** — Plan error handling từ đầu

---

## 📊 Common Patterns

### Desktop App (Tauri/Electron)

```
┌─────────────────────────────────────────┐
│              Frontend (Web)              │
│   ┌─────────────────────────────────┐   │
│   │           UI Components         │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │         State Store             │   │
│   └─────────────┬───────────────────┘   │
├─────────────────┼───────────────────────┤
│                 │ IPC Bridge            │
├─────────────────┼───────────────────────┤
│              Backend (Rust/Node)         │
│   ┌─────────────▼───────────────────┐   │
│   │         Commands/API            │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │         Database Layer          │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### CLI Tool

```
┌─────────────────────────────────────────┐
│               CLI Interface              │
│   ┌─────────────────────────────────┐   │
│   │      Argument Parser            │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Command Handlers           │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Core Logic                 │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Storage (File/DB)          │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Web API

```
┌─────────────────────────────────────────┐
│              API Layer                   │
│   ┌─────────────────────────────────┐   │
│   │      Routes/Controllers         │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Services (Business Logic)  │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Repositories (Data Access) │   │
│   └─────────────┬───────────────────┘   │
│                 │                        │
│   ┌─────────────▼───────────────────┐   │
│   │      Database                   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
System: StockFlow
Modules: Auth, Inventory, Purchase Orders, Reporting, Sync
Integrations: Barcode scanner, Email alerts
Constraint: Kho cần offline, sync khi có mạng
Users: 50-80 concurrent
```

### Output mẫu:
```markdown
# Architecture Overview

## Components
- Web Client (Manager)
- Desktop Client (Warehouse)
- API Gateway (NestJS)
- Inventory Service
- Reporting Service
- Sync Service (queue)
- PostgreSQL + Redis

## Data Flow
1. Desktop ghi movement -> local SQLite
2. Sync service đẩy batch lên API
3. Inventory service cập nhật stock + audit log

## Key Decisions
- CQRS nhẹ cho reporting (read replica)
- Idempotent sync để tránh double count
```

### Đánh giá:
- ✅ Tách component rõ ràng
- ✅ Có chiến lược offline/sync
- ✅ Có xử lý reporting
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Tech Stack Selection](./02_tech_stack_selection.skill.md)
- [Database Schema Design](./04_database_schema_design.skill.md)
- [API Design Spec](./05_api_design_spec.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có Architecture → [Database Schema Design](./04_database_schema_design.skill.md) (nếu cần DB) hoặc → [API Design Spec](./05_api_design_spec.skill.md)


---

*Architecture Design Skill — CVF v1.5.2 Skill Library*
