# ROI Calculator Review

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
>
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

- UAT Record: [03_roi_calculator_review](../../../governance/skill-library/uat/results/UAT-03_roi_calculator_review.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

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

### Input mẫu:
```

Mục tiêu: Hoàn thành ROI Calculator Review
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần

```

### Output mẫu:
```

Tóm tắt kết quả: ROI Calculator Review với khuyến nghị/ưu tiên rõ ràng.

```
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

---

## 🔗 Related Skills

- [Financial Statement Review](./02_financial_statement_review.skill.md)
- [KPI Dashboard Audit](./04_kpi_dashboard_audit.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành ROI Calculator Review, tiếp tục với:
→ [KPI Dashboard Audit](./04_kpi_dashboard_audit.skill.md) — Đánh giá dashboard metrics

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*
