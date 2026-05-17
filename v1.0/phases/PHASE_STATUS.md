# PHASE STATUS  
Controlled Vibe Framework (CVF)

---

## Mục đích
File này dùng để:
- Theo dõi phase hiện tại của dự án
- Ghi nhận trạng thái hoàn tất của từng phase
- Làm điểm tham chiếu chung cho user và AI

PHASE_STATUS **không chứa hướng dẫn** và **không thay thế các file phase**.

---

## Cấu trúc trạng thái

### Trạng thái phase
Mỗi phase chỉ có một trong các trạng thái:
- `NOT_STARTED`
- `IN_PROGRESS`
- `COMPLETED`
- `BLOCKED`

Không sử dụng trạng thái khác.

---

## Quy tắc cập nhật
- Chỉ cập nhật khi có thay đổi thực tế
- Không cập nhật để “cho xong”
- Không ghi nhận trạng thái không đúng thực tế

---

## Bảng trạng thái (mẫu)

| Phase | Status       | Notes |
|------|--------------|-------|
| A    | NOT_STARTED  |       |
| B    | NOT_STARTED  |       |
| C    | NOT_STARTED  |       |
| D    | NOT_STARTED  |       |

---

## Nguyên tắc sử dụng
- Mỗi phase chỉ được `COMPLETED` khi đáp ứng điều kiện hoàn tất
- Không được bắt đầu phase sau nếu phase trước chưa `COMPLETED`
- Nếu phát hiện vấn đề → chuyển trạng thái sang `BLOCKED`

---

## Vai trò
- AI chịu trách nhiệm cập nhật trạng thái
- User dùng file này để:
  - Biết dự án đang ở đâu
  - Kiểm soát tiến trình mà không cần hỏi

---

## Quan hệ với các file khác
- Không trùng vai với Phase definitions
- Không thay thế Project Init Checklist
- Là file theo dõi, không phải file quyết định

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Áp dụng cho mọi dự án
- Nội dung thay đổi theo từng project

---
