# CVF 5-Minute Trust Demo

Status: ACTIVE_GUIDE

Memory class: POINTER_RECORD

## Purpose

Provide a short operator-facing walkthrough of CVF evidence and decision
boundaries.

## Target / Source

Target: an operator evaluating a bounded CVF workflow. Source: current public
CVF work-order, continuity, evidence, review, and freeze surfaces.

## Scope / Methodology

Use one bounded work item and walk through intake, stage, evidence, review, and
freeze. Select structure-only or live proof before starting.

## Findings / Position

The demo should make authority and residual uncertainty visible. It is not a
feature tour or a performance benchmark.

## Risk / Corrective Action

The main risk is presenting static or mock evidence as live control. Name the
proof mode and stop the demo if the evidence cannot support the intended claim.

## Decision / Recommendation / Disposition

Use `STRUCTURE_ONLY` by default. Use `LIVE_GOVERNANCE` only when the operator
authorizes a live claim and credentials are available.

## Owner / Source

The operator owns proof-mode selection and freeze. The active work order and
its evidence own the demonstrated claim.

## Protocol / Contract / Requirements

The demo requires one bounded work item, explicit proof mode, visible evidence,
one residual limitation, and a separate freeze choice.

## Enforcement / Verification

Verification is command-backed for the selected work item. No dedicated demo
checker is introduced.

## Related Artifacts

- `docs/reference/public_trust/README.md`
- `docs/reference/agent_build_loop/README.md`
- `docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md`

## Goal

Show how CVF makes scope, evidence, stop authority, review, and freeze visible.
The demo is successful when the operator can explain those boundaries, not when
every product capability is exercised.

## Choose The Proof Mode

- `STRUCTURE_ONLY`: use repository documents and static commands. This mode
  demonstrates workflow shape only.
- `LIVE_GOVERNANCE`: use the required live release-gate command and valid
  operator-supplied credentials. This mode is required for claims that CVF
  controlled actual AI/provider behavior.

Never present `STRUCTURE_ONLY` as live proof.

## Minute 0-1: Intake

Open a bounded work order and identify:

- allowed and forbidden scope;
- repository and commit mode;
- risk or operator checkpoint;
- evidence required for completion.

Operator check: "I know what the agent may and may not change."

## Minute 1-2: Stage And Decision

Identify the current lifecycle stage and next allowed move from the session
front door or project-local equivalent.

Operator check: "I know where the work is and who owns the next decision."

## Minute 2-3: Build Evidence

Show one small changed set and its narrow validation. If the work selected the
optional BUILD-loop profile, show the receipt and explain that schema validity
does not prove the event occurred or the result is correct.

Operator check: "I can connect the claim to a concrete change and check."

## Minute 3-4: Review And Residual Risk

Show the diff, gate result, and one explicit limitation or unproven claim.
Confirm that failure or uncertainty can return the work to review without
forcing a freeze.

Operator check: "I can see what passed and what is still uncertain."

## Minute 4-5: Freeze Choice

Present the closure or freeze decision separately from implementation. The
operator may accept, hold, reject, or request narrower evidence.

Operator check: "I remain the decision owner and can stop the process."

## Commands

For structure-only repository evidence, choose commands appropriate to the
work item, such as:

```powershell
git diff --name-status <base>..HEAD
git status --short
```

For a release-quality live governance claim:

```powershell
python scripts/run_cvf_release_gate_bundle.py --json
```

Do not run the live command merely to complete this guide. Use it only when the
claim and operator authorization require live proof.

## Claim Boundary

Completing this demo shows that the selected evidence and decision boundaries
were presented. It does not prove production readiness, universal governance
behavior, provider parity, or improved user trust.
