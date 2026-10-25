# Market Research

> **Domain:** Business Analysis  
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

- Nghiên cứu thị trường mới
- Phân tích đối thủ cạnh tranh
- Hiểu customer segments
- Validate product idea

**Không phù hợp khi:**

- Cần primary research (surveys, interviews) → Tự thực hiện
- Số liệu tài chính precise → Cần market data providers
- Comparison strategies → Dùng Strategy Analysis

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [03_market_research](../../../governance/skill-library/uat/results/UAT-03_market_research.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Market focus** | Thị trường nào? | ✅ | "HR Tech SaaS tại Vietnam" |
| **Research goal** | Muốn biết điều gì? | ✅ | "Market size, key players, trends" |
| **Scope** | Địa lý, segment | ✅ | "Vietnam, SMB segment" |
| **Products/Services** | Sản phẩm liên quan | ❌ | "Payroll, HRIS, Recruitment software" |
| **Known players** | Đối thủ đã biết | ❌ | "Base.vn, HRViet, Achamcong" |
| **Data sources preferred** | Nguồn tin cậy | ❌ | "Public reports, news" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- Market overview và sizing
- Key players analysis
- Customer segments
- Trends và opportunities
- Entry barriers và challenges

**Cấu trúc output:**

```
MARKET RESEARCH REPORT

1. Executive Summary
   - Market size estimate
   - Growth rate
   - Key insight

2. Market Overview
   - Definition và scope
   - Value chain
   - Market dynamics

3. Market Sizing
   - TAM / SAM / SOM
   - Growth projections
   - Key drivers

4. Competitive Landscape
   | Player | Market Share | Strengths | Weaknesses |
   
5. Customer Segments
   - Segment A: Size, needs, behavior
   - Segment B: ...

6. Trends & Opportunities
   - Trend 1
   - Opportunity 1

7. Challenges & Barriers
   - Entry barriers
   - Key challenges

8. Recommendations
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Market definition rõ ràng
- [ ] Sizing có methodology
- [ ] Competitive analysis balanced
- [ ] Customer segments actionable
- [ ] Trends relevant và current
- [ ] Sources được cite (nếu có)

**Red flags (cần Reject):**

- ⚠️ Sizing không có basis
- ⚠️ Missing key competitors
- ⚠️ Outdated information
- ⚠️ Too generic, không specific

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Data outdated | Specify cần data gần nhất |
| Missing local players | List known competitors trong input |
| Sizing inflated | Ask for methodology và assumptions |
| Generic trends | Request specific to your market |

---

## 💡 Tips

1. **Narrow scope** — Càng specific càng accurate
2. **List known players** — AI sẽ không miss
3. **Cross-check sizing** — So với industry reports
4. **Ask for sources** — Để verify
5. **Primary research bổ sung** — AI analysis là secondary

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Market focus: EdTech Online courses tại Vietnam
Research goal: Market size, trends, competitive landscape
Scope: Vietnam, B2C, professional skills courses
Products: Online courses, learning platforms
Known players: Kyna, Unica, Edumall, Coursera Vietnam
```

### Output mẫu

```
MARKET RESEARCH: EDTECH VIETNAM

1. Executive Summary
   - Market size: ~$300M (2024)
   - Growth: 15-20% CAGR
   - Key insight: Shift từ degree-focused → skill-based learning

2. Market Overview
   - Definition: Online professional skill courses (B2C)
   - Value chain: Content → Platform → Distribution → Payment
   - Dynamics: Growing internet penetration, young workforce

3. Market Sizing
   - TAM: $300M (online education Vietnam)
   - SAM: $80M (professional skills B2C)
   - SOM: $8M (achievable with strong positioning)
   
   Growth drivers:
   - Remote work acceleration
   - Skill gap in workforce
   - Affordable internet

4. Competitive Landscape
   | Player | Est. Share | Strengths | Weaknesses |
   |--------|-----------|-----------|------------|
   | Kyna | 25% | Content quality | Pricing high |
   | Unica | 20% | Marketplace model | Quality varies |
   | Edumall | 15% | Tech skills focus | Limited topics |
   | Coursera | 10% | Global brand | Language barrier |
   | Others | 30% | Various | Fragmented |

5. Customer Segments
   - Segment A: Young professionals (25-35)
     - Need: Career advancement
     - Behavior: Mobile-first, time-constrained
   - Segment B: Career changers (30-40)
     - Need: New skills for pivot
     - Behavior: Price-sensitive, research heavy

6. Trends & Opportunities
   - Trend: AI/Tech skills in high demand
   - Trend: Micro-learning growing
   - Opportunity: Enterprise partnerships
   - Opportunity: Localized content gap

7. Challenges & Barriers
   - Competition từ free content
   - Completion rates low
   - Payment trust issues

8. Recommendations
   - Focus niche: AI/Tech skills
   - Differentiate on: Mentorship, completion support
   - Go-to-market: Enterprise → B2C
```

### Đánh giá

- ✅ Market clearly defined
- ✅ Sizing có TAM/SAM/SOM
- ✅ Competitive balanced (có cả weaknesses)
- ✅ Segments actionable
- ✅ Trends specific
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Strategy Analysis](./01_strategy_analysis.skill.md)
- [Risk Assessment](./02_risk_assessment.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Market Research**, tiếp tục với:
→ [Strategy Analysis](./01_strategy_analysis.skill.md)

---

*CVF Skill Library v1.5.2 | Business Analysis Domain*
