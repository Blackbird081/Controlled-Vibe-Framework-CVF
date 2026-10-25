📄 02_INPUT_CONTRACT/input_spec_minimal.md

Minimal Input Specification

Tài liệu này mô tả dạng input tối thiểu hợp lệ cho Operator.

1. Objective

Bắt buộc.

Mô tả:

kết quả cuối cùng cần đạt

ở dạng observable & checkable

✅ Đúng:

“Tạo báo cáo X với các trường A, B, C.”

❌ Sai:

“Phân tích để hiểu rõ vấn đề.”
“Đưa ra giải pháp tốt nhất.”

1. Scope

Bắt buộc.

Mô tả:

phạm vi được phép xử lý

phạm vi không được vượt qua

Ví dụ:

thời gian

dữ liệu

nguồn thông tin

đối tượng

📌 Scope không phải checklist công việc.

1. Output Contract

Bắt buộc.

Phải chỉ rõ:

cấu trúc output

format

các trường bắt buộc

Ví dụ:

JSON / Markdown / Table

danh sách field

thứ tự nếu cần

📌 Nếu không định nghĩa output → không audit được.

1. Constraints

Bắt buộc.

Giới hạn AI:

không thêm giả định

không mở rộng scope

không suy diễn ngoài dữ liệu

Constraints không phải cách làm, mà là hàng rào.

Những thứ KHÔNG được có trong Input

Logic thực hiện

Chiến lược tối ưu

Gợi ý phương án

“Nếu có thể thì…”

📌 Những thứ này làm input mất tính pháp lý.

Kết thúc Input Spec.
