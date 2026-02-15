# Risk Model

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

CVF's risk model classifies every AI interaction by its potential impact. Higher risk = more controls. This prevents "move fast and break things" from breaking the wrong things.

---

## Risk Levels: R0–R3

| Level | Name | Description | Example |
|-------|------|-------------|---------|
| **R0** | Passive | No side effects, no external impact | Formatting text, summarizing docs |
| **R1** | Controlled | Small, bounded side effects | Internal scoring, code generation, classification |
| **R2** | Elevated | Has authority to act, can chain actions | Auto-planning, multi-step orchestration, cross-service |
| **R3** | Critical | System changes, external impact, hard to reverse | Infrastructure changes, external API calls, data deletion |

### Extended: R4 (Blocked)

| **R4** | Blocked | Severe or irreversible damage possible | Autonomous decisions with no human review |

R4 means: **do not execute under any circumstances**.

---

## What Each Level Requires

| Risk | Can Do | Required Controls | Approval |
|------|--------|-------------------|----------|
| **R0** | Read, write, execute | Logging | None |
| **R1** | Read, write | Logging + Scope Guard | Peer review |
| **R2** | Read only (recommend actions) | Explicit Approval + Audit | ARCHITECT |
| **R3** | Read only (suggest only) | Hard Gate + Human-in-the-loop | GOVERNOR + Security |
| **R4** | Nothing | Blocked | N/A |

### In v1.6 Web UI

| Feature | Risk Level |
|---------|:----------:|
| Templates (read-only forms) | R0 |
| Single agent chat | R1 |
| Multi-agent workflows | R2 |

---

## 5 Risk Dimensions

Every capability or task is assessed across 5 dimensions:

### 1. Authority Risk
> Can it override decisions, act autonomously, modify governance?

| Level | Description |
|-------|-------------|
| R0 | No authority, follows instructions only |
| R1 | Limited authority within predefined scope |
| R2 | Can make decisions that affect other components |
| R3 | Can override governance, modify system behavior |

### 2. Scope Expansion Risk
> Can it expand its own scope, run outside original context, chain uncontrolled?

| Level | Description |
|-------|-------------|
| R0 | Fixed scope, cannot expand |
| R1 | Bounded scope, may generate adjacent content |
| R2 | Can chain actions across components |
| R3 | Can self-expand scope, create new tasks |

### 3. Irreversibility Risk
> Can actions be undone? Is there permanent impact?

| Level | Description |
|-------|-------------|
| R0 | Fully reversible (read-only, formatting) |
| R1 | Mostly reversible (local file changes) |
| R2 | Partially reversible (database changes, API calls) |
| R3 | Irreversible (data deletion, external notifications) |

### 4. Interpretability Risk
> Is it hard to explain, trace logic, audit cause?

| Level | Description |
|-------|-------------|
| R0 | Fully transparent (simple transformation) |
| R1 | Traceable (logic can be followed) |
| R2 | Complex (multi-step reasoning, hard to audit) |
| R3 | Opaque (black-box decision, no clear trace) |

### 5. External Impact Risk
> Does it affect systems outside CVF, call external APIs, impact real world?

| Level | Description |
|-------|-------------|
| R0 | No external impact |
| R1 | Read-only external access (fetch data) |
| R2 | Write to external systems (post data) |
| R3 | Modify external state (deploy, delete, notify) |

---

## Risk Aggregation

**Rule: If ANY dimension reaches R3, the aggregate risk is R3.**

Example assessment:

```markdown
## Risk Assessment: Auto-Deploy Pipeline

| Dimension | Level | Reason |
|-----------|:-----:|--------|
| Authority | R1 | Follows predefined config |
| Scope Expansion | R1 | Fixed set of actions |
| Irreversibility | R3 | Deploys to production (hard to reverse) |
| Interpretability | R1 | Log-traceable |
| External Impact | R3 | Modifies live systems |

**Aggregate Risk: R3** (because Irreversibility=R3 and External Impact=R3)
```

