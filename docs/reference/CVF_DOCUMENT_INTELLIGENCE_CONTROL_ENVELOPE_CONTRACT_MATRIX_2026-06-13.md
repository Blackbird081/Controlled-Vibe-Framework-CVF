# CVF Document Intelligence Control Envelope Contract Matrix

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-13

Owner: Claude (worker); Codex (reviewer/closer)

workOrder:
`docs/work_orders/CVF_AGENT_WORK_ORDER_DICE_T0_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_CONTRACT_MATRIX_FOR_CLAUDE_2026-06-13.md`

GC-018:
`docs/baselines/CVF_GC018_DICE_T0_DOCUMENT_INTELLIGENCE_CONTROL_ENVELOPE_CONTRACT_MATRIX_2026-06-13.md`

dispatchBaseHead: `bea8e1f1`

executionBaseHead: `9fe5fc89`

rawMemoryReleased=false

## Purpose

The Document Intelligence Control Envelope (DICE) is a reusable CVF foundation
layer that sits one level above the Document Intelligence Router (DIR-T1) and
the EXA-T2 scan-route decision module. DICE coordinates document profile, scan
route, authorization gate, confidence/review signal ownership, and
provider/OCR/cost boundaries so that downstream document workflows consume
foundation outputs without redefining, duplicating, or bypassing the controls
already owned by those foundation layers.

This DICE-T0 matrix is a doc-only contract. It maps existing source-owned
surfaces to DICE envelope roles, defines five new doc-only DICE labels, rejects
any duplication of owned controls, and identifies machine-check candidates for
the DICE-T1 runtime tranche.

No runtime symbol is created here. No EXTENSIONS source, test, checker, or
generated aggregate is modified. The external Document Translator and
Policy_Local trees are not read, listed, hashed, or modified.

## Scope

Applies to: DICE-T0 doc-only contract matrix. This reference governs DICE
envelope role definitions, source-owned control mapping, doc-only label
authorization, machine-check candidates, and claim boundary for the Document
Intelligence Control Envelope foundation layer.

In scope:
- owner reconciliation of EXA-T2, DIR-T1, extraction pipeline, and EX-T9
  surfaces;
- five doc-only DICE envelope labels (`DocumentIntelligenceControlEnvelope`,
  `EnvelopeInputAuthority`, `EnvelopeReviewSignal`, `EnvelopeProviderCostBoundary`,
  `EnvelopeAdapterHandoff`);
- rejected duplication table;
- provider/OCR/cost authorization boundary rules;
- operator-visible review packet boundary rules;
- downstream adapter consumption boundary rules;
- machine-check candidates for DICE-T1.

Out of scope:
- runtime source implementation;
- external Document Translator or Policy_Local tree access;
- OCR/provider/API execution or cost-bearing computation;
- retrieval behavior changes or corpus ingestion;
- public-sync, readiness, quality, production, or cost claims.

## Source Authority And Owner Map

DICE-T0 draws source authority from four existing modules in the CVF extraction
foundation, which are already closed and bounded. DICE defines an envelope over
these modules; it does not re-implement their behavior.

