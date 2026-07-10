# CVF Agent Build Loop Playbook

Status: ACTIVE_REFERENCE

Memory class: FULL_RECORD

## Purpose

Provide a compact optional discipline for implementation work where a concrete
anchor, small edit, cheap validation, and reviewable receipt reduce wandering
without replacing agent judgment.

## Scope / Applies To

Applies only to work that explicitly selects the profile. It does not alter
the default workflow for discovery, architecture, incidents, or other tasks.

## Selection

Use this profile only when a work order or operator says
`BUILD_LOOP_PROFILE: SELECTED`. Otherwise it is advisory.

Good candidates are bounded bug fixes, localized refactors, migration repairs,
and source-backed documentation changes. Do not force it onto discovery,
architecture exploration, incident response, or tasks whose uncertainty makes
early local edits misleading.

## Micro-Loop

`ANCHOR -> LOCAL_READ -> FALSIFIABLE_HYPOTHESIS -> SMALL_EDIT -> CHEAP_VALIDATION -> RECEIPT`

1. **Anchor:** name the file, symbol, failing check, or contract that makes the
   next action concrete.
2. **Local read:** inspect the anchor and nearby ownership context. Broaden the
   search only when the local evidence cannot answer a specific question.
3. **Falsifiable hypothesis:** state what is wrong and what observation would
   disprove the proposed fix.
4. **Small edit:** make the smallest coherent change that tests the hypothesis
   while respecting allowed paths.
5. **Cheap validation:** run the narrowest meaningful check first, then broaden
   according to blast radius and risk.
6. **Receipt:** record evidence and choose continue, review, freeze candidate,
   or stop/escalate.

## Stop And Escalate

Stop the loop when any of these is true:

- the edit requires paths outside authorized scope;
- the hypothesis cannot be made falsifiable;
- repeated local reads do not reduce uncertainty;
- validation contradicts the hypothesis twice without new evidence;
- risk, authority, or repository boundary changes;
- the next action would consume live quota without a prior failure diagnostic.

Stopping is a valid outcome. The receipt should explain what evidence is
missing and who owns the next decision.

## Metrics

Metrics are diagnostic, not targets. A lower number is not automatically
better, and agents must not optimize counts at the expense of evidence.

| Metric | Meaning | Misuse to avoid |
| --- | --- | --- |
| `timeToFirstEditMs` | elapsed time before first material edit | rewarding premature edits |
| `targetedSearchCount` | searches tied to a named question | hiding searches or splitting commands |
| `broadSearchCount` | repository-wide or weakly bounded searches | treating every broad search as waste |
| `nearbyReadCount` | local owner/context reads | discouraging necessary context |
| `rereadCount` | repeated reads of the same source | assuming rereads are always failure |
| `toolCallsBeforeFirstEdit` | tool calls before first edit | racing to edit |
| `totalToolCalls` | total calls in the loop | comparing unlike tasks |
| `validationLatencyMs` | elapsed validation time | choosing shallow checks only |
| `changedPathCount` | paths changed by the loop | fragmenting coherent edits |
| `scopeDriftCount` | attempted out-of-scope expansions | suppressing honest escalation |
| `stopTriggerCount` | stop conditions observed | penalizing safe stops |
| `reviewSurvived` | accepted without material reviewer repair | claiming correctness without review |
| `freezeSurvived` | remained valid through freeze/closure | claiming durability before closure |

## Work-Order Selection Block

When selected, a work order needs only this compact block:

```text
BUILD_LOOP_PROFILE: SELECTED
anchor: <path, symbol, check, or contract>
allowedPaths: <bounded path list>
firstValidation: <command or review action>
stopOn: <task-specific stop condition>
receiptPath: <JSON output path>
```

Do not add this block to work orders that do not select the profile.

## Receipt Contract

Receipts must validate against
`docs/reference/agent_build_loop/CVF_AGENT_BUILD_LOOP_RECEIPT_SCHEMA.json`.
The schema enforces shape and enums; semantic review still owns whether the
anchor, hypothesis, edit, validation, and decision are credible.

## Claim Boundary

This is reference guidance and a data contract. It does not implement runtime
enforcement, automatic measurement, provider control, or universal agent
performance improvement.
