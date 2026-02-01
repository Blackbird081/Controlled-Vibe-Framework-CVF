# 🔍 Competitor Review Template

**Domain:** Business  
**Preset:** `analysis`

---

## Mô tả ngắn

Phân tích đối thủ cạnh tranh, so sánh điểm mạnh/yếu và xác định cơ hội khác biệt hóa.

---

## Khi nào dùng

- Chuẩn bị chiến lược cạnh tranh
- Launch sản phẩm mới
- Đánh giá positioning hiện tại
- Investor pitch

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Công ty của bạn | ✅ | text | Tên và mô tả ngắn |
| Đối thủ chính | ✅ | textarea | Danh sách 3-5 đối thủ |
| Ngành | ✅ | text | Lĩnh vực kinh doanh |
| Tiêu chí so sánh | ❌ | textarea | Các tiêu chí quan tâm |
| Mục tiêu | ❌ | text | Mục đích của việc so sánh |

---

## Intent Pattern

```
INTENT:
Tôi muốn phân tích đối thủ cạnh tranh trong ngành [ngành].

CONTEXT:
- Công ty: [tên công ty] - [mô tả ngắn]
- Đối thủ chính: [danh sách đối thủ]
- Tiêu chí so sánh: [giá, chất lượng, marketing, tech, etc.]
- Mục tiêu: [tại sao cần phân tích]

SUCCESS CRITERIA:
- Ma trận so sánh các đối thủ
- Xác định điểm mạnh/yếu của từng đối thủ
- Cơ hội khác biệt hóa cho công ty
```

---

## Output Expected

```markdown
## Competitive Analysis: [Ngành]

### Overview
| Đối thủ | Market Share | Positioning | Key Strength |
|---------|:------------:|-------------|--------------|
| [A] | 30% | Premium | Brand |
| [B] | 25% | Value | Price |
| [Công ty] | 15% | ... | ... |

### Feature Comparison
| Feature | Công ty | Đối thủ A | Đối thủ B |
|---------|:-------:|:---------:|:---------:|
| [F1] | ✅ | ✅ | ❌ |
| [F2] | ✅ | ❌ | ✅ |

### SWOT của từng đối thủ
#### Đối thủ A
- Strengths: ...
- Weaknesses: ...

### Differentiation Opportunities
1. **[Cơ hội 1]** - [Chi tiết]
2. **[Cơ hội 2]** - [Chi tiết]

### Recommendations
[Chiến lược cạnh tranh đề xuất]
```

---

## Examples

### Ví dụ 1: Fintech

```
INTENT:
Tôi muốn phân tích đối thủ cạnh tranh trong ngành ví điện tử.

CONTEXT:
- Công ty: PayGo - ví điện tử cho SME
- Đối thủ: MoMo, ZaloPay, VNPay, ShopeePay
- Tiêu chí: UX, merchant network, fees, features
- Mục tiêu: Xác định niche để tập trung

SUCCESS CRITERIA:
- So sánh 5 tiêu chí chính
- SWOT của top 2 đối thủ
- 3 cơ hội khác biệt hóa
```

---

*Template thuộc CVF v1.5 UX Platform*
