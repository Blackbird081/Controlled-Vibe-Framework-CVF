# CVF Lite — Quick Start

> **This document has been superseded by the comprehensive guide.**

**→ Go to the Getting Started Guide**

---

## Quick Links

| Who are you? | Go to |
|-------------|-------|
| 🆕 **New to CVF?** | CVF in 5 minutes |
| 👤 **Solo developer?** | Solo Guide (coming soon) |
| 👥 **Team lead?** | Team Setup (coming soon) |
| 🏢 **Enterprise?** | Enterprise Guide (coming soon) |
| 📚 [**Agent skill library**](/skills) | Browse packages and their usage limits |
| 🚀 **Web UI** | v1.6 Agent Platform |

---

## Why the Change?

We consolidated multiple entry points (START_HERE, CVF_LITE, QUICK_START) into one comprehensive guide at docs/GET_STARTED.md.

**Before:** 3+ entry points → confusing, overlapping  
**Now:** 1 entry point → clear and focused

This reduces confusion and enables faster onboarding.

### What's New (02/15/2026)

✅ **docs/GET_STARTED.md** — Comprehensive guide  
✅ **docs/guides/** — Role-based guides (in progress)  
✅ **docs/tutorials/** — Step-by-step tutorials (in progress)  
✅ **docs/concepts/** — Deep-dive explanations (in progress)  
✅ **docs/cheatsheets/** — Quick reference  
✅ **scripts/quick-start.sh** — One-command setup

See: Getting Started

---

## New Documentation Structure

```
docs/
├── GET_STARTED.md          ← ⭐ START HERE
├── guides/                 ← Role-based guides
│   ├── solo-developer.md
│   ├── team-setup.md
│   └── enterprise.md
├── tutorials/              ← Step by step
│   ├── first-project.md
│   ├── web-ui-setup.md
│   ├── agent-platform.md
│   └── custom-skills.md
├── concepts/               ← Deep dives
│   ├── core-philosophy.md
│   ├── lifecycle.md
│   ├── governance-model.md
│   └── ...
└── cheatsheets/            ← Quick reference
    ├── version-picker.md
    └── troubleshooting.md
```

---

## Previous Content (Archived)

The previous CVF_LITE content (5-minute guide) has been integrated into docs/GET_STARTED.md with richer content.

**Current honest rating:** 7.5/10

---

*Updated: 02/15/2026*

**➡️ Go to GET_STARTED.md now**

**Just read 📥 Form Input and 📤 Expected Output** to get started.

---

## Step 4: Copy & Paste into AI (2 min)

1. Copy the `Form Input` section from the skill file
2. Fill in your information in the fields
3. Paste into AI (Copilot Chat, ChatGPT, Claude, etc.)
4. Check the output against `Expected Output`

**Quick example:**

```
I need a code review for file auth.py:
- Language: Python
- Focus: Security + Performance
- Risk Level: R2 (needs human review)
- Expected: List of issues with severity
```

---

## Step 5: Check Results (1 min)

Use the checklist from `Evaluation Checklist` in the skill file:

- [ ] Is the output in the expected format?
- [ ] No fabricated information (hallucination)?
- [ ] Within declared scope?
- [ ] Appropriate risk level?

**Done.** You just used CVF for the first time. 🎉

---

## Want to Go Deeper?

| Level | File | Description |
|-------|------|-------------|
| Beginner | START_HERE.md | Framework overview |
| Intermediate | docs/HOW_TO_APPLY_CVF.md | Detailed application guide |
| Advanced | v1.1/USAGE.md | Governance + phases |
| Expert | docs/CVF_ARCHITECTURE_DIAGRAMS.md | Full architecture |

---

## Quick FAQ

**Q: Is governance (.gov.md) mandatory?**  
A: No. For individuals, you only need `.skill.md`. Governance is for teams that want to track quality.

**Q: Can I create new skills?**  
A: Yes. Copy a skill file → edit the content → done. See v1.1/templates/ for templates.

**Q: Does CVF lock me into a specific AI tool?**  
A: No. CVF is agent-agnostic. Use it with Copilot, ChatGPT, Claude, Gemini, local LLMs — all work.

**Q: I'm just one person, do I need anything else?**  
A: You only need: CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/ + this guide. Keep controls proportional to risk; use templates and architecture when they help.

<!-- Text Encoding Exception: retains localized reader text and navigation symbols. -->
