<!-- Text Encoding Exception: this user-facing report preserves Vietnamese filenames and short evidence excerpts from existing EC-T4 evidence artifacts. Authorized per docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md. -->

# CVF LPCI2 EC-T4 Operator Metadata Gap Report

Memory class: FULL_RECORD

Status: OPERATOR_ACTION_REQUIRED

docType: operator_gap_report

Date: 2026-06-12

Owner: Codex

Source artifacts:

- `docs/reference/CVF_LPCI2_EC_T4_OPERATOR_DATE_EVIDENCE_LEDGER_2026-06-11.md`
- `docs/reference/CVF_LPCI2_EC_T4_PROPOSED_METADATA_BACKFILL_2026-06-11.json`
- `docs/reviews/CVF_LPCI2_EC_T4_OPERATOR_DATE_EVIDENCE_BACKFILL_COMPLETION_2026-06-11.md`
- `docs/reference/CVF_LPCI2_EC_T4_OPERATOR_METADATA_GAP_REPORT_2026-06-12.json`

---

## Scope / Applies-To

Target: EC-T4 operator metadata-gap review for the six Policy_Local example
corpus candidates already scanned by prior governed artifacts.

Owner boundary: Codex authored this report as an operator-facing checklist. It
does not authorize EC-T5, metadata mutation, corpus promotion, retrieval,
current-law status, Policy_Local workspace writes, or public-sync. Operator
confirmation or a separate governed EC work order is required before any
domain-specific continuation.

---

## Purpose

This report converts EC-T4 scan findings into an operator-facing correction
checklist. The result is intentionally a stop signal, not a failure of the scan
layer. CVF correctly found that four input files do not contain enough
source-backed date/status evidence for safe EC-02 gate activation.

## Important Interpretation

`UNKNOWN_OR_AMBIGUOUS` means the input file lacks enough reliable metadata for
the next governance step. It does not mean the file is useless, unreadable, or
that the worker failed.

For this corpus, the finding is valuable because it prevents CVF from guessing:

- final issue dates from filenames;
- legal/effective status from draft documents;
- parent notice numbers from incomplete annex headers;
- `IN_FORCE` status before source-backed effective-date evidence exists.

## Current Outcome Summary

| Outcome | Count | Candidate IDs |
| --- | ---: | --- |
| `SOURCE_EVIDENCED_NEEDS_CONFIRMATION` | 2 | T11A-CAND-001, T11A-CAND-003 |
| `UNKNOWN_OR_AMBIGUOUS_OPERATOR_ACTION_REQUIRED` | 4 | T11A-CAND-002, T11A-CAND-004, T11A-CAND-005, T11A-CAND-006 |
| `BLOCKED_FOR_HASH_OR_PATH` | 0 | N/A |
| `BLOCKED_FOR_CONFLICT` | 0 | N/A |

All six files remain under `ec02GateRetained=BLOCKED_UNTIL_2026-07-01`.

EC-T4 tranche disposition: `CLOSED_BLOCKED_BOUNDED`. Scan/evidence processing
is complete; downstream metadata resolution is not complete.

## Operator Checklist

| Candidate | File | CVF finding | Why blocked | Operator action needed | Acceptable resolution |
| --- | --- | --- | --- | --- | --- |
| T11A-CAND-001 | `3094.pdf` | Source-evidenced date, still needs type/status confirmation | Date and document number are visible, but document appears to be administrative advisory correspondence, not a formal regulatory instrument | Confirm document type/status and whether this should remain `documentType=other` | Keep `STATUS_UNKNOWN`, or provide a confirmed classification with rationale |
| T11A-CAND-002 | `BC- Kết quả rà soát dự án chậm triển khai - Phú Xuyên 10.5.2026.pdf` | Unknown/ambiguous | Body date is blank; filename date is filename-only evidence | Provide final signed/issued report date and status, or mark as draft/input-only | Fill `promulgationDate` only if final issue date is confirmed; otherwise keep `STATUS_UNKNOWN` |
| T11A-CAND-003 | `Kien nghi thành ủy hà nội (1).docx` | Source-evidenced date, still needs type/status confirmation | Date and document number are visible, but file is a petition/recommendation, not a formal regulation | Confirm document type/status and whether this should remain `documentType=other` | Keep `STATUS_UNKNOWN`, or provide a confirmed classification with rationale |
| T11A-CAND-004 | `Phu luc danh sach du an.pdf` | Unknown/ambiguous | Annex header refers to parent notice, but parent notice number/date are blank | Provide parent notice number/date and confirm which parent document this annex belongs to | Link to confirmed parent notice and inherit/record parent metadata; otherwise keep `STATUS_UNKNOWN` |
| T11A-CAND-005 | `QD chấm dứt.pdf` | Unknown/ambiguous | Decision number/date are blank; effective-date clause says effective from signing date, but signing date is blank | Provide final signed decision number, signing date, and effective date if applicable | If final signed decision is supplied, candidate may become an EC upgrade candidate; otherwise keep `STATUS_UNKNOWN` |
| T11A-CAND-006 | `Thong bao thu hoi 24 du an.pdf` | Unknown/ambiguous | Notice number/date are blank; may relate to TB 591/TB-UBND but relationship is not confirmed | Provide final notice number/date and confirm relationship to TB 591/TB-UBND if applicable | If final signed notice is supplied, parent/annex relationships can be reconciled; otherwise keep `STATUS_UNKNOWN` |

