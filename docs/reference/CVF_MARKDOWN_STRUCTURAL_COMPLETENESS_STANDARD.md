# CVF Markdown Structural Completeness Standard

Memory class: POINTER_RECORD

Status: canonical structural completeness standard for governed Markdown files.

## Purpose

- make CVF documents professional, scannable, and easy for humans and agents to
  evaluate
- prevent new governed Markdown files from becoming unstructured narrative
- complement `GC-032` source-truth writing with a mandatory document outline
  standard

## Scope

This standard applies to new governed Markdown files in:

- `docs/`
- `governance/toolkit/`
- `AGENT_HANDOFF*.md`
- repository-root `CVF_*.md`

Legacy dense documents are not retroactively blocked. When a legacy document is
materially rewritten, split, or promoted, it should be migrated into the
appropriate structure.

## Rule

New governed Markdown must be structurally complete for its artifact type before
it can enter CVF canon.

## Requirements

Authors must choose the closest artifact type and include the common required
elements plus that type's required sections.

When a file intentionally mixes artifact types, it must satisfy the stricter
section set for the highest-risk role it performs.

## Exceptions

Legacy dense documents are grandfathered until a material rewrite, split, or
promotion. A new file may deviate from exact section names only when equivalent
meaning is explicit and reviewable.

## Common Required Elements

Every new governed Markdown file must include:

- one H1 title
- `Memory class`
- `Status`
- `Purpose`
- a clear scope, target, or owner boundary
- a claim boundary, final clause, invariant, or verification boundary

The exact section names may vary when the meaning is obvious. For example,
`Applies To` can satisfy scope, and `Final Clause` can satisfy claim boundary.

## Artifact Type Templates

### Contract

Required sections:

- Purpose
- Scope
- Core Principle
- Allowed or Authorized Actions
- Forbidden Actions
- Requirement or Rule
- Exception Path
- Violation Conditions
- Audit or Evidence Requirements
- Mapping, Related Artifacts, or Owner Surface
- Invariant or Final Clause

### Spec

Required sections:

- Purpose
- Scope
- Owner Surface or Source Lineage
- Protocol, Contract, or Requirements
- Inputs and Outputs when applicable
- Enforcement or Verification
- Boundaries or Non-Goals
- Related Artifacts
- Claim Boundary or Final Clause

### Policy

Required sections:

- Purpose
- Applies To or Scope
- Rule
- Allowed / Forbidden or Requirements
- Exceptions
- Enforcement Surface
- Related Artifacts
- Final Clause

### Roadmap

Required sections:

- Status
- Authorization or Decision
- Why This Tranche / Purpose
- Scope
- Non-Goals
- Work Plan
- Acceptance Criteria
- Verification or Evidence
- Claim Boundary

### Review / Rebuttal / Response

Required sections:

- Status
- Target or Source Under Review
- Scope or Methodology
- Findings or Position
- Risk / Defect / Corrective Action when applicable
- Decision / Recommendation / Disposition
- Claim Boundary

### Baseline / Evidence / Authorization

Required sections:

- Status
- Source or Predecessor Evidence
- Purpose / Decision / Baseline
- Scope or Proposed Tranche when applicable
- Evidence / Required Evidence / Verification
- Claim Boundary or Approval Gate

### ADR

Required sections:

- Status
- Context
- Decision
- Alternatives
- Consequences
- Finalization Gate, Verification, or Claim Boundary

### Handoff

Required sections:

- Status
- Active Boundary
- Latest Completed Work or Changes
- Current Blockers or Scope Locks when applicable
- Next Action or Approval Gate

## Enforcement Rule

New governed Markdown files must satisfy the common required elements and the
template for their artifact type. If a document intentionally does not fit any
template, it must declare why and include enough structure for a reviewer to
understand purpose, scope, authority, evidence, and boundary within two minutes.

## Enforcement Surface

Structural completeness is enforced by:

- `governance/compat/check_markdown_structural_completeness.py`
- local pre-commit and pre-push hook chains
- documentation CI

## Relationship To GC-032

`GC-032` asks whether the document tells the truth from source evidence.

`GC-045` asks whether the document is structurally complete enough for humans
and agents to evaluate that truth efficiently.

Both are mandatory.

## Related Artifacts

- `governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`

## Final Clause

A governed CVF document is not complete merely because it contains correct
information. It must also expose its purpose, scope, authority, evidence, and
boundary clearly enough that another human or agent can review it without
reconstructing the missing outline.
