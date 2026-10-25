🚨 03_EXECUTION_RULES/failure_modes.md

Execution Failure Modes

Vì sao cần Failure Modes?

CVF không xử lý lỗi bằng cảm giác.
Mỗi failure phải:

có tên

có loại

có hậu quả rõ ràng

Các Failure Mode chuẩn

1. Input Failure

Input thiếu khối

Input mơ hồ
→ Không được execution

1. Execution Failure

Output sai format

Output thiếu trường
→ Fail ngay

1. Boundary Violation

AI vượt quyền

Operator can thiệp
→ Execution vô hiệu

1. Trace Failure

Không có trace

Trace không tách decision/execution
→ Không audit được

CVF không cho phép “fix nhẹ”

Không có:

“làm lại cho đúng ý”

“sửa chút cho ổn”

“lần sau rút kinh nghiệm”

Mỗi failure = reset chu trình.

Kết thúc Failure Modes.
