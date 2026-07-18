# CVF CI2-T4 Product Readiness Pilot Corpus Pack Reference

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-03

executionBaseHead: `99f6a13b`

## Purpose

This document explains the field population methodology, gap declarations, and
product readiness verdicts for the CI2-T4 pilot corpus pack at
`docs/corpus-intelligence/CVF_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK.json`.

The pack type is `GOVERNANCE_PILOT_NO_LEGAL_CORPUS` — no operator-supplied
corpus path was included in the dispatch, so existing CI1 T2/T3 scan packets
are used as the pilot input per CI2-T4 Execution Instruction 1.

## Scope

Applies to: CI2-T4 bounded pilot corpus pack. This document governs LPCI
roadmap authoring decisions that consume the pilot pack as schema proof.

Owner surface: CVF corpus intelligence governance layer.

## Authority Chain

| Authority | Path |
| --- | --- |
| CI2 GC-018 | `docs/baselines/CVF_GC018_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_2026-06-02.md` |
| CI2 roadmap | `docs/roadmaps/CVF_CI2_CORPUS_INTELLIGENCE_ENFORCEMENT_PRODUCT_READINESS_ROADMAP_2026-06-02.md` |
| CI2-T3 enforced model | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` |
| CI1-T7 LPCI intake bridge | `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |
| Work order | `docs/work_orders/CVF_WO_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK_2026-06-02.md` |

---

## Input Sources

The pilot pack draws from two prior CI1 scan packets with bounded review
evidence:

| Source | Path | Files | Manifest Hash | Status |
| --- | --- | --- | --- | --- |
| CI1-T2 Graphify | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | 5 | `a88e3412` | REVIEW_READY; completion review ACCEPT |
| CI1-T3 code-review-graph | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | 7 | `d921f708` | CLOSED_PASS_BOUNDED |

Both corpora are registered in `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`.
No new corpus scan was performed.

---

## Field Population Methodology

### NR-04 — sourceHash

Per-file SHA-256 hashes were not computed during the CI1-T2 and CI1-T3 scan
tranches. The pilot pack declares `manifestHashProxy: true` at pack level with
a bounded `manifestProxyException` string citing the CI1 scan scope. All 12
`sourceHash` fields are `null` with an accompanying `sourceHashNote`.

This is the accepted proxy exception path defined in
`docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md`. The NR-04
checker passes because the pack-level proxy is declared.

### NR-05 — normalizedPath

The CVF Corpus Path Normalization Algorithm was applied to every source path:

- Lowercase all path segments.
- Retain forward slashes.
- No leading/trailing separator, no drive letters, no `./ ../` segments.

T2 rows had CI1-T4 gap `MISSING_EXPLICIT` (per-file normalization not applied
in the original T2 packet). This pilot resolves that gap by computing
normalizedPath from the known manifest paths. All 12 rows are fully populated.

### NR-11 — dispositionAlias and rawDisposition

Four rows carry a qualifying disposition:

| Entry | disposition | dispositionAlias | rawDisposition |
| --- | --- | --- | --- |
| t2-r3 `CVF_GRAPH_MEMORY_GUARD_SPEC.md` | DEFER | ACCEPT_DEFERRED | DEFER |
| t3-r4 `CVF_GRAPH_INTEGRATION_SURFACE_SPEC.md` | ACCEPT_SUMMARY_ONLY | ACCEPT_DEFERRED | ACCEPT_SUMMARY_ONLY |
| t3-r5 `CVF_GRAPH_IMPLEMENTATION_PLAN.md` | ACCEPT_SUMMARY_ONLY | ACCEPT_DEFERRED | ACCEPT_SUMMARY_ONLY |
| t3-r7 `Thong_tin.md` (T3) | ACCEPT_SUMMARY_ONLY | ACCEPT_DEFERRED | ACCEPT_SUMMARY_ONLY |

The remaining 8 rows carry ACCEPT disposition and require no alias.

---

## Field Population Summary

| Field | Status | Notes |
| --- | --- | --- |
| `sourcePath` | FULLY_POPULATED (12/12) | From CI1-T2/T3 classification ledgers |
| `normalizedPath` | FULLY_POPULATED (12/12) | Algorithm applied; T2 MISSING_EXPLICIT gap resolved |
| `sourceHash` | DEFERRED_VIA_PROXY (0/12 per-file) | manifestHashProxy declared; bounded exception |
| `disposition` | FULLY_POPULATED (12/12) | From CI1-T2/T3 classification ledgers |
| `dispositionAlias` | POPULATED_WHERE_REQUIRED (4/4 trigger rows) | NR-11 alias rule satisfied |
| `rawDisposition` | POPULATED_WHERE_REQUIRED (4/4 trigger rows) | Preserves original disposition value |
| `answerClass` | FULLY_POPULATED (12/12) | From CI1-T2/T3 classification ledgers |
| `evidencePointer` | FULLY_POPULATED (12/12) | Section and ledger row references |
| `processingStatus` | FULLY_POPULATED (12/12) | All READ_DEEP |
| `knowledgeRegion` | FULLY_POPULATED (12/12) | From semantic region ledgers |
| `ownerSurface` | FULLY_POPULATED (12/12) | T2 alias; T3 canonical enum |
| `sourceRoot` | FULLY_POPULATED (12/12) | Per-corpus registered root |
| `sourceFamily` | FULLY_POPULATED (12/12) | `graphify` / `code-review-graph` |
| `documentType` | FULLY_POPULATED (12/12) | spec, doc, operator-analysis, roadmap |
| `topicTags` | FULLY_POPULATED (12/12) | From CI1-T2/T3 topic vocabularies |
| `sensitivity` | FULLY_POPULATED (12/12) | `restricted` (private_reference corpora) |
| `freshnessStatus` | FULLY_POPULATED (12/12) | `legacy-current-for-absorption` |
| `freshnessCheckedAt` | FULLY_POPULATED (12/12) | `2026-06-02` scan date |
| Domain extensions (legalPolicy, internalCompany) | NOT_POPULATED | Pack type GOVERNANCE_PILOT_NO_LEGAL_CORPUS |

