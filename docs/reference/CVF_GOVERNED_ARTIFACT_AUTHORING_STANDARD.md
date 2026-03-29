# CVF Governed Artifact Authoring Standard

Memory class: POINTER_RECORD
Status: canonical authoring standard for governed artifacts written by humans and AI agents.
Authority: operationalized from `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md` and `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`.

## Purpose

- stop governed packets and evidence docs from drifting away from roadmap, contract, or continuity truth
- require every agent to write governed artifacts from source truth instead of ad-hoc narrative shortcuts
- keep planning, execution, evidence, and continuity artifacts distinct so CVF remains readable and auditable

## Applies To

This standard applies to all humans and AI agents writing or materially revising governed artifacts under:

- `docs/reference/`
- `docs/roadmaps/`
- `docs/reviews/`
- `docs/audits/`
- `docs/baselines/`
- `docs/INDEX.md`
- `AGENT_HANDOFF.md`
- `docs/CVF_INCREMENTAL_TEST_LOG.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`

It is especially mandatory when an artifact claims:

- roadmap scope or tranche posture
- contract-derived evidence
- benchmark or performance measurements
- closure or continuation truth
- tracker or handoff continuity truth

## Canonical Principles

### Source-Truth First

Before drafting a governed artifact, the author MUST read the governing source truth first:

- roadmap before tranche posture claims
- contract/schema before typed evidence claims
- test output or harness report before benchmark claims
- tracker, handoff, and closure packet before continuity claims

If the source truth is not read first, the artifact is not ready to assert governed truth.

### No Summary Substitution for Typed Evidence

If an upstream contract, harness, trace, or report defines typed evidence fields, the governed artifact MUST mirror that structure truthfully instead of replacing it with shorthand narrative.

Examples:

- `value: number` must stay numeric
- `measurementId`, `traceId`, `runId`, `reportId`, and hashes must remain explicit when the artifact claims measured evidence
- symbolic placeholders such as `< 1` or `> 1000` do not qualify as first evidence

### Planning / Execution / Evidence / Continuity Separation

Governed writing must preserve artifact roles:

- roadmap = planning intent and phase structure
- execution plan = bounded tranche sequence
- audit/review = evaluation and authorization posture
- baseline/evidence = factual delta or measurement record
- handoff/tracker/log = continuity truth for future work

One artifact class must not silently stand in for another.

### Continuity Surfaces Move Together

When tranche posture or canonical status changes, all affected continuity surfaces must move in the same governed batch when applicable:

- `AGENT_HANDOFF.md`
- `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md`
- closure review
- sync note / baseline delta
- append-only log if the tranche or evidence chain requires it

Do not leave handoff, tracker, and closure truth in conflicting states.

### Stop When Source Truth Is Missing

If the claimed source truth does not exist yet, the author must stop and escalate instead of inventing approximate values or implied closure.

Allowed fallback:

- declare the field `PROPOSAL ONLY`
- state exactly which source truth is still missing
- defer promotion into baseline truth until evidence exists

### Layered Machine Enforcement

This standard is intentionally enforced through multiple specialized gates instead of one monolithic checker:

- `governance/compat/check_governed_artifact_authoring.py` keeps the standard, bootstrap, checklist, policy, and CI chain aligned
- `governance/compat/check_docs_governance_compat.py` enforces governed doc placement and typed evidence rules for specific artifact classes
- `governance/compat/check_gc018_stop_boundary_semantics.py` enforces continuation packet stop-boundary semantics
- `governance/compat/check_progress_tracker_sync.py` enforces canonical tracker-sync truth
- `governance/compat/check_agent_handoff_guard_compat.py` enforces handoff truth routing
- `governance/compat/check_baseline_update_compat.py` enforces matching baseline updates
- `governance/compat/check_memory_governance_compat.py` enforces durable record class truth

## Writing Flow

Before writing a governed artifact, follow this order:

1. identify the artifact class being written
2. read the authoritative source truth for that class
3. list the continuity surfaces affected by the change
4. draft only within the evidence/authority actually available
5. run the relevant governance gates before treating the artifact as canonical

## Related Artifacts

- `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`
- `governance/compat/check_governed_artifact_authoring.py`
- `governance/compat/check_docs_governance_compat.py`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`
- `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`

## Final Clause

Governed writing is part of execution, not decoration.

If an artifact cannot prove where its truth comes from, it must not become part of CVF truth.
