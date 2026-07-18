# CVF CI1-T4 Cross-Corpus Index Model Reference

Memory class: FULL_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-06-02

GC-018: `docs/baselines/CVF_GC018_CI1_T4_CROSS_CORPUS_INDEX_MODEL_2026-06-02.md`

Work order: `docs/work_orders/CVF_WO_CI1_T4_CROSS_CORPUS_INDEX_MODEL_2026-06-02.md`

## Purpose

Provide a human-readable contract and boundary document for the machine-readable
cross-corpus index model produced by CI1-T4. This spec describes:

- why CI1-T4 was authorized;
- what the model contains;
- how T2 and T3 facets map to canonical fields;
- what extension groups are declared;
- what downstream routes exist;
- what this artifact does NOT claim.

## Scope / Applies To

Apply this reference when:

- consuming the CI1-T4 cross-corpus index model JSON for downstream search/filter,
  sampling, checker decision, or LPCI intake work;
- normalizing facet schemas from CI1-T2 or CI1-T3 scan packets;
- routing CI1-T5, CI1-T6, or CI1-T7 work that requires a typed upstream contract;
- verifying that the GC-052 `scan-packets-to-cross-corpus-index` interlock is
  satisfied.

This reference does not apply to runtime retrieval implementation, vector database
design, LPCI chatbot UI/API work, legal advice, provider calls, or public-sync.

## Source Packets

CI1-T4 normalizes two accepted CI1 scan packets:

| Packet | Path | Status |
| --- | --- | --- |
| CI1-T2 Graphify | `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | COMPLETE_PENDING_REVIEW |
| CI1-T3 code-review-graph | `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | CLOSED_PASS_BOUNDED |

Both packets cover private legacy corpora under `.private_reference/legacy/`. No new
legacy source was scanned in CI1-T4.

## Machine-Readable Model

Primary output: `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json`

This JSON file is the downstream input for CI1-T5, CI1-T6, and CI1-T7. It is not a
runtime index, vector database, or retrieval cache.

## Common Facet Schema

The canonical CVF search/filter facets are defined in
`docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md#common-facet-schema`.

All 16 required and optional common facets appear in the JSON model:

| Field | Required | T2 Alignment | T3 Alignment |
| --- | --- | --- | --- |
| `sourcePath` | required | DIRECT_MAP | DIRECT_MAP |
| `normalizedPath` | required | PARTIAL (full paths; no per-file normalization) | PARTIAL (same gap) |
| `sourceHash` | required | PARTIAL (manifest-level only) | PARTIAL (manifest-level only) |
| `sourceRoot` | required | YES (corpus boundary section) | YES (explicit field) |
| `sourceFamily` | required | IMPLICIT (Graphify family prose) | YES (explicit field, value: code-review-graph) |
| `documentType` | required | YES via alias 'Document type' | YES (explicit field) |
| `topicTags` | required | YES via alias 'Domain' | YES (explicit field) |
| `knowledgeRegion` | required | YES (semantic region ledger) | YES (semantic region ledger) |
| `ownerSurface` | required | YES via alias 'CVF plane mapping' | YES (enum-style values) |
| `processingStatus` | required | YES (processing ledger, all READ_DEEP) | YES (processing ledger, all READ_DEEP) |
| `disposition` | required | YES (classification ledger) | YES (classification ledger) |
| `evidencePointer` | required | YES (section references) | YES (section name references) |
| `sensitivity` | required | IMPLICIT (restricted, corpus level) | YES (explicit, restricted) |
| `freshnessStatus` | required | YES (freshness model section) | YES (explicit, legacy-current-for-absorption) |
| `freshnessCheckedAt` | optional | IMPLICIT (scan date 2026-06-02) | YES (explicit, 2026-06-02) |
| `answerClass` | required | YES (classification ledger) | YES (classification ledger) |

## T2-to-T3 Facet Comparison

### Where T2 and T3 Fully Align

- All 16 canonical facets are present or derivable in both packets.
- Both packets use `processingStatus` = `READ_DEEP` for all files.
- Both classification ledgers carry `disposition`, `evidencePointer`, and `answerClass`.
- Both packets provide corpus-level `sensitivity` = restricted.

### Where T2 Uses Aliases

T2 uses informal labels from the packet template that predate the explicit
canonical field vocabulary. The following aliases are resolved in the JSON model:

