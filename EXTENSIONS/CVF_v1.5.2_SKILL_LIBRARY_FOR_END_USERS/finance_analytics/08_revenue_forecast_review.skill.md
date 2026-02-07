# Revenue Forecast Review

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
> - [Financial Statement Review](./02_financial_statement_review.skill.md) — Hiểu về báo cáo tài chính
> - [Financial Risk Assessment](./07_financial_risk_assessment.skill.md) — Đánh giá rủi ro

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Review dự báo doanh thu hàng quý/năm
- Đánh giá assumptions và methodology
- Chuẩn bị cho budgeting và planning

**Không phù hợp khi:**
- Cần tạo forecast từ đầu (đây là review skill)
- Đánh giá đầu tư (dùng Investment Due Diligence)

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

- UAT Record: [08_revenue_forecast_review](../../../governance/skill-library/uat/results/UAT-08_revenue_forecast_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

### 1. Forecast Period
```
Kỳ dự báo:
VD: FY2026, Q1-Q4 2026, 3-Year Plan
```

### 2. Historical Revenue
```
Doanh thu thực tế:
- FY2024: $___
- FY2025: $___
- YoY Growth: ___%
```

### 3. Forecast Figures
```
Dự báo doanh thu:
By Quarter (if available):
- Q1: $___
- Q2: $___
- Q3: $___
- Q4: $___
Total: $___

Or by Category:
- Product A: $___
- Product B: $___
- Services: $___
```

### 4. Key Assumptions
```
Các giả định chính:
VD:
- 15% YoY growth
- 2 new product launches
- Price increase 5%
- No churn from top customers
```

### 5. Methodology
```
Phương pháp dự báo:
[ ] Top-down (market size → share)
[ ] Bottom-up (unit × price × customers)
[ ] Historical trend + adjustments
[ ] Pipeline-based (for B2B)
[ ] Other: ___
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Forecast Summary
| Period | Forecast | Growth | Reasonableness |
|--------|----------|--------|----------------|
| FY2026 | $18M | +20% | ⚠️ Aggressive |

### 2. Assumption Validation
| Assumption | Realistic? | Evidence | Risk |
|------------|------------|----------|------|
| 15% growth | ⚠️ High | Historical: 10% | Medium |
| No churn | ❌ Unrealistic | Industry: 5% | High |

### 3. Sensitivity Analysis
- Bull case: +25% → $19M
- Base case: +15% → $17M
- Bear case: +5% → $16M

### 4. Gap Analysis
- Forecast vs historical trend
- Forecast vs industry benchmarks
- Forecast vs capacity constraints

### 5. Recommendations
- Assumption adjustments
- Risk mitigation
- Upside opportunities

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| Assumptions validated | Có evidence | Accepted at face value |
| Methodology reviewed | Strengths/weaknesses | Not addressed |
| Sensitivity analysis | Multiple scenarios | Single point estimate |
| Actionable feedback | Specific improvements | Generic comments |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Hockey stick projections | Check historical patterns |
| Ignore seasonality | Break down by quarter |
| Optimistic assumptions | Stress test each assumption |
| Single scenario | Require bear/base/bull cases |

---

## 💡 Tips

1. **Back-test:** Accuracy của forecast quá khứ như thế nào?
2. **Sanity checks:** So với market size, capacity, sales team size
3. **Cohort analysis:** New vs existing revenue breakdown
4. **Leading indicators:** Pipeline, trials, bookings → revenue
5. **Seasonality adjustment:** Compare YoY, not QoQ

---

## 📊 Ví dụ thực tế

**Input:**
```
Forecast Period: FY2026
Historical:
- FY2024: $10M (+8%)
- FY2025: $12M (+20%)

Forecast FY2026: $16M (+33%)
- Q1: $3.5M
- Q2: $3.8M
- Q3: $4.0M
- Q4: $4.7M

Assumptions:
- 2 new products (contribute $2M)
- 10% price increase
- Expand to 2 new regions
- Hire 5 new sales reps

Methodology: Bottom-up (pipeline + new products)
```

**Expected Analysis:**
```markdown

### Input mẫu:
```
Mục tiêu: Hoàn thành Revenue Forecast Review
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần
```

### Output mẫu:
```
Tóm tắt kết quả: Revenue Forecast Review với khuyến nghị/ưu tiên rõ ràng.
```
## Revenue Forecast Review: FY2026

### Executive Summary
Forecast of $16M (+33%) is **aggressive** compared to historical growth 
(8-20%) and requires multiple assumptions to hold simultaneously.

### Forecast Assessment
| Component | Forecast | Confidence | Notes |
|-----------|----------|------------|-------|
| Base Business | $12M | ✅ High | Assumes 0% churn |
| New Products | +$2M | ⚠️ Medium | No prior launches |
| Price Increase | +$1.2M | ⚠️ Medium | 10% ambitious |
| New Regions | +$0.8M | ⚠️ Low | Takes 6-12mo ramp |
| **Total** | **$16M** | **Medium** | |

### Assumption Stress Test
| Assumption | Assumed | Conservative | Impact |
|------------|---------|--------------|--------|
| New product revenue | $2M | $1M | -$1M |
| Price increase | 10% | 5% | -$600K |
| New regions | $800K | $400K | -$400K |
| Churn | 0% | 5% | -$600K |
| **Downside Total** | | | **-$2.6M** |

### Scenario Analysis
| Scenario | Revenue | Growth | Drivers |
|----------|---------|--------|---------|
| 🐻 Bear | $13.4M | +12% | Assumptions miss 50% |
| 📊 Base | $14.5M | +21% | Conservative adjustments |
| 🐂 Bull | $16M+ | +33% | All assumptions met |

### Quarterly Reasonableness
| Quarter | Forecast | % of Year | Historical % | Flag |
|---------|----------|-----------|--------------|------|
| Q1 | $3.5M | 22% | 20% | ✅ |
| Q2 | $3.8M | 24% | 23% | ✅ |
| Q3 | $4.0M | 25% | 25% | ✅ |
| Q4 | $4.7M | 29% | 32% | ⚠️ Lower than usual |

### Recommendations
1. **Adjust base case to $14.5M** (more realistic)
2. **Tier new product revenue:** $1M conservative, $2M stretch
3. **Add churn assumption:** 3-5% is industry standard
4. **Front-load new region investment:** Recognition will be in H2
5. **Create contingency plan:** If Q2 misses by >10%

### Confidence Score: 6/10
*Recommend revising assumptions before finalizing budget*
```

---

---

## 🔗 Related Skills
- [Financial Risk Assessment](./07_financial_risk_assessment.skill.md)
- [Budget Analysis](./01_budget_analysis.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Revenue Forecast Review, quay lại vòng lập kế hoạch:
→ [Budget Analysis](./01_budget_analysis.skill.md)

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*