| Owner module | Source path | Closed tranche | DICE role |
| --- | --- | --- | --- |
| Extraction pipeline (quality/OCR/storage) | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | EX-T4 through EX-T8 | EnvelopeInputAuthority (quality/OCR fields); EnvelopeProviderCostBoundary (confidence/retention flags) |
| EXA-T2 scan-route decision | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/scan_route_decision.py` | EXA-T2 | EnvelopeInputAuthority (scan signals); EnvelopeAdapterHandoff (route outcome passthrough) |
| DIR-T1 document intelligence router | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/document_intelligence_router.py` | DIR-T1 | EnvelopeInputAuthority (profile/structure); EnvelopeProviderCostBoundary (gate values); EnvelopeAdapterHandoff (capability/eligibility) |
| EX-T9 scan outcome report | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/scan_outcome_report.py` | EX-T9 | EnvelopeReviewSignal (operator-visible disposition and findings) |

## Existing Source-Owned Controls

Each table below maps existing source-owned fields to their assigned DICE
envelope role. Disposition codes:

- `CONSUME_ONLY` - DICE envelope consumes this surface; must not redefine, duplicate, or override.
- `CONSUME_AND_PASS_THROUGH` - DICE envelope receives and forwards this surface unchanged to downstream adapters.
- `MUST_NOT_OVERRIDE` - DICE envelope must not alter this value even as an intermediate step.
- `COMPOSE_ONLY` - DICE may compose from this module, but must not emit an equivalent re-issued value.
- `PASSTHROUGH_ONLY` - DICE may carry this value but must not copy the Literal definition.
- `RESPECT_AS_HARD_BLOCK` - DICE envelope must treat this gate value as a hard stop; no bypass logic is authorized.

### EnvelopeInputAuthority

Source-owned inputs that the DICE envelope receives. DICE must not redefine any
field or function in this table.

| Symbol | Source file | Verified line | Responsibility | DICE disposition |
| --- | --- | --- | --- | --- |
| `DocumentProfile` | `document_intelligence_router.py` | 68 | source artifact metadata and requested capability | CONSUME_ONLY |
| `DocumentStructureSignals` | `document_intelligence_router.py` | 86 | document shape signals | CONSUME_ONLY |
| `DocumentScanSignals` | `scan_route_decision.py` | 40 | pre-extraction scan signals | CONSUME_ONLY |
| `ExtractionQualityReport` | `extraction_pipeline.py` | 101 | quality gate output carrying confidence, coverage, and OCR retention | CONSUME_ONLY |
| `ExtractionStorageBoundary` | `extraction_pipeline.py` | 152 | canonical extraction output surface | CONSUME_ONLY |
| `evaluate_extraction_quality` | `extraction_pipeline.py` | 235 | quality evaluation function | CONSUME_ONLY; DICE does not call this function; quality arrives as a pre-produced report |
| `map_ocr_language_codes` | `extraction_pipeline.py` | 162 | governed OCR language table | CONSUME_ONLY; DICE does not call; language hints in DocumentProfile are metadata only |

### EnvelopeReviewSignal

Signals that flow to operator review. DICE envelope must not override or
suppress any review signal below.

| Symbol | Source file | Verified line | Responsibility | DICE disposition |
| --- | --- | --- | --- | --- |
| `ScanOutcomeReport` | `scan_outcome_report.py` | 43 | bounded operator-visible scan outcome report | CONSUME_AND_PASS_THROUGH |
| `ScanOutcomeReport.operator_review_required` | `scan_outcome_report.py` | 51 | operator review gate flag | MUST_NOT_OVERRIDE |
| `ScanOutcomeReport.disposition` | `scan_outcome_report.py` | 50 | READY_FOR_DOWNSTREAM or OPERATOR_REVIEW_REQUIRED | MUST_NOT_OVERRIDE |
| `ScanOutcomeReport.findings` | `scan_outcome_report.py` | 54 | tuple of bounded scan findings | MUST_NOT_OVERRIDE |
| `build_scan_outcome_report` | `scan_outcome_report.py` | 131 | scan report builder | CONSUME_ONLY; DICE does not call or wrap this function |
| `render_scan_outcome_report_markdown` | `scan_outcome_report.py` | 217 | operator-readable report renderer | CONSUME_ONLY; DICE does not call or replace this renderer |
| `DocumentIntelligenceRouteDecision.operator_action` | `document_intelligence_router.py` | 112 | required operator action from DIR | MUST_NOT_OVERRIDE |
| `DocumentIntelligenceRouteDecision.authorization_gate` | `document_intelligence_router.py` | 110 | DIR-assigned authorization gate | MUST_NOT_OVERRIDE |

### EnvelopeProviderCostBoundary

Provider, OCR, and cost authorization state. DICE must treat every hard-block
gate value as a terminal stop and must not define new gate values or confidence
thresholds.

| Symbol | Source file | Verified line | Responsibility | DICE disposition |
| --- | --- | --- | --- | --- |
| `AuthorizationGate` | `document_intelligence_router.py` | 35 | classifies whether OCR/provider auth is required | CONSUME_ONLY; do not add new gate values |
| `AuthorizationGate` value `OCR_REQUIRES_SEPARATE_AUTH` | `document_intelligence_router.py` | 38 | OCR cost authorization boundary | RESPECT_AS_HARD_BLOCK |
| `AuthorizationGate` value `PROVIDER_REQUIRES_SEPARATE_AUTH` | `document_intelligence_router.py` | 39 | provider cost authorization boundary | RESPECT_AS_HARD_BLOCK |
| `AuthorizationGate` value `BLOCKED` | `document_intelligence_router.py` | 40 | unsupported or blocked source hard stop | RESPECT_AS_HARD_BLOCK |
| `OPERATOR_ACTION_BY_GATE` | `document_intelligence_router.py` | 58 | authoritative operator action per gate | CONSUME_ONLY; DICE does not duplicate or substitute |
| `mean_ocr_confidence` | `extraction_pipeline.py` | 111 | OCR quality/cost confidence signal | CONSUME_ONLY; DICE does not redefine the threshold |
| `raw_ocr_retained` | `extraction_pipeline.py` | 113 | OCR raw text retention flag | CONSUME_ONLY |
| `SCAN_ROUTE_TO_AUTHORIZATION_GATE` | `document_intelligence_router.py` | 51 | authoritative scan-to-gate mapping table | CONSUME_ONLY; DICE does not duplicate this mapping |

### EnvelopeAdapterHandoff

Downstream adapter consumption contract. DICE envelope produces a bounded
handoff package; adapters must consume this output without re-creating route
semantics.

| Symbol | Source file | Verified line | Responsibility | DICE disposition |
| --- | --- | --- | --- | --- |
| `DownstreamCapability` | `document_intelligence_router.py` | 43 | adapter handoff class enum | CONSUME_ONLY; adapters must not invent equivalent values |
| `DocumentIntelligenceRouteDecision.downstream_eligibility` | `document_intelligence_router.py` | 111 | eligible capability tuple produced by DIR | CONSUME_AS_GATE; downstream adapters must not widen this eligibility |
| `DocumentIntelligenceRouteDecision.scan_decision_digest` | `document_intelligence_router.py` | 113 | SHA-256 digest of the composed scan decision | MUST_CARRY_THROUGH; traceability digest must accompany any downstream handoff |
| `DocumentIntelligenceRouteDecision.decision_version` | `document_intelligence_router.py` | 108 | versioned decision contract string | MUST_CARRY_THROUGH; version string must accompany handoff |
| `ScanRouteDecision` | `scan_route_decision.py` | 58 | deterministic route decision composed into DIR | COMPOSE_ONLY; DICE must not re-issue an equivalent route decision |
| `ScanRouteDisposition` | `scan_route_decision.py` | 31 | scan route outcome Literal | PASSTHROUGH_ONLY; DICE must not copy Literal definition |
| `decide_document_intelligence_route` | `document_intelligence_router.py` | 139 | DIR route decision function | CONSUME_ONLY; DICE does not wrap or duplicate this function |

## Proposed DICE Doc-Only Envelope Labels

The following labels are authorized by the DICE-T0 work order as doc-only
contract labels. None of these labels exist in any current runtime source. They
must not be presented as existing runtime symbols or added to any EXTENSIONS
source, test, or checker until DICE-T1 is separately authorized through a fresh
GC-018 and source-verified work order.

| Label | Purpose | Boundary | Consuming source |
| --- | --- | --- | --- |
| `DocumentIntelligenceControlEnvelope` | names the reusable document-control envelope above DIR and EXA-T2 | doc-only at DICE-T0 | not yet implemented |
| `EnvelopeInputAuthority` | classifies source-owned inputs consumed by the envelope | doc-only at DICE-T0 | not yet implemented |
| `EnvelopeReviewSignal` | classifies operator-visible review signals that the envelope must not suppress | doc-only at DICE-T0 | not yet implemented |
| `EnvelopeProviderCostBoundary` | classifies provider/OCR/cost authorization state that the envelope must respect | doc-only at DICE-T0 | not yet implemented |
| `EnvelopeAdapterHandoff` | classifies the bounded downstream adapter consumption contract | doc-only at DICE-T0 | not yet implemented |

The future `DocumentIntelligenceControlEnvelope` runtime shape will compose:

- `EnvelopeInputAuthority`: one `DocumentProfile`, one `DocumentScanSignals`,
  one optional `DocumentStructureSignals`, and one pre-produced
  `ExtractionQualityReport`;
- `EnvelopeReviewSignal`: one `ScanOutcomeReport` and one
  `DocumentIntelligenceRouteDecision`, carried through unchanged;
- `EnvelopeProviderCostBoundary`: the `AuthorizationGate` value from the route
  decision, with hard-block enforcement for OCR/provider/blocked values;
- `EnvelopeAdapterHandoff`: the bounded `DownstreamCapability` tuple, the
  `scan_decision_digest`, and the `decision_version` string.

This shape is proposed only. No runtime field or constructor is authorized at
DICE-T0.

## Rejected Duplication Table

The items below must never appear in any DICE source, test, checker, or
documentation artifact as DICE-owned values. Any DICE artifact that would
introduce an item below must be rejected or rebounded before closure.

| Rejected item | True owner | Source file | Verified line | Rejection reason |
| --- | --- | --- | --- | --- |
| Redefinition of `ScanRouteDisposition` Literal values | EXA-T2 | `scan_route_decision.py` | 31 | EXA-T2 owns all scan route dispositions; DICE passthrough only |
| Redefinition of `AuthorizationGate` Literal values | DIR-T1 | `document_intelligence_router.py` | 35 | DIR-T1 owns all authorization gate values; DICE consume only |
| Duplicate `SCAN_ROUTE_TO_AUTHORIZATION_GATE` mapping | DIR-T1 | `document_intelligence_router.py` | 51 | DIR-T1 owns the authoritative scan-to-gate mapping table |
| New OCR confidence threshold | extraction pipeline | `extraction_pipeline.py` | 111 | threshold is governed by extraction quality evaluator; DICE must not shadow or replace |
| Redefinition of `DownstreamCapability` Literal values | DIR-T1 | `document_intelligence_router.py` | 43 | DIR-T1 owns all downstream capability values |
| Replacement or suppression of `ScanOutcomeReport` fields | EX-T9 | `scan_outcome_report.py` | 43 | EX-T9 owns the operator-visible report; DICE supplements but must not replace |
| Duplicate `OPERATOR_ACTION_BY_GATE` mapping | DIR-T1 | `document_intelligence_router.py` | 58 | DIR-T1 owns the gate-to-action map |
| Any direct OCR execution or provider call | N/A | N/A | N/A | runtime authorization required; forbidden at DICE-T0 and blocked pending separate tranche |
| Any `decide_scan_route` equivalent function | EXA-T2 | `scan_route_decision.py` | 71 | EXA-T2 owns the scan route function; DICE must call, never wrap or duplicate |
| Any `decide_document_intelligence_route` equivalent function | DIR-T1 | `document_intelligence_router.py` | 139 | DIR-T1 owns the route function; DICE must call, never wrap or duplicate |

## Provider/OCR/Cost Authorization Boundary

DICE-T0 establishes that provider/OCR/cost routes remain blocked pending
separate explicit authorization at every layer. This boundary applies to DICE
itself, to all future DICE runtime implementations, and to all downstream
use-case adapters that consume DICE envelope outputs.

### Authorization Gate Hard-Block Rules

| Gate value | Source | Verified line | DICE rule |
| --- | --- | --- | --- |
| `OCR_REQUIRES_SEPARATE_AUTH` | `document_intelligence_router.py` | 38 | DICE envelope must treat this as a terminal stop; no downstream adapter may receive a HANDOFF until separate OCR authorization is obtained |
| `PROVIDER_REQUIRES_SEPARATE_AUTH` | `document_intelligence_router.py` | 39 | DICE envelope must treat this as a terminal stop; no provider call is authorized without a separate operator-authorized work order |
| `BLOCKED` | `document_intelligence_router.py` | 40 | DICE envelope must treat this as a hard block; no downstream processing is permitted |
| `OPERATOR_REVIEW_REQUIRED` | `document_intelligence_router.py` | 39 | DICE envelope must surface the operator review flag before any downstream handoff |

### OCR Confidence Boundary Rules

- `mean_ocr_confidence` (`extraction_pipeline.py`, line 111) is the only
  governed OCR quality signal. DICE must not define a competing confidence
  threshold.
- `raw_ocr_retained` (`extraction_pipeline.py`, line 113) is the only governed
  OCR retention flag. DICE must not introduce a parallel raw-text exposure path.
- When `ScanOutcomeReport.operator_review_required` is `True`
  (`scan_outcome_report.py`, line 51), DICE must surface the review requirement
  to the operator before permitting any downstream adapter handoff.

### Cost Boundary

DICE-T0 does not authorize any OCR execution, provider call, external API call,
or cost-bearing computation. A future DICE-T3 tranche may propose runtime and
provider/OCR authorization design only after DICE-T2 closure and explicit live-
proof/key/quota authorization from the operator.

## Operator-Visible Review Packet Boundary

DICE-T0 defines how the envelope must carry and expose operator-visible review
signals from EX-T9 and DIR-T1, without replacing or suppressing them.

### EX-T9 Scan Outcome Report Rules

| Rule | Source anchor | Requirement |
| --- | --- | --- |
| Report is pass-through | `ScanOutcomeReport` at line 43 | DICE must carry the report object unchanged; no field may be altered |
| Disposition is respected | `ScanOutcomeReport.disposition` at line 50 | `OPERATOR_REVIEW_REQUIRED` disposition must be surfaced before any adapter handoff |
| Review flag is respected | `ScanOutcomeReport.operator_review_required` at line 51 | when `True`, DICE must gate downstream handoff pending operator action |
| Findings are not filtered | `ScanOutcomeReport.findings` at line 54 | DICE must not filter, suppress, or reorder findings |
| Builder is not replaced | `build_scan_outcome_report` at line 131 | DICE does not call or wrap the builder; the report arrives as a pre-built artifact |

### DIR-T1 Route Decision Rules

| Rule | Source anchor | Requirement |
| --- | --- | --- |
| Authorization gate is respected | `DocumentIntelligenceRouteDecision.authorization_gate` at line 110 | DICE must not override the gate value from DIR |
| Operator action is surfaced | `DocumentIntelligenceRouteDecision.operator_action` at line 112 | DICE must surface the required operator action alongside any review packet |
| Scan decision digest is preserved | `DocumentIntelligenceRouteDecision.scan_decision_digest` at line 113 | traceability digest must accompany every operator-visible packet |

## Downstream Adapter Consumption Boundary

DICE-T0 defines the rules that downstream use-case adapters must follow when
consuming DICE envelope outputs. These rules apply to Document Translator
(DT-CVF-T0, currently parked), Policy_Local (PL-S1, currently parked), and any
future adapter lane.

Downstream adapters must not read, list, hash, or modify the external Document
Translator clone at `D:/UNG DUNG AI/TOOL AI 2026/CVF-Workspace/Document_Translator`.
That repository is explicitly out of scope and forbidden for this tranche and
for all lanes that have not received separate operator authorization.

### Adapter Consumption Rules

| Rule | Source anchor | Requirement |
| --- | --- | --- |
| Consume `DownstreamCapability` only | `document_intelligence_router.py` line 43 | adapters must not define equivalent enum values |
| Respect `downstream_eligibility` | `document_intelligence_router.py` line 111 | adapters must not widen the eligibility tuple produced by DIR |
| Carry `scan_decision_digest` | `document_intelligence_router.py` line 113 | traceability digest must accompany the adapter handoff |
| Carry `decision_version` | `document_intelligence_router.py` line 108 | version string must accompany the adapter handoff |
| Respect route disposition | `scan_route_decision.py` line 31 | adapters must not reissue or reinterpret scan route values |
| No OCR/provider bypass | `document_intelligence_router.py` lines 38-40 | adapters must not bypass hard-block gate values by calling OCR or providers directly |

### Blocked Adapter Actions

The following actions are forbidden for any downstream adapter at DICE-T0 and
remain blocked pending separate authorization:

- Redefining `ScanRouteDisposition`, `AuthorizationGate`, or
  `DownstreamCapability` values.
- Calling OCR, provider, or external API services.
- Reading, listing, hashing, or modifying the external Document Translator or
  Policy_Local trees.
- Bypassing `OPERATOR_REVIEW_REQUIRED` or hard-block gate values.
- Ingesting corpus records or triggering retrieval behavior changes.
- Claiming readiness, production status, cost improvement, or document
  correctness on behalf of DICE.

## Machine-Check Candidates For DICE-T1

These candidates define the behavioral assertions that a DICE-T1 implementation
checker should enforce. They are proposed at DICE-T0 as doc-only candidates;
they must not be coded in any checker until DICE-T1 is separately authorized.

| Candidate ID | Check description | Source anchor | Priority |
| --- | --- | --- | --- |
| DICE-MC-01 | Downstream adapter must not define a `ScanRouteDisposition` equivalent | `scan_route_decision.py` line 31 | HIGH |
| DICE-MC-02 | Downstream adapter must not define an `AuthorizationGate` equivalent | `document_intelligence_router.py` line 35 | HIGH |
| DICE-MC-03 | Downstream adapter must not define a `DownstreamCapability` equivalent | `document_intelligence_router.py` line 43 | HIGH |
| DICE-MC-04 | Envelope must not forward a handoff when `authorization_gate` is `OCR_REQUIRES_SEPARATE_AUTH`, `PROVIDER_REQUIRES_SEPARATE_AUTH`, or `BLOCKED` | `document_intelligence_router.py` lines 38-40 | HIGH |
| DICE-MC-05 | Envelope must not forward a handoff when `ScanOutcomeReport.operator_review_required` is `True` without surfacing the review requirement | `scan_outcome_report.py` line 51 | HIGH |
| DICE-MC-06 | `scan_decision_digest` must accompany every downstream handoff | `document_intelligence_router.py` line 113 | MEDIUM |
| DICE-MC-07 | `decision_version` must accompany every downstream handoff | `document_intelligence_router.py` line 108 | MEDIUM |
| DICE-MC-08 | Downstream adapter must not widen `downstream_eligibility` tuple | `document_intelligence_router.py` line 111 | MEDIUM |
| DICE-MC-09 | No OCR confidence threshold other than `mean_ocr_confidence` from `extraction_pipeline.py` may be introduced by any DICE artifact | `extraction_pipeline.py` line 111 | MEDIUM |
| DICE-MC-10 | `ScanOutcomeReport` findings must not be filtered or suppressed by the envelope | `scan_outcome_report.py` line 54 | HIGH |

## Finding-To-Governance Learning Disposition

| Finding | Governance learning | Disposition |
| --- | --- | --- |
| GC-018 and work order cite `build_scan_outcome_report` at line 137; actual source shows `def build_scan_outcome_report(` at line 131 with line 137 being the last parameter in the function signature | Source verification revealed a minor line-anchor discrepancy in dispatch artifacts. This matrix uses the verified line 131 for the function symbol. Codex reviewer should confirm and note during closure. | MINOR_FINDING_FOR_REVIEWER |
| DIR's `_derive_downstream_eligibility` logic always returns the requested capability when gate is `LOCAL_DETERMINISTIC_ALLOWED`, even for `OPERATOR_REVIEW_ONLY` and `ABSTAIN_OR_BLOCK` (lines 127-129 of `document_intelligence_router.py`). DICE-MC-08 must account for this invariant. | Machine-check candidate DICE-MC-08 must be scoped to prevent widening but must not conflict with DIR's existing eligibility derivation logic. Reviewer should verify DICE-MC-08 wording handles this correctly at DICE-T1. | ADVISORY_FOR_DICE_T1_REVIEWER |
| `ExtractionStorageBoundary` (line 152, `extraction_pipeline.py`) is not explicitly listed in the GC-018 source verification block, but it is consumed by `build_scan_outcome_report` and is an existing owner surface. | The boundary wrapper is an existing consumed surface. DICE-T0 matrix includes it in EnvelopeInputAuthority. No governance gap. | NOTED_NO_ACTION_REQUIRED |

## Claim Boundary

DICE-T0 is a doc-only control-envelope contract tranche. It does not authorize
runtime implementation, OCR/provider/API calls, external repo access, retrieval
behavior changes, corpus ingestion, public-sync, Document Translator
readiness, Policy_Local readiness, document correctness, extraction accuracy,
provider quality, production readiness, public readiness, release readiness,
cost claims, memory reinjection, high-risk promotion, or autonomous mutation.

New DICE labels (`DocumentIntelligenceControlEnvelope`, `EnvelopeInputAuthority`,
`EnvelopeReviewSignal`, `EnvelopeProviderCostBoundary`, `EnvelopeAdapterHandoff`)
are doc-only contract labels. None exist in current runtime source. None may be
added to any EXTENSIONS source, test, or checker until DICE-T1 is separately
authorized through a fresh GC-018 and source-verified work order.

rawMemoryReleased=false

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

This is a private provenance reference artifact. No public-sync batch or public
catalog claim is authorized. Public export requires a separate operator
decision, a public-sync remote, commit, and artifact path evidence.
