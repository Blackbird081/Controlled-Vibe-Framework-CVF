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
- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` before opening a fresh quality assessment or choosing the next tranche by scan state

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
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` when touching governed public barrels, barrel smoke, shared batch helpers, or canonical summary surfaces
- active quality assessment for the current workline before deciding remediation-first vs expansion-now

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

Operational note:

- write the tracked remote branch into handoff when an upstream exists
- derive exact remote SHA live from git when push or resume logic depends on it

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

### `GC-029` — Extension Package Check

Use when:

- extension-local source, test, or package-config changes are being made under `EXTENSIONS/`
- a touched extension package has its own `package.json` and `scripts.check`
- focused tests are green but package-level verification still must be proven before push

Primary references:

- `governance/toolkit/05_OPERATION/CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`
- `governance/compat/check_extension_package_check.py`

### `GC-030` — Guard Authoring Standard

Use when:

- creating a new governance guard
- materially revising an existing guard or its enforcement surface
- adding a new guard checker, hook entry, or CI guard job

Primary references:

- `governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md`
- `governance/compat/check_guard_authoring_standard.py`

### `GC-032` — Governed Artifact Authoring

Use when:

- drafting or materially revising governed artifacts
- translating contract, test, or harness output into baseline, review, audit, or evidence docs
- updating tracker, handoff, closure, or other continuity surfaces after tranche posture changes

Primary references:

- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`
- `governance/compat/check_governed_artifact_authoring.py`

### `GC-041` — Surface Scan Continuity

Use when:

- opening a fresh quality assessment or choosing the next tranche candidate
- deciding whether a repo surface is already closed, not yet scanned, or closed-by-default
- updating inherited scan state after a governed scan or closure changes the canonical posture

Primary references:

- `governance/toolkit/05_OPERATION/CVF_SURFACE_SCAN_CONTINUITY_GUARD.md`
- `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`
- `AGENT_HANDOFF.md`

### `GC-042` — Product Value Validation

Use when:

- claiming that CVF has proven user-facing product value
- drafting comparative validation evidence against a simpler baseline
- deciding whether Docker sandbox or another heavyweight capability is justified by measured need

Primary references:

- `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`
- `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`

### `GC-043` — Knowledge Absorption Priority

Use when:

- evaluating new knowledge from external repos, external skill systems, or post-closure knowledge packets
- preparing a synthesis-first wave from assessed outside materials
- deciding whether a repo-derived doctrine input should stay documentation/governance-only or reopen implementation

Primary references:

- `governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`
- `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`
- `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`
- `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`

### `GC-044` — Template Skill Standard

Use when:

- screening or re-screening front-door templates or mapped skills
- importing skills from external repos for future CVF use
- deciding whether a skill/template is trustworthy enough for non-coder benchmark truth and may enter the `TRUSTED_FOR_VALUE_PROOF` class

Primary references:

- `governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`
- `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`
- `docs/roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md`

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
| extension-local source, test, or package-config changes | `GC-029` |
| creating or materially revising governance guards | `GC-030` + guard registry |
| drafting or materially revising governed artifacts | `GC-032` + source truth + active roadmap/tranche packet |
| fresh quality assessment or next-surface selection | `GC-041` + canonical scan registry + active tracker |
| product-value validation, comparative value proof, or Docker-trigger justification | `GC-042` + frozen corpus/rubric/run-manifest/assessment chain |
| future knowledge absorption, repo-derived skill intake, or post-closure synthesis-first uplift planning | `GC-043` + knowledge-absorption priority standard + active handoff |
| template/skill corpus rescreen, future front-door template intake, or trusted-subset admission | `GC-044` + corpus rescreen standard + active handoff |
| touching governed public barrels, barrel smoke tests, shared batch helpers, or canonical summary surfaces | `GC-033` + `GC-034` + `GC-035` + `GC-036` + `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` |
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
5. if value-proof or Docker-justification ambiguity exists, default to `GC-042`
6. if repo-derived knowledge or skill uplift ambiguity exists, default to `GC-043`
7. if template/skill front-door quality or trusted-subset ambiguity exists, default to `GC-044`

## Related Controls

- `governance/toolkit/05_OPERATION/CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `docs/reference/CVF_CONTEXT_CONTINUITY_MODEL.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `GC-026` keeps bootstrap depends on tracker freshness rather than stale progress pointers
