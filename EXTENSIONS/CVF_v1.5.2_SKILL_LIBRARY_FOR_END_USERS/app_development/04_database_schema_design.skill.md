# Database Schema Design

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
> - [Architecture Design](./03_architecture_design.skill.md) — Cần hiểu cấu trúc hệ thống

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- App cần lưu trữ structured data
- Cần database (SQLite, PostgreSQL, etc.)
- Data có relationships (1-N, N-N)

**Không phù hợp khi:**
- Chỉ cần lưu config (dùng JSON/YAML)
- Data đơn giản (key-value)
- No persistence needed

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên app | ✅ | "TaskFlow" |
| **Database Type** | SQL hay NoSQL? | ✅ | "SQLite / PostgreSQL / MongoDB" |
| **Main Entities** | Các đối tượng chính | ✅ | "User, Task, Category, Tag" |
| **Relationships** | Quan hệ giữa entities | ✅ | "User has many Tasks, Task belongs to Category" |
| **Key Fields per Entity** | Fields quan trọng | ✅ | "Task: title, description, due_date, status" |
| **Search/Query Needs** | Cần query gì? | ❌ | "Search tasks by title, filter by status" |
| **Data Volume Expected** | Dự kiến bao nhiêu data? | ❌ | "~1000 tasks/user" |
| **Audit Requirements** | Cần track changes? | ❌ | "No / Created at / Full audit" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Database Schema Design

## Entity Relationship Diagram

\`\`\`
┌─────────────┐       ┌─────────────┐
│    User     │       │   Category  │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │
│ name        │       │ name        │
│ email       │       │ color       │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │ 1:N                 │ 1:N
       │                     │
       ▼                     ▼
┌─────────────────────────────────┐
│              Task               │
├─────────────────────────────────┤
│ id (PK)                         │
│ user_id (FK) ───────────────────┼─→ users.id
│ category_id (FK) ───────────────┼─→ categories.id
│ title                           │
│ status                          │
└─────────────────────────────────┘
\`\`\`

## Tables Definition

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Primary key |
| name | VARCHAR(100) | NOT NULL | User name |
| email | VARCHAR(255) | UNIQUE | Email address |
| created_at | TIMESTAMP | DEFAULT NOW | Creation time |

### [other tables...]

## SQL Schema

\`\`\`sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

[more CREATE statements...]
\`\`\`

## Indexes

| Table | Column(s) | Type | Purpose |
|-------|-----------|------|---------|
| tasks | user_id | INDEX | Fast user lookup |
| tasks | status | INDEX | Status filtering |

## Sample Queries

\`\`\`sql
-- Get all tasks for a user
SELECT * FROM tasks WHERE user_id = ?;

-- Search by title
SELECT * FROM tasks WHERE title LIKE '%keyword%';
\`\`\`
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có ERD diagram
- [ ] Mỗi table có PK defined
- [ ] FKs đúng relationships
- [ ] Data types appropriate
- [ ] Indexes cho queries common
- [ ] Có sample queries

**Red flags (cần Reject):**
- ⚠️ Thiếu foreign keys
- ⚠️ Không có primary key
- ⚠️ Wrong data types
- ⚠️ No indexes for large tables

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| No normalization | Mỗi fact 1 chỗ, không duplicate |
| Missing timestamps | Luôn có created_at, updated_at |
| VARCHAR too short | Better longer than truncated |
| No soft delete | Consider is_deleted flag |
| Missing indexes | Index mọi FK và query fields |

---

## 💡 Tips

1. **Always PK** — Every table needs a primary key
2. **FK Constraints** — Define relationships explicitly
3. **Timestamps** — created_at, updated_at on every table
4. **Indexes First** — Plan indexes with schema, not after
5. **Soft Delete** — Consider is_deleted instead of DELETE

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Entities: Product, Warehouse, StockMovement, Supplier, PurchaseOrder, User, Role
Access Patterns: tra cứu tồn theo SKU, báo cáo tồn theo ngày
Constraints: movement phải có user_id + timestamp
```

### Output mẫu:
```markdown
# Database Schema (PostgreSQL)

## Tables
- products(id, sku, barcode, name, unit, min_stock)
- warehouses(id, name, location)
- stock_movements(id, product_id, warehouse_id, qty, type, user_id, created_at)
- suppliers(id, name, contact)
- purchase_orders(id, supplier_id, status, created_at)
- purchase_order_items(id, po_id, product_id, qty, cost)
- users(id, name, email, role_id)
- roles(id, name, permissions)

## Indexes
- products.sku UNIQUE
- stock_movements(product_id, created_at)
- purchase_orders(status)
```

### Đánh giá:
- ✅ Quan hệ và index phù hợp query
- ✅ Có bảng movement cho audit
- ✅ Rõ ràng trạng thái PO
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [Architecture Design](./03_architecture_design.skill.md)
- [API Design Spec](./05_api_design_spec.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có Schema → [API Design Spec](./05_api_design_spec.skill.md) hoặc → Build Phase


---

*Database Schema Design Skill — CVF v1.5.2 Skill Library*
