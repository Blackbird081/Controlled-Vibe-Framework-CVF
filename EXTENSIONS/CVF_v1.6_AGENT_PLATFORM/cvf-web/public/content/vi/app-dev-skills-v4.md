# Hướng dẫn: Kỹ năng Phát triển Ứng dụng từ claudekit-skills & claude-code-templates (AGT-025 → AGT-029)

**Thời gian:** 30 phút  
**Trình độ:** Trung cấp → Nâng cao  
**Điều kiện:** [Agent Platform đã thiết lập](agent-platform.md), [Kỹ năng Thông minh v1.6.3 (AGT-021–024)](intelligence-skills-v3.md)  
**Bạn sẽ học:** Cách sử dụng 5 kỹ năng phát triển ứng dụng mới — thiết kế API, kiểm thử full-stack, bảo mật & xác thực, thiết kế CSDL, và kiến trúc frontend component

---

## Tổng quan

CVF v1.6.4 mở rộng từ **24 lên 29 agent tools** sau khi phân tích chuyên sâu [claudekit-skills](https://github.com/Blackbird081/claudekit-skills) và [claude-code-templates](https://github.com/Blackbird081/claude-code-templates). 5 kỹ năng mới mang **phương pháp luận phát triển ứng dụng production-grade** vào framework quản trị CVF:

| Kỹ năng | Chức năng | Risk | Khi nào dùng |
|---------|-----------|------|-------------|
| 🏗️ **AGT-025: API Architecture Designer** | Quyết định REST/GraphQL/gRPC, mẫu microservices | R1 | Khi thiết kế API endpoints hoặc kiến trúc backend |
| 🧪 **AGT-026: Full-Stack Testing Engine** | Kim tự tháp 70-20-10, CI gates, chống flaky | R2 | Khi thiết lập hoặc cải thiện chiến lược kiểm thử |
| 🛡️ **AGT-027: Security & Auth Guard** | Phòng thủ OWASP Top 10, OAuth 2.1, cây chọn auth | R2 | Khi triển khai xác thực hoặc tăng cường bảo mật |
| 🗄️ **AGT-028: Database Schema Architect** | Chọn DB, thiết kế schema, đánh index, migration | R1 | Khi thiết kế hoặc tối ưu hóa schema CSDL |
| ⚛️ **AGT-029: Frontend Component Forge** | Kiến trúc component, Suspense patterns, tổ chức feature | R1 | Khi xây dựng hệ thống component React/frontend |

---

## Phân bổ Risk cập nhật (29 Skills)

```
R0 (5 skills) ─── R1 (10 skills) ─── R2 (10 skills) ─── R3 (4 skills)
An toàn/Tự động   Thấp/Tự động      Trung bình/Giám sát  Cao/Thủ công
```

| Risk | Kỹ năng mới | Phê duyệt | Ai được dùng |
|------|------------|----------|-------------|
| **R1** (AGT-025, 028, 029) | API Architecture, Database Schema, Frontend Components | Tự động | Tất cả |
| **R2** (AGT-026, 027) | Full-Stack Testing, Security & Auth | Có giám sát | Orchestrator, Builder |

---

## Kỹ năng 1: API Architecture Designer (AGT-025)

### Chức năng

Phương pháp luận toàn diện thiết kế API với **cây quyết định** chọn đúng mẫu kiến trúc (REST, GraphQL, hoặc gRPC) dựa trên ràng buộc dự án.

### Khi nào dùng

- Bắt đầu dịch vụ backend hoặc microservice mới
- Di chuyển từ monolith sang microservices
- Chọn giữa REST, GraphQL, và gRPC
- Thiết kế hợp đồng lỗi và chiến lược versioning

### Khái niệm chính: Cây quyết định API

```
Cần streaming real-time? ──Có──→ gRPC (Protocol Buffers)
         │Không
Client cần truy vấn linh hoạt? ──Có──→ GraphQL (Schema-first)
         │Không
CRUD chuẩn với caching? ──Có──→ REST (OpenAPI 3.1)
```

### Các mẫu Microservices có sẵn

| Mẫu | Khi nào | Ví dụ |
|------|---------|-------|
| API Gateway | Nhiều client, rate limiting | Kong, AWS API Gateway |
| BFF (Backend-for-Frontend) | UI khác nhau cần data shape khác nhau | Mobile BFF, Web BFF |
| CQRS | Mẫu đọc/ghi khác nhau đáng kể | Tách model đọc/ghi |
| Event Sourcing | Cần audit trail đầy đủ | Giao dịch tài chính |
| Saga | Distributed transactions | Đơn hàng đa dịch vụ |
| Circuit Breaker | Ngăn lỗi lan truyền | Resilience4j, Polly |

### Ví dụ Prompt

```
"Thiết kế REST API cho catalog sản phẩm SaaS đa thuê bao"
"Nên dùng GraphQL hay REST cho app mobile này với nested data phức tạp?"
"Thiết lập error handling contracts cho microservice API"
"Review chiến lược API versioning — tôi xử lý breaking changes đúng chưa?"
```

---

## Kỹ năng 2: Full-Stack Testing Engine (AGT-026)

### Chức năng

Thực thi **kim tự tháp kiểm thử 70-20-10** với hệ thống 4 cổng CI xác thực chất lượng code từ unit test đến sẵn sàng production.

### Khi nào dùng

- Thiết lập hạ tầng kiểm thử cho dự án mới
- Cải thiện test coverage và giảm flaky tests
- Xây dựng quality gates cho CI/CD
- Kiểm thử hiệu năng với mô phỏng tải

### Khái niệm chính: Kim tự tháp 70-20-10

```
           ╱╲          E2E (10%)
          ╱  ╲         Playwright, chỉ critical paths
         ╱    ╲
        ╱──────╲       Integration (20%)
       ╱        ╲      API contracts, DB queries
      ╱          ╲
     ╱────────────╲    Unit (70%)
    ╱              ╲   Vitest, hàm thuần, nhanh
```

### Hệ thống 4 Cổng CI

| Cổng | Tests | Ngưỡng | Chặn |
|------|-------|--------|------|
| **Cổng 1** | Unit tests | 80% coverage | Merge vào dev |
| **Cổng 2** | Integration tests | Tất cả contracts pass | Merge vào staging |
| **Cổng 3** | E2E critical paths | 100% pass, ≤2% flaky | Deploy lên staging |
| **Cổng 4** | Load + security + a11y | p95 < 200ms, 0 critical | Deploy lên prod |

### Quy trình xử lý Flaky Test

```
1. Cách ly test flaky ngay (chuyển sang .flaky.test.ts)
2. Thêm retry(3) với exponential backoff
3. Tìm nguyên nhân → sửa trong 48h hoặc xóa
4. Theo dõi tỷ lệ flaky: mục tiêu < 1% tổng số lần chạy
```

### Ví dụ Prompt

```
"Thiết lập kim tự tháp kiểm thử Vitest + Playwright cho app Next.js"
"CI có 12% flaky tests — giúp tôi áp dụng quy trình xử lý flaky"
"Thiết kế integration tests cho REST API với database assertions"
"Tạo k6 load test cho luồng checkout — mục tiêu 1000 người dùng đồng thời"
```

---

## Kỹ năng 3: Security & Auth Guard (AGT-027)

### Chức năng

Cung cấp **cây quyết định chọn phương thức auth** và **ma trận phòng thủ OWASP Top 10** để triển khai xác thực và bảo mật production-grade.

### Khi nào dùng

- Triển khai xác thực người dùng từ đầu
- Thêm OAuth, SSO, hoặc xác thực đa yếu tố
- Kiểm tra bảo mật ứng dụng hiện tại
- Tăng cường bảo mật API endpoints và headers

### Khái niệm chính: Cây chọn phương thức Auth

```
Chỉ user nội bộ? ──Có──→ SSO / SAML
         │Không
API-to-API? ──Có──→ mTLS / API Key (xoay vòng 90 ngày)
         │Không
App mobile? ──Có──→ OAuth 2.1 + PKCE
         │Không
Ưu tiên onboarding nhanh? ──Có──→ Magic Links (email)
         │Không
Yêu cầu bảo mật cao? ──Có──→ Passkeys (WebAuthn) + 2FA backup
         │Không
Web app tiêu chuẩn ──→ OAuth 2.1 + JWT (15p access / 7 ngày refresh)
```

### Ma trận phòng thủ OWASP Top 10 (2025)

| # | Mối đe dọa | Phòng thủ |
|---|-----------|---------|
| A01 | Broken Access Control | RBAC, nguyên tắc quyền tối thiểu |
| A02 | Lỗi mật mã | TLS 1.3+, AES-256-GCM, Argon2id cho mật khẩu |
| A03 | Injection | Parameterized queries, validation input, CSP |
| A07 | Lỗi xác thực | Khóa tài khoản (5 lần/15 phút), bắt buộc 2FA |

### Danh sách Security Headers

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-XSS-Protection: 0  (dựa vào CSP thay thế)
Cross-Origin-Opener-Policy: same-origin
```

### Ví dụ Prompt

```
"Thiết lập OAuth 2.1 với JWT cho app Next.js — token truy cập 15 phút"
"Chạy kiểm tra bảo mật OWASP Top 10 cho Express.js API"
"Thêm rate limiting cho endpoint đăng nhập — 5 lần mỗi 15 phút"
"Triển khai xác thực passkey (WebAuthn) làm phương thức đăng nhập chính"
```

---

## Kỹ năng 4: Database Schema Architect (AGT-028)

### Chức năng

Cây quyết định chọn database và phương pháp thiết kế schema cho **relational (PostgreSQL)** và **document (MongoDB)**, với chiến lược indexing, migration, và tối ưu hóa.

### Khi nào dùng

- Chọn giữa PostgreSQL, MongoDB, Redis, hoặc database khác
- Thiết kế schema cho ứng dụng mới
- Tối ưu hóa truy vấn chậm hoặc thêm index
- Lập kế hoạch database migration an toàn

### Khái niệm chính: Cây chọn Database

```
Cần giao dịch ACID? ──Có──→ PostgreSQL
         │Không
Schema linh hoạt/thay đổi? ──Có──→ MongoDB
         │Không
Cache key-value? ──Có──→ Redis
         │Không
Tìm kiếm full-text? ──Có──→ Elasticsearch
         │Không
Dữ liệu time-series? ──Có──→ TimescaleDB
```

### Mẫu thiết kế Schema

| Loại | Mẫu | Ví dụ |
|------|------|-------|
| **Relational** | Chuẩn hóa 3NF | Users → Orders → Items (FK) |
| **Document** | Nhúng nếu đọc cùng nhau | `{ user: {...}, recentOrders: [...] }` |
| **Document** | Tham chiếu nếu độc lập | `{ userId: ObjectId, orderId: ObjectId }` |
| **Hybrid** | Phi chuẩn hóa cho hiệu năng | Cache computed fields, invalidate khi ghi |

### Tham khảo nhanh chiến lược Index

| Mẫu truy vấn | PostgreSQL | MongoDB |
|--------------|-----------|---------|
| Exact match (=) | B-tree (mặc định) | Single field |
| Range (>, <, BETWEEN) | B-tree | Single field |
| Full-text search | GIN (tsvector) | Text index |
| JSON/Array fields | GIN (jsonb) | Multikey |
| Geospatial | GiST (PostGIS) | 2dsphere |
| Truy vấn tổng hợp | Multi-column B-tree | Compound index |

### Quy trình Migration (5 bước)

```
1. File phiên bản schema → migrations/YYYYMMDD_description.sql
2. Review: kiểm tra tương thích ngược
3. Áp dụng lên staging với xác minh dữ liệu
4. Blue-green deploy: schema cũ + mới đồng thời
5. Dọn dẹp: xóa cột deprecated sau 2 chu kỳ release
```

### Ví dụ Prompt

```
"Thiết kế PostgreSQL schema cho SaaS đa thuê bao — users, teams, billing"
"Nên nhúng đơn hàng vào document user hay tham chiếu riêng?"
"Tối ưu truy vấn chậm — EXPLAIN ANALYZE cho thấy sequential scan trên 2M hàng"
"Lập kế hoạch migration zero-downtime thêm cột nullable với backfill"
```

---

## Kỹ năng 5: Frontend Component Forge (AGT-029)

### Chức năng

Hệ thống quyết định kiến trúc component cho ứng dụng **React/Next.js** — bao gồm tổ chức feature, mẫu Suspense, lazy loading, và tích hợp design system.

### Khi nào dùng

- Thiết lập kiến trúc component cho dự án React mới
- Tái cấu trúc hệ thống component đã phình to
- Thêm code splitting và lazy loading
- Tích hợp design system (MUI, Tailwind, Shadcn)

### Khái niệm chính: Cây kiến trúc Component

```
Là page/route? ──────────────→ Route Component (app/page.tsx)
Là container dữ liệu? ──────→ Smart Component (dùng hooks, Suspense)
Là mảnh UI tái sử dụng? ────→ Presentational Component (chỉ props)
Là wrapper layout? ──────────→ Layout Component (app/layout.tsx)
Dùng chung nhiều feature? ───→ Common Component (src/components/)
```

### Mẫu thư mục Feature

```
src/features/checkout/
├── components/        # UI riêng feature
│   ├── CartSummary.tsx
│   ├── PaymentForm.tsx
│   └── OrderConfirmation.tsx
├── hooks/             # Logic feature
│   ├── useCart.ts
│   └── usePayment.ts
├── api/               # API calls feature
│   └── checkout-api.ts
├── types/             # Types feature
│   └── checkout.types.ts
├── utils/             # Helpers feature
│   └── price-calculator.ts
└── index.ts           # Public API (barrel export)
```

### Anti-Patterns (KHÔNG BAO GIỜ làm những điều này)

| ❌ Đừng | ✅ Thay vào đó |
|---------|--------------|
| Props drilling > 3 tầng | Dùng Context hoặc state management |
| Logic business trong component | Tách ra custom hooks |
| Inline styles khắp nơi | Dùng design tokens / CSS modules |
| Component khổng lồ 500+ dòng | Chia thành sub-components theo feature |
| Import từ đường dẫn sâu | Dùng barrel exports (index.ts) |
| useEffect cho data fetching | Dùng React Query / SWR / Server Components |

### Ví dụ Prompt

```
"Thiết lập cấu trúc thư mục feature cho luồng checkout thương mại điện tử"
"Tái cấu trúc component 400 dòng thành các mảnh nhỏ hơn với phân tách đúng"
"Thêm Suspense boundaries và loading skeletons cho danh sách sản phẩm"
"Thiết kế hệ thống component cho dashboard với 5 loại widget"
```

---

## Bản đồ tương tác giữa các kỹ năng

5 kỹ năng này phối hợp trong vòng đời phát triển ứng dụng:

```
  AGT-025 (Thiết kế API)
       │
       ├────→ AGT-028 (CSDL) ──── Schema hỗ trợ data model API
       │
       ├────→ AGT-029 (Frontend) ──── Components tiêu thụ API
       │
       ├────→ AGT-027 (Bảo mật) ──── Auth bảo vệ API endpoints
       │
       └────→ AGT-026 (Kiểm thử) ──── Tests xác thực toàn bộ stack
```

### Ví dụ quy trình làm việc điển hình

```
1. AGT-025: Thiết kế REST API quản lý người dùng
2. AGT-028: Tạo PostgreSQL schema (users, sessions, roles)
3. AGT-027: Thêm lớp xác thực OAuth 2.1 + JWT
4. AGT-029: Xây dựng React components (LoginForm, UserProfile, Dashboard)
5. AGT-026: Thiết lập kim tự tháp kiểm thử (unit → integration → E2E)
```

---

## Tích hợp Governance

Tất cả 5 kỹ năng đều được quản trị theo mô hình risk/authority chuẩn CVF:

| Kỹ năng | Risk | Lý do mức Risk này |
|---------|------|-------------------|
| AGT-025 | R1 (Tự động) | Chỉ hướng dẫn kiến trúc, không có thao tác phá hủy |
| AGT-026 | R2 (Giám sát) | Chạy tests, sửa đổi CI pipelines |
| AGT-027 | R2 (Giám sát) | Quan trọng bảo mật, thay đổi cấu hình auth |
| AGT-028 | R1 (Tự động) | Hướng dẫn thiết kế schema, không trực tiếp thay đổi DB |
| AGT-029 | R1 (Tự động) | Hướng dẫn kiến trúc component, tạo file |

### Quy tắc leo thang

Nếu AGT-025 khuyến nghị microservices + AGT-028 yêu cầu multi-database → **leo thang lên R3** (cần Orchestrator phê duyệt cho triển khai đa dịch vụ).

---

## Tiếp theo?

- Khám phá đầy đủ các đặc tả `.gov.md` trong [Agent Skills Registry](../../../governance/skill-library/registry/agent-skills/INDEX.md)
- Kết hợp với [AGT-023 Systematic Debugging](intelligence-skills-v3.md) cho quy trình phát triển end-to-end
- Dùng [AGT-019 Skill Progressive Loader](using-new-skills-v2.md) để chỉ tải kỹ năng cần thiết cho mỗi tác vụ
