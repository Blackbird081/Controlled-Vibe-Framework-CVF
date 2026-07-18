# CVF LPCI1-T7 Template Packaging Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `0c16db92`

## Purpose

Package the LPCI1 MVP governance and intake contracts into reusable templates
for downstream workspace operators. This document provides:

- a downstream workspace adoption guide (how to stand up LPCI1 in a new workspace);
- a corpus intake template (intake checklist with Vietnamese diacritic
  normalization section);
- a readiness checklist (go/no-go criteria before T5 chatbot prototype deployment);
- Vietnamese corpus Stage 3 diacritic normalization rules;
- a C4/C5 test corpus design (sample records for freshness warning and conflict
  notice validation).

**T6 dependency note**: T6 adversarial evaluation is CLOSED_PASS_BOUNDED. This
template incorporates the T6 guidance items: Vietnamese Stage 3 diacritic
normalization and C4/C5 test corpus design.

This is a documentation and template artifact only. No runtime code, real corpus
ingestion, vector store, embedding, or provider calls are created.

---

## Source

| Authority | Path | Verified state |
| --- | --- | --- |
| T1 corpus intake spec | `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` | ACTIVE |
| T2 domain classification spec | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | ACTIVE |
| T3 search/filter index spec | `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md` | ACTIVE |
| T4 retrieval boundary spec | `docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md` | ACTIVE |
| T1 architecture | `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md` | ACTIVE |
| CI2-T3 enforced index model | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` | ACTIVE |

---

## Scope / Applies To

Applies to: downstream workspace operators adopting LPCI1; T5 chatbot prototype
implementation workers; any future LPCI workspace extending to new legal/policy
corpora.

Owner surface: CVF governance layer; LPCI1 product tranche owners.

---

## Downstream Workspace Adoption Guide

### Prerequisites

Before adopting LPCI1 in a downstream workspace, the operator must confirm
the following are in place:

| Prerequisite | Verification |
| --- | --- |
| CVF private provenance repository cloned | `git remote -v` shows `Controlled-Vibe-Framework-CVF-Provenance` |
| GC-051 corpus scan registry accessible | `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` readable |
| CI2-T3 enforced index model accessible | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` readable |
| Governance gate scripts accessible | `governance/compat/run_agent_autorun_workflow_gate.py` runnable |
| Legal corpus files available locally | raw legal/policy documents in a local directory |
| LLM API key available (T5 only) | stored in `.env.local`; never committed; T5 scope |

### Adoption Steps

**Step 1 — Register the corpus in GC-051**

Add a new entry to `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json`
for the target legal corpus. Required fields: `corpusId`, `rootPath`,
`jurisdiction`, `language`, `registrationDate`, `operator`.

Do NOT begin ingestion before GC-051 registration is committed.

**Step 2 — Run the corpus intake template (Appendix A)**

Follow the corpus intake checklist in this document. Complete all NR-04,
NR-05, NR-11, and LPCI domain extension fields. For Vietnamese-language corpora,
apply the diacritic normalization rules in the Diacritic Normalization section
below.

**Step 3 — Classify each document against T2 decision matrix**

For each ingested document, assign `answerClass`, `documentType`,
`jurisdiction`, `status`, `authorityLevel`, `effectiveDate`, `sensitivityLevel`,
`ownerSurface = GOVERNANCE_LAYER`, `knowledgeRegion = LEGAL_POLICY_CORPUS`.

Use the T2 classification decision matrix from
`docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md`.

**Step 4 — Build the faceted index per T3 schema**

Index the classified records per
`docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md`.
Verify all 15 index fields are populated.

**Step 5 — Validate T4 retrieval boundary compliance**

Before running any query, verify the implementation satisfies C1–C9 from
`docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md`.
Run the C4/C5 test corpus (Appendix B) to confirm freshness and conflict
handling.

**Step 6 — Run T5 readiness checklist**

Complete all items in the Readiness Checklist section. Deploy T5 chatbot
prototype only after all go-criteria are met.

---

## Vietnamese Corpus Stage 3 Diacritic Normalization

Vietnamese is a tonal language using combining diacritics (e.g., `ắ`, `ề`,
`ộ`). Inconsistent Unicode encoding causes missed matches in Stage 3 fulltext
search. This section defines mandatory normalization rules.

### Scope

