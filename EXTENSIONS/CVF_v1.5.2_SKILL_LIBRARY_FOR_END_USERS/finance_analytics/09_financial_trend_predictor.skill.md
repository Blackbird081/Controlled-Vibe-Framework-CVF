# Financial Trend Predictor

> **Domain:** Finance & Analytics
> **Difficulty:** ⭐⭐ Medium
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] Có ít nhất 3 tháng dữ liệu lịch sử (thu nhập/chi tiêu/doanh số)
- [ ] Dữ liệu đã được lưu vào SQLite hoặc Excel
- [ ] Skill [Local SQLite](../app_development/04_database_schema_design.skill.md) đã hoàn thành (nếu dùng SQLite)

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Phase B (Design) — khi muốn nâng cấp dashboard từ "báo cáo tĩnh" lên "dự báo thông minh"
- Có ≥ 3 tháng dữ liệu lịch sử và muốn thấy xu hướng tương lai
- Muốn thêm cảnh báo khi chi tiêu/doanh số tiến gần ngưỡng nguy hiểm

**Không phù hợp khi:**
- Có ít hơn 3 tháng dữ liệu (kết quả không đáng tin)
- Cần dự báo phức tạp (ML model, time-series chuyên sâu) — dùng AGT-016

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Architect, Builder |
| Allowed Phases | Design, Build |
| Authority Scope | Informational |
| Autonomy | Auto + Audit |
| Audit Hooks | Data source verified, Algorithm declared, Disclaimer shown to user |

---

## ⛔ Execution Constraints

- AI PHẢI dùng `Plotly` với đường nét đứt (`dash`) cho phần dự báo tương lai
- AI PHẢI dùng thuật toán đơn giản: Linear Regression hoặc Moving Average — không dùng ML phức tạp
- Nếu đường dự báo chạm mức 0 hoặc âm, PHẢI đổi màu vùng đó sang đỏ (Red Zone)
- AI PHẢI giải thích bằng tiếng Việt: "Dựa trên X tháng qua, tôi dự báo..."
- PHẢI hiển thị disclaimer: "Đây là ước tính, không phải cam kết chính xác"

---

## ✅ Validation Hooks

- Check dữ liệu input có ≥ 3 điểm dữ liệu (tháng)
- Check biểu đồ có 2 phần phân biệt: quá khứ (nét liền) và tương lai (nét đứt)
- Check có Red Zone khi dự báo ≤ 0
- Check có giải thích bằng tiếng Việt kèm con số cụ thể
- Check có disclaimer

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-finance_analytics-09_financial_trend_predictor.md`
- UAT Objective: Biểu đồ phân biệt rõ quá khứ/tương lai, giải thích bằng tiếng Việt, có Red Zone khi dự báo âm

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Loại dữ liệu** | Muốn dự báo cái gì | ✅ | "Chi tiêu hàng tháng" / "Doanh số" / "Thu nhập" |
| **Số tháng lịch sử** | Bao nhiêu tháng dữ liệu đã có | ✅ | "6 tháng" |
| **Số tháng dự báo** | Muốn dự báo bao xa | ✅ | "3 tháng tới" |
| **Ngưỡng cảnh báo** | Khi nào cần báo đỏ | ❌ | "Khi chi tiêu > 15 triệu/tháng" |
| **Nguồn dữ liệu** | SQLite / Excel / CSV | ✅ | "SQLite — bảng expenses" |

---

## ✅ Expected Output

**Biểu đồ Plotly + Giải thích tiếng Việt:**

```python
# Code được tạo ra
import plotly.graph_objects as go
import pandas as pd
from sklearn.linear_model import LinearRegression
import numpy as np

# Dữ liệu quá khứ (nét liền màu xanh)
# Dự báo tương lai (nét đứt màu xanh nhạt)
# Red Zone khi dự báo ≤ 0 (vùng đỏ)

fig.add_trace(go.Scatter(
    x=past_months, y=past_values,
    mode='lines', name='Thực tế',
    line=dict(color='royalblue', width=2)
))
fig.add_trace(go.Scatter(
    x=future_months, y=predicted_values,
    mode='lines', name='Dự báo',
    line=dict(color='royalblue', width=2, dash='dash')
))
```

**Giải thích tự động:**
```
📊 Dự báo xu hướng chi tiêu

Dựa trên 6 tháng qua (trung bình 12.5 triệu/tháng, tăng ~8%/tháng):

→ Tháng 8/2026: ước tính ~13.5 triệu đồng
→ Tháng 9/2026: ước tính ~14.6 triệu đồng
→ Tháng 10/2026: ước tính ~15.8 triệu đồng ⚠️ Gần ngưỡng cảnh báo

⚠️ Lưu ý: Đây là ước tính dựa trên xu hướng hiện tại,
không phải cam kết chính xác. Nhiều yếu tố có thể thay đổi.
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Biểu đồ có 2 phần: nét liền (quá khứ) + nét đứt (tương lai)
- [ ] Red Zone xuất hiện khi dự báo ≤ 0 hoặc vượt ngưỡng
- [ ] Giải thích bằng tiếng Việt có con số cụ thể
- [ ] Có disclaimer rõ ràng
- [ ] Thuật toán dùng là Linear Regression hoặc Moving Average

**Red flags (Reject):**
- ⚠️ Dùng ML model phức tạp mà không giải thích được
- ⚠️ Không có disclaimer
- ⚠️ Biểu đồ không phân biệt quá khứ và tương lai

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Dữ liệu <3 tháng | Báo User: "Cần thêm dữ liệu để dự báo đáng tin cậy" |
| Trendline quá lạc quan | Dùng Moving Average thay vì Linear Regression khi data biến động nhiều |
| Không có Red Zone | Luôn check min(predicted_values) ≤ 0 |

---

## 💡 Tips

1. **Moving Average tốt hơn khi data "lên xuống"** — Linear Regression tốt hơn khi data tăng/giảm đều
2. **3 tháng dự báo là tối ưu** — Xa hơn thì độ chính xác giảm nhanh
3. **Giải thích % thay vì số tuyệt đối** — "Tăng 8%/tháng" dễ hiểu hơn "tăng 1.2 triệu"
4. **Màu sắc nhất quán** — Xanh = thực tế, Xanh nhạt/nét đứt = dự báo, Đỏ = cảnh báo

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Loại dữ liệu: Chi tiêu hàng tháng
Số tháng lịch sử: 6 tháng (Jan-Jun 2026)
Số tháng dự báo: 3 tháng
Ngưỡng cảnh báo: 20 triệu/tháng
Nguồn: SQLite — bảng monthly_expenses
```

### Output mẫu:
- Biểu đồ Plotly với nét liền (Jan-Jun) + nét đứt (Jul-Sep)
- Dự báo Jul: 17.2tr, Aug: 18.9tr, Sep: 20.7tr ⚠️ (vượt ngưỡng)
- Giải thích tiếng Việt: "Tháng 9/2026 dự kiến vượt ngưỡng..."
- Disclaimer đầy đủ

### Đánh giá:
- ✅ Biểu đồ 2 phần rõ ràng
- ✅ Red Zone tháng 9
- ✅ Giải thích tiếng Việt + con số cụ thể
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi có biểu đồ → Nhúng vào Dashboard chính trong Phase C (Build)

---

## 🔗 Related Skills — Chuẩn bị dữ liệu trước
- [Financial Model](./financial_model.skill.md) — Phân tích tài chính sâu hơn

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Financial Trend Predictor — CVF v1.5.2 Finance & Analytics Skill Library*
