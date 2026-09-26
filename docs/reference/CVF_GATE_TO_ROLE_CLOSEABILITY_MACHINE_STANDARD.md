# CVF Gate-To-Role Closeability Machine Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

## Purpose

Prevent an agent from receiving or repeating a governed assignment whose
declared gates, mutation surfaces, roles, phases, dependencies, and commit
owners cannot lawfully reach the required terminal state. This converts
ADIF-0057 into an early structural interlock while preserving the agent's
freedom to choose ordinary implementation details.

## Scope / Applies To

This standard applies prospectively to changed active work orders, changed
self-declared worker returns, and changed completion reviews. It governs
repository packet declarations and configured CVF gates/hooks. It does not
infer architecture, widen authority, prove comprehension, or intercept tools
that bypass the repository workflow.

## Work Order Requirement

Every changed executable work order must include a `Gate-To-Role Closeability
Contract` using `cvf.gate-role-closeability@1.0.0`. Its graph maps every
mandatory gate through authorization, dispatch, post-dispatch continuity,
implementation, return, review, pre-commit, committed-range closure, and
terminal continuity.

Each row declares:

- the gate identifier and pass deadline;
- the legitimate repair owner and latest repair phase;
- the complete mutation surface and topology class;
- the commit owner and commit phase; and
- predecessor gate identifiers.

GC-020 ordering is mandatory after a material commit: terminal completion
review authorizes continuity; the session-sync steward records the real
material SHA in a dedicated continuity commit; only then may the reviewer run
clean, split-range committed closure. A graph that places committed-range
closure before continuity is uncloseable because pre-closure requires both a
clean worktree and current active-handoff evidence.

The graph must be acyclic. A repair phase cannot occur later than the pass
deadline. Mutating rows cannot omit repair, mutation, or commit ownership.
Dependencies must name graph rows. The implementation topology declaration
must either cover foreseeable file splits through bounded path families or
truthfully state that no split is foreseeable within an enforced size budget.
Protected and authority-bearing paths remain subject to their stricter exact
authorization rules.

## Return-Time Requirement

Every changed self-declared worker return and completion review must include a
`Return-Time Closeability Recheck` before another repair dispatch. A closeable
packet names no outside-authority blocker. An uncloseable packet names the
blocker, forbids worker redispatch, and selects one controlled route:
reviewer-local repair, consolidated orchestrator amendment, or operator
escalation. Top-level status and the recheck must agree: a return declaring
`COMPLETE_PENDING_REVIEW` must be `CLOSEABLE` with
`outsideAuthorityBlockers: NONE`; an
`UNCLOSEABLE_PACKET_CONTRADICTION` return must declare
`Status: BLOCKED_WITH_REASON`. Independent implementation defects remain
separate findings.

## Machine Enforcement

`governance/compat/check_gate_to_role_closeability.py` enforces the contract.
It is bound to common autorun phases, reviewer-fast, and pre-commit catalogs.
Focused tests cover missing contracts/gates/owners, late repair authority,
unknown dependencies, cycles, topology mismatch, contradictory redispatch,
and top-level status/recheck contradictions.

For an operator-local downstream repository, invoke the materialized checker
with `--repo-root <downstream-project-root>`. The checker resolves Git diffs
and artifact reads inside that explicit worktree. A rule-pack refresh or source
commit pin without this invocation is provenance synchronization only and must
not be reported as downstream machine enforcement.

Machine enforcement validates declared responsibility topology only. It does
not certify that prose describes reality outside the repository, guarantee
every tool invokes CVF, or restrict implementation choices within the
authorized outcome/risk/path envelope.

## Failure And Repair Route

On failure, stop the current dispatch or redispatch. Correct packet topology
inside existing authority when possible. Ask the operator only when business
intent, authority, risk, external effect, irreversible action, budget, or claim
ceiling must change. Diagnostic text must be stable and secret-safe.

## Core Guard Self-Protection Authorization

Authorized guard-maintenance scope: establish the canonical ADIF-0057
closeability contract and bind its checker through the exact protected paths
authorized by ADIF-0057-MH-T1.

Protected paths:

- `governance/compat/check_gate_to_role_closeability.py`
- `governance/compat/test_check_gate_to_role_closeability.py`
- `governance/compat/agent_autorun_command_catalog.py`
- `governance/compat/local_governance_hook_catalog_pre_commit.py`
- `governance/compat/local_governance_hook_catalog_reviewer_fast.py`
- `governance/compat/test_run_local_governance_hook_chain.py`
- `workspace_overlay_catalog.json`
- `AGENTS.md`

Operator authorization: explicit 2026-09-10 instruction to raise ADIF-0057
from `PARTIAL_CHECK` to machine enforcement for governed agent paths, followed
by explicit approval to refresh that enforcement into the operator-local
`shift-operations-workspace` project.

Rollback boundary: revert only ADIF-0057-MH-T1; preserve its dispatch-control
commit, the original P4-E learning, and all unrelated Core history.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | implementation worker role |
| Provider or surface | local private provenance workspace |
| Session or invocation | ADIF-0057-MH-T1 implementation 2026-09-10 |
| Working directory | repository root |
| Command or tool surface | source reads, apply_patch, focused tests and governed gates |
| Target paths | standard, checker, tests, catalogs, router, ADIF entry and review artifacts |
| Allowed scope source | accepted ADIF-0057-MH-T1 baseline/work order/authorization review |
| Before status evidence | ADIF-0057 was PARTIAL_CHECK and no dedicated closeability checker existed |
| After status evidence | declaration checker and configured repository bindings exist, pending completion review |
| Diff evidence | exact worker manifest reported in worker return |
| Approval boundary | static repository governance only |
| Claim boundary | no runtime interception or agent comprehension claim |
| Agent type | implementation worker |
| Invocation ID | `adif-0057-mh-t1-standard-2026-09-10` |
| Expected manifest | ADIF-0057-MH-T1 exact worker manifest |
| Actual changed set | recorded in worker return |
| Manifest delta | pending worker return verification |

## Epistemic Process Block

### Expected Result / Prediction

A valid acyclic responsibility graph should pass, while missing owners,
late repair authority, invalid dependencies, and contradictory redispatch
should fail before further implementation or closure work.

### Evidence Comparison

Focused positive and negative cases exercise those boundaries, and the checker
is present in the common autorun, reviewer-fast, and pre-commit catalogs.

### Contradiction Or Gap Disposition

The dispatch packet's initially omitted continuity edge was treated as a
blocking packet defect and added to both the graph and mandatory gate set.
Post-material execution then exposed a second contradiction: pre-closure
requires current GC-020 evidence and a clean worktree. The graph and checker
therefore require the real-SHA continuity commit before split-range closure.

### Claim Update

Configured repository gates now machine-check declared closeability topology;
unconfigured or out-of-band execution remains outside the claim.

## Claim Boundary

This standard makes declared closeability machine-checked at configured CVF
repository gates. It does not control ungoverned out-of-band activity, dictate
code architecture, or authorize runtime, provider/live, public, deployment,
push, or production effects.
