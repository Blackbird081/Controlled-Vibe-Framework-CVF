# Why These Fail CVF

CVF không thất bại vì AI yếu.
CVF thất bại vì operator **mất vai trò điều phối**.

---

## 1. CVF cần operator, không cần prompt wizard
Prompt chỉ là công cụ.
CVF là hệ thống vận hành:
- Input
- Boundary
- Output
- Escalation

Anti-pattern phá vỡ chuỗi này.

---

## 2. CVF yêu cầu tính truy vết
Mỗi output phải truy ngược được:
- Input gốc
- Quyết định của operator

Anti-pattern tạo ra:
- Quyết định ngầm
- Không thể audit

---

## 3. CVF ưu tiên an toàn hơn “hay”
Output hay nhưng sai scope = thất bại.
Output đúng nhưng khô = chấp nhận được.

---

## 4. CVF không chấp nhận “thiện chí”
Thiện chí ≠ đúng yêu cầu.
Thiện chí thường mở rộng scope trái phép.

---

## Kết luận
Anti-pattern không sai vì ngu.
Anti-pattern sai vì:
> Operator quên rằng mình là **người gác cổng**, không phải người sáng tác.
 