---

## Risk → Agent Behavior Mapping

| Risk Level | Agent Mode | What Agent Can Do |
|------------|-----------|-------------------|
| R0 | **Auto** | Execute autonomously |
| R1 | **Auto + Audit** | Execute with logging |
| R2 | **HITL** (Human-in-the-Loop) | Recommend, human approves |
| R3 | **Suggest-only** | Read-only, no execution |
| R4 | **Blocked** | Disabled |

---

## Risk Rules

These are CVF's non-negotiable risk rules:

1. **A capability cannot self-reduce its risk level.** Only a GOVERNOR can lower risk.

2. **Risk increase → requires a new version.** If a change raises risk, the skill/contract must be versioned.

3. **Runtime context can RAISE risk, never LOWER it.** If a task is R1 by design but runs in a production environment, it might be R2 in practice.

4. **No auto-downgrade mechanism.** Risk levels are set by humans, not negotiated by AI.

5. **Missing risk declaration → High.** If a task has no risk label, treat it as R3 (worst case).

6. **Risk cannot be overridden by the agent.** The agent always operates at or below its declared risk level.

---

## Practical Risk Classification

### Common Tasks by Risk Level

| Task | Risk | Why |
|------|:----:|-----|
| Format code | R0 | No side effects |
| Write unit tests | R0 | No production impact |
| Generate new code file | R1 | Creates files, bounded scope |
| Modify existing code | R1 | Local changes, reversible |
| Database migration script | R2 | Data changes, partially reversible |
| Payment integration | R2 | Financial impact, external API |
| Deploy to production | R3 | External, hard to reverse |
| Delete user data | R3 | Irreversible |
| Send emails to users | R3 | External, can't unsend |
| Auto-approve PRs | R4 | Bypasses governance |

### Quick Decision Guide

```
Is it read-only with no side effects?           → R0
Does it create/modify local files only?          → R1
Does it interact with databases or external APIs? → R2
Can it change production state or affect users?   → R3
Does it bypass human review entirely?             → R4 (BLOCK)
```

---

## Phase-Risk Mapping

Each CVF phase has a typical maximum risk:

| Phase | Max Typical Risk | Why |
|-------|:----------------:|-----|
| A — Discovery | R0 | Just clarifying intent, no actions |
| B — Design | R0 | Proposing approach, no execution |
| C — Build | R1–R2 | Creating artifacts, may involve external |
| D — Review | R0 | Evaluating, no changes |

If Phase C involves R3 actions (e.g., deploy to production), it requires GOVERNOR approval and Hard Gate.

---

## CVF Assessment Framework

For UAT (User Acceptance Testing), risk is evaluated via 3 dimensions:

| Dimension | Question |
|-----------|----------|
| **Capability (C)** | Is the agent operating within its allowed scope? |
| **Validation (V)** | Are outputs backed by clear, traceable references? |
| **Failure Handling (F)** | Does the agent refuse / hedge / hallucinate when uncertain? |

A well-governed agent:
- Stays within capability boundaries (C)
- Provides traceable outputs (V)
- Fails gracefully when uncertain (F)

---

## Risk in Skills

Every skill has a risk level in its metadata:

```markdown
| **Risk Level** | R1 |
```

This tells users:
- R0 skills: Use freely, no governance needed
- R1 skills: Peer review recommended
- R2 skills: ARCHITECT approval before using output
- R3 skills: GOVERNOR must approve

See [Skill System](skill-system.md) for how skills are governed.

---

## Further Reading

- [Governance Model](governance-model.md) — Roles and authority per risk level
- [4-Phase Process](4-phase-process.md) — Phase-risk mapping
- [Enterprise Guide](../guides/enterprise.md) — Risk management at scale
- [Risk Matrix source](../../governance/) — Full risk matrix definitions

---

*Last updated: February 15, 2026 | CVF v1.6*
