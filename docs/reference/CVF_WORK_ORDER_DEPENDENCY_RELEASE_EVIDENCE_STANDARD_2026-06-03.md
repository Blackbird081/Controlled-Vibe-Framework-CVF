# CVF Work Order Dependency Release Evidence Standard

Memory class: POINTER_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-06-03

Authority: operator directive to convert repeated work-order release findings
into reusable CVF control-plane discipline

---

## Purpose

Define the reusable evidence rule for releasing dependency-gated CVF work
orders from `HOLD_*`, `DRAFT`, or prerequisite-bound states into `READY`,
`DISPATCH_READY`, `DISPATCHED`, or equivalent execution states.

This standard prevents orchestration packets from passing unresolved prose
dependencies to worker agents. A downstream worker must receive machine-readable
evidence of the upstream closure, not a memory hint that the worker is expected
to reinterpret.

---

## Scope

This standard applies to any governed CVF work order, roadmap task, dispatch
packet, review packet, implementation handoff, or tranche sequence that:

- is blocked by a previous tranche, work order, artifact, live proof, registry
  update, closure review, or operator checkpoint;
- changes status from `HOLD_*`, `DRAFT`, `PROPOSED`, or prerequisite-bound text
  into `READY`, `DISPATCH_READY`, `DISPATCHED`, or equivalent execution status;
- opens the next work order in an ordered tranche sequence;
- hands off work from an orchestrator/reviewer to another worker agent;
- uses `WORKER_MUST_NOT_COMMIT` and therefore separates worker output from
  reviewer closure.

This standard is plane-neutral. It applies across Memory, Corpus Intelligence,
Learning, Execution, Workflow, public-sync, guard-maintenance, and future CVF
planes.

---

## Required Dependency Release Evidence

Before a dependency-gated work order can be marked `READY`, `DISPATCH_READY`,
`DISPATCHED`, or equivalent, the orchestrator or reviewer must replace every
placeholder prerequisite with source-backed evidence.

Required evidence:

| Evidence field | Requirement |
| --- | --- |
| Prerequisite artifact | Cite the closed artifact path, review path, registry path, or committed source path that satisfies the dependency. |
| Closure commit | Cite the short commit hash that contains the prerequisite closure or the current dispatch anchor when the artifact is intentionally uncommitted and reviewer-owned. |
| Disposition | Use `ACCEPT`, `REJECT`, `BLOCKED_SOURCE_NOT_FOUND`, or another checker-allowed final disposition. Do not leave `REQUIRED` in a ready/dispatch packet. |
| Base anchors | Refresh `dispatchBaseHead`; set `executionBaseHead` to `WORKER_MUST_CAPTURE_AT_START` unless already captured after dispatch; keep `closureBaseHead=NOT_EXECUTED_YET` until reviewer closure. |
| Gate evidence | Rerun dispatch-quality and pre-dispatch autorun gates on the release range before handing the packet to a worker. |

The dependency evidence may appear in an Authority Chain, Source Verification
Block, Roadmap-to-Work-Order Trace Matrix, Execution Base Anchors, or dedicated
Dependency Release Evidence block. Whatever form is used, it must be explicit
enough for a machine checker and a fresh worker agent to identify the released
artifact without reading prior chat history.

---

## Forbidden Ready-State Residue

A ready or dispatch-equivalent work order must not contain unresolved
dependency placeholders such as:

- `Disposition: REQUIRED`;
- table rows whose disposition is exactly `REQUIRED`;
- `after closure`;
- `after Tn closure`;
- `<prior work order> after closure`;
- `pending prior tranche` without artifact path and commit;
- `confirm after closure`;
- `operator will confirm later`;
- stale `dispatchBaseHead` copied across unrelated commits as if it were an
  execution or closure base.

These tokens may appear only in a `HOLD_*`, `DRAFT`, `BLOCKED`, or explicit
defect note that prevents dispatch. They must not appear as acceptance criteria,
worker instructions, source verification acceptance, closure evidence, or
dispatch-ready dependency rows.

---

## Dependency Release Workflow

Use this workflow whenever a later work order was drafted before its
prerequisite closed:

1. Read the prerequisite completion artifact, roadmap row, registry update,
   and committed diff.
2. Replace placeholder dependency rows with artifact path plus closure commit.
3. Update the downstream work order status only after the evidence is present.
4. Refresh base anchors for the downstream packet.
5. Run:

```powershell
python governance/compat/check_work_order_dispatch_quality.py --base <releaseBaseHead> --head HEAD --enforce
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base <releaseBaseHead> --head HEAD
```

6. If either gate fails inside the allowed scope, repair and rerun. If repair
   exceeds scope, return the packet to orchestrator.

---

## Machine Enforcement

Primary checker:

`governance/compat/check_work_order_dispatch_quality.py`

The checker must reject ready/dispatch-equivalent work orders that retain
unresolved prerequisite dispositions or stale dependency placeholder prose.

The checker proves release-evidence discipline. It does not prove semantic
correctness of the prerequisite work, runtime behavior, live-provider proof, or
business/product readiness.

---

## Claim Boundary

This standard governs dependency-release evidence and status transitions for
CVF work orders. It does not authorize autonomous worker expansion, public-sync,
runtime route changes, live provider usage, destructive file operations, or
commit permission changes.

It turns repeated orchestration findings into a reusable control-plane rule.
It does not replace human review for semantic quality, product judgment, or
operator scope decisions.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
| --- | --- | --- | --- | --- |
| Downstream work orders can be released from HOLD while still carrying prerequisite placeholders | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | RULE_ADDED | This standard requires artifact path, closure commit, final disposition, refreshed bases, and dispatch gates before READY/DISPATCH |
| Worker agents may receive prose dependency hints instead of machine-readable upstream outputs | PHASE_GATE_PLACEMENT_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | Dispatch-quality checker rejects `REQUIRED` and stale `after closure` placeholders in ready/dispatch packets |

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this standard governs private provenance work-order orchestration,
session continuity, and internal guard behavior. Public export can be assessed
later through a public-sync batch if CVF exposes a simplified contributor
workflow.
