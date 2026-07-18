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
- tracked remote branch when available
- whether the working tree is clean or dirty
- what is implemented versus what is only planned
- the active tranche or packet truth
- what remains out of scope
- the next governed move

Exact remote SHA may be cited when useful, but it is not a required hand-maintained handoff field because that value changes at the push boundary.

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

### In-Place Update Rule

When the active handoff is updated mid-session (without creating a new version),
every edit must keep the following fields in sync with each other:

- `Status:` line (top of file) — one-sentence current state
- `Active Boundary` section — delivered vs. authorized vs. blocked
- `HEAD` block in Current State — latest commit SHA and message
- `Handoff History` table — the current version's summary cell must reflect the
  full scope actually delivered, not only the scope that existed when the
  handoff was first created

The History table entry for the **active version** is a living summary. It must
be updated whenever the Active Boundary changes. A History entry that reads
"Phase X only" while the Active Boundary shows Phase X + Y + Z delivered is a
sync violation — it misleads the next agent about what this session covered.

Sync check before every commit that touches the active handoff:

1. Does the `Status:` line match what Active Boundary says is done?
2. Does the HEAD SHA match the latest committed SHA?
3. Does the History table entry for the active version list every phase/batch
   delivered so far in this session?

If any answer is no, fix the mismatch in the same commit.

### Handoff Archive Protocol

When a new handoff supersedes a previous one, the worker must:

1. Create the new handoff file (e.g., `AGENT_HANDOFF_Vn.md`) in the repo root.
2. Update the previous handoff's `Status:` line to `SUPERSEDED by AGENT_HANDOFF_Vn.md`.
3. **Use `git mv` — not `cp`** — to move the superseded handoff from the repo root
   to `CVF_SESSION/handoffs/archive/`. This preserves git rename history.
4. Update `CVF_SESSION/ACTIVE_SESSION_STATE.json`:
   - `activeHandoff` → new handoff filename
   - add old archive path to `supersededHandoffs` list
5. Update `CVF_SESSION_MEMORY.md` active handoff pointer.
6. Update `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`:
   - remove the superseded handoff entry (it is no longer a root file)
   - add the new handoff entry

Using `cp` instead of `git mv` leaves a duplicate at root and breaks the
git rename history. The `check_active_session_state.py` checker scans root
for `Status: ACTIVE` — a leftover `cp` at root with `Status: SUPERSEDED` is
tolerated but wastes exposure registry entries and clutters the root. Always
use `git mv`.

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
