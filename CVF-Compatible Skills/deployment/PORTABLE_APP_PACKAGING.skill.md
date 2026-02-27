# 📦 SKILL: EASY PORTABLE PACKAGING
**Version:** 1.0 | **Domain:** Delivery
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** None

## 🎯 Context
Sử dụng ở cuối Phase D (Review) để chuẩn bị bàn giao sản phẩm.

## 📜 Quy tắc đóng gói (Vibe Logic)
- **Cấu trúc:** Mọi thứ phải nằm trong 1 Folder.
- **Tiện ích:** Phải có file khởi động `.bat` (Windows) hoặc `.sh` (Mac/Linux).
- **Tự động:** File khởi động phải tự kiểm tra và cài đặt thư viện thiếu (`pip install -r requirements.txt`) ngay lần đầu mở.

## ✅ Definition of Done
- User có thể nén Folder thành file `.zip`, gửi cho người khác và họ mở được app chỉ bằng 1 cú click.