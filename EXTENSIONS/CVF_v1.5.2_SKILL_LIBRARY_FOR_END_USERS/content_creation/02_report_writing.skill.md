# Report Writing

> **Domain:** Content Creation  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Báo cáo kinh doanh định kỳ
- Analysis reports
- Executive summaries
- Research findings
- Project status reports

**Không phù hợp khi:**

- User guides → Documentation
- Slides → Presentation
- Deep data analysis → Cần analyst

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R0: auto
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [02_report_writing](../../../governance/skill-library/uat/results/UAT-02_report_writing.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Report type** | Loại báo cáo | ✅ | "Q4 Sales Performance Report" |
| **Audience** | Ai sẽ đọc? | ✅ | "CEO và Board" |
| **Key data** | Số liệu chính | ✅ | "Revenue: $2M, Growth: 15%" |
| **Time period** | Khoảng thời gian | ✅ | "Q4 2024" |
| **Key questions** | Cần trả lời gì? | ❌ | "Why growth slowed in Dec?" |
| **Format preference** | Formal/concise? | ❌ | "Executive summary, max 2 pages" |

---

## ✅ Expected Output

**Kết quả:**

- Structured report với clear sections
- Executive summary upfront
- Data-backed insights
- Clear recommendations
- Visual support (suggest charts)

**Cấu trúc output:**

```
REPORT TITLE | Date | Author

1. EXECUTIVE SUMMARY
   - Key findings (3-5 bullets)
   - Recommendation

2. OVERVIEW
   - Context
   - Scope
   - Methodology

3. KEY FINDINGS
   - Finding 1 + data
   - Finding 2 + data
   - Finding 3 + data

4. ANALYSIS
   - What the data shows
   - Why it matters
   - Comparison vs benchmarks

5. RECOMMENDATIONS
   - Action 1
   - Action 2
   - Next steps

6. APPENDIX (if needed)
   - Detailed data
   - Methodology notes
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Executive summary captures key points
- [ ] Findings backed by data
- [ ] Analysis answers key questions
- [ ] Recommendations actionable
- [ ] Appropriate for audience level
- [ ] Professional tone

**Red flags (cần Reject):**

- ⚠️ No executive summary
- ⚠️ Opinions without data
- ⚠️ Missing recommendations
- ⚠️ Too long for audience

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Data dump | Focus on insights, not just data |
| No "so what" | Each finding → meaning → action |
| Wrong length | Specify page limit |
| Generic recommendations | Make specific to context |

---

## 💡 Tips

1. **Lead với conclusions** — Busy readers need summary first
2. **Use numbers** — Quantify everything possible
3. **Compare to benchmarks** — "15% growth vs industry 10%"
4. **Be specific** — "Increase budget by $50K" not "invest more"
5. **Visual suggestions** — Charts make data digestible

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Report type: Monthly Marketing Performance
Audience: Marketing Director
Key data: 
  - Spend: $50K
  - Leads: 500
  - CPL: $100
  - Conversions: 50
  - CAC: $1000
Time period: January 2024
Key questions: 
  - Is CPL trending better or worse?
  - Which channel performs best?
Format: 1-page executive brief
```

### Output mẫu

```
MARKETING PERFORMANCE REPORT | January 2024

EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Key Metrics:
• Leads: 500 (+20% vs Dec)
• CPL: $100 (-15% vs Dec) ✅
• Conversions: 50 (10% rate)
• CAC: $1000 (stable)

🔑 Key Insight: Google Ads outperforming FB by 2x

💡 Recommendation: Shift 20% budget from FB → Google

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHANNEL BREAKDOWN

| Channel | Spend | Leads | CPL | Conv |
|---------|-------|-------|-----|------|
| Google  | $25K  | 300   | $83 | 35   |
| FB      | $20K  | 150   | $133| 12   |
| LinkedIn| $5K   | 50    | $100| 3    |

ANALYSIS
- Google CPL improved 20% with new ad copy
- FB CPL increased due to iOS changes
- LinkedIn high intent but low volume

RECOMMENDED ACTIONS
1. Increase Google budget +$5K
2. Test new FB audiences
3. Keep LinkedIn for enterprise leads

Next Review: Feb 5, 2024
```

### Đánh giá

- ✅ Executive summary clear
- ✅ Data với comparisons
- ✅ Answers key questions
- ✅ Specific recommendations
- ✅ Fits 1-page brief
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Documentation](./01_documentation.skill.md)
- [Presentation](./03_presentation.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Report Writing**, tiếp tục với:
→ [Presentation](./03_presentation.skill.md)

---

*CVF Skill Library v1.5.2 | Content Creation Domain*
