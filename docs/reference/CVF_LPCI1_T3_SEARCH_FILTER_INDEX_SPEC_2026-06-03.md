# CVF LPCI1-T3 Search and Filter Index Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `1cedefd8`

## Purpose

Define the search and filter index specification for LPCI1. This document
establishes:

- the faceted index schema: index fields derived from T2 classification, facet
  definitions, sort contract;
- the query filter contract: filter parameters, application order, sensitivity
  pre-filter, answerClass post-filter;
- the negative search evidence format: structured receipts for no-results,
  filtered-out, and escalated/abstained query outcomes.

These definitions feed the T4 retrieval boundary spec and T5 chatbot prototype.
This is a documentation artifact only. No runtime code, real corpus indexing,
vector store, or embedding pipeline is created.

---

## Source

| Authority | Path | Verified state |
| --- | --- | --- |
| T2 domain classification spec | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | ACTIVE |
| T1 architecture | `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md` | ACTIVE |
| T1 corpus intake spec | `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` | ACTIVE |
| CI2-T3 enforced model | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` | ACTIVE |
| LPCI1 GC-018 | `docs/baselines/CVF_GC018_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_2026-06-02.md` | ACTIVE |
| NR-05 standard | `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md` | ACTIVE |
| NR-11 standard | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` | ACTIVE |

---

## Scope

Applies to: LPCI1 T3+ specification and T5 implementation tranche. Defines
the index schema and filter contract that any future implementation must follow.

Out of scope: implementation of the index, vector embedding, semantic search
algorithm, or real corpus ingestion.

---

## Faceted Index Schema

### Index Fields

Every index record represents one classified corpus document. Fields are derived
from T1 intake record schema and T2 classification scheme:

| Field | Type | Source | Indexed | Faceted | Sortable |
| --- | --- | --- | --- | --- | --- |
| `normalizedPath` | string | NR-05 (T1) | yes | no | no |
| `sourceHash` | string | NR-04 (T1) | yes | no | no |
| `documentType` | enum | T2 | yes | yes | no |
| `jurisdiction` | string | T2 | yes | yes | no |
| `authorityLevel` | string | T2 | yes | yes | yes (DESC) |
| `issuingBody` | string | T2 | yes | yes | no |
| `effectiveDate` | string (ISO 8601) | T2 | yes | no | yes (DESC) |
| `status` | enum | T2 | yes | yes | no |
| `answerClass` | enum | T2 / GC-050 | yes | yes | no |
| `rawDisposition` | enum | NR-11 (T2) | yes | no | no |
| `dispositionAlias` | enum | NR-11 (T2) | yes | yes | no |
| `sensitivityLevel` | enum | NR-06 (T2) | yes | yes | no |
| `ownerSurface` | enum | NR-03 (T2) | yes | no | no |
| `knowledgeRegion` | string | T2 | yes | yes | no |
| `titleSnippet` | string | intake | yes (fulltext) | no | no |
| `contentSnippet` | string | intake | yes (fulltext) | no | no |

**Notes:**
- `titleSnippet` and `contentSnippet` are short text extracts for fulltext
  search; exact extraction method is T5 implementation scope.
- `contentSnippet` must not exceed 512 characters per record; it is a display
  hint only, not the full document text.
- All enum fields use the canonical values from T2 classification spec.

### Facet Definitions

| Facet ID | Index field | Facet type | Allowed values source |
| --- | --- | --- | --- |
| `facet.documentType` | `documentType` | multi-select | T2 documentType enum |
| `facet.jurisdiction` | `jurisdiction` | multi-select | T2 jurisdiction taxonomy |
| `facet.status` | `status` | multi-select | `effective`, `draft`, `amended`, `superseded`, `repealed`, `obsolete`, `unknown` |
| `facet.answerClass` | `answerClass` | multi-select | T2 answerClass enum (4 values) |
| `facet.dispositionAlias` | `dispositionAlias` | multi-select | `ACCEPT`, `ACCEPT_DEFERRED` |
| `facet.sensitivityLevel` | `sensitivityLevel` | multi-select | T2 sensitivity enum |
| `facet.knowledgeRegion` | `knowledgeRegion` | multi-select | `LEGAL_POLICY_CORPUS` (T2) |
| `facet.authorityLevel` | `authorityLevel` | multi-select | operator-defined values |
| `facet.issuingBody` | `issuingBody` | multi-select | operator-defined values |

