# CVF Session Governance Bootstrap

Memory class: POINTER_RECORD

Status: canonical session-start front door for loading only the governance controls that matter right now.

## Purpose

- give every new or resumed session one short governance front door
- reduce context load by routing to relevant controls instead of rereading every guard
- keep session-start behavior aligned with the CVF memory / handoff / phase-bounded loading model

## Always-On Bootstrap

Read these first:

- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`

If the active workline is not the whitepaper completion line, replace the roadmap/tracker pair above with the canonical tracker and roadmap for that workline.

## Current Canonical Status First

Before loading deeper history:

- check the current tracker or status review first
- check the current active roadmap second
- use closure packets and deltas only when the next step actually depends on them

Do not start by reading all governance guards in full.

## Trigger-Based Controls

Load these only when the task or transition triggers them:

### `GC-018` — Continuation / Deepening / Marginal-Value Stop Boundary

Use when:

- reopening or extending a materially delivered wave
- validation/test continuation is being proposed
- packaging-only or truth/claim continuation is being proposed

Primary references:

- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`

### `GC-019` — Structural Change Audit Gate

Use when:

- merging modules
- moving ownership across planes
- changing package boundaries or physical layout

Primary references:

- `governance/toolkit/05_OPERATION/CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`
- `docs/reference/CVF_GC019_STRUCTURAL_CHANGE_AUDIT_TEMPLATE.md`

### `GC-020` — Pause / Transfer / Resume Truth

Use when:

- work pauses before closure
- ownership shifts to another worker or agent
- a later resume would otherwise depend on hidden memory

Primary references:

- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_AGENT_HANDOFF_GUARD.md`
- `docs/reference/CVF_AGENT_HANDOFF_TEMPLATE.md`

### `GC-023` — Governed File Size

Use when:

- touching already-large files
- adding tests or code to large governed files

Primary references:

- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`

### `GC-027` — Multi-Agent Intake / Rebuttal / Decision-Pack Standard

Use when:

- multi-agent intake review, rebuttal, or decision-pack drafting is starting
- multiple agents are evaluating the same proposal set
- roadmap intake must choose one reconciled decision rather than parallel ad-hoc review formats

Primary references:

- `governance/toolkit/05_OPERATION/CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`
- `docs/reference/CVF_MULTI_AGENT_INTAKE_REVIEW_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_REBUTTAL_TEMPLATE.md`
- `docs/reference/CVF_MULTI_AGENT_DECISION_PACK_TEMPLATE.md`

### `AI Boardroom` — Live Control-Plane Deliberation

Use when:

- live intake debate, clarification, rebuttal, or convergence is happening inside the Control Plane
- the system must choose the best governed result before downstream design/orchestration continues
- downstream orchestration must stay blocked until the live boardroom transition gate permits continuation

Primary references:

- `governance/toolkit/05_OPERATION/CVF_BOARDROOM_RUNTIME_GUARD.md`
- `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md`
- `docs/reference/CVF_BOARDROOM_SESSION_PACKET_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_DISSENT_LOG_TEMPLATE.md`
- `docs/reference/CVF_BOARDROOM_TRANSITION_DECISION_TEMPLATE.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.round.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/boardroom.transition.gate.contract.ts`

### `GC-024` — Test Partition Ownership

Use when:

- a governed test surface has already been split
- you are adding tests near a legacy monolithic test file

Primary references:

- `governance/toolkit/05_OPERATION/CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`
- `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

## Task-Class Routing

Use this routing table after reading the always-on bootstrap:

| Task class | Load next |
|---|---|
| continuation or breadth/deepening proposal | `GC-018` |
| structural merge or package move | `GC-019` |
| pause, resume, shift handoff, agent transfer | `GC-020` |
| multi-agent intake review, rebuttal, or decision-pack drafting | `GC-027` |
| live boardroom deliberation in intake/design flow | `GC-028` + `AI Boardroom` protocol + active roadmap |
| large file touched or split candidate | `GC-023` |
| tests near a split canonical test surface | `GC-024` |
| ordinary tranche-local implementation already authorized | active roadmap + tranche packet only |

## Memory / Handoff / Bootstrap Separation

- memory = durable facts, history, and evidence
- handoff = truthful transition checkpoint
- bootstrap = minimal governance routing for session start

Do not use one of these layers as a substitute for the others.

## If Unsure

If routing is uncertain:

1. read the active roadmap and tracker first
2. choose the likely triggered control
3. if pause/transfer ambiguity exists, default to `GC-020`
4. if continuation/deepening ambiguity exists, default to `GC-018`

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `GC-026` keeps bootstrap depends on tracker freshness rather than stale progress pointers
