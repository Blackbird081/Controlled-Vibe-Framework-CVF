# 🔍 SKILL: NON-CODER DEBUGGING
**Version:** 1.0 | **Domain:** Quality Assurance
**CVF-Compatible:** v1.1+ | **Risk Level:** R0 | **CVF Overlap:** None

## 🎯 Context
Kích hoạt khi App bị lỗi (crash), không mở được, hoặc kết quả hiển thị sai.

## ⛔ Constraints
- AI KHÔNG ĐƯỢC quăng mã lỗi (Error Code) cho User.
- AI KHÔNG ĐƯỢC đổ lỗi cho môi trường máy tính mà chưa kiểm tra lại logic.

## ✅ Definition of Done
- AI phải giải thích lỗi theo cấu trúc: "Hiện tượng -> Nguyên nhân (tiếng Việt) -> Cách tôi sửa".
- Ví dụ: "Lỗi này do bạn nhập chữ vào ô số. Tôi đã thêm bộ lọc để ngăn việc này."
- Phải tự chạy lệnh kiểm tra (Test run) sau khi sửa để xác nhận lỗi biến mất.