### Sort Contract

| Sort key | Index field | Default direction |
| --- | --- | --- |
| `sort.authority` | `authorityLevel` | DESC (highest authority first) |
| `sort.recency` | `effectiveDate` | DESC (most recent first) |
| `sort.relevance` | fulltext score | DESC (highest score first; T5 implementation scope) |

Default sort order for LPCI queries: `sort.authority` DESC, then `sort.recency` DESC.

### Index Record Example (planning notation — no executable file)

```json
{
  "normalizedPath": "legal_corpus/vn/decree_97_2021_nd_cp.md",
  "sourceHash": "sha256:abc123...",
  "documentType": "decree",
  "jurisdiction": "national",
  "authorityLevel": "decree",
  "issuingBody": "Government of Vietnam",
  "effectiveDate": "2021-11-01",
  "status": "effective",
  "answerClass": "DIRECT_CITED_ANSWER",
  "rawDisposition": "ACCEPT",
  "dispositionAlias": "ACCEPT",
  "sensitivityLevel": "public",
  "ownerSurface": "GOVERNANCE_LAYER",
  "knowledgeRegion": "LEGAL_POLICY_CORPUS",
  "titleSnippet": "Decree No. 97/2021/ND-CP on...",
  "contentSnippet": "Article 5. Entities subject to..."
}
```

---

## Query Filter Contract

### Filter Parameters

Clients (T5 chatbot API) may supply the following filter parameters per query:

| Parameter | Applies to facet | Type | Default |
| --- | --- | --- | --- |
| `filter.documentType` | `facet.documentType` | string[] | none (all types) |
| `filter.jurisdiction` | `facet.jurisdiction` | string[] | none (all jurisdictions) |
| `filter.status` | `facet.status` | string[] | `["effective"]` |
| `filter.answerClass` | `facet.answerClass` | string[] | none (but ESCALATE_OR_ABSTAIN post-filter always applied) |
| `filter.sensitivityLevel` | `facet.sensitivityLevel` | string[] | restricted by access tier |
| `filter.authorityLevel` | `facet.authorityLevel` | string[] | none |
| `filter.issuingBody` | `facet.issuingBody` | string[] | none |
| `filter.dateFrom` | `effectiveDate` | ISO 8601 date | none |
| `filter.dateTo` | `effectiveDate` | ISO 8601 date | none |

### Filter Application Rules

Filters are applied in this mandatory order:

**Stage 1 — Sensitivity Pre-Filter (mandatory, before any search)**

Applied before fulltext/semantic search to exclude records the requester is
not authorized to see:

- Records with `sensitivityLevel = classified` are excluded unless operator
  has granted `classification_access` authorization.
- Records with `sensitivityLevel = confidential` are excluded unless operator
  has granted `confidential_access` authorization for the specific corpus.
- Records with `sensitivityLevel = restricted` are excluded unless the
  corpus was registered with retrieval authorization at GC-051 time.
- Records with `sensitivityLevel = public` are always included.

If the sensitivity pre-filter removes all candidate records, the system must
return a `FILTERED_OUT` receipt (see Negative Search Evidence Format).

**Stage 2 — Status Filter (default)**

By default, only `status = effective` records are returned. The client may
explicitly include other statuses via `filter.status`. Records with
`status = repealed | obsolete | draft | unknown` must be flagged with a
`staleStatusWarning` field in the response.

**Stage 3 — Fulltext / Semantic Search**

Apply query against indexed `titleSnippet` and `contentSnippet` fields.
Semantic search is T5 implementation scope; T3 defines the contract only.
Result set ranked by `sort.authority` DESC, `sort.recency` DESC.

**Stage 4 — answerClass Post-Filter (mandatory, after search)**

Applied after search to enforce the retrieval answer boundary from T1:

