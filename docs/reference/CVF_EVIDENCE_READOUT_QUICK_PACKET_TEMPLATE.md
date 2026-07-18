# CVF Evidence Readout Quick Packet Template

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference_template

## Purpose

Provide a reusable one-page evidence/readout packet template for future agents
and operators who need a compact current-state answer without rereading every
recent roadmap, GC-018, work order, and completion packet first.

## Scope / Target / Owner Boundary

Target: manual, read-only evidence/readout packet assembly.

Owner boundary: this reference defines fields, source order, and claim
boundaries for a quick packet. It does not create a dashboard, checker,
runtime queue, MCP or CLI command, IDE bridge, provider proof, public-sync,
resolver behavior, adapter behavior, package activation, certification
decision, generated workspace state mutation, or DICE work.

## Source Authority

| Source | Role |
|---|---|
| `CVF_SESSION_MEMORY.md` | active front door, mode, next move, and parked checkpoint |
| `AGENT_HANDOFF_V23_2026-06-26.md` | active handoff and parked boundaries |
| `docs/reference/CVF_EVIDENCE_READOUT_FRICTION_REDUCTION_DECISION.md` | evidence/readout source-selection decision |
| `docs/reviews/CVF_EFRD_T0_T4_EVIDENCE_READOUT_FRICTION_REDUCTION_DECISION_COMPLETION_2026-06-27.md` | quick-packet next-control recommendation |
| `docs/reviews/CVF_WORKFLOW_VALUE_PROOF_T0_T4_COMPLETION_2026-06-27.md` | friction and value proof |
| `docs/reference/agent_workspace/CVF_LOCAL_WORKSPACE_PROJECTION_READ_MODEL_DECISION.md` | required-evidence and closure-readiness field precedent |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | current-mode, guard-status, and next-move section precedent |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| Current next allowed move authorizes an optional EVIDENCE_READOUT_QUICK_PACKET non-runtime template lane | `CVF_SESSION_MEMORY.md` | Next Allowed Move | `evidence_readout_friction_decision_closed_pass_bounded_pending_quick_packet_or_foundation_selection` | active session front door | ACCEPT |
| EFRD reference recommends a reusable non-runtime quick-packet lane | `docs/reference/CVF_EVIDENCE_READOUT_FRICTION_REDUCTION_DECISION.md` | Next-Control Recommendation | `EVIDENCE_READOUT_QUICK_PACKET` | EFRD decision reference | ACCEPT |
| EFRD completion says the next lane should remain optional and small | `docs/reviews/CVF_EFRD_T0_T4_EVIDENCE_READOUT_FRICTION_REDUCTION_DECISION_COMPLETION_2026-06-27.md` | Next-Control Recommendation | `EVIDENCE_READOUT_QUICK_PACKET` | EFRD completion review | ACCEPT |
| Read-model decision maps required evidence and closure readiness to governed sources | `docs/reference/agent_workspace/CVF_LOCAL_WORKSPACE_PROJECTION_READ_MODEL_DECISION.md` | Projection Sections | `requiredEvidence`; `closureReadiness` | local workspace projection read model | ACCEPT |
| Operator view plan defines current-mode, guard-status, and next-move sections | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | Read Model Sections | `Current Mode`; `Guard Status`; `Next Move` | operator view plan | ACCEPT |

## Quick Packet Template

Use this packet shape when the operator asks for current evidence/readout state
and no fresh implementation is needed.

```text
Evidence Readout Quick Packet

Mode:
- currentMode:
- activeHandoff:
- nextAllowedMove:

Latest closure:
- work:
- materialCommit:
- sessionSyncCommit:
- disposition:

Evidence:
- primarySource:
- supportingSources:
- gateOrReceipt:

Boundaries:
- allowedNow:
- parkedCheckpoint:
- forbiddenScope:

Next action:
- nextAllowedMove:
- requiresFreshWorkOrder:
```

## Field Source Matrix