Applies to: Stage 3 fulltext/semantic search indexing and query preprocessing
for any corpus where `language = vi` (Vietnamese). Also applies to
`normalizedPath` generation (NR-05) when path components contain Vietnamese
characters.

### Normalization Standard

**Canonical form: Unicode NFC (Canonical Decomposition followed by Canonical
Composition)**

Vietnamese characters must be stored and indexed in NFC form. All input text —
document content, `titleSnippet`, `contentSnippet`, `normalizedPath` path
components, and query strings — must be normalized to NFC before indexing or
search.

### Pre-Indexing Rules

| Field | Rule |
| --- | --- |
| `normalizedPath` | apply NR-05 algorithm; additionally NFC-normalize any Vietnamese path components before lowercasing |
| `titleSnippet` | NFC-normalize before extraction; strip control characters; trim whitespace |
| `contentSnippet` | NFC-normalize before extraction; strip control characters; max 512 characters |
| fulltext index tokens | NFC-normalize; lowercase; strip punctuation except Vietnamese tone marks |

### Pre-Query Rules

At Stage 3, before executing fulltext/semantic search:

1. NFC-normalize the query string.
2. Lowercase the normalized query.
3. Strip leading/trailing whitespace.
4. Do NOT strip Vietnamese diacritics (tone marks are semantically significant
   in legal text — e.g., `phạt` (fine/penalty) vs `phat` (unintelligible)).

### Known Encoding Risks

| Risk | Mitigation |
| --- | --- |
| NFD-encoded diacritics in source PDFs | apply NFC normalization at extraction time before storing `contentSnippet` |
| Mixed NFC/NFD in same corpus | enforce NFC in `normalizedPath` and snippet fields at intake; reject non-NFC source with an intake error |
| Windows-1258 encoded legacy documents | convert to UTF-8 with NFC normalization before intake; document conversion provenance in intake manifest |
| Search library strips diacritics by default | configure fulltext analyzer to retain Vietnamese diacritics; verify with a `phạt`/`phat` test query |

### NR-05 Extension for Vietnamese Paths

When a file path contains Vietnamese characters:

1. Convert to UTF-8 if not already.
2. NFC-normalize the full path string.
3. Apply the standard NR-05 algorithm (lowercase, forward slash, no leading slash).
4. Verify the resulting `normalizedPath` is valid UTF-8 NFC.

This is an additive rule on top of NR-05; it does not replace or modify the
NR-05 canonical algorithm.

---

## Corpus Intake Template (Appendix A)

### Per-Document Intake Checklist

Copy this checklist for each document ingested into the LPCI corpus:

```
Document: ____________________________
Intake date: ____________________________
Operator: ____________________________

NR-04 (source hash):
  [ ] SHA-256 hash computed per file
  [ ] Hash stored in intake manifest
  [ ] OR: manifest proxy declared with explicit exception note

NR-05 (normalizedPath):
  [ ] Path lowercased
  [ ] Path uses forward slashes
  [ ] No leading slash
  [ ] For Vietnamese paths: NFC-normalized before lowercasing

NR-11 (dispositionAlias):
  [ ] rawDisposition recorded (ACCEPT / ACCEPT_SUMMARY_ONLY / DEFER)
  [ ] dispositionAlias mapped (ACCEPT / ACCEPT_DEFERRED)
  [ ] Cross-check: ACCEPT_DEFERRED does not allow DIRECT_CITED_ANSWER

LPCI domain extension fields:
  [ ] documentType  : ____________ (law/decree/circular/policy/notice/decision/SOP/contract/implementation_guide/other)
  [ ] jurisdiction  : ____________ (international/national/provincial/municipal/organizational/departmental/contractual/unknown)
  [ ] authorityLevel: ____________
  [ ] issuingBody   : ____________
  [ ] effectiveDate : ____________ (ISO 8601)
  [ ] status        : ____________ (effective/draft/amended/superseded/repealed/obsolete/unknown)
  [ ] sensitivityLevel: __________ (public/restricted/confidential/classified/unknown)

Classification (T2 decision matrix):
  [ ] answerClass   : ____________ (DIRECT_CITED_ANSWER/SUMMARY_WITH_SOURCE/PROCEDURAL_GUIDANCE/ESCALATE_OR_ABSTAIN)
  [ ] ownerSurface  : GOVERNANCE_LAYER
  [ ] knowledgeRegion: LEGAL_POLICY_CORPUS

Vietnamese diacritic normalization (if language = vi):
  [ ] contentSnippet NFC-normalized
  [ ] titleSnippet NFC-normalized
  [ ] normalizedPath NFC-normalized before NR-05 algorithm
  [ ] Source encoding confirmed UTF-8

GC-051 registry:
  [ ] corpusId recorded in CVF_CORPUS_SCAN_REGISTRY.json
  [ ] Corpus registered before ingestion began
```

