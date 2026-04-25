# Project Init Checklist

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> This is the very first skill in any project — no prerequisites.
> Run BEFORE Phase A (Discovery).

---

## 🎯 Mục đích

**When to use this skill:**
- Starting any new project with AI
- Want to ensure everything is ready before AI begins working
- Use as a "health check" before launching a CVF project

**Not suitable when:**
- Project is already mid-way through (skip and use the appropriate Skill for the current phase)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Orchestrator |
| Allowed Phases | Discovery (Pre-Phase A) |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Checklist passed ≥ 80%, User confirmed, Tracking file initialized |

---

## ⛔ Execution Constraints

- AI MUST NOT begin discussing project content if fewer than 80% of checklist items are confirmed
- AI MUST NOT tick checklist boxes on behalf of the User
- AI MUST create a `governance/PROJECT_PROGRESS.md` tracking file after the User confirms "Checklist Pass"

---

## ✅ Validation Hooks

- Check that ≥ 80% of checklist items are ticked before proceeding
- Check that the User has typed "Checklist Pass" or "Begin"
- Check that the `governance/PROJECT_PROGRESS.md` file is created

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-07_project_init_checklist.md`
- UAT Objective: AI must not start the project when checklist pass rate < 80%; it must create the tracking file after confirmation

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **Project Name** | Short, concise name | ✅ | "FinanceTracker" |
| **One-line Description** | What the app does | ✅ | "Offline household expense tracker" |
| **Operating System** | User's current machine | ✅ | "Windows 11" |
| **Python Installed** | Yes / No | ✅ | "Yes — Python 3.11" |

---

## ✅ Expected Output

**Checklist generated for User to confirm:**

```markdown
# ✅ CVF Project Init Checklist — FinanceTracker

## 1. Foundation
- [ ] Project folder created on the computer?
- [ ] `governance/` folder exists inside the project folder?
- [ ] Python installed? (Or does AI have execution access?)

## 2. The Idea (The Vibe)
- [ ] Have you clearly described what the app will do?
- [ ] Is this an offline/local project (no server needed)? ✅ CVF-compatible
- [ ] Any OS-specific requirements? (e.g., Windows only)

## 3. CVF Compliance
- [ ] Do you agree to follow the 4 steps: Discovery → Design → Build → Review?
- [ ] I will use 🟢🟡🟠🔴 to indicate risk levels — do you agree?

---
Result: [X]/8 items ✅

Type **"Checklist Pass"** to begin, or let me know which item is not ready.
```

**After User confirms — create tracking file:**
```markdown
# PROJECT PROGRESS — FinanceTracker
Start date: 2026-02-27
Current phase: A — Discovery
Status: 🟢 In Progress
```

---

## 🔍 Cách đánh giá

**Accept Checklist:**
- [ ] All 8 checklist items present and clear
- [ ] Current tally shown: "[X]/8 items"
- [ ] Clear confirmation instruction ("Type Checklist Pass")
- [ ] `PROJECT_PROGRESS.md` created after confirmation

**Red Flags (Reject):**
- ⚠️ AI starts asking about spec while checklist has not passed
- ⚠️ AI ticks boxes on behalf of the User
- ⚠️ Tracking file not created after confirmation

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Skipping checklist because User is in a hurry | Gently remind: "This takes only 2 minutes and prevents problems later" |
| User doesn't know how to create governance folder | Guide step by step: "Right-click → New Folder → name it governance" |

---

## 💡 Tips

1. **Quick but correct** — The checklist takes only 2 minutes but prevents many downstream issues
2. **Tracking file is memory** — Always update `PROJECT_PROGRESS.md` after each phase
3. **Offline-first** — CVF works best with local projects, no server required
4. **≥ 80% is enough** — No need for 100% perfection to begin

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Project Name: "SalesTracker"
Description: "Track sales rep performance"
Operating System: Windows 11
Python: Python 3.11 installed
```

### Output mẫu

- 8-item checklist displayed
- User ticks 7/8 (skipped: governance folder not yet created)
- AI guides User to create folder (30 seconds)
- User types "Checklist Pass" → `PROJECT_PROGRESS.md` created
- **Result: ACCEPT** — Begin Phase A

---

## 🔗 Next Step

After Checklist Pass → [App Requirements Spec](./01_app_requirements_spec.skill.md) — begin Phase A

---

## 🔗 Related Skills

- [App Requirements Spec](./01_app_requirements_spec.skill.md) — First skill to use in Phase A
- [App Requirements Spec](./01_app_requirements_spec.skill.md) — Next step after init

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; UAT path updated; tracking file renamed to PROJECT_PROGRESS.md |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Project Init Checklist — CVF v1.5.2 App Development Skill Library*
