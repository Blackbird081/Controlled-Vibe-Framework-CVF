# CVF LPCI Response Boundary Enforcement Contract

Memory class: FULL_RECORD

Status: canonical LPCI response boundary enforcement contract

docType: reference

Date: 2026-06-04

contractVersion: `policylocal.boundaryContract.t7.v1`

authoredBy: LPCI2-T7 Corpus Facet Schema Authoring

closingGaps: T6-GAP-10

## Scope / Applies To

Applies to: any LPCI search or chat layer consuming the PolicyLocal pilot
corpus (`policylocal-production-corpus-dropzone`; VN_NATIONAL_ASSEMBLY_2025
family). Required before any search layer opens. Must be re-evaluated when
corpus is expanded or when `effectiveDate` transitions are reached.

## Purpose

Define the machine-readable policy contract that a search/API layer reads to
enforce response boundaries for the PolicyLocal LPCI corpus. This contract
prevents a search layer from silently returning answers at a higher authority
level than the corpus evidence supports.

This contract is required before any search layer opens. It is derived from:
- T5 adversarial sampling S1–S4 outcomes
- T2 answerClass decision matrix (`docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md`)
- GC-050 classification standard (`docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md`)

## Authority Chain

| Authority | Path | Disposition |
| --- | --- | --- |
| T6 gap T6-GAP-10 | `docs/reviews/CVF_LPCI2_T6_SEARCH_CHAT_READINESS_GATE_COMPLETION_2026-06-04.md` §Gap Register | ACCEPT |
| T5 adversarial sampling | `docs/reviews/CVF_LPCI2_T5_POLICYLOCAL_DEEP_CLASSIFICATION_COMPLETION_2026-06-04.md` §Adversarial Sampling | ACCEPT — S1–S4 outcomes are the empirical basis |
| GC-050 classification standard | `docs/reference/CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_STANDARD_2026-06-01.md` | ACCEPT |
| LPCI1-T2 domain classification spec | `docs/reference/CVF_LPCI1_T2_DOMAIN_CLASSIFICATION_SPEC_2026-06-03.md` | ACCEPT |

## Machine-Readable Policy Contract

```json
{
  "contractVersion": "policylocal.boundaryContract.t7.v1",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusFamily": "VN_NATIONAL_ASSEMBLY_2025",
  "jurisdiction": "VN_NATIONAL",
  "defaultAnswerClass": "SUMMARY_WITH_SOURCE",
  "blockedAnswerClasses": [
    {
      "answerClass": "DIRECT_CITED_ANSWER",
      "reason": "citation depth insufficient — article-level citation requires legal review; amended laws have complex cross-references",
      "evidence": "T5 completion review §Response Boundary; T2 domain classification matrix"
    }
  ],
  "escalateConditions": [
    {
      "id": "EC-01",
      "trigger": "legal_advice_request",
      "description": "Query asks what the user should do, what their rights are, or requests legal interpretation of applicability to their situation",
      "examples": ["What can I do under this law?", "Am I required to comply?", "Does this apply to my company?"],
      "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
      "escalationMessage": "This question requires qualified legal advice. Please consult a licensed legal professional.",
      "evidence": "T5 adversarial sampling S4 PASS"
    },
    {
      "id": "EC-02",
      "trigger": "current_applicability_before_effective_date",
      "description": "Query asks whether the law is currently in force when effectiveDate has not yet been reached",
      "examples": ["Is this law in effect?", "Does this law apply today?", "Is this currently enforceable?"],
      "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
      "escalationMessage": "This law has an effective date of 2026-07-01. As of the current date it is not yet in force. Please verify current legal status with a qualified professional.",
      "evidence": "T5-NOTE-1 not-yet-in-force boundary; T5 adversarial sampling S2 note",
      "expiresWhen": "effectiveDate reached AND freshnessStatus transitions to current"
    },
    {
      "id": "EC-03",
      "trigger": "legal_interpretation_request",
      "description": "Query asks for interpretation of ambiguous or conflicting clauses, scope of application, or precedent",
      "examples": ["What does Article X mean?", "How does this interact with Law Y?", "Which provision governs in case of conflict?"],
      "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
      "escalationMessage": "Legal interpretation requires qualified legal expertise. Please consult a licensed legal professional.",
      "evidence": "T2 domain classification matrix ESCALATE_OR_ABSTAIN boundary"
    },
    {
      "id": "EC-04",
      "trigger": "compliance_determination",
      "description": "Query asks whether a specific action, product, or entity is compliant with the law",
      "examples": ["Is my system compliant?", "Do I need to change X to comply?", "What changes are required for compliance?"],
      "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
      "escalationMessage": "Compliance determination requires qualified legal and technical review. Please consult a licensed professional.",
      "evidence": "T2 domain classification matrix ESCALATE_OR_ABSTAIN boundary"
    }
  ],
  "allowedAnswerClasses": [
    {
      "answerClass": "SUMMARY_WITH_SOURCE",
      "conditions": "corpus record processingStatus=READ_DEEP AND answerClass=SUMMARY_WITH_SOURCE AND no escalate condition triggered",
      "citationRequirement": "must cite sourcePath and evidencePointer; must include effectiveDate and freshnessStatus in response metadata",
      "notYetInForceDisclosure": "required when freshnessStatus=not_yet_in_force — append: 'Note: this law has not yet taken effect as of [freshnessCheckedAt]'"
    },
    {
      "answerClass": "PROCEDURAL_GUIDANCE",
      "conditions": "answer is limited to describing amendment procedure, issuance procedure, or legislative process; no legal-advice component; source citation present",
      "citationRequirement": "must cite sourcePath, article, and evidencePointer"
    }
  ],
  "citationMinimum": {
    "required": true,
    "minimumFields": ["sourcePath", "evidencePointer", "effectiveDate", "freshnessStatus"],
    "preferredFields": ["lawNumber", "articleReference", "textSnippet"]
  },
  "freshnessDisclosure": {
    "required": true,
    "rule": "every answer must include freshnessStatus in response metadata; if freshnessStatus=not_yet_in_force, a disclosure note is mandatory"
  },
  "adversarialSamplingEvidence": {
    "S1": {"queryClass": "direct_law_number_lookup", "outcome": "BOUNDARY_HOLD", "expectedAnswerClass": "SUMMARY_WITH_SOURCE"},
    "S2": {"queryClass": "effective_date_query", "outcome": "SUMMARY_WITH_SOURCE_WITH_NOTE", "expectedAnswerClass": "SUMMARY_WITH_SOURCE"},
    "S3": {"queryClass": "amendment_scope_query", "outcome": "SUMMARY_WITH_SOURCE", "expectedAnswerClass": "SUMMARY_WITH_SOURCE"},
    "S4": {"queryClass": "legal_advice_extraction", "outcome": "ESCALATE_OR_ABSTAIN", "expectedAnswerClass": "ESCALATE_OR_ABSTAIN"}
  },
  "contractSource": "LPCI2-T7; derived from T5 adversarial sampling, T2 answerClass matrix, GC-050 standard",
  "effectiveFrom": "2026-06-04",
  "reviewRequired": "before any production chat runtime opens; after effectiveDate transition (2026-07-01); when corpus is expanded"
}
```

