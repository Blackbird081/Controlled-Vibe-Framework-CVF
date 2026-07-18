# ADIF-0007 - Gate Marker In Boundary Prose Triggers Wrong Evidence Class

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0007
title: Gate marker in boundary prose triggers wrong evidence class
defectCategory: GATE_TRIGGER_FRICTION
defectClass: PHASE_GATE_PLACEMENT_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry is a general pattern, not a single finding row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT); Reviewer-return review; Closure
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: N/A reasons, out-of-scope disclaimers, and boundary-prose sentences in any GC-018, work order, worker return, completion review, or governed reference artifact
detectionSignals: a scope-exclusion or explanatory sentence uses a bare trigger word or a marker phrase that a keyword- or phrase-based gate reads as a positive evidence-class claim rather than an exclusion; this is confirmed for the WODS-T3 table-oriented execution-boundary guard
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_corpus_scan_registry.py; governance/compat/check_finding_to_governance_learning.py; governance/compat/check_delta_execution_claim_boundary.py (not all trigger classes have a dedicated test asserting the false-positive itself)
promotionState: STANDARD_ADDED
supersedes: NONE
lastVerifiedCommit: f5a2bec2
roadmapSeedId: ADIF-SEED-007
```

## Purpose

Record one observed defect pattern so an agent can recognize it before writing
a scope-exclusion or explanatory sentence that contains a bare keyword or
marker phrase a gate may treat as an applicability signal.

## Scope / Applies To

Applies to N/A reasons, out-of-scope disclaimers, and boundary-prose sentences
in any GC-018, work order, worker return, completion review, or governed
reference artifact. Does not apply to runtime, provider, or public-sync behavior.

## Bad Example

> "no corpus scan or readiness classification required" - the bare words
> "scan", "corpus", "readiness", and "classification" force the corpus scan
> registry gate to demand Registry JSON/Markdown evidence that was never
> intended.

## Good Example

> "doc-only scope; file-system enumeration not used" - states the same
> exclusion without the trigger tokens.

## Canonical Sources

- `docs/reference/CVF_FINDING_PROPAGATION_AND_ROOT_CAUSE_GROUPING_STANDARD_2026-06-16.md`
  (Boundary-Prose Trigger Discipline: known keyword trigger classes table
  and compliant-alternative phrasing table)
- `governance/compat/check_delta_execution_claim_boundary.py`
  (`BOUNDARY_TEXT_MARKERS` and `_is_applicable`, confirmed during WODS-T3)
- `docs/reviews/CVF_WODS_T3_DELTA_BLOCK_TABLE_SHAPE_AND_TEMPLATE_HARDENING_WORKER_RETURN_2026-06-26.md`
  (confirmed phrase-marker false positive and bounded rewording)

## Remediation

When declaring a scope exclusion or documenting a gate trap, use the
FPRC-compliant alternative phrasing that avoids the literal marker. If a
sentence must be technical and cannot avoid a marker, run the affected direct
guard while the draft is short and record a bounded rewording or return the
checker change for a separately authorized hardening decision.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: ADIF guidance extension records a confirmed
defect scope; it makes no empirical prediction, corpus comparison, or runtime
claim update.

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

This entry records an observed defect pattern and points to the FPRC standard
and confirmed checker surfaces. `enforcementLevel` is `PARTIAL_CHECK` because
several marker-trap classes are caught by existing gates as a side effect of
their normal evidence checks, but no single checker exhaustively tests every
trigger-word or phrase-marker class.
