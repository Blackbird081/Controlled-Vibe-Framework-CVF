# API Design Spec

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
- App có backend API (REST/GraphQL)
- Frontend-Backend separation
- Desktop app with IPC commands
- CLI tool with multiple commands

**Không phù hợp khi:**
- Single file scripts
- No external interface

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên app | ✅ | "TaskFlow API" |
| **API Style** | REST / GraphQL / IPC | ✅ | "REST" |
| **Resources/Entities** | Các entities chính | ✅ | "User, Task, Category" |
| **Operations per Entity** | CRUD? hoặc custom? | ✅ | "Task: CRUD + complete, archive" |
| **Auth Required** | Cần authentication? | ✅ | "Yes - JWT / No / API Key" |
| **Response Format** | JSON / XML / etc. | ❌ | "JSON" |
| **Pagination Needed** | List có pagination? | ❌ | "Yes - offset/limit" |
| **Error Format** | Chuẩn error response | ❌ | "HTTP status + {error, message}" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# API Design Specification

## Overview
- **Base URL:** `/api/v1`
- **Format:** JSON
- **Auth:** [Auth method]

## Authentication
[Auth details - JWT, API Key, etc.]

## Endpoints

### Resource: Tasks

#### GET /tasks
List all tasks

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| status | string | No | Filter by status |
| limit | int | No | Pagination limit (default: 20) |
| offset | int | No | Pagination offset |

**Response:** 200 OK
\`\`\`json
{
    "data": [...],
    "total": 100,
    "limit": 20,
    "offset": 0
}
\`\`\`

#### POST /tasks
Create a task

**Request Body:**
\`\`\`json
{
    "title": "string (required)",
    "description": "string",
    "due_date": "date"
}
\`\`\`

**Response:** 201 Created
\`\`\`json
{
    "id": 1,
    "title": "...",
    "created_at": "..."
}
\`\`\`

[More endpoints...]

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required |
| 404 | Not Found |
| 500 | Server Error |

**Error Format:**
\`\`\`json
{
    "error": "ERROR_CODE",
    "message": "Human readable message"
}
\`\`\`
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Tất cả endpoints documented
- [ ] Request/Response format clear
- [ ] Error codes defined
- [ ] Auth mechanism specified
- [ ] Pagination cho list endpoints

**Red flags (cần Reject):**
- ⚠️ Missing CRUD operations
- ⚠️ No error handling spec
- ⚠️ Inconsistent naming
- ⚠️ Auth not defined

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Inconsistent URLs | Follow REST conventions |
| No pagination | Always paginate lists |
| Missing error codes | Define all error scenarios |
| Vague request/response | Show exact JSON structure |
| No versioning | Use /api/v1 from start |

---

## 💡 Tips

1. **REST Conventions** — GET=read, POST=create, PUT=update, DELETE=delete
2. **Consistent Naming** — Plural nouns: /tasks, /users, /categories
3. **Pagination Always** — Even for small lists
4. **Versioning** — /api/v1 from day 1
5. **Error Codes** — Meaningful error codes, not just HTTP status

---

## 📊 REST Conventions Quick Reference

| Operation | HTTP Method | URL Pattern | Response |
|-----------|-------------|-------------|----------|
| List | GET | /resources | 200 + array |
| Get one | GET | /resources/:id | 200 + object |
| Create | POST | /resources | 201 + object |
| Update | PUT | /resources/:id | 200 + object |
| Delete | DELETE | /resources/:id | 204 No Content |
| Action | POST | /resources/:id/action | 200 + result |

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
App Name: TaskFlow API
API Style: REST
Resources: Task, Category
Operations:
  - Task: List, Get, Create, Update, Delete, Complete, Archive
  - Category: List, Create, Delete
Auth: JWT Bearer token
Pagination: Yes - offset/limit
```

### Output mẫu:
```markdown
# TaskFlow API Specification

## Overview
- **Base URL:** `/api/v1`
- **Format:** JSON
- **Auth:** JWT Bearer Token

## Authentication

**Header:**
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

All endpoints except `/auth/login` require auth.

---

## Endpoints

### Tasks

#### GET /tasks
List tasks with optional filters

| Param | Type | Required | Description |
|-------|------|:--------:|-------------|
| status | string | No | pending/completed/archived |
| category_id | int | No | Filter by category |
| limit | int | No | Default: 20, Max: 100 |
| offset | int | No | Default: 0 |

**Response 200:**
\`\`\`json
{
    "data": [
        {
            "id": 1,
            "title": "Buy groceries",
            "status": "pending",
            "due_date": "2024-02-01",
            "category": { "id": 1, "name": "Personal" }
        }
    ],
    "total": 45,
    "limit": 20,
    "offset": 0
}
\`\`\`

#### GET /tasks/:id
Get single task

**Response 200:**
\`\`\`json
{
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "due_date": "2024-02-01",
    "priority": 1,
    "category": { "id": 1, "name": "Personal" },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
}
\`\`\`

#### POST /tasks
Create new task

**Request:**
\`\`\`json
{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "due_date": "2024-02-01",
    "category_id": 1,
    "priority": 1
}
\`\`\`

**Response 201:** [Created task object]

#### PUT /tasks/:id
Update task

**Request:** [Partial update allowed]
\`\`\`json
{
    "title": "New title",
    "status": "completed"
}
\`\`\`

**Response 200:** [Updated task object]

#### DELETE /tasks/:id
Delete task

**Response 204:** No Content

#### POST /tasks/:id/complete
Mark task as complete

**Response 200:**
\`\`\`json
{
    "id": 1,
    "status": "completed",
    "completed_at": "2024-01-20T15:30:00Z"
}
\`\`\`

#### POST /tasks/:id/archive
Archive task

**Response 200:**
\`\`\`json
{
    "id": 1,
    "status": "archived",
    "archived_at": "2024-01-20T15:30:00Z"
}
\`\`\`

---

### Categories

#### GET /categories
List all categories

**Response 200:**
\`\`\`json
{
    "data": [
        { "id": 1, "name": "Personal", "color": "#3B82F6" },
        { "id": 2, "name": "Work", "color": "#EF4444" }
    ]
}
\`\`\`

#### POST /categories
Create category

**Request:**
\`\`\`json
{
    "name": "Personal",
    "color": "#3B82F6"
}
\`\`\`

**Response 201:** [Created category]

#### DELETE /categories/:id
Delete category (unassigns tasks, doesn't delete them)

**Response 204:** No Content

---

## Error Responses

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_INPUT | Validation failed |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | No permission |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate entry |
| 500 | SERVER_ERROR | Internal error |

**Error Format:**
\`\`\`json
{
    "error": "INVALID_INPUT",
    "message": "Title is required",
    "details": {
        "field": "title",
        "issue": "required"
    }
}
\`\`\`
```

### Đánh giá:
- ✅ All endpoints documented
- ✅ Clear request/response
- ✅ Error codes defined
- ✅ Pagination included
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có API Spec → Build Phase hoặc → [Desktop App Spec](./06_desktop_app_spec.skill.md)

---

*API Design Spec Skill — CVF v1.5.2 Skill Library*
