# Portable App Packaging

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.1.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] App has passed Phase D (Review) and has a `USER_GUIDE.md`
- [ ] All dependencies are declared in `requirements.txt` (Python) or `package.json` (Node)

---

## 🎯 Purpose

**When to use this skill:**

- End of Phase D, preparing to hand the app off to other users
- Want recipients to open the app with a single click, no setup required
- Want to send the app as a ZIP file via email or messaging

**Not suitable when:**

- App is a public web service (use AGT-030 Cloud Deployment instead)
- App requires cloud accounts or an external database server

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Builder |
| Allowed Phases | Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Package structure verified, Launch script tested, Dependencies locked |

---

## ⛔ Execution Constraints

- Everything MUST reside in a single folder (no scattered files)
- MUST include a launch file: `START.bat` (Windows) or `start.sh` (Mac/Linux)
- The launch file MUST self-check and install missing libraries (`pip install -r requirements.txt`) on first run
- MUST NOT include a database with personal user data — only an empty schema database

---

## ✅ Validation Hooks

- Check that all required files are present in the folder
- Check that `START.bat` / `start.sh` runs on a clean machine
- Check that `requirements.txt` matches the libraries actually used in the code
- Check that the sample database contains no personal data

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-app_development-06_portable_packaging.md`
- UAT Objective: Recipient can successfully open the app with a single click on `START.bat`, no additional instructions required

---

## 📋 Form Input

| Field | Description | Required | Example |
|-------|-------------|:--------:|---------|
| **App Name** | Name of the delivery folder | ✅ | "FinanceTracker_v1.0" |
| **Tech Stack** | Python + Streamlit / Node.js / other | ✅ | "Python 3.11 + Streamlit" |
| **Recipient OS** | Windows / Mac / Linux | ✅ | "Windows 10/11" |
| **Has Database** | Does the app store local data? | ✅ | "Yes — SQLite" |

---

## ✅ Expected Output

**Generated folder structure:**

```
FinanceTracker_v1.0/
├── START.bat              ← Double-click to open (Windows)
├── start.sh               ← For Mac/Linux
├── app.py                 ← Main code
├── requirements.txt       ← Library list
├── USER_GUIDE.md          ← User guide
├── data/
│   └── finance.db         ← Empty database (no personal data)
└── assets/
    └── logo.png           ← App logo/image (if any)
```

**Contents of `START.bat`:**

```batch
@echo off
echo === Launching FinanceTracker ===
echo Checking libraries...
pip install -r requirements.txt --quiet
echo Opening app...
streamlit run app.py
pause
```

**Delivery instructions for user:**

```
1. Compress the "FinanceTracker_v1.0" folder into a ZIP file
2. Send the ZIP file
3. Recipient extracts and double-clicks START.bat
```

---

## 🔍 Evaluation Criteria

**Accept Checklist:**

- [ ] All files in a single folder
- [ ] `START.bat` / `start.sh` exists and runs successfully
- [ ] `requirements.txt` is correct and complete
- [ ] Database is empty (contains no personal data)
- [ ] `USER_GUIDE.md` is included in the package

**Red Flags (Reject):**

- ⚠️ App uses absolute paths (`C:\Users\Username\...`) — will break on another machine
- ⚠️ `requirements.txt` is missing libraries
- ⚠️ Database contains developer's personal test data

---

## ⚠️ Common Failures

| Common Error | Prevention |
|---|---|
| Absolute paths in code | Use `os.path.dirname(__file__)` instead of hardcoded path |
| Missing libraries in requirements.txt | Run `pip freeze > requirements.txt` before packaging |
| Database contains test data | Create a `reset_db.py` script to generate an empty schema database |

---

## 💡 Tips

1. **Test on another machine** — Always test the package on a clean machine before delivery
2. **Version in folder name** — `AppName_v1.0` helps users identify the version
3. **Short README in ZIP** — Add a very brief `READ_ME_FIRST.txt` at the top level of the folder
4. **Don't zip node_modules** — For Node.js, run `npm install` inside `START.bat`

---

## 📊 Example

### Sample Input

```
App Name: "SalesReport_v1.0"
Tech Stack: Python 3.11 + Streamlit + pandas + plotly
Recipient OS: Windows 10/11
Has Database: SQLite
```

### Sample Output

- Folder `SalesReport_v1.0/` with standard structure
- `START.bat` auto-installs `pip install -r requirements.txt` on first run
- `data/sales.db` empty database with correct schema

### Evaluation

- ✅ 1-click launch successful
- ✅ No absolute paths
- ✅ Empty database
- **Result: ACCEPT**

---

## 🔗 Next Step

After packaging → Send the ZIP file and `USER_GUIDE.md` to the recipient

---

## 🔗 Related Skills

- [Auto Documentation](./05_auto_documentation_vn.skill.md) — Required: USER_GUIDE.md must exist first
- [Local Deployment Spec](./08_local_deployment.skill.md) — For cross-platform installer builds

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-02-27 | Translated to English; UAT path updated |
| 1.0.0 | 2026-02-27 | Initial creation from CVF-Compatible Skills intake |

---

*Portable App Packaging — CVF v1.5.2 App Development Skill Library*
