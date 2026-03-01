# Governance Model

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

CVF's governance model defines **who** can do **what**, **when**, and **how** — especially when AI is involved. It scales from solo developers (lightweight) to enterprises (full compliance).

---

## Roles

CVF defines 4 human roles with increasing authority:

| Role | Authority | Typical Person |
|------|-----------|---------------|
| **OBSERVER** | Read, learn, propose ideas | Junior devs, interns, stakeholders |
| **BUILDER** | Execute tasks, create code with AI | Regular developers |
| **ARCHITECT** | Approve designs, set risk levels, review | Senior devs, tech leads |
| **GOVERNOR** | Set policy, approve high-risk, override | VP Eng, security team, CTO |

### Authority by Phase

| Phase | OBSERVER | BUILDER | ARCHITECT | GOVERNOR |
|-------|----------|---------|-----------|----------|
| **A — Discovery** | Read, Propose | Document intent | Full access | Full access |
| **B — Design** | Read | Propose design | Approve design | Override |
| **C — Build** | Read | Execute (R0-R1) | Execute + Approve (R2) | All access |
| **D — Review** | Read | Self-review | Review others | Final approval |

### Role Escalation

```
OBSERVER → BUILDER → ARCHITECT → GOVERNOR
   ↑           ↑           ↑          ↑
  Learn    Demonstrate   Proven    Trusted
           competence    judgment   leadership
```

A person can hold multiple roles depending on context. A senior dev might be ARCHITECT on their team and BUILDER on another team's project.

---

## Agent Archetypes (v1.1)

When AI agents are used, CVF assigns 6 archetypes:

| Archetype | Allowed Actions | Forbidden Actions |
|-----------|----------------|-------------------|
| **Analysis** | Findings, gaps, risks, clarifying questions | Decisions, opening scope |
| **Decision** | Issue decisions within delegated scope | Brainstorming, changing intent |
| **Planning** | Create plans, milestones, dependencies | Execute, commit new scope |
| **Execution** | Execute tasks per frozen plan/scope | Change goals, open scope |
| **Supervisor** | Monitor, escalate, override within governance | Direct execution |
| **Exploration** | Ideas, hypotheses, possible directions | Decisions, commitments |

### Rules
- **1 agent = 1 archetype** at a time
- Role switch requires **terminate current + spawn new**
- Every agent action must specify: archetype + preset + command

---

## Agent Lifecycle

Every AI agent follows 6 mandatory states:

```
Invocation → Binding → Activation → Execution → Transition → Termination
```

| State | What Happens |
|-------|-------------|
| **Invocation** | Agent is created with a specific task |
| **Binding** | Archetype, preset, and governance rules are attached |
| **Activation** | Agent is ready to work (has context) |
| **Execution** | Agent performs its task |
| **Transition** | Agent hands off (escalate, delegate, or role switch) |
| **Termination** | Agent ends — logs output, releases authority |

### Key Rules
- No infinite agents — every agent has a **stop condition**
- Binding requires: archetype + preset + governance
- Transition = terminate old agent, spawn new one (no morphing)
- Termination must log: output + trace

---

## Command Taxonomy (v1.1)

CVF defines 8 commands that structure all interactions:

| Command | Archetype | Purpose | Required Artifacts |
|---------|-----------|---------|-------------------|
| `CVF:PROPOSE` | Exploration / Analysis | Suggest ideas | Proposal, scope boundary |
| `CVF:DECIDE` | Decision | Make a decision | Decision statement, rationale |
| `CVF:FREEZE` | Any | Lock scope/spec | Freeze declaration |
| `CVF:DESIGN` | Planning / Analysis | Create design | Design notes, alternatives |
| `CVF:REFINE` | Planning / Analysis | Improve existing | Before/after diff |
| `CVF:EXECUTE` | Execution | Build something | AU definition, spec links, Skill Preflight declaration (`SKILL_PREFLIGHT_RECORD`) |
| `CVF:REVIEW` | Supervisor / Analysis | Evaluate quality | Findings, verdict |
| `CVF:AUDIT` | Supervisor | Check compliance | Audit report, violation list |

### Execution Spine

Every action follows this flow:

```
INPUT CONTRACT → SCOPE DEFINITION → SCOPE FREEZE → ACTION UNIT → CONTROLLED EXECUTION → OUTPUT + TRACE LOG
```

- Every action must specify: 1 command + 1 archetype + 1 preset + 1 Action Unit
- Must link INPUT/OUTPUT spec
- Build/Execute actions must include Skill Preflight declaration before coding
- Output without review = **non-authoritative**

