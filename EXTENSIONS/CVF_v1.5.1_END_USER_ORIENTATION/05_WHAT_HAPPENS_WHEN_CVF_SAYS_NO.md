# 05 – What Happens When CVF Says No

## CVF có thể từ chối

Không phải mọi yêu cầu đều được xử lý.

CVF từ chối không phải vì:
- AI không đủ thông minh
- Operator lười
- Hệ thống bị lỗi

CVF từ chối vì **yêu cầu vi phạm nguyên tắc an toàn**.

---

## Các lý do CVF từ chối

### 1. Yêu cầu dẫn dắt kết quả

> "Chứng minh rằng phương án A là tốt nhất"

CVF không làm vì:
- Đây là hợp thức hóa, không phải phân tích
- Kết quả bị bias từ đầu

---

### 2. Dữ liệu thiếu nghiêm trọng

> "Cứ ước lượng, thiếu cũng được"

CVF không làm vì:
- Output sẽ không đáng tin
- Không ai chịu trách nhiệm cho dữ liệu bịa

---

### 3. Rủi ro vượt mức chấp nhận

> "Làm nhanh, sai tôi chịu"

CVF không làm vì:
- "Tôi chịu" không phải cơ chế kiểm soát
- Hậu quả có thể vượt quá cá nhân

---

### 4. Yêu cầu vượt scope CVF

> "Viết hợp đồng pháp lý"

CVF không làm vì:
- Không có thẩm quyền
- Cần chuyên gia đúng lĩnh vực

---

## Khi CVF nói "không", bạn nên làm gì?

### Bước 1: Đọc lý do từ chối
- CVF luôn giải thích vì sao
- Không từ chối mà không có lý do

### Bước 2: Xem xét lại yêu cầu
- Có thể điều chỉnh được không?
- Có thể chia nhỏ không?
- Có thể bổ sung thông tin không?

### Bước 3: Chọn hành động tiếp theo

| Tình huống | Hành động |
|------------|-----------|
| Thiếu dữ liệu | Thu thập và quay lại |
| Vượt scope | Chuyển đúng người |
| Bias trong yêu cầu | Viết lại trung lập |
| Rủi ro cao | Escalate lên cấp cao |

---

## Điều bạn KHÔNG nên làm

❌ Ép tiếp tục bằng mọi giá
❌ Tìm cách "lừa" hệ thống
❌ Bỏ qua cảnh báo và tự làm
❌ Đổ lỗi cho CVF / Operator

---

## CVF từ chối = CVF hoạt động đúng

Một hệ thống luôn nói "được" không phải hệ thống an toàn.

CVF được thiết kế để:
> **Bảo vệ bạn khỏi những quyết định không nên xảy ra.**

Khi CVF từ chối, hãy coi đó là **cơ hội xem lại**, không phải rào cản.
