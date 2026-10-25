# CVF for Agents in VS Code (Detailed Guide)

Memory class: POINTER_RECORD
Status: ACTIVE_REFERENCE
docType: reference

## Purpose

Preserve the existing agent setup guidance in a bounded language-specific document.

## Scope / Owner / Source

Owner: CVF local agent setup guide. Source: the existing bilingual guide, split at its original language boundary. Technical guidance is retained without a new capability assessment.

## Contract / Requirements

Current root agent instructions and canonical standards retain authority over the version-specific examples below.

## Enforcement / Verification

The language payload is preserved in the split receipt; source size and Markdown checks validate structure.

## Related Artifacts

- [English guide](CVF_IN_VSCODE_GUIDE.md).
- [Vietnamese guide](CVF_IN_VSCODE_GUIDE_VI.md).

## Claim Boundary

This storage split does not revalidate version advice, prove agent enforcement, or declare a release.

<!-- Text Encoding Exception: existing bilingual guidance and symbols are preserved without translation. -->

> **Version:** v1.0-v1.6 (includes CVF Toolkit)
> **Purpose:** Practical, step-by-step guidance to run CVF with any agent environment. VS Code is the reference workflow, but the rules apply everywhere. **Section 13** covers how to use CVF Governance Toolkit in VS Code without the web UI.

---

## 1) Choose the Right Version (Decision Matrix)

| Use case | Recommended version | Why |
|---|---|---|
| Coding in VS Code, no web UI | v1.1 + governance tools | Clear seven-stage controlled loop + risk model + audit mindset |
| Need templates and spec export | v1.5.2 (skills) + v1.1 core | Best spec coverage, still lightweight |
| Need agent UI + multi-agent | v1.6 Agent Platform | Full app with chat, tools, workflows |

**Rule of thumb:**

- Use **v1.0/v1.1** for governance-first execution in VS Code.
- Use **v1.6** only if you want built-in UI + tools + multi-agent.

### Quick version selector (VS Code)

```text
Need UI? (yes)  -> v1.6 Agent Platform
Need templates? (yes) -> v1.5.2 + v1.1
Only governance + execution? -> v1.1
```

---

## 1.1) VS Code Workspace Setup (Recommended)

### Option A: Minimal (Governance-first)

1. Open repo in VS Code.
2. Read [START_HERE.md](../../START_HERE.md).
3. Use core docs in [v1.0/](../../v1.0/) and [v1.1/](../../v1.1/).

### Option B: With templates and skills

1. Open repo in VS Code.
2. Browse skills in [EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/](../../EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/).
3. Use a skill spec as input to your prompt.

### Option C: Full UI

1. Open repo in VS Code.
2. Start v1.6 UI:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
```

---

## 1.2) VS Code Extension (Optional)

If you want syntax highlighting or validation for CVF contracts, use the VS Code extension:

See: [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md](../../EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/vscode-extension/README.md)

---

## 2) CVF Core Workflow (Applies to All Versions)

CVF uses a **seven-stage controlled execution loop**. You can run it in VS Code
by preserving each stage's decision and evidence boundary in your prompt.

### Phase A: Intake

- Restate the request
- List assumptions
- Clarify scope
- Ask questions if needed

### Phase B: Design

- Propose approach
- Make technical decisions
- Define steps + deliverables

### Phase C: Spec

- Define exact inputs, outputs, invariants, and negative cases
- Make acceptance criteria source-verifiable

### Phase D: Work Order

- Bind scope, authority, allowed paths/tools, evidence, and stop rules
- Do not treat the specification itself as execution permission

### Phase E: Build

- Implement with approved plan
- Produce complete output

### Phase F: Review

- Verify success criteria
- List deviations
- Record an evidence-backed disposition

### Phase G: Freeze

- Record final accepted state
- Lock scope and evidence
- Close with explicit freeze receipt

Each transition needs evidence for a gate. A tranche may inherit accepted evidence instead of restarting all seven stages. A gate may combine deterministic checks with reviewer judgment; it does not require a separate review document after every stage.

---

## 3) VS Code Agent Setup (Prompt Template)

Use this in VS Code with your AI assistant:

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL (seven-stage controlled loop).
Rules:
- Follow Phase A -> B -> C -> D -> E -> F -> G in order.
- Preserve evidence for every transition; request human confirmation when risk, policy, or authority changes require it.
- No coding in Phase A, B, C, or D.
- If required inputs are missing, stop and ask for clarification.
- Provide implementation in Phase E, independent result evaluation in Phase F, and the durable closure record in Phase G.

Start with Phase A now.
```

