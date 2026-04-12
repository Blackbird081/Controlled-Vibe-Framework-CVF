# CVF ADDING NEW — Stage 1 Diagnostic Bridge

Memory class: SUMMARY_RECORD

> **Date:** 2026-04-12
> **Status:** ACTIVE INTERNAL BRIDGE
> **Purpose:** define how the new Stage 1 helper surfaces should be used when the first API-key-based agent readout arrives
> **Boundary:** this bridge interprets evidence; it does not replace the active PVV/provider evidence chain

## 1. Why This Bridge Exists

The Stage 1 implementation added three new diagnostic surfaces:

- external asset intake validation
- planner-trigger heuristic analysis
- provisional `weak_trigger_definition` capture

It now also includes LPF interpretation helpers that can convert those three surfaces into a bounded diagnostic attribution for one case or a batch of cases.

These improve diagnosis, but only if the team uses them in a disciplined way.

Without a bridge packet, the likely failure mode is:

- people see new helper outputs
- then over-read them as runtime truth

This document prevents that.

## 2. Official Diagnostic Packet To Use

For any future live-run interpretation that wants to use the Stage 1 helpers, use:

- `docs/reference/CVF_STAGE1_DIAGNOSTIC_INTERPRETATION_PACKET_TEMPLATE.md`

This is now the canonical internal packet shape for Stage 1 interpretation.

For the first real API-key-based case, a fill-ready working packet now also exists:

- `docs/assessments/CVF_STAGE1_FIRST_REAL_CASE_DIAGNOSTIC_PACKET_SKELETON_2026-04-12.md`

Use that skeleton to avoid ad-hoc packet assembly when the first disputed or ambiguous live readout arrives.

## 3. Correct Reading Order

When a run looks weak, ambiguous, truncated, or unexpectedly strong, read the case in this order:

1. runtime evidence first
2. intake validation second
3. planner-trigger result third
4. provisional signal capture fourth

Why this order:

- runtime evidence remains the product-truth surface
- the helper surfaces are interpretation aids, not verdict replacements

## 4. What Each New Surface Can Legitimately Say

### 4.1 External asset intake validation

This can say:

- the incoming asset/profile shape was malformed
- required fields were missing
- a `W7ToolAsset` candidate lacked required tool content
- a shell-dependent `W7SkillAsset` arrived without declared `execution_environment`
- the declared execution environment did not match the target interpretation context

This cannot say:

- the provider lane is low quality
- the governed runtime is bad

### 4.2 Planner-trigger heuristic output

This can say:

- candidate selection was weak
- clarification was obviously needed
- negative matches should have blocked over-routing

This cannot say:

- execution was authorized
- the system should have invoked a tool directly

### 4.3 Provisional `weak_trigger_definition` signal

This can say:

- planner wording or trigger framing is weak enough to preserve as a diagnostic observation

This cannot say:

- TruthScore should change
- LPF scoring doctrine should change

## 5. Decision Boundary This Bridge Improves

This bridge is useful when the team needs to answer:

- was the poor result caused by provider/runtime behavior
- or did the case enter execution already weakly framed

That distinction matters because otherwise the team may blame:

- provider quality for an intake problem
- CVF governance for a missing-clarification problem

## 5.1 Code Surfaces Now Available

The following interpretation helpers now exist in code:

- `Stage1DiagnosticInterpretationContract`
- `Stage1DiagnosticInterpretationBatchContract`
- `Stage1DiagnosticPacketContract`
- `Stage1DiagnosticPacketBatchContract`

Their job is to classify cases into:

- `INTAKE_SHAPE`
- `PLANNER_TRIGGER_QUALITY`
- `MISSING_CLARIFICATION`
- `RUNTIME_OR_PROVIDER_BEHAVIOR`
- `MIXED`
- `UNRESOLVED`

These are still interpretation aids, not provider verdict engines.

They are intended to reduce manual packet assembly when the first real run readouts arrive.

## 6. Mandatory Separation From PVV / Provider Claims

If a case uses this bridge, the final writeup must keep these claims separate:

- runtime/provider quality claim
- intake/planner diagnostic claim
- provisional LPF signal claim

No single Stage 1 helper output is enough to justify a provider-quality conclusion.

## 7. Current Operational Posture

Current posture is:

`STAGE 1 DIAGNOSTIC SURFACES ACTIVE / PROVIDER-QUALITY CLAIMS STILL EVIDENCE-LED`

## 8. Canonical Pointers

- Follow-up note:
  - `docs/assessments/CVF_ADDING_NEW_IMPLEMENTATION_FOLLOWUP_2026-04-12.md`
- Readiness assessment:
  - `docs/assessments/CVF_ADDING_NEW_STAGE1_IMPLEMENTATION_READINESS_2026-04-12.md`
- Authorization packet:
  - `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_ADDING_NEW_STAGE1_IMPLEMENTATION_2026-04-12.md`
- Whitepaper status anchor:
  - `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
