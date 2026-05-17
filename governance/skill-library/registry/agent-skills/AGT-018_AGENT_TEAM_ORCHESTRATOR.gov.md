# AGT-018: Agent Team Orchestrator

> **Type:** Agent Skill  
> **Domain:** Multi-Agent Coordination  
> **Status:** Active

---

## Source

Inspired by claude-code-templates multi-agent team patterns (deep-research-team, development-team, mcp-dev-team, podcast-creator-team) and VoltAgent/awesome-claude-code-subagents (119 agents).  
Reference: https://github.com/davila7/claude-code-templates/tree/main/cli-tool/components/agents  
Implementation in v1.6 AGENT_PLATFORM.  
Skill mapping: `governance/skill-library/examples/AGT-018_AGENT_TEAM_ORCHESTRATOR.md`

---

## Capability

Coordinates multiple specialized sub-agents working together as a team to complete complex multi-step tasks. Manages agent roles, task distribution, result aggregation, and conflict resolution across team members.

**Actions:**
- Define agent teams with roles (Planner, Executor, Reviewer, Synthesizer)
- Distribute tasks to specialized sub-agents based on expertise
- Coordinate parallel and sequential agent execution pipelines
- Aggregate and merge results from multiple agents
- Handle conflicts when agents produce contradictory outputs
- Manage agent context sharing and handoff protocols
- Monitor team performance and adjust task allocation
- Support team patterns: Research Team, Development Team, Review Team, Content Team

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R3 – High** |
| Allowed Roles | Orchestrator |
| Allowed Phases | Build, Review |
| Decision Scope | Strategic |
| Autonomy | Manual (human approves team composition and task plan) |

---

## Risk Justification

- **Multi-agent complexity** – Coordinating multiple agents increases error surface
- **Resource consumption** – Multiple concurrent agents consume significant compute
- **Context propagation** – Errors in one agent may propagate to team outputs
- **Conflict resolution** – Automated conflict resolution may choose incorrectly
- **Scope creep** – Sub-agents may expand task scope beyond original intent
- **Audit complexity** – Multi-agent chains are harder to audit and trace
- **Cost amplification** – Each sub-agent invocation adds to token usage

---

## Constraints

- ✅ Team composition requires human approval before execution
- ✅ Task plan reviewed and approved before distribution
- ✅ Each sub-agent operates within its individual governance rules
- ✅ Result aggregation includes per-agent attribution
- ✅ Conflict resolution escalated to human when agents disagree
- ✅ Resource limits enforced (max agents per team, max iterations)
- ✅ Full execution trace logged for audit
- ❌ Cannot create teams without human approval
- ❌ Cannot override individual agent governance rules
- ❌ Cannot auto-resolve critical conflicts without human input
- ❌ Cannot spawn unlimited sub-agents
- ❌ Cannot modify team composition mid-execution without approval
- ❌ Cannot bypass per-agent risk constraints

---

## UAT Binding

**PASS criteria:**
- [ ] Team composition approved by human before execution
- [ ] Task plan reviewed before agent distribution
- [ ] Each sub-agent respects its individual governance constraints
- [ ] Results attributed to originating sub-agent
- [ ] Conflicts escalated to human when detected
- [ ] Resource limits enforced (max agents, max iterations)
- [ ] Full execution trace available for audit

**FAIL criteria:**
- [ ] Teams created without human approval
- [ ] Sub-agents violate their individual governance rules
- [ ] Conflicts auto-resolved without human input on critical matters
- [ ] Execution trace missing or incomplete
- [ ] Resource limits exceeded without notification