---

## C4/C5 Test Corpus Design (Appendix B)

This appendix defines a minimal test corpus for validating C4 (freshness
warning — Rule A2) and C5 (conflict notice — Rule A3) from the T4 retrieval
boundary contract.

### Purpose

The test corpus must be registered in GC-051 as a test corpus (not a
production corpus). It must contain:

- At least two records that trigger `freshness_flag = true` (C4).
- At least two records on the same topic that trigger `conflict_flag = true` (C5).

### Test Record Set (planning notation — no executable file)

**Group A: C4 Freshness Records (triggers Rule A2)**

```json
[
  {
    "normalizedPath": "test_corpus/lpci_t7/decree_10_2020_amended.md",
    "sourceHash": "sha256:test-placeholder-hash-001",
    "documentType": "decree",
    "jurisdiction": "national",
    "authorityLevel": "decree",
    "issuingBody": "Test Government",
    "effectiveDate": "2020-03-01",
    "status": "amended",
    "answerClass": "SUMMARY_WITH_SOURCE",
    "rawDisposition": "ACCEPT",
    "dispositionAlias": "ACCEPT",
    "sensitivityLevel": "public",
    "ownerSurface": "GOVERNANCE_LAYER",
    "knowledgeRegion": "LEGAL_POLICY_CORPUS",
    "titleSnippet": "Decree No. 10/2020 (amended) on test topic",
    "contentSnippet": "Article 5. Test provision (amended by Decree 15/2022)...",
    "_testNote": "status=amended triggers freshness_flag=true; C4 freshness warning must appear"
  },
  {
    "normalizedPath": "test_corpus/lpci_t7/circular_05_2019_amended.md",
    "sourceHash": "sha256:test-placeholder-hash-002",
    "documentType": "circular",
    "jurisdiction": "national",
    "authorityLevel": "binding_circular",
    "issuingBody": "Test Ministry",
    "effectiveDate": "2019-07-01",
    "status": "amended",
    "answerClass": "SUMMARY_WITH_SOURCE",
    "rawDisposition": "ACCEPT",
    "dispositionAlias": "ACCEPT",
    "sensitivityLevel": "public",
    "ownerSurface": "GOVERNANCE_LAYER",
    "knowledgeRegion": "LEGAL_POLICY_CORPUS",
    "titleSnippet": "Circular 05/2019 (amended) on test topic",
    "contentSnippet": "Section 3. Amended guidance on compliance (see amendment 2021)...",
    "_testNote": "second amended record; both A-group records in same query result trigger freshness_flag=true"
  }
]
```

**Group B: C5 Conflict Records (triggers Rule A3)**

```json
[
  {
    "normalizedPath": "test_corpus/lpci_t7/law_08_2018_on_topic_x.md",
    "sourceHash": "sha256:test-placeholder-hash-003",
    "documentType": "law",
    "jurisdiction": "national",
    "authorityLevel": "law",
    "issuingBody": "National Assembly",
    "effectiveDate": "2018-01-01",
    "status": "effective",
    "answerClass": "DIRECT_CITED_ANSWER",
    "rawDisposition": "ACCEPT",
    "dispositionAlias": "ACCEPT",
    "sensitivityLevel": "public",
    "ownerSurface": "GOVERNANCE_LAYER",
    "knowledgeRegion": "LEGAL_POLICY_CORPUS",
    "titleSnippet": "Law No. 08/2018 on Topic X",
    "contentSnippet": "Article 12. Threshold for Topic X is 500 units...",
    "_testNote": "same topic as B-group record 2; effectiveDate differs → conflict_flag=true"
  },
  {
    "normalizedPath": "test_corpus/lpci_t7/decree_25_2022_on_topic_x.md",
    "sourceHash": "sha256:test-placeholder-hash-004",
    "documentType": "decree",
    "jurisdiction": "national",
    "authorityLevel": "decree",
    "issuingBody": "Government",
    "effectiveDate": "2022-06-01",
    "status": "effective",
    "answerClass": "DIRECT_CITED_ANSWER",
    "rawDisposition": "ACCEPT",
    "dispositionAlias": "ACCEPT",
    "sensitivityLevel": "public",
    "ownerSurface": "GOVERNANCE_LAYER",
    "knowledgeRegion": "LEGAL_POLICY_CORPUS",
    "titleSnippet": "Decree No. 25/2022 on Topic X",
    "contentSnippet": "Article 3. Threshold for Topic X is revised to 800 units...",
    "_testNote": "same topic, different effectiveDate and different authorityLevel → conflict_flag=true; C5 must list both; resolution: law (higher authority) primary"
  }
]
```

