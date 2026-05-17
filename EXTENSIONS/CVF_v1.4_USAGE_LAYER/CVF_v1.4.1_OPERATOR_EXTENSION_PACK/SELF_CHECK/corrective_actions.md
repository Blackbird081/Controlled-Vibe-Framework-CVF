Corrective Actions – Hành động sửa sai đúng cách

Tài liệu này định nghĩa những hành động sửa sai ĐƯỢC PHÉP khi phát hiện misuse, warning signal hoặc failure. Mục tiêu: sửa đúng chỗ – không vá – không phá core.

1. Nguyên tắc sửa sai

Corrective Action trong CVF phải tuân thủ:

Không can thiệp execution đang chạy

Không chỉnh sửa output đã sinh

Không mở rộng scope để chữa lỗi

Mọi sửa sai phải dẫn tới execution mới

Nếu một hành động vi phạm ≥ 1 nguyên tắc trên → KHÔNG hợp lệ.

2. Bảng ánh xạ: Tín hiệu → Hành động
Tình huống	Hành động đúng	File tham chiếu
Misuse Pattern	Dừng + viết lại input	misuse_patterns.md
Early Warning Signal	Dừng + rà scope/input	early_warning_signals.md
Partial Failure	Reject + execution mới	SCENARIO_PACKS/partial_failure.md
Operator Error	Reset input	SCENARIO_PACKS/operator_error.md
Boundary Violation	Reject + log	SCENARIO_PACKS/boundary_violation.md
3. Các Corrective Action hợp lệ
CA-01: Input Reset

Viết lại input ngắn hơn

Bỏ toàn bộ ràng buộc thừa

Giữ đúng scope

Dùng khi: misuse, partial failure lặp lại

CA-02: Scope Tightening

Thu hẹp phạm vi nhiệm vụ

Loại bỏ mục tiêu phụ

Dùng khi: EWS-01, EWS-04

CA-03: Expectation Re-alignment

Xác định lại điều gì là đủ

Ngừng so sánh cảm tính

Dùng khi: Expectation Drift

CA-04: Controlled Retry

Retry tối đa 1 lần

Giữ nguyên input

Chỉ dùng cho lỗi trình bày/format

4. Những hành động KHÔNG được xem là Corrective
Hành động	Vì sao bị cấm
Sửa output	Phá audit
Prompt nối	Mất trace
Thêm ràng buộc giữa chừng	Drift execution
Giữ lại phần "hay"	Hợp thức hóa sai
5. Khi nào cần escalation?

Escalate khi:

Corrective Action lặp ≥ 2 lần không hiệu quả

Operator bắt đầu vượt vai trò

Boundary có dấu hiệu bị xói mòn

Tham chiếu: 14_LIGHT_GOVERNANCE/escalation_flow.md

Corrective Action tốt không làm CVF thông minh hơn, mà làm operator kỷ luật hơn.