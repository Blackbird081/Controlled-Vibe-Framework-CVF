# CVF LPCI1-T2 Domain Classification Specification

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-06-03

executionBaseHead: `89d5940f`

## Purpose

Define the complete domain classification scheme for LPCI1. This specification
establishes:

- the canonical `answerClass` classification criteria for legal/policy documents
  (GC-050 aligned, verified from `CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`);
- the `documentType` enum and classification rules;
- the jurisdiction taxonomy levels;
- the sensitivity classification rules (NR-06) for legal/policy corpora;
- the canonical `ownerSurface` and `knowledgeRegion` values for the legal/policy
  domain;
- the `dispositionAlias` enforcement rules (NR-11) for legal/policy classification.

This specification is a documentation artifact only. It does not implement any
runtime code, real corpus ingestion, vector index, embedding, or provider calls.
All classification tables are planning-level definitions, not tested runtime
outputs.

---

## Source

| Authority | Path | Verified state |
| --- | --- | --- |
| CI2-T3 enforced index model | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` | ACTIVE — `answerClass` allowed values verified at `enforcedFields[answerClass]` |
| GC-050 classification standard | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` | ACTIVE |
| NR-11 standard | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` | ACTIVE |
| NR-04 standard | `docs/reference/CVF_CORPUS_SOURCE_HASH_STANDARD_2026-06-02.md` | ACTIVE |
| NR-05 standard | `docs/reference/CVF_CORPUS_PATH_NORMALIZATION_ALGORITHM_STANDARD_2026-06-02.md` | ACTIVE |
| NR-06 standard | `docs/reference/CVF_CORPUS_SEARCH_FILTER_READINESS_STANDARD_2026-06-02.md` | ACTIVE |
| NR-03 vocabulary | `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json` | `ownerSurface` field, canonical enum |
| T1 architecture | `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md` | ACTIVE — answerClass vocabulary reviewer-corrected |
| T1 corpus intake spec | `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md` | ACTIVE |
| LPCI1 GC-018 T1 supplement | `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md` | ACTIVE |

---

## Scope

Applies to: all LPCI1 corpus intake and classification records (T2 onwards).

Out of scope: CI1/CI2 governance pilot records (`GOVERNANCE_PILOT_NO_LEGAL_CORPUS`);
those use the CI2-T4 pilot pack schema, not the LPCI legal/policy domain schema.

---

## answerClass Classification Criteria

Source-verified from `CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`:
`enforcedFields[answerClass].description` — allowed values:
`DIRECT_CITED_ANSWER`, `SUMMARY_WITH_SOURCE`, `PROCEDURAL_GUIDANCE`,
`ESCALATE_OR_ABSTAIN`.

### DIRECT_CITED_ANSWER

**Criteria**: the source document contains an explicit, point-of-law statement
that can be directly cited with no summarization required.

Applies to:

- **Law / Decree articles**: statutory language, penal provisions, compliance
  thresholds (e.g., "Article 12 prohibits...").
- **Binding circulars**: ministry-issued circulars with mandatory compliance
  language.
- **Effective decisions**: signed executive decisions with a clear, bounded
  directive.
- **Status requirements**: `status = effective` AND `authorityLevel =
  law | decree | binding_circular | binding_decision`.

**Constraint**: source text must be unambiguous, single-clause, and currently
effective. Multi-clause or conditional provisions must use `SUMMARY_WITH_SOURCE`.

---

### SUMMARY_WITH_SOURCE

**Criteria**: the source document requires summarization before it can be used
to answer a query, or the relevant content spans multiple clauses.

Applies to:

- **Multi-clause laws / decrees**: sections with conditional, cross-referenced,
  or exception-carrying language.
- **Amended or superseded documents** where the effective clause is not self-
  contained (`status = amended`).
- **Non-binding notices**: ministry or department notices that describe policy
  intent but are not legally enforceable.
- **Policy frameworks**: company-level policies that set direction but delegate
  details to separate procedures.
- **Status requirements**: any document where `status = amended` OR
  `authorityLevel = notice | policy_framework | recommendation`.

**Constraint**: summary must not alter the legal meaning of the original text.
The citation to the source document is mandatory.

---

### PROCEDURAL_GUIDANCE

**Criteria**: the source document contains procedural, operational, or
process-oriented content that guides how to comply, not what the rule is.

Applies to:

- **SOPs and operational procedures**: step-by-step compliance or operational
  instructions.
- **Internal contracts and service agreements** with restricted scope (operator
  must authorize retrieval).
- **Implementation guides**: documents that explain the practical steps for
  satisfying a law or policy, not the law itself.
- **Status requirements**: `documentType = SOP | contract | implementation_guide`
  regardless of `authorityLevel`.

**Constraint**: procedural guidance responses must be grounded in the retrieved
source; no legal judgment may be added. Operator must confirm retrieval
authorization for contract-type documents.

---

### ESCALATE_OR_ABSTAIN

**Criteria**: the source document cannot be safely used to answer queries due
to its status, scope, or sensitivity, and the system must abstain or escalate
to human review.

Applies to:

- **Repealed or obsolete documents**: `status = repealed | obsolete`.
- **Superseded documents without a successor pointer**: `status = superseded`
  AND no `replacedBy` reference available.
- **Out-of-jurisdiction documents**: `jurisdiction` does not match the query
  context.
- **Unknown status documents**: `status = unknown` — cannot verify currentness.
- **Draft documents**: `status = draft` — not yet in force.
- **Any document with `rawDisposition = DEFER`**: deferred disposition must
  propagate to abstention at query time.

**Constraint**: ESCALATE_OR_ABSTAIN rows must NOT appear as direct answer
candidates in retrieval. The system must return an abstention or escalation
receipt with the matched path cited for transparency.

---

## documentType Enum

The canonical document type enum for LPCI legal/policy classification:

| Value | Description | Default answerClass |
| --- | --- | --- |
| `law` | statutory legislation; enacted by legislature | `DIRECT_CITED_ANSWER` (if single clause) or `SUMMARY_WITH_SOURCE` |
| `decree` | executive decree with binding force | `DIRECT_CITED_ANSWER` (if bounded) or `SUMMARY_WITH_SOURCE` |
| `circular` | ministry/department circular; may be binding or advisory | `DIRECT_CITED_ANSWER` (binding) or `SUMMARY_WITH_SOURCE` (advisory) |
| `policy` | company or organizational policy | `SUMMARY_WITH_SOURCE` or `PROCEDURAL_GUIDANCE` |
| `notice` | announcement or informational communication; non-binding | `SUMMARY_WITH_SOURCE` |
| `decision` | signed administrative or judicial decision | `DIRECT_CITED_ANSWER` (binding decisions) |
| `SOP` | standard operating procedure | `PROCEDURAL_GUIDANCE` |
| `contract` | agreement with restricted retrieval scope | `PROCEDURAL_GUIDANCE` (retrieval-authorized only) |
| `implementation_guide` | practical compliance guide | `PROCEDURAL_GUIDANCE` |
| `other` | does not fit above categories | assigned case-by-case; default `SUMMARY_WITH_SOURCE` |

**Note**: `documentType` is a LPCI domain extension field. It is not present in
CI2-T4 pilot pack governance records (GOVERNANCE_PILOT packType). LPCI T2
operators must populate `documentType` for every real legal corpus record.

---

## Jurisdiction Taxonomy

The jurisdiction taxonomy defines the hierarchical levels used to populate the
`jurisdiction` field in LPCI intake records.

### Taxonomy Levels

| Level | Enum range | Examples |
| --- | --- | --- |
| `international` | international treaty or multi-country agreement | UNCITRAL, FATF guidelines, WTO rules |
| `national` | country-level legislation | VN Law on Enterprises, US Code Title 26 |
| `provincial` | province, state, or region | Ho Chi Minh City ordinance, California AB-5 |
| `municipal` | city or district regulation | Hanoi city circular |
| `organizational` | company-level policy across multiple jurisdictions | Global HR Policy |
| `departmental` | single department or business unit policy | Finance Department SOP |
| `contractual` | bilateral or multilateral agreement within a defined scope | Service Level Agreement |
| `unknown` | jurisdiction cannot be determined from available metadata | assign `ESCALATE_OR_ABSTAIN` |

### Jurisdiction Population Rules

- `jurisdiction` must be set for every real legal corpus record from T2 onwards.
- If `jurisdiction = unknown`, `answerClass` must be `ESCALATE_OR_ABSTAIN`.
- If `jurisdiction` conflicts with the query context, `answerClass` must be
  `ESCALATE_OR_ABSTAIN` regardless of `documentType`.
- Operator must populate `jurisdiction` in the intake manifest; the intake
  pipeline does not infer jurisdiction from content.

---

## Sensitivity Classification (NR-06)

Per CI1-T7 intake bridge guidance (non-blocking gap NR-06 — `DOCUMENTATION_ONLY`),
every LPCI corpus record must declare `sensitivityLevel` when the corpus mixes
sensitivity levels.

### Sensitivity Enum

| Value | Criteria |
| --- | --- |
| `public` | publicly available law, regulation, or notice; no access restriction |
| `restricted` | internal policy, SOP, contract, or document with limited distribution |
| `confidential` | document with explicit confidentiality obligation (contract NDA clause, personnel data) |
| `classified` | government-classified document; LPCI must not serve this class without operator authorization override |
| `unknown` | sensitivity cannot be determined; default to `restricted` treatment |

### Sensitivity Rules for LPCI

- Mixed-sensitivity corpora must declare `sensitivityLevel` per record.
- `sensitivityLevel = confidential` or `classified` restricts retrieval:
  the system must return a retrieval-denied receipt unless operator authorization
  is explicitly granted.
- `sensitivityLevel = restricted` requires operator to confirm retrieval
  authorization at corpus registration (GC-051) time.
- `sensitivityLevel = public` has no retrieval restriction.

---

## ownerSurface and knowledgeRegion Mapping

### ownerSurface for Legal/Policy Domain

Canonical `ownerSurface` values (NR-03 enum, from CI2-T3 enforced model):
`PRIVATE_PROVENANCE`, `CONTROL_PLANE_CONTEXT_BUILDER`, `GOVERNANCE_LAYER`,
`LEARNING_PLANE`, `ROADMAP_BACKLOG`, `CONTROL_PLANE_ADAPTERS`.

LPCI legal/policy corpus records use:

| ownerSurface value | Applicable record types |
| --- | --- |
| `GOVERNANCE_LAYER` | all legal/policy domain records where the document is consumed by the CVF governance layer or LPCI product plane |

**Note**: LPCI is a CVF product operating within the governance layer. All LPCI
legal/policy corpus records must use `ownerSurface = GOVERNANCE_LAYER` unless
a future NR-03 vocabulary extension introduces a dedicated `LEGAL_POLICY_PLANE`
value. If such an extension is needed, the operator must open a vocabulary
extension work order before using a non-canonical value.

### knowledgeRegion for Legal/Policy Domain

`knowledgeRegion` is a GC-050 or project-specific routing label. Legal/policy
records use:

| knowledgeRegion value | Record scope |
| --- | --- |
| `LEGAL_POLICY_CORPUS` | any record of `documentType` in (law, decree, circular, policy, notice, decision, SOP, contract, implementation_guide) that is ingested for LPCI query serving |

**Note**: `LEGAL_POLICY_CORPUS` is a new LPCI-specific `knowledgeRegion` value.
It is not present in CI2-T4 pilot pack records (which use domain-specific values
like `GRAPH_CLI_INTERFACE`). This value is defined here and must be used in all
LPCI T2+ intake records.

---

## dispositionAlias Rules (NR-11)

Per `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`
and NR-11 adoption from LPCI1-T1 GC-018 supplement:

| rawDisposition | dispositionAlias | answerClass consequence |
| --- | --- | --- |
| `ACCEPT` | `ACCEPT` | as assigned per classification criteria above |
| `ACCEPT_SUMMARY_ONLY` | `ACCEPT_DEFERRED` | `answerClass` must be `SUMMARY_WITH_SOURCE` or `ESCALATE_OR_ABSTAIN`; never `DIRECT_CITED_ANSWER` |
| `DEFER` | `ACCEPT_DEFERRED` | `answerClass` must be `ESCALATE_OR_ABSTAIN`; record excluded from direct answer candidates |

**Cross-check rule**: if a record carries `dispositionAlias = ACCEPT_DEFERRED`,
its `answerClass` must not be `DIRECT_CITED_ANSWER` or `PROCEDURAL_GUIDANCE` —
only `SUMMARY_WITH_SOURCE` or `ESCALATE_OR_ABSTAIN` are permitted.

---

## Classification Decision Matrix

Full decision matrix combining documentType, status, disposition, and jurisdiction
into answerClass assignment:

| documentType | status | rawDisposition | jurisdiction match | answerClass |
| --- | --- | --- | --- | --- |
| law / decree | effective | ACCEPT | yes | DIRECT_CITED_ANSWER |
| law / decree | amended | ACCEPT | yes | SUMMARY_WITH_SOURCE |
| law / decree | superseded / repealed / obsolete | any | any | ESCALATE_OR_ABSTAIN |
| law / decree | draft | any | any | ESCALATE_OR_ABSTAIN |
| circular (binding) | effective | ACCEPT | yes | DIRECT_CITED_ANSWER |
| circular (advisory) | effective | ACCEPT | yes | SUMMARY_WITH_SOURCE |
| policy | effective | ACCEPT | yes | SUMMARY_WITH_SOURCE |
| notice | any | ACCEPT | yes | SUMMARY_WITH_SOURCE |
| decision (binding) | effective | ACCEPT | yes | DIRECT_CITED_ANSWER |
| SOP / contract / implementation_guide | effective | ACCEPT | yes | PROCEDURAL_GUIDANCE |
| any | unknown | any | any | ESCALATE_OR_ABSTAIN |
| any | any | DEFER | any | ESCALATE_OR_ABSTAIN |
| any | any | ACCEPT_SUMMARY_ONLY | any | SUMMARY_WITH_SOURCE |
| any | any | any | jurisdiction mismatch | ESCALATE_OR_ABSTAIN |

---

## Requirements

| Requirement | Applicable to |
| --- | --- |
| `answerClass` must be one of the four canonical GC-050 values | all LPCI T2+ classification records |
| `documentType` must be populated from the enum above | all LPCI T2+ records |
| `jurisdiction` must be populated; `unknown` maps to `ESCALATE_OR_ABSTAIN` | all LPCI T2+ records |
| `sensitivityLevel` must be declared for mixed-sensitivity corpora (NR-06) | all LPCI T2+ corpora |
| `ownerSurface = GOVERNANCE_LAYER` for all LPCI legal/policy records | all LPCI T2+ records |
| `knowledgeRegion = LEGAL_POLICY_CORPUS` for all LPCI legal/policy records | all LPCI T2+ records |
| `rawDisposition` preserved; `dispositionAlias` added per NR-11 | all LPCI T2+ classification records |
| `dispositionAlias = ACCEPT_DEFERRED` prohibits `answerClass = DIRECT_CITED_ANSWER` | must be enforced by future T3+ corpus classification packets |
| GC-050 classification checker pass | per future corpus packet, not proven by this spec-only tranche |
| GC-048 knowledge-map reconciliation | per future corpus packet, not proven by this spec-only tranche |

---

## Enforcement

| Rule | Checker |
| --- | --- |
| `answerClass` canonical value | `governance/compat/check_corpus_intelligence_classification.py` (GC-050) |
| `rawDisposition` / `dispositionAlias` NR-11 | `governance/compat/check_corpus_packet_disposition_canonical.py` |
| `normalizedPath` NR-05 | `governance/compat/check_corpus_packet_normalized_path.py` |
| `sourceHash` NR-04 | `governance/compat/check_corpus_packet_source_hash.py` |
| Governance structural completeness | `governance/compat/check_markdown_structural_completeness.py` |
| Pre-implementation autorun gate | `governance/compat/run_agent_autorun_workflow_gate.py` |

**Future enforcement note**: `ownerSurface`, `knowledgeRegion`, `documentType`,
`jurisdiction`, and `sensitivityLevel` are not machine-checked by a dedicated
checker in this tranche. Operator and reviewer verify these fields manually at
future corpus packet close. A dedicated checker is a candidate for T3 scope.

---

## Verification

This specification is a planning artifact. Verification at this tranche:

- All four `answerClass` values cross-checked against
  `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`
  `enforcedFields[answerClass].description` (field verified at execution).
- NR-11 `dispositionAlias` rules consistent with T1 GC-018 supplement adoption.
- Decision matrix derived from T1 architecture answer boundary contract.
- No real corpus classified; decision matrix is planning-level.

Runtime classification correctness is not verified by this tranche. It must be
verified later per corpus packet after the operator registers a real legal
corpus in the GC-051 registry and a later work order explicitly authorizes
classification against that corpus.

---

## Non-Goals

- Implement any runtime classification code.
- Classify a real legal corpus (no GC-051 registration or scan in this tranche).
- Provide legal advice or compliance certification.
- Define a production-ready classifier model or embedding scheme.
- Claim any tested classification accuracy.
- Introduce new NR rules (all rules adopted from existing standards).

---

## Claim Boundary

This document claims:

- answerClass classification criteria aligned with GC-050 canonical values;
- documentType enum and default answerClass mapping;
- jurisdiction taxonomy and population rules;
- sensitivity classification rules per NR-06;
- ownerSurface and knowledgeRegion canonical mapping for legal/policy domain;
- dispositionAlias enforcement rules per NR-11;
- complete decision matrix for T2+ classification records.

This document does NOT claim:

- runtime classification correctness or tested behavior;
- legal answer accuracy or production readiness;
- corpus ingestion completeness;
- embedding or vector index correctness;
- checker enforcement of `ownerSurface`, `knowledgeRegion`, `documentType`,
  or `jurisdiction` fields (checker scope is T3 candidate).

---

## Finding-To-Governance Learning Disposition

Defect class: `RULE_GAP` — no LPCI1 domain classification scheme existed
before this tranche

Learning lane: `GOVERNANCE_CONTROL_PLANE`

Disposition: `RULE_ADDED` — LPCI1-T2 establishes the full domain classification
scheme: answerClass criteria, documentType enum, jurisdiction taxonomy,
sensitivity rules, ownerSurface/knowledgeRegion mapping, dispositionAlias rules,
and classification decision matrix

Next control action: `OPEN` — T3 search and filter index work order is the
next authorized dispatch after T2 closes

Runtime/provider/cost learning: `N/A_WITH_REASON`

Reason: documentation and specification artifact only; no provider calls,
runtime behavior changes, or cost events.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: domain classification spec references private corpus intelligence
evidence and internal governance chain; not suitable for public CVF repository.

Public-sync boundary: no artifacts from this batch are queued for public-sync.

---

## Related

- `docs/reference/CVF_LPCI1_T1_ARCHITECTURE_2026-06-02.md`
- `docs/reference/CVF_LPCI1_T1_CORPUS_INTAKE_SPEC_2026-06-02.md`
- `docs/baselines/CVF_GC018_LPCI1_T1_SUPPLEMENT_2026-06-02.md`
- `docs/corpus-intelligence/CVF_CI2_ENFORCED_CROSS_CORPUS_INDEX_MODEL.json`
- `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`
- `docs/work_orders/CVF_WO_LPCI1_T2_DOMAIN_CLASSIFICATION_2026-06-03.md`
