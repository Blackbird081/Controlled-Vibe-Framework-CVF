# Financial Statement Review

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
>
> - [Budget Analysis](./01_budget_analysis.skill.md) — Hiểu cơ bản về phân tích ngân sách

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Đánh giá sức khỏe tài chính công ty
- Review báo cáo tài chính hàng quý/năm
- Chuẩn bị cho investor meetings hoặc audits

**Không phù hợp khi:**

- Chỉ cần phân tích ngân sách đơn giản (dùng Budget Analysis)
- Đánh giá dòng tiền chi tiết (dùng Cash Flow Analysis)

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

- UAT Record: [02_financial_statement_review](../../../governance/skill-library/uat/results/UAT-02_financial_statement_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

### 1. Statement Type

```
Loại báo cáo cần review:
[ ] Balance Sheet (Bảng cân đối kế toán)
[ ] Income Statement (Báo cáo kết quả kinh doanh)
[ ] Cash Flow Statement (Báo cáo lưu chuyển tiền tệ)
[ ] All three
```

### 2. Reporting Period

```
Kỳ báo cáo:
VD: Q4 2025, FY2025, TTM (Trailing Twelve Months)
```

### 3. Key Figures — Balance Sheet

```
Assets:
- Current Assets: $___
- Fixed Assets: $___
- Total Assets: $___

Liabilities:
- Current Liabilities: $___
- Long-term Debt: $___
- Total Liabilities: $___

Equity: $___
```

### 4. Key Figures — Income Statement

```
Revenue: $___
COGS: $___
Gross Profit: $___
Operating Expenses: $___
EBITDA: $___
Net Income: $___
```

### 5. Comparison Period (Optional)

```
Số liệu kỳ trước để so sánh:
VD: Q4 2024, FY2024
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Key Financial Ratios

| Ratio | Value | Benchmark | Status |
|-------|-------|-----------|--------|
| Current Ratio | 2.1 | >1.5 | ✅ Healthy |
| Debt-to-Equity | 0.8 | <1.0 | ✅ Healthy |
| Gross Margin | 45% | >40% | ✅ Good |
| Net Profit Margin | 12% | >10% | ✅ Good |

### 2. Trend Analysis

- YoY revenue growth
- Margin trends
- Working capital changes

### 3. Red Flags & Concerns

- Deteriorating ratios
- Unusual items
- Off-balance sheet items

### 4. Strengths & Opportunities

- Strong metrics
- Areas of improvement potential

### 5. Executive Summary

- Financial health score (1-10)
- Key takeaways
- Recommended actions

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| Ratio calculations | Đầy đủ, chính xác | Thiếu hoặc sai |
| Benchmark comparison | So với industry/history | Không có context |
| Trend analysis | Có YoY/QoQ comparison | Chỉ snapshot |
| Actionable insights | Recommendations cụ thể | Chỉ mô tả số liệu |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Chỉ list số liệu | Yêu cầu ratio analysis và interpretation |
| Thiếu benchmarks | Cung cấp industry averages hoặc past data |
| Bỏ qua non-GAAP items | Yêu cầu adjust for one-time items |
| Generic conclusions | Yêu cầu specific, actionable recommendations |

---

## 💡 Tips

1. **3-statement linkage:** Kiểm tra sự nhất quán giữa 3 báo cáo
2. **Industry context:** Cung cấp benchmarks ngành để so sánh
3. **YoY comparison:** Luôn so sánh với cùng kỳ năm trước
4. **Non-recurring items:** Flag các khoản bất thường
5. **Common-size analysis:** Yêu cầu tính % của mỗi item

---

## 📊 Ví dụ thực tế

**Input:**

```
Statement: Income Statement
Period: FY2025

Revenue: $5,200,000 (FY2024: $4,500,000)
COGS: $2,860,000
Gross Profit: $2,340,000
Operating Expenses: $1,560,000
EBITDA: $780,000
Net Income: $520,000
```

**Expected Analysis:**

```markdown

### Input mẫu:
```

Mục tiêu: Hoàn thành Financial Statement Review
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần

```

### Output mẫu:
```

Tóm tắt kết quả: Financial Statement Review với khuyến nghị/ưu tiên rõ ràng.

```
## Key Ratios
| Metric | FY2025 | FY2024 | Change |
|--------|--------|--------|--------|
| Revenue Growth | +15.6% | +12% | ↑ Improving |
| Gross Margin | 45.0% | 43.5% | ↑ +1.5pp |
| EBITDA Margin | 15.0% | 14.2% | ↑ +0.8pp |
| Net Margin | 10.0% | 9.5% | ↑ +0.5pp |

## Financial Health Score: 8.2/10

## Key Findings
✅ **Strengths:**
- Revenue growth accelerating (+15.6% vs +12% prior year)
- Margin expansion across all levels
- Operating leverage improving

⚠️ **Watch Items:**
- OpEx growing at 14% (near revenue growth)
- Monitor COGS as % of revenue

## Recommendations
1. Investigate drivers of margin improvement
2. Set OpEx growth cap at 10% for FY2026
3. Consider reinvestment opportunities
```

---

---

## 🔗 Related Skills

- [Budget Analysis](./01_budget_analysis.skill.md)
- [ROI Calculator Review](./03_roi_calculator_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Financial Statement Review, tiếp tục với:
→ [ROI Calculator Review](./03_roi_calculator_review.skill.md) — Đánh giá hiệu quả đầu tư

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*
