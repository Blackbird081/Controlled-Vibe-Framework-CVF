# The 4-Phase Process

CVF organizes every project into 4 sequential phases. Each phase has a specific purpose, clear inputs/outputs, and a gate before the next phase begins.

---

## Overview

```
Phase A          Phase B          Phase C          Phase D
DISCOVERY   →    DESIGN      →    BUILD       →    REVIEW
"What?"          "How?"           "Do it."         "Did it work?"
```

| Phase | Question | Owner | AI Role |
|-------|----------|-------|---------|
| **A — Discovery** | What do we want? | Human | Clarify, don't solve |
| **B — Design** | How will we build it? | Human + AI | Propose approach, don't code |
| **C — Build** | Execute the plan. | AI | Code precisely, don't improvise |
| **D — Review** | Does it match intent? | Human | N/A (human evaluates) |

---

## Phase A — DISCOVERY

> **Goal:** Ensure the problem is understood before anyone writes code.

### What It IS

- Clarifying the **problem to solve**
- Identifying **desired outcomes**
- Recognizing **constraints**
- Defining **success and failure criteria**

### What It Is NOT

- ❌ Gathering technical requirements
- ❌ Writing detailed specifications
- ❌ Defining solutions
- ❌ Choosing tech stack

### Required Content

| Element | Description | Example |
|---------|-------------|---------|
| **Core Intent** | What you want to achieve | "A tool that converts CSV to JSON" |
| **Success Criteria** | How you know it worked | "Output valid JSON, handles 100MB files" |
| **Failure Definition** | What counts as wrong | "Crashes on empty files, loses data" |
| **Scope (In)** | What's included | "CLI interface, file I/O" |
| **Scope (Out)** | What's excluded | "No web UI, no streaming" |
| **Constraints** | Limitations | "Python only, no external deps" |

### Roles in Phase A

| Who | Does |
|-----|------|
| **Human** | Provides initial intent, answers clarifying questions |
| **AI** | Asks clarifying questions, flags ambiguity, refuses to proceed if info missing |

### Rules

- AI may NOT propose solutions in Phase A
- AI may NOT write code in Phase A
- If intent is unclear, AI must ASK, not guess
- Phase A is INCOMPLETE until intent is recorded clearly

### Gate: A → B

Phase A incomplete → **cannot move to Phase B**.

Checklist:

- [ ] Intent recorded clearly
- [ ] Scope defined (in and out)
- [ ] Assumptions stated
- [ ] Constraints identified
- [ ] Success/failure criteria defined

---

## Phase B — DESIGN

> **Goal:** Convert intent into a solution approach before any code is written.

### What It IS

- Designing the **approach** (overall direction)
- Defining the **solution structure** (components, relationships)
- Specifying the **logic flow** (processing sequence, decision points)
- Setting **evaluation criteria** (how user checks without reading code)

### What It Is NOT

- ❌ Writing code
- ❌ Technical optimization
- ❌ Detailed implementation
- ❌ Expanding scope beyond Phase A

### Required Content

| Element | Description | Example |
|---------|-------------|---------|
| **Approach** | Overall direction + why it fits | "Use Python csv module because stdlib" |
| **Components** | Parts and their roles | "CLI parser, CSV reader, JSON writer" |
| **Logic Flow** | Processing sequence | "Input → validate → parse → convert → output" |
| **Evaluation Criteria** | How to verify without reading code | "Run with test.csv → get test.json" |

### Roles in Phase B

| Who | Does |
|-----|------|
| **Human** | Evaluates whether approach is reasonable and follows intent |
| **AI** | Proposes approach, explains logic clearly, ensures it's verifiable |

### Rules

- AI may NOT write implementation code
- AI may NOT expand scope beyond Phase A
- Design must be **verifiable** by someone who can't read code
- Output of Phase B becomes **direct input** for Phase C

### Gate: B → C

```markdown
PHASE_C_GATE Checklist:
- [ ] Goals fixed (no moving target)
- [ ] Design detailed enough to implement
- [ ] Key decisions logged
- [ ] Risks identified
- [ ] Feasibility confirmed
```

All boxes must be checked. PASS or FAIL — no partial.

---

## Phase C — BUILD

> **Goal:** Execute the design from Phase B. Create concrete output for evaluation.

### What It IS

- The **action phase** — answering "How was the agreed design implemented?"
- Implementing exactly what was designed
- Recording artifacts (code, docs, outputs)

### What It Is NOT

- ❌ A place for product decisions
- ❌ A place for design changes
- ❌ A place for scope expansion
- ❌ A place for "making it pretty" unless asked

### Prerequisites

Phase C CANNOT start unless:

