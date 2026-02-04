# App Requirements Spec

> **Domain:** App Development  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.0  
> **Last Updated:** 2026-02-04

---

## 📌 Prerequisites

> Không yêu cầu — Đây là skill đầu tiên trong App Development workflow.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Bắt đầu một dự án app mới
- Cần định nghĩa rõ ràng app sẽ làm gì
- Muốn AI Agent hiểu đúng requirements trước khi code

**Không phù hợp khi:**
- Đã có spec chi tiết rồi
- Chỉ cần fix bug/refactor code có sẵn

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên và tagline ngắn | ✅ | "TaskFlow - Quản lý công việc cá nhân" |
| **App Type** | Loại app | ✅ | "Desktop / CLI / Mobile / Web / API" |
| **Problem Statement** | Vấn đề cần giải quyết | ✅ | "Quản lý tasks bị phân tán ở nhiều nơi" |
| **Target Users** | Ai sẽ dùng app? | ✅ | "Developers cá nhân, freelancers" |
| **Core Features** | 3-5 tính năng chính | ✅ | "1. Task CRUD 2. Categories 3. Due dates" |
| **Out of Scope** | Những gì KHÔNG làm | ✅ | "Không có team collaboration, không có sync" |
| **Success Criteria** | Khi nào app được coi là done? | ✅ | "User có thể add/complete tasks trong < 3 clicks" |
| **Platform** | Chạy trên đâu? | ❌ | "Windows, macOS, Linux" |
| **Data Storage** | Lưu data ở đâu? | ❌ | "Local SQLite" |
| **Existing Solutions** | Apps tương tự hiện có? | ❌ | "Todoist, Things 3" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# App Requirements Specification

## Overview
- **Name:** [App Name]
- **Type:** [App Type]
- **Platform:** [Platform(s)]

## Problem Statement
[Clear description of the problem]

## Target Users
- Primary: [Who]
- Use context: [When/Where they use it]

## Functional Requirements

### Core Features (Must Have)
1. [Feature 1] - [Brief description]
2. [Feature 2] - [Brief description]
3. [Feature 3] - [Brief description]

### Nice to Have (Future)
- [Optional feature 1]
- [Optional feature 2]

### Out of Scope
- [What we're NOT building]

## Non-Functional Requirements
- **Performance:** [Speed expectations]
- **Storage:** [Data storage approach]
- **Security:** [Basic security needs]

## Success Criteria
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] [Measurable criterion 3]

## Constraints
- [Time/resource/technical constraints]
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Problem statement rõ ràng, cụ thể
- [ ] Core features không quá 5, có priority
- [ ] Out of scope được định nghĩa rõ
- [ ] Success criteria có thể measure được
- [ ] Target users cụ thể (không phải "everyone")

**Red flags (cần Reject):**
- ⚠️ "Làm hết mọi thứ" (scope quá rộng)
- ⚠️ Không biết ai sẽ dùng
- ⚠️ Success criteria mơ hồ ("app tốt")
- ⚠️ Core features > 5 (feature creep)

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Scope quá rộng | Giới hạn 3-5 core features |
| Problem mơ hồ | Hỏi "Nếu không có app này, user phải làm gì?" |
| Target "everyone" | Narrow down: "Ai THỰC SỰ cần app này nhất?" |
| Không có out-of-scope | Liệt kê rõ những gì KHÔNG làm |
| Success criteria không đo được | Dùng số liệu cụ thể |

---

## 💡 Tips

1. **Start with Problem** — App tốt giải quyết 1 problem rõ ràng
2. **3 Core Features max** — Ít hơn tốt hơn, thêm sau
3. **Define Out of Scope** — Quan trọng như In Scope
4. **Specific Users** — "Developers làm freelance" > "Everyone"
5. **Measurable Success** — "< 3 clicks to complete task" > "Dễ dùng"

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
App Name: QuickNote CLI
App Type: CLI Tool
Problem: Ghi chú nhanh từ terminal mà không cần mở app khác
Target Users: Developers làm việc trong terminal
Core Features:
  1. Add note với 1 command
  2. List notes theo category
  3. Search notes
Out of Scope: GUI, sync cloud, share notes
Success Criteria: Add note trong < 2 seconds
Platform: macOS, Linux
Data Storage: Local JSON file
```

### Output mẫu:
```markdown
# QuickNote CLI - Requirements Spec

## Overview
- **Name:** QuickNote CLI
- **Type:** Command-line tool
- **Platform:** macOS, Linux

## Problem Statement
Developers cần ghi chú nhanh trong khi làm việc trên terminal,
nhưng phải alt-tab sang app khác làm gián đoạn workflow.

## Target Users
- Primary: Developers làm việc chủ yếu trong terminal
- Context: Trong lúc code, debug, hoặc research

## Functional Requirements

### Core Features
1. **Quick Add** - `qn add "note content" -c category`
2. **List Notes** - `qn list` hoặc `qn list -c work`
3. **Search** - `qn search "keyword"`

### Out of Scope
- Graphical user interface
- Cloud sync/backup
- Note sharing
- Rich text/markdown formatting

## Non-Functional Requirements
- **Performance:** Add note < 100ms
- **Storage:** Local ~/.quicknote/notes.json
- **Install:** Single binary, no dependencies

## Success Criteria
- [ ] Add note với 1 command trong < 2 seconds
- [ ] Search 1000 notes trong < 500ms
- [ ] Zero configuration required

## Constraints
- No external dependencies
- Must work offline
```

### Đánh giá:
- ✅ Problem rõ ràng
- ✅ 3 core features cụ thể
- ✅ Out of scope defined
- ✅ Success criteria measurable
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có Requirements Spec → [Tech Stack Selection](./02_tech_stack_selection.skill.md)

---

*App Requirements Spec Skill — CVF v1.5.2 Skill Library*
