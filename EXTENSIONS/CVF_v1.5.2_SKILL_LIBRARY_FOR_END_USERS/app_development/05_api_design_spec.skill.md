# API Design Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
>
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

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Build |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [05_api_design_spec](../../../governance/skill-library/uat/results/UAT-05_api_design_spec.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

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

### Input mẫu

```
Resources: products, warehouses, stock-movements, purchase-orders
Operations: CRUD + low-stock report
Auth: JWT + role-based access
Pagination: cursor-based
```

### Output mẫu

```markdown
# StockFlow API Spec

## POST /stock-movements
Request JSON: {"productId":"p_123","warehouseId":"w_1","qty":-5,"type":"OUT"}
Response 201: {"id":"m_999","status":"recorded"}

## GET /reports/low-stock
Response 200: [{"sku":"SKU-01","current":3,"min":10}]
```

### Đánh giá

- ✅ Endpoint rõ ràng, có ví dụ JSON
- ✅ Có report chuyên dụng
- ✅ Auth và pagination nêu rõ
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [Database Schema Design](./04_database_schema_design.skill.md)
- [Desktop App Spec](./06_desktop_app_spec.skill.md)
- [CLI Tool Spec](./07_cli_tool_spec.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có API Spec → [Desktop App Spec](./06_desktop_app_spec.skill.md) hoặc → [CLI Tool Spec](./07_cli_tool_spec.skill.md) hoặc → Build Phase

---

*API Design Spec Skill — CVF v1.5.2 Skill Library*
