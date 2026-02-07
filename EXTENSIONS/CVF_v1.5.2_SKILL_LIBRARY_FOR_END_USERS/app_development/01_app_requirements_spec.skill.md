# App Requirements Spec

> **Domain:** App Development  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

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
App Name: StockFlow
App Type: Web app + Desktop app cho kho
Problem: Theo dõi tồn kho 2 chi nhánh, kho cần offline khi mất mạng
Target Users: Store managers, warehouse staff
Core Features:
  1. Product catalog + barcode
  2. Stock in/out + lịch sử movement
  3. Purchase orders + supplier
  4. Low-stock alerts + weekly report
  5. Role-based access
Out of Scope: Kế toán, thanh toán nhà cung cấp
Success Criteria: Độ chính xác tồn kho > 98%, thao tác nhập kho < 30s
Platform: Web (manager), Desktop (warehouse)
Data Storage: PostgreSQL + local SQLite sync
```

### Output mẫu:
```markdown
# StockFlow - Requirements Spec

## Users
- Manager: xem báo cáo, cấu hình sản phẩm
- Warehouse: nhập/xuất, kiểm kho

## Functional Requirements
- Tạo/sửa sản phẩm với SKU, barcode, đơn vị
- Ghi nhận nhập/xuất, lưu người thao tác + thời gian
- Tạo PO, trạng thái: draft/approved/received
- Cảnh báo khi tồn kho < ngưỡng
- Phân quyền theo role

## Non-Functional
- Offline mode tại kho, sync khi có mạng
- Thời gian phản hồi < 200ms cho tra cứu
- Audit log giữ 12 tháng

## Acceptance Criteria
- 95% tác vụ nhập/xuất hoàn thành < 30s
- Báo cáo tồn kho tải < 10s
```

### Đánh giá:
- ✅ Mục tiêu rõ, có đo lường
- ✅ Tách user role và phạm vi
- ✅ Nêu rõ offline + sync
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Tech Stack Selection](./02_tech_stack_selection.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có Requirements Spec → [Tech Stack Selection](./02_tech_stack_selection.skill.md)


---

*App Requirements Spec Skill — CVF v1.5.2 Skill Library*
