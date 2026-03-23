# CVF Session Governance Bootstrap Guard

**Control ID:** `GC-025`  
**Memory class:** `POINTER_RECORD`  
**Status:** canonical session-start routing rule for governance loading.

## Purpose

- prevent new sessions from loading every guard by default
- require one short canonical bootstrap before governed work continues
- route workers to the right controls based on task class and transition state

## Rule

Before governed work continues in a new session, new chat, or resumed thread, the worker MUST:

1. load the canonical session bootstrap reference
2. determine the active task class and transition state
3. load only the guards that are relevant to that task and state
4. avoid broad guard-loading when a bounded bootstrap plus routed controls is enough

Canonical bootstrap reference:

- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`

## Why This Exists

CVF already distinguishes:

- `memory = durable evidence and history`
- `handoff = truthful transition checkpoint`
- `context loading = phase-bounded loading`

Session bootstrap extends the same principle:

- `bootstrap = minimal governance front door for a fresh or resumed session`

This reduces context overload and keeps attention on the controls that actually govern the current task.

## Bootstrap Loading Model

Every new or resumed governed session should load:

### Always-On Bootstrap

- current canonical bootstrap reference
- current canonical control matrix
- current active roadmap or tracker for the active workline

### Trigger-Based Controls

Load only if the task or state triggers them:

- `GC-018` for continuation, breadth expansion, semantic deepening, or validation/test continuation
- `GC-019` for structural change, merge, ownership transfer, or physical consolidation
- `GC-020` for pause, shift handoff, agent transfer, or escalation handoff
- `GC-023` for file-size maintainability pressure
- `GC-024` for already-split governed test ownership

### Task-Class Routing

Workers must classify the active task first and then route into the relevant controls instead of broad rereading.

### Current Status First

Workers should read the current active tracker, roadmap, or closure packet before loading deeper historical packets.

## Prohibited Session-Start Pattern

Workers MUST NOT treat session start as a reason to read every governance guard in full by default.

In other words: Do not read every governance guard in full by default.

This includes:

- loading all operation guards before task classification
- re-reading guards unrelated to the current task just because a new chat started
- substituting broad guard rereads for truthful handoff or current-status routing

## Relationship To Other Controls

- `GC-020` governs truthful transition state when work pauses or transfers
- `GC-022` governs what should be durable memory
- `GC-025` governs what should be loaded first at session start

These controls are complementary:

- memory keeps durable truth
- handoff compresses transition truth
- bootstrap routes the next worker to the minimum correct governance surface

## Automation Posture

`GC-025` is:

- mandatory by policy
- reviewable through the canonical bootstrap reference and control matrix
- machine-enforced at repo level by `governance/compat/check_session_governance_bootstrap.py`
- surfaced in local hook and CI so bootstrap routing cannot silently drift out of sync

This guard enforces canonical bootstrap structure and routing references. It does not claim to detect every live session start automatically.

## Related Artifacts

- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `governance/compat/check_session_governance_bootstrap.py`
