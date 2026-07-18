# CVF Document Intelligence Router Contract Matrix

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-13

Owner: Claude (worker); Codex (reviewer/closer)

workOrder:
`docs/work_orders/CVF_AGENT_WORK_ORDER_DIR_T0_DOCUMENT_INTELLIGENCE_ROUTER_CONTRACT_MATRIX_FOR_CLAUDE_2026-06-13.md`

GC-018:
`docs/baselines/CVF_GC018_DIR_T0_DOCUMENT_INTELLIGENCE_ROUTER_CONTRACT_MATRIX_2026-06-13.md`

dispatchBaseHead: `51cd1ded`

rawMemoryReleased=false

## Purpose

Define the Document Intelligence Router (DIR) foundation contract matrix for
the Document Intelligence Router layer. This matrix covers three doc-only
contracts, an adapter eligibility matrix, owner reconciliation against current
EXA-T2 and EX-T9 surfaces, and machine-check candidates for the DIR-T1
implementation tranche.

Every field and symbol is labeled as EXISTING (lives in current source),
PROPOSED_DOC_ONLY (authorized for this doc-only tranche only), or REJECTED
(must not appear in any DIR artifact). No field labeled PROPOSED_DOC_ONLY is
a runtime symbol until DIR-T1 source work is separately authorized.

## Scope

In scope:
- owner reconciliation of current EXA-T2 and EX-T9 surfaces;
- three doc-only contract tables for `DocumentProfile`,
  `DocumentStructureSignals`, and `DocumentIntelligenceRouteDecision`;
- `DownstreamCapability` enum definition using capability names only;
- adapter eligibility matrix mapping use-case lanes to capabilities;
- machine-check candidate specifications;
- claim boundary and public export disposition.

Out of scope:
- runtime source code, test files, or EXTENSIONS tree changes;
- reading, listing, hashing, or modifying the external Document Translator or
  Policy_Local source trees;
- OCR execution, provider/API calls, retrieval behavior, corpus ingestion;
- public-sync, production readiness, or cost/quality claims;
- DIR-T1 or DIR-T2 implementation;
- session state, handoff, or public catalog changes.

## Owner Reconciliation

Current owner surfaces are source-verified and must not be duplicated or
replaced by any DIR contract.

| Symbol | Source file | Line | Responsibility | DIR relationship |
| --- | --- | --- | --- | --- |
| `SCAN_ROUTE_DECISION_VERSION` | `scan_route_decision.py` | 20 | scan route contract version | DIR must reference, never redefine |
| `ScanRouteDisposition` | `scan_route_decision.py` | 31 | route outcome Literal | DIR must passthrough verbatim, never copy values |
| `DocumentScanSignals` | `scan_route_decision.py` | 40 | pre-extraction scan signals | DIR consumes as input, never stores raw text |
| `ScanRouteDecision` | `scan_route_decision.py` | 58 | deterministic route decision | DIR consumes and digests, never re-issues |
| `decide_scan_route` | `scan_route_decision.py` | 71 | route decision function | DIR calls, never wraps with an equivalent function |
| `ExtractionStatus` | `extraction_pipeline.py` | 27 | extraction outcome Literal | DIR may reference for structure signal derivation only |
| `ExtractionQualityReport` | `extraction_pipeline.py` | 101 | quality gate report | DIR may reference coverage/quality fields for structure signal derivation; no coverage field may be redefined in DIR |
| `ExtractionStorageBoundary` | `extraction_pipeline.py` | 152 | canonical extraction output | DIR does not touch stored chunks or raw extraction output |
| `map_ocr_language_codes` | `extraction_pipeline.py` | 162 | governed OCR language table | DIR does not call; language hints in `DocumentProfile` are metadata only |
| `evaluate_extraction_quality` | `extraction_pipeline.py` | 235 | quality evaluation function | DIR does not call; quality is consumed from an already-produced `ExtractionQualityReport` |
| `ScanOutcomeReport` | `scan_outcome_report.py` | 43 | operator-visible scan report | DIR review packet supplements but does not replace this report |
| `build_scan_outcome_report` | `scan_outcome_report.py` | 131 | scan report builder | DIR does not call; scan outcome is an existing upstream artifact |

## Collision And Rejection Table

These items must never appear in any DIR source or documentation contract as
owned DIR values. If a DIR field would duplicate any row below, the field is
rejected.

