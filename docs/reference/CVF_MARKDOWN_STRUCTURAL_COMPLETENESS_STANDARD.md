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

Classifier precedence is part of the rule. An explicit `docType` or governed
path classification must win over subject keywords in the filename. For
example, an audit under `docs/audits/` whose filename contains `HANDOFF` is an
audit/review artifact, not an active session handoff, unless it is actually an
`AGENT_HANDOFF*.md` or archived handoff path.

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

### SOP / Operating Workflow

Required sections:

- Purpose
- Scope
- Owner Surface or Source Lineage
- Protocol, Contract, or Requirements
- Inputs and Outputs
- Role Workflow
- Standard Workflow
- Enforcement or Verification
- Boundaries or Non-Goals
- Failure Modes or Escalation Conditions
- Related Artifacts
- Claim Boundary or Final Clause

SOP files define repeatable operating procedure. They are distinct from
roadmaps because they describe the standing workflow, not one tranche plan.

### Roadmap

Required sections:

- Status
- Authorization or Decision
- Why This Tranche / Purpose
- Scope
- Non-Goals
- Design Control Gate, Dispatch Boundary, or Governed Work Lifecycle
- Work Plan
- Acceptance Criteria
- Verification or Evidence
- Claim Boundary

Roadmaps are design artifacts. A roadmap that can lead to implementation must
record the controls that prevent an agent from jumping directly from broad
intent into build. At minimum, the design-control section must identify scope,
non-goals, lane split when applicable, dependency/source-verification plan,
claim boundary, acceptance criteria, verification evidence, and
dispatch-readiness decision. Parent roadmaps with more than one lane should use
`Dispatch Boundary` to state which child GC-018/work order may proceed first
and which cross-lane claims remain forbidden.

Lifecycle/design-control details are governed by
`docs/reference/CVF_GOVERNED_WORK_LIFECYCLE_AND_DESIGN_CONTROL_STANDARD_2026-06-11.md`.

### Work Order

Required sections:

- Purpose
- Authority Chain
- Agent Roles
- Scope, Allowed Scope, or Forbidden Scope
- Required First Reads
- Pre-Flight Checks
- Roadmap-To-Work-Order Trace Matrix when roadmap-derived
- Write Ownership
- Execution Plan or Execution Rules
- Evidence Requirements
- Acceptance Criteria
- Fail Conditions when missing fields, source mismatches, ambiguous thresholds,
  public/provenance boundary errors, or forbidden runtime claims would
  invalidate the task
- Review Gate
- Closure Checklist or Completion Requirements
- Closure Quality Gate evidence when the work order is closed
- Return-To-Orchestrator Conditions
- Operator Checkpoint or `operator.checkpoint.waiver`
- Source Verification Block when the work order names runtime/source fields,
  existing symbols, schemas, receipt fields, diagnostic classes, role values,
  route states, template/pack IDs, policy enums, config keys, CLI/MCP tool
  names, or existing source paths
- Claim Boundary

Work orders are tactical execution packets, not reviews. They are mandatory
when a final roadmap delegates work to another agent or to a later session.

Operator checkpoint requirement:

```markdown
## Operator Checkpoint

Checkpoint required: [describe what the operator must confirm before
implementation proceeds].
```

For genuinely low-risk single-commit work where no human checkpoint is needed,
the work order must still declare an explicit waiver:

```markdown
operator.checkpoint.waiver: [one-sentence justification]
```

Work orders already present at adoption commit `c043fa33` are grandfathered;
new work orders after that commit must satisfy this requirement.

Source verification requirement:

```markdown
## Source Verification

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
```

This block is mandatory when source-level facts drive the work order. `ACCEPT`
requires direct source or canonical-contract verification. `REJECT` records a
bad or stale claim and the corrected symbol when known. `BLOCKED_SOURCE_NOT_FOUND`
stops dispatch and returns to Orchestrator. "Confirm later" wording does not
satisfy this requirement.

Forbidden closeout vocabulary for source facts includes `UNVERIFIED`, `TBD`,
`TODO`, `confirm field name`, and `verify during implementation`. These terms
are valid only inside an explicit blocking defect note. They are not valid
acceptance, evidence, or completion language.

Closure quality requirement:

```markdown
## Closure Quality Gate

| Gate | Evidence | Verdict |
|---|---|---|
| Roadmap-to-work-order trace matrix | <path/check> | <PASS/BLOCKED/N/A> |
| Closure diff gate | <summary/path> | <PASS/BLOCKED/N/A> |
| Claim integrity scan | <command/path> | <PASS/BLOCKED/N/A> |
| Fail-condition scan | <summary/path> | <PASS/BLOCKED/N/A> |
| Checklist finalization | <path> | <PASS/BLOCKED/N/A> |
| Continuity sync | <path/commit> | <PASS/BLOCKED/N/A> |
```

This block is mandatory for new completion packets and for work orders that
carry their own closure record. It implements
`docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`.

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

### Reference

Required sections:

- Purpose
- Scope or Applies To
- Claim Boundary, Final Clause, Verification, or Current Closure Statement

Reference documents are durable routing or canonical-information surfaces. They
must make their applicability and claim boundary explicit without being forced
into baseline or review structure.

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
