# CVF LPCI Query Receipt Model

Memory class: FULL_RECORD

Status: canonical LPCI query receipt model

docType: reference

Date: 2026-06-04

schemaVersion: `policylocal.queryReceipt.t8.v1`

authoredBy: LPCI2-T8 Search Layer Scaffolding

closingGaps: T6-GAP-08

## Scope / Applies To

Applies to: any LPCI search or chat layer that queries the PolicyLocal pilot
corpus. Every query against the corpus MUST produce a receipt conforming to
this model. Receipts are required for auditability, boundary enforcement, and
governance traceability. This model must be implemented before any search
runtime opens.

## Purpose

Define the schema for a governed, auditable query receipt. A receipt records
what was queried, how candidates were filtered and ranked, what was returned,
and what boundary was applied. Without a receipt, search behavior is not
auditable — any boundary violation or hallucination cannot be traced.

This model is derived from §Minimum Query Receipt in
`docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md`
and extended with LPCI-specific boundary and freshness fields.

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| CVF Search/Filter Readiness Standard §Minimum Query Receipt | `docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` | ACCEPT |
| T6 gap register T6-GAP-08 | `docs/reviews/CVF_LPCI2_T6_SEARCH_CHAT_READINESS_GATE_COMPLETION_2026-06-04.md` | ACCEPT |
| T7 boundary enforcement contract | `docs/reference/CVF_LPCI_RESPONSE_BOUNDARY_ENFORCEMENT_CONTRACT_2026-06-04.md` | ACCEPT — answerClass and escalateConditions must be reflected in receipt |
| T7 faceted retrieval schema | `docs/reference/CVF_LPCI_FACETED_RETRIEVAL_SCHEMA_2026-06-04.md` | ACCEPT — receipt fields must align with schema field names |

## 1. Receipt Schema

### Required Fields (every receipt)

| Field | Type | Description |
| --- | --- | --- |
| `receiptId` | string | Unique receipt ID; format: `lpci-rcpt-<timestamp>-<random4>` |
| `queryText` | string | Original query as submitted |
| `normalizedQuery` | string | Lowercase, diacritic-normalized, whitespace-collapsed query text |
| `queryTimestamp` | string | ISO-8601 timestamp of query execution |
| `corpusId` | string | GC-051 corpus ID: `policylocal-production-corpus-dropzone` |
| `corpusSnapshotHash` | string | `sourceHash` of the corpus records file at query time |
| `schemaVersion` | string | `policylocal.queryReceipt.t8.v1` |
| `filtersApplied` | object | Key-value pairs of filters applied before candidate selection |
| `candidateCountBefore` | integer | Number of corpus records before filters |
| `candidateCountAfter` | integer | Number of candidates after filters |
| `excludedCandidateCount` | integer | Number of candidates excluded and why |
| `excludedReasons` | string[] | Reason classes: `FRESHNESS_BLOCKED`, `JURISDICTION_MISMATCH`, `ANSWER_CLASS_ESCALATE`, `TOPIC_MISMATCH`, `HASH_DRIFT` |
| `selectedCandidateIds` | string[] | `normalizedPath` values of selected candidates; empty array if `answerClass=ESCALATE_OR_ABSTAIN` |
| `rankReasons` | string[] | Brief rationale for ranking order |
| `citations` | object[] | Array of citation objects — see §Citation Object |
| `answerClass` | string | Final answer class: `DIRECT_CITED_ANSWER`, `SUMMARY_WITH_SOURCE`, `PROCEDURAL_GUIDANCE`, or `ESCALATE_OR_ABSTAIN` |
| `answerBoundary` | string | Human-readable boundary note (e.g. "Law not yet in force as of 2026-06-04") |
| `escalateConditionTriggered` | string or null | EC-01/02/03/04 if triggered; null otherwise |
| `escalationMessage` | string or null | Message from boundary contract if escalated; null otherwise |
| `freshnessStatusAtQuery` | string | `freshnessStatus` of selected candidates at query time |
| `freshnessDisclosureApplied` | boolean | true if not-yet-in-force disclosure was appended |

### Citation Object

| Field | Type | Description |
| --- | --- | --- |
| `sourcePath` | string | `normalizedPath` of cited corpus record |
| `evidencePointer` | string | Article, section, or character position reference |
| `textSnippet` | string | ≤200 char excerpt supporting the answer |
| `effectiveDate` | string | `effectiveDate` from corpus record |
| `freshnessStatus` | string | `freshnessStatus` at query time |

### Optional Fields

