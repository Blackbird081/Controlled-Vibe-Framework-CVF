# Cash Flow Analysis

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
> - [Financial Statement Review](./02_financial_statement_review.skill.md) — Hiểu cơ bản về báo cáo tài chính

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Đánh giá tình hình dòng tiền doanh nghiệp
- Dự báo runway và khả năng chi trả
- Phân tích working capital

**Không phù hợp khi:**
- Chỉ cần xem báo cáo tài chính tổng quan (dùng Financial Statement Review)
- Đánh giá budget đơn giản (dùng Budget Analysis)

---

## 📋 Form Input

### 1. Analysis Period
```
Kỳ phân tích:
VD: Q4 2025, Last 12 months, YTD 2026
```

### 2. Cash Flow from Operations
```
Operating Cash Flow:
- Net Income: $___
- Depreciation/Amortization: +$___
- Changes in Working Capital: +/-$___
- Other adjustments: $___
= Operating Cash Flow: $___
```

### 3. Cash Flow from Investing
```
Investing Cash Flow:
- Capital Expenditures: -$___
- Asset Sales: +$___
- Investments: -$___
= Investing Cash Flow: $___
```

### 4. Cash Flow from Financing
```
Financing Cash Flow:
- Debt Issued/Repaid: +/-$___
- Equity Raised: +$___
- Dividends Paid: -$___
= Financing Cash Flow: $___
```

### 5. Current Cash Position
```
Số dư tiền:
- Beginning Cash: $___
- Ending Cash: $___
- Monthly Burn Rate (if applicable): $___
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Cash Flow Summary
| Category | Amount | % of Total |
|----------|--------|------------|
| Operating | $500K | 70% |
| Investing | -$200K | -28% |
| Financing | $50K | 7% |
| **Net Change** | **$350K** | |

### 2. Key Ratios
- Operating Cash Flow Ratio
- Free Cash Flow
- Cash Conversion Cycle
- Days Sales Outstanding (DSO)

### 3. Runway Analysis
- Current runway (months)
- Burn rate trend
- Break-even projection

### 4. Working Capital Analysis
- AR/AP aging
- Inventory turnover
- Cash conversion efficiency

### 5. Recommendations
- Cash optimization opportunities
- Risk mitigation strategies

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| 3-category breakdown | Có đầy đủ | Thiếu categories |
| Free cash flow calculated | Có tính toán | Không có |
| Runway analysis | Có dự báo | Không có |
| Actionable recommendations | Cụ thể | Vague |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Confuse profit với cash | Làm rõ sự khác biệt |
| Ignore seasonality | Xem xét patterns theo mùa |
| No trend analysis | So sánh với previous periods |
| Miss working capital | Phân tích AR/AP changes |

---

## 💡 Tips

1. **Cash ≠ Profit:** Profitable companies có thể hết tiền mặt
2. **Look at trends:** Một period không đủ, cần xem trend
3. **Free Cash Flow:** FCF = Operating CF - CapEx (metric quan trọng nhất)
4. **Seasonality:** Một số ngành có cash flow theo mùa
5. **Working capital:** AR/AP/Inventory changes ảnh hưởng lớn

---

## 📊 Ví dụ thực tế

**Input:**
```
Period: Q4 2025
Operating CF: $450,000
- Net Income: $380,000
- D&A: +$50,000
- AR Increase: -$30,000
- AP Increase: +$50,000

Investing CF: -$120,000
- CapEx: -$100,000
- Equipment Sale: +$20,000
- Investments: -$40,000

Financing CF: -$80,000
- Loan Repayment: -$50,000
- Dividends: -$30,000

Beginning Cash: $800,000
Ending Cash: $1,050,000
```

**Expected Analysis:**
```markdown

### Input mẫu:
```
Mục tiêu: Hoàn thành Cash Flow Analysis
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần
```

### Output mẫu:
```
Tóm tắt kết quả: Cash Flow Analysis với khuyến nghị/ưu tiên rõ ràng.
```
## Cash Flow Analysis: Q4 2025

### Summary
| Category | Amount | Status |
|----------|--------|--------|
| Operating | +$450K | ✅ Positive |
| Investing | -$120K | ⚠️ CapEx heavy |
| Financing | -$80K | ✅ Debt reduction |
| **Net Change** | **+$250K** | ✅ Strong |

### Key Metrics
| Metric | Value | Benchmark | Status |
|--------|-------|-----------|--------|
| Free Cash Flow | $350K | >$0 | ✅ Healthy |
| Cash/Revenue | 15% | >10% | ✅ Good |
| Operating CF Margin | 12% | >8% | ✅ Good |
| DSO | 45 days | <60 | ✅ Healthy |

### Working Capital Analysis
- AR increased $30K → Monitor collections
- AP increased $50K → Good supplier terms
- Net positive impact: +$20K

### Runway Analysis
- Current Cash: $1.05M
- Monthly Burn: N/A (cash positive)
- Status: ✅ Self-sustaining

### Recommendations
1. Continue debt paydown (low interest environment)
2. Monitor AR aging - 45 DSO is acceptable but watch
3. Consider short-term investment for excess cash
```

---

---

## 🔗 Related Skills
- [KPI Dashboard Audit](./04_kpi_dashboard_audit.skill.md)
- [Investment Due Diligence](./06_investment_due_diligence.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Cash Flow Analysis, tiếp tục với:
→ [Investment Due Diligence](./06_investment_due_diligence.skill.md) — Đánh giá đầu tư chuyên sâu

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*
