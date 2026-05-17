Fallback Paths – Khi mọi thứ không như mong đợi

File này mô tả các lối thoát hợp lệ khi execution không đạt kết quả mong muốn. Mục tiêu: không phá CVF, không phá audit, không hoảng loạn.

1. Nguyên tắc Fallback

Fallback không phải là sửa chữa giữa chừng.

Fallback là:

Kết thúc execution hiện tại đúng cách

Đánh giá nguyên nhân

Khởi động execution mới có kiểm soát

Không có fallback nào cho phép can thiệp vào execution đang chạy.

2. Phân loại tình huống cần Fallback
Case A – Output sai format

Dấu hiệu:

Thiếu section bắt buộc

Sai cấu trúc

Không parse được

Hành động hợp lệ:

Reject output

Giữ nguyên input

Retry 1 lần

⛔ Không được thêm hướng dẫn format trong lúc retry.

Case B – Output đúng contract nhưng không dùng được

Dấu hiệu:

Đúng boundary

Đúng format

Nhưng không giải quyết được vấn đề thực tế

Hành động hợp lệ:

Accept về mặt kỹ thuật

Ghi nhận Expectation Drift

Điều chỉnh input cho execution mới

→ Tham chiếu: SELF_CHECK/misuse_patterns.md

Case C – Boundary bị vi phạm

Dấu hiệu:

AI suy đoán ngoài scope

Tự ý mở rộng nhiệm vụ

Hành động bắt buộc:

Reject

Log boundary violation

Không retry với input cũ

Case D – Operator mất kiểm soát

Dấu hiệu:

Muốn can thiệp giữa chừng

Muốn giải thích thêm cho AI

Hành động đúng:

Dừng execution

Không lưu kết quả

Quay lại 00_SCOPE_AND_BOUNDARY.md

3. Những fallback KHÔNG ĐƯỢC PHÉP
Hành động	Lý do
Sửa output rồi dùng	Phá audit
Prompt tiếp nối	Mất trace
Hợp thức hóa sai	Drift hệ thống
4. Fallback không phải thất bại

Fallback là cơ chế an toàn của CVF.

Nếu bạn fallback thường xuyên:

Không phải AI kém

Không phải CVF sai

Mà là input hoặc expectation chưa đúng

Một operator giỏi không phải là người ít fallback, mà là người fallback đúng cách.