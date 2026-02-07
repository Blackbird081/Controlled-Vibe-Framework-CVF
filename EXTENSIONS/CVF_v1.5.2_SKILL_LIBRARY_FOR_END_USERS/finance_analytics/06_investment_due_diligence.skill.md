# Investment Due Diligence

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐⭐ Advanced — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
> - [Financial Statement Review](./02_financial_statement_review.skill.md) — Hiểu báo cáo tài chính
> - [Cash Flow Analysis](./05_cash_flow_analysis.skill.md) — Phân tích dòng tiền
> - [Financial Risk Assessment](./07_financial_risk_assessment.skill.md) — Đánh giá rủi ro

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá cơ hội đầu tư (M&A, venture, real estate)
- Chuẩn bị investment memo
- Due diligence trước khi commit vốn

**Không phù hợp khi:**
- Đánh giá ROI đơn giản (dùng ROI Calculator Review)
- Chỉ cần phân tích tài chính cơ bản (dùng Financial Statement Review)

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

- UAT Record: [06_investment_due_diligence](../../../governance/skill-library/uat/results/UAT-06_investment_due_diligence.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

### 1. Investment Overview
```
Thông tin đầu tư:
- Target Company/Asset: ___
- Investment Amount: $___
- Investment Type: [Equity/Debt/Hybrid/Real Estate]
- Expected Hold Period: ___ years
```

### 2. Financial Summary
```
Số liệu tài chính chính:
- Revenue (LTM): $___
- EBITDA (LTM): $___
- Net Profit: $___
- Total Debt: $___
- Cash on Hand: $___
- Valuation (if known): $___
```

### 3. Business Model
```
Mô tả business model:
- Revenue streams: ___
- Customer base: ___
- Competitive position: ___
- Growth drivers: ___
```

### 4. Deal Structure
```
Cấu trúc deal:
- Valuation multiple: ___x EBITDA
- Equity stake: ___%
- Key terms: ___
- Exit strategy: ___
```

### 5. Known Risks
```
Rủi ro đã biết:
VD:
- Key customer concentration
- Pending litigation
- Management transition
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Executive Summary
- Investment thesis (2-3 sentences)
- Key highlights
- Deal terms summary

### 2. Financial Analysis
| Metric | Value | Industry Avg | Assessment |
|--------|-------|--------------|------------|
| Revenue Growth | 25% | 15% | ✅ Above |
| EBITDA Margin | 18% | 20% | ⚠️ Below |
| Debt/EBITDA | 2.5x | 3.0x | ✅ Healthy |

### 3. Valuation Assessment
- Multiple comparison
- DCF analysis summary
- Implied returns

### 4. Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Customer concentration | High | High | Diversify in Y2 |

### 5. Due Diligence Checklist
- [ ] Financial audit
- [ ] Legal review
- [ ] Tax analysis
- [ ] Commercial DD
- [ ] Management interviews

### 6. Investment Recommendation
- Go/No-Go decision
- Conditions precedent
- Key negotiation points

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| Comprehensive analysis | Cover all areas | Gaps in analysis |
| Valuation justified | Multiple methods | Single method only |
| Risks identified | Prioritized matrix | Incomplete |
| Clear recommendation | Go/No-Go with reasons | Ambiguous |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Over-reliance on projections | Stress test assumptions |
| Miss qualitative risks | Include management, culture |
| Single valuation method | Use multiple methods |
| Confirmation bias | Challenge investment thesis |

---

## 💡 Tips

1. **Quality of Earnings:** Adjust for non-recurring items
2. **Normalized EBITDA:** Remove one-time costs
3. **Management references:** Always check background
4. **Customer concentration:** Flag if any customer >20%
5. **Working capital:** Don't forget in deal structure
6. **Earn-out provisions:** Align incentives

---

## 📊 Ví dụ thực tế

**Input:**
```
Target: TechCorp SaaS Platform
Investment: $5M for 25% equity
Type: Series A equity

Financials:
- ARR: $3.2M (growing 80% YoY)
- Gross Margin: 75%
- EBITDA: -$800K (investing in growth)
- Cash: $1.5M
- Runway: 18 months

Valuation: $20M pre-money (6.25x ARR)

Risks:
- 2 customers = 40% revenue
- Key developer leaving
```

**Expected Analysis:**
```markdown

### Input mẫu:
```
Mục tiêu: Hoàn thành Investment Due Diligence
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần
```

### Output mẫu:
```
Tóm tắt kết quả: Investment Due Diligence với khuyến nghị/ưu tiên rõ ràng.
```
## Investment Due Diligence: TechCorp

### Executive Summary
TechCorp is a high-growth SaaS platform with strong ARR growth (80%) and 
healthy unit economics (75% GM). Investment thesis: capitalize on market 
expansion in [sector]. Key risks: customer concentration and team stability.

### Financial Analysis
| Metric | TechCorp | SaaS Benchmark | Assessment |
|--------|----------|----------------|------------|
| ARR Growth | 80% | 50% | ✅ Excellent |
| Gross Margin | 75% | 70% | ✅ Healthy |
| Burn Multiple | 0.3x | <1x | ✅ Efficient |
| LTV/CAC | 4.5x | >3x | ✅ Good |

### Valuation Assessment
| Method | Implied Value | Assessment |
|--------|---------------|------------|
| ARR Multiple (6.25x) | $20M | ⚠️ High for Series A |
| Comparable Transactions | $16-22M | ✅ Within range |
| DCF (5yr, 25% discount) | $18M | ⚠️ Slightly below |

**Valuation Opinion:** Fair but at upper end

### Risk Matrix
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Customer concentration | High | High | Require diversification milestone |
| Key person departure | Medium | High | Employment contracts, equity refresh |
| Runway (18mo) | Low | Medium | Bridge round provision |

### Investment Recommendation: ⚠️ CONDITIONAL PROCEED

**Conditions:**
1. Negotiate to $18M pre-money (5.6x ARR)
2. Include customer diversification milestone
3. Employment lock-up for key developer
4. Anti-dilution protection

**Expected Return:** 3-4x in 5 years (25-30% IRR)
```

---

---

## 🔗 Related Skills
- [Cash Flow Analysis](./05_cash_flow_analysis.skill.md)
- [Financial Risk Assessment](./07_financial_risk_assessment.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Investment Due Diligence, tiếp tục với:
→ [Financial Risk Assessment](./07_financial_risk_assessment.skill.md) — Đánh giá rủi ro tài chính tổng thể

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*