| Packet field | Required source | Required value discipline |
|---|---|---|
| `currentMode` | `CVF_SESSION_MEMORY.md`; `CVF_SESSION/ACTIVE_SESSION_STATE.json` | copy current mode token exactly |
| `activeHandoff` | active state registry | use the bare active handoff filename |
| `nextAllowedMove` | `CVF_SESSION_MEMORY.md`; active state registry | summarize only the current allowed move |
| `work` | front door latest closed work or completion review | name one work item, not a broad history |
| `materialCommit` | completion review or git log | use short SHA only after command/source verification |
| `sessionSyncCommit` | git log or active state/handoff if present | use `N/A with reason` when not applicable |
| `disposition` | completion review status | copy the closed/pass token exactly |
| `primarySource` | EFRD readout question matrix or completion review | cite one first source |
| `supportingSources` | EFRD reference, WVP review, workspace read-model references | list only sources actually read |
| `gateOrReceipt` | completion review, work order gate section, or receipt | name command plus result; do not infer PASS |
| `allowedNow` | active next allowed move | one action only |
| `parkedCheckpoint` | front door parked checkpoint | preserve DICE or other parked item exactly |
| `forbiddenScope` | active handoff and claim boundary | include runtime/provider/public/adapter/generated-state limits |
| `requiresFreshWorkOrder` | active next allowed move or work-order boundary | `YES` unless the current work order already authorizes execution |

## Question Routing

| Operator question | Fill these packet fields first | First source |
|---|---|---|
| What mode are we in? | `currentMode`; `activeHandoff`; `nextAllowedMove` | front door |
| What just closed? | `work`; `materialCommit`; `disposition` | latest completion review |
| What evidence backs this? | `primarySource`; `gateOrReceipt` | EFRD matrix or completion review |
| What is still forbidden? | `forbiddenScope`; `parkedCheckpoint` | active handoff |
| What can happen next? | `allowedNow`; `requiresFreshWorkOrder` | active next allowed move |

## Use Rule

Use this template for manual readout assembly only. If the requested answer
would require creating or changing runtime state, a UI, a checker, a CLI/MCP
surface, an IDE bridge, provider/live proof, public-sync, package lifecycle
state, generated workspace state, resolver behavior, adapter behavior, or DICE
work, stop and open fresh GC-018/source-verified authorization first.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this template reference | internal agents may use it for manual quick-packet assembly only | source verification rows | N/A with reason: no adapter created | CONTRACT_ONLY |
| `EXTERNAL_AGENT_CLI_MCP` | future readout support remains deferred | no executable external-agent support | claim boundary | deferred adapter owner; fresh GC-018 required | DEFERRED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | operator continuation is authorization context only; source facts are re-verified against CVF-governed surfaces |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | governed reference template surface |
| Disposition | ADAPT continuation into CVF-owned template/reference artifact |
| Claim boundary | no external prompt is used as source proof for runtime fields, package facts, live results, or public claims |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | evidence readout quick packet template reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT: source verification rows, gate output, and material commit evidence |
| actionEvidence | ACTION_EVIDENCE_PRESENT: template field matrix and changed-file manifest |
| invocationBoundary | local source reads and governed markdown/reference edits only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, or MCP interception claim |
| claimLanguage | manual quick-packet template and source mapping only |
| forbiddenExpansion | no runtime, UI, checker, MCP, CLI, IDE bridge, further provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, package activation, certification decision, DICE, or push |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-27 ERQP-T0-T4 evidence readout quick packet template |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch, python governance gates, git |
| Target paths | `docs/reference/CVF_EVIDENCE_READOUT_QUICK_PACKET_TEMPLATE.md` |
| Allowed scope source | active session next allowed move after EFRD-T0-T4 |
| Before status evidence | HEAD `f94f7ef6`; clean worktree |
| After status evidence | material closure pending commit |
| Diff evidence | `git diff --name-status f94f7ef6..HEAD` |
| Approval boundary | evidence/readout quick-packet template only |
| Claim boundary | no runtime, UI, checker, MCP, CLI, IDE bridge, further provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, package activation, certification decision, DICE, or push |
| Agent type | Codex dispatcher/implementer/reviewer/closer |
| Invocation ID | `erqp-t0-t4-evidence-readout-quick-packet-template-2026-06-27` |
| Expected manifest | this reference file |
| Actual changed set | this reference file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance template/reference work. No public-sync batch is
authorized.

## Claim Boundary

This reference defines a manual evidence/readout quick-packet template only. It
does not implement UI, runtime queues, checkers, MCP tools, CLI adapters, IDE
bridges, provider calls, public-sync, resolver or adapter mutations, package
activation, package certification, generated workspace-state changes, DICE
work, production readiness, public readiness, or push.
