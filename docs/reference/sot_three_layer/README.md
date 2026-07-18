# CVF SOT Three-Layer Reference Front Door

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-12

Batch ID: SOT3-T2

## Purpose

Provide the stable CVF-owned front door for the Source of Truth three-layer
canonical contract family: Refinery prepares source-bound data without
creating truth, Kernel alone evaluates trust and issues decision/receipt/
reference authority, and Flow distributes verified references through a
governed, post-Kernel-only lifecycle.

This folder was opened by SOT3-T2 after SOT3-T0R accepted the three-layer
architecture recommendation and SOT3-T1 classified the topology as CAP-01, a
new CVF-owned architecture owner candidate (not an extension of
`docs/reference/truth_foundation/`).

## Scope / Target / Owner Boundary

Target: canonical documentation contracts for the complete
`SourceEnvelope -> RefineryPacket -> KernelEvaluationRequest ->
KernelDecision + TruthReceipt -> TruthReference -> DistributionPackage ->
FeedbackProposal` chain, including producer/consumer authority, field
minimums, status vocabularies, valid/invalid transitions, and fail-closed
invariants and negative cases.

Owner boundary: this folder is documentation authority only. It does not
implement a Refinery package, Truth Kernel runtime, Truth Flow runtime,
database, API endpoint, checker, guard, test, provider integration, public
surface, or generated aggregate. It does not supersede
`docs/reference/truth_foundation/` (TKG-T1 upstream doctrine owner) or
`docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md`
(ASSF skill-package truth-packet owner, a narrower vertical slice).

## Active References

| Reference | Role |
|---|---|
| `CVF_SOT_THREE_LAYER_CONTRACT_CHAIN.md` | Canonical eight-contract chain: producer, consumers, field minimums, status vocabulary, transitions, authority boundary, source provenance, compatibility decision per type |
| `CVF_SOT_THREE_LAYER_INVARIANTS_AND_NEGATIVE_CASES.md` | Ten fail-closed invariants and fourteen negative cases (twelve originally required plus NC-04A and NC-04B added by bounded repair) with expected fail-closed outcomes |
| `CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md` | Ratified bounded A0 decision selecting the scoped `/api/execute` knowledge-context seam and the A1-A5 proof ladder toward `LIVE_GOVERNANCE_PROVEN_BOUNDED`, with a current-evidence pointer to the accepted activation roadmap closure |

## Catalog Module Records (Contract, Implementation, Activation, Downstream Application)

This folder documents contracts only. Four separate as-built catalog MODULE
records under `docs/reference/system_architecture_catalog/entries/` name the
bounded, `LOCAL_READY`, `ACCEPTED_REVIEW_EVIDENCE` runtime owners that
implement (not merely contract) the three layers and their vertical-slice
composition:

| Proof stage | Owner surface | What it proves | What it does not prove |
|---|---|---|---|
| Contract | `cvf.asc.interface.sot_three_layer_contract_chain.v1` (this folder) | eight accepted inter-layer contract types and their field/transition authority | that any layer is implemented as runtime |
| Implementation | `cvf.asc.module.sot3_refinery_runtime.v1`; `cvf.asc.module.sot3_truth_kernel_runtime.v1`; `cvf.asc.module.sot3_truth_flow_runtime.v1`; `cvf.asc.module.sot3_three_layer_slice.v1` | bounded local-ready package runtime exists and real cross-package composition is proven by the vertical slice | global activation, universal invocation, a provider boundary, public export, or production readiness |
| Activation | `CVF_SOT3_ACTIVATION_ARCHITECTURE_DECISION.md` (this folder) plus `docs/roadmaps/CVF_SOT3_ACTIVATION_AND_OPERATIONAL_PROOF_ROADMAP_2026-07-13.md` | the ratified A0 product seam and the accepted bounded A1-A5 live-governance proof ladder | that the seam is wired into every CVF Web request or is production-scaled |
| Downstream application | `docs/reviews/CVF_SOT3_APP_T5_COMPLETION_REVIEW_2026-07-18.md` (SOT3-APP roadmap closure) | one accepted operational live-provider proof at a bounded product seam | universal SOT3 availability across CVF or any other application |

