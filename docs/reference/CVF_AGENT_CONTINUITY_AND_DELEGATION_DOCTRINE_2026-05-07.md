# CVF Agent Continuity And Delegation Doctrine

Memory class: POINTER_RECORD

Document type: CANONICAL — CVF-NATIVE DOCTRINE

Status: official docs absorption from CVF ADD, Phase B, 2026-05-07.

Source lineage: CVF ADD arbitration and synthesis normalized continuity,
restart, worker-session, delegation, and subagent material from Agent Harnesses,
deepagents, Hermes Agent, Human System Harness, and related sources.

## Purpose

This doctrine defines how CVF should preserve state across phase boundaries and
delegate work without losing governance.

Continuity and delegation are useful only when they make bounded work safer,
clearer, and more reviewable.

## Continuity Model

CVF already separates durable memory, handoff, and phase-bounded context in
`CVF_CONTEXT_CONTINUITY_MODEL.md`. This doctrine extends that model with a more
explicit phase record vocabulary:

- checkpoint: compact record of the current phase result;
- restore: resume from a checkpoint without reopening closed decisions;
- handoff: transfer state to another agent or future session;
- artifact memory: preserve file paths, decisions, and proof requirements;
- reinjection: reintroduce prior context only when relevant and allowed.

## Continuity Rules

- Repository truth outranks chat memory.
- Handoff must record phase status, changed files, evidence, blockers, and next
  owner surface.
- Hidden memory must not become authority.
- Closed decisions remain closed unless evidence reopens them.
- Long-running tasks should prefer phase checkpoints over full-history replay.

## Delegation Model

Delegation is allowed when it materially advances the main task and the worker
scope is bounded.

A delegated worker contract should include:

- assigned files/modules/responsibility;
- explicit statement that other agents or users may also be editing the repo;
- instruction not to revert unrelated changes;
- expected deliverable;
- proof or verification expectation;
- final report of changed files and residual risk.

## Delegation Rules

Workers inherit CVF governance boundaries. Delegation must not:

- bypass policy gates;
- widen file ownership without review;
- substitute for evidence;
- create unbounded autonomous execution;
- hide decision responsibility from the main agent;
- perform runtime changes from a docs-only roadmap.

## Relationship To AGENT_HANDOFF

`AGENT_HANDOFF.md` is the live continuation surface for shared agent progress.
After each meaningful phase, agents should update it with:

- phase status;
- canonical docs or code artifacts produced;
- boundary/claim changes;
- next authorized phase;
- verification status;
- blockers or proof gaps.

This keeps knowledge alive in CVF, not trapped in private scratch files.

## Runtime Activation Boundary

Runtime activation may later add structured delegation receipts or W7/W8
signals. This doctrine does not implement them.

