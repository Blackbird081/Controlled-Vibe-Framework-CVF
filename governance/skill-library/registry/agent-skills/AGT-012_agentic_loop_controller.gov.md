# AGT-012: Agentic Loop Controller

> **Type:** Agent Skill  
> **Domain:** Agentic Operations  
> **Status:** Active

---

## Source

Inspired by Anthropic computer-use-demo & agentic-loop quickstart (multi-step autonomous coding with persistence).  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-012_AGENTIC_LOOP_CONTROLLER.md`

---

## Capability

Manages multi-step autonomous task execution with iteration limits, sandbox enforcement, progress persistence via git, and configurable human review checkpoints.

**Actions:**
- Accept feature specifications and decompose into subtasks
- Execute subtasks sequentially with per-iteration governance checks
- Persist progress via git commits after each subtask
- Enforce bash command allowlists and filesystem restrictions
- Request human review at configurable intervals
- Auto-escalate risk after consecutive failures

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R3 – High** |
| Allowed Roles | Orchestrator (primary), Builder (with approval) |
| Allowed Phases | Build, Review |
| Decision Scope | Strategic |
| Autonomy | Manual (explicit human approval required) |

---

## Risk Justification

- **File system modification** – Creates, edits, and deletes project files autonomously
- **Command execution** – Runs bash commands (within allowlist) on the host
- **Persistence** – Commits to git repository, potentially introducing regressions
- **Multi-step autonomy** – Extended unsupervised execution increases error accumulation risk
- **Resource consumption** – Long-running loops consume compute and API resources
- **Scope creep** – Autonomous agents may drift from original task specification

---

## Constraints

- ✅ Iteration limit mandatory (configurable, no infinite loops)
- ✅ Bash command allowlist enforced (default: ls, cat, npm, node, git, grep, ps, lsof)
- ✅ File operations restricted to project directory only
- ✅ Progress persisted via git commits after each task
- ✅ Human review at configurable intervals (default: every 5 tasks)
- ✅ Risk auto-escalates after 3 consecutive failures
- ✅ Per-iteration audit logging with full command traces
- ✅ Explicit human approval required before first iteration
- ❌ Cannot run commands outside the allowlist
- ❌ Cannot access files outside project directory (sandbox)
- ❌ Cannot bypass iteration limit
- ❌ Cannot skip human review checkpoints
- ❌ Cannot execute without initial approval

---

## UAT Binding

**PASS criteria:**
- [ ] Iteration limit respected (loop terminates)
- [ ] All commands within allowlist
- [ ] File operations within project directory only
- [ ] Git commits after each completed subtask
- [ ] Human review triggered at configured interval
- [ ] Risk escalation after 3 consecutive failures
- [ ] Full audit trail of all commands and file changes
- [ ] Explicit approval obtained before execution

**FAIL criteria:**
- [ ] Infinite loop or iteration limit bypass
- [ ] Command executed outside allowlist
- [ ] File access outside project directory
- [ ] Missing git commits for completed work
- [ ] Human review checkpoint skipped
- [ ] Execution started without approval
- [ ] Incomplete audit trail