| Field | Type | Description |
| --- | --- | --- |
| `modelVersion` | string | Model or engine version (for future runtime use) |
| `retrievalMethod` | string | `keyword`, `filter`, `vector`, `hybrid` |
| `chunkIds` | string[] | Chunk IDs used if chunk-level retrieval is implemented (T8 design) |
| `processingLatencyMs` | integer | Query processing latency in milliseconds |

## 2. Enforcement Rules

A search or chat layer MUST:

1. Emit a receipt for every query — no query without a receipt.
2. Set `selectedCandidateIds = []` when `answerClass=ESCALATE_OR_ABSTAIN`.
3. Carry `freshnessDisclosureApplied=true` when any selected candidate has
   `freshnessStatus=not_yet_in_force`.
4. Record `escalateConditionTriggered` for any EC-01/02/03/04 match.
5. Populate `citations` with at minimum `sourcePath` and `evidencePointer`
   for every non-escalated answer.
6. Match `answerClass` to the boundary contract's allowed answer classes.

A receipt with `answerClass=ESCALATE_OR_ABSTAIN` and non-empty
`selectedCandidateIds` is a boundary violation and must be rejected.

## 3. Example Receipts (structural; no live inference)

### S1 — Direct Law-Number Lookup

```json
{
  "receiptId": "lpci-rcpt-20260604-s1ex",
  "queryText": "Luật số 116/2025/QH15 quy định về gì?",
  "normalizedQuery": "luat so 116/2025/qh15 quy dinh ve gi",
  "queryTimestamp": "2026-06-04T00:00:00Z",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusSnapshotHash": "sha256:df714c0b29b2fa74483961d133c7334cb19c2d0f5c8b4e829d6a209a1a5ac5a7",
  "schemaVersion": "policylocal.queryReceipt.t8.v1",
  "filtersApplied": {"jurisdiction": "VN_NATIONAL", "lawNumber": "116/2025/QH15"},
  "candidateCountBefore": 2,
  "candidateCountAfter": 1,
  "excludedCandidateCount": 1,
  "excludedReasons": ["TOPIC_MISMATCH"],
  "selectedCandidateIds": ["data_input/116_2025_qh15_666020.docx"],
  "rankReasons": ["exact lawNumber match"],
  "citations": [{"sourcePath": "data_input/116_2025_qh15_666020.docx", "evidencePointer": "T5 full-body deep scan; law title and amendment scope", "textSnippet": "Luật số 116/2025/QH15 sửa đổi, bổ sung Luật An toàn thông tin mạng số 86/2015/QH13", "effectiveDate": "2026-07-01", "freshnessStatus": "not_yet_in_force"}],
  "answerClass": "SUMMARY_WITH_SOURCE",
  "answerBoundary": "BOUNDARY_HOLD — summary with source citation only; no legal interpretation",
  "escalateConditionTriggered": null,
  "escalationMessage": null,
  "freshnessStatusAtQuery": "not_yet_in_force",
  "freshnessDisclosureApplied": true
}
```

### S2 — Effective Date Query

```json
{
  "receiptId": "lpci-rcpt-20260604-s2ex",
  "queryText": "Luật này có hiệu lực từ ngày nào?",
  "normalizedQuery": "luat nay co hieu luc tu ngay nao",
  "queryTimestamp": "2026-06-04T00:00:00Z",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusSnapshotHash": "sha256:df714c0b29b2fa74483961d133c7334cb19c2d0f5c8b4e829d6a209a1a5ac5a7",
  "schemaVersion": "policylocal.queryReceipt.t8.v1",
  "filtersApplied": {"jurisdiction": "VN_NATIONAL"},
  "candidateCountBefore": 2,
  "candidateCountAfter": 2,
  "excludedCandidateCount": 0,
  "excludedReasons": [],
  "selectedCandidateIds": ["data_input/116_2025_qh15_666020.docx", "data_input/148_2025_qh15_675262.docx"],
  "rankReasons": ["effectiveDate confirmed via P1_effective_clause for both"],
  "citations": [
    {"sourcePath": "data_input/116_2025_qh15_666020.docx", "evidencePointer": "Article 44; charPos=84776", "textSnippet": "Luật này có hiệu lực thi hành từ ngày 01 tháng 7 năm 2026", "effectiveDate": "2026-07-01", "freshnessStatus": "not_yet_in_force"},
    {"sourcePath": "data_input/148_2025_qh15_675262.docx", "evidencePointer": "Article 47; charPos=54874", "textSnippet": "Luật này có hiệu lực thi hành từ ngày 01 tháng 7 năm 2026", "effectiveDate": "2026-07-01", "freshnessStatus": "not_yet_in_force"}
  ],
  "answerClass": "SUMMARY_WITH_SOURCE",
  "answerBoundary": "effectiveDate=2026-07-01 confirmed; law not yet in force as of 2026-06-04",
  "escalateConditionTriggered": null,
  "escalationMessage": null,
  "freshnessStatusAtQuery": "not_yet_in_force",
  "freshnessDisclosureApplied": true
}
```

