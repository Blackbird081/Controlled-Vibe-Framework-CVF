# Trainer Guidelines – CVF Operator Training

Tài liệu này dành cho người **đào tạo operator**, không phải người học.

Mục tiêu của trainer:
> Không truyền cảm hứng, không giảng giải triết lý,  
> mà **định hình phản xạ vận hành đúng CVF**.

---

## 1. Nguyên tắc đào tạo cốt lõi

Trainer PHẢI:
- Dạy bằng tình huống cụ thể
- Ép operator nói ra reasoning
- Ngắt ngay khi operator lệch vai

Trainer KHÔNG:
- Trả lời thay operator
- “Gợi ý cho qua”
- Chấp nhận output chỉ vì “trông ổn”

---

## 2. Cách đặt câu hỏi khi huấn luyện

Câu hỏi đúng:
- Input này đã đủ chưa?
- Scope nằm ở đâu?
- Output này có thể audit không?
- Khi nào cần escalation?

Câu hỏi sai:
- Theo bạn thì nên làm thế nào cho hay?
- Nếu là bạn thì bạn sẽ làm gì thêm?

---

## 3. Quản lý lỗi của operator

Nguyên tắc:
- Lỗi là dữ liệu, không phải thất bại
- Nhưng lỗi lặp lại là fail hệ thống

Cách xử lý:
- Dừng task
- Truy vết nguyên nhân
- Quay về drill tương ứng

---

## 4. Khi nào KHÔNG nên tiếp tục đào tạo

Dừng đào tạo khi operator:
- Tranh luận vai trò
- Không nhận lỗi
- Cố “làm cho xong”

CVF ưu tiên an toàn hơn số lượng operator.