Reading only this README's contract tables is not evidence of implementation;
reading only the four module records is not evidence of activation; reading
only the activation decision is not evidence of downstream application. Each
stage cites its own accepted evidence and does not inherit the claim strength
of the stage above it.

## Authority Map

| Layer | Owns | Must not own |
|---|---|---|
| Refinery | `SourceEnvelope` consumption, `RefineryPacket` production, deterministic normalization/dedupe/conflict/quality/integrity/lineage | truth approval, AI inference, agent behavior, prompt logic, provider integration, final routing, a second Refinery inside Flow |
| Kernel | sole evaluation of `KernelEvaluationRequest`; sole producer of `KernelDecision`, `TruthReceipt` (for every decision outcome), and `TruthReference` (only from a receipt whose decision is `ACCEPT_EVIDENCE_CANDIDATE`, whose `receipt_hash` binds every authority-bearing field including `receipt_id` under one fixed canonical preimage profile `cvf.sotThreeLayer.receiptHash.v1` with RFC 8785 JCS string serialization and a published test vector, and whose `decision_id` resolves an immutable `KernelDecision` and onward `KernelDecision.request_id` resolves an immutable `KernelEvaluationRequest`, with all receipt-to-decision and decision-to-request bindings matching including `evaluated_content_hash`/`packet_hash`, `policy_version`, and `rule_version` equality, and `failed_obligations` empty) | raw-source cleanup, recipient routing, distribution, execution approval, minting a `TruthReference` from a non-accepting receipt, a broken resolution chain, a content/version mismatch, or a decision with non-empty `failed_obligations` |
| Flow | `DistributionPackage` production, routing, dose, lifecycle, `FeedbackProposal` production/handling under policy, strictly post-Kernel | duplicate Refinery implementation, truth creation, direct trust-state mutation, execution approval, minting `TruthReference` |

## Existing CVF Owner Surfaces

