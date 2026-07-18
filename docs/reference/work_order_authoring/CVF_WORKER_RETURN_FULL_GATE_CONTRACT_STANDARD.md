# CVF Worker Return Full Gate Contract Standard

Memory class: governed-reference-standard

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

## Purpose

Defines the compact work-order contract for `WORKER_MUST_NOT_COMMIT`
dispatches. The work order carries a short profile token; helper scaffolds and
machine gates carry the detailed worker-return shape.

## Scope / Applies To

Applies to governed work-order authoring, dispatch scaffold output, and
dispatch-quality validation for no-commit worker-return handoffs.

## Scope / Target / Owner Boundary

Target: CVF governed work-order authoring shape.

Owner: governance authoring helpers and dispatch-quality checkers.

Boundary: does not authorize worker execution, runtime/provider/live proof,
public-sync, package lifecycle, Web/UI/dashboard, MCP/CLI adapter,
model-router, action-authority, automatic invocation, or production behavior.

## Compact Contract

Use this block in no-commit work orders:

```text
## Worker Return Packet Shape Contract

contractProfile: WORKER_RETURN_FULL_GATE_V1
requiredGate: `python governance/compat/run_worker_return_fast_gate.py`
individualCheckerSubstitution: FORBIDDEN
workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED
```

## Fast Doc Contract

Use the lighter profile only when the dispatching GC-018 and work order make
the eligibility decision before worker execution:

```text
## Worker Return Packet Shape Contract

contractProfile: WORKER_RETURN_FAST_DOC_V1
scopeClassification: DOCUMENTATION_AND_EVIDENCE_ONLY_NO_COMMIT
requiredGate: `python governance/compat/run_worker_return_fast_gate.py`
individualCheckerSubstitution: FORBIDDEN
workerReturnSkeleton: CHECKER_SAFE_SKELETON_REQUIRED
publicSyncDisposition: FORBIDDEN
liveRuntimeDisposition: FORBIDDEN
checkerMutationDisposition: FORBIDDEN
workerSelfSelection: FORBIDDEN
```

Eligibility also requires `Commit mode: WORKER_MUST_NOT_COMMIT`. The profile
may consolidate only EKI, RIH, and CCRI conditional controls into:

```text
## Conditional Controls Disposition
conditionalControlsDisposition: EKI_NA; RIH_NA; CCRI_NA
```

The worker-return checker resolves `dispatchWorkOrder` and rejects compact
self-selection, missing work-order evidence, or any missing protected
worker-return heading or token.

`## Verification Commands` must also include:

```powershell
python governance/compat/run_worker_return_fast_gate.py
```

## Rationale

Work orders should not repeat the full worker-return checker inventory. The
full inventory changes at the checker/helper layer, so the dispatch packet
should name the stable contract profile and required gate instead of asking the
worker to reconcile a long prose list.

## Enforcement

`governance/compat/check_work_order_dispatch_quality.py` enforces the compact
contract for dispatch-ready `WORKER_MUST_NOT_COMMIT` work orders.

`governance/compat/build_dispatch_packet_scaffold.py` emits the compact block
for generated no-commit work orders.

`governance/compat/build_worker_return_skeleton_scaffold.py` and
`governance/compat/run_worker_return_scaffold.py` carry the detailed
worker-return section shape.

`run_worker_return_scaffold.py --profile WORKER_RETURN_FAST_DOC_V1` emits the
compact conditional-control shape. The default remains the full profile.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex |
| Provider or surface | local workspace tools |
| Session or invocation | compact worker-return gate hardening, 2026-07-02 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | `apply_patch`; focused unit tests; governance gates |
| Target paths | this standard plus helper, checker, fixture, test, and reference updates listed in the paired review |
| Allowed scope source | operator-approved compact work-order standard hardening |
| Before status evidence | clean worktree at HEAD `1b60fa67` before edits |
| After status evidence | changed set recorded in paired review artifact before commit |
| Diff evidence | `git diff --name-status` |
| Approval boundary | bounded authoring/scaffold/checker hardening only |
| Claim boundary | compact work-order contract standard only |
| Agent type | implementation/reviewer |
| Invocation ID | `work-order-compact-worker-return-gate-2026-07-02` |
| Expected manifest | paired review artifact changed manifest |
| Actual changed set | paired review artifact changed manifest |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in this batch |

## Claim Boundary

This is an authoring and checker-shape standard only. It does not implement or
claim runtime, provider, live-proof, public-sync, package, Web, MCP/CLI,
model-router, action-authority, automatic-invocation, or production behavior.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private governance-control reference standard; no public-sync artifact
is created by this tranche.
