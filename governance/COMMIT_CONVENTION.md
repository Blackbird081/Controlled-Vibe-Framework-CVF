# COMMIT CONVENTION  
Controlled Vibe Framework (CVF)

---

## Mục đích
Thiết lập chuẩn commit để:
- Theo dõi tiến trình rõ ràng
- Không tạo nhiễu lịch sử dự án
- Phù hợp với vibe coding (user không can thiệp code)

Commit là **log hành động**, không phải báo cáo kỹ thuật.

---

## Nguyên tắc
- Commit phải **ngắn – rõ – có nghĩa**
- Không giải thích chi tiết kỹ thuật
- Không dùng commit để thảo luận

---

## Cấu trúc commit

[type]: nội dung ngắn gọn

### Các `type` được phép

- `init` – khởi tạo dự án
- `docs` – cập nhật tài liệu
- `design` – thay đổi thiết kế / cấu trúc
- `build` – hoạt động build
- `fix` – sửa lỗi
- `decision` – ghi nhận quyết định
- `review` – điều chỉnh sau review
- `freeze` – đóng băng trạng thái

Không dùng type ngoài danh sách này.

---

## Ví dụ hợp lệ
- `init: create project structure`
- `docs: update phase A discovery`
- `decision: lock scope for MVP`
- `freeze: phase B design completed`

---

## Ví dụ không hợp lệ
- Commit quá dài
- Commit mang tính cảm xúc
- Commit giải thích kỹ thuật chi tiết
- Commit không rõ hành động

---

## Trách nhiệm
- AI phải tuân thủ commit convention
- User không cần viết commit

---

## Phạm vi áp dụng
- Áp dụng cho toàn bộ lifecycle dự án
- Không được override ở project-level

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Freeze
- Không chỉnh sửa

---
