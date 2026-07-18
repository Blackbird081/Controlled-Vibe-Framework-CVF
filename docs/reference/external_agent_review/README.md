# CVF External Agent Review Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_INDEX

docType: reference

## Purpose

Provide the stable front door for preparing external-agent review context.
External agents may review public CVF surfaces, copied handoff packages, or
operator-provided examples, but CVF remains the source of truth.

This folder exists so external agents do not mistake simplified public product
vocabulary for the internal governed workflow-chain system.

## Scope / Target / Owner Boundary

Target: external-agent review packets, public-context summaries, and
non-canonical package absorption.

Owner boundary: this folder owns context-shaping guidance only. It does not
authorize public-sync, publication, external repository mutation, runtime
execution, provider calls, or production/readiness claims.

## Central Rule

CVF is the origin. External repositories and external-agent packages are
reference material only.

Useful patterns may be absorbed only after they are mapped to CVF-owned
contracts, source authority, claim boundaries, and current workflow-chain
semantics.

## Current References

| Reference | Role |
|---|---|
| `CVF_EXTERNAL_AGENT_REVIEW_CONTEXT_STANDARD.md` | Standard for giving external agents enough context to review CVF without exposing private provenance source. |
| `CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` | Central chain map connecting external/corpus/repo input, old blind-spot/corpus/legacy rules, external-agent review packets, returned-output absorption, GC-018, work orders, source verification, and autorun. |
| `CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | Central index for external-absorption package, runtime, checker, and value-parked candidates that retain CVF value but require concrete reopen evidence before future work. |
| `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` | Central external absorption standard, including overlap and novelty classification before new owner surfaces or follow-up lanes are opened. |
| `.private_reference/source_mirrors/README.md` | Private-reference control plane for local cloned upstream repositories used as source authority during external absorption. |
| `.private_reference/source_mirrors/INDEX.md` | Private source-mirror index linking upstream repos to derived external-agent packs and absorption lanes. |
| `CVF_WORKFLOW_CHAIN_PUBLIC_REVIEW_CONTEXT.md` | Canonical distinction between public/simple workflow vocabulary and internal governed workflow-chain system. |
| `CVF_EXTERNAL_AGENT_REVIEW_PACKET_TEMPLATE.md` | Stable packet template for external-agent review requests. |
| `CVF_EXTERNAL_AGENT_REVIEW_AUTHORING_CHECKLIST.md` | Authoring checklist and red-flag screen before sending a packet to an external agent. |
| `CVF_EXTERNAL_AGENT_REVIEW_SAMPLE_PACKET_WORKFLOW_MCP_WORKSPACE.md` | Bounded sample packet for workflow-chain, MCP, and workspace review context. |
| `CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md` | Stable workflow for classifying returned external-agent output before CVF acts on it. |
| `governance/compat/check_external_agent_absorption_table.py` | Range-aware guard requiring the Required Absorption Table on changed external-return absorption reviews. |
| `docs/reference/agent_workspace/CVF_WORKSPACE_LAYER_EXTERNAL_PACKAGE_ABSORPTION_MAP.md` | CVF-owned absorption map for the local external workspace package copied into the repo root. |
| `docs/reference/mcp_gateway/README.md` | MCP Gateway local view for future MCP tool ingress work. |
| `docs/reference/agent_workspace/README.md` | Agent workspace local view for future workspace state/runtime work. |

## Authoring Flow

1. Read this front door, the context standard, and
   `CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md`.
2. Classify the input type through the chain map before deciding whether the
   task is packet authoring, returned-output absorption, legacy/corpus intake,
   or implementation planning.
3. If the changed artifact touches `.private_reference/legacy/`,
   `.private_reference/external_repos/`, or
   `.private_reference/source_mirrors/`, or uses bounded explicit intake
   language ("external repository absorption", "copied folder absorption",
   "external repo or copied folder"), declare the R85-style
   `## External Repository Absorption Entry Control` block (source type,
   upstream/source-mirror disposition, enumeration/manifest plan, per-file
   terminal-ledger plan, owner/overlap route, value-disposition route, claim
   boundary) required by the `AGENTS.md` Mandatory External Repository
   Absorption Entry Rule section and machine-checked by
   `governance/compat/check_absorption_blindspot_control_presence.py`
   (ADIF-0014) before proceeding to source-mirror checks or packet
   authoring. Use the narrow `COMPARISON_ONLY_NO_ABSORPTION` disposition only
   when the reference is genuinely comparison-only.
