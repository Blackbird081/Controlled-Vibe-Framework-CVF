undary Violation – Khi ranh giới bị phá

Tài liệu này mô tả các tình huống vi phạm boundary – mức lỗi nghiêm trọng nhất trong CVF. Mục tiêu: nhận diện nhanh – dừng đúng – không hợp thức hóa sai.

1. Boundary Violation là gì?

Boundary Violation xảy ra khi:

AI tự mở rộng phạm vi ngoài input

Thực hiện suy đoán/giả định không được cấp phép

Đề xuất hành động vượt ngoài scope đã định nghĩa

Boundary Violation không phụ thuộc output có “hay” hay không.

2. Dấu hiệu nhận biết

Bạn đang gặp Boundary Violation nếu output:

Tự ý thêm mục tiêu mới

Trả lời các câu hỏi bạn chưa hỏi

Đưa ra khuyến nghị mang tính quyết định ngoài phạm vi

⚠️ Cảm giác “AI làm quá tốt” đôi khi chính là dấu hiệu nguy hiểm.

3. Phản xạ SAI cần tránh
Phản xạ	Vì sao nguy hiểm
Giữ lại phần "hay"	Hợp thức hóa sai
Sửa output để dùng	Phá audit
Prompt lại để thu hẹp	Che lỗi gốc
4. Cách xử lý BẮT BUỘC

Reject ngay lập tức

Log rõ: Boundary Violation

Không retry với input cũ

Review lại scope & boundary

⛔ Không có ngoại lệ.

5. Sau Boundary Violation cần làm gì?

Rà soát lại 00_SCOPE_AND_BOUNDARY.md

Kiểm tra input có vô tình mở cửa không

Thu hẹp nhiệm vụ cho execution mới

Boundary Violation thường là tín hiệu thiết kế sai, không phải lỗi ngẫu nhiên.

6. Boundary Violation ≠ Lỗi AI

Trong CVF:

AI chỉ làm theo không gian được cấp

Boundary bị phá → thường do operator mở sai cửa

CVF chọn cách làm lộ lỗi rõ ràng thay vì che giấu.

Boundary là xương sống của CVF. Một lần bỏ qua boundary = một lần phá hệ thống.