### Expected Test Outcomes

| Test | Input | Expected T4 behavior |
| --- | --- | --- |
| C4-1: single amended record query | query matching only A-group record 1 | `freshness_flag = true`; Rule A2 freshness warning in response |
| C4-2: both amended records in result set | query matching both A-group records | `freshness_flag = true`; warning cites both stale records |
| C5-1: both B-group records in result set | query for "Topic X threshold" | `conflict_flag = true`; Rule A3 lists both paths; resolution by authorityLevel (law > decree) stated |
| C5-2: conflict + freshness combined | query matching A-group record 1 AND B-group record 2 | `freshness_flag = true` AND `conflict_flag = true`; both warnings in response |

### Test Corpus GC-051 Registration Requirement

Before running these tests, the operator must register the test corpus in
`docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` with
`corpusType: TEST_CORPUS` and `productionUse: false`. Test records must NOT
be mixed with production corpus records.

**`sourceHash` note**: test record `sourceHash` values are placeholders
(`sha256:test-placeholder-hash-NNN`). A real NR-04-compliant hash must be
computed when actual test document files are created in T5/T6 scope.

---

## Readiness Checklist (T5 Deployment Gate)

Go/no-go criteria before deploying the T5 chatbot prototype:

### Documentation Gate

- [ ] T1 architecture reviewed and CLOSED_PASS_BOUNDED
- [ ] T2 domain classification spec ACTIVE
- [ ] T3 search/filter index spec ACTIVE
- [ ] T4 retrieval boundary spec ACTIVE; C1–C9 noted
- [ ] GC-051 corpus registration committed for target production corpus

### Corpus Readiness Gate

- [ ] At least one legal corpus registered in GC-051 with `productionUse: true`
- [ ] All corpus records classified against T2 decision matrix
- [ ] All records pass NR-04, NR-05, NR-11 checkers
- [ ] All records pass GC-050 classification checker
- [ ] Mixed-sensitivity corpora: all sensitivityLevel fields populated
- [ ] Vietnamese corpora: diacritic normalization confirmed (NFC)

### Implementation Gate (T5 scope)

- [ ] Phase 1 five-stage filter implemented per T3 contract
- [ ] Stage 4 answerClass post-filter non-overridable
- [ ] Phase 2 invoked only on non-empty non-ESCALATE result set
- [ ] AuditReceipt written for every query including negative receipts
- [ ] `model_response_hash` = SHA-256 of emitted response or negative receipt payload
- [ ] C4 freshness warning emitted when `freshness_flag = true`
- [ ] C5 conflict notice emitted when `conflict_flag = true`; no LLM-driven resolution
- [ ] C4/C5 test corpus validated against T5 implementation (see Appendix B)

### Legal Boundary Gate

- [ ] No response claims legal compliance status
- [ ] No response offers legal advice or risk judgment
- [ ] "Based on retrieved documents only" scope marker present in all responses
- [ ] ESCALATE_OR_ABSTAIN responses return abstention message only

### T6 Guidance Uptake Gate

- [x] T6 adversarial evaluation closed with 20/20 PASS and zero hallucinations.
- [x] Diacritic sensitivity captured as Vietnamese Stage 3 normalization guidance.
- [x] C4/C5 pilot gap captured as amended/conflicting test corpus design.

---

## Requirements

