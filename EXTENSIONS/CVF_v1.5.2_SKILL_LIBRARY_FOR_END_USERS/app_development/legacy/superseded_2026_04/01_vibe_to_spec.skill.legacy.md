# Vibe-to-Spec Translator

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> No prerequisites — this skill is typically the first step when a User describes their idea in natural language ("vibe").

---

## 🎯 Purpose

**When to use this skill:**
- User describes the app using feelings or visual metaphors ("Make it look luxurious", "Clean interface like Apple", "Make it smooth")
- Need to convert vague requirements into concrete technical specifications before Design
- Phase A (Discovery) — when a "vibe" has not yet become a spec

**Not suitable when:**
- User already has a detailed technical spec
- Requirements clearly specify colors, fonts, or exact layout values

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Input vibe captured, Output spec generated, User confirmation required |

---

## ⛔ Execution Constraints

- AI MUST NOT choose colors or fonts without first listing options for the User to review
- AI MUST NOT use technical jargon (CSS, Hex code, Padding) when explaining to the User
- AI MUST NOT start coding or designing before the User confirms the "Vibe Mapping"
- Only operates in Phase A (Discovery) and Phase B (Design)

---

## ✅ Validation Hooks

- Check that at least 1 "vibe" keyword from the User is captured before starting
- Check that the Vibe Mapping Table output has exactly 3 columns (Keyword → Visual Attribute → Concrete Action)
- Check that User has confirmed with "Approve Vibe" before proceeding to the next step

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-01_vibe_to_spec.md`
- UAT Objective: Skill must produce a Vibe Mapping Table without technical jargon and must include a User confirmation step

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **Vibe Description** | User describes the desired feeling or style | ✅ | "I want the app to look luxurious and professional like a banking app" |
| **App Type** | Type of app being built | ✅ | "Personal finance manager", "Reporting dashboard" |
| **Target Users** | Who will use this app | ❌ | "Office workers, age 25–40" |

---

## ✅ Expected Output

**What you will receive — a Vibe Mapping Table:**

```markdown
# Vibe Mapping Table

| Your Keyword | I understand it as... | I will build... |
|---|---|---|
| "Luxurious" | Dark tones, black/deep blue background, minimal clutter | Dark background, white text, simple icons |
| "Professional" | Clean readable font, structured layout | Aligned text, compact navigation |
| "Smooth" | Gentle transitions, no flicker | Fade-in effect on page transitions |

---
Do you agree with how I interpreted your "vibe"?
Type "Approve Vibe" so I can begin designing.
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**
- [ ] Vibe Mapping Table has all 3 columns
- [ ] No technical jargon (CSS, hex, padding) in the table
- [ ] AI ends with a confirmation question
- [ ] User has typed "Approve Vibe" before proceeding

**Red Flags (Reject):**
- ⚠️ AI chooses a specific color without asking the User
- ⚠️ Mapping table uses technical terms like "#1A1A2E" or "border-radius"
- ⚠️ AI starts coding or designing before confirmation

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Hex color in mapping table | Use plain color names: "deep blue", "light gray" |
| Skipping confirmation step | Always end the table with a question for the User |
| Vibe mapped too vaguely | Every vibe must map to a buildable concrete action |

---

## 💡 Tips

1. **Ask follow-up if vibe is ambiguous** — "Luxurious like Rolex or luxurious like Zara?"
2. **Maximum 5 vibe keywords** — More than 5 creates contradictory design signals
3. **Vibe → Action** — Every descriptive word must lead to 1 specific buildable action
4. **Never self-decide** — User must confirm each choice

---

## 📊 Example

### Sample Input:
```
Vibe Description: "I want my expense tracker to look chill and minimal like Notion"
App Type: Personal finance manager (Streamlit)
```

### Sample Output:
```markdown
# Vibe Mapping Table

| Your Keyword | I understand it as... | I will build... |
|---|---|---|
| "Chill" | Relaxed, no pressure | Cream white background, generous whitespace |
| "Minimal" | Simple, content-focused | Simple font, minimal color palette |
| "Like Notion" | Clean, distraction-free | Plain font, no flashy animations |

Do you agree? Type "Approve Vibe" so I can begin designing.
```

### Evaluation:
- ✅ No technical jargon
- ✅ Every vibe has a concrete action
- ✅ Confirmation question present
- **Result: ACCEPT**

---

## 🔗 Next Step

After the Vibe Mapping is approved → [Vibe Logic Mapping](./02_vibe_logic_mapping.skill.md)

---

## 🔗 Related Skills

- [App Requirements Spec](./01_app_requirements_spec.skill.md) — Next step after vibe is mapped

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; domain corrected to App Development |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Vibe-to-Spec Translator — CVF v1.5.2 App Development Skill Library*
