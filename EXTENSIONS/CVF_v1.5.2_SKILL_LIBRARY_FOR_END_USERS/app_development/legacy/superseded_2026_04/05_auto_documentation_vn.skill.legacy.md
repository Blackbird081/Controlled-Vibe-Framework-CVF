# Auto Documentation

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] App has completed Phase D (Review) and is ready to ship
- [ ] App can be launched in ≤ 3 steps

---

## 🎯 Purpose

**When to use this skill:**
- End of Phase D (Review), before handing the app to users
- Need to create a `USER_GUIDE.md` file in plain, readable language
- Want a ready-made list of common errors and quick fixes

**Not suitable when:**
- App is intended for developers (use a technical README.md instead)
- App is too complex and requires in-depth documentation (use AGT-016)

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Builder, Reviewer |
| Allowed Phases | Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Quick Start ≤ 3 minutes, Common errors documented, Launch file verified |

---

## ⛔ Execution Constraints

- MUST NOT write complex installation instructions (conda, virtualenv, Docker)
- MUST create a `USER_GUIDE.md` file in plain English
- MUST include a "3 Minutes to Start" (Quick Start) section
- MUST provide a `.bat` (Windows) or shortcut command so Users can click-to-run

---

## ✅ Validation Hooks

- Check that Quick Start has ≤ 5 steps, each step ≤ 1 sentence
- Check that at least 3 common errors are listed with solutions
- Check that a launch file or copy-paste command is included
- Check that no unexplained technical jargon appears in the documentation

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-05_auto_documentation.md`
- UAT Objective: Documentation must be sufficient for a non-coder to successfully launch the app within 5 minutes

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **App Name** | Full name of the app | ✅ | "FinanceTracker — Household Expense Manager" |
| **How to Launch** | Command or file to run the app | ✅ | "Double-click START.bat" or "streamlit run app.py" |
| **Core Features** | 3–5 features users use most often | ✅ | "1. Record expenses 2. View monthly report 3. Export to Excel" |
| **Operating System** | Windows / Mac / Linux | ✅ | "Windows 10/11" |
| **Common Errors** | Issues that often arise during use | ❌ | "App won't open, data not saving" |

---

## ✅ Expected Output

**Auto-generated `USER_GUIDE.md` file:**

```markdown
# 📖 User Guide — FinanceTracker

## ⚡ 3 Minutes to Start

1. **Open the app:** Double-click `START.bat` in the folder
2. **Log in:** Use default credentials: username `admin` / password `1234`
3. **Record an expense:** Click the blue "➕ Record Expense" button, enter the amount, and click Save

✅ Done! The app is ready.

---

## 🗺️ Core Features

### 1. Record Expense
Click "➕ Record Expense" → select category → enter amount → Save

### 2. View Monthly Report
Click "📊 Report" → select month → chart appears automatically

### 3. Export to Excel
Click "📥 Export Excel" → choose save location → click OK

---

## 🆘 Common Issues and Quick Fixes

| Symptom | Cause | Fix |
|---|---|---|
| App won't open | Python not installed | Run INSTALL.bat first |
| Data not showing | Database file was moved | Drag data.db into the data/ folder |
| Blank screen | Browser cache | Press Ctrl+Shift+R to hard reload |

---

## 📞 Support
If you encounter an issue not on this list, take a screenshot and contact: [contact info]
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**
- [ ] Quick Start has ≤ 5 steps sufficient to launch the app
- [ ] At least 3 common errors with resolution steps
- [ ] No unexplained technical jargon
- [ ] `USER_GUIDE.md` file is actually created (not just described)

**Red Flags (Reject):**
- ⚠️ Quick Start requires conda/virtualenv/Docker installation
- ⚠️ Uses "terminal", "command line", "pip install" without explanation
- ⚠️ No error-handling guidance included

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Too technical | Every step must work without opening a terminal |
| Missing common errors | Ask the User: "What most often confuses people using the app?" |
| No launch file | Always create `START.bat` (Windows) or `start.sh` (Mac/Linux) |

---

## 💡 Tips

1. **Test with a real person** — Ask someone who doesn't code to follow the guide
2. **Screenshots help** — Add screenshots to Quick Start for 10x better comprehension
3. **Support contact** — Always include a contact channel at the end of the guide
4. **Update regularly** — When new features are added, update `USER_GUIDE.md` immediately

---

## 📊 Example

### Sample Input:
```
App Name: "StockCheck — Supermarket Inventory"
How to Launch: "Double-click START.bat"
Core Features: "1. Scan barcode 2. View stock 3. Receive goods"
Operating System: Windows 10
```

### Sample Output: Created `USER_GUIDE.md` with all 4 required sections
### Evaluation:
- ✅ Quick Start 3 steps, no terminal required
- ✅ 3 common errors documented
- ✅ File actually created
- **Result: ACCEPT**

---

## 🔗 Next Step

After `USER_GUIDE.md` is ready → [Portable App Packaging](./06_portable_packaging.skill.md)

---

## 🔗 Related Skills

- [Grandma UX Test](../product_ux/04_grandma_ux_test.skill.md) — Verify UX before writing the guide
- [Portable App Packaging](./06_portable_packaging.skill.md) — Package the app before delivery

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; renamed from auto_documentation_vn; UAT path updated |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Auto Documentation — CVF v1.5.2 App Development Skill Library*
