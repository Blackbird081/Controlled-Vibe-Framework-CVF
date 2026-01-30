# 📘 README.md

**CVF v1.3.1 – Operator Edition**

## Mục đích

Tài liệu này dành cho **Operator** sử dụng **Controlled Vibe Framework (CVF)** trong môi trường **internal use**.
Operator **không thiết kế framework**, **không điều khiển execution**, và **không can thiệp AI**.
Operator **chỉ**:

1. cung cấp **input đúng chuẩn**,
2. **nhận output**,
3. **audit kết quả**.

> CVF v1.3.1 – Operator Edition **không thay đổi** CVF core (v1.3).
> Đây là **lớp vận hành** giúp dùng CVF **đúng – nhanh – không trôi vibe**.

---

## Ai nên đọc tài liệu này

* Người **vận hành** hệ thống CVF
* Người **nhận output** từ AI theo CVF
* Người **chịu trách nhiệm đánh giá kết quả cuối**

Không dành cho:

* Framework designer
* Người muốn sửa luật, thêm skill, thêm agent
* Người muốn “hỏi AI thêm cho chắc”

---

## Cách dùng tài liệu này

Thứ tự khuyến nghị:

1. **00_SCOPE_AND_BOUNDARY.md** – khóa phạm vi & quyền
2. **01_OPERATOR_QUICK_START.md** – luồng vận hành tối thiểu
3. Các mục còn lại đọc khi cần audit sâu hơn

> Nếu bạn thấy cần “sửa luật” để dùng được → bạn đang **dùng sai vai**.

---

## Nguyên tắc vận hành cốt lõi

* **AI là executor**, chịu trách nhiệm execution khi tuân thủ CVF
* **Operator không đồng hành suy nghĩ với AI**
* **Không can thiệp giữa execution**
* **Mọi đánh giá diễn ra ở OUTPUT + TRACE**

---

## CVF Operator Edition bao gồm

* Chuẩn hóa **input contract**
* Chuẩn hóa **output & audit**
* Hướng dẫn **đọc trace**
* Reference **enforcement** (không bắt buộc)

Không bao gồm:

* Skill design
* Governance design
* Agent architecture

---

## Khi nào dừng lại

Nếu output:

* không đúng contract
* thiếu trace
* né trách nhiệm

→ **Fail**.
Không sửa prompt.
Không “cho làm lại cho đúng ý”.
Xử lý theo **failure classification**.

---

## Liên hệ với CVF Core

* CVF Core v1.3 = **Constitution**
* Operator Edition = **User Manual**

Operator Edition **không có quyền ghi đè** CVF Core.
