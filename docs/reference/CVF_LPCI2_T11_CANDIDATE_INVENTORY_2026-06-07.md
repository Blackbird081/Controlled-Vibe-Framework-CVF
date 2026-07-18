# CVF LPCI2-T11 Candidate Inventory

Memory class: FULL_RECORD

Status: REVIEWED_PASS_BOUNDED

docType: candidate_inventory

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI2_T11A_POLICYLOCAL_CANDIDATE_INVENTORY_FOR_CLAUDE_2026-06-07.md`

executionBaseHead: `db43e449`

---

## Purpose

T11A candidate inventory for the six newly added PolicyLocal input files.
Filesystem metadata only — no body extraction, OCR, or ingestion.

---

## Scope / Applies To

This inventory applies only to the six candidate files directly under
`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input` and the
two existing pilot law DOCX files recorded as exclusions.

It does not inventory the later-clarified `Law use case_Codex` bundle. Codex
review requires a supplement for that bundle before T11A can close.

---

## Candidate Inventory Table

| Candidate ID | Filename | Extension | Size (bytes) | Last Modified | Candidate Family | Document Type | Current Status | Answer Class | EC-02 Applies | Source Role | Readable At |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `T11A-CAND-001` | `3094.pdf` | `.pdf` | 842159 | 2026-06-07 09:42:27 | `applied_policy_record` | `other` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\3094.pdf` |
| `T11A-CAND-002` | `BC- Ket qua ra soat du an cham trien khai - Phu Xuyen 10.5.2026.pdf` | `.pdf` | 933326 | 2026-06-07 09:43:18 | `project_case_record` | `other` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\BC- Kết quả rà soát dự án chậm triển khai - Phú Xuyên 10.5.2026.pdf` |
| `T11A-CAND-003` | `Kien nghi thanh uy ha noi (1).docx` | `.docx` | 45314 | 2026-06-07 09:29:35 | `applied_policy_record` | `other` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Kien nghi thành ủy hà nội (1).docx` |
| `T11A-CAND-004` | `Phu luc danh sach du an.pdf` | `.pdf` | 537770 | 2026-06-07 09:44:02 | `project_case_record` | `other` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Phu luc danh sach du an.pdf` |
| `T11A-CAND-005` | `QD cham dut.pdf` | `.pdf` | 1292455 | 2026-06-07 09:29:19 | `administrative_decision` | `decision` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\QD chấm dứt.pdf` |
| `T11A-CAND-006` | `Thong bao thu hoi 24 du an.pdf` | `.pdf` | 1076338 | 2026-06-07 09:43:55 | `administrative_notice` | `notice` | `unknown` | `ESCALATE_OR_ABSTAIN` | `true` | `expansion_candidate` | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Thong bao thu hoi 24 du an.pdf` |

**Candidate count: 6**

---

## Existing Pilot Law Sources (Excluded From Expansion)

The following two files are existing T9/T10 pilot corpus sources. They are
recorded here as excluded baselines and must not be re-ingested via T11.

| Pilot ID | Filename | Extension | Size (bytes) | Last Modified | Source Role |
|---|---|---|---|---|---|
| `pilot-exclusion-116_2025_QH15_666020` | `116_2025_QH15_666020.docx` | `.docx` | 36528 | 2026-06-04 00:08:06 | `existing_pilot_source` |
| `pilot-exclusion-148_2025_QH15_675262` | `148_2025_QH15_675262.docx` | `.docx` | 27881 | 2026-06-04 00:00:21 | `existing_pilot_source` |

---

## EC-02 Boundary Statement

All six candidates have `ec02Applies=true` because their effective legal
status, effective dates, and whether any content is currently in force cannot
be determined from filesystem metadata alone. No current-law claim or
production readiness claim is made for any candidate.

EC-02 freshness review remains required on or after 2026-07-01 before any
current-law claim may be made for any PolicyLocal corpus material.

---

## Claim Boundary

This inventory claims only that the named candidate files were present on the
filesystem at the enumeration time recorded in each row. It does not claim:

- document readability or text extraction;
- source authenticity or legal authority;
- current-law status or effective date;
- legal advice quality;
- corpus ingestion eligibility;
- search runtime behavior;
- production, hosted, public, or release readiness.

---

## Note On Filenames

Source filenames include Vietnamese Unicode characters. The `Filename` column
above uses ASCII-transliterated display names for agent-authored prose
readability; the `Readable At` column records the original exact filesystem
path as source evidence, per the existing-filename exception in
`docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md`.
