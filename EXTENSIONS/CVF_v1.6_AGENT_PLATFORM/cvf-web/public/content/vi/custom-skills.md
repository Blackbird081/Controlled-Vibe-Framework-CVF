# Hướng dẫn: Tạo Custom Skill

**Thời gian:** 20 phút  
**Cấp độ:** Trung cấp  
**Bạn sẽ học được:** Cách tạo, quản lý phiên bản và chia sẻ các skill CVF có thể tái sử dụng  
**Yêu cầu trước:** Hiểu về quy trình 4 phase của CVF

---

## Skill là gì?

Một **skill** trong CVF là một template có cấu trúc, dựa trên biểu mẫu, giúp:
- Hướng dẫn người dùng cung cấp đúng đầu vào cho AI
- Xác định đầu ra mong đợi và tiêu chí chất lượng
- Bao gồm checklist nghiệm thu và các mẫu lỗi thường gặp

Skill **KHÔNG PHẢI code** và **KHÔNG PHẢI prompt**. Chúng là **các tài liệu governance** — biểu mẫu có cấu trúc giúp tương tác AI có thể lặp lại và kiểm soát chất lượng.

### Tại sao nên tạo Custom Skill?

| Không có Skill | Có Skill |
|---------------|----------|
| Viết prompt từ đầu mỗi lần | Điền vào biểu mẫu đã được chứng minh |
| Quên các đầu vào quan trọng | Checklist đảm bảo đầy đủ |
| Chất lượng không nhất quán | Tiêu chí nghiệm thu xác định "hoàn thành" |
| Không thể chia sẻ kiến thức | Skill có thể tái sử dụng bởi bất kỳ ai |
| Không đảm bảo chất lượng | Tiêu chí đánh giá tích hợp sẵn |

---

## Bước 1: Chọn trường hợp sử dụng

Nghĩ về một nhiệm vụ mà bạn (hoặc nhóm) thường xuyên làm với AI. Các ứng cử viên tốt:

| Ứng cử viên Skill tốt | Lý do |
|------------------------|-------|
| Tạo API endpoint | Cùng một mẫu mỗi lần |
| Đánh giá code | Checklist tiêu chuẩn |
| Phân tích báo cáo lỗi | Cần đầu vào có cấu trúc |
| Di chuyển cơ sở dữ liệu | Rủi ro cần được quản lý |
| Tạo bộ kiểm thử | Thanh chất lượng nhất quán |
| Viết nội dung trang đích | Cùng các trường: đối tượng, CTA, giọng điệu |

**Trong hướng dẫn này**, chúng ta sẽ tạo skill cho **"REST API Endpoint"**.

---

## Bước 2: Tạo file Skill

Skill tuân theo quy ước đặt tên: `[số thứ tự]_[tên_skill].skill.md`

Tạo file của bạn:

```bash
# In your project or in the CVF skill library
touch skills/001_rest_api_endpoint.skill.md
```

---

## Bước 3: Viết template Skill

Đây là cấu trúc skill hoàn chỉnh:

