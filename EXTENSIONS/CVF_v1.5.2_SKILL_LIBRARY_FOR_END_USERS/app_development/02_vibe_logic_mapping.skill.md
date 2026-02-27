# Vibe Logic Mapping

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] Completed Skill [Vibe-to-Spec Translator](./01_vibe_to_spec.skill.md) with an approved "Vibe Mapping"

---

## 🎯 Purpose

**When to use this skill:**
- Phase B (Design) — after the Vibe Mapping has been approved
- Need to convert confirmed "vibes" into concrete technical parameters (font, color, layout) for AI to use during build
- Ensures UI/UX consistency throughout the entire app

**Not suitable when:**
- No User-confirmed Vibe Mapping exists yet
- App has no UI (pure CLI, API backend)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Architect, Builder |
| Allowed Phases | Design, Build |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Vibe source confirmed, Technical spec generated, Applied changes documented |

---

## ⛔ Execution Constraints

- AI MUST explicitly state: "Because you wanted [Vibe], I applied [Parameter X, Y, Z]"
- AI MUST NOT unilaterally change a vibe that the User has already approved
- Build output MUST visually reflect the mapping (visual changes are verifiable)

---

## ✅ Validation Hooks

- Check that a Vibe source from Skill 01 (Vibe-to-Spec) is present
- Check that the output contains full mapping: Vibe keyword → Font → Color → Layout → Effect
- Check that every technical parameter is directly actionable in code

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-02_vibe_logic_mapping.md`
- UAT Objective: Mapping must be consistent; every vibe must lead to a specific, implementable technical parameter

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **Approved Vibe** | The Vibe Mapping confirmed by the User from Skill 01 | ✅ | "Professional, Minimal" |
| **Tech Stack** | Technology used to build the app | ✅ | "Streamlit", "Next.js", "HTML/CSS" |
| **App Type** | Type of app | ❌ | "Dashboard", "Form app", "Report viewer" |

---

## ✅ Expected Output

**What you will receive — a Technical Spec Table by Vibe:**

```markdown
# Vibe Technical Spec

## Vibe: "Professional"
| Element | Parameter |
|---|---|
| Primary Font | Inter (or equivalent) |
| Background | Dark gray / Light blue-white |
| Text Color | White (dark bg) / Dark (light bg) |
| Layout | Two-column, generous spacing, strict alignment |
| Charts | Donut chart, deep blue + gray |
| Effects | Minimal — highlight on hover only |

## Vibe: "Chill / Relaxed"
| Element | Parameter |
|---|---|
| Primary Font | Rounded (Nunito or equivalent) |
| Background | Cream white / Soft pastel blue |
| Buttons | Large border-radius (very rounded) |
| Icons | Emoji-based or thin outline |
| Effects | Gentle fade-in, no flash |

## Vibe: "Fast / Powerful"
| Element | Parameter |
|---|---|
| Navigation | Collapsible sidebar, icon-only mode |
| Shortcuts | Keyboard shortcuts prioritized |
| Loading | Skeleton loader instead of spinner |
| Accent Color | Red-orange or electric blue |
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**
- [ ] Each vibe has at least 4 technical parameters
- [ ] Parameters are specific enough to implement immediately (no vagueness)
- [ ] AI clearly states rationale: "Because you wanted [X], I chose [Y]"
- [ ] No contradictions between different vibes

**Red Flags (Reject):**
- ⚠️ Parameters too vague: "nice color", "readable font"
- ⚠️ Different vibes produce identical parameters
- ⚠️ No rationale provided for each choice

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Parameters too generic | Each field must have a specific value ready to code |
| Missing chart type | Always declare chart type if app has data visualization |
| No rationale given | Use template: "Because [Vibe] → I chose [Parameter]" |

---

## 💡 Tips

1. **Prioritize 3 common vibes** — Professional, Chill, Fast are the best presets for non-coders
2. **Streamlit users** — Primary color `#FF4B4B`, use `st.columns` and `st.tabs`
3. **State your rationale** — Users gain more trust in AI when they see the logic behind each choice
4. **Stay consistent** — One app should use 1–2 vibes, not mix contradicting ones

---

## 📊 Example

### Sample Input:
```
Approved Vibe: "Professional + Minimal"
Tech Stack: Streamlit (Python)
App Type: Expense management dashboard
```

### Sample Output:
```markdown
# Vibe Technical Spec — "Professional + Minimal"

| Element | Parameter | Rationale |
|---|---|---|
| Font | Inter (via custom CSS) | "Professional" — standard business font |
| Primary Color | #262730 (dark Streamlit gray) | "Minimal" — dark background aids focus |
| Layout | st.columns(2) + st.expander | "Professional" — structured layout |
| Chart | Donut chart (plotly) | "Minimal" — one chart conveys all info |
| Accent | #00B4D8 (blue) | Highlights key numbers without being harsh |
| Effects | st.spinner only on load | "Minimal" — no unnecessary animations |
```

### Evaluation:
- ✅ Every parameter has clear rationale
- ✅ Specific enough to implement immediately
- ✅ No contradiction between vibes
- **Result: ACCEPT**

---

## 🔗 Next Step

After obtaining Technical Spec → [Grandma UX Test](../product_ux/04_grandma_ux_test.skill.md)

---

## 🔗 Related Skills

- [Vibe-to-Spec Translator](./01_vibe_to_spec.skill.md) — Previous step (create Vibe Mapping)
- [Grandma UX Test](../product_ux/04_grandma_ux_test.skill.md) — Next step (verify UX)

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; domain corrected to App Development |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Vibe Logic Mapping — CVF v1.5.2 App Development Skill Library*
