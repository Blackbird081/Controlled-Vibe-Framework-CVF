# ADIF-0017 - Commit-Shape Probing Instead Of Steward-First Split Planning

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0017
title: Commit-shape probing instead of steward-first split planning
defectCategory: SCOPE_AND_OWNERSHIP
defectClass: WORKER_EXECUTION_ERROR
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Closure; Session-sync
roles: dispatcher; reviewer; closer; session-sync steward
lifecyclePhases: pre-dispatch; pre-closure; pre-push
surfaceSelectors: work orders, closure packets, session-sync batches, and changed sets that include any mix of material governed artifacts and active handoff, CVF_SESSION_MEMORY.md, CVF_SESSION/ACTIVE_SESSION_STATE.json, or CVF_SESSION/state/** paths
detectionSignals: the agent starts staging, stashing, or attempting commits before classifying changed paths with commit steward, then discovers the already-known split requirement through failed preflight attempts
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/run_agent_commit_steward_preflight.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: ab3b7755
roadmapSeedId: NONE
```

## Purpose

Record the workflow defect where an agent treats commit-shape validation as a
late test instead of an upfront planning step. CVF already has a commit steward
that classifies material paths, protected session/handoff paths, and exact
manifest artifacts. If the changed set is mixed, the split requirement is known
before any commit attempt.

## Scope / Applies To

Applies whenever a governed batch may include both material artifacts
(work orders, roadmaps, reviews, standards, guards, source, tests, registry
entries) and continuity surfaces (`AGENT_HANDOFF*.md`,
`CVF_SESSION_MEMORY.md`, `CVF_SESSION/ACTIVE_SESSION_STATE.json`, or
`CVF_SESSION/state/**`). It also applies to handoff-only follow-up commits
after a material commit.

## Bad Example

> An agent has a new work order plus session/front-door updates in the same
> diff. It runs commit steward only after composing the mixed batch, observes
> the steward's split recommendation, tries material-only, hits handoff HEAD
> drift, then must stash and repair ordering. The checker was deterministic;
> the wasted time came from not planning the split before staging.

## Good Example

> Before staging or stashing, the agent runs `git status --short`, classifies
> paths into material versus session/handoff continuity, and runs the matching
> steward preflight. It commits in a planned sequence: prior handoff sync if
> HEAD continuity is already stale, material commit, then session-sync or
> handoff-sync commit. Each commit has a matching base/head and lane.

## Canonical Sources

- `docs/reference/CVF_AGENT_COMMIT_STEWARD_PROTOCOL_STANDARD_2026-06-15.md`
  (Commit Split Rule and Required Steward Command)
- `docs/reference/CVF_AGENT_OPERATION_TRACE_AND_WORKSPACE_INTEGRITY_STANDARD_2026-06-13.md`
  (exact manifest and changed-set discipline)
- `docs/reference/guard_orientation/README.md`
  (session-sync role and ADIF split-commit guidance)
- `governance/compat/run_agent_commit_steward_preflight.py`
  (existing partial machine check and split recommendation)

## Remediation

Before any governed commit, classify the changed set and choose the steward
lane before staging or attempting the commit. If material and
session/handoff paths are both present, plan a split commit sequence first.
Use the failed gate only to diagnose unknown defects; do not use it to discover
the deterministic material/session split rule that the steward already
documents.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | commit-shape ADIF promotion, 2026-06-29 |
| Working directory | repository root |
| Command or tool surface | startup reads, commit steward standard read, ADIF template read, apply_patch |
| Target paths | this entry file; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0016.md`; entries README |
| Allowed scope source | operator challenge that deterministic commit-shape split failures should be avoided before trial commits |
| Before status evidence | AGSK-T4 dispatch cleanup required extra stash/split steps after a mixed material/session diff hit the steward split recommendation |
| After status evidence | ADIF-0017 records steward-first split planning as a reusable pre-commit defect pattern |
| Diff evidence | new-file creation and entries README row in this batch |
| Approval boundary | defect-record only; no checker, runtime, provider, public-sync, or session-state change |
| Claim boundary | partial-check ADIF entry citing the existing commit steward; no new enforcement claim |
| Agent type | reviewer/closer |
| Invocation ID | `commit-shape-steward-first-adif-2026-06-29` |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0016.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0017.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0016.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0017.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records a reusable workflow defect and cites the existing commit
steward as a partial check. It does not implement a new checker or guarantee
that agents will plan the split unless the ADIF resolver/readout is consulted.
