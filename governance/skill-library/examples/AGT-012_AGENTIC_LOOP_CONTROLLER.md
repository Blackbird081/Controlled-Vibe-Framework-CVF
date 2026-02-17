# SKILL MAPPING RECORD
## AGT-012: Agentic Loop Controller

> **Status:** ✅ Active  
> **Risk Level:** R3  
> **Last UAT:** 2026-02-17 — PASS

---

## 1. Skill Identity

| Field | Value |
|-------|-------|
| Skill ID | AGT-012 |
| Skill Name | Agentic Loop Controller |
| Version | 1.0.0 |
| Source URL | https://github.com/anthropics/anthropic-quickstarts/tree/main/autonomous-coding-agent |
| Original Author | Anthropic (autonomous-coding-agent) |
| Intake Date | 2026-02-17 |
| Intake Owner | CVF Governance Team |

---

## 2. Capability Summary

### 2.1 Core Capability
Manages multi-step autonomous task execution with progress tracking, session persistence, and iteration control. Inspired by the autonomous-coding-agent quickstart's two-agent architecture (Planner + Implementer), which breaks complex coding tasks into feature lists, executes each feature autonomously, runs verification, and commits results — all within a sandboxed environment with configurable iteration limits. The skill:
- Accepts a task specification and decomposes it into an ordered feature/step list
- Executes each step through a controlled agentic loop with tool invocation
- Tracks completion state per step, enabling pause/resume across sessions
- Enforces hard iteration limits to prevent runaway execution
- Restricts available tools to a caller-defined allowlist
- Persists progress state to enable session recovery after interruption

### 2.2 Inputs
| Input | Type | Sensitivity | Required |
|-------|------|-------------|----------|
| Task specification | String (natural language) | Internal | Yes |
| Feature list | JSON array of step objects | Internal | No (auto-generated if omitted) |
| Max iterations | Integer (1–100) | Public | Yes (default: 25) |
| Allowed tools | String array (tool IDs) | Internal | Yes |
| Session ID | UUID string | Internal | No (auto-generated) |
| Sandbox config | JSON object | Internal | No (default: restricted shell) |
| Bash command allowlist | String array (command names) | Internal | No (default: minimal set) |

### 2.3 Outputs
| Output | Type | Persistence |
|--------|------|-------------|
| Progress state | JSON object (step status, iteration count) | Persisted |
| Completed features | JSON array with verification results | Persisted |
| Git commits | JSON array (sha, message, files changed) | Persisted |
| Iteration log | JSON array (timestamp, action, result) | Logged |
| Final status | Enum: `completed`, `paused`, `failed`, `iteration_limit_reached` | Logged |
| Total tokens consumed | Integer | Logged |

### 2.4 Execution Model
| Property | Value |
|----------|-------|
| Invocation | Orchestrator-invoked only |
| Execution | Async (long-running, with checkpoints) |
| Autonomy level | Manual (requires explicit human authorization) |
| Timeout | Configurable per step; default 300 000 ms per step, 3 600 000 ms total |

---

## 3. CVF Risk Mapping

### 3.1 Assigned Risk Level
- ☐ R0 – Informational (Read-only, no side effects)
- ☐ R1 – Advisory (Suggestions only, human confirmation required)
- ☐ R2 – Assisted Execution (Bounded actions, explicit invocation)
- ☑ **R3 – Autonomous Execution** (Multi-step, requires authorization)
- ☐ R4 – Critical / Blocked (Severe damage potential, execution blocked)

### 3.2 Risk Justification
- **Multi-step autonomous execution** with tool invocation — the hallmark of R3
- Can create files, modify code, and execute shell commands within sandbox
- Produces git commits that persist beyond the session
- Iteration limits and tool allowlists constrain but do not eliminate risk
- Session persistence means partial state survives interruptions
- Requires explicit human authorization before each execution run
- Inspired by an agent that autonomously writes and tests code

### 3.3 Failure Scenarios
| Mode | Description | Impact |
|------|-------------|--------|
| Primary | Runaway loop exceeding iteration limit | Medium — Hard limit enforced; execution halts with state dump |
| Secondary | Tool invocation outside allowlist | Blocked — Allowlist enforcement rejects unauthorized tools |
| Tertiary | Sandbox escape via shell command injection | High — Mitigated by bash command allowlist and `--restricted` shell mode |
| Quaternary | Corrupted session state on resume | Medium — Checkpoint validation detects inconsistencies; requires fresh start |
| Quinary | Incorrect code committed to repository | High — Git commits are reversible; require human review before merge |
| Senary | Token budget exhaustion | Medium — Execution halts; progress state preserved for resumption |

### 3.4 Blast Radius Assessment
| Dimension | Assessment |
|-----------|------------|
| Scope of impact | Target repository / workspace (sandboxed) |
| Reversibility | Partial — Git commits reversible; file system changes in sandbox are discardable |
| Data exposure risk | Medium — Access limited to sandbox; no network access unless explicitly allowed |

---

## 4. Authority Mapping

### 4.1 Allowed Agent Roles
- ☑ **Orchestrator**
- ☐ Architect
- ☐ Builder
- ☐ Reviewer

### 4.2 Allowed CVF Phases
- ☐ Discovery
- ☐ Design
- ☑ **Build**
- ☑ **Review**

### 4.3 Decision Scope Influence
- ☐ Informational
- ☐ Tactical (influences immediate task decisions)
- ☑ **Strategic** (requires human oversight)

