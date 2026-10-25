# 📄 00_SCOPE_AND_BOUNDARY.md

**Scope & Boundary for Operators**

## Mục tiêu của tài liệu này

Khóa rõ:

* **Operator được làm gì**
* **Operator không được làm gì**
* **AI chịu trách nhiệm ở đâu**

Đây là tài liệu **chống lệch CVF**.

---

## 1. Vai trò Operator (Role Definition)

Operator là người:

* khởi tạo task bằng **input hợp lệ**
* nhận **output cuối cùng**
* thực hiện **audit**

Operator **không phải**:

* người đồng thiết kế workflow
* người điều khiển logic execution
* người “hỏi thêm cho rõ”

---

## 2. Những gì Operator ĐƯỢC làm

Operator được phép:

* Cung cấp input theo **input contract**
* Từ chối output nếu **không đạt contract**
* Yêu cầu trace đầy đủ
* Phân loại failure theo guideline

Operator được phép **dừng** quy trình khi:

* AI vi phạm boundary
* Output không audit được
* Trace không đầy đủ

---

## 3. Những gì Operator KHÔNG ĐƯỢC làm

Operator **không được**:

* Can thiệp vào execution khi AI đang chạy
* Thêm yêu cầu ngoài input contract
* Sửa prompt giữa chừng
* “Hỏi thêm” để AI giải thích ý định
* Hướng dẫn AI cách làm

> Mọi can thiệp giữa execution đều làm **mất hiệu lực trách nhiệm của AI**.

---

## 4. Ranh giới trách nhiệm (Responsibility Boundary)

### AI chịu trách nhiệm khi

* Input hợp lệ
* CVF rules được tuân thủ
* Execution hoàn tất

### Operator chịu trách nhiệm khi

* Input mơ hồ
* Input sai contract
* Can thiệp execution
* Đánh giá output ngoài phạm vi contract

---

## 5. Nguyên tắc “No Shared Thinking”

Trong CVF:

* Không có “AI nghĩ – human chỉnh”
* Không có “AI làm nháp – human refine”
* Không có “cùng nhau tìm phương án”

Chỉ có:

> **Human sets the law → AI executes → Human audits**

**Lưu ý quan trọng (reconcile với interactive chat):**

* Quy tắc này **chỉ áp dụng trong “execution window”** (khi AI đã bắt đầu chạy và đang tạo output).  
* **Trước khi execute**, Operator **được phép** trả lời câu hỏi làm rõ (clarifying questions) để hoàn thiện input/spec.  
* Với **interactive chat (v1.6)**, việc hỏi–đáp để làm rõ **được chấp nhận** ở Phase A/B.  
* Khi đã chuyển sang Phase C/D (execution), Operator **không được can thiệp** vào logic thực thi.

---

## 6. Dấu hiệu sử dụng CVF sai vai

Bạn đang **không dùng đúng CVF** nếu:

* bạn phải giải thích lại yêu cầu sau khi AI bắt đầu
* bạn cần “nói thêm cho đúng ý”
* bạn đánh giá output bằng cảm tính
* bạn hỏi AI “tại sao không làm cách khác”

---

## 7. Quy tắc dừng (Stop Rule)

Dừng ngay khi:

* AI vượt quyền
* Output không trace được
* Decision không tách bạch

Không sửa.
Không tiếp tục.
Không tối ưu.

---

## 8. Tuyên bố phạm vi

Tài liệu này:

* **không mở rộng CVF**
* **không sửa CVF**
* **không tạo phiên bản mới của CVF**

Mọi nội dung ở đây **chỉ áp dụng cho Operator**.

---

**Kết thúc phạm vi.**
