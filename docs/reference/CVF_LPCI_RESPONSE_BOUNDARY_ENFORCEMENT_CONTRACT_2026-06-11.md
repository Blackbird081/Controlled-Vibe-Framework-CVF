# CVF LPCI Response Boundary Enforcement Contract

Memory class: FULL_RECORD

Status: canonical LPCI response boundary enforcement contract

docType: reference

Date: 2026-06-11

contractVersion: policylocal.boundaryContract.ec-t2.v1

priorVersion: policylocal.boundaryContract.t7.v1
priorVersionPath: docs/reference/CVF_LPCI_RESPONSE_BOUNDARY_ENFORCEMENT_CONTRACT_2026-06-04.md

changedBy: LPCI2-EC-T2

authoredBy: LPCI2-EC-T2 (Claude worker, Codex review)

closingGaps: EC-T2 contract amendment

---

## Scope / Applies To

Applies to: any LPCI search or chat layer consuming the PolicyLocal pilot
corpus. Required before any search layer opens. Must be re-evaluated when
corpus is expanded, when `effectiveDate` transitions are reached, or when
`documentStatus` field changes on any corpus record.

## Purpose

Define the machine-readable policy contract enforcing response boundaries for
the PolicyLocal LPCI corpus. This version adds a `documentStatus` x query-class
matrix to EC-02, replacing the flat date-block model with query-class-aware
routing. A machine-readable gate semantics artifact now accompanies this
contract: `docs/reference/CVF_EC02_GATE_SEMANTICS_2026-06-11.json`.

## Change Summary From Prior Version

EC-02: replaced flat date-block with `documentStatus` x `queryClass` matrix
(5 rows); content queries on `PROMULGATED` now route to `SUMMARY_WITH_SOURCE`
+ disclosure. `notYetInForceDisclosure` upgraded to i18n template mechanism.
`documentStatus` added to `citationMinimum.minimumFields`. Collision note
added for `domainFacetFields.documentStatus`. `reviewRequired` extended.
EC-01, EC-03, EC-04 carried forward unchanged.

## Collision Note

`domainFacetFields.documentStatus: "approved"` exists in
`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/dscp.domain.profile.contract.test.ts`
line 70 as a company-docs test fixture generic facet field. This is NOT the
EC-02 lifecycle `documentStatus` enum (`PROMULGATED | IN_FORCE | STATUS_UNKNOWN`).
EC-02 lifecycle `documentStatus` is a corpus-record-level field. EC-T3 must
isolate or rename the company-docs fixture key if the schema overlap would
cause runtime confusion.

## Machine-Readable Policy Contract

