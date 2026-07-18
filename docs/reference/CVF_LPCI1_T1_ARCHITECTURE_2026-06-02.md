# CVF LPCI1-T1 Architecture Document

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `a155f505`

## Purpose

Define the product intake and architecture for LPCI1 (Legal/Policy Corpus
Intelligence chatbot MVP). This document covers corpus intake pipeline design,
classification pipeline design, retrieval and answer boundary design, and
API/UI surface sketch. It does not implement any code.

This is the primary output of LPCI1-T1 Product Intake and Architecture tranche,
authorized by:

- `docs/baselines/CVF_GC018_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_2026-06-02.md`
- `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md`

---

## Source

| Authority | Path |
| --- | --- |
| LPCI1 GC-018 | `docs/baselines/CVF_GC018_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_2026-06-02.md` |
| LPCI1 MVP roadmap | `docs/roadmaps/CVF_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_ROADMAP_2026-06-02.md` |
| CI1-T7 LPCI intake bridge | `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md` |
| CI2-T4 pilot pack | `docs/corpus-intelligence/CVF_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK.json` |
| CI2-T3 enforced index schema | `docs/reference/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL_SCHEMA_2026-06-02.md` |
| LPCI1-T1 work order | `docs/work_orders/CVF_WO_LPCI1_T1_PRODUCT_INTAKE_AND_ARCHITECTURE_2026-06-02.md` |

---

## Scope

Architecture-only. Covers four pipeline stages:

1. Corpus Intake
2. Classification
3. Retrieval and Answer Boundary
4. API/UI Surface Sketch

No executable code, database schema files, vector store, embedding pipeline,
provider calls, or UI components are created in this tranche.

---

## Non-Goals

- Implement any runtime code.
- Provide legal advice or production compliance certification.
- Run live provider queries or embed documents.
- Build a vector database or production search index.
- Claim legal answer correctness or production readiness.

---

## Architecture: Corpus Intake Pipeline

### Design Principles

- **Local-first**: corpus is sourced from operator-supplied local filesystem
  path; no internet download or public SaaS transfer.
- **Manifest-driven**: an operator-authored manifest JSON lists every source
  file with relative path, document type, and optional per-file SHA-256 hash.
- **GC-051 registration required**: target corpus directory must be registered
  in `docs/corpus-intelligence/CVF_CORPUS_SCAN_REGISTRY.json` before any
  scan step. Registration is the operator's responsibility.
- **Hash policy**: see `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md`
  for the adopted NR-04 hash policy (per-file SHA-256 or documented manifest proxy).

### Intake Steps (pseudocode notation — no executable file)

```
INTAKE(corpusRoot, manifestPath):
  1. VERIFY corpusRoot in CVF_CORPUS_SCAN_REGISTRY.json  → abort if not registered
  2. LOAD manifest = JSON.parse(manifestPath)
  3. FOR EACH entry in manifest.files:
       a. READ file at corpusRoot/entry.relativePath
       b. COMPUTE hash = SHA256(file bytes)  OR  ACCEPT manifest.hash if operator-documented proxy
       c. VALIDATE normalizedPath = normalize(entry.relativePath) per NR-05 algorithm
       d. VALIDATE entry.documentType in LPCI_ALLOWED_DOCTYPE_ENUM
  4. EMIT IntakeRecord per file with fields:
       normalizedPath, sourceHash, documentType, jurisdiction,
       authorityLevel, issuingBody, effectiveDate, status
  5. WRITE intake manifest receipt (no UI; structured JSON log)
```

### Intake Record Schema (CI2 common fields + LPCI domain extensions)

Common fields inherited from CI2-T3 enforced index model:

| Field | Type | NR rule | Source |
| --- | --- | --- | --- |
| `normalizedPath` | string | NR-05 | CI2-T2 checker |
| `sourceHash` | string / `PROXY` | NR-04 | CI2-T1/T2 standard |
| `ownerSurface` | enum | NR-03 | CI2-T3 index model |
| `knowledgeRegion` | enum | CI2-T3 | CI2-T3 index model |
| `answerClass` | enum | CI1-T4 | CI1-T4 answer boundary model |
| `rawDisposition` | enum | NR-11 | CI2-T2 checker |
| `dispositionAlias` | enum | NR-11 | CI2-T2 checker |

LPCI domain extension fields (populated from T2 onwards with a real legal corpus):

