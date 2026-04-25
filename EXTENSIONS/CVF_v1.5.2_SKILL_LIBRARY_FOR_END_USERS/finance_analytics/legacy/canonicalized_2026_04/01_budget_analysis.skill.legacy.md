# Budget Analysis

> **Domain:** Finance & Analytics  
> **Difficulty:** ⭐ Easy — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Không yêu cầu — Đây là skill đầu tiên trong Finance & Analytics workflow.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Review ngân sách dự án hoặc phòng ban
- Phân tích variance giữa kế hoạch và thực tế
- Đánh giá phân bổ nguồn lực

**Không phù hợp khi:**
- Cần phân tích tài chính phức tạp (dùng Financial Statement Review)
- Đánh giá đầu tư dài hạn (dùng Investment Due Diligence)

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

- UAT Record: [01_budget_analysis](../../../governance/skill-library/uat/results/UAT-01_budget_analysis.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

### 1. Budget Period
```
Kỳ ngân sách cần review:
VD: Q1 2026, FY2025, Jan-Mar 2026
```

### 2. Budget Categories
```
Các hạng mục chi phí chính:
VD:
- Personnel: $120,000
- Marketing: $50,000
- Operations: $30,000
- Technology: $25,000
```

### 3. Actual Spending
```
Chi tiêu thực tế theo hạng mục:
VD:
- Personnel: $115,000 (96%)
- Marketing: $62,000 (124%)
- Operations: $28,000 (93%)
- Technology: $35,000 (140%)
```

### 4. Business Context (Optional)
```
Bối cảnh kinh doanh ảnh hưởng đến ngân sách:
VD: Unexpected marketing campaign, new hire delayed
```

---

## ✅ Expected Output

AI sẽ trả về:

### 1. Variance Analysis Table
| Category | Budget | Actual | Variance | % |
|----------|--------|--------|----------|---|
| Personnel | $120K | $115K | -$5K | -4% |

### 2. Red Flag Identification
- Categories exceeding budget by >10%
- Unusual spending patterns
- Potential overspend risks

### 3. Reallocation Recommendations
- Suggested budget adjustments
- Carry-forward amounts
- Next period recommendations

### 4. Executive Summary
- Overall budget health score
- Key findings (bullet points)
- Action items

---

## 🔍 Cách đánh giá

| Tiêu chí | ✅ Đạt | ❌ Chưa đạt |
|----------|--------|-------------|
| Variance calculated | Có bảng variance đầy đủ | Thiếu calculations |
| Root cause analysis | Giải thích lý do variance | Chỉ liệt kê số liệu |
| Actionable recommendations | Đề xuất cụ thể, khả thi | Recommendations chung chung |
| Risk identification | Flag các vấn đề tiềm ẩn | Bỏ qua warning signs |

---

## ⚠️ Common Failures

| Vấn đề | Cách khắc phục |
|--------|----------------|
| Chỉ so sánh số liệu | Yêu cầu phân tích root cause |
| Thiếu context | Cung cấp business context rõ ràng |
| Generic recommendations | Yêu cầu specific, actionable items |
| Ignore small variances | Set threshold rõ ràng (VD: flag >5%) |

---

## 💡 Tips

1. **Cung cấp đủ data:** Càng nhiều chi tiết, analysis càng chính xác
2. **So sánh YoY:** Bao gồm dữ liệu cùng kỳ năm trước nếu có
3. **Flag thresholds:** Định nghĩa ngưỡng cần chú ý (5%, 10%, 20%)
4. **Rolling forecasts:** Yêu cầu dự báo cho các kỳ tiếp theo
5. **Root cause focus:** Quan trọng hơn là hiểu TẠI SAO variance xảy ra

---

## 📊 Ví dụ thực tế

**Input:**
```
Budget Period: Q4 2025
Categories:
- Marketing: Budget $80K, Actual $95K (+19%)
- R&D: Budget $100K, Actual $85K (-15%)
- Sales: Budget $60K, Actual $58K (-3%)

Context: Launched unexpected Black Friday campaign
```

**Expected Analysis:**
```markdown

### Input mẫu:
```
Mục tiêu: Hoàn thành Budget Analysis
Bối cảnh: Dữ liệu hiện có và giới hạn nguồn lực
Ràng buộc: Deadline 2 tuần
```

### Output mẫu:
```
Tóm tắt kết quả: Budget Analysis với khuyến nghị/ưu tiên rõ ràng.
```
## Variance Summary
- Total Budget: $240K
- Total Actual: $238K
- Overall Variance: -$2K (-0.8%) ✅

## Key Findings
1. ⚠️ Marketing OVER by 19% (+$15K)
   - Root cause: Unplanned Black Friday campaign
   - Impact: Higher CAC but also higher revenue
   
2. ✅ R&D UNDER by 15% (-$15K)
   - Root cause: Delayed hiring (2 positions)
   - Carry forward: Recommend allocating to Q1 2026
   
3. ✅ Sales ON TARGET (-3%)

## Recommendations
1. Formalize campaign budget approval process
2. Reallocate R&D underspend to Q1 hiring
3. Review Marketing ROI from Black Friday spend
```

---

---

## 🔗 Related Skills
- [Financial Statement Review](./02_financial_statement_review.skill.md)
- [Revenue Forecast Review](./08_revenue_forecast_review.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành Budget Analysis, tiếp tục với:
→ [Financial Statement Review](./02_financial_statement_review.skill.md) — Phân tích báo cáo tài chính

---

*CVF Skill Library v1.5.2 | Finance & Analytics Domain*