```json
{
  "contractVersion": "policylocal.boundaryContract.ec-t2.v1",
  "priorVersion": "policylocal.boundaryContract.t7.v1",
  "corpusId": "policylocal-production-corpus-dropzone",
  "corpusFamily": "VN_NATIONAL_ASSEMBLY_2025",
  "jurisdiction": "VN_NATIONAL",
  "defaultAnswerClass": "SUMMARY_WITH_SOURCE",
  "blockedAnswerClasses": [
    {
      "answerClass": "DIRECT_CITED_ANSWER",
      "reason": "citation depth insufficient for article-level legal citation; amended laws have complex cross-references",
      "evidence": "T5 completion review; T2 domain classification matrix"
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
      "model": "documentStatus_x_queryClass",
      "ec02GateToken": "QUERY_CLASS_GATED",
      "ec02GateTokenRuntimeNote": "EC-T5 will replace BLOCKED_UNTIL_* in DSCP profiles with QUERY_CLASS_GATED after EC-T4 closes; runtime gate logic update is EC-T5 scope only",
      "matrix": [
        {
          "documentStatus": "PROMULGATED",
          "queryClass": "content_query",
          "requiredAnswerClass": "SUMMARY_WITH_SOURCE",
          "disclosureRequired": true,
          "ec02Fires": false,
          "note": "document content may be cited; notYetInForceDisclosure mandatory"
        },
        {
          "documentStatus": "PROMULGATED",
          "queryClass": "applicability_query",
          "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
          "disclosureRequired": false,
          "ec02Fires": true,
          "note": "applicability claims blocked; EC-02 fires"
        },
        {
          "documentStatus": "IN_FORCE",
          "queryClass": "content_query",
          "requiredAnswerClass": "SUMMARY_WITH_SOURCE",
          "disclosureRequired": false,
          "ec02Fires": false
        },
        {
          "documentStatus": "IN_FORCE",
          "queryClass": "applicability_query",
          "requiredAnswerClass": "DIRECT_CITED_ANSWER",
          "disclosureRequired": false,
          "ec02Fires": false
        },
        {
          "documentStatus": "STATUS_UNKNOWN",
          "queryClass": "any",
          "requiredAnswerClass": "ESCALATE_OR_ABSTAIN",
          "disclosureRequired": false,
          "ec02Fires": true,
          "note": "unknown status forces escalation for all query types"
        }
      ],
      "boundaryConstraint": "BLOCKED_UNTIL_2026-07-01 remains active in all DSCP profiles through EC-T4 inclusive; QUERY_CLASS_GATED token not yet in any runtime profile",
      "evidence": "EC-T1 GC-018 CLOSED_PASS_BOUNDED commit 5e184d00; D-01 documentStatus ACCEPTED; D-02 QUERY_CLASS_GATED ACCEPTED; D-04 boundary confirmed"
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
      "conditions": "corpus record processingStatus=READ_DEEP AND documentStatus IN [PROMULGATED, IN_FORCE] AND queryClass=content_query AND no escalate condition triggered",
      "citationRequirement": "must cite sourcePath and evidencePointer; must include effectiveDate, freshnessStatus, and documentStatus in response metadata",
      "notYetInForceDisclosure": {
        "required": true,
        "triggerCondition": "documentStatus=PROMULGATED AND queryClass=content_query",
        "templateFields": ["{promulgationDate}", "{effectiveDate}", "{freshnessCheckedAt}"],
        "localeSource": "domain profile locale declaration; default en",
        "templates": {
          "en": "Note: This document was promulgated on {promulgationDate} and is not yet in force as of {freshnessCheckedAt}. Effective date: {effectiveDate}. Verify current status before relying on this information.",
          "vi": "Luu y: Van ban nay da ban hanh ngay {promulgationDate}, chua co hieu luc tinh den {freshnessCheckedAt}. Ngay co hieu luc: {effectiveDate}. Vui long kiem tra trang thai phap ly truoc khi ap dung."
        },
        "inlineLiteralForbidden": "Pipeline code must not use an inline-literal language string; use template entry from domain profile or project i18n config"
      }
    },
    {
      "answerClass": "PROCEDURAL_GUIDANCE",
      "conditions": "answer limited to describing amendment procedure, issuance procedure, or legislative process; no legal-advice component; source citation present",
      "citationRequirement": "must cite sourcePath, article, and evidencePointer"
    }
  ],
  "citationMinimum": {
    "required": true,
    "minimumFields": ["sourcePath", "evidencePointer", "effectiveDate", "freshnessStatus", "documentStatus"],
    "preferredFields": ["lawNumber", "articleReference", "textSnippet"]
  },
  "freshnessDisclosure": {
    "required": true,
    "rule": "every answer must include freshnessStatus in response metadata; if documentStatus=PROMULGATED, a notYetInForceDisclosure is mandatory"
  },
  "reviewRequired": "before any production chat runtime opens; after effectiveDate transition (2026-07-01); when corpus is expanded; when documentStatus field changes on any corpus record"
}
```

## Claim Boundary

This contract defines enforcement rules for the PolicyLocal pilot corpus. It
does not claim legal correctness, legal sufficiency, production readiness, or
AI-generated legal advice. EC-02 hard boundary 2026-07-01 remains in force
until EC-T5 closes with operator-supplied `effectiveDate` evidence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY
