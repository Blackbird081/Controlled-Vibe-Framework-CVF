# CVF for Solo Developers

**Target:** Individual developers using AI to code  
**Reading time:** 10 minutes  
**CVF Version:** v1.0 (core) — optionally v1.6 (web UI)

---

## Why CVF When You're Coding Alone?

When you code with AI (ChatGPT, Claude, Copilot, Cursor), these problems show up fast:

| Problem | What Happens | CVF Fix |
|---------|-------------|---------|
| **Scope creep** | AI adds features you didn't ask for | Phase A freezes intent |
| **Lost context** | After 10 prompts, AI forgets your goals | Phase B design doc persists |
| **Hidden bugs** | AI code looks right but breaks edge cases | Phase D review checklist |
| **Code debt** | "It works" becomes "I can't maintain this" | Governance structure |
| **Wasted time** | Re-explaining the same thing to AI | Spec files stay as context |

CVF fixes these with **structure without overhead**. You don't need a team, a manager, or special tools. Just 4 phases and a few markdown files.

---

## Quick Start: Your First CVF Project (5 Minutes)

### Option 1: Pure Markdown (Zero Install)

Create a project folder with this structure:

```
my-project/
├── specs/
│   ├── INPUT_SPEC.md      ← What you want to build
│   └── OUTPUT_SPEC.md     ← What "done" looks like
├── decisions/
│   └── DECISION_LOG.md    ← Why you chose X over Y
├── traces/
│   └── AU-001.md          ← What AI actually did
└── src/                   ← Your code
```

**INPUT_SPEC.md** (fill this before asking AI anything):

```markdown
# Project: [Name]

## Objective
[What you want to build in 1-2 sentences]

## Functional Requirements
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

## Out of Scope
- [What you're NOT building]

## Tech Stack
- [Language/Framework]

## Acceptance Criteria
- [ ] [How you know it's done]
- [ ] [How you know it works]
```

**Then give AI your spec:**
```
Read the attached INPUT_SPEC.md. Follow the requirements exactly.
Do not add features not listed. Do not change the tech stack.
If something is unclear, ask before proceeding.
```

That's it. You're using CVF.

---

### Option 2: Web UI (2 Minutes Setup)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

Open http://localhost:3000 → Pick a template → Fill the form → Export → Give to AI.

The web UI guides you through the 4 phases automatically.

> **Note:** You need at least one AI API key (OpenAI, Anthropic, or Google AI). Copy `.env.example` to `.env.local` and add your key.

---

## The 4-Phase Workflow for Solo Devs

### Phase A — DISCOVERY (5 minutes)

**What you do:** Write down what you want. Be specific.

```markdown
## Phase A: Discovery

**Intent:** I want a CLI tool that converts CSV files to JSON.

**Success looks like:**
- Takes a .csv file path as input
- Outputs a .json file in the same directory
- Handles headers as keys
- Handles commas in quoted fields

**Failure looks like:**
- Only works with simple CSVs (no quoted fields)
- Crashes on empty files
- No error messages for bad input

**Constraints:**
- Python 3.10+
- No external dependencies (stdlib only)
- Must handle files up to 100MB
```

**Rule:** Don't skip to code. Finish your intent first.

---

### Phase B — DESIGN (10 minutes)

**What you do:** Sketch the solution approach before coding.

```markdown
## Phase B: Design

**Approach:** 
- Use Python's built-in `csv` module for parsing
- Use `json` module for output
- CLI via `argparse`

**Components:**
1. CLI parser (argparse) → validates input path
2. CSV reader → reads with DictReader (handles headers)
3. JSON writer → dumps list of dicts to file
4. Error handler → catches FileNotFoundError, csv.Error

**Flow:**
CLI input → validate path → read CSV → convert to dicts → write JSON → report success

**How I'll verify (without reading code):**
- Run with sample.csv → get sample.json
- Run with empty.csv → get meaningful error
- Run with bad path → get "file not found" error
```

**Tip:** This doesn't need to be perfect. It just needs to exist so AI has a design to follow, not invent.

---

### Phase C — BUILD (AI does this)

**What you do:** Give AI your Phase A + Phase B docs and let it code.