## Detailed Error Notes

### T11A-CAND-002

Error class: `MISSING_FINAL_ISSUE_DATE`

Observed evidence:

- document body date field is blank;
- filename contains `10.5.2026`;
- filename-only date is not accepted as final issue-date evidence.

User-facing message:

CVF could read the file and identify a likely report, but the document body
does not contain a final issue date. Please provide the final signed/issued
version or confirm the date and status manually.

### T11A-CAND-004

Error class: `MISSING_PARENT_NOTICE_METADATA`

Observed evidence:

- annex header says it is attached to a parent notice;
- parent notice number is blank;
- parent notice date is blank.

User-facing message:

CVF cannot safely attach this annex to a legal/current-status chain until the
parent notice number and date are confirmed.

### T11A-CAND-005

Error class: `MISSING_SIGNED_DECISION_METADATA`

Observed evidence:

- decision number is blank;
- signing date is blank;
- effective-date clause depends on signing date;
- source references TB 591/TB-UBND dated 2026-05-30.

User-facing message:

This looks like a strong candidate for a real administrative decision, but the
file appears unsigned or draft-like because its decision number and signing
date are blank. CVF must not infer effective status from context alone.

### T11A-CAND-006

Error class: `MISSING_FINAL_NOTICE_METADATA`

Observed evidence:

- notice number is blank;
- date is blank;
- content may match a notice referenced elsewhere, but relationship is not
  confirmed.

User-facing message:

CVF detected a likely notice related to project revocation, but cannot safely
promote it until the final notice number/date and relationship to TB
591/TB-UBND are confirmed.

## What The User Can Provide

The user can unblock EC-T4 by providing one of these evidence types for each
blocked candidate:

| Evidence type | Good enough? | Notes |
| --- | --- | --- |
| Final signed PDF/DOCX with number/date visible | Yes | Preferred |
| Operator-confirmed date/status with source explanation | Possibly | Must be recorded as operator-supplied evidence, not source-evidenced |
| Filename date only | No | Useful hint, not enough |
| Draft with blank date/number | No | Keep `STATUS_UNKNOWN` |
| Related document reference without confirmed relationship | No | Needs parent/child linkage evidence |

## Expected System Behavior

For a user-facing PolicyLocal flow, CVF should show a correction message like:

```text
This file was scanned successfully, but CVF cannot verify required legal
metadata. Please confirm the final document number, issue/signing date,
effective date if applicable, and whether this is a final signed document or a
draft/input-only record.
```

The flow should then export this report or a record-level equivalent for user
review before any EC-T5/EC-T6 activation.

## Operator Review Flow

1. Review the six candidate rows above.
2. For a blocked candidate, provide a final signed file or an explicit
   operator-supplied metadata statement with its source rationale.
3. Keep unresolved records at `STATUS_UNKNOWN`.
4. Open a fresh EC-T4 evidence-resolution successor only after new evidence
   exists.
5. Re-evaluate EC-T5/EC-T6 separately; this report does not release them.

Machine-readable companion:

`docs/reference/CVF_LPCI2_EC_T4_OPERATOR_METADATA_GAP_REPORT_2026-06-12.json`

## Claim Boundary

This report is a correction checklist derived from existing EC-T4 evidence. It
does not claim current-law correctness, legal advice quality, source
authenticity, corpus ingestion, retrieval readiness, EC-T5 gate behavior,
`QUERY_CLASS_GATED` profile adoption, T12 readiness, production readiness,
public readiness, or release readiness.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private operator-facing provenance report; no public-sync authorized.