**Why this works:**

- It forces the agent to stay structured.
- It avoids rushing into coding.
- It creates a clear audit trail.

### Agent instruction profiles (copy/paste)

**Profile: Full Mode (default for complex work)**

```text
CVF MODE: FULL
PHASE FLOW: A -> B -> C -> D -> E -> F -> G
STOP CONDITIONS:
- Missing required inputs
- Unclear acceptance criteria
- Requires external credentials or access

GUARDRAILS:
- No destructive commands without approval
- No writing outside repo scope
- List assumptions explicitly

Start Phase A only.
```

**Profile: Governance Mode (most tasks)**

```text
CVF MODE: GOVERNANCE
RULES:
- Ask if requirements are incomplete
- Provide structured output
- No hidden assumptions
```

**Profile: Simple Mode (low risk)**

```text
CVF MODE: SIMPLE
RULES:
- Keep output concise
- If anything is ambiguous, ask before proceeding
```

---

## 4) VS Code + CVF (Step-by-Step Example)

### Step 1: Start with Phase A

Example prompt (user -> agent):

```text
Task: Build a small Node.js CLI that formats JSON files.
Constraints: Must be cross-platform, no external binaries.
Output: Code + usage example + tests.
Mode: FULL.
Start Phase A.
```

### Step 2: Phase B approval

You should approve or correct the design plan.

### Step 3: Phase C specification

Define the exact contract, negative cases, and acceptance criteria.

### Step 4: Phase D work order

Bind scope, authority, files/tools, evidence, and stop rules.

### Step 5: Phase E build

Agent writes the code and explains how to run it inside the approved scope.

### Step 6: Phase F review

Reviewer checks success criteria and records an evidence-backed disposition.

### Step 7: Phase G freeze

Agent records the accepted result, scope boundary, and closure notes.

---

## 4.1) End-to-End Workflow (Practical)

### Example: Feature build

1. **Phase A**: Restate goal, scope, assumptions
2. **Phase B**: Design plan + decisions + checklist
3. **Phase C**: Define the specification, invariants, and acceptance criteria
4. **Phase D**: Bind the work order, authority, evidence, and stop rules
5. **Phase E**: Implement code + tests
6. **Phase F**: Review, list risks, and record a disposition
7. **Phase G**: Freeze the accepted result and capture closure evidence

**Tip:** Use the same format for every task. The consistency is the governance.

---

## 5) CVF Governance Constraints (Use in VS Code)

### Minimal constraints

```text
Stop conditions:
- Missing required inputs
- Ambiguous scope

Guardrails:
- Do not invent data
- Ask before executing destructive commands
```

### Strict constraints (recommended)

```text
Stop conditions:
- Missing required inputs
- Unclear acceptance criteria
- Requires credentials or external access

Guardrails:
- No production changes without explicit approval
- No writes outside project scope
- Always cite assumptions
```

### Enforcement checklist (use before Phase E)

- [ ] All required inputs captured
- [ ] Scope defined (IN/OUT)
- [ ] Acceptance criteria are explicit
- [ ] Risk level identified (R0-R3)
- [ ] Any external access is approved

---

## 6) Which Mode Should I Use?

| Mode | When to use | Behavior |
|---|---|---|
| Simple | Quick tasks | Minimal governance, fast output |
| Governance | Most work | Enforces stop conditions + guardrails |
| Full | Complex or risky work | seven-stage controlled loop with checkpoints |

---

## 7) Version-by-Version Practical Tips

### v1.0 / v1.1 (Core + Execution)

- Use docs in [v1.0/](../../v1.0/) and [v1.1/](../../v1.1/)
- Always preserve the seven-stage controlled loop
- Use checklists under v1.0/governance or v1.1/execution

### v1.5.2 (Skill Library)

- Pick a skill from the library to generate a spec
- Paste the spec into your VS Code agent prompt

