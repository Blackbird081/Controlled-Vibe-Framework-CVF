# CVF Truth Foundation Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-06-28

## Purpose

Provide the stable CVF-owned front door for truth foundation contracts that
separate source authority, provenance labeling, evidence records, obligation
records, and verification results from runtime enforcement.

This folder was opened by TKG-T1 after TKG-T0 accepted the upstream Agent
Governance Toolkit and the operator-provided Truth Kernel patch as doctrine
inputs with runtime deferred.

## Scope / Target / Owner Boundary

Target: documentation contracts for source provenance, claim labeling,
evidence and obligation record minimums, verification-result semantics, and
fail-closed claim movement.

Owner boundary: this folder is documentation authority only. It does not
implement a Truth Kernel runtime, evidence database, obligation registry, SOT
index runtime, MCP gateway, hypervisor, circuit breaker, provider call, public
surface, adapter, package activation, certification, or generated aggregate.

## Active References

| Reference | Role |
|---|---|
| `CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md` | Canonical TKG-T1 contract for source authority, provenance labels, evidence and obligation record minimums, verification semantics, and strict movement boundaries |
| `CVF_TRUTH_FOUNDATION_OWNER_SURFACE_RECONCILIATION_MATRIX.md` | TKG-T2 reconciliation matrix mapping the TKG-T1 contract to existing CVF evidence, learning, release-truth, scoring, and claim-boundary owner surfaces |

## Existing CVF Owner Surfaces

| Existing surface | Relationship |
|---|---|
| `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md` | enterprise evidence-pack export and audit layout remains owner for evidence packaging |
| `docs/reference/CVF_MLW3_EVIDENCE_TO_TRUTH_LEARNING_SIGNAL_PIPELINE_2026-06-05.md` | learning-signal route remains owner for evidence-to-truth learning updates |
| `docs/reference/CVF_RELEASE_CANDIDATE_TRUTH_PACKET_2026-04-21.md` | release truth packet remains owner for milestone claim boundary wording |
| `docs/reviews/CVF_WD1_TRUTHSCORE_WEIGHTING_DOCTRINE_COMPLETION_2026-05-31.md` | TruthScore weighting doctrine remains owner for scoring behavior already delivered in WD1 |
| `docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md` | workflow control remains owner for claim/evidence gate sequencing and source-proof triage |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | External repo or copied folder |
| Chain map route | External repo or copied folder -> Root/folder lifecycle classification plus absorption map when retained -> CVF-owned reference contract -> ABSORB, ADAPT, DEFER, REJECT, or BLOCK |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/truth_foundation/` |
| Disposition | ADAPT TKG-T0 selected doctrine into CVF-owned truth foundation reference contract |
| Claim boundary | upstream AGT and the Truth Kernel patch remain external inputs; this folder owns only adapted CVF documentation |

## Design Control Gate

Accepted design:

- keep CVF-governed source surfaces as authority;
- treat external repositories, copied folders, and provider-local memories as
  advisory until mapped through a CVF owner surface;
- distinguish integrity evidence from truth-support evidence;
- require important claims to carry provenance labels;
- require hard obligations to have source-backed verification before strict
  movement;
- preserve human approval as accountable authorization, not as proof that a
  claim is true.

Rejected design:

- direct import of AGT runtime components or Truth Kernel package code;
- parallel evidence, obligation, SOT, or verifier runtime;
- LLM output acting as its own verifier for hard claims;
- hash or receipt evidence being overclaimed as truth;
- public export of private provenance;
- external agent CLI, MCP, adapter, or hosted behavior without a later
  source-verified tranche.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | `docs/reference/truth_foundation/` | agents may read this as a CVF reference contract but cannot treat it as runtime truth capability | TKG-T1 contract plus TKG-T0 roadmap | N/A with reason: internal documentation reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter truth-foundation readout | no external adapter, MCP tool, CLI command, or public package behavior is created by TKG-T1 | this README records deferred external posture | separate GC-018/source-verified work order required before any adapter or public surface | `DEFERRED_WITH_REASON` |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: TKG-T1 is private provenance reference promotion. Public-safe truth
foundation wording requires a separate public-sync decision.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | TKG-T1 truth foundation reference front door |
| claimDisposition | N/A with reason: reference front door only |
| receiptEvidence | N/A with reason: no runtime receipt or execution-control claim |
| actionEvidence | ACTION_EVIDENCE_PRESENT - front door authored for TKG-T1 reference contract |
| invocationBoundary | local governed documentation authoring |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | reference/front-door language only |
| forbiddenExpansion | no Truth Kernel runtime, AGT runtime, MCP gateway, hypervisor, evidence database, obligation registry runtime, verifier service, provider/live proof, public-sync, adapter, package activation, certification, generated aggregate, or MPI-T6 runtime |

## Claim Boundary

This folder is a documentation reference surface only. It does not implement a
Truth Kernel runtime, evidence database, obligation registry, SOT index
runtime, independent verifier service, provider/live proof, public claim,
adapter, package activation, certification, generated aggregate, MCP gateway,
hypervisor, circuit breaker, or MPI-T6 runtime.