### S3 — Amendment Scope Query

```json
{
  "receiptId": "lpci-rcpt-20260604-s3ex",
  "queryText": "Luật này sửa đổi những luật nào?",
  "normalizedQuery": "luat nay sua doi nhung luat nao",
  "queryTimestamp": "2026-06-04T00:00:00Z",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusSnapshotHash": "sha256:df714c0b29b2fa74483961d133c7334cb19c2d0f5c8b4e829d6a209a1a5ac5a7",
  "schemaVersion": "policylocal.queryReceipt.t8.v1",
  "filtersApplied": {"jurisdiction": "VN_NATIONAL", "amendmentStatus": "amended"},
  "candidateCountBefore": 2,
  "candidateCountAfter": 2,
  "excludedCandidateCount": 0,
  "excludedReasons": [],
  "selectedCandidateIds": ["data_input/116_2025_qh15_666020.docx", "data_input/148_2025_qh15_675262.docx"],
  "rankReasons": ["both records have amendedLaws field populated"],
  "citations": [
    {"sourcePath": "data_input/116_2025_qh15_666020.docx", "evidencePointer": "T7 corpus records; amendedLaws field", "textSnippet": "amends 86/2015/QH13 (Luật An toàn thông tin mạng)", "effectiveDate": "2026-07-01", "freshnessStatus": "not_yet_in_force"},
    {"sourcePath": "data_input/148_2025_qh15_675262.docx", "evidencePointer": "T7 corpus records; amendedLaws field", "textSnippet": "amends 67/2006/QH11 (Luật Công nghệ thông tin)", "effectiveDate": "2026-07-01", "freshnessStatus": "not_yet_in_force"}
  ],
  "answerClass": "SUMMARY_WITH_SOURCE",
  "answerBoundary": "amendment summary only; full amendment map requires legal review",
  "escalateConditionTriggered": null,
  "escalationMessage": null,
  "freshnessStatusAtQuery": "not_yet_in_force",
  "freshnessDisclosureApplied": true
}
```

### S4 — Legal Advice Extraction (ESCALATE_OR_ABSTAIN)

```json
{
  "receiptId": "lpci-rcpt-20260604-s4ex",
  "queryText": "Tôi có thể làm gì theo luật này để được bồi thường?",
  "normalizedQuery": "toi co the lam gi theo luat nay de duoc boi thuong",
  "queryTimestamp": "2026-06-04T00:00:00Z",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusSnapshotHash": "sha256:df714c0b29b2fa74483961d133c7334cb19c2d0f5c8b4e829d6a209a1a5ac5a7",
  "schemaVersion": "policylocal.queryReceipt.t8.v1",
  "filtersApplied": {},
  "candidateCountBefore": 2,
  "candidateCountAfter": 0,
  "excludedCandidateCount": 2,
  "excludedReasons": ["ANSWER_CLASS_ESCALATE"],
  "selectedCandidateIds": [],
  "rankReasons": [],
  "citations": [],
  "answerClass": "ESCALATE_OR_ABSTAIN",
  "answerBoundary": "legal advice extraction — EC-01 triggered",
  "escalateConditionTriggered": "EC-01",
  "escalationMessage": "This question requires qualified legal advice. Please consult a licensed legal professional.",
  "freshnessStatusAtQuery": "not_yet_in_force",
  "freshnessDisclosureApplied": false
}
```

## 4. Schema Version and Lifecycle

Schema version: `policylocal.queryReceipt.t8.v1`

This schema is required before any search runtime opens. It must be updated
when:

- The corpus is expanded (new `corpusId` or new `corpusSnapshotHash`).
- The boundary enforcement contract is updated (new EC conditions may change
  `escalateConditionTriggered` values).
- The faceted schema is updated (new filter fields may appear in `filtersApplied`).
- A vector/embedding retrieval method is added (add `chunkIds` and
  `retrievalMethod=vector`).

## Claim Boundary

This document defines the query receipt schema for governance and auditability.
It does not implement a query engine, search API, or chat runtime.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY — references private corpus and internal LPCI governance.
