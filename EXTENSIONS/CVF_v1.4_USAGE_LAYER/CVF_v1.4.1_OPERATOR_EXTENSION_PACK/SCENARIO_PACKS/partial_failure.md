Partial Failure – Khi đúng một phần, sai một phần

Tài liệu này mô tả các tình huống kết quả không hoàn toàn thất bại, nhưng không thể dùng trực tiếp. Mục tiêu: giúp operator xử lý đúng mà không phá CVF.

1. Partial Failure là gì?

Partial Failure xảy ra khi:

Output đúng contract một phần

Không vi phạm boundary

Nhưng thiếu, lệch hoặc yếu ở một số section

Đây là trạng thái phổ biến nhất trong vận hành thực tế.

2. Dấu hiệu nhận biết

Bạn đang gặp Partial Failure khi:

Một vài section dùng được, vài section không

Output đúng cấu trúc nhưng nội dung mỏng

Có câu trả lời, nhưng thiếu căn cứ hoặc hành động rõ

⛔ Đây không phải là Happy Path.

3. Phản xạ SAI cần tránh
Phản xạ	Vì sao sai
Sửa tay phần thiếu	Phá audit
Prompt nối tiếp	Mất trace
Chấp nhận tạm	Tích lũy lỗi
4. Cách xử lý ĐÚNG
Bước 1: Reject có điều kiện

Reject output

Ghi rõ lý do: Partial Failure – Section X không đạt

Bước 2: Phân loại nguyên nhân

Hỏi đúng 1 trong 3 câu:

Input có quá mơ hồ không?

Expectation có bị nhồi quá nhiều không?

Scope có quá rộng không?

Bước 3: Execution mới

Điều chỉnh input, không chỉnh output

Chạy execution mới, độc lập

⛔ Không reuse output cũ.

5. Khi nào được Retry ngay?

Retry chỉ được phép khi:

Lỗi mang tính trình bày

Thiếu format rõ ràng

Tham chiếu: 13_FAILURE_UX/retry_vs_reject_policy.md

6. Partial Failure ≠ Lỗi AI

Partial Failure thường cho thấy:

Operator chưa khóa đúng expectation

Input chưa đủ tín hiệu

Xử lý tốt Partial Failure giúp CVF ổn định rất nhanh.

Operator giỏi không né Partial Failure, mà xử lý nó có hệ thống.