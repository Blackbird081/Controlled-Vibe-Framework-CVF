# Governance

Memory class: POINTER_RECORD

Status: CURRENT PUBLIC GOVERNANCE SUMMARY

CVF governance is the rule layer around AI and agent execution.

## Purpose

Summarize the public governance behaviors CVF claims, the live-proof rule for
those claims, and the evidence policy for public documentation.

## Scope

This file is the high-level governance entry point. Detailed provider lanes,
claim boundaries, evidence summaries, and local deployment instructions live in
the linked public docs.

## Claim Boundary

Release-quality claims about governance behavior require a real provider API
call. Mock mode may support UI structure checks only when no AI governance
behavior is being asserted.

## Governed Behaviors

The active governance surface includes:

- request intake and classification
- phase gates
- risk levels
- approval requirements
- DLP and redaction
- provider routing
- bypass detection
- output validation
- evidence receipt creation
- audit trail updates
- cost/quota signals

## Live-Proof Rule

Any release-quality claim about governance behavior requires a real provider API
call.

Required command:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

Mock mode is only valid for UI structure checks such as layout, navigation,
static badges, and RBAC pages when those checks do not assert AI governance
behavior.

## Release Gate

The release gate checks:

- web build
- guard-contract typecheck
- provider readiness
- secret scan
- required reference docs
- UI mock E2E
- live governance E2E

The live E2E portion requires a DashScope-compatible key through environment
variables. Raw key values must never be printed or committed.

## Public Evidence Policy

Public evidence is summary-first. Raw operating logs, handoffs, rebuttals, and
internal wave packets belong in provenance storage.

Evidence summaries must state:

- date
- command or hosted run
- provider lane
- pass/fail status
- scope boundary
- provenance pointer when raw proof exists elsewhere
