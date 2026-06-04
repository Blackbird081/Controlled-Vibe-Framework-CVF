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

Public-source review must also follow
`docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md`. Route
files, CI badges, demo data, and documentation-only connector specs are not
governance proof unless a public evidence path or live release-gate boundary
explicitly supports the claim.

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

## Governance Kernel Coherence

As of the 2026-05-22 public-safe A2 readout, CVF treats governance-kernel
coherence as audit-equivalent for the current public orientation baseline.
Public readers should use the existing owner surfaces instead of expecting a
new standalone kernel-law packet:

- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/runtime-workflow.contract.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/orchestrator.contract.ts`
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/policy-decision.contract.ts`

Read
`docs/reference/CVF_PUBLIC_GOVERNANCE_KERNEL_COHERENCE_2026-05-22.md` before
adding kernel-law, runtime-authority, execution-state, or core-ontology docs.
This posture does not lift any freeze and does not claim new runtime,
provider, tool, database, or subagent coverage.

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

Static CI and public-surface checks are useful public hygiene gates, but they
do not consume provider secrets and do not replace the protected live release
gate.

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

## External Review Boundary

External reviewers should classify public source routes and connector specs by
their cited evidence status. If a route exists but no public evidence path names
that route or surface, the correct public finding is `coverage not proven`, not
`governed` and not `production-ready`.