```markdown
# Skill: REST API Endpoint

> Create a well-structured REST API endpoint with validation, 
> error handling, and tests.

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | App Development |
| **Difficulty** | ⭐⭐ Medium |
| **CVF Version** | v1.0+ |
| **Skill Version** | 1.0.0 |
| **Last Updated** | 2026-02-15 |
| **Author** | @your-name |
| **Risk Level** | R1 (controlled, no external impact) |

---

## 📌 Prerequisites

Before using this skill, ensure:
- [ ] Backend framework is set up (Express, Fastify, Django, etc.)
- [ ] Database schema is defined for the resource
- [ ] Authentication middleware is configured (if needed)
- [ ] API conventions are defined (REST naming, response format)

---

## 🎯 Purpose

### When to Use
- Creating a new CRUD endpoint for a resource
- Adding an API route to an existing service
- Standardizing API patterns across a team

### When NOT to Use
- GraphQL endpoints (different pattern)
- WebSocket connections
- File upload endpoints (use file-upload skill instead)
- Batch/bulk operations

---

## 📋 Form Input

Fill in these fields before giving to AI:

| Field | Required | Description | Example |
|-------|:--------:|-------------|---------|
| **Resource name** | ✅ | The entity this endpoint manages | `User`, `Product`, `Order` |
| **HTTP method** | ✅ | GET, POST, PUT, PATCH, DELETE | `POST` |
| **Endpoint path** | ✅ | RESTful URL pattern | `/api/v1/users` |
| **Request body** | ✅* | JSON schema of request (*for POST/PUT) | `{ name: string, email: string }` |
| **Response body** | ✅ | JSON schema of response | `{ id: number, name: string, ... }` |
| **Query params** | ⬜ | For GET list endpoints | `?page=1&limit=20&sort=name` |
| **Path params** | ⬜ | URL parameters | `:id` (integer) |
| **Auth required** | ✅ | Who can access | `authenticated`, `admin`, `public` |
| **Validation rules** | ✅ | Input validation requirements | `email: valid email, name: 2-100 chars` |
| **Error responses** | ✅ | Expected error cases | `400 Bad Request, 404 Not Found, 409 Conflict` |
| **Framework** | ✅ | Backend framework | `Express + TypeScript` |
| **Database** | ✅ | Data layer | `PostgreSQL + Prisma` |

---

## ✅ Expected Output

AI should produce:

1. **Route handler file** (e.g., `src/routes/users.ts`)
   - Input validation (Zod, Joi, or framework-native)
   - Business logic
   - Database query
   - Response formatting
   - Error handling

2. **Test file** (e.g., `src/routes/users.test.ts`)
   - Happy path test
   - Validation error test
   - Not found test (for GET/PUT/DELETE by ID)
   - Auth test (if auth required)
   - Minimum 4 test cases

3. **Type definitions** (if TypeScript)
   - Request body type
   - Response body type

---

## 🔍 Acceptance Checklist

### Must Pass (all required)
- [ ] Correct HTTP method and path
- [ ] Input validation present and working
- [ ] All error cases handled with correct status codes
- [ ] Response matches specified JSON schema
- [ ] Auth middleware applied (if required)
- [ ] Tests cover happy path AND error cases
- [ ] No SQL injection / input sanitization
- [ ] Consistent with project's API conventions

### Should Pass (recommended)
- [ ] Pagination for list endpoints (GET all)
- [ ] Request logging
- [ ] Rate limiting considered
- [ ] CORS headers handled

### Red Flags 🚩
- ❌ Hardcoded values (IDs, URLs, secrets)
- ❌ No input validation
- ❌ Generic error messages ("Something went wrong")
- ❌ No tests
- ❌ SQL queries built with string concatenation
- ❌ Missing auth on sensitive endpoints

---

## ⚠️ Common Failures

| Failure | Prevention |
|---------|-----------|
| AI adds extra endpoints not requested | Specify "ONLY create [method] [path]" |
| Missing error handling | List all error cases in the form |
| Wrong status codes (200 for everything) | Specify expected status codes |
| Tests only test happy path | Require "minimum 4 tests including error cases" |
| Ignores existing project patterns | Include "follow existing patterns in src/routes/" |

---

## 💡 Tips

1. **Be specific about validation:** "name: string, 2-100 characters, required" is better than "name: string"
2. **Include an example response:** AI matches formats better with examples
3. **Reference existing code:** "Follow the pattern in src/routes/products.ts" 
4. **Specify test framework:** "Use Vitest" or "Use Jest" — don't let AI guess

---

## 📊 Example: Complete Input/Output

### Example Input (filled form)

```
Resource: User
Method: POST
Path: /api/v1/users
Request body: { name: string (2-100), email: string (valid email), role: "user"|"admin" }
Response: { id: number, name: string, email: string, role: string, createdAt: string }
Auth: admin only
Validation: name required 2-100 chars, email required valid format, role required enum
Errors: 400 (validation), 401 (not auth), 403 (not admin), 409 (email exists)
Framework: Express + TypeScript
Database: PostgreSQL + Prisma
```

### Example Output (what AI should produce)

**src/routes/users.ts** — Route handler with Zod validation, Prisma query, error handling  
**src/routes/users.test.ts** — 6 test cases (create success, validation error, duplicate email, unauthorized, forbidden, missing fields)  
**src/types/user.ts** — CreateUserRequest, UserResponse types

### Example Evaluation

```
Checklist:
- [x] POST /api/v1/users ✅
- [x] Zod validation for name, email, role ✅
- [x] 400 for validation errors ✅
- [x] 401 for unauthenticated ✅
- [x] 403 for non-admin ✅
- [x] 409 for duplicate email ✅
- [x] 6 test cases ✅
- [x] No hardcoded values ✅

Verdict: ✅ ACCEPT
```

---

## 🔗 Related Skills

- Database Migration Skill
- Authentication Middleware Skill
- API Documentation Skill (Swagger/OpenAPI)
- Integration Test Skill

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-15 | Initial release |

---
```

---

## Bước 4: Quản lý phiên bản Skill

