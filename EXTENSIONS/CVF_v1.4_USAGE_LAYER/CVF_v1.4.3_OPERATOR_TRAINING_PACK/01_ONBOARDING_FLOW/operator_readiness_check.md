Mục đích
File này là gate kiểm soát chất lượng con người, không phải thủ tục hình thức.
Operator KHÔNG được xử lý task thật nếu chưa qua readiness check này.

1. Nguyên tắc cốt lõi

CVF không tin vào “đã đọc tài liệu”

CVF chỉ tin vào hành vi có thể quan sát

Readiness ≠ kiến thức
→ Readiness = ra quyết định đúng trong bối cảnh mơ hồ

1. Khi nào cần thực hiện readiness check

Thực hiện bắt buộc khi:

Operator mới

Operator quay lại sau >14 ngày không active

Operator chuyển role (observer → executor)

Operator từng gây incident mức ⚠️ trở lên

1. Cấu trúc readiness check (15–20 phút)
3.1. Self-Assessment nhanh (5 phút)

Operator tự trả lời, không tra tài liệu:

| Câu hỏi                                             | Yêu cầu                 |
| --------------------------------------------------- | ----------------------- |
| Khi nào **không được hỏi AI**?                      | Nêu được ≥ 2 tình huống |
| Khi nào **phải escalate**?                          | Nhận diện đúng boundary |
| Thứ tự ưu tiên: Correctness – Speed – Completeness? | Trả lời đúng thứ tự     |
| Một ví dụ task **nên từ chối xử lý**                | Có lý do hợp lệ         |

👉 Nếu trả lời mang tính chung chung → fail ngay

3.2. Scenario Check (10 phút – bắt buộc)

Operator được đưa 2 scenario ngắn, ví dụ:

Scenario A

Task yêu cầu “làm nhanh cho kịp deadline”, dữ liệu đầu vào thiếu 1 phần quan trọng.

Yêu cầu operator:

Quyết định: Làm / Dừng / Escalate

Giải thích ngắn – logic – không văn vẻ

✅ Pass nếu:

Ưu tiên correctness

Không “tự bịa cho xong”

Scenario B

AI trả kết quả có vẻ hợp lý, nhưng operator không chắc logic bên trong.

Yêu cầu:

Operator chọn hành động tiếp theo

Nêu rõ điểm nghi ngờ

✅ Pass nếu:

Không “tin AI vì thấy ổn”

Biết dừng đúng lúc

3.3. Responsibility Acknowledgement (2 phút)

Operator phải xác nhận rõ ràng:

Tôi hiểu:

Tôi chịu trách nhiệm cuối cùng

AI chỉ là công cụ

Tôi chấp nhận:

Bị rollback quyền nếu vi phạm nguyên tắc CVF

Bị audit log bất kỳ lúc nào

👉 Không đồng ý = không onboard

1. Kết quả readiness
| Kết quả        | Ý nghĩa                           |
| -------------- | --------------------------------- |
| ✅ Pass         | Được cấp quyền xử lý task thật    |
| ⚠️ Conditional | Chỉ xử lý task low-risk           |
| ❌ Fail         | Quay lại onboarding / shadow mode |
2. Các lỗi phổ biến khiến operator fail

“AI nói vậy nên em làm theo”

Ưu tiên speed hơn correctness

Không phân biệt uncertain vs wrong

Né escalation vì sợ chậm tiến độ

👉 CVF coi đây là risk behavior, không phải lỗi cá nhân.

1. Nguyên tắc quan trọng (in đậm cho operator)

CVF thà chậm còn hơn sai.
CVF thà dừng sớm còn hơn sửa hậu quả.
CVF không cần anh hùng, chỉ cần người có kỷ luật.
