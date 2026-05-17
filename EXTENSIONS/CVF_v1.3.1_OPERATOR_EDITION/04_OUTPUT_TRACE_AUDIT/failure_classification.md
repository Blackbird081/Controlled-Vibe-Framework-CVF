# ❌ Failure Classification

**CVF v1.3.1 – Operator Edition**

---

## Failure Types

| Code | Tên | Mô tả | Ví dụ |
|:----:|-----|-------|-------|
| **F1** | Input Error | Input mơ hồ, thiếu dữ liệu | "Làm cái gì đó về AI" |
| **F2** | Execution Drift | AI đi lệch scope | AI thêm feature không yêu cầu |
| **F3** | Output Contract Violation | Thiếu/sai format output | Thiếu Assumption Summary |
| **F4** | Expectation Mismatch | Operator kỳ vọng ngoài CVF | Muốn AI "sáng tạo hơn" |

---

## Chi tiết từng loại

### F1 — Input Error

**Nguyên nhân:** Operator
- Input không theo input_spec_minimal
- Thiếu objective rõ ràng
- Chứa yêu cầu mâu thuẫn

**Xử lý:** Viết lại input, không "sửa prompt"

---

### F2 — Execution Drift

**Nguyên nhân:** AI
- Tự thêm giả định không khai báo
- Mở rộng scope
- Đề xuất alternatives không được yêu cầu

**Xử lý:** Log failure, không tiếp tục

---

### F3 — Output Contract Violation

**Nguyên nhân:** AI
- Thiếu Final Result
- Thiếu Assumption Summary
- Thiếu Constraint Compliance
- Yêu cầu operator can thiệp

**Xử lý:** Log failure, không accept output

---

### F4 — Expectation Mismatch

**Nguyên nhân:** Operator
- Kỳ vọng AI "hiểu ngầm"
- Muốn AI làm nhiều hơn contract
- Đánh giá bằng cảm tính

**Xử lý:** Review lại CVF principles, không phải lỗi AI

---

## Common Trace Failures

| Loại | Dấu hiệu | Kết quả |
|------|----------|---------|
| Over-Explanation | AI giải thích quá nhiều | FAIL |
| Missing Boundary | Không tuyên bố boundary | FAIL |
| Responsibility Shift | AI đổ lỗi cho input | FAIL |
| Pseudo-Trace | Trace "có vẻ đúng" nhưng không verify được | FAIL |

---

## Quy tắc xử lý Failure

1. **Ghi log** — failure type + timestamp
2. **Không sửa** — không chỉnh prompt
3. **Không thương lượng** — không hỏi AI "làm lại cho đúng"
4. **Nếu cần làm lại** — viết input contract mới từ đầu

---

*Kết thúc Failure Classification.*
