# CVF MKG Owner Verification Decision

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Purpose

Define the current owner-surface decision for the three MKG deferred groups:
cortex runtime/bridge, governed skill evolution, and graph implementation plan.

## Scope / Target / Owner Boundary

Target: read-only routing and owner-surface guidance for MKG follow-up work.

Owner boundary: this reference explains how to route MKG owner questions. It
does not edit original MKG artifacts, create a dashboard, checker, runtime
queue, MCP or CLI command, IDE bridge, provider proof, public-sync, resolver
behavior, adapter behavior, registry entry, package activation, certification
decision, generated workspace state mutation, or DICE work.

## Source Authority

| Source | Role |
|---|---|
| `CVF_SESSION_MEMORY.md` | active front door and next allowed move |
| `AGENT_HANDOFF_V23_2026-06-26.md` | active handoff and parked boundaries |
| `docs/reference/CVF_MKG_PENDING_FINALITY_RECONCILIATION_DECISION.md` | MPFR routing precondition |
| `docs/reviews/CVF_MKG2_DEFERRED_RUNTIME_CANDIDATE_TRIAGE_REVIEW_2026-06-01.md` | deferred MKG group inventory |
| `docs/reviews/CVF_MKG3_CURRENT_OWNER_NEGATIVE_SEARCH_EVIDENCE_REVIEW_2026-06-01.md` | older negative owner search evidence |
| `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` | graph/context owner routing |
| `docs/reference/CVF_MEMORY_PLANE_MAP.md` | KGR1 local graph routing |
| `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | ASSF package lifecycle owner contract |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/mlw7-external-capability-ingestion.ts` | cortex external capability intake surface |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| Current next allowed move permits MKG owner-verification lane | `CVF_SESSION_MEMORY.md` | Next Allowed Move | `nextAllowedMove` | active session front door | ACCEPT |
| MPFR says MKG owner-verification needs fresh GC-018 | `docs/reference/CVF_MKG_PENDING_FINALITY_RECONCILIATION_DECISION.md` | Routing Rule | `Routing Rule` | MPFR decision reference | ACCEPT |
| MKG2 carries 21 deferred candidates in three groups | `docs/reviews/CVF_MKG2_DEFERRED_RUNTIME_CANDIDATE_TRIAGE_REVIEW_2026-06-01.md` | Candidate Group Summary | `Candidate Group Summary` | MKG2 review | ACCEPT |
| Graph/context-builder work has current owner surfaces | `docs/reference/CVF_OPERATIONAL_REFERENCE_INDEX_2026-05-23.md` | Lookup Table | `Scoping graph or context-builder work` | operational reference index | ACCEPT |
| KGR1 local graph status is running and bounded | `docs/reference/CVF_MEMORY_PLANE_MAP.md` | KGR1 Structural Graph Context Index | `KGR1 Structural Graph Context Index` | memory plane map | ACCEPT |
| ASSF package contract absorbs Memento skill evolution as lifecycle input | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | ASSF-T0.1 Ledger Consumption Table | `ASSF-T0.1 Ledger Consumption Table` | ASSF package contract | ACCEPT |
| Cortex external-capability candidate class exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/mlw7-external-capability-ingestion.ts` | type declaration | `ExternalCapabilityCandidateClass` | MLW7 external capability ingestion | ACCEPT |
| Cortex intake blocks install, execute, authority, delegation, publication, adapter runtime | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/mlw7-external-capability-ingestion.ts` | readout invariant | `noInstallNoExecuteInvariant` | MLW7 external capability ingestion | ACCEPT |

## Current Owner Surface Decision

| MKG group | Current owner surface | Decision | Runtime boundary |
|---|---|---|---|
| Cortex runtime/bridge | MLW7 external capability ingestion readout | METADATA_INTAKE_OWNER_PRESENT | no bridge runtime, install, execution, delegation, registry authority, publication, or adapter runtime is authorized |
| Governed skill evolution | ASSF package contract and lifecycle fields | PACKAGE_CONTRACT_OWNER_PRESENT | no production mutation, active package source, resolver, activation, or package runtime is authorized |
| Graph implementation plan | Operational Reference Index, Memory Plane Map, and LPF graph/context-builder modules | LOCAL_ADVISORY_GRAPH_OWNER_PRESENT | no durable graph persistence, scoring authority, live authority, public readiness, or production readiness is authorized |

## Routing Rule

If a later agent handles MKG work:

1. read this reference after the active session front door;
2. preserve MKG1-MKG4 historical artifacts;
3. select the exact owner class before writing a work order;
4. treat metadata intake, package contract, and local advisory graph surfaces as
   bounded owner surfaces, not runtime authority;
5. require fresh source verification before changing any runtime, package,
   adapter, registry, public-sync, provider/live, or generated-state path.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | this reference | internal agents may use it for MKG owner routing only | source verification rows | N/A with reason: no adapter created | CONTRACT_ONLY |
| `EXTERNAL_AGENT_CLI_MCP` | external owner readout support remains deferred | no executable external-agent support | claim boundary | deferred adapter owner; fresh GC-018 required | DEFERRED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Disposition |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | operator continuation is authorization context only; source facts are re-verified against CVF-governed surfaces |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | governed reference surface |
| Disposition | ADAPT continuation into CVF-owned owner-verification artifact |
| Claim boundary | no external prompt is used as source proof for runtime fields, package facts, live results, or public claims |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MKG owner-verification decision reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE |
| receiptEvidence | CVF_RECEIPT_PRESENT: source verification rows, current owner matrix, gate output, and material commit evidence |
| actionEvidence | ACTION_EVIDENCE_PRESENT: owner decision and changed-file manifest |
| invocationBoundary | local source reads, focused search, and governed markdown/reference edits only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, or MCP interception claim |
| claimLanguage | MKG owner-surface routing decision only |
| forbiddenExpansion | no runtime, UI, checker, MCP, CLI, IDE bridge, provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, registry mutation, package activation, certification decision, DICE, or push |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex |
| Provider or surface | Codex local workspace |
| Session or invocation | 2026-06-27 MKGOV-T0-T4 owner-verification decision |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, rg, git, apply_patch, python governance gates |
| Target paths | `docs/reference/CVF_MKG_OWNER_VERIFICATION_DECISION.md` |
| Allowed scope source | active session next allowed move after MPFR-T0-T4 |
| Before status evidence | HEAD `e761e590`; clean worktree |
| After status evidence | material closure pending commit |
| Diff evidence | `git diff --name-status e761e590..HEAD` |
| Approval boundary | MKG owner-verification decision only |
| Claim boundary | no runtime, UI, checker, MCP, CLI, IDE bridge, provider/live proof, public-sync, generated workspace state mutation, resolver mutation, adapter mutation, registry mutation, package activation, certification decision, DICE, or push |
| Agent type | Codex dispatcher/implementer/reviewer/closer |
| Invocation ID | `mkgov-t0-t4-owner-verification-decision-2026-06-27` |
| Expected manifest | this reference file |
| Actual changed set | this reference file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance owner-verification work. No public-sync batch is
authorized.

## Claim Boundary

This reference defines a routing decision for MKG owner surfaces only. It does
not implement UI, runtime queues, checkers, MCP tools, CLI adapters, IDE
bridges, provider calls, public-sync, resolver or adapter mutations, registry
changes, package activation, package certification, generated workspace-state
changes, DICE work, production readiness, public readiness, or push.
