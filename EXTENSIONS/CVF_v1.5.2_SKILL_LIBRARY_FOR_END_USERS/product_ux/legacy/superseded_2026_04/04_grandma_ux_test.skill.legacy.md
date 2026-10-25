# Grandma UX Test

> **Domain:** Product UX
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] An app or UI prototype is available for evaluation (Phase B Design or Phase D Review)

---

## 🎯 Purpose

**When to use this skill:**

- Phase B (Design) — evaluate design friendliness before building
- Phase D (Review) — final UX check before shipping
- Ensuring the app is usable by someone unfamiliar with technology

**Not suitable when:**

- App is exclusively for developers or technical experts
- Only code logic needs review, not UX

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Architect, Reviewer |
| Allowed Phases | Design, Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | UX checklist applied, 3-step test documented, Issues prioritized |

---

## ⛔ Execution Constraints

- AI MUST list the 3 simplest steps for a first-time user to start using the app
- Evaluation language MUST NOT use: "Component", "Render", "State", "API"
- Buttons must be large, clear, and color-coded (Green = Save, Red = Cancel/Delete)
- Always include a "Processing..." or "Done!" status message when the app performs an action

---

## ✅ Validation Hooks

- Check that a 3-step Quick Start for new users is present
- Check that each UX rule is evaluated (buttons, language, states)
- Check that issues are classified: Must Fix / Should Fix / Optional

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-product_ux-04_grandma_ux_test.md`
- UAT Objective: Output must include a 3-step guide and a prioritized issue list

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **App Description** | What the app does and who it's for | ✅ | "Household expense tracker for homemakers" |
| **Core Features** | The most common tasks users perform | ✅ | "Record expenses, view monthly report" |
| **Screenshot / UI Description** | What the current interface looks like | ❌ | "Left sidebar, data table in the center" |

---

## ✅ Expected Output

**What you will receive:**

```markdown
# Grandma UX Test Report

## Quick Start (3 steps to begin)
1. Open app → see main screen with a large green "Record Expense" button
2. Click the green button → enter amount and select category → click "Save"
3. Click "View Report" → see this month's chart

## UX Evaluation

### ✅ Passed
- "Save" button is green, "Delete" button is red — clear distinction
- "Saved successfully!" message appears after saving

### ⚠️ Must Fix
- "Amount" input has no placeholder — User doesn't know what to enter
- "Export" button is too small, hard to tap on mobile

### 💡 Optional
- Add a "Cancel" button on the input form so User doesn't get stuck

## UX Score
🟢 Ease of Use: 7/10 — A non-tech user can use it independently after 5 minutes of guidance
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**

- [ ] Exactly 3 Quick Start steps, each ≤ 2 sentences
- [ ] Issues classified clearly: Must Fix / Should Fix / Optional
- [ ] No technical jargon in report
- [ ] Overall UX score provided

**Red Flags (Reject):**

- ⚠️ Quick Start has more than 5 steps
- ⚠️ Report uses "component", "state", "render"
- ⚠️ Issue severity not differentiated

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Quick Start too detailed | Each step = one main action only |
| Evaluation too technical | Ask: "Could a 60-year-old grandma do this?" |
| Mobile UX overlooked | For web apps, always check mobile layout too |

---

## 💡 Tips

1. **The golden question** — "If you knew nothing about this app, what would you do first?"
2. **Button color test** — Green = Save/Next, Red = Delete/Cancel, Gray = Secondary
3. **Check state feedback** — Every action must have a response (loading, success, error)
4. **Font size** — Text must be no smaller than 14px (equivalent to size M on mobile)

---

## 📊 Example

### Sample Input

```
App Description: "Medication reminder app for the elderly"
Core Features: "Set reminders, mark as taken, view history"
```

### Sample Output

```markdown
# Grandma UX Test — Medication Reminder App

## Quick Start (3 steps)
1. Open app → see today's medication list
2. Tap the medication name → tap the large green "Taken" button
3. Tap "History" to view previous days

## Evaluation
### ✅ Passed
- "Taken" button is large and green — clear
### ⚠️ Must Fix
- Font size too small (12px) — hard to read for elderly users
- No alert when medication is overdue
### 💡 Optional
- Add a large-text mode

## Score: 🟡 6/10 — Fix font before shipping
```

### Evaluation

- ✅ 3-step Quick Start is clear
- ✅ Issues have priority levels
- ✅ Specific UX score
- **Result: ACCEPT**

---

## 🔗 Next Step

After passing UX Test → [Auto Documentation](../app_development/05_auto_documentation_vn.skill.md)

---

## 🔗 Related Skills

- [Vibe Logic Mapping](../app_development/02_vibe_logic_mapping.skill.md) — Apply vibe before UX test
- [Auto Documentation](../app_development/05_auto_documentation_vn.skill.md) — Write user guide after passing UX test

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; domain corrected to Product UX |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Grandma UX Test — CVF v1.5.2 Product UX Skill Library*
