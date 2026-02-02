# JOB JOB-101 – Blueprint

## 1. Tóm tắt

Xây dựng REST API module cho Product management trong hệ thống e-commerce Django. Module này sẽ nằm trong app `products/` và expose các endpoints theo RESTful convention.

## 2. Luồng chính (Main Flow)

```
[Client Request] → [JWT Auth] → [Permission Check] → [ViewSet] → [Serializer] → [Model] → [Database]
                                                                                    ↓
[Client Response] ← [Serializer] ← [ViewSet] ←──────────────────────────────────────┘
```

**Chi tiết:**
1. Client gửi request với JWT token
2. Middleware xác thực token (đã có sẵn)
3. ViewSet kiểm tra permission
4. ViewSet gọi Serializer để validate/transform data
5. Serializer interact với Model
6. Model thực hiện database operations
7. Response trả về qua Serializer → ViewSet → Client

## 3. Thành phần & File liên quan

| Thành phần | Mô tả | File/Path |
|------------|-------|-----------|
| Model | Product model | `products/models.py` |
| Serializer | CRUD serializers | `products/serializers.py` |
| ViewSet | API logic | `products/views.py` |
| URLs | Route config | `products/urls.py` |
| Filters | Filter classes | `products/filters.py` |
| Tests | API tests | `products/tests/` |
| Admin | Admin interface | `products/admin.py` |

**Cấu trúc thư mục:**
```
products/
├── __init__.py
├── models.py
├── serializers.py
├── views.py
├── urls.py
├── filters.py
├── admin.py
├── migrations/
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_serializers.py
    └── test_views.py
```

## 4. Rủi ro & Giả định

**Rủi ro:**
| Rủi ro | Mức độ | Cách giảm thiểu |
|--------|--------|-----------------|
| Conflict với existing code | Trung bình | Review kỹ trước khi merge |
| Performance khi list lớn | Thấp | Có pagination, thêm index sau |
| JWT integration issues | Thấp | Dùng lại existing auth system |

**Giả định:**
- JWT authentication đã được setup và hoạt động
- PostgreSQL đã có và connect được
- User model có field `is_staff` để check admin

## 5. Ghi chú thêm

**API Response Format:**
```json
{
  "count": 100,
  "next": "http://api/products/?offset=20",
  "previous": null,
  "results": [...]
}
```

**Product Status Options:**
- `draft`: Chưa publish
- `active`: Đang bán
- `archived`: Đã ngừng bán
