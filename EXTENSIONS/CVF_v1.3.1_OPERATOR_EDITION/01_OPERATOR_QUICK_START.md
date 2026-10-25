# 🚀 01_OPERATOR_QUICK_START.md

**CVF v1.3.1 – Operator Edition**

---

## Mục tiêu của tài liệu này

Giúp **Operator**:

* sử dụng CVF **đúng vai**
* hoàn thành **1 chu trình đầy đủ** mà **không cần hiểu CVF core**
* **không can thiệp execution**
* audit được kết quả trong **≤ 5 phút**

> Nếu bạn phải đọc thêm tài liệu khác để “hiểu cho rõ” → bạn đang dùng sai CVF.

---

## Chu trình tối thiểu (Minimal Operational Loop)

CVF cho Operator chỉ có **4 bước**:

1. Chuẩn bị input
2. Giao execution cho AI
3. Nhận output + trace
4. Audit & kết luận

Không có bước 5.

---

## Bước 1 — Chuẩn bị Input

### Operator phải đảm bảo

* Input **đầy đủ theo input contract**
* Không chứa yêu cầu mơ hồ
* Không chứa “gợi ý cách làm”

### Operator **không được**

* mô tả logic thực hiện
* đề xuất phương án
* đưa tiêu chí ngoài contract

📌 Quy tắc:

> *Input mô tả “cái gì cần ra”,
> không mô tả “làm thế nào”.*

---

## Bước 2 — Giao Execution cho AI

Sau khi input đã hợp lệ:

* Giao **toàn bộ execution** cho AI
* Không chỉnh sửa prompt
* Không hỏi thêm
* Không can thiệp

Trong giai đoạn này:

* Operator **không đồng hành suy nghĩ**
* Operator **không theo dõi tiến trình**
* Operator **không can thiệp để “đỡ sai”**

📌 Nếu bạn thấy muốn “nhắc thêm” → **dừng lại**.

---

## Bước 3 — Nhận Output + Trace

Một kết quả hợp lệ **bắt buộc** có:

* Output theo đúng format đã định nghĩa
* Trace kèm theo (decision / execution / boundary)

Nếu thiếu **một trong hai**:
→ Output **không hợp lệ**, không cần đọc tiếp.

---

## Bước 4 — Audit trong 5 phút

Operator audit theo **thứ tự cố định**:

### 4.1 Kiểm tra Output Contract

* Có đủ trường không?
* Đúng định dạng không?
* Có phần nào ngoài contract không?

❌ Sai → Fail (Execution Failure)

---

### 4.2 Kiểm tra Trace

* Trace có tồn tại không?
* Trace có tách decision / execution không?
* Trace có né trách nhiệm không?

❌ Sai → Fail (Trace Violation)

---

### 4.3 Đánh giá Boundary

* AI có vượt quyền không?
* Có tự thêm giả định không?
* Có tự mở rộng phạm vi không?

❌ Sai → Fail (Boundary Violation)

---

## Sau Audit: Operator làm gì?

### Nếu PASS

* Chấp nhận output
* Kết thúc chu trình
* Không tối ưu thêm

### Nếu FAIL

* Ghi nhận loại failure
* Không sửa prompt
* Không cho AI “làm lại cho đúng ý”

📌 Mọi “làm lại” chỉ được thực hiện khi **input contract được viết lại từ đầu**.

---

## Những sai lầm phổ biến của Operator

Bạn đang **lệch CVF** nếu:

* đánh giá output bằng cảm giác
* hỏi AI “sao không làm cách khác”
* yêu cầu AI giải thích thêm ngoài trace
* cho rằng “AI hiểu sai ý mình”

Trong CVF:

> Không có “hiểu sai ý”.
> Chỉ có **input sai** hoặc **execution sai**.

---

## Checklist nhanh (1 phút)

Trước khi kết luận, tự hỏi:

* Tôi có can thiệp execution không?
* Tôi có đánh giá ngoài contract không?
* Tôi có yêu cầu AI chịu trách nhiệm không?

Nếu **có bất kỳ “có” nào** → audit không hợp lệ.

---

## Kết luận

CVF không yêu cầu Operator thông minh hơn.
CVF yêu cầu Operator **kỷ luật hơn**.

> *Đưa luật rõ → để AI làm → kiểm tra kết quả → dừng.*

---

**Kết thúc Quick Start.**
