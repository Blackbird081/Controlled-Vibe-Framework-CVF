# CVF Reference Governed Loop

Status: canonical reference helper for demonstrating one governed execution path end to end.

## Purpose

- provide one repeatable coder-facing demo path for the canonical controlled loop
- turn the roadmap claim "there is at least one governed execution reference path" into an executable SDK artifact
- give future audits a stable example to compare against

## What It Runs

`CvfSdk.runReferenceGovernedLoop()` executes a reference workflow that:

1. performs a guard check
2. creates a governed pipeline
3. records `PLAN`
4. advances through `INTAKE -> DESIGN -> BUILD`
5. handles approval checkpoints when configured or required by risk
6. records `EXECUTION`
7. advances to `REVIEW`
8. records `REVIEW`
9. advances to `FREEZE`
10. records `FREEZE`
11. completes the pipeline
12. validates a skill receipt
13. emits a deterministic checkpoint receipt

## Example

```ts
import { CvfSdk } from '../EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/index.js';

const cvf = CvfSdk.create();

const result = await cvf.runReferenceGovernedLoop({
  intent: 'Deliver a governed execution demo',
  riskLevel: 'R2',
  requireApproval: true,
  fileScope: ['src/features/demo.ts'],
  targetFiles: ['src/features/demo.ts'],
  reviewerId: 'governor-1',
});
```

Expected result characteristics:

- `success === true`
- `workflowStatus === COMPLETED`
- `pipelineStatus === COMPLETED`
- `freezeReceipt` is present
- `checkpointId` is present
- `approvalCheckpointId` is present when approval is required
- a valid `ai_commit` is supplied automatically for the reference modifying action if the caller does not provide one
- required audit metadata such as `traceHash` is supplied automatically for elevated-risk reference runs

## Why This Matters

- it gives CVF one explicit governed reference path for coder-facing execution
- it reduces reliance on scattered tests as the only proof that the controlled loop is coherent
- it creates a reusable anchor for future Web, demo, or release-readiness evidence
