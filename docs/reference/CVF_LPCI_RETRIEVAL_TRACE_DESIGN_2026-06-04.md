# CVF LPCI Retrieval Trace Design

Memory class: FULL_RECORD

Status: canonical LPCI retrieval trace design

docType: reference

Date: 2026-06-04

designVersion: `policylocal.retrievalTrace.t8.v1`

authoredBy: LPCI2-T8 Search Layer Scaffolding

closingGaps: T6-GAP-06

## Scope / Applies To

Applies to: the PolicyLocal LPCI pilot corpus retrieval layer. This document
defines the chunk schema, index design, and full trace chain from corpus record
to answer receipt. It is a governance design document — it does not implement
a search engine. A future search implementation work order will use this design
as its authoritative specification.

## Purpose

Define how corpus records are broken into retrievable units (chunks), how those
units are indexed for filter-and-rank retrieval, and how a full trace is
preserved from source document to answer receipt. This closes T6-GAP-06
(derived retrieval trace absent) and provides the upstream dependency that
T8 completion enables a READY verdict.

This design intentionally defers vector/embedding retrieval. The initial
retrieval method is keyword + filter, which is sufficient for the current
2-document, 2-law VN_NATIONAL corpus. Vector retrieval can be layered on top
in a future tranche once the filter layer is proven.

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| T6 gap register T6-GAP-06 | `docs/reviews/CVF_LPCI2_T6_SEARCH_CHAT_READINESS_GATE_COMPLETION_2026-06-04.md` | ACCEPT |
| T7 faceted retrieval schema | `docs/reference/CVF_LPCI_FACETED_RETRIEVAL_SCHEMA_2026-06-04.md` | ACCEPT — chunk must inherit topicTags, knowledgeRegion, answerClass from parent record |
| T8 query receipt model | `docs/reference/CVF_LPCI_QUERY_RECEIPT_MODEL_2026-06-04.md` | ACCEPT — receipt `chunkIds` field references chunk IDs defined here |
| T7 boundary enforcement contract | `docs/reference/CVF_LPCI_RESPONSE_BOUNDARY_ENFORCEMENT_CONTRACT_2026-06-04.md` | ACCEPT — boundary is enforced at the trace exit point |
| T5 corpus records | `Policy_Local/data/generated/policylocal-corpus-records.json` schemaVersion t5.v1 | ACCEPT — source text and hashes are the chunk input |

## 1. Chunk Schema

A chunk is a fixed-size or logical-boundary excerpt from a corpus record.
Chunks are the atomic retrieval units — a query returns matching chunks, not
whole documents.

### Fields

| Field | Type | Description |
| --- | --- | --- |
| `chunkId` | string | `<familyId>/<normalizedFilename>/<chunkIndex>` — e.g. `vn-national-assembly-2025/116_2025_qh15_666020/0042` |
| `sourcePath` | string | `normalizedPath` of the parent corpus record |
| `sourceHash` | string | `sourceHash` of the parent corpus record (drift anchor) |
| `parentRecordHash` | string | `textHash` of the parent corpus record text |
| `chunkIndex` | integer | Zero-based chunk sequence number within the document |
| `startChar` | integer | Start character position in the parent document text |
| `endChar` | integer | End character position (exclusive) |
| `chunkText` | string | The chunk text (≤2000 chars recommended; hard limit 4000) |
| `chunkHash` | string | `sha256:<hex>` of `chunkText` |
| `topicTags` | string[] | Inherited from parent corpus record; may be overridden for article-level chunks |
| `knowledgeRegion` | string | Inherited from parent corpus record |
| `answerClass` | string | Inherited from parent corpus record; `ESCALATE_OR_ABSTAIN` overrides allowed at chunk level for sensitive sections |
| `articleRef` | string or null | Article number if chunk boundary aligns with an article boundary (e.g. `Điều 44`) |
| `freshnessStatus` | string | Inherited from parent corpus record |
| `schemaVersion` | string | `policylocal.chunk.t8.v1` |

### Chunking Strategy

For the PolicyLocal VN_NATIONAL corpus (Vietnamese legal text), use
**article-boundary chunking** as the primary strategy:

1. Split on `Điều <N>.` patterns (article boundaries).
2. If an article exceeds 2000 characters, split further at paragraph breaks
   (`\n\n` or numbered sub-clauses like `1.`, `2.`).
3. Preserve `articleRef` for every chunk whose start aligns with an article boundary.
4. Minimum chunk size: 100 characters (skip empty or whitespace-only articles).

This strategy produces semantically coherent chunks aligned to legal article
structure, which is the natural query granularity for VN law corpora.

## 2. Index Design

The initial index is a **filter-first, keyword-rank** design. No vector
embeddings are required for the current 2-document corpus.

### Index Entry

| Field | Type | Index role |
| --- | --- | --- |
| `chunkId` | string | Primary key |
| `sourcePath` | string | Filter key — scope by document |
| `topicTags` | string[] | Filter key — scope by topic |
| `knowledgeRegion` | string | Filter key — scope by region |
| `freshnessStatus` | string | Filter key — exclude stale/not_yet_in_force (or include with disclosure) |
| `jurisdiction` | string | Filter key — scope by jurisdiction |
| `answerClass` | string | Filter key — exclude ESCALATE_OR_ABSTAIN from candidate set |
| `articleRef` | string | Filter key — lookup by article number |
| `chunkText` | string | Keyword match target (BM25 or simple substring match) |
| `chunkHash` | string | Integrity check |

