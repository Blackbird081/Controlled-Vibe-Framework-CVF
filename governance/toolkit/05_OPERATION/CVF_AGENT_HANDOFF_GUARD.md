# CVF Agent Handoff Guard

**Control ID:** `GC-020`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active truth-preservation rule for pause, transfer, and resume checkpoints in governed work.
**Applies to:** all humans, all AI agents, and all governed implementation tranches that stop before closure or move to another worker.
**Enforced by:** `governance/compat/check_agent_handoff_guard_compat.py`

## Purpose

- prevent ambiguous pause and transfer states
- require one truthful, reviewable handoff whenever work stops before closure or moves between agents
- preserve the CVF context-continuity model without depending on hidden memory

This guard is part of the wider CVF context-continuity model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

In CVF, handoff is context quality control by phase for multi-agent continuation, not only work transfer.

## Rule

Whenever governed work pauses or is transferred, the current worker must leave one explicit handoff artifact in the conversation or record chain.

The current state transition must first be classified using:

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`

This rule applies when:

- the current agent is stopping before the tranche is closed
- work is moving to another agent
- the user wants to pause and resume later
- the worker is taking a break while the governed thread remains open

Default assumption:

- no silent stop
- no memory-only transfer
- no resume based on guesswork

### Required Handoff Truth

Every handoff must truthfully state:

- latest completed commit
- whether the working tree is clean or dirty
- what is implemented versus what is only planned
- the active tranche or packet truth
- what remains out of scope
- the next governed move

If any of the above is unknown, the handoff must say so explicitly instead of filling the gap with optimistic wording.

### Minimum Required Fields

Every governed handoff must include:

1. repo state
2. latest completed commit
3. canonical docs the next worker must read first
4. current tranche truth
5. what the last completed batch actually delivered
6. non-negotiable scope rules
7. next governed move
8. documentation standards to preserve
9. verification minimum
10. explicit `Do not` list

Canonical template:

- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`

### Required Usage Pattern

Use the canonical handoff template whenever possible.

Allowed:

- copy the template and fill it with current tranche truth
- shorten it slightly for small batches if all mandatory fields remain present
- point to the current implementation delta and execution plan as the primary read-first docs

Not allowed:

- reusing stale tranche language from an older wave without updating it
- claiming target-state completion when only a bounded slice landed
- handing off with no commit or reference state when a clean commit exists

### Pause / Resume Interpretation

For governance purposes, an agent handoff should be treated like a human work handoff or a short break checkpoint:

- the next worker must be able to resume without reconstructing hidden context
- the user should not have to rediscover scope boundaries already decided
- the repo truth at handoff time must be preserved

## Enforcement Surface

- mandatory by policy
- reviewable by repo artifacts and conversation truth
- machine-enforced at repo level by `governance/compat/check_agent_handoff_guard_compat.py`
- partially surfaced at runtime through active helper and orchestrator pause and approval-required handoff checkpoints

Recommended evidence placement:

- current execution plan
- latest packet audit or review
- latest implementation delta
- current roadmap and completion status

## Related Artifacts

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-handoff.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`
- `governance/compat/check_agent_handoff_guard_compat.py`

## Final Clause

If governed continuation depends on hidden memory, the handoff already failed.
