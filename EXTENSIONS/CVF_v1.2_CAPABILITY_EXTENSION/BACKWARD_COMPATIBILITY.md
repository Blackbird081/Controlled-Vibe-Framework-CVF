# Backward Compatibility Policy

## Purpose
Tài liệu này định nghĩa **chính sách tương thích ngược** chính thức của
Controlled Vibe Framework (CVF).

Mục tiêu:
- Cho phép CVF tiến hóa mà không phá hệ thống đang vận hành
- Đảm bảo các quyết định cũ vẫn hợp lệ
- Giữ niềm tin khi nâng version

---

## Core Principle

> **Existing behavior must not silently change.**

Bất kỳ thay đổi nào làm:
- AI làm khác đi
- Governance bị nới lỏng
- Quyền lực dịch chuyển

mà không có tuyên bố rõ ràng
→ **vi phạm backward compatibility**.

---

## Compatibility Scope

Backward compatibility áp dụng cho:

- CVF Core semantics
- Phase model
- Decision definitions
- Authority hierarchy
- Audit guarantees

Không áp dụng cho:
- Performance
- Implementation details
- Agent-specific behavior

---

## Version-Level Guarantees

### Minor Versions (v1.x)
CVF đảm bảo:
- Không phá core behavior
- Không vô hiệu quyết định cũ
- Không yêu cầu migrate bắt buộc

Extension mới:
- Có thể tồn tại song song
- Không ảnh hưởng execution cũ

---

### Major Versions (v2.0+)
CVF có thể:
- Thay đổi core semantics
- Phá backward compatibility

Nhưng:
- Phải công bố rõ
- Phải có migration guide
- Không silent break

---

## Skill Contract Compatibility

- Skill Contract có version riêng
- Contract cũ vẫn hợp lệ cho execution cũ
- Contract mới **không tự động thay thế** contract cũ

Không được:
- Overwrite contract cũ
- Silent upgrade

---

## Capability Compatibility

- `CAPABILITY_ID` bất biến
- Hành vi thay đổi → capability mới
- Capability cũ có thể:
  - ACTIVE
  - DEPRECATED
  - RETIRED

Không reuse ID cho hành vi khác.

---

## Registry Compatibility

- Registry phải resolve đúng capability version
- Registry không được:
  - Redirect execution
  - Auto-map capability

---

## Deprecation Guarantees

Deprecated:
- Không bị xóa ngay
- Có warning rõ
- Có thời gian chuyển tiếp

Retired:
- Không còn execution
- Chỉ giữ cho audit

---

## Forbidden Changes

Các thay đổi **BỊ CẤM**:

- Thay đổi ý nghĩa Decision
- Thay đổi Phase semantics
- Nới governance mặc định
- Thay đổi authority flow

Những thay đổi này **chỉ được phép** ở major version.

---

## Audit & Trace Expectations

Hệ thống CVF-compliant phải:
- Ghi rõ version CVF đang dùng
- Ghi rõ contract version
- Ghi rõ registry resolution

Không trace → coi như không compatible.

---

## Canonical Status

Tài liệu này là **nguồn chân lý duy nhất** cho backward compatibility của CVF.

Mọi diễn giải khác
→ **không có hiệu lực**.
```