- [ ] Phase A complete (intent clear)
- [ ] Phase B complete (design approved)
- [ ] No ambiguous intent remaining
- [ ] No unclear design elements

### Rules

- AI executes design **precisely**
- No optimization outside scope
- No self-modifying structure (AI can't change its own plan)
- If design is not feasible: **STOP Phase C**, log the issue, return to Phase B
- All output must be **traceable** back to design and intent

### Deviation Control

When AI encounters something unexpected during build:

```
Option 1: Minor issue → Log it, continue, note in trace
Option 2: Design gap → STOP, return to Phase B with explanation
Option 3: Scope change needed → STOP, return to Phase A
```

AI NEVER silently changes the design.

### Completion Criteria

- [ ] All artifacts created (code, docs, etc.)
- [ ] Output is evaluable using Phase B criteria
- [ ] No pending build actions
- [ ] Trace log recorded (what was done, what was used)

---

## Phase D — REVIEW

> **Goal:** Does this result match what the user wanted?

### What It IS

- Evaluating output against **original intent** (Phase A)
- Checking against **design criteria** (Phase B)
- Identifying **deviations**
- Making a **decision**: Accept or Adjust

### What It Is NOT

- ❌ Technical debugging
- ❌ Performance optimization
- ❌ Design changes
- ❌ A place to fix things

### Review Process

```markdown
1. Compare output with Phase A intent
   - Does it do what was asked?
   - Does it meet success criteria?
   - Does it avoid failure criteria?

2. Check against Phase B evaluation criteria
   - Run the verification steps from Phase B
   - Does observed behavior match expected behavior?

3. Identify deviations
   - What's different from spec?
   - Is the deviation acceptable?

4. Verdict
   - ✅ ACCEPT: Output meets intent, project can end
   - 🔄 ADJUST: Go back to fix (specify what failed)
```

### Adjust → Where to Go Back?

| Problem Type | Go Back To |
|-------------|-----------|
| Implementation bug | Phase C (re-execute) |
| Wrong design approach | Phase B (re-design) |
| Original intent was wrong | Phase A (re-discover) |

**Never fix directly in Phase D.** Phase D is for evaluation only.

---

## Phase Status Tracking

Each phase has exactly 4 states:

| State | Meaning |
|-------|---------|
| `NOT_STARTED` | Haven't begun this phase |
| `IN_PROGRESS` | Currently working on it |
| `COMPLETED` | Done, gate passed |
| `BLOCKED` | Can't proceed (missing info, dependency) |

**Rule:** Phase N+1 cannot start until Phase N is `COMPLETED`.

---

## Why 4 Phases?

### Why Not 3? (Discovery → Build → Review)

Without Design (Phase B), AI guesses the architecture. Every build becomes a gamble. You end up re-building instead of re-designing.

### Why Not 5+ phases?

More phases = more overhead without proportional value. The 4 phases match natural thinking:

1. What do I want? (think)
2. How should it work? (plan)
3. Make it (do)
4. Does it work? (check)

Adding phases like "Testing" or "Deployment" creates false separatism. Testing is part of Review (Phase D). Deployment is part of Build (Phase C) or a separate project.

---

## When to Loop Back

CVF is NOT waterfall. Looping is expected and healthy:

```
A → B → C → D → ✅ ACCEPT (ideal)
A → B → C → D → 🔄 → C → D → ✅ ACCEPT (minor fix)
A → B → C → D → 🔄 → B → C → D → ✅ ACCEPT (design change)
A → B → C → D → 🔄 → A → B → C → D → ✅ ACCEPT (intent was wrong)
```

**Each loop should be smaller** — you're converging on the right answer, not starting over.

---

## The 4 Phases in v1.6 Web UI

The v1.6 Agent Platform maps each phase to a specialized agent:

| Phase | Agent | AI Recommendation |
|-------|-------|-------------------|
| A — Discovery | 🎯 Orchestrator | Gemini (reasoning) |
| B — Design | 📐 Architect | Claude (design) |
| C — Build | 🔨 Builder | GPT-4 (fast code) |
| D — Review | 🔍 Reviewer | Claude (thoroughness) |

See [Multi-Agent Tutorial](../tutorials/agent-platform.md) for hands-on usage.

---

## Further Reading

- [Core Philosophy](core-philosophy.md) — Why CVF exists
- [Governance Model](governance-model.md) — Roles and authority per phase
- [First Project Tutorial](../tutorials/first-project.md) — Try the 4 phases yourself
- [Phase files (v1.0 source)](../../v1.0/phases/) — Original phase definitions

---

*Last updated: February 15, 2026 | CVF v1.6*
