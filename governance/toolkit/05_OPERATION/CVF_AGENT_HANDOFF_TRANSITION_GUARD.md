# CVF Agent Handoff Transition Guard

**Control ID:** `GC-020`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active transition-classification rule for deciding when a formal handoff is required.
**Applies to:** all humans, all AI agents, and all governed implementation tranches that may continue, break, pause, transfer, escalate, or close.
**Enforced by:** `governance/compat/check_agent_handoff_guard_compat.py`

## Purpose

- classify stop, resume, and transfer situations before any handoff template is written
- trigger `GC-020` consistently instead of by vague intuition
- protect the CVF context-continuity model from hidden-state ambiguity

## Rule

### Before writing a handoff

Before writing a handoff, the worker must first classify the current state transition.

Required order:

1. classify the transition
2. decide whether `GC-020` is triggered
3. only then write the handoff artifact

This protects the CVF context-continuity model:

- `memory = repository of facts, history, and durable evidence`
- `handoff = governance-filtered summary and transfer checkpoint`
- `context loading = phase-bounded loading of only what the current step needs`

### Canonical Transition Types

#### `Continue`

Use `Continue` when:

- the same worker is still active
- the same governed thread is still in motion
- no ownership transfer has happened
- no meaningful restart risk exists

`Continue` does not require a formal handoff artifact.

#### `Break`

Use `Break` when:

- the same worker is taking a short interruption
- the worker is expected to resume directly
- there is no material repo, tranche, or decision state that another worker must understand

`Break` does not require a formal handoff artifact.

#### `Pause`

Use `Pause` when the current worker is stopping for later resumption and restart would depend on remembering execution state unless it is written down.

`Pause` triggers `GC-020`.

#### `Shift handoff`

Use `Shift handoff` when work responsibility moves from one worker to another and the same governed thread remains active.

`Shift handoff` triggers `GC-020`.

#### `Agent transfer`

Use `Agent transfer` when the successor is another AI agent and continuation would otherwise depend on hidden agent memory.

`Agent transfer` is a subtype of `Shift handoff` and triggers `GC-020`.

#### `Escalation handoff`

Use `Escalation handoff` when work stops at an approval or decision boundary and the next owner is a reviewer, approver, or human authority.

`Escalation handoff` triggers `GC-020`.

#### `Closure`

Use `Closure` when the batch or tranche is actually closed, the receipts are complete, the working tree is clean, and the next move is a fresh governed thread.

`Closure` is not an open handoff state. It is a completion state.

### Trigger Rules For `GC-020`

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

### Minimum State Questions

Before classifying the transition, answer:

1. is the current governed batch actually closed
2. will the same worker continue immediately
3. will another human or agent continue
4. would a restart require hidden memory if no handoff were written
5. is there an approval, dependency, or scope boundary still open

## Enforcement Surface

- this guard comes before the handoff template
- it is enforced at repo level by `governance/compat/check_agent_handoff_guard_compat.py`
- it works together with `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`

The template tells workers what to write.

This guard tells workers when a formal handoff is required.

## Related Artifacts

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `governance/compat/check_agent_handoff_guard_compat.py`

## Final Clause

Transition ambiguity is itself a governance bug. Classification comes first so the handoff that follows can stay truthful.
