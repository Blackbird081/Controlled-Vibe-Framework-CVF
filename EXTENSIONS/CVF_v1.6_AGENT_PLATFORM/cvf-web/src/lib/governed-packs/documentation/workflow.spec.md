# Workflow Spec - Documentation

Memory class: POINTER_RECORD
Status: SCHEMA-DEFINED

## Purpose

Package the existing `documentation` template as a governed workflow capability
pack for SOP, handoff, QA, and failure-recovery documentation.

## Source

- Template ID: `documentation`
- Template source: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/content.ts`
- Category: `content`
- Required role: `BUILDER`

## Intake Fields

Required:

- `subject`
- `currentNotes`
- `readerGoal`

Optional or advanced:

- `audience`
- `mustPreserve`

## Workflow

1. Intake: collect the subject, source notes, reader goal, audience, and
   preservation constraints.
2. Procedure extraction: transform rough notes into inputs, steps, decision
   branches, QA checks, recovery paths, and acceptance criteria.
3. Governance precheck: classify the request, apply DLP policy, and verify
   quota eligibility before provider execution.
4. Documentation execution: produce an SOP and handoff runbook that a
   non-expert can execute without developer internals.
5. Receipt emission: emit a receipt compatible with `receipt.schema.json`,
   including role, policy, provider lane, DLP, quota, and step traces.

## Expected Output

- What This Document Is For
- Required Inputs, Artifacts, And Fields
- Step-By-Step Procedure
- Decision Branches
- QA Checks
- Common Failure Modes And Recovery
- Final Handoff Acceptance Checklist

## Claim Boundary

This pack is schema-defined. It does not prove runtime route binding, provider
enforcement, or live governance behavior until Lane C or a later runtime tranche
wires and verifies it.

