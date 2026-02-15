# Nghiên cứu tình huống 1: Startup FinTech — CVF cho phê duyệt tín dụng bằng AI

**Ngày:** Tháng 1 năm 2026  
**Ngành:** Công nghệ Tài chính  
**Quy mô nhóm:** 15 (4 Kỹ sư AI, 3 Chuyên viên phân tích tín dụng, 8 Backend)  
**Phiên bản CVF:** v1.1

---

## Thách thức

**Tình huống:**  
CreditFlow, một startup fintech cung cấp quyết định tín dụng tức thì, đang gặp phải:
- **Quyết định AI không nhất quán**: Chuyên viên phân tích tín dụng không thể hiểu tại sao AI phê duyệt/từ chối hồ sơ
- **Rủi ro pháp lý**: Không có nhật ký kiểm toán để tuân thủ (Đạo luật Cho vay Công bằng, FCRA)
- **Đánh đổi giữa tốc độ và kiểm soát**: Đánh giá thủ công kỹ lưỡng nhưng chậm (3-5 ngày/hồ sơ)

**Khoảng trống:** Họ có các agent AI đưa ra quyết định tài chính quan trọng mà không có framework governance nào.

---

## Giải pháp: Triển khai CVF v1.1

### Kiến trúc

**Trước CVF:**
```
User Request → AI Analyst (Claude) → Approve/Reject → No Trace
```

**Sau CVF:**
```
User Request
    ↓
INPUT_SPEC (application + rules)
    ↓
Command: CVF:EVALUATE_CREDIT
    ↓
Archetype: Credit Analysis Agent
    ↓
Skill Contract: R2-approval (requires human review)
    ↓
Execute AU-001 (evaluate)
    ↓
Trace: Decision + reasoning + factors
    ↓
Human Review (Credit Analyst)
    ↓
OUTPUT_SPEC validation
    ↓
Approve/Reject + Audit Log
```

### Triển khai (Tuần 1-3)

**Tuần 1: Nền tảng Spec**
- Viết INPUT_SPEC.md: Các trường hồ sơ, thu nhập, lịch sử tín dụng, ràng buộc
- Viết OUTPUT_SPEC.md: Loại quyết định (phê duyệt/từ chối/cần xem xét), điểm rủi ro, bậc lãi suất, giải thích
- Thiết lập quy tắc governance: R2 yêu cầu con người cho khoản >$10k, điều chỉnh lãi suất

**Tuần 2: AI Governance**
- Tạo Archetype: Credit Analysis Agent
  - Vai trò: Đánh giá rủi ro tín dụng, đề xuất bậc
  - KHÔNG được phép: Ghi đè phê duyệt cuối cùng, thay đổi lãi suất
  - Phạm vi: Truy cập chỉ đọc vào cục tín dụng, xác minh thu nhập
- Áp dụng Preset: Financial Decision Preset
  - Yêu cầu con người đánh giá cho tất cả quyết định R2
  - Ghi nhật ký kiểm toán BẮT BUỘC
  - Truy vết: Mọi yếu tố phải được ghi lại

**Tuần 3: Thực thi + Kiểm toán**
- Tạo Skill Contract: evaluate_credit_risk (R2)
  - Đầu vào: Dữ liệu hồ sơ, điểm tín dụng, xác minh thu nhập
  - Đầu ra: Điểm rủi ro, khuyến nghị bậc, mức độ tin cậy
  - Thực thi: Phải hoàn thành trong 60 giây
  - Kiểm toán: Ghi lại các yếu tố rủi ro, ngưỡng vượt quá, lý luận của AI
- Thiết lập Action Unit (AU):
  - AU-001: Lấy hồ sơ + dữ liệu bên ngoài
  - AU-002: Chạy mô hình rủi ro (AI)
  - AU-003: Chuyên viên đánh giá quyết định (thủ công)
  - AU-004: Thực thi (phê duyệt/từ chối)

---

## Kết quả

### Số liệu (30 ngày cơ sở sau triển khai)