| Requirement | Applicable to |
| --- | --- |
| NFC normalization before Stage 3 indexing for Vietnamese corpus | T5 implementation |
| NFC normalization of query string before Stage 3 execution for Vietnamese | T5 implementation |
| Vietnamese diacritics NOT stripped from index tokens or queries | T5 implementation |
| C4/C5 test corpus GC-051 registered as TEST_CORPUS before tests run | T5 test phase |
| Test corpus NR-04 hashes replaced with real SHA-256 at T5 implementation | T5 test phase |
| Readiness checklist completed before T5 deployment | T5 deployment gate |
| T6 guidance uptake | completed in this T7 package |

---

## Enforcement

| Rule | Checker / gate |
| --- | --- |
| NR-05 normalizedPath (including Vietnamese paths) | `governance/compat/check_corpus_packet_normalized_path.py` |
| NR-04 source hash | `governance/compat/check_corpus_packet_source_hash.py` |
| NR-11 dispositionAlias | `governance/compat/check_corpus_packet_disposition_canonical.py` |
| GC-050 classification structure | `governance/compat/check_corpus_intelligence_classification.py` |
| Governance structural completeness | `governance/compat/check_markdown_structural_completeness.py` |
| Pre-implementation autorun | `governance/compat/run_agent_autorun_workflow_gate.py` |

**Future enforcement note**: diacritic normalization correctness, C4/C5 test
corpus execution, and readiness checklist completion are specification
constraints only in this tranche. Runtime enforcement code is T5 implementation
scope. A Vietnamese normalization checker is a candidate for T5 scope.

---

## Verification

This specification is a planning artifact. Verification at this tranche:

- Downstream adoption guide steps derived from T1–T4 contract chain.
- Corpus intake template checklist cross-checked against T1 corpus intake spec
  (NR-04, NR-05, NR-11) and T2 classification spec (domain extension fields).
- Diacritic normalization rules consistent with Unicode NFC standard; NR-05
  extension additive (does not modify NR-05 algorithm).
- C4/C5 test corpus records designed to trigger `freshness_flag = true` (amended
  records) and `conflict_flag = true` (same topic, different effectiveDate and
  authorityLevel) per T4 retrieval boundary contract.
- Readiness checklist covers C1–C9 obligations.
- No real corpus ingested; all templates and test designs are planning-level.

Runtime correctness of diacritic normalization and C4/C5 emission verified at
T5 implementation gate.

---

## Non-Goals

- Implement any runtime normalization or search code.
- Execute the C4/C5 test corpus against a real index.
- Register a real production corpus in GC-051.
- Re-run adversarial evaluation (T6 scope).
- Provide tested classification accuracy or retrieval quality metrics.

---

## Claim Boundary

This document claims:

- downstream workspace adoption guide (6 steps);
- per-document corpus intake checklist (Appendix A) covering NR-04/NR-05/NR-11
  and all LPCI domain extension fields;
- Vietnamese corpus Stage 3 diacritic normalization rules (NFC; diacritics
  retained; additive NR-05 extension);
- C4/C5 test corpus design (4 records in 2 groups; expected outcomes table;
  GC-051 test registration requirement);
- T5 deployment readiness checklist (documentation, corpus, implementation,
  legal boundary, and T6 guidance uptake gate).

This document does NOT claim:

- tested normalization correctness;
- tested C4/C5 emission;
- production readiness;
- runtime proof of the T7 template in a production corpus.

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 template packaging, Vietnamese diacritic
normalization rules, or C4/C5 test corpus design existed before this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T7 establishes downstream adoption guide,
corpus intake template, diacritic normalization rules, C4/C5 test corpus design,
and T5 deployment readiness checklist

Next control action: `CLOSED` — T6 is CLOSED_PASS_BOUNDED and its template
guidance items are incorporated in this T7 package

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: documentation and template artifact only; no provider calls, runtime
changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: spec references private corpus intelligence governance chain and internal
test corpus design.

Public-sync boundary: no artifacts from this batch are queued for public-sync.
Next public-sync action: a sanitized downstream workspace guide could be
prepared for the public CVF repository after a public-facing LPCI guide is
authorized.

---

## Related

- `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md`
- `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md`
- `docs/reference/CVF_LPCI1_T3_SEARCH_FILTER_INDEX_SPEC_2026-06-03.md`
- `docs/reference/CVF_LPCI1_T4_RETRIEVAL_BOUNDARY_SPEC_2026-06-03.md`
- `docs/work_orders/CVF_WO_LPCI1_T7_TEMPLATE_PACKAGING_2026-06-03.md`