| Rejected item | Reason | Existing owner |
| --- | --- | --- |
| Any Literal value equal to a `ScanRouteDisposition` value | Would duplicate scan-layer disposition -- B1 blocker | `ScanRouteDisposition` in `scan_route_decision.py:31` |
| `LOCAL_TEXT_EXTRACTION_RECOMMENDED` | Scan layer disposition | `ScanRouteDisposition` |
| `OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED` | Scan layer disposition | `ScanRouteDisposition` |
| `ESCALATE_OR_ABSTAIN` | Scan layer disposition | `ScanRouteDisposition` |
| `BLOCKED_UNSUPPORTED` | Scan layer disposition | `ScanRouteDisposition` |
| Raw document text as any field value | Never allowed at any DIR layer | CVF no-raw-content rule |
| OCR output or provider response as any field value | Never allowed at any DIR layer | CVF claim boundary |
| `page_coverage_ratio` redefined in DIR | Owned by `ExtractionQualityReport` | `extraction_pipeline.py:108` |
| `mean_ocr_confidence` redefined in DIR | Owned by `ExtractionQualityReport` | `extraction_pipeline.py:111` |
| Use-case application names as `DownstreamCapability` values | Couples foundation to apps -- B2 blocker | B2 fix: capability names only |
| `TRANSLATION_PREP` as a capability value | Use-case name, not capability shape | rejected by B2 fix |
| `POLICY_EVIDENCE_REVIEW` as a capability value | Use-case name, not capability shape | rejected by B2 fix |
| `DocumentIntent` as a standalone contract | Dissolved into `DocumentProfile.requested_capability` field | B2/B3 fix |

## Contract 1 - DocumentProfile

Purpose: carry the minimal metadata needed before any route decision. Contains
no raw document text. All fields are caller-supplied metadata or declared
intent -- never inferred from document content.

| Field | Label | Type | Owner | Notes |
| --- | --- | --- | --- | --- |
| `source_artifact_id` | PROPOSED_DOC_ONLY | str | DIR | stable artifact reference, no raw text |
| `source_hash` | PROPOSED_DOC_ONLY | str | DIR | SHA-256 of source; never contains content |
| `source_type` | PROPOSED_DOC_ONLY | str | DIR | e.g. "pdf", "docx"; mirrors `DocumentScanSignals.source_type` as metadata, does not duplicate scan logic |
| `language_hints` | PROPOSED_DOC_ONLY | tuple[str, ...] | DIR | caller-declared hints; not OCR output; does not replace `DocumentScanSignals.language_codes` |
| `page_count` | PROPOSED_DOC_ONLY | int | DIR | caller-declared; mirrors `DocumentScanSignals.page_count` as metadata only |
| `declared_artifact_role` | PROPOSED_DOC_ONLY | str | DIR | e.g. "legal_policy", "translation_source", "corpus_candidate" |
| `domain_hint` | PROPOSED_DOC_ONLY | str | DIR | generic domain label; not a legal-status or current-law claim |
| `requested_capability` | PROPOSED_DOC_ONLY | DownstreamCapability | DIR | intent expressed as a capability shape (see Contract 4); replaces standalone `DocumentIntent` |

Note: fields that duplicate `ExtractionQualityReport` coverage/confidence
values are REJECTED (see Collision table). `page_count` and `source_type` are
caller metadata duplicated here for routing convenience only -- the scan layer
remains authoritative for scan-quality conclusions drawn from those values.

## Contract 2 - DocumentStructureSignals

Purpose: carry structure signals intrinsic to the document artifact. These are
orthogonal to scan-quality signals -- the scan layer owns quality/coverage;
this contract owns document shape. No raw text is stored.

The contract may provide a `from_quality_report()` constructor in a later
DIR-T1 implementation that derives scan-quality-linked fields (such as
`scanned_page_ratio`) from an `ExtractionQualityReport`, to make the
relationship explicit without duplicating quality logic.

| Field | Label | Type | Notes |
| --- | --- | --- | --- |
| `has_tables` | PROPOSED_DOC_ONLY | bool | true if caller detects table structures |
| `has_images` | PROPOSED_DOC_ONLY | bool | true if caller detects image regions |
| `has_formulas` | PROPOSED_DOC_ONLY | bool | true if caller detects formula or symbol regions |
| `layout_preservation_risk` | PROPOSED_DOC_ONLY | Literal["LOW","MEDIUM","HIGH"] | caller assessment of layout sensitivity; advisory only |
| `scanned_page_ratio` | PROPOSED_DOC_ONLY | float or None | when supplied by scan layer, proportion of pages that were scanned rather than digitally extracted; derived from `ExtractionQualityReport`, not OCR execution |
| `citation_marker_present` | PROPOSED_DOC_ONLY | bool | true if citation or evidence markers were detected; does not imply legal validity |
| `missing_page_flag` | PROPOSED_DOC_ONLY | bool | true if extraction quality reported partial coverage; derived from `ExtractionQualityReport.quality_flags`, not independently computed |

