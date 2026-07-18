# CVF Governed Work Lifecycle And Design Control Standard

Memory class: POINTER_RECORD

Status: canonical design-control standard for governed agent workflows.

docType: reference

Date: 2026-06-11

## Purpose

This standard turns the public CVF lifecycle shorthand into an internal control
model for orchestrators, reviewers, and worker agents.

The public shorthand is:

```text
INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE
```

For governed work, CVF must expand that shorthand before implementation so an
agent cannot jump from a broad request directly into build.

## Scope

This standard applies to new or materially revised governed artifacts that:

- intake operator requests or external information;
- create or revise roadmaps;
- create specs, contracts, or machine-readable semantics;
- dispatch work orders;
- implement runtime/source/doc changes through worker agents;
- review, close, or sync governed work.

It is especially binding when a roadmap mixes more than one lane, such as a
scan-layer lane and a retrieval-governance lane.

## Lifecycle Map

Governed work follows this expanded map:

```text
INTAKE
  -> request capture
  -> source/context intake
  -> authority, risk, and domain classification
  -> ambiguity ledger

DESIGN
  -> scope boundary
  -> non-goals
  -> lane split
  -> dependency and source-verification plan
  -> claim boundary
  -> acceptance criteria
  -> dispatch-readiness decision

SPEC
  -> contract, schema, or interface
  -> machine-readable semantics
  -> invariants and failure tokens
  -> evidence requirements

WORK ORDER
  -> allowed paths and forbidden paths
  -> source verification table
  -> implementation steps
  -> test plan
  -> worker return schema
  -> commit authority boundary

BUILD
  -> implementation
  -> focused tests
  -> local gates
  -> artifact production

REVIEW
  -> diff gate
  -> roadmap-to-work-order trace
  -> acceptance matrix
  -> finding-to-governance disposition
  -> closure decision

FREEZE
  -> commit
  -> session or handoff sync
  -> public export disposition
  -> next allowed move
```

## Design Control Gate

Before a roadmap can authorize a work order, it must include a design-control
block or equivalent sections that answer:

- what operator or source authority exists;
- what is in scope;
- what is out of scope;
- which lanes are separate and why;
- which dependency or source facts must be verified before dispatch;
- what claims are forbidden until later evidence exists;
- what acceptance criteria must be observable;
- what evidence or gate output is required before dispatch.

If the roadmap is a parent roadmap with multiple lanes, it must also include a
dispatch boundary. The dispatch boundary states which child lane may proceed
first, what child GC-018/work order is required, and what cross-lane claims are
forbidden until an explicit integration tranche exists.

## Spec And Work-Order Separation

Roadmaps are design artifacts. They may define sequence and decision boundaries,
but they must not silently become implementation orders.

If implementation depends on a contract, schema, field, enum, CLI, MCP tool,
receipt key, failure token, or machine-readable semantics, the spec/contract
surface must exist before the work order instructs a worker to build against it.

Work orders translate locked design and spec decisions into bounded execution.
They must not ask workers to resolve roadmap ambiguity as part of build unless
the assigned task is explicitly a source-verification or design-audit task.

## Enforcement

The primary enforcement path is GC-045 structural completeness:

- standard: `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- checker: `governance/compat/check_markdown_structural_completeness.py`

For new roadmap files, the structural gate must require either:

- `## Design Control Gate`
- `## Dispatch Boundary`
- `## Governed Work Lifecycle`

This does not prove roadmap quality by itself. It prevents the most common
failure mode: a roadmap that names implementation work without recording the
design controls needed before dispatch.

## Related Artifacts

- `docs/reference/CVF_AGENT_EXECUTION_WORKFLOW_SOP_2026-05-19.md`
- `docs/reference/CVF_AGENT_WORK_ORDER_TEMPLATE_2026-05-19.md`
- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `docs/reference/CVF_WORK_ORDER_CLOSURE_QUALITY_GATE_STANDARD_2026-05-28.md`
- `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md`

## Claim Boundary

This standard is a design-control and documentation-quality rule. It does not
implement runtime orchestration, provider routing, automatic design review,
autonomous roadmap mutation, public readiness, production readiness, or live
governance proof.