- Records with `answerClass = ESCALATE_OR_ABSTAIN` must NOT appear as direct
  answer candidates. They may be cited in an `ESCALATE_OR_ABSTAIN` receipt.
- Records with `dispositionAlias = ACCEPT_DEFERRED` must be downgraded to
  `SUMMARY_WITH_SOURCE` or `ESCALATE_OR_ABSTAIN` — never `DIRECT_CITED_ANSWER`.
- If ALL remaining records after Stage 3 have `answerClass = ESCALATE_OR_ABSTAIN`,
  the system must return an `ESCALATED` receipt.

**Stage 5 — Client Facet Filters**

Apply any additional `filter.*` parameters supplied by the client.

### Filter Contract Summary Table

| Stage | Filter | Mandatory | Override allowed |
| --- | --- | --- | --- |
| 1 | Sensitivity pre-filter | yes | by operator authorization only |
| 2 | Status filter (default: effective) | default | client may widen |
| 3 | Fulltext / semantic search | yes | N/A |
| 4 | answerClass post-filter | yes | never |
| 5 | Client facet filters | optional | client controls |

---

## Negative Search Evidence Format

All negative outcomes must return a structured receipt. The receipt is a
read-only JSON object — it does not contain legal advice.

### Receipt: NO_RESULTS

Returned when the search (Stage 3) finds zero matching records after sensitivity
pre-filter and status filter.

```json
{
  "receiptType": "NO_RESULTS",
  "query": "<original query string>",
  "appliedFilters": { "<filter params as supplied>" },
  "sensitivityPreFilterApplied": true,
  "matchCount": 0,
  "message": "No indexed records matched the query after applying active filters.",
  "suggestedActions": [
    "Widen filter.status to include amended or draft records",
    "Check GC-051 corpus registration for target jurisdiction",
    "Verify corpus was classified and indexed in T3+ tranche"
  ],
  "auditTimestamp": "<ISO 8601>"
}
```

### Receipt: FILTERED_OUT

Returned when records exist but all are excluded by the sensitivity pre-filter
(Stage 1) due to insufficient authorization.

```json
{
  "receiptType": "FILTERED_OUT",
  "query": "<original query string>",
  "appliedFilters": { "<filter params as supplied>" },
  "sensitivityPreFilterApplied": true,
  "filteredCount": "<number of records excluded>",
  "filteredSensitivityLevels": ["restricted", "confidential"],
  "matchCount": 0,
  "message": "Records exist but were excluded by sensitivity pre-filter. Operator authorization required.",
  "suggestedActions": [
    "Request operator authorization for confidential or restricted corpus",
    "Check GC-051 registration for retrieval authorization"
  ],
  "auditTimestamp": "<ISO 8601>"
}
```

### Receipt: ESCALATED

Returned when records match but all have `answerClass = ESCALATE_OR_ABSTAIN`
(Stage 4 post-filter removes all direct answer candidates).

```json
{
  "receiptType": "ESCALATED",
  "query": "<original query string>",
  "matchedPaths": ["<normalizedPath1>", "<normalizedPath2>"],
  "escalationReasons": [
    { "normalizedPath": "<path>", "status": "<status>", "answerClass": "ESCALATE_OR_ABSTAIN", "reason": "<repealed|superseded|draft|unknown|out-of-jurisdiction|DEFER>" }
  ],
  "message": "All matched records require escalation or abstention. No direct answer can be provided.",
  "suggestedActions": [
    "Consult a qualified legal professional for advice on these documents",
    "Check if a successor document exists for superseded records",
    "Verify jurisdiction scope matches the query context"
  ],
  "auditTimestamp": "<ISO 8601>"
}
```

### Receipt: STALE_STATUS_WARNING

Appended to any successful response when one or more matched records carry
`status = amended | superseded` (T1 freshness warning contract):

```json
{
  "staleStatusWarning": true,
  "staleRecords": [
    { "normalizedPath": "<path>", "status": "amended", "effectiveDate": "<date>" }
  ],
  "message": "One or more source records may not reflect the latest amendment. Verify currentness before relying on this response."
}
```

---

## Requirements

