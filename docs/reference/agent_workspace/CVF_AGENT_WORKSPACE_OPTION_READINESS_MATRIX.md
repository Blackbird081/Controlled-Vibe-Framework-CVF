# CVF Agent Workspace Option Readiness Matrix

Memory class: FULL_RECORD

Status: ACTIVE_MATRIX

docType: reference

## Purpose

Define the stable option-readiness matrix for future agent-interaction
workspace work after AHB-Tn.4. The matrix keeps workspace build, richer state
lanes, and further foundation hardening separate so future agents do not treat
"continue workspace" as implicit runtime or UI authorization.

## Scope / Target / Owner Boundary

Target: governed option readiness for future AHB workspace decisions.

Owner boundary: this matrix is foundation planning only. It does not build a
workspace, create runtime queues, edit product code, run provider/live proof,
public-sync, edit registries, or claim production/public readiness.

## Source Authority

| Source | Role |
|---|---|
| `docs/reference/agent_workspace/README.md` | stable workspace front door |
| `docs/reference/agent_workspace/CVF_AGENT_INTERACTION_WORKSPACE_DESIGN_STANDARD.md` | workspace design control block |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_TOPOLOGY_CONTRACT.md` | state units, required fields, lanes, archive policy |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` | canonical lane vocabulary and transition rules |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` | canonical generated state item template |
| `CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json` | generated active option/state view |
| `governance/compat/check_agent_workspace_state.py` | generated-state drift and topology checker |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` | runtime/read-model/queue boundary |
| `CVF_SESSION/agent_workspace/runtime_queue/README.md` | bounded runtime queue skeleton |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator-facing read-model plan |
| `governance/compat/check_agent_workspace_runtime_boundary.py` | runtime boundary guard |
| `docs/reference/CVF_AHB_T2_AGENT_HANDOFF_CONTRACT_RATIFICATION_2026-06-16.md` | central handoff contract |

## Option Matrix

| Option ID | Option | Readiness | Required next artifact | Boundary |
|---|---|---|---|---|
| AHB-Tn.5-A | Bounded workspace build surface | CLOSED_BY_AHB_TN7 | `CVF_SESSION/agent_workspace/workspace/README.md` plus skeleton checker | no runtime/UI/provider build authorized |
| AHB-Tn.5-B | Richer workspace state lanes | CLOSED_BY_AHB_TN6 | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_LANE_TAXONOMY.md` plus checker hardening | no runtime queue authorized |
| AHB-Tn.5-C | Further foundation hardening | CLOSED_BY_AHB_TN6 | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_STATE_ITEM_TEMPLATE.json` plus front-door/checker hardening | no open-ended hardening authorized |
| AHB-Tn.8 | Runtime expansion readiness contract | CLOSED_PASS_BOUNDED | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_RUNTIME_EXPANSION_READINESS_CONTRACT.md` plus runtime boundary checker | no executable runtime authorized |
| AHB-Tn.9 | Minimal runtime queue skeleton | CLOSED_PASS_BOUNDED | `CVF_SESSION/agent_workspace/runtime_queue/README.md` plus queue-family index | no queue records, scheduler, provider call, or worker daemon authorized |
| AHB-Tn.10 | Operator-facing workspace view plan | CLOSED_PASS_BOUNDED | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | no UI implementation authorized |

## Option Selection Rules

1. Select AHB-Tn.5-A only when the operator explicitly wants a usable
   workspace surface and accepts a fresh build work order.
2. Select AHB-Tn.5-B only when the current generated state vocabulary is too
   small for the next governed workflow and the work remains state-only.
3. Select AHB-Tn.5-C only when a new AHB finding shows the foundation is not
   yet enforceable by documentation, checker, hook, or session-sync controls.
4. Do not combine build, richer lanes, provider proof, public-sync, registry
   edit, and runtime mutation in one tranche unless a later GC-018 explicitly
   authorizes that combined shape.
5. Keep provider-local memory out of option evidence. Reusable lessons must
   land in CVF-governed artifacts and, when repeated, machine checks.

## Active Workspace State Mapping

| Workspace item | Option | Status |
|---|---|---|
| `ahb-tn5-workspace-build-option-parked-2026-06-17` | AHB-Tn.5-A | CLOSED_PASS_BOUNDED by AHB-Tn.7 |
| `ahb-tn5-richer-state-lanes-option-parked-2026-06-17` | AHB-Tn.5-B | CLOSED_PASS_BOUNDED by AHB-Tn.6 |
| `ahb-tn5-foundation-hardening-option-parked-2026-06-17` | AHB-Tn.5-C | CLOSED_PASS_BOUNDED by AHB-Tn.6 |
| `ahb-tn6-workspace-foundation-readiness-bundle-closed-2026-06-17` | AHB-Tn.5-B + AHB-Tn.5-C | CLOSED_PASS_BOUNDED |
| `ahb-tn7-bounded-workspace-build-skeleton-closed-2026-06-17` | AHB-Tn.5-A | CLOSED_PASS_BOUNDED |
| `ahb-tn8-runtime-expansion-readiness-contract-closed-2026-06-17` | AHB-Tn.8 | CLOSED_PASS_BOUNDED |
| `ahb-tn9-minimal-runtime-queue-skeleton-closed-2026-06-17` | AHB-Tn.9 | CLOSED_PASS_BOUNDED |
| `ahb-tn10-operator-facing-workspace-view-plan-closed-2026-06-17` | AHB-Tn.10 | CLOSED_PASS_BOUNDED |

## Minimum Future Work Order Requirements

Any future work order selecting an option from this matrix must include:

- Agent Handoff Contract Control Block;
- Agent Workspace Design Control Block;
- source verification for every existing path, field, status, route token, and
  checker named by the selected option;
- generated workspace state update plan when the option changes active
  workspace state;
- Runtime Expansion Control Block when the option touches runtime/read-model
  or queue scope;
- explicit no-provider/no-public/no-registry/no-production boundary unless the
  fresh GC-018 authorizes otherwise;
- archive policy for superseded active workspace state items.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workspace foundation. No public-sync batch is
authorized.

## Claim Boundary

This matrix prepares options only. It does not select an option, dispatch a
future worker, build the workspace, mutate runtime/product code, run provider
proof, public-sync, edit registries, or claim production/public readiness.
