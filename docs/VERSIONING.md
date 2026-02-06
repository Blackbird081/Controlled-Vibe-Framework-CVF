# CVF Versioning Policy

## Purpose
Tài liệu này định nghĩa **chính sách versioning chính thức** của Controlled Vibe Framework (CVF).

Mục tiêu:
- Cho phép CVF tiến hóa có kiểm soát
- Tránh phá vỡ backward compatibility
- Giữ CVF đủ ổn định để dùng lâu dài và audit được

---

## Versioning Scheme

CVF sử dụng **Semantic Versioning**:

```

MAJOR.MINOR

```

Ví dụ:
- `v1.0` — Foundation
- `v1.1` — Governance Refinement
- `v1.2` — Capability Extension
- `v1.3` — Implementation Toolkit

Không sử dụng PATCH version cho framework core.

### Current Status

| Version | Name | Status | Date |
|---------|------|--------|------|
| v1.0 | Foundation | FROZEN | 2025 |
| v1.1 | Governance Refinement | FROZEN | 2025 |
| v1.2 | Capability Extension | FROZEN | 01/2026 |
| v1.3 | Implementation Toolkit | FROZEN | 29/01/2026 |
| v1.6 | Agent Platform (Web App) | ✅ ACTIVE | 06/02/2026 |

---

## Version Meaning

### MAJOR Version
Thay đổi **MAJOR** xảy ra khi:
- Thay đổi triết lý cốt lõi của CVF
- Thay đổi core governance model
- Phá backward compatibility

Ví dụ:
- Thay đổi định nghĩa Phase
- Thay đổi Decision model
- Thay đổi authority hierarchy

⛔ Những thay đổi này **rất hiếm**.

---

### MINOR Version
Thay đổi **MINOR** xảy ra khi:
- Bổ sung capability / extension mới
- Làm rõ governance mà không phá core
- Mở rộng CVF theo chiều sâu

Ví dụ:
- CVF v1.2 – Capability Extension
- Bổ sung Skill Contract, Registry, Lifecycle

✔ Không phá v1.x usage hiện có  
✔ Không yêu cầu migrate bắt buộc

---

## Version Scope

| Thành phần | Versioning |
|----------|-----------|
| CVF Core | Theo version CVF |
| Extensions | Gắn với version CVF |
| Skill Contract | Version riêng |
| Capability | ID bất biến |
| Registry | Theo CVF version |

---

## Extension Versioning

Extension **KHÔNG** có version độc lập.

Mỗi extension:
- Thuộc về một CVF version cụ thể
- Phải tuân thủ core của version đó

Ví dụ:
- `CVF_v1.2_CAPABILITY_EXTENSION` chỉ hợp lệ trong CVF v1.2+

---

## Backward Compatibility Rules

- CVF luôn ưu tiên backward compatibility
- Minor version **không được phá** behavior cũ
- Nếu cần phá:
  - Phải nâng MAJOR
  - Hoặc tạo extension mới

---

## Deprecation Policy

Một thành phần bị deprecated khi:
- Có mô hình governance tốt hơn
- Có rủi ro đã được xác định
- Không còn phù hợp với triết lý CVF

Deprecated:
- Không bị xóa ngay
- Luôn có lý do rõ ràng
- Luôn có hướng thay thế (nếu có)

---

## Freeze & Stability

Một version được coi là **FROZEN** khi:
- Architecture đã chốt
- Governance đã đủ
- Không còn mở rộng scope

Sau freeze:
- Chỉ cho phép:
  - Sửa typo
  - Làm rõ documentation
- Không cho phép:
  - Thêm capability mới
  - Thêm governance mới
  - Thay đổi behavior

---

## Release Naming Convention

```

CVF vX.Y – <Short Descriptor>

```

Ví dụ:
- CVF v1.0 – Foundation
- CVF v1.1 – Governance Refinement
- CVF v1.2 – Capability Extension
- CVF v1.3 – Implementation Toolkit

---

## Authority

- Quyết định version thuộc về **CVF Core Authority**
- Agent, tool, hoặc external system **không có quyền** quyết định version

---

## Canonical Status

Tài liệu này là **nguồn chân lý duy nhất** cho versioning của CVF.

Mọi diễn giải khác đều **không có hiệu lực**.
```