| T2 label | Canonical field | Resolution |
| --- | --- | --- |
| `Document type` | `documentType` | ALIAS_ACCEPTED |
| `Domain` | `topicTags` | ALIAS_ACCEPTED |
| `CVF plane mapping` | `ownerSurface` | ALIAS_ACCEPTED; T2 uses runtime file references; T3 uses enum values |
| `Version` | `evidencePointer` (note) | ALIAS_PARTIAL; version string is note, not standalone facet |
| `Status (Approved)` | `disposition` + `freshnessStatus` | SPLIT_MAP |
| `Language` | none | NO_CANONICAL_EQUIVALENT; defer to topicTags extension or primaryLanguage extension |

### Unresolved Gaps (Routed to CI1-T5 / CI1-T6)

| Gap | Affected field | Deferred to |
| --- | --- | --- |
| Per-file `sourceHash` not computed in either packet | `sourceHash` | CI1-T6 checker decision |
| Per-file `normalizedPath` not applied in either packet | `normalizedPath` | CI1-T6 checker decision |
| `sensitivity` stated only at corpus level in T2 | `sensitivity` | CI1-T6 checker decision |
| `Language` field in T2 has no canonical equivalent | new extension | CI1-T5 / CI1-T6 |

## Domain Extension Groups

Extension groups keep domain-specific fields out of the common facet vocabulary.

### Technical / Project Extensions

Present in T3 explicitly. Present in T2 implicitly via runtime surface references.

Fields: `module`, `runtimeSurface`, `interfaceName`, `symbol`, `testCoverage`,
`migrationStatus`.

Downstream use: CI1-T5 classification sampling; CI1-T6 checker decision.

### Legacy Absorption Extensions

Present in T3 explicitly. Present in T2 informally.

Fields: `legacyFamily`, `absorbedBy`, `absorptionStatus`, `remainingValue`,
`blindSpotRisk`.

Downstream use: CI1-T5 adversarial sampling; LPCI intake routing.

### Legal / Policy Extensions (Vocabulary Only)

Neither T2 nor T3 is a legal/policy corpus. These fields are declared vocabulary
for LPCI use after CI1-T7. No populated legal facts appear in CI1-T4.

Fields: `jurisdiction`, `authorityLevel`, `issuingBody`, `effectiveDate`,
`amendmentStatus`, `sourceAuthority`.

**Operator notice:** legal/policy fields remain extension vocabulary only. LPCI-T1
will populate these fields after CI1-T7 authorizes the intake bridge.

### Internal Company Extensions (Vocabulary Only)

Fields: `businessUnit`, `policyOwner`, `approvalBody`, `effectiveAudience`,
`confidentialityLevel`.

Not populated in CI1-T4. Declared vocabulary for future company-docs corpus wave.

## Freshness / Conflict Vocabulary

The model defines eight freshness/conflict statuses:

| Status | Meaning |
| --- | --- |
| `effective` | Accepted as primary private provenance input |
| `draft` | Legacy proposed items not yet implemented in CVF |
| `amended` | Updated from a prior version; cite amendment evidence |
| `superseded` | Current CVF source directly contradicts a legacy assumption |
| `repealed` | Concept explicitly removed from scope |
| `obsolete` | Concept replaced without explicit removal notice |
| `stale` | Performance or runtime claims without current CVF proof |
| `unknown` | External benchmark claims not re-run by CVF |

## Query Receipt Fields

Any retrieval query against a corpus governed by this model should record:

`queryId`, `sourcePath`, `queryText`, `normalizedQuery`, `filtersApplied`,
`candidateCountBeforeFilters`, `candidateCountAfterFilters`,
`excludedCandidateCount`, `excludedCandidateReasonClasses`,
`selectedCandidateIdsOrPaths`, `rankReasons`, `evidencePointers`,
`answerBoundary`, `abstentionReason`, `timestamp`, `corpusSnapshotHash`.

## Downstream Routes

| Route | Name | Purpose | Status |
| --- | --- | --- | --- |
| CI1-T5 | Classification Sampling Protocol | Adversarial sampling across accepted/deferred/rejected/zero-result rows | HOLD_UNTIL_T4_CLOSED |
| CI1-T6 | Checker Decision | Decide whether structural machine checker is needed for search/filter readiness | HOLD_UNTIL_T5_CLOSED |
| CI1-T7 | LPCI Intake Bridge | Map CI workflow into LPCI-T1 product intake | HOLD_UNTIL_T6_DECIDED |

CI1-T5, CI1-T6, and CI1-T7 require separate operator authorization, GC-018, and
work orders. LPCI runtime remains blocked until at minimum CI1-T4 closure plus
CI1-T5, CI1-T6, and CI1-T7.

## Rebuildability Statement

The JSON model `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json` is
rebuildable from:

1. `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md`
2. `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md`
3. `docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md`

No external runtime, vector index, graph database, or live source read is required
to rebuild the model from the cited packets.

## Corpus Completeness And Report Integrity

