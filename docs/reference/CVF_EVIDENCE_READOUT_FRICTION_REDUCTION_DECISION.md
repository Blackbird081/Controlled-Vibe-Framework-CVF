# CVF Evidence Readout Friction Reduction Decision

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Purpose

Define a compact source-selection decision for operators and future agents who
need to understand current CVF evidence/readout state without rereading every
recent roadmap, GC-018, work order, and completion packet first.

## Scope / Target / Owner Boundary

Target: read-only evidence/readout source-selection guidance.

Owner boundary: this reference tells future agents which existing CVF-governed
surface to read first for common evidence/readout questions. It does not create
a dashboard, runtime queue, MCP or CLI command, IDE bridge, provider proof,
public-sync, resolver behavior, adapter behavior, package activation,
certification decision, generated workspace state mutation, or DICE work.

## Source Authority

| Source | Role |
|---|---|
| `CVF_SESSION_MEMORY.md` | active front door and next allowed move |
| `AGENT_HANDOFF_V23_2026-06-26.md` | active handoff and parked boundaries |
| `docs/reviews/CVF_WORKFLOW_VALUE_PROOF_T0_T4_COMPLETION_2026-06-27.md` | value proof and friction claim |
| `docs/reference/agent_workspace/CVF_LOCAL_WORKSPACE_PROJECTION_READ_MODEL_DECISION.md` | read-model source mapping |
| `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | operator-facing read-model section precedent |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | package/workspace boundary and parked scope |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| Current next allowed move selects evidence/readout friction reduction | `CVF_SESSION_MEMORY.md` | Next Allowed Move | `workflow_value_proof_closed_pass_bounded_pending_friction_readout_roadmap_selection` | active session front door | ACCEPT |
| WVP records paperwork load as confirmed friction | `docs/reviews/CVF_WORKFLOW_VALUE_PROOF_T0_T4_COMPLETION_2026-06-27.md` | Value Verdict | `Paperwork load`; `FRICTION_CONFIRMED` | WVP completion review | ACCEPT |
| Read-model decision maps required evidence and closure readiness to governed sources | `docs/reference/agent_workspace/CVF_LOCAL_WORKSPACE_PROJECTION_READ_MODEL_DECISION.md` | Projection Sections | `requiredEvidence`; `closureReadiness` | local workspace projection read model | ACCEPT |
| Operator view plan defines current-mode, guard-status, and next-move sections | `docs/reference/agent_workspace/CVF_AGENT_WORKSPACE_OPERATOR_VIEW_PLAN.md` | Read Model Sections | `Current Mode`; `Guard Status`; `Next Move` | operator view plan | ACCEPT |
| Package inventory parks runtime, provider, and public scope | `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_FULL_PACKAGE_ABSORPTION_INVENTORY.md` | Next-Roadmap Recommendation | `Runtime, MCP, CLI, IDE bridge, provider/live proof, and public-sync remain parked` | package absorption inventory | ACCEPT |

## Source Selection Decision

Decision: future agents should answer the next evidence/readout question from
the narrowest current CVF-governed surface before opening new work.

Use this order:

1. Active front door for current mode, active handoff, next move, and parked
   checkpoint.
2. Active handoff for current boundary and commit context.
3. Most recent completion review for the value or closure claim.
4. Stable reference only when the question is about reusable vocabulary or
   source mapping.
5. Roadmap, GC-018, and work order only when authoring or reviewing a new
   governed tranche.

## Readout Question Matrix

| Question | First source | Escalate to | Do not use first |
|---|---|---|---|
| What is the current mode? | `CVF_SESSION_MEMORY.md` | active state registry | provider memory |
| What just proved value? | WVP completion review | WVP roadmap and work order | raw chat transcript |
| What evidence is required? | local workspace projection read-model decision | governing work order | inferred checklist |
| What package material is safe? | workspace package inventory | package absorption map | raw package files |
| Is live proof authorized? | active next allowed move | governing GC-018 | prior live result alone |
| What should be opened next? | active next allowed move and this reference | new GC-018/work order | implementation by implication |

## Next-Control Recommendation

If the operator wants further reduction after this decision, open a small
`EVIDENCE_READOUT_QUICK_PACKET` lane that creates a reusable, non-runtime
template for a one-page readout. That future lane must source-verify its fields
and remain separate from UI, runtime, provider/live, adapter, public-sync, and
generated-state work unless those scopes are explicitly authorized.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference | internal agents may use it for source-selection only | source verification rows | N/A with reason: no adapter created | CONTRACT_ONLY |
| `EXTERNAL_AGENT_CLI_MCP` | future readout support remains deferred | no executable external-agent support | claim boundary | deferred adapter owner; fresh GC-018 required | DEFERRED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | operator continuation is authorization context only; source facts are re-verified against CVF-governed surfaces |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | governed reference surface |
| Disposition | ADAPT continuation into CVF-owned decision/reference artifact |
| Claim boundary | no external prompt is used as source proof for runtime fields, package facts, live results, or public claims |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | evidence readout friction reduction decision reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT: source verification rows, gate output, and material commit evidence |
| actionEvidence | ACTION_EVIDENCE_PRESENT: reference mapping and changed-file manifest |
| invocationBoundary | local source reads and governed markdown/reference edits only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, or MCP interception claim |
| claimLanguage | source-selection decision and reference mapping only |
| forbiddenExpansion | no runtime, UI, MCP, CLI, IDE bridge, further provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, package activation, certification decision, DICE, or push |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-27 EFRD-T0-T4 evidence readout friction reduction decision |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, apply_patch, python governance gates, git |
| Target paths | `docs/reference/CVF_EVIDENCE_READOUT_FRICTION_REDUCTION_DECISION.md` |
| Allowed scope source | active session next allowed move after WVP-T0-T4 |
| Before status evidence | HEAD `c1c70376`; clean worktree |
| After status evidence | material closure pending commit |
| Diff evidence | `git diff --name-status c1c70376..HEAD` |
| Approval boundary | evidence/readout source-selection decision only |
| Claim boundary | no runtime, UI, MCP, CLI, IDE bridge, further provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, package activation, certification decision, DICE, or push |
| Agent type | Codex dispatcher/implementer/reviewer/closer |
| Invocation ID | `efrd-t0-t4-evidence-readout-friction-reduction-decision-2026-06-27` |
| Expected manifest | this reference file |
| Actual changed set | this reference file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance decision/reference work. No public-sync batch is
authorized.

## Claim Boundary

This reference defines source-selection guidance only. It does not implement UI,
runtime queues, MCP tools, CLI adapters, IDE bridges, provider calls,
public-sync, resolver or adapter mutations, package activation, package
certification, generated workspace-state changes, DICE work, production
readiness, public readiness, or push.
