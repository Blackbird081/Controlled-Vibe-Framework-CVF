# ROI Calculator Review

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-04

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
> - [Budget Analysis](./01_budget_analysis.skill.md) — Hiểu cơ bản về chi phí và ngân sách

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá ROI của một dự án hoặc đầu tư
- So sánh hiệu quả giữa các phương án
- Chuẩn bị business case cho stakeholders

**Không phù hợp khi:**
- Đánh giá đầu tư phức tạp, dài hạn (dùng Investment Due Diligence)
- Phân tích rủi ro tài chính (dùng Financial Risk Assessment)

---

## 📋 Form Input

### 1. Investment/Project Name
```
Tên dự án hoặc khoản đầu tư:
VD: Marketing Automation Platform, New Hire Program
```

### 2. Total Investment Cost
```
Tổng chi phí đầu tư:
- Initial Cost: $___
- Ongoing Cost (per year): $___
- Implementation Cost: $___
- Total: $___
```

### 3. Expected Benefits
```
Lợi ích kỳ vọng:
- Revenue Increase: $___/year
- Cost Savings: $___/year
- Productivity Gains: $___/year
- Other Benefits: $___
```

### 4. Time Horizon
```
Thời gian đánh giá:
VD: 1 year, 3 years, 5 years
```

### 5. Assumptions (Optional)
```
Các giả định quan trọng:
VD: 10% customer growth, no inflation adjustment
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. ROI Calculation
| Metric | Value |
|--------|-------|
| Total Investment | $100,000 |
| Total Return (3 years) | $250,000 |
| Net Gain | $150,000 |
| **ROI** | **150%** |
| **Payback Period** | **14 months** |

### 2. Sensitivity Analysis
- Best case scenario
- Base case scenario  
- Worst case scenario

### 3. Assumption Validation
- Reality check trên các assumptions
- Risk factors

### 4. Comparison (if applicable)
- So sánh với alternative investments
- Opportunity cost analysis

### 5. Recommendation
- Go/No-Go decision
- Conditions for success

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| ROI calculated correctly | Công thức rõ ràng | Thiếu calculations |
| Payback period | Có tính toán | Không tính |
| Sensitivity analysis | Có multiple scenarios | Chỉ một scenario |
| Considers risks | Flag các assumptions | Bỏ qua risks |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Overoptimistic projections | Yêu cầu conservative estimates |
| Ignore hidden costs | List all cost categories |
| Single scenario | Yêu cầu best/base/worst cases |
| No payback period | Luôn tính thời gian hoàn vốn |

---

## 💡 Tips

1. **Be conservative:** Dùng realistic assumptions, không lạc quan quá
2. **Include all costs:** Đừng quên training, maintenance, opportunity cost
3. **Time value of money:** Với dự án dài >3 năm, tính NPV thay vì simple ROI
4. **Qualitative benefits:** Một số lợi ích không đo được bằng tiền (brand, morale)
5. **Benchmark comparison:** So sánh ROI với industry standards

---

## 📊 Ví dụ thực tế

**Input:**
```
Project: CRM Implementation
Investment: $50,000 (software + implementation)
Ongoing Cost: $12,000/year
Expected Benefits:
- Sales efficiency: +20% → $30,000/year revenue
- Customer retention: +5% → $15,000/year
Time Horizon: 3 years
```

**Expected Analysis:**
```markdown
## ROI Analysis: CRM Implementation

### Cost Breakdown (3 years)
| Item | Year 1 | Year 2 | Year 3 | Total |
|------|--------|--------|--------|-------|
| Initial | $50,000 | - | - | $50,000 |
| Ongoing | $12,000 | $12,000 | $12,000 | $36,000 |
| **Total Cost** | | | | **$86,000** |

### Benefit Breakdown (3 years)
| Item | Year 1 | Year 2 | Year 3 | Total |
|------|--------|--------|--------|-------|
| Sales | $30,000 | $30,000 | $30,000 | $90,000 |
| Retention | $15,000 | $15,000 | $15,000 | $45,000 |
| **Total Benefit** | | | | **$135,000** |

### ROI Summary
- **Net Gain:** $49,000
- **ROI (3 years):** 57%
- **Annualized ROI:** 19%
- **Payback Period:** 23 months

### Recommendation: ✅ PROCEED
- ROI meets company threshold (>15%)
- Payback within 2 years
- Low implementation risk
```

---

## 🔗 Next Step

Sau khi hoàn thành ROI Calculator Review, tiếp tục với:
→ [KPI Dashboard Audit](./04_kpi_dashboard_audit.skill.md) — Đánh giá dashboard metrics