| Field | Type | Description |
| --- | --- | --- |
| `jurisdiction` | string | country, state, company, org scope |
| `authorityLevel` | string | hierarchy or internal rank (law > decree > circular > policy) |
| `issuingBody` | string | ministry, department, company function, owner team |
| `effectiveDate` | string (ISO 8601) | date the rule starts applying |
| `status` | enum | effective, draft, amended, superseded, repealed, obsolete, unknown |
| `documentType` | enum | law, decree, circular, policy, notice, decision, SOP, contract, other |

---

## Architecture: Classification Pipeline

### Design Principles

- **GC-050 aligned**: every intake record must pass through GC-050 corpus
  intelligence classification before entering the retrieval index.
- **NR-11 alias enforcement**: `rawDisposition` preserved; `dispositionAlias`
  added for DEFER and ACCEPT_SUMMARY_ONLY rows.
- **Knowledge-map reconciliation (GC-048)**: classification output must be
  reconciled with the corpus knowledge map before query serving.
- **Sensitivity tagging (NR-06)**: per-record sensitivity declared for any
  corpus mixing sensitivity levels.

### Classification Steps (pseudocode notation — no executable file)

```
CLASSIFY(intakeRecords):
  FOR EACH record in intakeRecords:
    1. ASSIGN knowledgeRegion based on documentType + jurisdiction
    2. ASSIGN answerClass from GC-050 canonical response-boundary classes:
         DIRECT_CITED_ANSWER if point-of-law (decree, law article)
         SUMMARY_WITH_SOURCE if multi-clause, amended, or non-binding notice
         PROCEDURAL_GUIDANCE if contract, SOP, or internal policy with restricted scope
         ESCALATE_OR_ABSTAIN if status = repealed, obsolete, or out-of-jurisdiction
    3. ASSIGN rawDisposition (ACCEPT / DEFER / ACCEPT_SUMMARY_ONLY)
    4. COMPUTE dispositionAlias:
         ACCEPT_DEFERRED if rawDisposition in {DEFER, ACCEPT_SUMMARY_ONLY}
         ACCEPT          otherwise
    5. APPEND legalPolicy domain fields
  RETURN classifiedLedger
  RUN GC-050 classification checker on classifiedLedger
```

### Classification Ledger Schema

| Column | Required | Rule |
| --- | --- | --- |
| `normalizedPath` | yes | NR-05 |
| `sourceHash` | yes | NR-04 |
| `documentType` | yes | LPCI domain enum |
| `jurisdiction` | yes (T2+) | LPCI domain |
| `answerClass` | yes | CI1-T4 |
| `rawDisposition` | yes | NR-11 |
| `dispositionAlias` | yes | NR-11 |
| `sensitivityLevel` | yes | NR-06 |

---

## Architecture: Retrieval and Answer Boundary

### Design Principles

- **Citation-first**: every response surfaces the source document path,
  article/section reference, and effectiveDate.
- **Abstention rules**: if `answerClass = ESCALATE_OR_ABSTAIN` or
  `dispositionAlias = ACCEPT_DEFERRED`, the system must not produce a direct
  answer; it must return a source-only, procedural, or abstention receipt.
- **Freshness warning**: if `status = amended` or `superseded`, the response
  must flag that the source may not be current.
- **Conflict warning**: if two records conflict (same topic, different
  `effectiveDate` or `authorityLevel`), the response must list both and
  defer resolution to the operator.
- **No legal advice**: model output is explanation and summarization of
  retrieved evidence only, bounded to `answerClass`. Legal judgment is
  the operator's responsibility.

### Retrieval Flow (pseudocode notation — no executable file)

```
RETRIEVE(query, classifiedLedger):
  1. SEARCH classifiedLedger by keyword / semantic similarity (T3 index)
  2. FILTER: exclude ESCALATE_OR_ABSTAIN records from direct answer candidates
  3. RANK by authorityLevel DESC, effectiveDate DESC
  4. EMIT RetrievalReceipt:
       matched_paths: [...],
       answer_class:  <most restrictive answerClass in result set>,
       freshness_flag: true if any matched status in {amended, superseded},
       conflict_flag:  true if >1 record on same topic with different effectiveDate
  5. PASS RetrievalReceipt to LLM context with explicit answer boundary instruction
  6. LLM may summarize or explain only the retrieved evidence
     LLM must NOT claim legal judgment or advice quality
  7. RETURN AuditReceipt: query, matched_paths, answer_class, model_response_hash
```

### Answer Boundary Contract