---

## Authority Hierarchy

From highest to lowest authority:

```
1. CVF Core (framework rules)
2. CVF Extensions (additional governance)
3. Skill Contract (skill-level rules)
4. Skill Registry (authorization layer)
5. Agent Adapter (model-specific config)
6. Agent / Model (lowest — executes only)
```

**The agent is always at the bottom.** It cannot override framework rules, skill contracts, or governance policies.

---

## Phase Gates

Phase gates are quality checkpoints between phases:

### Gate: Phase A → Phase B
```
- [ ] Intent recorded clearly
- [ ] Scope defined (in/out)
- [ ] Success/failure criteria stated
- [ ] Constraints identified
```

### Gate: Phase B → Phase C (PHASE_C_GATE)
```
- [ ] Goals fixed (frozen)
- [ ] Design detailed enough to implement
- [ ] Key decisions logged
- [ ] Risks identified
- [ ] Feasibility confirmed
- [ ] Skill Preflight completed (mapped skill(s) + phase/risk fit)
```

### Gate: Phase C → Phase D
```
- [ ] All artifacts created
- [ ] Output is evaluable
- [ ] No pending build actions
- [ ] No scope expansion from design
```

**Rule:** Gates are PASS/FAIL only. No partial passes. If one box is unchecked, the gate fails.

---

## Governance Modes (v1.6)

The v1.6 web UI offers 3 governance levels:

| Mode | What Happens | Best For |
|------|-------------|---------|
| **Simple** | Chat only, no scoring | Learning CVF, quick tasks |
| **Rules** | AI responses scored 0–100 with accept/reject | Production work, quality control |
| **Full CVF** | Phase gates with checklists, all transitions gated | Compliance, enterprise, high-risk |

### How Quality Scoring Works (Rules Mode)

Each AI response is evaluated across dimensions:
- Did it follow the spec?
- Is the output complete?
- Are there scope violations?

Score: **0–100**. Actions:
- ✅ **Accept** (score ≥ threshold)
- ❌ **Reject** (explain what's wrong)
- 🔄 **Retry** (ask AI to try again)

---

## Governance Toolkit

CVF provides a complete governance toolkit in 7 modules:

```
governance/toolkit/
├── 01_BOOTSTRAP/        System prompts, project init
├── 02_POLICY/           Master policy, risk matrix, versioning
├── 03_CONTROL/          Authority matrix, phase gates, registry
├── 04_TESTING/          UAT, Self-UAT, test specs
├── 05_OPERATION/        Continuous governance, audit, incident
├── 06_EXAMPLES/         Real-world case studies
└── 07_QUICKSTART/       Quick start for SME
```

### Key Documents

| Document | What It Does |
|----------|-------------|
| **Master Policy** | Top-level governance rules for your org |
| **Authority Matrix** | Who can do what in which phase |
| **Risk Matrix** | R0–R3 definitions with controls |
| **Self-UAT** | 6-category quality test for AI interactions |
| **Audit Protocol** | How to audit CVF compliance |
| **Continuous Governance Loop** | Ongoing monitoring (not one-time) |

---

## Self-UAT (User Acceptance Testing)

Every AI interaction can be tested across 6 categories:

| Category | Tests |
|----------|-------|
| **Instruction** | Did AI follow the spec? |
| **Context** | Did AI use provided context correctly? |
| **Output** | Is output format and quality correct? |
| **Risk** | Did AI stay within authorized risk level? |
| **Handshake** | Did AI communicate properly (ask when unclear)? |
| **Audit** | Can the interaction be traced and reviewed? |

**Result:** Pass / Fail per category, with evidence required.

---

## Scaling Governance

| Team Size | Recommended Mode | Key Elements |
|-----------|-----------------|-------------|
| 1 person | Minimal | INPUT_SPEC + Phase D checklist |
| 2–5 people | Simple | + Decision Log + PR template |
| 5–10 people | Rules | + Risk levels + Agent archetypes |
| 10–50 people | Rules + partial Full CVF | + Authority matrix + CI/CD gates |
| 50+ people | Full CVF | + Audit protocol + Continuous governance |

---

## Further Reading

- [Risk Model](risk-model.md) — R0–R3 risk levels in detail
- [4-Phase Process](4-phase-process.md) — Phases and gates
- [Skill System](skill-system.md) — How skills are governed
- [Enterprise Guide](../guides/enterprise.md) — Full governance deployment
- [Governance Toolkit](../../governance/) — Source files

---

*Last updated: February 15, 2026 | CVF v1.6*