### 4.4 Autonomy Constraints
| Constraint | Value |
|------------|-------|
| Invocation conditions | Requires explicit human authorization per run; Orchestrator role only |
| Explicit prohibitions | Must not exceed max iterations; must not invoke tools outside allowlist; must not execute network commands unless explicitly allowed; must not commit to `main`/`master` branch directly; must not access files outside sandbox directory |

> ⚠️ Undefined authority is forbidden by default.

---

## 5. Adaptation Requirements

- ☐ No adaptation required
- ☑ **Capability narrowing required** (Restricted tool set, iteration caps)
- ☑ **Execution sandboxing required** (Isolated environment mandatory)
- ☑ **Additional audit hooks required** (Full iteration logging)

### Adaptation Details
1. **Added:** Hard iteration limit (configurable, max 100) — the original autonomous-coding-agent uses a default of 10 iterations per feature but allows unlimited features; this skill enforces a global cap
2. **Added:** Tool allowlist enforcement — only tools in the caller-provided list can be invoked; the original agent has access to all tools including `bash` and `file` tools
3. **Added:** Bash command allowlist — only approved shell commands can be executed (e.g., `git`, `npm test`, `ls`, `cat`, `grep`); commands like `curl`, `wget`, `rm -rf`, `sudo` are blocked by default
4. **Added:** Session persistence with checkpoint validation — enables pause/resume while detecting state corruption
5. **Added:** Branch protection — commits go to a feature branch, never directly to `main` or `master`
6. **Constrained:** Sandbox execution — all file operations restricted to a designated workspace directory
7. **Constrained:** No network access by default — must be explicitly enabled per-run with domain allowlist

---

## 6. UAT & Validation Hooks

### 6.1 Required UAT Scenarios
| Scenario | Description |
|----------|-------------|
| Normal execution | Complete a 3-feature task within iteration limits, producing verified commits |
| Iteration limit | Hit max iterations and halt gracefully with progress state preserved |
| Tool allowlist enforcement | Reject tool call not in allowlist, log violation, continue execution |
| Bash allowlist enforcement | Block `curl` command, log violation, continue with alternative approach |
| Session pause/resume | Pause after 2 features, resume in new session, complete remaining features |
| Sandbox isolation | Verify no file access outside designated workspace directory |
| Branch protection | Verify commits target feature branch, not `main` |
| Token budget | Halt execution when token budget exhausted, preserve state |

### 6.2 Output Validation
| Criteria | Check |
|----------|-------|
| Acceptance | All completed features have verification results (test output or manual check) |
| Acceptance | Git commits are on feature branch with descriptive messages |
| Acceptance | Iteration log includes timestamp, action, and result for every step |
| Acceptance | Final status is one of the defined enum values |
| Rejection | Any tool invoked outside the allowlist |
| Rejection | Any file modified outside sandbox directory |
| Rejection | Iteration count exceeds configured maximum |

---

## 7. Decision Record

### 7.1 Intake Outcome
- ☐ Reject
- ☑ **Accept with Restrictions**
- ☐ Accept after Adaptation

### 7.2 Decision Rationale
The agentic loop pattern from Anthropic's autonomous-coding-agent quickstart enables powerful multi-step task automation. This is the highest-capability skill in the agent toolkit and carries commensurate risk. Accepted at R3 with extensive restrictions: Orchestrator-only invocation, mandatory human authorization, hard iteration limits, tool and bash command allowlists, sandbox isolation, branch protection, and full audit logging. These constraints transform an unbounded autonomous agent into a controlled, auditable execution engine aligned with CVF governance principles.

### 7.3 Decision Authority
| Field | Value |
|-------|-------|
| Name / Role | CVF Governance Team / Skill Intake Owner |
| Date | 2026-02-17 |
| Signature | Approved |

---

## 8. Lifecycle Controls

### 8.1 Review Cycle
| Field | Value |
|-------|-------|
| Review interval | 30 days (accelerated due to R3 risk level) |
| Next review date | 2026-03-19 |

### 8.2 Deprecation Conditions
- Any sandbox escape incident (immediate suspension pending investigation)
- Iteration limit bypass discovered
- >1 UAT failure in a review cycle (stricter threshold for R3)
- CVF authority model revision changes R3 governance requirements
- Superior orchestration framework with native CVF integration becomes available

---

## 9. Audit References

| Reference | Link |
|-----------|------|
| Source pattern | [anthropic-quickstarts/autonomous-coding-agent](https://github.com/anthropics/anthropic-quickstarts/tree/main/autonomous-coding-agent) |
| CVF documents | `CVF_SKILL_RISK_AUTHORITY_LINK.md` |
| Change log | v1.0.0: Initial intake from autonomous-coding-agent two-agent loop pattern |
| Incident references | None |

---

## 10. Final Assertion

By approving this record, the decision authority confirms that:

- ✅ The skill is bound to CVF governance
- ✅ Its risks are understood and accepted
- ✅ Its authority is explicitly constrained to Orchestrator role only
- ✅ Iteration limits and tool allowlists are enforced
- ✅ Sandbox isolation is mandatory
- ✅ Full iteration logging is active for audit traceability
- ✅ Human authorization is required before each execution run

> ⚠️ Unrecorded usage of this skill constitutes a CVF violation.

---

**Approval Signatures:**

| Role | Name | Date |
|------|------|------|
| Skill Owner | CVF Governance Team | 2026-02-17 |
| Governance Reviewer | CVF Governance Team | 2026-02-17 |
| Security Reviewer | Security Team | 2026-02-17 |
| Risk Committee | CVF Risk Board | 2026-02-17 |