| Existing surface | Relationship |
|---|---|
| `docs/reference/truth_foundation/CVF_TRUTH_FOUNDATION_SOURCE_PROVENANCE_AND_VERIFICATION_CONTRACT.md` | remains upstream doctrine owner for source authority, provenance labels, evidence/obligation/verification-result minimums, and claim-movement semantics; this chain narrows that single governing chain into the three-module topology |
| `docs/reference/agent_system_skills/CVF_SKILL_SOURCE_OF_TRUTH_PACKET_STANDARD.md` | remains owner for ASSF skill-package truth packets, a narrower vertical slice this chain does not replace |
| `EXTENSIONS/CVF_GUARD_CONTRACT/src/contracts/receipt-binding.contract.ts` | workflow-step execution receipt, confirmed a different owner from `TruthReceipt` (truth-evaluation receipt); no overlap |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | retained SOT three-layer corpus -> SOT3-T0 external review -> SOT3-T0R architecture recommendation -> SOT3-T1 owner reconciliation -> SOT3-T2 canonical contract authoring -> CVF reviewer acceptance -> future implementation tranche if authorized |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_truth_foundation_claim_guard.py` |
| Owner surface | `docs/reference/sot_three_layer/` |
| Disposition | ADAPT selected T0R/T1 architecture decisions into a CVF-owned canonical contract family |
| Claim boundary | the retained three-folder corpus remains external input; this folder owns only adapted CVF documentation contracts |

## Design Control Gate

Accepted design:

- one canonical contract chain per stage handoff, no branching or
  versioned-adapter shapes;
- Kernel as sole issuer of decision, receipt, and reference authority;
- Refinery confined to deterministic, no-AI preparation;
- Flow confined to post-Kernel routing, distribution, and lifecycle;
- feedback confined to proposal-only, with no direct authority mutation;
- fail-closed behavior for every empty required collection, hash mismatch,
  version mismatch, replay, expiry, and revocation case.

Rejected design:

- direct import of the retained Flow-embedded `RefineryPacket` variant;
- direct import of the retained `publish-gate.ts` caller-supplied boolean;
- direct import of the retained `source-score.ts` direct-mutation path;
- treating TKG-T1's single governing chain as the owner of the three-module
  topology itself (SOT3-T1 CAP-01 repair);
- any implementation, package activation, or runtime claim in this tranche.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | `docs/reference/sot_three_layer/` | agents may read this as a CVF canonical contract reference but cannot treat it as runtime capability | T0R Producer/Consumer Packet And Receipt Mapping table; T1 owner map CAP-01; SOT3-T2 work order | N/A with reason: internal documentation reference only | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | future public-safe or adapter contract readout | no external adapter, MCP tool, CLI command, or public package behavior is created by SOT3-T2 | this README records deferred external posture | separate GC-018/source-verified work order required before any adapter or public surface | `DEFERRED_WITH_REASON` |

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: a compact front door can state the accepted
authority map (Refinery prepares, Kernel evaluates trust, Flow distributes
post-Kernel) without duplicating the field-level detail already owned by the
companion contract-chain and invariants files.

Evidence Comparison Requirement: the Authority Map and Existing CVF Owner
Surfaces tables were compared against the T1 owner map CAP-01 decision and
TKG-T1's owner-surface relationship language to confirm this front door does
not restate or contradict either source.

Contradiction Or Gap Disposition: this README correctly defers all
field-level and invariant-level detail to its two companion reference files
rather than duplicating them. The completion review's R4 finding (a
non-eligible receipt could appear to satisfy `TruthReference` issuance) is
reflected in the Authority Map's Kernel row above so the front door does not
understate the eligibility boundary even at summary level. The completion
review's R7 finding (the receipt hash did not bind the evidence/obligation/
verification-result decision basis) and R8 finding (the `failed_obligations`
authority path was unresolved) are likewise reflected in the Authority Map's
Kernel row above: the receipt hash binds every authority-bearing field, and
reference issuance requires decision resolution of the immutable
`KernelDecision` with empty `failed_obligations`. The completion review's
R9 finding (the decision-resolution comparison targeted fields
`KernelDecision` does not define) and R10 finding (the receipt hash
serialization permitted multiple encodings) are likewise reflected in the
Authority Map's Kernel row above: the resolution chain resolves
`KernelDecision` and then `KernelEvaluationRequest` via `request_id`,
comparing `evidence_refs`/`obligation_refs` to the request (not the
decision), and the receipt hash uses one fixed canonical preimage profile
(`cvf.sotThreeLayer.receiptHash.v1`, SHA-256, UTF-8 canonical JSON) so any
two independent verifiers produce the same digest. The completion review's
R11 finding (the canonical preimage omitted `receipt_id` and left JSON
string bytes ambiguous) and R12 finding (the resolution chain did not
compare content hash or versions across receipt, decision, and request)
are likewise reflected in the Authority Map's Kernel row above: the
preimage includes `receipt_id` and uses RFC 8785 JCS string serialization
with a published test vector, and the resolution chain requires
`evaluated_content_hash`/`packet_hash`, `policy_version`, and
`rule_version` equality across receipt, decision, and request.

Claim Update Requirement: the Active References and Authority Map tables
name both companion files and their exact roles; no capability or contract
is described here without a pointer to its owning detailed reference.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: SOT3-T2 is internal contract design based on private retained
evidence. Public-safe wording requires a separate public-sync decision after
CVF-native implementation exists.

## Claim Boundary

This folder is a documentation reference surface only. It does not implement
a Refinery package, Truth Kernel runtime, Truth Flow runtime, database, API
endpoint, checker, guard, test, provider integration, public surface,
adapter, package activation, certification, or generated aggregate. Field
names, status vocabularies, and transitions in this family are contract
specifications for a future source-verified implementation tranche, not
proof that a matching runtime symbol exists today.
