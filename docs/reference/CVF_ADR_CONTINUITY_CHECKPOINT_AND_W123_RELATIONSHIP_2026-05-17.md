Memory class: SUMMARY_RECORD

# ADR: Continuity Checkpoint And W123 Relationship

Date: 2026-05-17

Status: ACCEPTED LOCALLY.

## Purpose

Document the relationship between ADD-C1 `ContinuityCheckpoint` and W123
execution continuity.

## Context

W123 already proved noncoder iteration memory and follow-up continuity through
web execution chain fields such as `threadId`, `rootExecutionId`,
`parentExecutionId`, project labels, knowledge collection IDs, receipt
snapshots, and follow-up CTAs. ADD-C1 provides a shared checkpoint record shape
for long-running agent work, roadmap closure, and handoff continuity.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Read-only audit references:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/execution-continuity.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/types/index.ts`
- W123 summary in `AGENT_HANDOFF_V7_2026-05-16.md`

## Decision

W123 owns execution continuity. C1 (`ContinuityCheckpoint`) owns the record
shape. W123 files are the canonical consumers.

The read-only audit found conceptual alignment: W123 stores root/parent/thread
identity, evidence receipt snapshots, project/knowledge context, and follow-up
continuation metadata. C1 standardizes a related checkpoint vocabulary for
closed decisions, open items, artifact memory, reinjection policy, and evidence
receipt IDs without retrofitting W123 files.

## Alternatives

- Make C1 the new execution continuity engine. Rejected because W123 already
  owns execution continuity.
- Retroactively rewrite W123 records. Rejected because Step 10a is schema
  standardization only.
- Keep checkpoint records free-form. Rejected because the deferred item calls
  for a shared typed vocabulary.

## Gate / Boundary

The implementation gate is CPF test and typecheck coverage. The boundary is:
C1 validates a checkpoint record shape; it does not resume sessions, write
runtime checkpoints, or alter W123 behavior.

## Consequences

- Future continuity records can use one typed schema.
- W123 remains the execution-continuity owner.
- Roadmap closure and agent handoff records can reference evidence receipts and
  artifact memory consistently.

## Claim Boundary

Schema standard only. No checkpoint runtime, session resume engine, release
gate change, or GA posture change is introduced.

## Verification

Verified through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/continuity.checkpoint.contract.test.ts`
- `npm test`
- `npm run check`