| Requirement | Applicable to |
| --- | --- |
| Sensitivity pre-filter before any search (Stage 1) | all LPCI query executions |
| answerClass post-filter (Stage 4) mandatory | all LPCI query executions; no override |
| `ESCALATE_OR_ABSTAIN` records excluded from direct answer candidates | all LPCI query executions |
| `ACCEPT_DEFERRED` records downgraded to `SUMMARY_WITH_SOURCE` or `ESCALATE_OR_ABSTAIN` | all LPCI query executions |
| Negative receipt returned for NO_RESULTS, FILTERED_OUT, ESCALATED outcomes | T5 implementation |
| `STALE_STATUS_WARNING` appended for amended/superseded matches | T5 implementation |
| All index fields populated from T2 classification ledger | T3+ corpus packets |
| Default sort: `authorityLevel` DESC then `effectiveDate` DESC | T5 implementation |

---

## Enforcement

| Rule | Checker / gate |
| --- | --- |
| T2 classification fields populated | `governance/compat/check_corpus_intelligence_classification.py` (GC-050) at T3+ corpus packet close |
| NR-11 `dispositionAlias` in index records | `governance/compat/check_corpus_packet_disposition_canonical.py` |
| NR-05 `normalizedPath` in index records | `governance/compat/check_corpus_packet_normalized_path.py` |
| NR-04 `sourceHash` in index records | `governance/compat/check_corpus_packet_source_hash.py` |
| Governance structural completeness | `governance/compat/check_markdown_structural_completeness.py` |
| Pre-implementation autorun | `governance/compat/run_agent_autorun_workflow_gate.py` |

**Future enforcement note**: Stage 1 sensitivity pre-filter, Stage 4 answerClass
post-filter, and negative receipt format are specification constraints only in
this tranche. Runtime enforcement code is T5 implementation scope. A dedicated
filter-contract checker is a candidate for T5 scope.

---

## Verification

This specification is a planning artifact. Verification at this tranche:

- Index fields cross-checked against T2 classification spec and T1 intake record schema.
- Facet definitions aligned with T2 documentType enum, jurisdiction taxonomy, status,
  answerClass, dispositionAlias, sensitivityLevel values.
- Filter application order consistent with T1 architecture retrieval boundary.
- Negative receipt formats cover all ESCALATE_OR_ABSTAIN and sensitivity cases
  from T2 decision matrix.
- No real corpus indexed; schema is planning-level.

Runtime filter correctness and negative receipt emission verified per corpus
packet in T5 implementation after operator commits and T4 retrieval boundary
closes.

---

## Non-Goals

- Implement any runtime index code.
- Index a real legal corpus (no GC-051 registration or scan in this tranche).
- Implement semantic search, embedding, or vector retrieval.
- Define a production query optimization or caching strategy.
- Provide tested query accuracy or recall metrics.
- Add new NR rules (all rules adopted from existing standards).

---

## Claim Boundary

This document claims:

- faceted index schema with all T2 classification fields, facet definitions,
  and sort contract at planning level;
- query filter contract with five-stage application order, mandatory sensitivity
  pre-filter, and mandatory answerClass post-filter;
- negative search evidence format for NO_RESULTS, FILTERED_OUT, ESCALATED, and
  STALE_STATUS_WARNING receipts.

This document does NOT claim:

- runtime index correctness or tested search/filter behavior;
- semantic search or vector retrieval correctness;
- legal answer accuracy or production readiness;
- tested negative receipt emission.

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 search/filter index specification existed
before this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T3 establishes faceted index schema, query
filter contract, and negative search evidence format at planning level

Next control action: `OPEN` — T4 retrieval boundary spec is the next authorized
dispatch after T3 closes

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: documentation and specification artifact only; no provider calls,
runtime behavior changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: spec references private corpus intelligence governance chain.

Public-sync boundary: no artifacts from this batch are queued for public-sync.

---

## Related

- `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md`
- `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md`
- `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md`
- `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`
- `docs/work_orders/CVF_WO_LPCI1_T3_SEARCH_FILTER_INDEX_2026-06-03.md`
