# CVF Reviewed Outcome Offline Validation Guide

Memory class: governed-reference-guide
Status: ACCEPTED_BOUNDED_OFFLINE

## Scope / Target / Owner Boundary

This guide covers the optional offline reviewed-outcome companion and its exact input file. Local remains the technical review and closure owner.

## Target / Source

The validator contract is docs/reference/CVF_MODEL_SELECTION_REVIEWED_OUTCOME_PROFILE_2026-10-11.md. The example is a retrospective projection of S2-R1 source evidence.

## Scope / Methodology

The user runs one local standard-library CLI against an explicitly named JSON record. The result describes declared-profile consistency only.

## Findings / Position

The guide explains the validated fields, statuses, initial and final artifact distinction, repair attribution, and safe unknown handling.

## Risk / Corrective Action

The CLI does not follow or authenticate referenced sources. Keep this limitation beside any result and send acceptance questions to Local.

## Decision / Disposition

This is procedural documentation for a bounded offline helper; it grants no execution authority.

## Purpose

`governance/compat/model_selection_reviewed_outcome.py` checks whether a supplied `ReviewedOutcomeLink` record is internally consistent with the locked offline profile. It does not select a model, authorize work, authenticate evidence, contact a provider, follow a reference, or establish runtime behavior.

## Validate a Record

From the repository root, run:

```powershell
python governance/compat/model_selection_reviewed_outcome.py --input docs/reviews/evidence/model-selection-s2-r2-outcome-example-20261011.json
```

The CLI reads only the named input (UTF-8, with or without BOM; at most 1 MiB and 32 nested containers). It emits one JSON object with `profileVersion`, `disposition`, `executionAuthorized`, and sorted `errors`.

| Exit | Disposition | Meaning |
|---|---|---|
| 0 | `VALID_OUTCOME_RECORD_ONLY` | Declared fields, digests and joins satisfy this profile. |
| 1 | `INVALID_OUTCOME_RECORD` | One or more consistency checks failed. |
| 2 | `INPUT_ERROR` | The file could not be read or parsed within input limits. |

`executionAuthorized` is always `false`. A successful check is not a review acceptance or execution grant.

## Original Records And Retrospective Projections

`basis=ORIGINAL_RECORD` represents a contemporaneously captured record. For this basis, known attempt starts must be at or after the embedded selection decision time.

`basis=RETROSPECTIVE_PROJECTION` explicitly labels a record assembled later from named evidence. Its compact embedded S2 decision may be authored for that projection; it must not be described as the original dispatch-time freeze. The S2-R2 example projects the accepted S2-R1 task this way. It pins the earlier work order and records the requested `gpt-6-luna/xhigh` separately from null observed runtime identity fields.

## Preserve Initial And Final Evidence

The example keeps the first submitted return pin and original product pins under `initialReturn`, then points `finalReturn` and `acceptedArtifacts` at the accepted bytes. Its first disposition remains `PENDING_REVIEW`. Local repair rows link submitted-to-accepted bytes and describe the five semantic repair groups. A separate closure-packaging assistance row records the SCEC pin corrections; it does not replace repair attribution for changed bytes.

`WORKER_PRE_RETURN` rows must use the attempt's actor and invocation identity. `LOCAL_REVIEW` repair rows identify the Local actor and invocation. Terminal review identity must differ from each worker identity after the profile's normalization. A missing clock, runtime field, cost amount, or usage measure stays null with a reason; stage clocks are not substituted for acceptance time, and empty spend arrays do not mean zero.

## Limits

The validator checks declared consistency only. References are opaque locator/hash pairs; it never follows them. Passing does not prove a reference's current bytes, source authority, provider/model/snapshot/effort, omitted attempts, actor authenticity, cost, quality, safety, or lifecycle state. A disclosed `DEVIATION` may still accompany bounded artifact acceptance, but it cannot imply execution under the requested configuration. Unknown observed identity remains `UNKNOWN`, not a match.

Telemetry preserves MONEY, TOKENS, QUOTA, WALL_SECONDS, WORKER_SECONDS, and HUMAN_SECONDS as separate units. Unknown amounts require `basis=UNKNOWN` and an explanation. No totals, currency conversion, cap certification, model ranking, comparative quality, savings, or causal effect is calculated.

This companion is optional offline evidence for one bounded task. It does not implement the complete R3 design, a selector, PARENT_CONTROL/PLL, Gateway interception, runtime storage, or S5. Local remains the technical review and closure owner.

## Claim Boundary

A successful check validates declarations under the locked profile only. It does not establish source truth, model identity or quality, cost, provider execution, runtime readiness, or Local acceptance.

## Local Verification - 2026-10-11

Local source-derived API/CLI review passed 129/129 cases after four attributed repair groups; focused regressions pass 30/30. Pending reviewer identities also remain distinct from all declared workers; ACCEPTED_UNREPAIRED invariants apply across later dispositions. Malformed identity and clock inputs retain controlled sibling diagnostics. The original submitted files and worker results are separately retained in the S2-R2 Local evidence; no model-quality conclusion follows.
