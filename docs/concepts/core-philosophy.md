# Core Philosophy

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

> *"Vibe is necessary — but must be controlled."*

---

## The Problem CVF Solves

AI can write code. But who decides **what** to build, **how** to build it, and **when** it's done?

Without structure:
- AI invents features you didn't ask for
- Scope expands silently
- "It works" replaces "it's correct"
- No one can trace why decisions were made
- Quality depends on prompt luck

CVF exists because **good AI output requires good human input**.

---

## The 7 Principles

### 1. "Vibe is necessary — but must be controlled"

Intuition ("vibe") is a valid starting point. You don't need to write a 50-page spec before asking AI anything. But uncontrolled vibe — firing prompts without intent, accepting whatever comes back — leads to wrong products.

**CVF allows vibe to exist. CVF doesn't let vibe make decisions.**

### 2. "Outcome > Code"

What matters is **what the product does**, not how the code looks. All technical decisions — language, framework, architecture — are means to an outcome, not goals in themselves.

A 50-line script that solves the problem is better than a 500-line "enterprise-grade" solution that over-engineers it.

### 3. "Decisions are first-class citizens"

Every important decision must be **recorded**. Not in Slack. Not in someone's head. In a Decision Log with:
- What was decided
- Why (rationale)
- What alternatives were considered
- Who made the decision

This prevents "why did we build it this way?" conversations 3 months later.

### 4. "Control through structure, not micromanagement"

CVF is NOT about reviewing every line of AI code. It's about:
- Clear phases with defined entry/exit criteria
- Phase gates that catch problems early
- Checklists that make quality checkable

The analogy: a bridge has guardrails. You can drive freely within the lanes. Without guardrails, you fall off.

### 5. "AI is an executor, not a decision-maker"

AI executes within the context you provide. AI doesn't:
- Set project goals
- Define what "done" means
- Choose architecture without direction
- Decide scope

All decisions come from humans. AI implements those decisions.

### 6. "Users don't need to be good at coding"

CVF is designed for **anyone who takes responsibility for the product**: product owners, managers, domain experts, QA testers, founders. You need to:
- Know what you want (intent)
- Recognize when output is wrong (review)

You don't need to:
- Write code
- Understand algorithms
- Debug stack traces

### 7. "Discipline enables sustainable creativity"

Absolute freedom leads to chaos. A musician practices scales so they can improvise jazz. A writer follows story structure so they can surprise readers.

CVF's discipline (phases, specs, checklists) creates space for creativity. Without it, you spend time firefighting instead of building.

---

## How These Principles Show Up in Practice

| Principle | In CVF | Example |
|-----------|--------|---------|
| Vibe + Control | Phase A captures intent; Phase B structures it | Write down your idea → then design it |
| Outcome > Code | Acceptance criteria define success, not code quality | "Can a user log in?" not "Is the auth module clean?" |
| Decisions recorded | Decision Log + Action Unit traces | `DEC-001: Use SQLite because...` |
| Structure, not micro | Phase gates + checklists | Checklist: `[x] Meets spec` |
| AI = executor | AI gets frozen specs, can't expand scope | "Follow this design. Do not add features." |
| Non-coders welcome | Skill forms guide input; no code needed | Fill a form → get structured output |
| Discipline = creativity | Phases free you from "what do I do next?" | Clear path: Discover → Design → Build → Review |

---

## What CVF Is NOT

| CVF Is | CVF Is NOT |
|--------|-----------|
| A framework for governing AI work | An AI tool or product |
| Phases + governance + skills | A specific coding methodology |
| Flexible (use what you need) | All-or-nothing |
| For any AI tool (ChatGPT, Claude, Copilot) | Tied to one AI provider |
| For anyone (devs, PMs, founders) | Only for developers |
| CC BY-NC-ND 4.0, open source | Proprietary |

---

## The Minimum Viable CVF

If you only take one thing from CVF, take this:

1. **Write what you want** (Phase A — 5 minutes)
2. **Check the result** (Phase D — 5 minutes)

That's 10 minutes of overhead that prevents hours of rework.

Everything else — Phase B, governance toolkit, skill library, web UI, risk model — is optional depth that you add when you need it.

---

## Further Reading

- [The 4-Phase Process](4-phase-process.md) — How the phases work
- [Governance Model](governance-model.md) — Roles, authority, risk
- [CVF Manifesto](../../v1.0/CVF_MANIFESTO.md) — Full philosophical foundation

---

*Last updated: February 15, 2026 | CVF v1.6*
