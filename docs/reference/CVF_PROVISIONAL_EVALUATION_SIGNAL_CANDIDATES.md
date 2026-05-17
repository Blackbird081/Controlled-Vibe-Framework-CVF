# CVF Provisional Evaluation Signal Candidates

> **Document Type:** BOUNDED INVARIANT — CVF-NATIVE
> **Status:** W71-T1 native adoption complete 2026-04-13; implementation evidence confirmed: `Stage1DiagnosticInterpretationContract` + `Stage1DiagnosticPacketContract` + batch variants in LPF; signal schema stable; TruthScore weights and calibration remain intentionally deferred by design — this is not a closure defect
> **Source Quality:** mixed intake; normalized into LPF candidate form
> **Scope:** provisional learning-plane signals derived from prompt, skill, and external asset intake patterns
> **Scope Boundary:** These are LPF candidate signals only. They do not define fixed TruthScore weights and are unrelated to the Alibaba provider PVV workstream.

## 1. Purpose

This document captures evaluation signals that are useful enough to preserve, but not yet calibrated enough for canon scoring doctrine.

These signals are accepted only as provisional LPF candidates.

## 2. Required Fields For Every Candidate

```yaml
provisional_signal:
  name: string
  category: epistemic|execution|output_quality|security|planner_quality|asset_quality
  capture_source: string
  evidence_type: guard_event|trace_event|validation_report|review_signal|planner_analysis
  phase:
    - INTAKE|DESIGN|BUILD|REVIEW|RUN
  severity: low|medium|high
  recommended_remediation: string
```

## 3. Canonical Constraints

1. No provisional signal may define fixed TruthScore deltas yet.
2. No provisional signal may set LPF category weighting by itself.
3. Signals become scoring inputs only after calibration against real trace and eval evidence.

## 4. Initial Candidate Set

| Signal | Category | Capture Source | Evidence Type | First Use |
| --- | --- | --- | --- | --- |
| `weak_trigger_definition` | planner_quality | trigger or description analysis | planner_analysis | first implementation candidate |
| `scope_violation` | execution | guard or review evidence | guard_event | second implementation candidate |
| `missing_clarification` | epistemic | intake or boardroom traces | trace_event | refinement candidate |
| `approval_missing` | execution | authorization or guard traces | guard_event | refinement candidate |
| `incomplete_output` | output_quality | validation or review artifact | validation_report | refinement candidate |
| `missing_output_contract` | asset_quality | asset validation | validation_report | refinement candidate |
| `governance_gap` | asset_quality | intake or review evidence | review_signal | refinement candidate |
| `security_risk` | security | validation or security review | validation_report | refinement candidate |

## 5. Recommended Rollout Order

### 5.1 First

`weak_trigger_definition`

Why:

- planner-facing
- easy to observe
- low risk of polluting runtime governance

### 5.2 Second

`scope_violation`

Why:

- already relates to existing CVF scope enforcement surfaces
- can be captured from current guard or review evidence

## 6. Promotion Rule

A provisional signal may move toward canon scoring only after:

1. real capture path exists
2. trace-linked evidence exists
3. remediation semantics are stable
4. LPF calibration review explicitly approves scoring behavior

## 7. Final Rule

External wisdom may inspire measurable signals.

Only calibrated CVF evidence may promote them into scoring doctrine.
