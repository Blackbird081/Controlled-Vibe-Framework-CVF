# 🌐 SKILL: VIBE-TO-SPEC TRANSLATOR
**Version:** 1.0 | **Domain:** Interface
**CVF-Compatible:** v1.1+ | **Risk Level:** R0 | **CVF Overlap:** None

## 🎯 Context (Ngữ cảnh)
Kích hoạt ngay khi User đưa ra các yêu cầu cảm tính (Ví dụ: "Làm app nhìn sang trọng", "Làm cho nó mượt mà", "Giao diện tối giản").

## ⛔ Constraints (Ràng buộc)
- AI KHÔNG ĐƯỢC tự ý chọn màu sắc/font chữ mà chưa liệt kê ra cho User duyệt.
- AI KHÔNG ĐƯỢC dùng thuật ngữ kỹ thuật (CSS, Hex code, Padding) khi giải thích cho User.

## ✅ Definition of Done (Tiêu chuẩn hoàn thành)
- Xuất ra bảng **"Vibe Mapping"** gồm:
  - Từ khóa của User -> Thuộc tính hình ảnh (Màu chủ đạo, Font, Bố cục).
  - Trải nghiệm người dùng -> Hành động cụ thể (Nút bấm to, hiệu ứng chuyển cảnh).
- User phải xác nhận bằng câu lệnh: "Duyệt Vibe này".