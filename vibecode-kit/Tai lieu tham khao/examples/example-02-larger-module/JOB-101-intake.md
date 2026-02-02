# JOB JOB-101 – Intake

## 1. Bối cảnh & Mục tiêu

**Bối cảnh:**
Hệ thống e-commerce hiện tại không có API để quản lý sản phẩm. Team mobile cần API để build app. Hiện tại đang dùng Django + PostgreSQL.

**Mục tiêu:**
Xây dựng REST API module để CRUD sản phẩm (Product) với các tính năng:
- List, search, filter sản phẩm
- Tạo, sửa, xóa sản phẩm (admin only)
- Phân trang

## 2. Phạm vi (Scope)

**Trong phạm vi:**
- Model: Product (name, description, price, category, image_url, status)
- API endpoints: GET /products, GET /products/:id, POST /products, PUT /products/:id, DELETE /products/:id
- Filter: by category, by status, by price range
- Search: by name
- Pagination: limit/offset
- Authentication: JWT (đã có sẵn trong hệ thống)
- Permission: view = all, create/update/delete = admin

**Ngoài phạm vi:**
- Model Category (dùng string đơn giản)
- Image upload (chỉ lưu URL)
- Inventory management
- Cart integration

## 3. Đầu ra mong muốn (Deliverables)

| # | Deliverable | Mô tả |
|---|-------------|-------|
| 1 | Model Product | Django model với migration |
| 2 | Serializers | DRF serializers cho Product |
| 3 | ViewSet | API endpoints với filter/search/pagination |
| 4 | Tests | Unit tests cho API |
| 5 | API Docs | OpenAPI/Swagger documentation |

## 4. Ràng buộc (Constraints)

**Kỹ thuật:**
- Django 4.x, Django REST Framework 3.x
- PostgreSQL (đã setup)
- Follow existing code style trong project
- Sử dụng django-filter cho filtering

**Thời gian:**
- Hoàn thành trong 2-3 sessions

**Nguồn lực:**
- 1 developer + ChatGPT (architect) + Claude (coder)

## 5. Định nghĩa "xong" (Definition of Done)

- [x] Tất cả endpoints hoạt động đúng
- [x] Permission đúng (admin-only cho write operations)
- [x] Tests coverage > 80%
- [x] API docs có thể xem được
- [x] Code review passed
