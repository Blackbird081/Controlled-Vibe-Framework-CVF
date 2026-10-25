# 🎯 Decision Support Preset

**CVF v1.4 – Usage Layer**

---

## Mục tiêu

Preset này dùng khi người dùng cần **khuyến nghị để ra quyết định**, không chỉ phân tích.

---

## Khi nào dùng

- Cần chọn giữa nhiều phương án
- Cần khuyến nghị có lý do rõ ràng
- Quyết định có impact đáng kể
- Cần cân nhắc trade-offs

---

## Intent Template

```
INTENT:
Tôi cần khuyến nghị để [ra quyết định cụ thể]

CONTEXT:
- Các phương án: [liệt kê options]
- Ràng buộc: [budget, timeline, resources]
- Ưu tiên: [stability/speed/cost/quality]
- Stakeholders: [ai bị ảnh hưởng]

SUCCESS CRITERIA:
- Có khuyến nghị rõ ràng (chọn gì)
- Nêu được lý do chính
- Liệt kê trade-offs
```

---

## Output Format kỳ vọng

```markdown
## Khuyến nghị: [Quyết định]

### Tóm tắt
> **Khuyến nghị: [Phương án X]** vì [lý do chính trong 1-2 câu]

### So sánh phương án

| Tiêu chí | Phương án A | Phương án B | Phương án C |
|----------|:-----------:|:-----------:|:-----------:|
| Chi phí | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Thời gian | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Rủi ro | ⭐⭐⭐ | ⭐⭐ | ⭐ |

### Lý do chọn [Phương án X]
1. [Lý do 1]
2. [Lý do 2]
3. [Lý do 3]

### Trade-offs cần chấp nhận
- [Trade-off 1]
- [Trade-off 2]

### Khi nào KHÔNG nên chọn
- Nếu [điều kiện], hãy xem xét [phương án khác]

### Next Steps (nếu chọn khuyến nghị)
1. [Bước 1]
2. [Bước 2]
```

---

## Ví dụ thực tế

### Ví dụ 1: Quyết định tech stack

```
INTENT:
Tôi cần khuyến nghị chọn database cho project mới.

CONTEXT:
- Options: PostgreSQL, MongoDB, DynamoDB
- Use case: Real-time analytics, 1M events/day
- Team skill: Familiar with SQL
- Budget: Ưu tiên cost-effective

SUCCESS CRITERIA:
- Chọn 1 database với lý do
- Nêu trade-offs của lựa chọn
```

### Ví dụ 2: Quyết định hiring

```
INTENT:
Tôi cần khuyến nghị giữa thuê thêm 2 junior vs 1 senior developer.

CONTEXT:
- Budget: 8000 USD/tháng
- Timeline: Cần shiproduct trong 4 tháng
- Team hiện tại: 3 mid-level
- Ưu tiên: Delivery speed > long-term

SUCCESS CRITERIA:
- Khuyến nghị rõ ràng
- Phân tích impact đến timeline
```

---

## Điều KHÔNG nên làm

❌ "Hãy chọn PostgreSQL cho tôi" (ép kết quả)  
❌ "Phương án nào rẻ nhất?" (quá hẹp)  
❌ "Tôi thích option A, hãy justify" (bias)  

---

*Preset này thuộc CVF v1.4 Usage Layer*
