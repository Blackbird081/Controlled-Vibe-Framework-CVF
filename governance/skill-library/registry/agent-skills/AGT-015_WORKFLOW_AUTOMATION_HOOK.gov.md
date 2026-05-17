# AGT-015: Workflow Automation Hook

> **Type:** Agent Skill  
> **Domain:** Automation & Triggers  
> **Status:** Active

---

## Source

Inspired by claude-code-templates hooks system (pre/post-tool automation, secret scanners, CI/CD triggers, monitoring hooks).  
Reference: https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/hooks  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-015_WORKFLOW_AUTOMATION_HOOK.md`

---

## Capability

Manages pre-tool and post-tool automation hooks that trigger before or after AI tool actions. Enables CI/CD integration, secret scanning, auto-testing, notification dispatching, and monitoring pipelines.

**Actions:**
- Register pre-tool hooks (security scanner, lint checker, input validator)
- Register post-tool hooks (auto-test runner, notification sender, log aggregator)
- Execute hook chains in priority order with timeout management
- Support event types: PreToolUse, PostToolUse, PreCommit, PostCommit, OnError
- Manage hook lifecycle (enable/disable/update/remove)
- Aggregate hook results and report failures

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Allowed Roles | Orchestrator, Builder |
| Allowed Phases | Build, Review, Deploy |
| Decision Scope | Tactical |
| Autonomy | Supervised (human approves hook registration) |

---

## Risk Justification

- **Code execution** – Hooks execute scripts/commands as side effects
- **Pipeline interference** – Pre-tool hooks can block tool execution
- **Data exposure** – Hook scripts may access workspace content
- **Performance impact** – Excessive hooks degrade response time
- **Cascading failures** – Hook errors may propagate to AI tool chain
- **Secret handling** – Security hooks access sensitive content

---

## Constraints

- ✅ Hooks must be registered with explicit action type and priority
- ✅ Hook execution timeout enforced (default 10s per hook)
- ✅ All hook results logged with event type, hook name, and status
- ✅ Pre-tool hooks can block execution (fail-open or fail-closed configurable)
- ✅ Hook scripts validated against allowed commands list
- ❌ Cannot register hooks without human approval
- ❌ Cannot execute hooks with elevated system privileges
- ❌ Cannot bypass timeout limits
- ❌ Cannot modify other hooks' execution order silently
- ❌ Cannot access credentials outside designated secret store

---

## UAT Binding

**PASS criteria:**
- [ ] Hook registration requires human approval
- [ ] Pre-tool hooks execute before tool invocation
- [ ] Post-tool hooks execute after tool completion
- [ ] Hook timeout enforced (≤10s default)
- [ ] Hook failures logged with full context
- [ ] Hook chain respects priority ordering

**FAIL criteria:**
- [ ] Hooks execute without registration approval
- [ ] Hook timeout exceeded without termination
- [ ] Hook failures silently ignored
- [ ] Hooks access unauthorized resources