| Chỉ số | Trước | Sau | Thay đổi |
|--------|-------|-----|----------|
| **Rõ ràng quyết định** | Xử lý từng trường hợp thủ công | Dựa trên spec, có truy vết | +100% |
| **Nhật ký kiểm toán** | 0% được ghi lại | 100% quyết định được kiểm toán | +100% |
| **Tốc độ quyết định** | 3-5 ngày | 4-8 giờ | -80% thời gian |
| **Thời gian đánh giá của chuyên viên** | 2 giờ/quyết định | 15 phút (tập trung vào ngoại lệ) | -87.5% |
| **Rủi ro tuân thủ** | Cao (không có hồ sơ) | Thấp (nhật ký kiểm toán đầy đủ) | ↓ Nghiêm trọng |
| **Tin tưởng cho vay công bằng** | Thấp (rủi ro thiên lệch con người) | Cao (lý luận AI + phê duyệt con người) | ↑ Cao |
| **Thông lượng hồ sơ** | 15/ngày | 75/ngày | +400% |

### Tác động vận hành

**Năng suất chuyên viên phân tích:**
- Trước: Đánh giá thủ công mỗi hồ sơ, viết thư quyết định, theo dõi lý do
- Sau: Chỉ đánh giá các quyết định ngoại lệ (trường hợp R2), dành thời gian cải thiện chính sách

**Giảm rủi ro:**
- Kiểm toán pháp lý: Chứng minh truy vết quyết định → Không có phát hiện vi phạm
- Khiếu nại khách hàng: Giải thích rõ ràng được cung cấp với mỗi lần từ chối
- Cho vay công bằng: Lý luận AI + phê duyệt chuyên viên = quyết định có thể bảo vệ

**Tác động doanh thu:**
- Xử lý hồ sơ nhiều gấp 3 lần mỗi ngày
- Quyết định tín dụng nhanh hơn = cấp khoản vay nhanh hơn = cải thiện dòng tiền
- Giảm chi phí thủ công = cải thiện biên lợi nhuận

---

## Các thành phần CVF được sử dụng

| Thành phần | Sử dụng |
|-----------|---------|
| **INPUT_SPEC** | ✅ Yêu cầu hồ sơ, ràng buộc dữ liệu |
| **OUTPUT_SPEC** | ✅ Loại quyết định, định dạng giải thích, trường kiểm toán |
| **Commands** | ✅ CVF:EVALUATE_CREDIT |
| **Archetype** | ✅ Credit Analysis Agent (hỗ trợ quyết định, không phải người ra quyết định) |
| **Skill Contract** | ✅ Mức R2 với đánh giá con người bắt buộc |
| **Action Units** | ✅ Chuỗi 4 AU cho mỗi hồ sơ |
| **Trace** | ✅ Mọi yếu tố quyết định, lý luận AI, ghi chú đánh giá chuyên viên |
| **Presets** | ✅ Financial Decision Preset |
| **v1.1 Governance** | ✅ Đầy đủ module: INPUT/OUTPUT, Archetype, AU, Trace |

---

## Bài học chính

**1. Governance tạo ra tốc độ**  
Spec rõ ràng + định nghĩa vai trò = quyết định nhanh hơn, không phải chậm hơn (nghịch lý nhưng đúng)

**2. Khả năng kiểm toán = Niềm tin**  
Cơ quan quản lý, khách hàng và chuyên viên phân tích đều tự tin với bản truy vết quyết định đầy đủ

**3. Đánh giá của con người vẫn thiết yếu**  
CVF không thay thế con người — nó tập trung nỗ lực con người vào nơi quan trọng nhất (trường hợp biên, quyết định chính sách)

**4. Quản lý sự thay đổi**  
Thách thức lớn nhất là sự chấp nhận của chuyên viên phân tích — giải quyết bằng cách cho thấy tiết kiệm thời gian, không chỉ lợi ích tuân thủ

---

## Khuyến nghị

**Cho các tình huống FinTech tương tự:**
- Sử dụng CVF v1.1 full stack (INPUT/OUTPUT + Archetype + AU + Trace)
- R2 là điểm cân bằng lý tưởng cho human-in-the-loop với tốc độ
- Đầu tư vào OUTPUT_SPEC rõ ràng — đây là thứ cơ quan quản lý sẽ xem xét
- Tự động hóa thu thập trace (không dựa vào ghi chú thủ công)

**Thời gian:** 2-3 tuần cho dịch vụ tài chính, kiến trúc tương tự cần thiết

---

*Cập nhật lần cuối: 15 tháng 2 năm 2026 | CVF v1.6*
