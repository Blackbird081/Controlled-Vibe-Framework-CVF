# Design Notes  
Controlled Vibe Framework (CVF)

---

## Mục đích
Thư mục `design_notes/` dùng để ghi lại:
- Các ghi chú thiết kế cấp cao
- Lý do đằng sau các lựa chọn cấu trúc
- Các giả định ban đầu ảnh hưởng đến thiết kế

Đây **không phải** nơi mô tả chi tiết kỹ thuật hoặc implementation.

---

## Khi nào sử dụng
Sử dụng `design_notes/` khi:
- Có lựa chọn thiết kế quan trọng cần ghi nhớ
- Có trade-off đã được cân nhắc
- Có quyết định thiết kế nhưng **chưa đủ mức** để ghi thành Decision

Nếu một lựa chọn:
- Ảnh hưởng lâu dài
- Thay đổi hướng đi dự án  
→ **phải được ghi vào `DECISIONS.md` của project**, không ghi ở đây.

---

## Phạm vi nội dung
Có thể ghi:
- Ý tưởng thiết kế ban đầu
- Các phương án đã loại bỏ
- Lý do chọn A thay vì B

Không ghi:
- Hướng dẫn sử dụng
- Quy trình làm việc
- Checklist
- Quyết định đã freeze

---

## Mối quan hệ với Vibe Coding
Trong vibe coding:
- User có thể không diễn đạt được đầy đủ logic
- Design notes giúp giữ lại **ý định thiết kế ban đầu**
- Tránh việc AI “tối ưu quá tay” về sau

Design notes là **bộ nhớ mềm**, không ràng buộc execution.

---

## Quy tắc
- Không chỉnh sửa design notes để hợp thức hóa output sai
- Không dùng design notes để override intent của user
- Có thể xoá hoặc bỏ qua khi dự án kết thúc

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Nội dung linh hoạt theo từng project
- Không freeze ở cấp framework

---
