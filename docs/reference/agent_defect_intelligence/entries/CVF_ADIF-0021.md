# ADIF-0021 - Applicability Marker Overmatch In Reference Or Checker Authoring

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0021
title: Applicability marker overmatch in reference or checker authoring
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records a cross-role authoring and checker-design pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT); Reviewer-return review; Closure; External knowledge absorption
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: governed reference standards, dispatch packets, worker returns, and governance/compat checkers that use text or path applicability markers
detectionSignals: a reference or dispatch artifact quotes a real applicability marker as an example and a checker treats it as opt-in, or a path marker plus prose marker makes a shape standard look like an execution artifact
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_source_intake_decision_packet_preflight.py; governance/compat/check_external_absorption_core.py; governance/compat/check_external_absorption_value_conversion.py; governance/compat/check_external_absorption_overlap_discipline.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: a1cd2ca7
roadmapSeedId: NONE
```

## Purpose

Record the KIOD-R8 pattern where a governed reference or dispatch artifact
names a real marker for instructional reasons, then a checker treats that
instructional mention as a live applicability declaration. The same pattern
appears when a path-family marker and a prose marker combine to make a shape
standard look like a real execution artifact.

## Scope / Applies To

Applies to governed reference standards, GC-018 baselines, work orders,
worker returns, completion reviews, and `governance/compat/check_*.py`
implementations that define or consume applicability markers.

It does not forbid marker-based gates. It requires marker authors and checker
authors to bind applicability to declaration shape or a specific path, rather
than broad substring presence in explanatory prose.

## Bad Example

A standard under a path family that contains an applicability path marker uses
flowing prose to name the same evidence class. The path marker plus prose
marker makes the standard look like a real execution artifact and unrelated
guards demand sections that the standard intentionally does not carry.

A checker uses `MARKER in text`, so a dispatch packet that lists
`` `Source intake decision packet: REQUIRED` `` as a literal token to review
is misclassified as a source-intake packet instance.

## Good Example

A reference standard cites the governed source path for an evidence class
instead of repeating the trigger phrase as free prose, and it records a claim
boundary that the file defines packet shape only.

A checker counts an applicability marker only when it appears as a standalone
declaration line, optionally bulleted, and adds regression tests proving that
backtick-quoted examples do not opt the document into the gate while real
standalone declarations still do.

## Canonical Sources

- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
  (items on quoted real markers, path-marker plus prose-marker self-trigger,
  and declaration-shape applicability)
- `docs/reviews/CVF_KIOD_R8_SOURCE_INTAKE_DECISION_PACKET_PREFLIGHT_WORKER_RETURN_2026-07-01.md`
  (self-repaired defects discovered during KIOD-R8 implementation)
- `governance/compat/check_source_intake_decision_packet_preflight.py`
  (`STANDALONE_MARKER_PATTERN` and marker applicability boundary)
- `governance/compat/check_external_absorption_core.py`
  (`ABSORPTION_PATH_MARKERS`, `ABSORPTION_TEXT_MARKERS`, and path-plus-text
  applicability shape)

## Remediation

Before writing a governed standard or packet that cites a gate marker, inspect
the relevant checker's applicability function and constants. If the checker is
substring-based, avoid flowing trigger prose and prefer path citations,
standalone declaration lines, or a bounded `N/A with reason` claim boundary.
If authoring the checker, use declaration-shape matching for opt-in markers
and add regression tests for both quoted-marker non-applicability and real
standalone-marker applicability.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | KIOD-R8 self-trigger learning addendum, 2026-07-01 |
| Working directory | repository root |
| Command or tool surface | source reads, rg, apply_patch, governance gates |
| Target paths | this entry file; entries README; literal-format gotchas |
| Allowed scope source | operator instruction to add learning after KIOD-R8 self-repaired defects |
| Before status evidence | KIOD-R8 worker return recorded two self-repaired marker-overmatch defects |
| After status evidence | ADIF-0021 records the marker-overmatch pattern for future resolver results |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect record and authoring/checker guidance only |
| Claim boundary | defect-record only; no new checker, runtime/provider/live behavior, public-sync, package activation, or production claim |
| Agent type | reviewer/closer |
| Invocation ID | `kiod-r8-marker-overmatch-learning-2026-07-01` |
| Expected manifest | this entry; entries README; literal-format gotchas |
| Actual changed set | this entry; entries README; literal-format gotchas |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry and authoring guidance. No public-sync
claim.

## Claim Boundary

This entry records a marker-overmatch defect pattern and points to existing
partial guard surfaces. It does not change any checker, does not assert that
all marker false positives are machine-prevented, and does not authorize any
runtime, provider, adapter, MCP, public-sync, or production behavior.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a confirmed
authoring and checker-applicability pattern, not an empirical provider/runtime
claim.
