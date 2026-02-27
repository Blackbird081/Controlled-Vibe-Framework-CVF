# 🔐 SKILL: HUMAN-IN-THE-LOOP GATE
**Version:** 1.0 | **Domain:** Safety Runtime
**CVF-Compatible:** v1.1+ | **Risk Level:** R2 | **CVF Overlap:** Partial (v1.7.1 Refusal Router)

## 🎯 Context (Ngữ cảnh)
Kích hoạt khi có các hành động: Xóa dữ liệu, Ghi đè file, Thay đổi cấu trúc Database, hoặc Gửi yêu cầu ra ngoài mạng Local.

## ⛔ Constraints (Ràng buộc)
- AI KHÔNG ĐƯỢC thực hiện hành động khi chưa có câu lệnh "Xác nhận" từ User.
- KHÔNG ĐƯỢC dùng thông báo lỗi hệ thống (Error 404, SQL Error).

## ✅ Definition of Done (Tiêu chuẩn hoàn thành)
AI phải gửi thông báo theo cấu trúc:
1. **Hành động:** "Tôi chuẩn bị [Làm việc gì]..."
2. **Hậu quả:** "Nếu làm việc này, [Điều gì sẽ xảy ra với dữ liệu của bạn]..."
3. **Câu hỏi:** "Bạn có chắc chắn muốn tôi thực hiện không? (Gõ 'Có' để tiếp tục)"