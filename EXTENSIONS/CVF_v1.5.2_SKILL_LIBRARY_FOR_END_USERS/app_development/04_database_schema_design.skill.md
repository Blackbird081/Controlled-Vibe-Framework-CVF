# Database Schema Design

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.0  
> **Last Updated:** 2026-02-04

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
App Name: TaskFlow
Database: SQLite
Main Entities: User, Task, Category
Relationships:
  - User has many Tasks
  - Category has many Tasks
  - Task belongs to User and Category
Key Fields:
  - User: name, email
  - Task: title, description, due_date, status, priority
  - Category: name, color
Query Needs: Filter by status, search by title
Audit: Created/Updated timestamps
```

### Output mẫu:
```markdown
# TaskFlow - Database Schema

## ERD

\`\`\`
┌─────────────┐           ┌─────────────┐
│    users    │           │ categories  │
├─────────────┤           ├─────────────┤
│ id (PK)     │           │ id (PK)     │
│ name        │           │ name        │
│ email       │           │ color       │
│ created_at  │           │ created_at  │
└──────┬──────┘           └──────┬──────┘
       │                         │
       │ 1:N                     │ 1:N
       │                         │
       ▼                         ▼
┌─────────────────────────────────────────┐
│                 tasks                    │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ user_id (FK) ───────────────────────────┼─→ users.id
│ category_id (FK) ───────────────────────┼─→ categories.id
│ title, description                      │
│ due_date, status, priority              │
│ created_at, updated_at                  │
└─────────────────────────────────────────┘
\`\`\`

## Tables

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK AUTOINCREMENT |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE |
| created_at | TIMESTAMP | DEFAULT NOW |

### categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK AUTOINCREMENT |
| name | VARCHAR(50) | NOT NULL |
| color | VARCHAR(7) | DEFAULT '#808080' |
| created_at | TIMESTAMP | DEFAULT NOW |

### tasks
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK AUTOINCREMENT |
| user_id | INTEGER | FK → users.id, NOT NULL |
| category_id | INTEGER | FK → categories.id |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | |
| due_date | DATE | |
| status | VARCHAR(20) | DEFAULT 'pending' |
| priority | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW |
| updated_at | TIMESTAMP | DEFAULT NOW |

## SQL Schema

\`\`\`sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#808080',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Indexes
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category_id);
\`\`\`

## Sample Queries

\`\`\`sql
-- Get user's tasks
SELECT t.*, c.name as category_name 
FROM tasks t 
LEFT JOIN categories c ON t.category_id = c.id 
WHERE t.user_id = ?;

-- Filter by status
SELECT * FROM tasks WHERE status = 'pending';

-- Search by title
SELECT * FROM tasks WHERE title LIKE '%meeting%';

-- Tasks due today
SELECT * FROM tasks WHERE due_date = date('now');
\`\`\`
```

### Đánh giá:
- ✅ ERD clear
- ✅ All PKs/FKs defined
- ✅ Appropriate types
- ✅ Indexes planned
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có Schema → [API Design](./05_api_design_spec.skill.md) hoặc → Build Phase

---

*Database Schema Design Skill — CVF v1.5.2 Skill Library*
