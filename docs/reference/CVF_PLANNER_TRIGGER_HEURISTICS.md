# CVF Planner Trigger Heuristics

> **Document Type:** INTERNAL DESIGN DRAFT
> **Status:** Promoted from `CVF ADDING NEW` intake after Round 3 rebuttal and human sign-off on 2026-04-12
> **Source Quality:** mixed intake; normalized into CVF control-plane heuristics
> **Scope:** planner-facing trigger detection, description shaping, and clarification routing
> **Scope Boundary:** This document governs intake, boardroom, and orchestrator heuristics only. It is unrelated to the Alibaba provider PVV workstream.

## 1. Purpose

This document defines how trigger and description patterns may assist planning without acquiring runtime authority.

The goal is to improve:

- intent detection
- candidate routing
- clarification quality
- planner readability

without collapsing the governed plan path into direct skill dispatch.

## 2. Allowed Trigger Outputs

Planner trigger heuristics may emit:

```yaml
planner_trigger_result:
  candidate_refs: []
  confidence: number
  missing_inputs: []
  clarification_needed: boolean
  negative_matches: []
```

These outputs are planner aids only.

## 3. Forbidden Trigger Outputs

Trigger heuristics must not directly emit:

- runtime permission
- direct tool invocation
- unconditional execution
- governance override

## 4. Trigger Design Rules

Trigger and description patterns should:

- use clear trigger phrases
- declare prerequisites
- separate included scope from excluded scope
- surface expected outputs
- bias to clarification when required inputs are missing
- provide negative matches to reduce over-routing

## 5. Bounded Fast-path Exception

A trigger may emit a single `candidate_ref` directly when all of the following are true:

- `confidence >= 0.95`
- all prerequisites are satisfied
- `risk_level = R0`
- the full governed chain remains intact:
  - plan build
  - policy or guard checks as applicable
  - runtime authorization if needed

This is a speed optimization inside governance, not a bypass.

## 6. Clarification-first Rule

If required inputs are missing, planner trigger behavior must prefer:

- clarification
- boardroom refinement
- intent narrowing

over premature asset selection.

## 7. Relationship To Existing Canon

This document complements:

- `IntakeBatchContract`
- `ClarificationRefinementBatchContract`
- boardroom and orchestrator surfaces described in the whitepaper

It does not replace governed planning.

## 8. Final Rule

Triggers guide candidate selection.

CVF still governs planning, authorization, and execution.