```
You are an Execution agent. Follow the design exactly.

Read the attached Phase A (Discovery) and Phase B (Design) docs.
Implement the solution as designed.

Rules:
- Do NOT add features not in the spec
- Do NOT change the approach from Phase B
- If the design is not feasible, STOP and tell me why
- Do NOT optimize unless I ask

Create: src/csv_to_json.py
```

**What you DON'T do:** Intervene mid-build. Let AI finish, then review.

---

### Phase D — REVIEW (5 minutes)

**What you do:** Check the output against your Phase A intent.

**Review checklist:**

```markdown
## Phase D: Review

- [ ] Does it take a CSV path as input? → YES
- [ ] Does it output JSON in same directory? → YES
- [ ] Does it handle headers as keys? → YES
- [ ] Does it handle quoted fields? → TEST NEEDED
- [ ] Does it handle empty files gracefully? → TEST NEEDED
- [ ] Does it show errors for bad input? → YES
- [ ] Python 3.10+ only, no external deps? → YES

**Verdict:** ✅ ACCEPT (after testing quoted fields)
```

**If something fails:** Don't fix in Phase D. Go back to Phase B (adjust design) or Phase C (re-execute).

---

## Tips for Solo Success

### 1. Start Simple
Don't use all CVF features at once. Start with just `INPUT_SPEC.md` and Phase D checklist. Add more structure only when you need it.

### 2. Use the 2-Hour Rule
If a task takes more than 2 hours, break it into smaller tasks. Each task gets its own spec and trace.

### 3. Keep a Decision Log
When you choose React over Vue, or Python over Node — write it down. Future you will ask "why did I pick this?"

```markdown
## Decision: Use Python stdlib csv module

**Date:** 2026-02-15
**Context:** Need to parse CSV files
**Options:** pandas, csv module, manual parsing
**Decision:** csv module
**Reason:** No external deps, handles quoted fields, sufficient for <100MB
```

### 4. Trace What AI Did
After each AI session, save a quick trace:

```markdown
## AU-001: Implement CSV parser

**Command:** CVF:EXECUTE
**Input:** Phase A + Phase B specs
**AI Used:** Claude 3.5
**Output:** src/csv_to_json.py (87 lines)
**Review:** ACCEPT — all criteria met
**Time:** 15 minutes
```

### 5. Don't Let AI Decide Scope
AI will always suggest "improvements." Your response:

> "That's interesting but out of scope. Stick to the spec."

---

## When to Level Up

| Signal | Action |
|--------|--------|
| Projects take more than 1 day | Add Phase B (proper design) |
| AI output increasingly wrong | Add INPUT_SPEC (clearer context) |
| Can't remember why you built things | Add Decision Log |
| Working with 1-2 other people | Move to [Team Guide](team-setup.md) |
| Need risk management | Read about [Risk Model](../concepts/risk-model.md) |
| Want pre-built templates | Browse [Skill Library](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |

---

## Common Questions

**Q: Is CVF overkill for small projects?**  
A: No. The minimum viable CVF is just writing down your intent (Phase A) and checking the result (Phase D). That's 10 minutes of overhead that saves hours of rework.

**Q: Do I need the web UI?**  
A: No. Core CVF works with Markdown files only. The web UI just makes it easier to fill forms and manage templates.

**Q: Can I use CVF with Cursor / Windsurf / Cline?**  
A: Yes. CVF is editor-agnostic. Your Phase A + Phase B docs become context for any AI tool.

**Q: What if I forget a phase?**  
A: Start with Phase A and Phase D only. Add B and C when you feel the need. The framework adapts to your workflow.

**Q: How is this different from just writing a prompt?**  
A: A prompt is one-shot. CVF gives you persistent context (specs), decision history, and a review process. When projects get complex, prompts fail — specs don't.

---

## Next Steps

- 📖 [Understand the 4 Phases](../concepts/4-phase-process.md)
- 🧪 [Try Your First CVF Project (Tutorial)](../tutorials/first-project.md)
- 📚 [Browse 114 Skills](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)
- 🖥️ [Set Up Web UI](../tutorials/web-ui-setup.md)
- 👥 [Ready for a team? → Team Guide](team-setup.md)

---

*Last updated: February 15, 2026 | CVF v1.6*
