# Domain Map  
Controlled Vibe Framework (CVF)

---

## Mục đích
Thư mục `domain_map/` dùng để mô tả:
- Miền nghiệp vụ (domain) của dự án
- Các khái niệm chính
- Cách gọi tên chuẩn được sử dụng xuyên suốt

Domain map **không phải tài liệu kỹ thuật** và **không phải đặc tả chi tiết**.

---

## Vì sao domain map quan trọng trong vibe coding
Trong vibe coding:
- User thường mô tả bằng ngôn ngữ tự nhiên
- AI dễ suy diễn sai khái niệm
- Cùng một từ có thể mang nhiều nghĩa

Domain map giúp:
- Giảm hiểu nhầm
- Giữ tính nhất quán ngôn ngữ
- Tạo “ranh giới ngữ nghĩa” cho AI

---

## Nội dung nên có
Domain map có thể bao gồm:
- Danh sách thuật ngữ chính
- Định nghĩa ngắn gọn cho từng thuật ngữ
- Quan hệ cơ bản giữa các khái niệm

Ví dụ:
- Khái niệm A khác gì khái niệm B
- Từ nào **không được dùng thay thế**

---

## Nội dung không nên có
Không đưa vào domain map:
- Luồng xử lý chi tiết
- Quyết định sản phẩm
- Logic thuật toán
- Hướng dẫn triển khai

---

## Mối quan hệ với các file khác
- Nếu thay đổi thuật ngữ ảnh hưởng phạm vi dự án  
  → ghi Decision ở project-level
- Domain map hỗ trợ:
  - Phase A — Discovery
  - Phase B — Design

Không override intent của user.

---

## Quy tắc sử dụng
- Domain map được cập nhật khi hiểu biết domain thay đổi
- Không chỉnh sửa domain map để “hợp thức hóa” output sai
- Có thể bỏ trống ở dự án nhỏ

---

## Trạng thái
- Thuộc CVF v1.0 FINAL
- Nội dung linh hoạt theo từng project
- Không freeze ở cấp framework

---
