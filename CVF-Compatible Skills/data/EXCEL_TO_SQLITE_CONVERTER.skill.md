# 📥 SKILL: EXCEL TO SQLITE CONVERTER
**Version:** 1.0 | **Domain:** Data Integration
**CVF-Compatible:** v1.1+ | **Risk Level:** R1 | **CVF Overlap:** Partial (AGT-017/028 Doc Converter/DB Architect)

## 🎯 Context
Sử dụng khi User cung cấp file Excel (.xlsx) hoặc CSV và muốn đưa vào App để quản lý lâu dài.

## ⛔ Constraints
- KHÔNG được ghi đè dữ liệu cũ nếu chưa có lệnh `CVF:OVERWRITE`.
- PHẢI tự động chuẩn hóa tên cột (Xóa dấu tiếng Việt, thay khoảng trắng bằng dấu gạch dưới `_`).
- PHẢI kiểm tra kiểu dữ liệu: Nếu cột là "Số tiền" mà có chữ, phải báo cáo lỗi qua **Skill 8 (Debug)**.

## ✅ Definition of Done
- AI tạo ra script Python sử dụng `pandas` để đọc file.
- Dữ liệu được đẩy vào bảng SQLite tương ứng.
- Xuất báo cáo: "Đã nhập thành công [X] dòng dữ liệu từ file [Tên file]".