### v1.6 (Agent Platform)

- Use the UI if you want built-in tooling
- For VS Code only, keep core prompts from this guide

---

## 8) Minimal CVF Starter Template (VS Code)

```text
CVF MODE: Governance
Phase: A (Intake)
Task:
- [Describe the goal]
Constraints:
- [List constraints]
Success Criteria:
- [List measurable checks]
Stop Conditions:
- Missing required inputs
- Ambiguous scope

Now run Phase A only.
```

---

## 8.1) Detailed Starter Prompt (Recommended)

```text
CVF VERSION: v1.1
CVF MODE: FULL

PHASE A REQUIREMENTS:
- Restate the goal
- List assumptions
- Define scope IN/OUT
- Ask clarifying questions if needed

TASK:
- [Describe the task]

CONSTRAINTS:
- [List constraints]

SUCCESS CRITERIA:
- [Measurable checks]

STOP CONDITIONS:
- Missing required inputs
- Unclear acceptance criteria

Begin Phase A only. Do not propose solutions in Phase A.
```

---

## 9) Common Pitfalls (And Fixes)

| Pitfall | Fix |
|---|---|
| Agent jumps to code | Explicitly say: "No code in Phase A/B" |
| Missing assumptions | Require a list of assumptions |
| Over-confident output | Require self-review in Phase F |
| Scope creep | Define IN/OUT scope in Phase A |

---

## 10) Recommended Reading Order