### Lookup Sequence

```
1. Apply hard filters (jurisdiction, knowledgeRegion, answerClass ≠ ESCALATE)
2. Apply soft filters (topicTags match, freshnessStatus acceptable)
3. Keyword match chunkText against normalizedQuery
4. Rank by: (a) exact articleRef match > (b) topicTags overlap > (c) keyword frequency
5. Return top-N chunks (default N=5; configurable)
6. Apply boundary contract check on ranked candidates
7. Emit query receipt with chunkIds, citations, answerClass
```

### Key Design Decisions

- **No vector store in T8 scope.** Keyword + filter retrieval is sufficient
  for 2 documents. Vector retrieval adds cost and complexity before the
  governance layer is proven.
- **freshnessStatus=not_yet_in_force is allowed in candidate set** but
  triggers `freshnessDisclosureApplied=true` in the receipt and appends
  the disclosure note to the answer.
- **answerClass=ESCALATE_OR_ABSTAIN chunks are indexed but filtered out**
  before ranking. They appear in `excludedCandidates` with reason
  `ANSWER_CLASS_ESCALATE`.

## 3. Full Trace Chain

```
SOURCE DOCUMENT (DOCX file)
  │
  ▼ T5 deep scan (policylocal-docx-deep-scan.py)
CORPUS RECORD (policylocal-corpus-records.json, t8.v1)
  │  fields: sourcePath, sourceHash, textHash, processingStatus=READ_DEEP,
  │          answerClass, topicTags, freshnessStatus, effectiveDate, ...
  │
  ▼ chunking (article-boundary split)
CHUNK ROWS (policylocal-chunks.json, t8.v1) — [T8 design; not yet generated]
  │  fields: chunkId, startChar, endChar, chunkText, articleRef, ...
  │
  ▼ index build (keyword + filter index)
INDEX ENTRIES (in-memory or file-backed key-value store)
  │  keys: topicTags, jurisdiction, freshnessStatus, answerClass, chunkText
  │
  ▼ query execution
FILTER PASS (hard filters → soft filters → keyword match)
  │  input: normalizedQuery + filtersApplied
  │  output: ranked candidate chunkIds
  │
  ▼ boundary contract check
BOUNDARY ENFORCEMENT
  │  input: ranked candidates, boundary contract
  │  output: final answerClass, escalateConditionTriggered, citations
  │
  ▼ receipt emission
QUERY RECEIPT (policylocal.queryReceipt.t8.v1)
  │  fields: all §1 required fields; chunkIds; citations
  │
  ▼ answer assembly
RESPONSE
     answerClass + citations + freshnessDisclosure + receiptId
```

## 4. Concrete Trace Example

**Query:** `topicTags=cybersecurity` filter scan of file-116

**Step 1 — Filter pass:**

```
filtersApplied = {jurisdiction: "VN_NATIONAL", topicTags: "cybersecurity"}
candidatesBefore = 2 (both corpus records)
→ file-116 matches (topicTags includes "cybersecurity")
→ file-148 excluded (topicTags does not include "cybersecurity")
candidatesAfter = 1
excludedCandidateCount = 1, excludedReasons = ["TOPIC_MISMATCH"]
```

**Step 2 — Chunk retrieval from file-116:**

```
Chunks from 116_2025_qh15_666020.docx (article-boundary split)
→ Chunk matching "An toàn thông tin mạng" keyword → chunkId = vn-national-assembly-2025/116_2025_qh15_666020/0001
→ Chunk matching "Điều 44. Hiệu lực" → chunkId = vn-national-assembly-2025/116_2025_qh15_666020/0043
Top-2 chunks ranked by keyword frequency
```

**Step 3 — Boundary check:**

```
answerClass = SUMMARY_WITH_SOURCE (from parent record)
freshnessStatus = not_yet_in_force → freshnessDisclosureApplied = true
No EC triggers matched
```

**Step 4 — Receipt:**

```json
{
  "receiptId": "lpci-rcpt-20260604-trace-ex",
  "answerClass": "SUMMARY_WITH_SOURCE",
  "selectedCandidateIds": ["data_input/116_2025_qh15_666020.docx"],
  "chunkIds": ["vn-national-assembly-2025/116_2025_qh15_666020/0001",
               "vn-national-assembly-2025/116_2025_qh15_666020/0043"],
  "freshnessDisclosureApplied": true,
  "answerBoundary": "Note: this law has not yet taken effect as of 2026-06-04"
}
```

## 5. Deferred Extensions

| Extension | Rationale for deferral |
| --- | --- |
| Vector/embedding retrieval | Not needed for 2-document keyword corpus; add when corpus exceeds ~50 documents or when semantic query matching is required |
| Cross-document chunk linking | Useful when multiple laws reference each other; defer until amendedLaws cross-reference is proven |
| Chunk-level topicTags override | Useful for article-level tagging; defer until article extraction is verified at scale |
| Persistent index file | For 2 documents, in-memory index is sufficient; persist when corpus grows |

## Claim Boundary

This document defines the retrieval trace design for governance purposes. It
does not implement a search engine, vector store, or chat runtime.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY — references private corpus and internal LPCI governance.
