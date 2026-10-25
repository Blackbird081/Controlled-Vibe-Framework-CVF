# Industry UI Reasoning

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-22  
> **Inspired by:** [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT License)

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

Cho một ngành cụ thể, output design system recommendations: recommended pattern, style, color mood, typography, effects, và anti-patterns cần tránh. Dựa trên 100 industry-specific reasoning rules.

**Khi nào nên dùng:**

- Bắt đầu dự án cho ngành mới (chưa quen)
- Cần justify design decisions cho client
- Muốn industry-standard UI cho sản phẩm
- Research best practices cho vertical market

**Không phù hợp khi:**

- Sản phẩm internal (không cần industry alignment)
- Art/creative project không cần business reasoning

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
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

- UAT Record: [industry_ui_reasoning](../../../governance/skill-library/uat/results/UAT-industry_ui_reasoning.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Bắt buộc | Mô tả | Ví dụ |
|-------|----------|-------|-------|
| **Ngành** | ✅ | Industry/vertical | "Fintech — Personal Finance" |
| **Loại sản phẩm** | ✅ | SaaS, mobile app, landing... | "Mobile banking app" |
| **Đối tượng** | ✅ | Target users | "Millennials 25-35, tech-savvy" |
| **Competitors** | ❌ | Đối thủ tham khảo | "Revolut, Wise, Nubank" |
| **Region** | ❌ | Thị trường mục tiêu | "Southeast Asia" |

---

## ✅ Expected Output

```
INDUSTRY REASONING: [Ngành]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INDUSTRY: Fintech — Personal Finance
PRODUCT TYPE: Mobile banking app

RECOMMENDED PATTERN: Dashboard-First
  Rationale: Users need instant overview of finances
  Layout: Balance card → Recent transactions → Quick actions
  CTA: Send/Receive money (prominent, easy reach)

STYLE PRIORITY:
  1st: Clean Data UI — Trust through clarity
  2nd: Modern Flat — Professional, fast-loading
  3rd: Soft UI — If targeting younger audience

COLOR MOOD: Trust + Growth
  Primary:   Navy (#1E3A5F) — Stability, trust
  Accent:    Green (#22C55E) — Growth, positive
  Warning:   Amber (#F59E0B) — Caution
  Error:     Red (#EF4444) — Alert
  AVOID:     Neon, playful pastels, pink

TYPOGRAPHY:
  Heading: Inter / SF Pro — Clean, professional
  Numbers: Tabular figures (monospace numbers)
  Mood:    Professional, trustworthy

KEY EFFECTS:
  • Micro-interactions on transactions
  • Skeleton loading (never empty screens)
  • Haptic feedback on key actions (mobile)
  • Secure feel: biometric, lock animations

ANTI-PATTERNS (DO NOT USE):
  ✗ Glassmorphism with blur — Performance + trust concern
  ✗ Bright neon colors — Feels unserious for money
  ✗ Gamification overload — Not appropriate for finance
  ✗ Auto-playing animations — Distrust in money apps
  ✗ Comic/playful fonts — Undermines credibility

INDUSTRY BENCHMARKS:
  Revolut: Dark + neon accents (crypto audience)
  Wise: Clean white + blue (simplicity)
  Nubank: Purple + minimal (disruptor brand)
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Pattern recommendation phù hợp product type
- [ ] Style priority ranked với reasoning
- [ ] Colors có hex codes + emotional rationale
- [ ] Typography phù hợp ngành
- [ ] Anti-patterns specific (≥ 4 items) với reasoning
- [ ] Industry benchmarks referenced
- [ ] Actionable — team có thể implement ngay

**Red flags (cần Reject):**

- ⚠️ Generic "use clean design" không specific ngành
- ⚠️ Anti-patterns quá ít hoặc quá generic
- ⚠️ Không mention trust/credibility cho finance
- ⚠️ Recommend trendy styles without business justification

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Copy competitor blindly | Understand WHY their design works |
| Ignore cultural context | Research target market preferences |
| Follow trends over trust | Industry conventions > trends |
| Generic anti-patterns | Specific to vertical market |
| Miss regulatory requirements | Healthcare: HIPAA, Finance: SOC2 |

---

## 💡 Tips

1. **Trust signals** — Finance/Healthcare need trust, Gaming needs excitement
2. **Cultural fit** — Colors mean different things in different cultures
3. **Competitor analysis** — Study top 3 competitors' UI choices
4. **Anti-patterns save time** — Knowing what NOT to do prevents rework
5. **Document reasoning** — "We chose navy because..." for stakeholder buy-in

### Industry Quick Reference

```
Healthcare:  Blue/green, clean, HIPAA-friendly
Fintech:     Navy/dark, trust-focused, data-dense
Beauty/Spa:  Soft pink/sage, calming, premium
EdTech:      Bright/playful, engaging, gamified
SaaS B2B:    Professional, clean, feature-focused
Gaming:      Dark, neon accents, immersive
E-commerce:  White/clean, product-focused, CTA-driven
```

---

## 📊 Ví dụ thực tế

### Input

```
Ngành: Healthcare — Telemedicine
Loại: Patient-facing web app
Đối tượng: Patients 30-65, varying tech literacy
Region: Vietnam
```

### Output tóm tắt

```
Pattern: Appointment-First Dashboard
Style: Clean Minimal — Trust, simplicity, readability
Colors: Medical Blue #2563EB + White + Green (vitals OK)
Typography: Inter (clear at all sizes, VN support)
Anti-patterns: ✗ Dark mode (medical anxiety), ✗ Red as primary (alarm)
Benchmarks: Doctor Anywhere, MyVinmec, Halodoc
```

### Đánh giá: ✅ ACCEPT

---

## 🔗 Related Skills

- [Design System Generator](../product_ux/design_system_generator.skill.md)
- [UI Style Selection](../product_ux/ui_style_selection.skill.md)
- [Landing Page Pattern](../web_development/07_landing_page_pattern.skill.md)

---

*CVF Skill Library v1.5.2 | App Development Domain | Adapted from UI UX Pro Max (MIT)*
