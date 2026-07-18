# ADIF-0008 - Reusable Lesson Remains Only In Provider Memory

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0008
title: Reusable lesson remains only in provider memory
defectCategory: AUTHORITY_BOUNDARY
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Worker execution (WORKER_MUST_NOT_COMMIT); Closure
roles: worker; reviewer; closer
lifecyclePhases: pre-closure; pre-push
surfaceSelectors: finding-bearing artifacts (logs, reviews, assessments, audits) that mention a lesson captured in CLAUDE.md, a Codex memory file, or an IDE side-channel summary
detectionSignals: phrases like "stored in claude memory", "saved to memory.md", "added to claude.md" appear without a paired governed promotion disposition (RULE_ADDED, STANDARD_UPDATED, STANDARD_ADDED, MACHINE_CHECK_ADDED, MACHINE_CHECK_CANDIDATE, TEMPLATE_UPDATED) or a non-reusable/session-local N/A_WITH_REASON
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_finding_to_governance_learning.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: 0fde5cf2
roadmapSeedId: ADIF-SEED-008
```

## Purpose

Record one observed defect pattern so an agent can recognize it before
closing a finding-bearing artifact that names a provider-memory-only
storage location without a paired governed promotion.

## Scope / Applies To

Applies to finding-bearing artifacts (logs, reviews, assessments, audits)
that mention a lesson captured in provider-specific memory. Does not apply
to runtime, provider, or public-sync behavior.

## Bad Example

> "This lesson was saved to Claude memory so future sessions will know to
> avoid this mistake." with no corresponding CVF-governed promotion.

## Good Example

> "This lesson was promoted to
> `docs/reference/CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md`
> FPRC-T2 addendum B12; provider memory holds only a session-local pointer."

## Canonical Sources

- `docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md`
  (Provider-memory learning boundary)
- `docs/reference/CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md`
  (Provider Memory Learning Escape Guard; FPRC-T2 Reusable Lesson Promotion
  Addendum)

## Remediation

Any reusable, future-agent, gate-repair, or work-order-authoring-trap lesson
must be promoted into a CVF-governed reference standard, work-order
addendum, roadmap/completion-review follow-up control action, or
checker/test update before closure. A note that the lesson is "in provider
memory" is not itself closure evidence.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Claude continuous-execution orchestrator/worker |
| Provider or surface | local workspace |
| Session or invocation | ADIF-T1 execution, 2026-06-23 |
| Working directory | repository root |
| Command or tool surface | governed source reads, file write tool |
| Target paths | this entry file |
| Allowed scope source | ADIF-T1 GC-018 baseline and paired work order |
| Before status evidence | file did not exist before this tranche |
| After status evidence | entry created with cited canonical evidence |
| Diff evidence | new-file creation in the ADIF-T1 checkpoint commit |
| Approval boundary | ADIF-T1 child scope only |
| Claim boundary | records an observed defect pattern only; no checker implementation |
| Agent type | continuous-execution orchestrator/worker |
| Invocation ID | `adif-t1-execution-2026-06-23` |
| Expected manifest | this entry, part of the ADIF-T1 eight-entry batch |
| Actual changed set | this entry |
| Manifest delta | MATCH |

## Claim Boundary

This entry records an observed defect pattern and its existing checker
binding. It does not implement, modify, or extend the cited checker.
