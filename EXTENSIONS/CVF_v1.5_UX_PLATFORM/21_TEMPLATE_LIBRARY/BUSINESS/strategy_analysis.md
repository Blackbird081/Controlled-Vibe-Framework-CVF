# 📈 Strategy Analysis Template

**Domain:** Business  
**Preset:** `analysis`

---

## Mô tả ngắn

Phân tích chiến lược kinh doanh, đánh giá các phương án và đưa ra insights.

---

## Khi nào dùng

- Đánh giá chiến lược hiện tại
- So sánh nhiều phương án chiến lược
- Phân tích điểm mạnh/yếu của hướng đi
- Chuẩn bị cho cuộc họp strategy

---

## Form Fields

| Field | Required | Type | Mô tả |
|-------|:--------:|------|-------|
| Chủ đề chiến lược | ✅ | text | Chiến lược cần phân tích |
| Bối cảnh | ✅ | textarea | Ngành, thị trường, quy mô |
| Các phương án | ❌ | textarea | Liệt kê options (nếu có) |
| Ràng buộc | ❌ | text | Budget, timeline, resources |
| Ưu tiên | ❌ | select | Growth / Stability / Cost |

---

## Intent Pattern

```
INTENT:
Tôi muốn phân tích chiến lược [chủ đề chiến lược].

CONTEXT:
- Ngành/Lĩnh vực: [ngành]
- Quy mô: [quy mô công ty/team]
- Thị trường: [thị trường mục tiêu]
- Các phương án đang xem xét: [liệt kê nếu có]
- Ràng buộc: [budget/timeline/resources]

SUCCESS CRITERIA:
- Phân tích rõ ưu/nhược điểm của mỗi hướng
- Xác định rủi ro chính
- Đưa ra khuyến nghị có căn cứ
```

---

## Output Expected

```markdown
## Phân tích chiến lược: [Chủ đề]

### Tổng quan
[2-3 câu tóm tắt]

### Phân tích các phương án
| Phương án | Ưu điểm | Nhược điểm | Rủi ro |
|-----------|---------|------------|--------|
| A | ... | ... | ... |
| B | ... | ... | ... |

### Ma trận đánh giá
| Tiêu chí | Phương án A | Phương án B |
|----------|:-----------:|:-----------:|
| Chi phí | ⭐⭐⭐ | ⭐⭐ |
| Thời gian | ⭐⭐ | ⭐⭐⭐ |
| Rủi ro | ⭐⭐⭐ | ⭐ |

### Khuyến nghị
[Khuyến nghị có căn cứ]

### Assumptions
[Các giả định được sử dụng]
```

---

## Examples

### Ví dụ 1: Chiến lược mở rộng

```
INTENT:
Tôi muốn phân tích chiến lược mở rộng thị trường ra miền Trung.

CONTEXT:
- Ngành: Bán lẻ thực phẩm
- Quy mô: 50 cửa hàng tại miền Nam
- Thị trường: Đà Nẵng, Huế, Quảng Nam
- Phương án: A) Mở 10 cửa hàng mới, B) Franchise, C) Mua lại chuỗi địa phương
- Ràng buộc: Budget 20 tỷ, timeline 12 tháng

SUCCESS CRITERIA:
- So sánh 3 phương án theo chi phí, rủi ro, tốc độ
- Khuyến nghị phương án phù hợp nhất
```

### Ví dụ 2: Chiến lược sản phẩm

```
INTENT:
Tôi muốn phân tích chiến lược launching sản phẩm mới.

CONTEXT:
- Ngành: SaaS B2B
- Sản phẩm: AI-powered analytics tool
- Thị trường: SME Việt Nam
- Phương án: A) Freemium, B) Enterprise only, C) Hybrid
- Budget: 500 triệu marketing

SUCCESS CRITERIA:
- ROI projection cho mỗi phương án
- Rủi ro adoption
- Timeline to break-even
```

---

*Template thuộc CVF v1.5 UX Platform*
