Early Warning Signals – Dấu hiệu cảnh báo sớm

Tài liệu này giúp operator phát hiện sớm trạng thái lệch trước khi thành lỗi rõ ràng. Mục tiêu: dừng kịp thời – chỉnh đúng chỗ – tránh tích lũy rủi ro.

1. Early Warning Signal là gì?

Early Warning Signal là tín hiệu nhỏ nhưng lặp lại, cho thấy:

Cách dùng CVF đang lệch

Input/expectation chưa được khóa

Operator sắp can thiệp sai vai trò

Nhận diện sớm giúp không cần đến Reject nặng.

2. Nhóm tín hiệu từ HÀNH VI operator
EWS-01: Do dự kéo dài khi viết input

Viết rồi xóa nhiều lần

Không chắc AI có được phép tự quyết

→ Dấu hiệu scope/expectation chưa rõ.

EWS-02: Muốn “giải thích thêm cho AI”

Cảm giác AI sẽ hiểu sai

Muốn thêm ví dụ giữa chừng

→ Dấu hiệu sắp can thiệp execution.

EWS-03: So sánh output với mong muốn cá nhân

Đánh giá theo cảm tính

Thất vọng dù output đúng contract

→ Dấu hiệu Expectation Drift.

3. Nhóm tín hiệu từ KẾT QUẢ lặp lại
EWS-04: Partial Failure lặp lại

Nhiều lần thiếu cùng một section

Nội dung mỏng ở cùng điểm

→ Dấu hiệu input chưa cung cấp đủ tín hiệu.

EWS-05: Retry tăng dần

Phải retry nhiều hơn 1–2 lần

Mỗi lần chỉnh nhỏ

→ Dấu hiệu prompt overfitting.

4. Cách phản ứng ĐÚNG khi thấy tín hiệu

Dừng lại (không chạy thêm)

Xác định EWS đang gặp

Quay về file gốc tương ứng:

Scope → 00_SCOPE_AND_BOUNDARY.md

Input → 02_INPUT_CONTRACT/

Expectation → GUIDED_MODE/

⛔ Không dùng retry để che tín hiệu.

5. Khi nào cần escalation?

Escalate khi:

Cùng EWS xuất hiện ≥ 3 lần

Operator bắt đầu sửa output

Boundary có nguy cơ bị mở rộng

Tham chiếu: 14_LIGHT_GOVERNANCE/escalation_flow.md

CVF vận hành tốt nhất khi lỗi bị phát hiện sớm hơn cả khi nó xảy ra.