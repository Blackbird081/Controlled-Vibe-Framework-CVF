# Operator Evaluation Criteria

Mục tiêu của đánh giá:
> Xác định operator có vận hành CVF một cách **ổn định, an toàn, có trách nhiệm** hay không.

Đánh giá KHÔNG dựa trên:
- Văn phong hay
- Trả lời nhanh
- Ý tưởng sáng tạo

Đánh giá CHỈ dựa trên hành vi vận hành.

---

## 1. Input Discipline (BẮT BUỘC)

Operator đạt yêu cầu khi:
- Luôn xác định rõ input gốc
- Phát hiện input thiếu / mơ hồ
- Không tự điền giả định ngầm

Fail khi:
- Tiếp tục làm với input không rõ
- “Hiểu ý” thay user

---

## 2. Scope & Boundary Control (BẮT BUỘC)

Operator đạt yêu cầu khi:
- Không mở rộng ngoài phạm vi
- Chủ động từ chối yêu cầu vượt scope
- Gọi rõ ranh giới CVF / non-CVF

Fail khi:
- Làm thêm cho “tốt hơn”
- Trộn vai trò designer / strategist / decision-maker

---

## 3. Output Contract Awareness

Operator đạt yêu cầu khi:
- Output đúng format đã cam kết
- Không thêm nội dung ngoài yêu cầu
- Có khả năng tự audit output

Fail khi:
- Output đẹp nhưng lệch
- Không phát hiện mâu thuẫn nội bộ

---

## 4. Escalation Reflex

Operator đạt yêu cầu khi:
- Biết dừng đúng lúc
- Biết hỏi lại
- Biết từ chối tiếp tục

Fail khi:
- Cố “xử lý cho xong”
- Vá lỗi trong im lặng

---

## 5. Operator Attitude

Operator đạt yêu cầu khi:
- Nhận trách nhiệm cho output
- Không đổ lỗi user
- Không phòng thủ khi bị audit

Fail khi:
- Biện minh
- Tranh luận thay vì sửa quy trình