4. For high-value external repositories, check
   `.private_reference/source_mirrors/INDEX.md`. If only a derived
   external-agent pack exists and the upstream repo can be cloned, create or
   request a pinned source mirror before claiming full absorption.
5. Start from `CVF_EXTERNAL_AGENT_REVIEW_PACKET_TEMPLATE.md` when an external
   agent review packet is needed.
6. Run the checks in `CVF_EXTERNAL_AGENT_REVIEW_AUTHORING_CHECKLIST.md`.
7. Use `CVF_EXTERNAL_AGENT_REVIEW_SAMPLE_PACKET_WORKFLOW_MCP_WORKSPACE.md` as
   the bounded example for workflow-chain, MCP, and workspace review context.
8. After the external agent returns output, classify every returned item through
    `CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md` before creating a
    finding, standard, roadmap, work order, review, reference artifact, or
    operator decision.
9. Before opening a new owner surface or follow-up lane, fill the
   `## Overlap And Novelty Classification` section required by
   `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; compare against existing CVF
   owner surfaces and use `CONFIRMED_EXISTING`, `ENRICH_EXISTING`,
   `NEW_FINDING`, `REJECT_DIRECT_IMPORT`, `NO_NEW_VALUE`, or
   `OWNER_SURFACE_NOT_FOUND`.
10. If a closeout parks a package, runtime, checker, or valuable deferred item,
   add or update `CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md`, cite an
   existing row, or state `NO_CONDITIONAL_REOPEN_INDEX_ENTRY_WITH_REASON`.
11. For changed external-return absorption reviews, satisfy
   `governance/compat/check_external_agent_absorption_table.py` before closure.

## Required Read Trigger

Read this folder when a task:

- asks an external agent to evaluate CVF architecture, workflow chains, MCP, or
  workspace design;
- prepares public or semi-public context for external review;
- absorbs a copied external package, repo idea, or review packet;
- consumes corpus, legacy, public/simple, or external repo input before
  implementation planning;
- compares a derived external-agent pack against its upstream repository;
- notices an external agent treating a public/simple lifecycle as internal CVF
  workflow-chain authority;
- needs to decide what can be public context without publishing private
  provenance files.

## Claim Boundary

This front door is a reference index. It does not make private provenance files
public, and it does not authorize public-sync or external-facing readiness.

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | This front-door reference file and the governed references listed in `## Current References` |
| Enumeration command | `Get-Content -Raw docs/reference/external_agent_review/README.md` |
| Manifest artifact or inline manifest | inline `## Current References` table in this file |
| Processing ledger artifact or inline ledger | inline `## Authoring Flow` and `## Required Read Trigger` sections in this file |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | inline `## Current References` table in this file |
| Unresolved items | 0 |
| Completion claim boundary | reference front door only; no runtime, provider, public, package, checker, or production expansion |

## Corpus Completeness And Report Integrity