- Corpus task class: CROSS_CORPUS_INDEX_MODEL
- Corpus root: N/A - cross-corpus derived view over cited T2 and T3 packets
- Snapshot time: 2026-06-02
- Enumeration command: N/A - no new filesystem corpus scan; source packets previously
  enumerated with `rg --files --hidden --no-ignore`
- Manifest artifact or inline manifest: inline source-packet ledger below
- Manifest hash: N/A - no new filesystem manifest; source packets cited individually
- Processing ledger artifact or inline ledger: inline source-packet ledger below
- Allowed terminal statuses: READ | SKIPPED_WITH_REASON | DEFERRED | BLOCKED_UNREADABLE
- Reconciliation: manifest=2; ledger_terminal=2; exclusions=0; unresolved=0
- Unresolved files: 0
- Declared exclusions: all new source corpus reads
- Unreadable or unsupported files: 0
- Aggregation check: PASS
- Drift check: PASS at packet-reference dispatch level
- Output traceability: `docs/corpus-intelligence/CVF_CROSS_CORPUS_INDEX_MODEL.json`
- Adversarial verification: worker comparison plus reviewer sampling
- Corpus verdict: PARTIAL (CI1-T4 normalizes two accepted pilot packets; does not
  claim universal corpus coverage)

| sourcePath | processingStatus | evidencePointer |
| --- | --- | --- |
| `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | READ | CI1-T2 packet |
| `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | READ | CI1-T3 packet |

## Corpus Intelligence Classification

- Classification task class: CROSS_CORPUS_INDEX_MODEL
- Source corpus evidence: two-packet ledger below
- Knowledge map evidence: two-packet ledger below
- Legal/policy corpus: NO
- Domain fields: N/A - cross-corpus derived model; not legal/policy
- Response Boundary: DIRECT_CITED_ANSWER | SUMMARY_WITH_SOURCE | PROCEDURAL_GUIDANCE | ESCALATE_OR_ABSTAIN
- Adversarial sampling plan: CI1-T5 will provide; CI1-T4 records no new corpus samples
- Classification ledger: inline table below
- Classification verdict: PARTIAL (model normalization is a derived view; CI1-T5
  sampling remains required)

| sourcePath | processingStatus | knowledgeRegion | ownerSurface | disposition | evidencePointer |
| --- | --- | --- | --- | --- | --- |
| `docs/audits/CVF_CI1_T2_GRAPHIFY_READINESS_PACKET_2026-06-02.md` | READ_DEEP | GRAPH_CORPUS_INTELLIGENCE | CORPUS_INTELLIGENCE_WORKER | ACCEPT | CI1-T2 §Common Facet Schema and §Classification Ledger |
| `docs/audits/CVF_CI1_T3_GRAPH_GOVERNANCE_CORPUS_READINESS_PACKET_2026-06-02.md` | READ_DEEP | GRAPH_CORPUS_INTELLIGENCE | CORPUS_INTELLIGENCE_WORKER | ACCEPT | CI1-T3 §Common Facet Schema and §Classification Ledger |

## System Loop Interlock

CI1-T4 adds GC-052 connection `scan-packets-to-cross-corpus-index` to
`docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json`.

This connection proves typed artifact routing from scan packets to the cross-corpus
index model. It does not prove semantic correctness, runtime retrieval behavior,
automatic roadmap creation, autonomous mutation, LPCI implementation, or public claims.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: CI1-T4 is private corpus-intelligence contract work. No public-sync remote,
public repository commit, public artifact path, hosted proof, or public README claim
is included.

## Claim Boundary

CI1-T4 creates a bounded cross-corpus index-model contract over two pilot packets.

**This spec claims:**

- A typed, machine-readable common facet vocabulary derived from CI1-T2 and CI1-T3.
- Canonical alias resolution for T2 informal field labels.
- Declared domain extension groups (technical/project, legacy absorption, LPCI
  vocabulary).
- Identified unresolved gaps routed to CI1-T6 checker decision.
- Query receipt field vocabulary and freshness/conflict vocabulary.
- A GC-052 typed routing record from scan packets to index model.
- Downstream routing contract for CI1-T5, CI1-T6, and CI1-T7.
- The model is rebuildable from the cited T2 and T3 source packets.

**This spec does NOT claim:**

- A runtime search index, embedding pipeline, or vector database.
- Graph execution route or LPCI chatbot implementation.
- Legal advice capability or legal correctness.
- Provider proof, production readiness, hosted readiness, or public readiness.
- Semantic correctness of any corpus classification.
- Coverage of any legacy corpus beyond the two cited pilot packets.
- Authorization for CI1-T5, CI1-T6, or CI1-T7 work (each requires separate operator
  authorization and GC-018).