## Enforcement Rules

A search or chat layer consuming this contract MUST:

1. **Read `defaultAnswerClass`** — never return an answer at a class higher
   than `defaultAnswerClass` unless explicit conditions allow it.
2. **Check `blockedAnswerClasses`** — if the planned response class is in this
   list, block it and escalate.
3. **Evaluate `escalateConditions` in order** — if any condition's `trigger`
   matches the query intent, return `ESCALATE_OR_ABSTAIN` with the
   `escalationMessage`.
4. **Check `freshnessStatus` before answering** — if `not_yet_in_force`, append
   the `notYetInForceDisclosure` note to every answer.
5. **Include minimum citation fields** — `sourcePath`, `evidencePointer`,
   `effectiveDate`, `freshnessStatus` are mandatory in every non-escalated answer.
6. **Do not infer** — if the answer requires legal interpretation not directly
   supported by the corpus text, trigger EC-03.

## Query Classification Heuristics

These heuristics guide automated trigger detection. They are not exhaustive —
when in doubt, escalate.

| Pattern | Likely trigger | Action |
| --- | --- | --- |
| "tôi có thể", "what can I do", "am I allowed", "my rights" | EC-01 legal advice | ESCALATE_OR_ABSTAIN |
| "có hiệu lực chưa", "is it in effect", "in force", "currently enforceable" | EC-02 current applicability | ESCALATE_OR_ABSTAIN |
| "có nghĩa là", "how to interpret", "what does X mean", "conflicting" | EC-03 legal interpretation | ESCALATE_OR_ABSTAIN |
| "tuân thủ", "comply", "compliance", "do I need to change" | EC-04 compliance | ESCALATE_OR_ABSTAIN |
| law number lookup, title lookup, date lookup | S1/S2 — summary allowed | SUMMARY_WITH_SOURCE |
| "sửa đổi những luật nào", "which laws amended", "amendment scope" | S3 — amendment summary | SUMMARY_WITH_SOURCE |

## Contract Lifecycle

- **Review required** before production chat runtime opens.
- **Update required** when:
  - `effectiveDate` is reached (2026-07-01) — EC-02 `expiresWhen` condition
    met; update `freshnessStatus` in corpus records; remove not-yet-in-force
    disclosure requirement.
  - Corpus is expanded with new files from the same or different family.
  - A later amendment to the same base law is added (may trigger superseded
    status for existing records).
- **Version bump required** for any substantive change. New version must
  reference prior version and document the change.

## Claim Boundary

This contract defines enforcement rules for the current PolicyLocal pilot
corpus (2 DOCX files, VN_NATIONAL_ASSEMBLY_2025 family,
effectiveDate=2026-07-01). It does not claim legal correctness, legal
sufficiency, production readiness, or AI-generated legal advice.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY — references private corpus content and internal LPCI
governance chain. Sanitized version requires legal review before publication.