- Corpus task class: external-agent review front-door reference index.
- Corpus root: `docs/reference/external_agent_review/README.md`.
- Snapshot time: 2026-06-29 local session.
- Enumeration command: `Get-Content -Raw docs/reference/external_agent_review/README.md`.
- Manifest artifact or inline manifest: inline `## Current References` table in this file.
- Manifest hash: not generated; single-file front-door update.
- Processing ledger artifact or inline ledger: inline `## Authoring Flow` and `## Required Read Trigger` sections in this file.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE
- Reconciliation: manifest=1 front-door file; ledger_terminal=1 front-door update; exclusions=0; unresolved=0
- Unresolved files: 0
- Declared exclusions: none
- Unreadable or unsupported files: none
- Aggregation check: 1 changed front-door file reconciled to 1 front-door update.
- Drift check: future reference additions should update `## Current References` when they are part of the front-door read path.
- Output traceability: this file points to the governed references and guards used by external-agent review and external-source intake.
- Adversarial verification: front-door status does not imply any package, runtime, checker, public, provider, or production authority.
- Corpus verdict: COMPLETE_VERIFIED

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| Front-door reference list | External-agent review and external-source intake references are routed through CVF-owned standards. | `DOCTRINE_ADAPTED` | `docs/reference/external_agent_review/README.md` | Keep this index current when adding governed reference surfaces. | No runtime or package behavior |
| Conditional reopen index pointer | Candidate package value must be parked in the conditional reopen index before later package work. | `PACKAGE_CANDIDATE` | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | Future package work requires separate governed authorization. | No package activation from this front door |
| External-source runtime candidates | Runtime candidates are routed to conditional reopen rows before any value probe. | `RUNTIME_CANDIDATE` | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | Future runtime work requires source verification, value proof, and live proof when behavior is claimed. | No runtime mutation from this front door |
| External-source checker candidates | Checker candidates are routed to conditional reopen rows before any guard work. | `CHECKER_CANDIDATE` | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | Future checker work requires separate GC-018 and machine-gate work order. | No checker wiring from this front door |
| External direct implementations | External direct import remains non-authoritative until rewritten into CVF-owned surfaces. | `REJECT_DIRECT_IMPORT` | CVF-owned reference, roadmap, work order, or source surface only | Use the absorption workflow before any implementation planning. | Direct import remains blocked |
| Duplicate or already-owned guidance | Material with no new doctrine, package, runtime, or checker value should be closed with explicit no-value reason. | `NO_PACKAGE_OR_RUNTIME_VALUE` | Existing governed CVF owner surface | State the no-index reason in the closeout. | No runtime or package behavior |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| External absorption standard front door | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` | ENRICH_EXISTING | Adds overlap and novelty classification as a required pre-write discipline. | Keep this front door pointed at the standard and checker. |
| Conditional reopen routing | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | CONFIRMED_EXISTING | Existing index remains the owner for parked package/runtime/checker value. | Cite or update existing rows before closure. |
| Direct external implementation ideas | Existing governed CVF owner surface or `OWNER_SURFACE_NOT_FOUND` per artifact | REJECT_DIRECT_IMPORT | Direct import stays rejected even when CVF-native doctrine or candidate value remains. | Route through value matrix and overlap ledger. |
| Duplicate or already-owned guidance | Existing governed CVF owner surface | NO_NEW_VALUE | Material must be compared before no-value closure. | State no-new-value reason in the artifact. |

## Source Mirror Migration Control

| Field | Value |
|---|---|
| Legacy source path | `.private_reference/external_repos/` |
| Source mirror path | `.private_reference/source_mirrors/` |
| Mirror index row | `.private_reference/source_mirrors/INDEX.md` (see the Mirror Ledger for per-repository rows) |
| Pinned upstream commit | LEGACY_REFERENCE_ONLY_WITH_REASON: this front door names the legacy path descriptively as one of the ADIF-0014 trigger prefixes and does not migrate a specific repository |
| Migration disposition | LEGACY_REFERENCE_ONLY_WITH_REASON |
| Legacy cleanup disposition | N/A with reason: no repository-specific legacy folder is being cleaned up by this front-door update |
| Claim boundary | this section documents the trigger vocabulary only; it authorizes no runtime, no install, no package activation, no provider, no public, and no production behavior |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external knowledge intake routing guard implementation |
| Chain map route | external-agent review front door -> chain-map classification -> context packet, returned-output absorption, conditional reopen index, or governed implementation planning |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_absorption_blindspot_control_presence.py` |
| Owner surface | `docs/reference/external_agent_review/README.md` |
| Disposition | ADAPT front-door routing to include the conditional reopen index and the R95 external repository absorption entry control step |
| Claim boundary | front-door routing only; no runtime, provider, public, package activation, checker wiring, or production claim |

## Epistemic Process Block

Epistemic Process Applicability: EPISTEMIC_PROCESS_NA_WITH_REASON: reference
front door and routing index; it defines read order and owner-surface routing
without asserting a new empirical corpus, runtime, provider, public, or
production behavior claim.

Expected Result / Prediction: N/A - front-door reference update.

Evidence Comparison: N/A with reason: implementation or value-probe evidence
belongs to future governed work orders, not this front-door index.

Contradiction Or Gap Disposition: N/A with reason: if future reference routing
changes, this front door must be updated in the same governed batch.

Claim Update: front-door routing now includes the conditional reopen index.
