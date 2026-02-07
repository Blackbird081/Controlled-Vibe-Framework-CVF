# Financial Risk Assessment

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
> - [Cash Flow Analysis](./05_cash_flow_analysis.skill.md) — Hiểu tình hình dòng tiền

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá rủi ro tài chính tổng thể của doanh nghiệp
- Chuẩn bị risk mitigation strategies
- Review trước khi ra quyết định tài chính quan trọng

**Không phù hợp khi:**
- Đánh giá rủi ro phi tài chính (operational, legal)
- Cần due diligence đầu tư đầy đủ (dùng Investment Due Diligence)

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

- UAT Record: [07_financial_risk_assessment](../../../governance/skill-library/uat/results/UAT-07_financial_risk_assessment.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

### 1. Company/Project Overview
```
Thông tin tổng quan:
- Company Name: ___
- Industry: ___
- Annual Revenue: $___
- Company Stage: [Startup/Growth/Mature]
```

### 2. Financial Position
```
Vị thế tài chính:
- Total Assets: $___
- Total Liabilities: $___
- Equity: $___
- Current Ratio: ___
- Debt/Equity: ___
```

### 3. Revenue Concentration
```
Tập trung doanh thu:
- Top Customer %: ___%
- Top 5 Customers %: ___%
- Geographic concentration: ___
- Product concentration: ___
```

### 4. Cash & Liquidity
```
Thanh khoản:
- Cash on Hand: $___
- Monthly Burn: $___
- Credit Facilities: $___
- Runway (months): ___
```

### 5. Known Risks
```
Rủi ro đã biết:
VD:
- Currency exposure
- Interest rate sensitivity
- Seasonal revenue
- Dependency on key supplier
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Risk Heat Map
| Risk Category | Likelihood | Impact | Priority |
|---------------|------------|--------|----------|
| Liquidity Risk | Medium | High | 🔴 Critical |
| Credit Risk | Low | Medium | 🟡 Monitor |
| Market Risk | High | Medium | 🟠 High |

### 2. Risk Scoring
- Overall Risk Score: X/100
- Category breakdown
- Trend vs previous period

### 3. Detailed Risk Analysis
For each major risk:
- Description
- Quantified impact
- Likelihood assessment
- Current controls

### 4. Mitigation Strategies
| Risk | Strategy | Cost | Timeline |
|------|----------|------|----------|
| Liquidity | Credit line | $50K/yr | Q1 |

### 5. Early Warning Indicators
- Key metrics to monitor
- Threshold levels
- Escalation process

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| Risk identification | Comprehensive list | Missing categories |
| Quantification | Có impact numbers | Qualitative only |
| Likelihood assessment | Based on data | Guesswork |
| Mitigation strategies | Specific, actionable | Vague suggestions |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Generic risk list | Customize to specific context |
| No quantification | Request $ impact estimates |
| Ignore low likelihood | Include tail risks |
| No monitoring plan | Define early warning indicators |

---

## 💡 Tips

1. **Quantify everything:** "High risk" ít hữu ích hơn "$2M potential loss"
2. **Consider correlations:** Các risk có thể compound
3. **Stress testing:** Chạy worst case scenarios
4. **Update regularly:** Risk profile thay đổi theo thời gian
5. **Involve stakeholders:** Finance, Ops, Legal perspectives

---

## 📊 Ví dụ thực tế

**Input:**
```
Company: E-commerce Platform
Industry: Retail
Revenue: $15M/year

Financial Position:
- Assets: $8M
- Liabilities: $5M
- Equity: $3M
- Current Ratio: 1.4
- D/E: 1.67

Concentration:
- Top customer: 8%
- Top 5: 25%
- 70% domestic, 30% international

Cash: $1.5M
Monthly Burn: $200K (growing)
Runway: 7.5 months

Known Risks:
- Currency exposure (USD/EUR)
- Seasonal (60% revenue in Q4)
- Single payment processor
```

**Expected Analysis:**
```markdown

### Input mẫu:
```
Mục tiêu: Hoàn thành Financial Risk Assessment
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần
```

### Output mẫu:
```
Tóm tắt kết quả: Financial Risk Assessment với khuyến nghị/ưu tiên rõ ràng.
```
## Financial Risk Assessment: E-commerce Platform

### Risk Heat Map
| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| Liquidity | 🔴 High | 🔴 Critical | 🔴 #1 |
| Currency | 🟡 Medium | 🟡 Medium | 🟡 #3 |
| Concentration (seasonal) | 🔴 High | 🟠 High | 🟠 #2 |
| Payment processor | 🟢 Low | 🔴 Critical | 🟡 #4 |
| Customer concentration | 🟢 Low | 🟢 Low | 🟢 #5 |

### Overall Risk Score: 68/100 (Elevated)

### Top 3 Risks Detailed

#### 1. 🔴 Liquidity Risk
- **Issue:** 7.5 month runway with growing burn
- **Impact:** Business failure if funding not secured
- **Mitigation:** 
  - Secure $2M credit line (est. $80K/yr cost)
  - Reduce burn by 15% ($30K/mo savings)
  - Accelerate Q4 pre-orders

#### 2. 🟠 Seasonal Concentration
- **Issue:** 60% revenue in Q4, cash strain in Q1-Q3
- **Impact:** $200-300K cash gap in slow months
- **Mitigation:**
  - Build cash reserve of 3 months OpEx ($600K)
  - Develop subscription revenue stream
  - Negotiate seasonal payment terms with suppliers

#### 3. 🟡 Currency Risk
- **Issue:** 30% international revenue in EUR
- **Impact:** ±5% FX swing = $225K variance
- **Mitigation:**
  - Simple hedging for large EUR receipts
  - Price in USD where possible

### Early Warning Indicators
| Metric | Green | Yellow | Red | Current |
|--------|-------|--------|-----|---------|
| Runway | >9 mo | 6-9 mo | <6 mo | ⚠️ 7.5 mo |
| Current Ratio | >1.5 | 1.2-1.5 | <1.2 | ⚠️ 1.4 |
| Cash Buffer | >3 mo | 1-3 mo | <1 mo | OK |

### Recommended Actions
1. **Immediate:** Initiate discussions with bank for credit line
2. **30 days:** Create cash flow forecast through Q4
3. **60 days:** Implement expense reduction plan
4. **90 days:** Launch subscription pilot program
```

---

---

## 🔗 Related Skills
- [Investment Due Diligence](./06_investment_due_diligence.skill.md)
- [Revenue Forecast Review](./08_revenue_forecast_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Financial Risk Assessment, tiếp tục với:
→ [Revenue Forecast Review](./08_revenue_forecast_review.skill.md) — Đánh giá dự báo doanh thu

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*