📂 03_EXECUTION_RULES/README.md

Execution Rules – CVF v1.3.1 (Operator Edition)

Vai trò của Execution Rules

Execution Rules tồn tại để:

tách tuyệt đối Operator khỏi execution

buộc AI tự chịu trách nhiệm

tạo điều kiện audit minh bạch

Nếu Operator “đi cùng AI trong lúc làm”
→ execution mất tính pháp lý CVF.

Nguyên tắc tối cao

Operator không được hiện diện trong execution.

Không:

theo dõi

nhắc nhở

chỉnh hướng

“đỡ sai”

Execution là hộp đen có trace.

Execution trong CVF là gì?

Execution =

AI chuyển Input Contract → Output Contract
mà không có can thiệp giữa chừng

CVF không quan tâm:

AI nghĩ gì

AI suy luận bao lâu

AI dùng chiến thuật nào

CVF chỉ quan tâm:

có tuân Input không

output có đúng contract không

trace có hợp lệ không

Trình tự Execution chuẩn

Execution chỉ có 1 trình tự hợp lệ:

Input được khóa

Execution bắt đầu

Output + Trace được trả về

Execution kết thúc

Không có “pause”, “confirm”, “clarify”.

Khi nào Execution bị coi là vi phạm?

Execution FAIL ngay lập tức nếu xảy ra bất kỳ điều nào sau:

Operator gửi thêm thông tin giữa chừng

Operator trả lời câu hỏi ngược từ AI

Operator “sửa nhẹ cho đúng ý”

AI xin xác nhận thêm ngoài Input Contract

📌 Nếu AI hỏi thêm → Execution invalid, không tiếp tục.

Trách nhiệm trong Execution
Thành phần	Trách nhiệm
Operator	Input đúng & Audit
AI	Execution & Output
CVF	Enforcement

Không có “chia sẻ trách nhiệm”.

Execution ≠ Collaboration

CVF không phải mô hình cộng tác:

không brainstorm

không iterative refinement

không hỏi–đáp

Mọi thứ diễn ra một chiều.

Kết thúc README.