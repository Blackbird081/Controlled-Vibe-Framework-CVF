# CVF Session Governance Bootstrap Guard

**Control ID:** `GC-025`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active session-start routing rule for governance loading.
**Applies to:** all new or resumed governed sessions, new chats, and resumed threads where work continues from existing governance state.
**Enforced by:** `governance/compat/check_session_governance_bootstrap.py`

## Purpose

- prevent new sessions from loading every guard by default
- require one short canonical bootstrap before governed work continues
- route workers to the right controls based on task class and transition state

## Rule

Before governed work continues in a new session, new chat, or resumed thread, the worker must:

1. load the bootstrap read model (`CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`) first for compact current-mode/active-handoff/next-allowed-move facts
2. load `CVF_SESSION_MEMORY.md` and the canonical session bootstrap reference
3. resolve `CVF_SESSION/ACTIVE_SESSION_STATE.json` only as a targeted lookup, when a current fact from steps 1-2 is missing, contradictory, or the task explicitly requires it
4. determine the active task class and transition state
5. load only the guards that are relevant to that task and state
6. avoid broad guard-loading and unconditional full-state reads when a bounded bootstrap plus routed controls is enough

Canonical bootstrap reference:

- `CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`
- `CVF_SESSION_MEMORY.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json` (targeted lookup only; see
  `docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md`)

### Why This Exists

CVF already distinguishes:

- `memory = durable evidence and history`
- `handoff = truthful transition checkpoint`
- `context loading = phase-bounded loading`

Session bootstrap extends the same principle:

- `bootstrap = minimal governance front door for a fresh or resumed session`

### Bootstrap Loading Model

Every new or resumed governed session should load:

#### Always-On Bootstrap

- `CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`
- `CVF_SESSION_MEMORY.md`
- current canonical bootstrap reference
- current canonical control matrix
- current active roadmap or tracker for the active workline

`CVF_SESSION/ACTIVE_SESSION_STATE.json` is a targeted lookup, not part of the
always-on bootstrap: resolve it only when a current fact above is missing,
contradictory, or the task explicitly requires historical evidence.

#### Trigger-Based Controls

Load only if the task or state triggers them:

- `GC-018` for continuation, breadth expansion, semantic deepening, or validation/test continuation
- `GC-019` for structural change, merge, ownership transfer, or physical consolidation
- `GC-020` for pause, shift handoff, agent transfer, or escalation handoff
- `GC-032` for governed artifact authoring, typed evidence drafting, or continuity-surface updates
- `GC-023` for file-size maintainability pressure
- `GC-024` for already-split governed test ownership

#### Task-Class Routing

Workers must classify the active task first and then route into the relevant controls instead of broad rereading.

#### Current Status First

Workers should read the current active tracker, roadmap, or closure packet before loading deeper historical packets.

### Prohibited Session-Start Pattern

Workers must not treat session start as a reason to read every governance guard in full by default.

In other words: Do not read every governance guard in full by default.

This includes:

- loading all operation guards before task classification
- re-reading guards unrelated to the current task just because a new chat started
- substituting broad guard rereads for truthful handoff or current-status routing

## Enforcement Surface

- mandatory by policy
- reviewable through the canonical bootstrap reference and control matrix
- machine-enforced at repo level by `governance/compat/check_session_governance_bootstrap.py`
- surfaced in local hook and CI so bootstrap routing cannot silently drift out of sync

This guard enforces canonical bootstrap structure and routing references. It does not claim to detect every live session start automatically.

## Active Continuity Read-Budget Binding - 2026-08-10

This guard's bootstrap-first, progressive-loading rule is bound to exact,
machine-enforced line and byte budgets by:

`docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md`

That standard defines the bootstrap/front-door/handoff read budgets, the
exact-hash migration-debt contract for current oversized surfaces, and the
downstream no-compaction-while-worker-active safety rule. It is enforced by
`governance/compat/check_active_session_state.py` alongside this guard's
existing session-start routing checks.

## Related Artifacts

- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_ACTIVE_CONTINUITY_READ_BUDGET_STANDARD_2026-08-10.md`
- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`
- `CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `governance/compat/check_session_governance_bootstrap.py`
- `governance/compat/check_active_session_state.py`

## Final Clause

Session start is not permission to reload everything. It is permission to route correctly.
