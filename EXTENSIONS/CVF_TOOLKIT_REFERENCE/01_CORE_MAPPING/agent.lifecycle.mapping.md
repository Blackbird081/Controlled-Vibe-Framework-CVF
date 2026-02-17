# AGENT LIFECYCLE MAPPING SPEC
# CVF → CVF-Toolkit Integration
# Status: Authoritative Mapping
# Toolkit Version: 1.0.0
# CVF Lock: See 00_CANONICAL_REFERENCE/cvf_version.lock

1. PURPOSE

This document defines:

How Agents are instantiated, controlled, and terminated

How CVF governance applies to single-AI and multi-agent setups

How agent roles are bound to Skills

How risk dominance works across agents

How isolation boundaries prevent governance bypass

This file is binding and architecture-critical.

2. CANONICAL AGENT DEFINITION

In Toolkit:

An Agent is:

A controlled execution entity bound to:

A defined role

A bounded skill scope

A risk envelope

A provider abstraction

A governance guard

Agents are NOT free-form LLM sessions.

Agents cannot exist outside governance.

3. AGENT TYPES SUPPORTED

Toolkit supports two modes:

MODE A — Single AI, Multi-Role

One AI provider instance.

Roles assigned logically:

Analyst

Validator

Executor

Risk enforcement applies per role invocation.

MODE B — Multi-Agent

Multiple AI instances:

Analyst Agent

Risk Agent

Validator Agent

Report Agent

Execution Agent

Each has:

Unique agentId

Unique role

Unique risk envelope

Unique provider binding (optional)

Governance must evaluate all agents.

4. AGENT CONTRACT SCHEMA

Every agent must register with:

{
  agentId: string,
  role: string,
  capabilityLevel: C1 | C2 | C3 | C4,
  maxRiskAllowed: R1 | R2 | R3 | R4,
  boundSkills: string[],
  provider: string,
  environment: dev | staging | prod,
  status: active | suspended | terminated
}

Agents cannot execute unregistered skills.

5. AGENT LIFECYCLE STATES

States:

| State       | Description               |
| ----------- | ------------------------- |
| initialized | Registered but not active |
| active      | Allowed to execute        |
| suspended   | Temporarily blocked       |
| terminated  | Permanently removed       |

Transitions:
initialized → active
active → suspended
suspended → active
active → terminated

Illegal transitions blocked.

6. AGENT EXECUTION FLOW

For each execution:
Agent Request
   ↓
Skill Validation
   ↓
Risk Classification
   ↓
Operator Validation
   ↓
Phase Enforcement
   ↓
Provider Invocation
   ↓
Output Validation
   ↓
Audit Log

No step may be skipped.

7. ROLE BINDING RULE

Each agent role must map to:

| Role                | Minimum Capability |
| ------------------- | ------------------ |
| Informational       | C1                 |
| Analyst             | C2                 |
| Structural Designer | C3                 |
| Autonomous Executor | C4                 |

Agent capability must be >= skill capability.

8. RISK DOMINANCE RULE (MULTI-AGENT)

If multiple agents participate:

Final effective risk = MAX(risk of each agent execution).

Example:

Analyst produces R2

Validator produces R3

Final risk = R3.

Phase enforcement must follow R3.

9. AGENT ISOLATION RULE

Agents:

Cannot modify governance logic

Cannot downgrade risk

Cannot alter operator policy

Cannot approve own change

Cannot bypass skill registry

Isolation enforced in:

cvf.agent.adapter.ts
governance.guard.ts

10. PROVIDER BINDING RULE

Agent must use:

provider.interface.ts

Provider binding options:

openai

claude

gemini

Provider must be declared at registration.

Switching provider = Change Request required.

11. AGENT MEMORY RULE

Toolkit supports:

Stateless mode (default)

Controlled memory mode

Memory:

Must be scoped per agentId

Must not persist across freeze unless approved

Must be audited if risk >= R3

12. FINANCIAL AGENT RULE

For financial domain:

Mandatory roles:

Analyst Agent (C2 minimum)

Risk Agent (C3 minimum)

Validator Agent (C3 minimum)

If recommendation involved:

Execution Agent (C4 required)

Risk auto-set to R4

13. AGENT TERMINATION RULE

Agent must be terminated if:

Provider version changes without approval

Risk threshold violated

Governance violation detected

Change freeze violation detected

Termination must log:

AgentTerminationEvent

14. EXTENSION AGENT RULE

Extensions (e.g., Financial, Dexter) may:

Register custom agents

Define role semantics

Bind custom skill packs

Extensions may not:

Alter core lifecycle logic

Remove risk dominance rule

Remove isolation rule

15. NON-NEGOTIABLE RULES

No agent outside registry.

No skill outside boundSkills.

No risk downgrade by agent.

Highest risk dominates.

Provider binding cannot change without change request.

Agent cannot auto-release to prod.

Agent cannot approve own change.

16. COMPLIANCE CHECKLIST

Toolkit compliant if:

✔ Agent registry active
✔ Lifecycle transitions controlled
✔ Risk dominance enforced
✔ Isolation boundaries active
✔ Provider abstraction enforced
✔ Financial agent minimum roles enforced