Rejected fields:
- `page_coverage_ratio` -- REJECTED; owned by `ExtractionQualityReport:108`
- `mean_ocr_confidence` -- REJECTED; owned by `ExtractionQualityReport:111`
- any raw extracted text field -- REJECTED

Status note: `DocumentStructureSignals` is kept as a separate contract (not
folded into `DocumentProfile`) because structure is orthogonal to metadata +
intent, maps directly to `ExtractionQualityReport` for derived fields, and
is likely to grow independently (additional structure dimensions per pilot
findings). This is collapsible at DIR-T1 if tests show no independent
variation -- see Claude rebuttal B3 resolution.

## Contract 3 - DocumentIntelligenceRouteDecision

Purpose: produce a bounded, deterministic decision about the next allowed
document-intelligence path. Composes `ScanRouteDecision` rather than replacing
or duplicating it. The router adds exactly one new axis (authorization gate)
and one downstream eligibility axis.

| Field | Label | Type | Notes |
| --- | --- | --- | --- |
| `decision_version` | PROPOSED_DOC_ONLY | str | router contract version; distinct from `SCAN_ROUTE_DECISION_VERSION` |
| `scan_route` | PROPOSED_DOC_ONLY | ScanRouteDisposition | PASSTHROUGH -- set from source `ScanRouteDecision.route`, never modified by router |
| `authorization_gate` | PROPOSED_DOC_ONLY | AuthorizationGate | router-owned authority axis; see AuthorizationGate table below |
| `downstream_eligibility` | PROPOSED_DOC_ONLY | tuple[str, ...] | capability names that may receive handoff; values from `DownstreamCapability` only |
| `operator_action` | PROPOSED_DOC_ONLY | str | human-readable next action for non-coder operator |
| `scan_decision_digest` | PROPOSED_DOC_ONLY | str | SHA-256 of the source `ScanRouteDecision`; provides traceability without re-issuing the scan decision |
| `claim_boundary` | PROPOSED_DOC_ONLY | str | inherited claim-boundary text; must state this is a routing decision only |

### AuthorizationGate

This is the only new Literal the router is authorized to own. Its values
must be fully disjoint from `ScanRouteDisposition` (see Machine-Check
Candidate MC-1).

| Value | Label | Meaning |
| --- | --- | --- |
| `LOCAL_DETERMINISTIC_ALLOWED` | PROPOSED_DOC_ONLY | local deterministic logic only; no OCR or provider required |
| `OCR_REQUIRES_SEPARATE_AUTH` | PROPOSED_DOC_ONLY | scan indicated OCR eligibility; no live-proof work order exists yet; blocked until separately authorized |
| `PROVIDER_REQUIRES_SEPARATE_AUTH` | PROPOSED_DOC_ONLY | provider needed; blocked until separately authorized with live-proof work order |
| `OPERATOR_REVIEW_REQUIRED` | PROPOSED_DOC_ONLY | router cannot self-decide; requires operator checkpoint |
| `BLOCKED` | PROPOSED_DOC_ONLY | scan already blocked or source unsupported |

### AuthorizationGate Derivation Table (deterministic, no new confidence logic)

The router derives `authorization_gate` from `scan_route` via a total function.
The router never upgrades a scan route decision.

| Source `scan_route` | Derived `authorization_gate` |
| --- | --- |
| `LOCAL_TEXT_EXTRACTION_RECOMMENDED` | `LOCAL_DETERMINISTIC_ALLOWED` |
| `OCR_ELIGIBLE_OPERATOR_REVIEW_REQUIRED` | `OCR_REQUIRES_SEPARATE_AUTH` |
| `ESCALATE_OR_ABSTAIN` | `OPERATOR_REVIEW_REQUIRED` |
| `BLOCKED_UNSUPPORTED` | `BLOCKED` |

This table is a total map from all 4 `ScanRouteDisposition` values. If a new
value is added to `ScanRouteDisposition` in a future EXA-T2 version, the
derivation table must be updated before the router may handle it.

## Contract 4 - DownstreamCapability

Purpose: express intent as a capability shape rather than a use-case application
name. Use-case to capability mapping lives in the Adapter Eligibility Matrix
(below), not in this enum.

