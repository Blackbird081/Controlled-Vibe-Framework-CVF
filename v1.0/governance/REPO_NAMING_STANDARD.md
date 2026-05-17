# REPO NAMING STANDARD  
Controlled Vibe Framework (CVF)

---

## Mục đích
Thiết lập chuẩn đặt tên repository để:
- Nhận diện dự án ngay từ tên
- Tránh nhầm lẫn khi mở rộng team
- Phù hợp với vibe coding (user không quản lý kỹ thuật)

---

## Nguyên tắc chung
- Tên repo phải **rõ ràng – ngắn – có ngữ nghĩa**
- Không dùng từ mơ hồ
- Không viết hoa
- Không dùng ký tự đặc biệt

---

## Cấu trúc tên repository

<domain>-<project>-<type>

### Giải thích
- `domain` : lĩnh vực / nghiệp vụ chính
- `project` : tên dự án cụ thể
- `type` : `app` | `tool` | `framework` | `mvp`

---

## Ví dụ hợp lệ
- `logistics-container-mvp`
- `hr-worklog-app`
- `controlled-vibe-framework`
- `finance-forecast-tool`

---

## Ví dụ không hợp lệ
- `MyProject`
- `test123`
- `vibe_new`
- `CVF_FINAL_VERSION`

---

## Khi nào tạo repo mới
- Dự án mới → repo mới
- MVP chuyển sang sản phẩm → repo mới
- Thay đổi domain → repo mới

Không dùng chung repo cho nhiều dự án.

---

## Trách nhiệm
- AI tuân thủ chuẩn naming
- User không cần quyết định kỹ thuật

---

## Phạm vi áp dụng
- Áp dụng cho toàn bộ dự án dùng CVF
- Không override ở project-level

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Freeze
- Không chỉnh sửa

---
