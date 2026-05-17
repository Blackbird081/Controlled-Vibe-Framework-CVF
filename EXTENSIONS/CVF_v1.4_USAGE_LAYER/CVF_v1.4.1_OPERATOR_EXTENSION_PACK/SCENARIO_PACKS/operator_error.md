Operator Error – Khi lỗi đến từ con người

Tài liệu này mô tả các lỗi xuất phát từ operator, không phải từ AI hay CVF. Mục tiêu: giúp nhận diện sớm, sửa đúng chỗ, không đổ lỗi sai đối tượng.

1. Operator Error là gì?

Operator Error xảy ra khi:

Input vi phạm scope/boundary

Expectation mâu thuẫn hoặc không rõ

Hành vi sử dụng lệch vai trò (can thiệp execution, sửa output)

Đây là lỗi hệ thống con người, không phải lỗi mô hình.

2. Dấu hiệu nhận biết nhanh

Bạn có khả năng đang mắc Operator Error nếu:

Phải giải thích thêm cho AI sau khi đã chạy

Cảm thấy "AI không hiểu ý mình" nhiều lần

Muốn chỉnh output cho khớp mong muốn

3. Các dạng Operator Error phổ biến
A. Scope Creep

Input mở rộng ngoài phạm vi ban đầu

Giao nhiệm vụ mơ hồ, chồng chéo

Hậu quả: AI suy đoán → boundary risk

B. Expectation Overload

Nhồi nhiều mục tiêu vào một execution

Không ưu tiên rõ ràng

Hậu quả: Partial Failure lặp lại

C. Execution Interference

Can thiệp giữa chừng

Prompt nối tiếp

Hậu quả: Mất trace, không audit được

4. Cách xử lý ĐÚNG

Dừng execution hiện tại

Không lưu output

Quay lại 00_SCOPE_AND_BOUNDARY.md

Viết lại input ngắn hơn, rõ hơn

⛔ Không sửa output để "chữa cháy".

5. Phòng ngừa Operator Error

Dùng 02_INPUT_CONTRACT/input_checklist.md

Tham chiếu GUIDED_MODE/decision_flow.md

Tự kiểm tra bằng SELF_CHECK/

CVF không được thiết kế để bảo vệ operator khỏi chính mình. Nó chỉ làm lộ lỗi nhanh hơn.