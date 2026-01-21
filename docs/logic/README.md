# Logic Notes  
Controlled Vibe Framework (CVF)

---

## Mục đích
Thư mục `logic/` dùng để ghi lại:
- Logic nghiệp vụ ở mức khái niệm
- Chuỗi lập luận dẫn đến cách hệ thống hoạt động
- Các quy tắc suy luận mà AI cần tuân thủ

Đây **không phải** nơi viết code hay pseudo-code.

---

## Vai trò trong vibe coding
Trong vibe coding:
- User thường đánh giá kết quả bằng “có hợp lý không”
- AI cần hiểu **logic mong đợi**, không chỉ output

Logic notes giúp:
- Giữ được “lý do tồn tại” của output
- Tránh AI tối ưu kỹ thuật nhưng sai bản chất
- Hỗ trợ user kiểm tra chất lượng mà không cần đọc code

---

## Nội dung nên ghi
Có thể ghi:
- Nếu A xảy ra thì kỳ vọng B
- Điều kiện loại trừ
- Nguyên tắc ưu tiên
- Các giả định logic quan trọng

Ví dụ:
- Vì sao kết quả này được xem là đúng
- Khi nào output bị xem là sai dù chạy được

---

## Nội dung không nên ghi
Không ghi:
- Chi tiết triển khai
- Cấu trúc dữ liệu
- Thuật toán cụ thể
- Quyết định đã freeze

---

## Mối quan hệ với các file khác
- Logic notes hỗ trợ:
  - Phase B — Design
  - Phase D — Review
- Nếu logic thay đổi làm đổi hướng sản phẩm  
  → ghi Decision ở project-level

Logic notes **không override intent**, chỉ giải thích intent.

---

## Quy tắc sử dụng
- Logic notes phải đọc được bởi người không biết code
- Không dùng logic notes để biện minh cho output sai
- Có thể bỏ trống với dự án rất nhỏ

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Nội dung linh hoạt theo từng project
- Không freeze ở cấp framework

---
