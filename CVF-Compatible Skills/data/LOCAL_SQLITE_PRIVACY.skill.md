# 🔐 SKILL: LOCAL-FIRST SQLITE
**Version:** 1.0 | **Domain:** Data Architecture
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** Partial (AGT-028 Database Architect)

## 🎯 Context
Sử dụng khi lưu trữ dữ liệu cá nhân, tài chính hoặc nhạy cảm trên máy tính Windows.

## ⛔ Constraints
- CẤM lưu dữ liệu vào file `.txt` hoặc `.csv` (dễ lỗi định dạng). PHẢI dùng SQLite (`.db`).
- CẤM gửi dữ liệu ra bên ngoài qua bất kỳ API nào trừ khi có lệnh `CVF:CONNECT_OUTSIDE`.
- KHÔNG được tạo bảng mà không có `id PRIMARY KEY` (để dễ mở rộng/sửa/xóa).

## ✅ Definition of Done
- File database phải tự khởi tạo nếu chưa tồn tại.
- Code phải có khối `try...except` khi truy vấn để tránh crash app nếu file bị hỏng.
- Có hàm `backup_database()` đơn giản.