| Value | Label | Meaning |
| --- | --- | --- |
| `STRUCTURED_TEXT_HANDOFF` | PROPOSED_DOC_ONLY | handoff of text with structural metadata to a downstream consumer |
| `EVIDENCE_CITATION_HANDOFF` | PROPOSED_DOC_ONLY | handoff that preserves citation markers and evidence links |
| `CORPUS_SCAN_HANDOFF` | PROPOSED_DOC_ONLY | handoff to a corpus scan or indexing pipeline |
| `OPERATOR_REVIEW_ONLY` | PROPOSED_DOC_ONLY | no downstream automation; document goes to operator for review |
| `ABSTAIN_OR_BLOCK` | PROPOSED_DOC_ONLY | router cannot route this document; surface to operator |

Rejected values:
- `TRANSLATION_PREP` -- REJECTED; use-case name, not capability shape
- `POLICY_EVIDENCE_REVIEW` -- REJECTED; use-case name, not capability shape
- any value that names a specific application, workspace, or external repo --
  REJECTED; use-case names belong only in adapter matrix rows

## Adapter Eligibility Matrix

Purpose: map use-case lanes to the capabilities they require. Use-case names
appear only in this table as adapter rows, never in the foundation capability
enum.

This table references only already-published contract names for each lane. It
does not read, list, hash, or modify any file under
`D:\...\CVF-Workspace\Document_Translator`, the Policy_Local source tree, or
any external workspace. If a required capability or contract is not yet
published by a lane, the cell records `ADAPTER_CONTRACT_NOT_YET_PUBLISHED`.

| Use-case lane | Required capability | Allowed outputs | Forbidden outputs | Required operator checkpoint | Live-proof requirement | Current readiness |
| --- | --- | --- | --- | --- | --- | --- |
| Document Translator DT-CVF | `STRUCTURED_TEXT_HANDOFF` | structured text with provenance metadata | raw OCR output, provider response, raw document bytes | ADAPTER_CONTRACT_NOT_YET_PUBLISHED | required before any provider/OCR output claim | ADAPTER_CONTRACT_NOT_YET_PUBLISHED |
| Policy_Local PL-S | `EVIDENCE_CITATION_HANDOFF` | text with citation markers, source hash, domain hint | legal-status conclusions, current-law claims | ADAPTER_CONTRACT_NOT_YET_PUBLISHED | required before any current-law evidence claim | ADAPTER_CONTRACT_NOT_YET_PUBLISHED |
| Corpus intelligence scan | `CORPUS_SCAN_HANDOFF` | document profile, structure signals, scan decision digest | raw document content, extraction chunks | scan outcome report already available from EX-T9 | not required for local scan routing | ADAPTER_CONTRACT_NOT_YET_PUBLISHED |
| Memory / retrieval pack | `STRUCTURED_TEXT_HANDOFF` or `EVIDENCE_CITATION_HANDOFF` | provenance-annotated text handoff | raw document bytes, OCR confidence internals | operator review required if `OCR_REQUIRES_SEPARATE_AUTH` | required if retrieval runtime is claimed | ADAPTER_CONTRACT_NOT_YET_PUBLISHED |
| Operator review only | `OPERATOR_REVIEW_ONLY` | scan outcome report, document profile summary | none beyond report | always required | none | available via existing `ScanOutcomeReport` surface |

Note: all DT-CVF and PL-S adapter contracts are labeled
`ADAPTER_CONTRACT_NOT_YET_PUBLISHED` because neither lane has published a
stable capability contract referenceable from CVF foundation. These cells will
be updated when those contracts are published, not by inspecting external
source trees.

## Machine-Check Candidates

These are specifications for machine checks to be implemented in DIR-T1 (or as
standalone governance checkers). Each candidate is a PROPOSED check -- none is
active until a future authorized work order implements it.

### MC-1 - Scan Disposition Overlap Check

Target: prevent any `AuthorizationGate` Literal value from appearing in
`ScanRouteDisposition`.

```python
# Proposed check for governance/compat/check_dir_disposition_no_scan_overlap.py
# Fails if any AuthorizationGate value is also a ScanRouteDisposition value.
from scan_route_decision import ScanRouteDisposition
# AuthorizationGate imported from future router module

scan_values = set(get_literal_args(ScanRouteDisposition))
gate_values = set(get_literal_args(AuthorizationGate))
overlap = scan_values & gate_values
assert not overlap, f"Router gate re-encodes scan disposition: {overlap}"
# Must PASS: the two sets are fully disjoint
```

Activation condition: when DIR-T1 defines `AuthorizationGate` as a runtime
Literal, wire this check into the pre-commit hook chain.

