# KPI Dashboard Audit

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
>
> - [Budget Analysis](./01_budget_analysis.skill.md) — Hiểu cơ bản về metrics tài chính
> - [ROI Calculator Review](./03_roi_calculator_review.skill.md) — Hiểu cách đo lường hiệu quả

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Review và cải thiện KPI dashboards
- Đánh giá việc chọn metrics
- Kiểm tra data visualization best practices

**Không phù hợp khi:**

- Cần phân tích dữ liệu sâu (dùng data analysis tools)
- Xây dựng dashboard từ đầu (đây là audit, không phải thiết kế)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R2 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Review |
| Authority Scope | Tactical |
| Autonomy | Human confirmation required |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R2: human confirmation required
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [04_kpi_dashboard_audit](../../../governance/skill-library/uat/results/UAT-04_kpi_dashboard_audit.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

### 1. Dashboard Purpose

```
Mục đích của dashboard:
[ ] Executive Overview
[ ] Sales Performance
[ ] Marketing Analytics
[ ] Operations Monitoring
[ ] Customer Success
[ ] Financial Reporting
[ ] Other: ___
```

### 2. Current KPIs

```
List các KPIs hiện có trên dashboard:
VD:
- Revenue (MTD, YTD)
- Customer Acquisition Cost (CAC)
- Monthly Active Users (MAU)
- Churn Rate
- NPS Score
```

### 3. Dashboard Screenshot/Description

```
Mô tả layout và visualization types:
VD:
- Top row: 4 KPI cards (Revenue, Users, Churn, NPS)
- Middle: Line chart (Revenue trend 12 months)
- Bottom left: Bar chart (Sales by region)
- Bottom right: Pie chart (Customer segments)
```

### 4. Target Audience

```
Ai sử dụng dashboard này?
VD: C-suite, Sales team, Marketing team
```

### 5. Known Issues (Optional)

```
Vấn đề đã biết:
VD: "Churn rate calculation unclear", "Too many metrics"
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. KPI Selection Audit

| KPI | Relevance | Actionability | Data Quality | Score |
|-----|-----------|---------------|--------------|-------|
| Revenue | ✅ High | ✅ High | ✅ Good | 9/10 |
| Page Views | ⚠️ Low | ❌ Low | ✅ Good | 4/10 |

### 2. Missing KPIs

- Recommended metrics not included
- Industry-standard KPIs missing

### 3. Visualization Review

- Chart type appropriateness
- Color coding effectiveness
- Information hierarchy

### 4. Usability Assessment

- At-a-glance comprehension
- Drill-down capability
- Mobile responsiveness

### 5. Recommendations

- Specific improvements
- Priority order

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| KPI relevance checked | Đánh giá từng metric | Bỏ qua |
| Visualization appropriate | Đúng chart cho data type | Chart không phù hợp |
| Actionable insights | Có thể ra quyết định | Chỉ informational |
| Clear recommendations | Cụ thể, prioritized | Vague suggestions |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Vanity metrics | Focus on actionable metrics |
| Too many KPIs | Limit to 5-7 key metrics |
| Wrong chart types | Match chart to data type |
| No context | Add benchmarks, targets, trends |

---

## 💡 Tips

1. **MECE principle:** Metrics nên không chồng chéo, bao phủ đủ
2. **Leading vs Lagging:** Balance giữa predictive và outcome metrics
3. **5-second rule:** User hiểu được status trong 5 giây
4. **Color coding:** Dùng consistent (green=good, red=bad)
5. **Drill-down:** Cho phép đào sâu vào details khi cần

---

## 📊 Ví dụ thực tế

**Input:**

```
Dashboard: Sales Performance Dashboard
Audience: Sales VP, Regional Managers

Current KPIs:
- Total Revenue
- Number of Deals Closed
- Win Rate
- Average Deal Size
- Pipeline Value
- Sales Cycle Length
- Revenue by Product
- Revenue by Region

Visualization: 8 KPI cards + 4 charts
```

**Expected Audit:**

```markdown

### Input mẫu:
```

Mục tiêu: Hoàn thành KPI Dashboard Audit
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần

```

### Output mẫu:
```

Tóm tắt kết quả: KPI Dashboard Audit với khuyến nghị/ưu tiên rõ ràng.

```
## Dashboard Audit: Sales Performance

### KPI Scoring
| KPI | Relevance | Actionable | Data Quality | Score |
|-----|-----------|------------|--------------|-------|
| Total Revenue | ✅ | ⚠️ | ✅ | 8/10 |
| Deals Closed | ✅ | ⚠️ | ✅ | 7/10 |
| Win Rate | ✅ | ✅ | ✅ | 9/10 |
| Deal Size | ✅ | ✅ | ✅ | 9/10 |
| Pipeline | ✅ | ✅ | ✅ | 9/10 |
| Cycle Length | ✅ | ✅ | ✅ | 9/10 |

### Overall Score: 7.5/10

### Issues Found
1. ⚠️ **Too many KPIs** (8 cards overwhelming)
2. ⚠️ **Missing: Quota Attainment** (critical for sales)
3. ⚠️ **No targets/benchmarks** shown
4. ❌ **Revenue by Product: Pie chart** (bar chart better)

### Missing KPIs
- Quota Attainment (by rep, by region)
- Forecast Accuracy
- Activity Metrics (calls, meetings)

### Recommendations
1. **High Priority:** Add Quota Attainment %
2. **High Priority:** Show targets on each KPI
3. **Medium:** Convert pie charts to bar charts
4. **Low:** Add YoY comparison
```

---

---

## 🔗 Related Skills

- [ROI Calculator Review](./03_roi_calculator_review.skill.md)
- [Cash Flow Analysis](./05_cash_flow_analysis.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành KPI Dashboard Audit, tiếp tục với:
→ [Cash Flow Analysis](./05_cash_flow_analysis.skill.md) — Phân tích dòng tiền

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*
