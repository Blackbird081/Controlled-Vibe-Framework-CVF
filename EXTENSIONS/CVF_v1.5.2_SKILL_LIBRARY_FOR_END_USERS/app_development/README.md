# 🚀 App Development Skills

> **Domain:** App Development  
> **Skills:** 8  
> **CVF Version:** v1.5.2  
> **Target:** AI Agent App Building

---

## 🎯 Mục đích

Domain này cung cấp các skills để tạo **spec chất lượng cao** cho AI Agents (Claude, Cursor, Copilot...) để build local apps.

**Use cases:**
- Desktop apps (Electron, Tauri)
- CLI tools (Python, Node.js)
- Mobile apps (React Native, Flutter)
- Backend services
- Full-stack applications

---

## 📋 Danh sách Skills

| # | Skill | Mô tả | Dùng khi |
|:-:|-------|-------|----------|
| 1 | [App Requirements Spec](./01_app_requirements_spec.skill.md) | Thu thập yêu cầu, định nghĩa scope | Bắt đầu dự án mới |
| 2 | [Tech Stack Selection](./02_tech_stack_selection.skill.md) | Chọn framework, database, tools | Sau khi có requirements |
| 3 | [Architecture Design](./03_architecture_design.skill.md) | System design, component structure | Trước khi code |
| 4 | [Database Schema Design](./04_database_schema_design.skill.md) | Data modeling, relationships | Apps có database |
| 5 | [API Design Spec](./05_api_design_spec.skill.md) | Endpoints, request/response | Apps có API |
| 6 | [Desktop App Spec](./06_desktop_app_spec.skill.md) | Electron/Tauri apps | Desktop applications |
| 7 | [CLI Tool Spec](./07_cli_tool_spec.skill.md) | Command-line tools | Automation, scripts |
| 8 | [Local Deployment](./08_local_deployment.skill.md) | Packaging, distribution | Ready to ship |

---

## 🔄 Recommended Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    CVF App Development Flow                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   1. App Requirements Spec                                   │
│      ↓ (What are we building?)                              │
│                                                              │
│   2. Tech Stack Selection                                    │
│      ↓ (What tools/frameworks?)                             │
│                                                              │
│   3. Architecture Design                                     │
│      ↓ (How is it structured?)                              │
│                                                              │
│   4. Database Schema Design    ←── Optional                  │
│      ↓                                                       │
│   5. API Design Spec           ←── Optional                  │
│      ↓                                                       │
│                                                              │
│   6. Desktop App / CLI Tool Spec (choose one)               │
│      ↓                                                       │
│                                                              │
│   7. AI Agent builds the app                                 │
│      ↓                                                       │
│                                                              │
│   8. Local Deployment                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚦 Kết hợp với CVF Export Modes

Khi export spec từ các skills này, **recommend sử dụng CVF Full Mode**:

| Mode | Phù hợp khi |
|------|-------------|
| Simple | Quick prototypes, tiny scripts |
| With Rules | Medium complexity apps |
| **CVF Full Mode** ⭐ | Production apps, complex systems |

**CVF Full Mode đảm bảo AI Agent:**
- Follow 4-phase process (Discovery → Design → Build → Review)
- Không skip requirements
- Xác nhận trước khi thực thi
- Ghi nhận decisions

---

## 📊 Ví dụ End-to-End

### Scenario: Xây dựng Task Manager Desktop App

**Step 1:** App Requirements Spec
```
App name: TaskFlow Desktop
Type: Desktop (cross-platform)
Core features: Task CRUD, Categories, Due dates
Target users: Individual productivity
```

**Step 2:** Tech Stack Selection
```
Framework: Tauri (Rust + Vue 3)
Database: SQLite (embedded)
UI: Vue 3 + Tailwind CSS
```

**Step 3:** Architecture Design
```
┌─────────────┐     ┌─────────────┐
│   Frontend  │ ──▶ │   Tauri     │
│   (Vue 3)   │     │   Bridge    │
└─────────────┘     └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │   SQLite    │
                   │   Database  │
                   └─────────────┘
```

**Step 4:** Database Schema
```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    category_id INTEGER,
    due_date DATE,
    completed BOOLEAN DEFAULT 0
);
```

**Step 5:** Desktop App Spec
```
Window: 800x600, resizable
Menu: File, Edit, View, Help
Tray: Yes, with quick-add
Hotkeys: Ctrl+N (new), Ctrl+F (search)
```

**Step 6:** Export với CVF Full Mode → Paste vào AI Agent → App được build!

---

## 🔗 Related Skills

- [Security Audit](../technical_review/03_security_audit.skill.md) - Đánh giá bảo mật sau khi build
- [Code Review](../technical_review/01_code_review.skill.md) - Review code quality
- [CVF Web UX Redesign System](../product_ux/cvf_web_ux_redesign_system.skill.md) - Chuẩn UI/UX web theo `DESIGN.md`
- [UX Heuristic Evaluation](../product_ux/ux_heuristic_evaluation.skill.md) - Đánh giá UX sau build

---

*App Development Domain — CVF v1.5.2 Skill Library*
