# Architecture Design

> **Domain:** App Development  
> **Difficulty:** ⭐⭐⭐ Hard  
> **CVF Version:** v1.5.2  
> **Phase:** Design (Phase B)

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
App Name: QuickNote CLI
Tech Stack: Python + Click + SQLite
Core Features: Add note, List notes, Search notes
App Type: CLI Tool
Data Flow: User command → Parser → Handler → DB → Output
External: None
State: Simple (no complex state)
```

### Output mẫu:
```markdown
# QuickNote CLI - Architecture

## Overview
Simple 4-layer CLI architecture with clear separation.

## System Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      QuickNote CLI                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   CLI Layer                          │   │
│   │              (cli.py - Click)                        │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                                │
│   ┌─────────────────────────▼───────────────────────────┐   │
│   │                Commands Layer                        │   │
│   │    (commands/add.py, list.py, search.py)            │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                                │
│   ┌─────────────────────────▼───────────────────────────┐   │
│   │                 Core Layer                           │   │
│   │              (core/notes.py)                         │   │
│   └─────────────────────────┬───────────────────────────┘   │
│                             │                                │
│   ┌─────────────────────────▼───────────────────────────┐   │
│   │                Storage Layer                         │   │
│   │              (storage/db.py)                         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
\`\`\`

## Component Breakdown

### 1. CLI Layer (cli.py)
- **Responsibility:** Parse arguments, route to commands
- **Interface:** Click decorators
- **Dependencies:** Commands layer

### 2. Commands Layer (commands/)
- **Responsibility:** Handle specific commands
- **Interface:** Functions called by CLI
- **Dependencies:** Core layer

### 3. Core Layer (core/notes.py)
- **Responsibility:** Business logic for notes
- **Interface:** NoteService class
- **Dependencies:** Storage layer

### 4. Storage Layer (storage/db.py)
- **Responsibility:** SQLite operations
- **Interface:** NoteRepository class
- **Dependencies:** None

## Directory Structure

\`\`\`
quicknote/
├── cli.py                 # Entry point + Click setup
├── commands/
│   ├── __init__.py
│   ├── add.py            # qn add command
│   ├── list.py           # qn list command
│   └── search.py         # qn search command
├── core/
│   ├── __init__.py
│   └── notes.py          # NoteService
├── storage/
│   ├── __init__.py
│   └── db.py             # NoteRepository + SQLite
├── tests/
│   ├── test_commands.py
│   └── test_core.py
└── setup.py
\`\`\`

## Data Flow: Add Note

1. User runs: `qn add "Buy milk" -c personal`
2. CLI Layer: Click parses args → calls add command
3. Commands Layer: AddCommand validates → calls NoteService
4. Core Layer: NoteService creates Note object → calls Repository
5. Storage Layer: Repository saves to SQLite
6. Output: "Note added ✓" displayed

## Key Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| DB | SQLite | Simple, no setup, offline-first |
| Layers | 4 layers | Clear separation, easy testing |
| ORM | None (raw SQL) | Keep it simple for < 10 queries |

## Error Handling
- CLI Layer: Catch all exceptions, show user-friendly message
- Storage: Raise custom DBError
- Core: Validate input, raise ValidationError
\`\`\`

### Đánh giá:
- ✅ Clear diagram
- ✅ Each component defined
- ✅ Directory structure logical
- ✅ Data flow documented
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có Architecture → [Database Schema Design](./04_database_schema_design.skill.md) (nếu cần DB)

---

*Architecture Design Skill — CVF v1.5.2 Skill Library*
