# ADIF-0023 - Worker Output Artifact Checker Shape Assumed From Dispatch Packet

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0023
title: Worker output artifact checker shape assumed from dispatch packet
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records a worker-output authoring pattern, not a single root-cause role row
severity: MEDIUM
lifecycleState: ACTIVE
taskClasses: Worker execution (WORKER_MUST_NOT_COMMIT); External knowledge absorption; Reviewer-return review
roles: worker; reviewer
lifecyclePhases: pre-implementation; pre-closure
surfaceSelectors: docs/reviews worker-return packets and companion docs/reference artifacts created by no-commit workers
detectionSignals: work order and baseline pass dispatch checks, but the newly created worker output artifacts miss docType-specific headings, conditional guard sections, or literal enum tokens required by their own checker lanes
enforcementLevel: PARTIAL_CHECK
checkerBindings: governance/compat/check_markdown_structural_completeness.py; governance/compat/check_worker_return_quality_gate.py; governance/compat/check_corpus_completeness_report_integrity.py; governance/compat/check_external_absorption_value_conversion.py; governance/compat/check_rescan_intelligence_hardening.py; governance/compat/check_governed_artifact_checker_read_ahead.py
promotionState: RULE_EXISTS
supersedes: NONE
lastVerifiedCommit: f0b41871
roadmapSeedId: NONE
```

## Purpose

Record the MSEA worker-output defect pattern where a dispatch packet contains
a valid checklist and a valid `## Checker Source Read-Ahead Block`, but the
worker treats that dispatch checklist as sufficient for the artifacts the
worker is about to create. The baseline and work order can pass dispatch gates
while the newly created worker return and companion reference still need their
own `docType` headings, conditional guard sections, marker lines, and enum
tokens.

This entry narrows ADIF-0020. The general failure is skipping checker
read-ahead before writing a governed artifact. This narrower failure is reading
or relying on the dispatch packet's checker list, but not reading the checker
source as it applies to each output artifact type.

## Scope / Applies To

Applies to no-commit worker execution, external absorption worker returns, and
worker-created companion references. It is most relevant when one work order
expects multiple output artifact types, such as a `docs/reviews` worker return
and a `docs/reference` ledger or owner-surface delta.

It does not require longer work orders. It requires workers to convert the
compact checker list into an output-artifact checklist before writing.

## Bad Example

A work order passes pre-dispatch and lists relevant checkers. The worker writes
a review packet and a reference ledger from the work order checklist, then
discovers through failed gates that:

- a `docType: review` packet needs a target/source heading family;
- a `docType: reference` artifact needs a scope/applies-to heading family;
- a reabsorption worker return needs `## Rescan Intelligence Hardening`;
- a corpus ledger needs a checker-visible terminal marker and verdict shape;
- a value-conversion matrix needs a `CHECKER_CANDIDATE` lane when checker
  value is present;
- a rescan matrix needs exact accepted route tokens such as
  `REMOVED_OR_REJECTED` and `RESOLVED_BY_DESIGN`.

The worker then uses gate failures as the first full discovery pass for output
artifact shape.

## Good Example

Before writing the worker return or companion reference, the worker reads the
checker source files named by the work order and extracts requirements per
output artifact:

```markdown
Output artifact checker plan:

- `docs/reviews/...WORKER_RETURN...md`: review structural heading families,
  worker-return quality sections, rescan/corpus/value-conversion conditional
  sections, exact worker-return status and no-commit evidence.
- `docs/reference/...LEDGER...md`: reference structural heading families,
  scope/applies-to section, terminal corpus marker, value-conversion matrix
  tokens, claim-boundary and public-export disposition.
```

The worker return's own `## Checker Source Read-Ahead Block` then lists the
checker files and literal tokens reviewed for the artifacts being created, not
only the dispatch packet that authorized the work.

## Canonical Sources

- `docs/reference/guard_orientation/README.md`
  (Worker execution row and common checker read-ahead failure guidance)
- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
  (worker-output artifact checker-shape gotchas)
- `docs/reference/work_order_authoring/CVF_WORKER_RETURN_FULL_GATE_CONTRACT_STANDARD.md`
  (compact worker-return gate profile)
- `governance/compat/check_markdown_structural_completeness.py`
  (docType structural heading families)
- `governance/compat/check_worker_return_quality_gate.py`
  (worker-return required sections)
- `governance/compat/check_corpus_completeness_report_integrity.py`
  (corpus marker and verdict shape)
- `governance/compat/check_external_absorption_value_conversion.py`
  (value-conversion lane tokens)
- `governance/compat/check_rescan_intelligence_hardening.py`
  (rescan exact-token requirements)
- `governance/compat/check_governed_artifact_checker_read_ahead.py`
  (read-ahead block shape)

## Remediation

For any no-commit worker output, split checker read-ahead into two levels:

1. Dispatch packet compliance: confirm the baseline/work order were validly
   dispatched.
2. Output artifact compliance: read the checker source for every file the
   worker will create, by `docType`, path family, and conditional content
   class, then record the exact headings, marker strings, table labels, and
   enum tokens in the worker return before the first gate run.

Reviewers should treat a worker return that only says "the work order listed
the checkers" as incomplete read-ahead evidence. The worker must show the
literal output-artifact requirements it reviewed.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R8 worker-output checker-shape learning, 2026-07-02 |
| Working directory | repository root |
| Command or tool surface | startup reads, rg, source reads, apply_patch, governance gates |
| Target paths | this entry file; entries README; guard orientation; literal-format gotchas |
| Allowed scope source | operator-provided Claude diagnosis after MSEA-R8 worker-output gate failures |
| Before status evidence | MSEA worker outputs required reviewer repair after dispatch packets had already passed their own gates |
| After status evidence | ADIF-0023 records that output artifacts need their own docType and conditional-checker read-ahead |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect-record and artifact-authoring guidance only |
| Claim boundary | defect-record only; no checker implementation, runtime/provider/live behavior, source import, public-sync, package activation, adapter behavior, or production claim |
| Agent type | reviewer/closer |
| Invocation ID | `msea-r8-worker-output-checker-shape-learning-2026-07-02` |
| Expected manifest | this entry; entries README; guard orientation; literal-format gotchas |
| Actual changed set | this entry; entries README; guard orientation; literal-format gotchas |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry and authoring guidance. No public-sync
claim.

## Claim Boundary

This entry records a worker-output authoring pattern and points to existing
partial guard surfaces. It does not modify any checker, create a resolver
mutation, authorize source import, or assert runtime/provider/live,
public-sync, MCP/CLI adapter, package lifecycle, action authority, automatic
invocation, document-truth, extraction-accuracy, or production behavior.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a confirmed
artifact-authoring and checker-shape pattern, not an empirical provider/runtime
claim.
