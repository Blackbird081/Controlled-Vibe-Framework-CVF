# JOB JOB-101 – Contracts

## STEP 1 – Setup app structure và Model

**Mục tiêu:**
- Tạo Django app `products`
- Define Product model với các fields theo spec
- Tạo và chạy migration

**File liên quan:**
- `products/__init__.py`
- `products/models.py`
- `products/admin.py`
- `products/apps.py`
- `settings.py` (add to INSTALLED_APPS)

**Yêu cầu kỹ thuật:**
- Model Product:
  - `name`: CharField(max_length=255)
  - `description`: TextField(blank=True)
  - `price`: DecimalField(max_digits=10, decimal_places=2)
  - `category`: CharField(max_length=100)
  - `image_url`: URLField(blank=True)
  - `status`: CharField với choices (draft, active, archived)
  - `created_at`, `updated_at`: auto timestamp
- Register trong admin với list_display và filters

**Tiêu chí nghiệm thu (GATE 1):**
- [ ] `python manage.py makemigrations` không lỗi
- [ ] `python manage.py migrate` thành công
- [ ] Có thể tạo Product qua Django admin
- [ ] Các fields hiển thị đúng trong admin

---

## STEP 2 – Serializers và basic ViewSet

**Mục tiêu:**
- Tạo ProductSerializer
- Tạo ProductViewSet với basic CRUD
- Config URLs

**File liên quan:**
- `products/serializers.py`
- `products/views.py`
- `products/urls.py`
- `config/urls.py` (include products urls)

**Yêu cầu kỹ thuật:**
- ProductSerializer với tất cả fields
- ProductViewSet kế thừa ModelViewSet
- Đăng ký với DefaultRouter
- Include vào main urls với prefix `/api/products/`

**Tiêu chí nghiệm thu (GATE 2):**
- [ ] GET `/api/products/` trả về list
- [ ] GET `/api/products/:id/` trả về detail
- [ ] POST `/api/products/` tạo mới thành công
- [ ] PUT `/api/products/:id/` update thành công
- [ ] DELETE `/api/products/:id/` xóa thành công

---

## STEP 3 – Filtering và Search

**Mục tiêu:**
- Implement filter by category, status, price range
- Implement search by name
- Add pagination

**File liên quan:**
- `products/filters.py`
- `products/views.py`

**Yêu cầu kỹ thuật:**
- Dùng `django-filter` với FilterSet
- Filters:
  - `category`: exact match
  - `status`: exact match
  - `price_min`, `price_max`: range filter
- Search: `search` param tìm trong `name`
- Pagination: LimitOffsetPagination, default limit=20

**Tiêu chí nghiệm thu (GATE 3):**
- [ ] `/api/products/?category=electronics` filter đúng
- [ ] `/api/products/?status=active` filter đúng
- [ ] `/api/products/?price_min=100&price_max=500` filter đúng
- [ ] `/api/products/?search=phone` tìm đúng
- [ ] Response có `count`, `next`, `previous`, `results`

---

## STEP 4 – Permissions

**Mục tiêu:**
- Implement permission: read = all, write = admin only

**File liên quan:**
- `products/permissions.py`
- `products/views.py`

**Yêu cầu kỹ thuật:**
- Custom permission class `IsAdminOrReadOnly`
- Anonymous user: chỉ GET
- Authenticated non-admin: chỉ GET
- Admin (is_staff=True): full CRUD
- Apply vào ViewSet

**Tiêu chí nghiệm thu (GATE 4):**
- [ ] Anonymous GET → 200 OK
- [ ] Anonymous POST → 401 Unauthorized
- [ ] Normal user POST → 403 Forbidden
- [ ] Admin POST → 201 Created

---

## STEP 5 – Unit Tests

**Mục tiêu:**
- Viết tests cho model, serializer, và API

**File liên quan:**
- `products/tests/__init__.py`
- `products/tests/test_models.py`
- `products/tests/test_serializers.py`
- `products/tests/test_views.py`

**Yêu cầu kỹ thuật:**
- Test model: tạo, validation
- Test serializer: valid/invalid data
- Test views:
  - List, detail, create, update, delete
  - Filter, search, pagination
  - Permissions
- Dùng pytest và pytest-django
- Factory Boy cho test data

**Tiêu chí nghiệm thu (GATE 5):**
- [ ] `pytest` pass tất cả tests
- [ ] Coverage > 80%
- [ ] Không có test skip/xfail

---

## STEP 6 – API Documentation

**Mục tiêu:**
- Setup drf-spectacular cho OpenAPI docs
- Verify docs hiển thị đúng

**File liên quan:**
- `settings.py`
- `config/urls.py`

**Yêu cầu kỹ thuật:**
- Install và config `drf-spectacular`
- Thêm endpoints:
  - `/api/schema/` - OpenAPI schema
  - `/api/docs/` - Swagger UI
- Verify tất cả endpoints hiển thị đúng

**Tiêu chí nghiệm thu (GATE 6):**
- [ ] `/api/docs/` hiển thị Swagger UI
- [ ] Tất cả endpoints có trong docs
- [ ] Có thể test API từ Swagger UI
