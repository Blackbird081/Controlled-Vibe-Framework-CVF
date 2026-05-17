Misuse Patterns – Những cách dùng CVF sai phổ biến

Tài liệu này giúp operator tự soi lỗi hành vi trước khi lỗi trở thành sự cố hệ thống. Mục tiêu: nhận diện sớm – sửa đúng – không đổ lỗi cho AI.

1. Misuse Pattern là gì?

Misuse Pattern là mẫu hành vi lặp lại của operator khiến CVF:

Cho ra kết quả kém ổn định

Khó audit

Dễ drift boundary

Misuse Pattern không phải lỗi kỹ thuật.

2. Các Misuse Pattern phổ biến
MP-01: Chat hóa CVF

Dùng CVF như hội thoại

Mong AI hỏi lại, gợi ý thêm

Hậu quả: Execution không còn nguyên khối

MP-02: Prompt Overfitting

Nhồi quá nhiều ràng buộc

Viết prompt dài để “chắc ăn”

Hậu quả: Partial Failure, output mỏng

MP-03: Mid-Execution Intervention

Can thiệp giữa chừng

Prompt nối tiếp

Hậu quả: Mất trace, không audit được

MP-04: Output Cosmetic Fix

Sửa câu chữ cho đẹp

Chỉnh format cho tiện dùng

Hậu quả: Hợp thức hóa sai, mất integrity

MP-05: Expectation Drift

Thất vọng dù output đúng contract

Đánh giá theo cảm tính

Hậu quả: Prompt vòng lặp vô hạn

3. Cách tự kiểm tra nhanh

Trước khi blame AI, hỏi 3 câu:

Tôi có can thiệp execution không?

Tôi có sửa output không?

Tôi có đổi kỳ vọng sau khi chạy không?

Nếu có ≥ 1 câu trả lời là CÓ → khả năng cao là Misuse.

4. Cách xử lý khi phát hiện Misuse

Dừng execution hiện tại

Không dùng output

Quay lại input checklist

Chạy execution mới, sạch

⛔ Không cố "vá" misuse.

CVF không ngăn misuse. Nó chỉ làm misuse lộ ra nhanh hơn.