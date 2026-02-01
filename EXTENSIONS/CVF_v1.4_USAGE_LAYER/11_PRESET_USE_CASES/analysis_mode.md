# 📊 Analysis Mode Preset

**CVF v1.4 – Usage Layer**

---

## Mục tiêu

Preset này dùng khi người dùng cần **hiểu vấn đề**, không cần ra quyết định ngay.

---

## Khi nào dùng

- Phân tích tình huống phức tạp
- So sánh phương án
- Làm rõ rủi ro, yếu tố ảnh hưởng
- Tìm hiểu nguyên nhân gốc rễ

---

## Intent Template

```
INTENT:
Tôi muốn hiểu [vấn đề/tình huống/hệ thống]

CONTEXT:
- Bối cảnh: [mô tả ngắn gọn]
- Dữ liệu có sẵn: [liệt kê nguồn]
- Giới hạn: [thời gian, scope, resources]

SUCCESS CRITERIA:
- Xác định được [số] yếu tố chính
- Có cấu trúc phân tích rõ ràng
- Nêu rõ assumptions và giới hạn
```

---

## Output Format kỳ vọng

```markdown
## Phân tích [Chủ đề]

### Tổng quan
[2-3 câu tóm tắt]

### Các yếu tố chính
1. **[Yếu tố 1]** - [Mức ảnh hưởng: Cao/Trung bình/Thấp]
2. **[Yếu tố 2]** - [Mức ảnh hưởng]
3. **[Yếu tố 3]** - [Mức ảnh hưởng]

### Rủi ro tiềm ẩn
| Rủi ro | Xác suất | Ảnh hưởng | Giảm thiểu |
|--------|----------|-----------|------------|
| [Rủi ro 1] | Cao | Cao | [Cách giảm] |

### Assumptions
- [Giả định 1]
- [Giả định 2]

### Giới hạn phân tích
- [Những gì KHÔNG được bao gồm]
```

---

## Ví dụ thực tế

### Ví dụ 1: Phân tích kỹ thuật

```
INTENT:
Tôi muốn hiểu rủi ro chính của việc migrate từ AWS sang GCP.

CONTEXT:
- Hệ thống e-commerce, 100k users/ngày
- Budget: 50k USD/tháng
- Timeline: 6 tháng

SUCCESS CRITERIA:
- Xác định 5 rủi ro lớn nhất
- Đánh giá mức ảnh hưởng mỗi rủi ro
- Gợi ý cách giảm thiểu
```

### Ví dụ 2: Phân tích business

```
INTENT:
Tôi muốn hiểu các yếu tố ảnh hưởng đến customer churn.

CONTEXT:
- SaaS product, 5000 customers
- Churn rate hiện tại: 8%/tháng
- Có data 12 tháng

SUCCESS CRITERIA:
- Xác định 3-5 nguyên nhân chính
- Đưa ra insights có thể action
```

---

## Điều KHÔNG nên làm

❌ "Hãy chứng minh rằng AWS tốt hơn GCP"  
❌ "Phân tích theo framework XYZ"  
❌ "Tôi nghĩ nguyên nhân là X, hãy xác nhận"  

---

*Preset này thuộc CVF v1.4 Usage Layer*