| Condition | Allowed response |
| --- | --- |
| `answerClass = DIRECT_CITED_ANSWER` | direct citation + bounded explanation |
| `answerClass = SUMMARY_WITH_SOURCE` | summary of retrieved text only |
| `answerClass = PROCEDURAL_GUIDANCE` | procedural guidance grounded in retrieved source; no legal judgment |
| `answerClass = ESCALATE_OR_ABSTAIN` | abstention or escalation message only; no answer |
| `freshness_flag = true` | append freshness warning |
| `conflict_flag = true` | list both sources; defer resolution |

---

## Architecture: API / UI Surface Sketch

This section is a design sketch only. No API routes, UI components, or
database schemas are created in this tranche.

### Local API Sketch (no implementation)

```
POST /api/lpci/query
  body: { query: string, corpusId: string }
  response: AuditReceipt (matched_paths, answer_class, response, freshness_flag, conflict_flag)

POST /api/lpci/intake
  body: { corpusRoot: string, manifestPath: string }
  response: IntakeReport (rowCount, gaps, sourceHashSummary)
  requires: GC-051 pre-registration

GET /api/lpci/corpus/:corpusId/status
  response: { registered: bool, classificationStatus: string, rowCount: int }
```

### Local UI Sketch (no implementation)

```
Page: /lpci
  - Corpus selector (registered corpora only, from GC-051 registry)
  - Query input
  - Response panel:
      - Retrieved sources (normalizedPath, documentType, effectiveDate)
      - Answer boundary badge (DIRECT_CITED / SUMMARY_WITH_SOURCE / PROCEDURAL_GUIDANCE / ESCALATE_OR_ABSTAIN)
      - Freshness / conflict warnings
      - Audit receipt export (JSON)

Page: /lpci/admin/intake
  - Corpus root path input
  - Manifest upload
  - Intake report (row count, hash policy, gaps)
  - GC-051 registration status
```

### LLM Integration Sketch (no implementation)

- Operator supplies own API key for chosen provider (no CVF-managed key).
- LLM receives: system prompt with answer boundary contract + retrieved
  evidence block only; no corpus data transmitted beyond retrieved rows.
- Provider: configurable; default to OpenAI-compatible endpoint.
- No embedding stored or transmitted by CVF; embedding computation is
  operator's responsibility for T3 semantic index.

---

## Requirements

| Requirement | Tranche gate |
| --- | --- |
| GC-051 corpus registration before any intake | enforced before T2 dispatch |
| NR-04 per-file hash or manifest proxy | adopted in corpus intake spec |
| NR-05 normalizedPath algorithm | adopted from CI2-T2 checker |
| NR-11 dispositionAlias enforcement | enforced in classification pipeline |
| GC-050 classification checker pass | enforced at T2 classification close |
| GC-048 knowledge-map reconciliation | enforced at T2 classification close |
| Answer boundary contract | enforced at T4 retrieval boundary close |
| No legal advice claim | permanent out-of-scope |

---

## Verification

This architecture document is a planning artifact. Runtime verification
(unit tests, integration tests, E2E browser tests) is out of scope for
this tranche and must be defined in the tranche that implements each stage
(T3, T4, T5).

Planning-level verification for this tranche:

- `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md` cites NR-04/NR-05/NR-11.
- `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` declares hash policy.
- No executable files created in this tranche.

---

## Claim Boundary

This document claims:

- architecture design for LPCI1 corpus intake, classification, retrieval,
  and API/UI surface at planning level.

This document does NOT claim:

- runtime implementation correctness;
- legal answer accuracy or production readiness;
- vector database or embedding correctness;
- provider integration readiness;
- public or hosted readiness.

---

## Related

- `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md`
- `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md`
- `docs/baselines/CVF_GC018_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_2026-06-02.md`
- `docs/roadmaps/CVF_LPCI1_LEGAL_POLICY_CORPUS_INTELLIGENCE_PRODUCT_MVP_ROADMAP_2026-06-02.md`
- `docs/reference/CVF_CI1_T7_LPCI_INTAKE_BRIDGE_2026-06-02.md`
- `docs/corpus-intelligence/CVF_CI2_T4_PRODUCT_READINESS_PILOT_CORPUS_PACK.json`

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 architecture document existed before
this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T1 establishes corpus intake, classification,
retrieval, and API/UI architecture at planning level

Next control action: `OPEN` — T2 domain classification work order is the next
authorized dispatch after T1 architecture review closes

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: architecture planning document only; no provider calls, runtime
changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: architecture document references private internal governance chain;
not suitable for public CVF repository until a sanitized public overview
is prepared separately.

Public-sync boundary: no artifacts from this batch are queued for public-sync.
