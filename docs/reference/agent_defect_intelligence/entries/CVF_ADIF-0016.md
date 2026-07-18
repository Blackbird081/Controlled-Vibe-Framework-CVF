# ADIF-0016 - Reusable Learning Trapped In One-Off Work Order Checklist

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0016
title: Reusable learning trapped in one-off work order checklist
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; ADIF entry authoring; External knowledge absorption
roles: dispatcher; reviewer; closer
lifecyclePhases: pre-dispatch; pre-closure
surfaceSelectors: work orders, reviews, and roadmaps that record reusable worker mistakes only inside a task-local checklist or artifact-specific note
detectionSignals: a checklist names repeated or cross-lane agent failures, but no ADIF entry, guard-orientation row, standard update, or machine-check candidate records the lesson in a reusable CVF-governed surface
enforcementLevel: GUIDANCE_ONLY
checkerBindings: NOT_APPLICABLE_WITH_REASON: detecting whether a lesson is reusable versus task-local requires reviewer judgment; no generic checker is implemented
promotionState: DESIGN_REVIEW_REQUIRED
supersedes: NONE
lastVerifiedCommit: ab3b7755
roadmapSeedId: NONE
```

## Purpose

Record the pattern where a reviewer correctly notices small worker or
dispatcher failure modes, but stores the prevention list only inside the
current work order. That helps the immediate worker, but it does not teach
future agents unless they happen to read the same work order.

The durable CVF pattern is: task-local checklists may exist, but any repeated,
cross-lane, or non-obvious lesson must also be routed to a reusable surface
such as ADIF, Guard Orientation, a canonical standard, or a machine-check
candidate.

## Scope / Applies To

Applies to work-order authoring, reviewer closeout, and external-knowledge
absorption when the artifact records defects that are likely to recur outside
the current task. Does not require promoting every local caution; one-off
implementation details can remain task-local.

## Bad Example

> A work order adds a "Worker Avoidance Checklist" warning against a false
> zero-candidate claim, early downstream tranche execution, weak runtime
> absence claims, and mixed dispatch/session-sync trace. The checklist remains
> only in that work order. Future agents working on another absorption folder
> or commit batch will not see the lesson unless they search that exact file.

## Good Example

> The work order keeps a compact task-local checklist for the immediate
> worker, and the reviewer also promotes reusable items into ADIF entries or a
> guard-orientation common-failure row. Later work orders disclose the matching
> ADIF IDs through the mandatory defect-registry disclosure block, making the
> lesson visible before dispatch.

## Canonical Sources

- `AGENTS.md` (Mandatory ADIF Defect Registry Disclosure)
- `docs/reference/agent_defect_intelligence/CVF_ADIF_ENTRY_TEMPLATE.md`
  (entry creation and split-commit guidance)
- `docs/reference/guard_orientation/README.md`
  (task-class guard map and common failure patterns)
- `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md`
  (agent errors become reusable governance learning, not provider-local memory)

## Remediation

When a checklist item is reusable across folders, repos, agents, or future
tranches, promote it outside the one-off artifact in the same batch or record a
concrete follow-up. Use ADIF for defect-pattern memory, Guard Orientation for
task-first reminders, canonical standards for binding rule changes, and
machine-check candidates only when the signal is deterministic enough to test.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace |
| Session or invocation | reusable-learning ADIF promotion, 2026-06-29 |
| Working directory | repository root |
| Command or tool surface | startup reads, ADIF template read, existing entry reads, apply_patch |
| Target paths | this entry file; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0017.md`; entries README |
| Allowed scope source | operator challenge that a work-order-only checklist does not create durable CVF learning |
| Before status evidence | AGSK-T4 work order contained a Worker Avoidance Checklist, but the reusable lessons were not yet discoverable through ADIF |
| After status evidence | ADIF-0016 records the reusable-learning-localization defect for resolver-based preflight use |
| Diff evidence | new-file creation and entries README row in this batch |
| Approval boundary | defect-record only; no checker, runtime, provider, public-sync, or session-state change |
| Claim boundary | guidance-only ADIF entry; no automatic prevention claim |
| Agent type | reviewer/closer |
| Invocation ID | `reusable-learning-localization-adif-2026-06-29` |
| Expected manifest | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0016.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0017.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Actual changed set | `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0016.md`; `docs/reference/agent_defect_intelligence/entries/CVF_ADIF-0017.md`; `docs/reference/agent_defect_intelligence/entries/README.md` |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry. No public-sync claim.

## Claim Boundary

This entry records a reusable defect pattern only. It does not implement a
checker, alter work-order dispatch gates, or claim that future agents will read
or apply the entry without the existing ADIF disclosure/resolver workflow.