### MC-2 - Use-Case Name Leakage Check

Target: prevent use-case application names from appearing as `DownstreamCapability`
Literal values.

```python
# Proposed check for governance/compat/check_dir_capability_no_usecase_names.py
# Fails if any DownstreamCapability value contains a known use-case identifier.
USECASE_TOKENS = frozenset({
    "TRANSLATION", "POLICY", "TRANSLATOR", "PL_S", "DT_CVF",
    "DOCUMENT_TRANSLATOR",
})
for value in get_literal_args(DownstreamCapability):
    for token in USECASE_TOKENS:
        assert token not in value.upper(), (
            f"DownstreamCapability value '{value}' contains use-case token '{token}'"
        )
```

Activation condition: when DIR-T1 defines `DownstreamCapability` as a runtime
Literal, wire this check into the pre-commit hook chain.

### MC-3 - Raw Content And Provider Output Prohibition Check

Target: prevent any DIR contract field from accepting raw document text, OCR
output, or provider response as a value.

Implementation approach: a static analysis check that greps DIR source for any
field typed as `str` that lacks a doc-annotation explicitly excluding raw
content, or a field named with tokens like `raw_text`, `ocr_output`,
`provider_response`, `extracted_text`.

```python
# Proposed check for governance/compat/check_dir_no_raw_content_fields.py
FORBIDDEN_FIELD_TOKENS = frozenset({
    "raw_text", "ocr_output", "provider_response", "extracted_text",
    "raw_content", "raw_ocr",
})
# Scan DIR source module for dataclass fields matching any forbidden token
# Fail if any match is found without an explicit REJECTED annotation
```

Activation condition: when DIR-T1 adds source code, wire this check into the
pre-commit hook chain.

## Findings / Position

No blocking findings were encountered during DIR-T0 contract matrix work.
All proposed contracts are labeled PROPOSED_DOC_ONLY; no existing runtime
symbol is redefined; all four blocker resolutions (B1-B4) from the Claude
rebuttal are represented in the contract structure.

Minor observation: `DocumentProfile.page_count` and `source_type` superficially
mirror fields in `DocumentScanSignals`. This is intentional -- they serve as
caller-declared metadata for routing context, and the scan layer remains
authoritative for quality conclusions drawn from those values. This is not a
duplication violation; it is a common pattern where metadata is declared at the
entry point and quality is measured by a separate module.

## Required Corrective

None. No blocker or defect was found during DIR-T0 contract matrix work that
requires corrective action before Codex review.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action |
| --- | --- | --- | --- | --- |
| No blocking finding during DIR-T0 contract work | N/A | N/A | N/A_WITH_REASON | No governance promotion needed from this tranche; MC-1/MC-2/MC-3 candidates carry forward the B1/B2 rebuttal learnings to DIR-T1 |

Runtime/provider/cost lane: `N/A_WITH_REASON` - no provider, OCR service,
retrieval runtime, or cost-bearing service was used.

## Verification / Evidence

- Owner reconciliation derived from re-verified source lines:
  `scan_route_decision.py:20,31,40,58,71`; `extraction_pipeline.py:27,101,152,162,235`;
  `scan_outcome_report.py:43,131`.
- Pre-implementation autorun gate PASS at HEAD `57799f67` (base `51cd1ded`).
- No EXTENSIONS file modified; no external Document Translator or Policy_Local
  file read, listed, hashed, or modified.
- All collision-table items traced to current source; all PROPOSED_DOC_ONLY
  items confirmed absent from current extraction foundation source (grep
  returned no matches for `DocumentProfile`, `DocumentStructureSignals`,
  `DocumentIntelligenceRouteDecision`, `DownstreamCapability`,
  `AuthorizationGate`, `authorization_gate`, `scan_decision_digest`).

## Claim Boundary

This contract matrix defines doc-only contract proposals for the Document
Intelligence Router foundation. It does not prove document intelligence
behavior, implement router source code, improve extraction accuracy, execute or
authorize OCR, call or authorize providers, change retrieval behavior, prove
Policy_Local readiness, prove Document Translator readiness, authorize
public-sync, claim production or release readiness, authorize memory
reinjection, authorize high-risk promotion, or authorize autonomous mutation.

All PROPOSED_DOC_ONLY fields are planning artifacts only. They have no runtime
existence until DIR-T1 source work is separately authorized by a fresh GC-018
and source-verified work order.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance contract matrix for DIR-T0; no public-sync batch is
authorized by this tranche.