---

## Product Readiness Sections

### Ingestion Readiness

Verdict: `GOVERNANCE_PILOT_READY`

All 12 rows meet the structural-required field obligations of the CI2-T3
enforced model. The one blocking gap (per-file sourceHash) is mitigated via
the manifestHashProxy exception. The two non-blocking gaps (T2 ownerSurface
alias, missing legal/policy domain fields) do not affect ingestion approval
for governance-pilot purposes.

### Search / Filter Readiness

Verdict: `SEARCH_FILTER_READY_WITH_DECLARED_GAPS`

The following fields support scoped search and filter queries:

- `knowledgeRegion` — 9 distinct regions across 12 rows.
- `dispositionAlias` — cross-packet deferred query possible via
  `ACCEPT_DEFERRED` without enum scatter.
- `ownerSurface`, `sourceFamily`, `documentType`, `topicTags`, `sensitivity`.

Gap: `sourceHash` per-file absent means drift detection is limited to
manifest-level proxy.

### Answer Boundary

Authorized answer types from this pilot corpus:

- `DIRECT_CITED_ANSWER` — 1 row (T2: CVF_GRAPH_MEMORY_DATA_MODEL.md)
- `SUMMARY_WITH_SOURCE` — 10 rows (majority of T2 and T3)
- `PROCEDURAL_GUIDANCE` — 1 row (T3: CVF_GRAPH_IMPLEMENTATION_PLAN.md)

Prohibited claims inherited from CI1-T7:

- Runtime graph guard enforcement (G-GM-01–08 not implemented).
- 71.5x token-reduction performance (author-reported, unverified by CVF).
- 7-phase Graphify deployment roadmap execution (legacy aspiration only).
- Legal/policy answers (no legal corpus in this pack).

### Evidence Trace

| Evidence type | Artifact |
| --- | --- |
| T2 scan packet | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` |
| T3 scan packet | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` |
| T5 sampling results | `docs/corpus-intelligence/CVF_CI1_T5_CLASSIFICATION_SAMPLING_RESULTS.json` |
| CI2 enforced model | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` |
| GC-051 registry | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` |

### Known Gaps

| Gap | Field | Mitigation |
| --- | --- | --- |
| G1 — Per-file hash absent | `sourceHash` | manifestHashProxy exception declared |
| G2 — T2 ownerSurface alias | `ownerSurface` | NR-03 ALIAS accepted per CI1-T4 normalization note |
| G3 — Legal/policy unpopulated | legalPolicy domain extensions | Expected by GOVERNANCE_PILOT_NO_LEGAL_CORPUS pack type |

---

## LPCI Readiness Verdict

Verdict: **SUFFICIENT_FOR_LPCI_ROADMAP_AUTHORING**

This pilot demonstrates that the CI2 enforced common row-level index fields can
be populated from existing CI1 governance evidence with bounded exceptions
(`sourceHash` proxy and T2 `ownerSurface` alias). Legal/policy domain
extensions are intentionally not populated by this governance-pilot pack type.
LPCI-T1 may reference this pack as schema proof when proposing a governed LPCI
product roadmap.

This pilot is **NOT sufficient** for LPCI runtime implementation, legal/policy
answer serving, vector database loading, embedding computation, or production
readiness.

LPCI implementation remains blocked until a separate governed LPCI product
roadmap is opened after CI2-T5 closes.

---

## Claim Boundary

CI2-T4 proves product-readiness packet shape only. It does NOT prove:

- Legal answer correctness.
- Runtime retrieval or graph execution behavior.
- LPCI chatbot capability.
- Embedding pipeline or vector database population.
- Hash value accuracy or per-file drift resistance.
- Production, hosted, or public readiness.

No new corpus was scanned. No per-file hash was computed. No live provider
call was made.

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no governed pilot corpus pack existed to prove
CI2 enforced index field population before LPCI roadmap authoring

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — pilot pack proves field population is feasible
with explicit gap declarations and proxy exception; LPCI roadmap authoring
is now unblocked pending CI2-T5

Next control action: `CLOSED` — pilot pack and reference doc authored;
all structural gates pass; LPCI roadmap unblocked

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: CI2-T4 is documentation and governance artifact only; no provider
calls, runtime behavior changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: internal governance corpus intelligence artifact; pilot pack and
reference doc reference private_reference corpus paths and are not suitable
for the public CVF product repository.

Public-sync boundary: no artifacts from this batch are queued for public-sync.
Next public-sync action: none required.
