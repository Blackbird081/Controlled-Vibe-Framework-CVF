# Presentation

> **Domain:** Content Creation  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Pitch deck cho investors
- Internal business presentations
- Conference talks
- Training materials
- Sales presentations

**Không phù hợp khi:**

- Written reports → Report Writing
- Detailed docs → Documentation
- Website content → Web Development skills

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

- UAT Record: [03_presentation](../../../governance/skill-library/uat/results/UAT-03_presentation.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Presentation type** | Loại presentation | ✅ | "Startup pitch deck" |
| **Audience** | Ai sẽ xem? | ✅ | "VCs và Angel investors" |
| **Goal** | Muốn đạt được gì? | ✅ | "Raise $500K seed round" |
| **Time limit** | Bao lâu? | ✅ | "10 minutes pitch" |
| **Key message** | Core message | ✅ | "AI-powered HR automation" |
| **Main points** | Nội dung chính | ❌ | "Problem, Solution, Traction, Ask" |

---

## ✅ Expected Output

**Kết quả:**

- Slide outline với content suggestions
- Key points per slide
- Speaker notes
- Visual suggestions

**Cấu trúc output (Pitch Deck example):**

```
PITCH DECK OUTLINE | [Company Name]

SLIDE 1: TITLE
• Company name + tagline
• Visual: Logo/product shot

SLIDE 2: PROBLEM
• Pain point (1 sentence)
• Who has this problem
• Why it matters (stats)
• Speaker note: Tell story here

SLIDE 3: SOLUTION
• Your solution (1 sentence)
• How it works (3 bullets)
• Visual: Product demo/screenshot

SLIDE 4: MARKET
• TAM / SAM / SOM
• Growth rate
• Visual: Market size chart

SLIDE 5: TRACTION
• Key metrics
• Growth chart
• Customer logos

SLIDE 6: BUSINESS MODEL
• How you make money
• Pricing
• Unit economics

SLIDE 7: TEAM
• Founders + key hires
• Relevant experience
• Advisors (if notable)

SLIDE 8: FINANCIALS
• Revenue (if any)
• Projections
• Key assumptions

SLIDE 9: ASK
• Amount raising
• Use of funds
• Timeline

SLIDE 10: CLOSING
• Contact info
• CTA
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Logical flow từ problem → solution → ask
- [ ] 1 main idea per slide
- [ ] Text minimal (bullets, not paragraphs)
- [ ] Fits time limit
- [ ] Has clear CTA
- [ ] Visual suggestions included

**Red flags (cần Reject):**

- ⚠️ Too many words per slide
- ⚠️ No logical flow
- ⚠️ Missing key sections
- ⚠️ No call to action

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Too many slides | Specify time limit |
| Text heavy | Request "bullets only, max 6 words" |
| No story arc | Ensure Problem → Solution → Ask flow |
| Weak closing | Always end with clear CTA |

---

## 💡 Tips

1. **1 slide = 1 idea** — No exceptions
2. **6x6 rule** — Max 6 bullets, 6 words each
3. **Start with why** — Problem before solution
4. **End with ask** — What do you want?
5. **Practice timing** — 1 slide ≈ 1 minute

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Presentation type: Investor pitch deck
Audience: VCs (early stage)
Goal: Raise $1M seed round
Time limit: 10 minutes
Key message: CVF helps non-technical users control AI outputs
Main points: Problem (AI unpredictable), Solution (CVF framework), 
             Traction (1000 users), Ask ($1M for 18 months runway)
```

### Output mẫu

```
CVF PITCH DECK | 10 Slides for 10 Minutes

SLIDE 1: TITLE
━━━━━━━━━━━━━━━━━━━━━━━━━━
CVF - Controlled Vibe Framework
"Making AI outputs predictable"
[Logo]

SLIDE 2: PROBLEM
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 70% of AI outputs require revision
• Non-technical users can't evaluate quality
• $50B wasted on AI projects that fail
[Visual: Stat graphic]

🎤 Speaker note: "Have you ever asked ChatGPT 
for something and got completely wrong answer?"

SLIDE 3: SOLUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━
CVF = Simple framework for AI control
• Templates with built-in guardrails
• Evaluation criteria for every output
• Works with any AI tool
[Visual: Before/After comparison]

SLIDE 4: DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Live demo or video - 2 minutes]
Show: Template → Input → Structured Output

SLIDE 5: MARKET
━━━━━━━━━━━━━━━━━━━━━━━━━━
• TAM: $50B (AI productivity tools)
• SAM: $5B (AI governance tools)
• SOM: $50M (SMB focus)
• Growing 40% CAGR
[Visual: Market chart]

SLIDE 6: TRACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━
• 1,000+ users in 3 months
• 50 enterprise pilots
• 85% weekly active rate
• 4.8/5 user satisfaction
[Visual: Growth chart]

SLIDE 7: BUSINESS MODEL
━━━━━━━━━━━━━━━━━━━━━━━━━━
Freemium + Enterprise
• Free: 10 templates
• Pro: $29/month (unlimited)
• Enterprise: Custom pricing
LTV/CAC: 3x

SLIDE 8: TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Founder photos]
• CEO: 10 years enterprise software
• CTO: Ex-Google AI team
• Advisor: [Notable name]

SLIDE 9: ASK
━━━━━━━━━━━━━━━━━━━━━━━━━━
Raising: $1M Seed

Use of funds:
• 60% Engineering (AI + platform)
• 30% Sales (enterprise pilots → paid)
• 10% Operations

18 months runway

SLIDE 10: CLOSING
━━━━━━━━━━━━━━━━━━━━━━━━━━
"Let's make AI work for everyone"

[Contact info]
[QR code to demo]

Thank you!
```

### Đánh giá

- ✅ 10 slides = 10 minutes
- ✅ Clear flow: Problem → Solution → Traction → Ask
- ✅ Minimal text per slide
- ✅ Speaker notes included
- ✅ Strong CTA
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Report Writing](./02_report_writing.skill.md)
- [Documentation](./01_documentation.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Presentation**, quay lại chuẩn hóa tài liệu:
→ [Documentation](./01_documentation.skill.md)

---

*CVF Skill Library v1.5.2 | Content Creation Domain*
