# CVF Agent Handoff Transition Guard

**Type:** Governance Operation Guard  
**Applies to:** All humans, all AI agents, all governed implementation tranches  
**Purpose:** Classify stop/resume/transfer situations before any handoff template is written so `GC-020` is triggered consistently instead of by vague intuition.

---

## 1. Mandatory Ordering Rule

Before writing a handoff, the worker MUST first classify the current state transition.

The required order is:

1. classify the transition
2. decide whether `GC-020` is triggered
3. only then write the handoff artifact

This prevents the handoff template from becoming a loose checklist with unclear trigger boundaries.

It also protects the CVF context-continuity model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

Without transition classification first, workers cannot tell when a governance-filtered context checkpoint is required.

---

## 2. Canonical Transition Types

### `Continue`

Use `Continue` when:

- the same worker is still active
- the same governed thread is still in motion
- no ownership transfer has happened
- no meaningful restart risk exists

`Continue` does not require a formal handoff artifact.

### `Break`

Use `Break` when:

- the same worker is taking a short interruption
- the worker is expected to resume directly
- there is no material repo, tranche, or decision state that another worker must understand

`Break` does not require a formal handoff artifact.

### `Pause`

Use `Pause` when:

- the current worker is stopping for later resumption
- the tranche or packet remains open
- restart would depend on remembering execution state unless it is written down

`Pause` triggers `GC-020`.

### `Shift handoff`

Use `Shift handoff` when:

- work responsibility moves from one worker to another
- the same governed thread remains active
- the next worker is expected to continue from the current state instead of reopening from scratch

`Shift handoff` triggers `GC-020`.

### `Agent transfer`

Use `Agent transfer` when:

- the successor is another AI agent
- the governed thread remains active
- continuation would otherwise depend on hidden agent memory

`Agent transfer` is a subtype of `Shift handoff` and triggers `GC-020`.

### `Escalation handoff`

Use `Escalation handoff` when:

- work stops at an approval or decision boundary
- the next owner is a reviewer, approver, or human authority
- continuation depends on one explicit decision or unblock step

`Escalation handoff` triggers `GC-020`.

### `Closure`

Use `Closure` when:

- the batch or tranche is actually closed
- the commit, receipts, and governance chain are complete
- the working tree is clean
- the next move is a new packet, new tranche, or a fresh governed thread

`Closure` is not an open handoff state. It is a completion state.

---

## 3. Trigger Rules For `GC-020`

A formal handoff is mandatory whenever any of the following is true:

- ownership changes
- another agent will continue the governed thread
- the user wants resumable state for later continuation
- the current worker stops before closure while a tranche or packet remains open
- the next governed move would be unclear without written state
- the repo truth, tranche truth, or scope truth could be reconstructed incorrectly

`GC-020` is not required for:

- casual conversational pauses
- same-turn thinking with no material repo or governance state change
- fully closed work with no meaningful next governed move

If classification is uncertain, default to `Pause` and leave a truthful handoff.

---

## 4. Minimum State Questions

Before classifying the transition, the worker should answer:

1. Is the current governed batch actually closed?
2. Will the same worker continue immediately?
3. Will another human or agent continue?
4. Would a restart require hidden memory if no handoff were written?
5. Is there an approval, dependency, or scope boundary still open?

If the answers imply restart ambiguity or ownership transfer, `GC-020` should trigger.

---

## 5. Relationship To The Handoff Template

This guard comes before the handoff template.

The template tells workers what to write.  
This guard tells workers when a formal handoff is required.

The broader model is:

- memory stores durable truth
- handoff compresses the transition truth
- context loading should only bring the next phase what it needs

This is why transition classification comes before the handoff template.

Canonical follow-on artifacts:

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`

---

## 6. Related Controls

- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/compat/check_agent_handoff_guard_compat.py`
