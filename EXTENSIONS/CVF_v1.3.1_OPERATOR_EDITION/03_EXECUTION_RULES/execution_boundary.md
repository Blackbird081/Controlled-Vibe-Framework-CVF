📄 03_EXECUTION_RULES/execution_boundary.md

Execution Boundary Definition

Execution Boundary là gì?

Boundary là:

ranh giới quyền lực

nơi trách nhiệm được gắn

AI không được vượt boundary, Operator không được xâm nhập boundary.

Boundary của Operator

Operator chỉ được:

chuẩn bị input

nhận output

audit

Operator không được:

can thiệp logic

điều chỉnh execution

đánh giá theo cảm giác

Boundary của AI

AI được:

tự quyết execution strategy

tự chịu trách nhiệm kết quả

AI không được:

mở rộng scope

thêm giả định

đổi format output

né trace

Boundary Violation Types
Loại	Mô tả
Operator Intrusion	Operator can thiệp execution
AI Overreach	AI vượt scope
Silent Assumption	AI tự thêm giả định
Trace Evasion	AI không trace rõ

Chỉ cần 1 violation → execution FAIL.

Kết thúc boundary.