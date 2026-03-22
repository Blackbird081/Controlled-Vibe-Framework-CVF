# CVF AGENT HANDOFF GUARD

**Type:** Governance Operation Guard  
**Applies to:** All humans, all AI agents, all governed implementation tranches  
**Purpose:** Prevent ambiguous pause/transfer states by requiring one truthful, reviewable handoff whenever work stops before closure or moves between agents.

---

## 1. Mandatory Rule

Whenever governed work pauses or is transferred, the current worker MUST leave one explicit handoff artifact in the conversation or record chain.

The current state transition must first be classified using:

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`

This rule applies when:

- the current agent is stopping before the tranche is closed
- work is moving to another agent
- the user wants to pause and resume later
- the worker is taking a break while the governed thread remains open

The default assumption is:

- no silent stop
- no memory-only transfer
- no resume based on guesswork

---

## 2. Required Handoff Truth

Every handoff must truthfully state:

- latest completed commit
- whether the working tree is clean or dirty
- what is implemented vs what is only planned
- the active tranche / packet truth
- what remains out of scope
- the next governed move

If any of the above is unknown, the handoff must say so explicitly instead of filling the gap with optimistic wording.

---

## 3. Minimum Required Fields

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

---

## 4. Required Usage Pattern

Use the canonical handoff template whenever possible.

Allowed:

- copy the template and fill it with current tranche truth
- shorten it slightly for small batches if all mandatory fields remain present
- point to the current implementation delta and execution plan as the primary read-first docs

Not allowed:

- reusing stale tranche language from an older wave without updating it
- claiming target-state completion when only a bounded slice landed
- handing off with no commit/reference state when a clean commit exists

---

## 5. Pause / Resume Interpretation

For governance purposes, an agent handoff should be treated like a human work handoff or a short break checkpoint:

- the next worker must be able to resume without reconstructing hidden context
- the user should not have to rediscover scope boundaries already decided
- the repo truth at handoff time must be preserved

This guard exists because governed continuation quality depends not only on code and docs, but also on truthful transfer of execution state.

---

## 6. Recommended Evidence Placement

The handoff itself may live in conversation output, but it should point to canonical repo artifacts first:

- current execution plan
- latest packet audit / review
- latest implementation delta
- current roadmap and completion status

When a pause/transfer pattern becomes durable process guidance, the canonical source must be:

- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`

---

## 7. Failure Modes This Guard Prevents

This guard is specifically intended to prevent:

- scope drift after an agent switch
- overclaiming tranche completion
- loss of the next governed move
- restart from a dirty tree with no warning
- “pretty architecture” continuation after a realization-first decision

---

## 8. Enforcement Posture

Current enforcement posture:

- mandatory by policy
- reviewable by repo artifacts and conversation truth
- machine-enforced at repo level by `governance/compat/check_agent_handoff_guard_compat.py`
- partially surfaced at runtime through active helper/orchestrator pause and approval-required handoff checkpoints

Until universal session/runtime interception exists, reviewers and workers should still treat missing handoff state as a governance quality defect.

---

## 9. Related Controls

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/agent-handoff.ts`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/pipeline.orchestrator.ts`
- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
