Guided Entry – Bắt đầu dùng CVF không sai

File này dành cho operator mới hoặc operator đang thiếu tự tin khi dùng CVF. Nếu bạn đã quen CVF → có thể bỏ qua.

1. Mục đích của Guided Entry

Guided Entry không phải tutorial và không thay thế CVF core.

Nó tồn tại để:

Ngăn operator làm sai ngay từ bước đầu

Đặt đúng kỳ vọng về vai trò của bạn và của AI

Giảm nhu cầu “suy đoán CVF muốn gì”

2. Quy tắc đầu tiên (đọc kỹ)

Operator KHÔNG điều khiển quá trình suy luận của AI.

Nhiệm vụ của operator chỉ gồm:

Chuẩn bị input đúng

Kích hoạt execution

Review output theo contract

Nếu bạn đang cố:

Hướng AI suy nghĩ thế nào

Can thiệp giữa chừng

Sửa prompt liên tục khi AI đang chạy

→ Bạn đang vi phạm tinh thần CVF.

3. Trước khi bắt đầu – Tự hỏi 5 câu này

Trước mỗi lần dùng CVF, hãy tự hỏi:

Tôi muốn kết quả cuối cùng là gì?

Tôi có chấp nhận AI tự quyết bên trong không?

Nếu output sai, tôi có chấp nhận rollback không?

Tôi có đang cố “dạy AI làm từng bước” không?

Tôi có sẵn sàng chịu trách nhiệm với input không?

Nếu có từ 2 câu trở lên trả lời “không chắc” → dừng lại.

4. Lối vào khuyến nghị cho người mới
Bước 1: Dùng input tối thiểu

Không thêm ràng buộc thừa

Không ép format sớm

→ Tham chiếu: 02_INPUT_CONTRACT/input_spec_minimal.md

Bước 2: Chạy CVF một mạch

Không can thiệp giữa chừng

Không chỉnh prompt khi AI đang xử lý

CVF giả định execution là nguyên khối.

Bước 3: Review output – KHÔNG phán xét sớm

Chỉ kiểm tra:

Output có đúng contract không?

Có vi phạm boundary không?

⛔ Chưa đánh giá hay / dở ở bước này.

Bước 4: Nếu có vấn đề

Output sai nhẹ → xem SCENARIO_PACKS/partial_failure.md

Output lệch kỳ vọng → xem SELF_CHECK/misuse_patterns.md

Boundary bị vi phạm → xem SCENARIO_PACKS/boundary_violation.md

5. Những sai lầm phổ biến của operator mới
Sai lầm	Vì sao sai
Prompt quá dài	Làm mờ trách nhiệm AI
Can thiệp giữa chừng	Phá execution integrity
Mong AI hỏi lại	CVF không phải chat
Sửa output thay AI	Phá audit trace
6. Khi nào NÊN rời Guided Mode?

Bạn có thể bỏ Guided Mode khi:

Không còn phải đọc checklist mỗi lần

Input ổn định, output ít lệch

Hiểu rõ boundary của mình

Guided Mode không phải tầng bắt buộc.

Nếu bạn cảm thấy Guided Entry đang “kìm bạn lại” → đó là dấu hiệu bạn đã sẵn sàng bỏ nó.