Sử dụng semantic versioning:

| Loại thay đổi | Tăng phiên bản | Ví dụ |
|---------------|----------------|-------|
| Sửa lỗi chính tả, làm rõ diễn đạt | 1.0.0 → 1.0.1 | Sửa mô tả trường |
| Thêm phần mới, ví dụ | 1.0.0 → 1.1.0 | Thêm phần "Lỗi thường gặp" |
| Tái cấu trúc lớn, thêm trường đầu vào mới | 1.0.0 → 2.0.0 | Thay đổi schema đầu vào |

Theo dõi thay đổi trong phần Lịch sử phiên bản.

---

## Bước 5: Thêm Governance (v1.2+)

Đối với nhóm và doanh nghiệp, mỗi skill nên có bản ghi governance:

```markdown
# Governance: REST API Endpoint Skill

**Skill ID:** USR-001
**Risk Level:** R1
**Authority:** BUILDER can use, ARCHITECT must approve for R2+ endpoints

## Risk Assessment
| Dimension | Level | Reason |
|-----------|-------|--------|
| Authority | R0 | No autonomous decisions |
| Scope Expansion | R1 | Could generate extra code |
| Irreversibility | R0 | Code can be reverted |
| Interpretability | R0 | Output is standard code |
| External Impact | R0 | No external calls |

**Aggregate Risk: R1** (highest dimension)

## Lifecycle
- Status: ACTIVE
- Review cycle: Quarterly
- Owner: @team-lead
- Last review: 2026-02-15

## UAT Requirements
- [ ] Skill produces working code in target framework
- [ ] All acceptance criteria are testable
- [ ] No false positives (accepts bad output)
- [ ] No false negatives (rejects good output)
```

---

## Bước 6: Chia sẻ Skill của bạn

### Tùy chọn A: Thêm vào Thư viện Skill CVF

Nếu skill của bạn hữu ích cho mọi người, hãy đóng góp:

```bash
# Copy to the CVF skill library
cp skills/001_rest_api_endpoint.skill.md \
   EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/app-development/

# Create governance record
cp skills/001_rest_api_endpoint.gov.md \
   governance/skill-library/
```

### Tùy chọn B: Skill chỉ dành cho nhóm

Giữ skill trong repo của nhóm bạn:

```
your-team-repo/
├── skills/
│   ├── 001_rest_api_endpoint.skill.md
│   ├── 002_database_migration.skill.md
│   └── 003_code_review.skill.md
└── ...
```

### Tùy chọn C: Sử dụng trong Web UI (v1.6)

Ứng dụng web v1.6 có thể tải skill dưới dạng template. Đặt file skill vào thư mục phù hợp và chúng sẽ xuất hiện trong bộ chọn template.

---

## Tham chiếu theo lĩnh vực Skill

Thư viện Skill CVF tổ chức skill theo lĩnh vực:

| Lĩnh vực | Số lượng | Skill ví dụ |
|----------|:--------:|-------------|
| Marketing & SEO | 9 | Đánh giá SEO, chiến lược nội dung, kế hoạch A/B test |
| Sản phẩm & UX | 8 | User story, spec wireframe, đánh giá UX |
| Bảo mật & Tuân thủ | 6 | Mô hình mối đe dọa, kiểm tra tuân thủ, kế hoạch pen test |
| Tài chính & Phân tích | 8 | Mô hình tài chính, dashboard KPI, dự báo |
| Phát triển ứng dụng | 8 | REST API, di chuyển database, bộ test |
| HR & Vận hành | 5 | Mô tả công việc, kế hoạch onboarding, OKR |
| Pháp lý & Hợp đồng | 5 | Đánh giá hợp đồng, template NDA, soạn thảo ToS |
| Đánh giá AI/ML | 6 | Đánh giá mô hình, kiểm tra thiên lệch, đánh giá dataset |
| Phát triển Web | 6 | Trang đích, bố cục responsive, hiệu suất |
| **Tổng cộng** | **114** | |

---

## Tiếp theo

| Tôi muốn... | Xem... |
|-------------|--------|
| Hiểu sâu hơn về hệ thống skill | Khái niệm Hệ thống Skill |
| Tìm hiểu về mức rủi ro cho skill | Mô hình Rủi ro |
| Duyệt các skill hiện có | Thư viện Skill |
| Thiết lập governance skill cho nhóm | Hướng dẫn Nhóm |
| Sử dụng skill trong Web UI | Hướng dẫn Web UI |

---

*Cập nhật lần cuối: 15 tháng 2 năm 2026 | CVF v1.6*