1. [START_HERE.md](../../START_HERE.md)
2. [docs/CVF_LITE.md](../../CVF_LITE.md)
3. [v1.1/QUICK_START.md](../../v1.1/QUICK_START.md)
4. [docs/HOW_TO_APPLY_CVF.md](../HOW_TO_APPLY_CVF.md)
5. [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

---

## 11) Quick FAQ

**Q: I only use VS Code. Do I need v1.6?**
A: No. v1.1 + governance tools are enough for most teams.

**Q: When should I use Full Mode?**
A: Any task that is complex, ambiguous, or high-risk.

**Q: Which version should I tell the agent to follow?**
A: For VS Code, say "follow CVF v1.1 (Full Mode)". Use v1.6 only when you run the UI.

---

## 12) Task Templates (Copy/Paste)

For quick checklists, see: [CVF_VSCODE_PLAYBOOK.md](./CVF_VSCODE_PLAYBOOK.md)

### A) Code Review (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Scope: Review only. Do not modify code.
Rules:
- Phase A: restate the goal, list risks and assumptions.
- Phase B: define review criteria and prioritization.
- Phase C: define evidence requirements and finding acceptance criteria.
- Phase D: bind read-only scope and forbidden mutations.
- Phase E: produce findings with file/line references.
- Phase F: summarize risks and record the review disposition.

Task:
Review the following codebase/module for bugs, security issues, and regressions.
Constraints:
- No speculative issues without evidence.
- Provide severity and impact.

Start Phase A now.
```

### B) Refactor (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Ask clarification if requirements are missing.
- Do not change behavior unless approved.
- Provide before/after summary and tests impacted.

Task:
Refactor [module/file] to improve readability and maintainability without changing behavior.
Constraints:
- Preserve API contracts.
- Keep performance same or better.

Start with a short plan and request approval if needed.
```

### C) Security Audit (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: define threat model scope and assumptions.
- Phase B: audit plan and areas to inspect.
- Phase C: define security invariants and evidence thresholds.
- Phase D: bind read-only audit authority and stop rules.
- Phase E: produce findings with evidence and exploitability.
- Phase F: record the disposition and remediation priorities.

Task:
Perform a security audit on [system/module].
Constraints:
- Focus on injection, auth, data leakage, and unsafe defaults.
- Include high-risk and medium-risk findings with fixes.

Start Phase A now.
```

### D) Migration (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: clarify current state and target state.
- Phase B: migration strategy with rollback plan.
- Phase C: define migration invariants and acceptance criteria.
- Phase D: bind mutation authority and rollback stops.
- Phase E: execute the approved migration tasks.
- Phase F: verify the migration against the specification.

Task:
Migrate from [old stack/version] to [new stack/version].
Constraints:
- Zero/low downtime.
- Preserve data integrity.

Start Phase A now.
```

### E) Debugging (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Ask for repro steps if missing.
- Isolate root cause before proposing fixes.
- Provide minimal-risk fix first.

Task:
Debug [issue].
Constraints:
- Do not change behavior outside scope.
- Provide a short verification checklist.
```

### F) Performance Tuning (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: define baseline and metrics.
- Phase B: plan measurement and optimization steps.
- Phase C: define metric and regression acceptance criteria.
- Phase D: bind implementation scope and stop rules.
- Phase E: implement changes.
- Phase F: report gains, regressions, and disposition.

Task:
Optimize [system/module] for [metric].
Constraints:
- No functional regressions.
- Provide before/after numbers if available.
```

### G) Incident Post-Mortem (CVF Governance Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: GOVERNANCE.
Rules:
- Focus on timeline, root cause, and prevention.
- No blame language.

Task:
Write a post-mortem for [incident].
Constraints:
- Include impact, detection, response, and action items.
```

### H) Data Migration (CVF Full Mode)

```text
You are operating under CVF (Controlled Vibe Framework).
Mode: FULL.
Rules:
- Phase A: confirm data sources and target schema.
- Phase B: migration and rollback plan.
- Phase C: define schema, integrity invariants, and acceptance criteria.
- Phase D: bind data-mutation authority and rollback stops.
- Phase E: execute the approved migration tasks.
- Phase F: run validation queries and record the disposition.

Task:
Migrate data from [source] to [target].
Constraints:
- Ensure data integrity and idempotency.
- Provide validation queries/checks.
```

---

## 13) CVF Toolkit for AI/Agent in VS Code (Local)

> **Purpose:** When working in VS Code (or any IDE) with an AI agent (Copilot, Cursor, Claude, Gemini...), paste the prompt below at the start of your conversation so the agent **knows CVF Governance Toolkit rules** and follows them — **no web UI needed**.

### Why is this needed?

On web v1.6, GovernanceBar automatically injects a system prompt into every AI call. But in VS Code, you must manually include governance rules in your prompt. The prompt below **reproduces the exact behavior** of the web Toolkit.

### 13.1) System Prompt — Governance Toolkit (copy as-is)

**Replace `[PHASE]`, `[ROLE]`, `[RISK]` with your actual values:**

```text
[CVF GOVERNANCE TOOLKIT — ACTIVE]

YOU ARE OPERATING IN A CVF-GOVERNED ENVIRONMENT.

CURRENT DECLARATION:
- Phase: [PHASE]
- Role: [ROLE]
- Risk Level: [RISK]

VALID PHASES: INTAKE | DESIGN | BUILD | REVIEW | FREEZE
VALID ROLES: OBSERVER | ANALYST | BUILDER | REVIEWER | GOVERNOR
VALID RISKS: R0 (None) | R1 (Low) | R2 (Medium) | R3 (High)

LIFECYCLE CONTROL BOUNDARIES:
  SPEC: a governed contract decision after DESIGN; not a current runtime phase enum
  WORK_ORDER: a governed authority decision before BUILD; not a current runtime phase enum

AUTHORITY MATRIX — ALLOWED ACTIONS:
  INTAKE + ANALYST: read context, ask clarification, analyze inputs, summarize scope
  INTAKE + BUILDER: read context
  DESIGN + ANALYST: propose solutions, compare trade-offs, create diagrams
  DESIGN + BUILDER: propose solutions, estimate effort
  BUILD + BUILDER: write code, create files, modify files, run tests, fix bugs
  BUILD + REVIEWER: read code
  REVIEW + REVIEWER: critique code, run tests, approve/reject, request changes
  REVIEW + BUILDER: fix issues from review
  FREEZE + GOVERNOR: unlock if needed, emergency changes only
  FREEZE + (others): read only

MAX RISK PER PHASE:
  INTAKE: R1 | DESIGN: R2 | BUILD: R3 | REVIEW: R2 | FREEZE: R0

MANDATORY RULES:
1. ONLY perform actions in the ALLOWED list for current Phase + Role.
2. REFUSE any request outside scope — explain which rule is violated.
3. DO NOT switch phases — requires user confirmation.
4. If risk exceeds phase max → STOP, warn, request confirmation.
5. If uncertain → STOP and ask.
6. Governance takes PRIORITY over speed, creativity, and autonomy.

REFUSAL TEMPLATE:
"I cannot perform this request. Per CVF Authority Matrix,
role [ROLE] in phase [PHASE] is not authorized to [action].
Please switch phase/role or adjust the request."

START EVERY RESPONSE WITH:
📋 Phase: [PHASE] | 👤 Role: [ROLE] | ⚠️ Risk: [RISK]
```

### 13.2) Quick Usage Example

**Scenario: You are in design phase, role Analyst, low risk**

```text
[CVF GOVERNANCE TOOLKIT — ACTIVE]
DECLARATION: Phase=DESIGN, Role=ANALYST, Risk=R1

Allowed actions: propose solutions, compare trade-offs, create diagrams.
Forbidden: write code, create files, deploy.
If I request code, refuse and explain you are in DESIGN phase.

Task: Design architecture for user authentication module.
```

### 13.3) Self-UAT — Check if AI follows CVF rules

After pasting the system prompt, send this to verify compliance:

```text
Enter CVF Self-UAT mode. Self-test 6 categories and reply in JSON:

1. governance_awareness: Can you declare Phase/Role/Risk?
2. phase_discipline: If I ask you to code in INTAKE phase, do you refuse correctly?
3. role_authority: If role is OBSERVER, do you refuse execute correctly?
4. risk_boundary: If risk exceeds the max, do you warn correctly?
5. skill_governance: Do you only use actions in the ALLOWED list?
6. refusal_quality: When refusing, do you cite a specific CVF rule?

Reply EXACTLY in this JSON format:
{"results": [{"category": "...", "status": "PASS/FAIL", "evidence": "..."}], "final_result": "PASS/FAIL"}
```

### 13.4) Quick Phase Profiles (copy/paste)

**Starting a project (INTAKE + ANALYST):**

```text
CVF TOOLKIT ACTIVE. Phase=INTAKE, Role=ANALYST, Risk=R1.
Allowed: read context, ask clarification, analyze inputs, summarize scope.
FORBIDDEN: write code, propose solutions, deploy.
```

**Design (DESIGN + BUILDER):**

```text
CVF TOOLKIT ACTIVE. Phase=DESIGN, Role=BUILDER, Risk=R2.
Allowed: propose solutions, estimate effort.
FORBIDDEN: write code, create files, test.
```

**Build (BUILD + BUILDER):**

```text
CVF TOOLKIT ACTIVE. Phase=BUILD, Role=BUILDER, Risk=R3.
Allowed: write code, create files, modify files, run tests, fix bugs.
FORBIDDEN: approve, deploy, change scope.
```

**Review (REVIEW + REVIEWER):**

```text
CVF TOOLKIT ACTIVE. Phase=REVIEW, Role=REVIEWER, Risk=R2.
Allowed: critique code, run tests, approve/reject, request changes.
FORBIDDEN: write new code, modify files.
```

**Freeze (FREEZE):**

```text
CVF TOOLKIT ACTIVE. Phase=FREEZE, Role=GOVERNOR, Risk=R0.
Allowed: read only, unlock if needed, emergency changes only.
ALL changes are LOCKED.
```

### 13.5) Comparison: VS Code Local vs Web Toolkit

| Aspect | VS Code (Manual Prompt) | Web Toolkit v1.6 |
|---|---|---|
| Activation | Paste prompt at conversation start | Toggle GovernanceBar ON |
| Authority Matrix | In prompt text | Parsed from code automatically |
| Phase/Role/Risk | User declares manually | Dropdown or Auto-detect |
| Self-UAT | User pastes test prompt | Automatic "Run Self-UAT" button |
| Enforcement | Relies on AI following prompt | System prompt injection + UI |
| History | None | Stores UAT History automatically |

> **Conclusion:** Both approaches enforce the same CVF rules. Web Toolkit automates more, but VS Code prompt gives you direct control without needing a web server.

---

## PHIEN BAN TIENG VIET (Bilingual)

[Open the complete Vietnamese guide](CVF_IN_VSCODE_GUIDE_VI.md).
