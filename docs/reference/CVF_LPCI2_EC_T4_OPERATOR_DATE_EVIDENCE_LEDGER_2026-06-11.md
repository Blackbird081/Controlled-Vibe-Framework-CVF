<!-- Text Encoding Exception: this file contains Vietnamese Unicode text in evidencePointer fields transcribed verbatim from T11B-verified source documents. Authorized per docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md. -->

# CVF LPCI2 EC-T4 Operator Date Evidence Ledger

Memory class: FULL_RECORD

Status: CLOSED_BLOCKED_BOUNDED

docType: evidence_ledger

Date: 2026-06-11

Worker: Claude

executionBaseHead: `6379fd6d`

sourceManifestSha256: `023F1276092756232949662E9BE6E635D545AB22B2BD19284F11F82789C7FD1A`

---

## Scope

Applies to: EC-T4 tranche only. Six T11 candidate files from the PolicyLocal
external workspace. Worker: Claude under `WORKER_MUST_NOT_COMMIT`. Reviewer:
Codex. Output consumed by: EC-T4 proposed metadata backfill JSON and worker
return packet. Does not apply to any other tranche, corpus, or session.

## Purpose

Human-readable per-candidate date/status/jurisdiction evidence ledger for
EC-T4. All six T11 candidate files were inspected using T11B-verified hash
evidence and extracted-text auxiliary files in
`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex\_extracted_text`.

## Hash Revalidation Note

Worker execution reused the prior T11B verification result rather than
finishing a redundant binary recomputation. During reviewer closure on
2026-06-11, Codex independently recomputed SHA-256 and size for all six T11B
absolute paths. All paths existed, all hashes matched T11B
`computedHashSha256`, and all sizes matched T11B `observedSizeBytes`. The
reviewer-final evidence supersedes the incomplete worker recomputation note.

## Evidence Summary

| Metric | Count |
| --- | --- |
| SOURCE_EVIDENCED | 2 |
| UNKNOWN_OR_AMBIGUOUS | 4 |
| BLOCKED_FOR_CONFLICT | 0 |
| BLOCKED_FOR_HASH_OR_PATH | 0 |
| Total candidates | 6 |

## Per-Candidate Evidence Ledger

| Field | T11A-CAND-001 |
| --- | --- |
| `candidateId` | T11A-CAND-001 |
| `filename` | 3094.pdf |
| `candidateFamily` | applied_policy_record |
| `documentType` | other |
| `sourceHashSha256` | `61fafa4b69e9b0423c9bd3533ba6b5be531b9b73c26c6cfb62933008bfecc4d5` |
| `pathVerification` | HASH_MATCH (T11B index 1, size 842159 bytes) |
| `promulgationDateCandidate` | 2026-05-14 |
| `effectiveDateCandidate` | unknown |
| `jurisdictionCandidate` | Hà Nội |
| `currentStatusCandidate` | active administrative advisory letter (not a regulatory instrument) |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | SOURCE_EVIDENCED |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `3094.txt` PAGE 1: "Hà Nội, ngày 14 tháng 5 năm 2026"; letterhead: "UBND THÀNH PHỐ HÀ NỘI / Sở QUY HOẠCH - KIẾN TRÚC"; document number: 3094/QHKT-QKĐ |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | SOURCE_EVIDENCED — promulgationDate 2026-05-14 proposed; effectiveDate and final status require operator confirmation; document is administrative advisory correspondence, not a formal law/regulation |

---

| Field | T11A-CAND-002 |
| --- | --- |
| `candidateId` | T11A-CAND-002 |
| `filename` | BC- Kết quả rà soát dự án chậm triển khai - Phú Xuyên 10.5.2026.pdf |
| `candidateFamily` | project_case_record |
| `documentType` | other |
| `sourceHashSha256` | `2e7ed68a7814ff04e8246dbfb179f928d4d952b30169685f73115f2702459adc` |
| `pathVerification` | HASH_MATCH (T11B index 2, size 933326 bytes) |
| `promulgationDateCandidate` | unknown |
| `effectiveDateCandidate` | unknown |
| `jurisdictionCandidate` | Phú Xuyên, Hà Nội |
| `currentStatusCandidate` | draft/submitted báo cáo (report) — date field blank in document body |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | UNKNOWN_OR_AMBIGUOUS |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `BC-...txt` PAGE 1: date field blank "ngày     tháng    năm 2026"; filename contains "10.5.2026" which is FILENAME_ONLY evidence; letterhead: "ỦY BAN NHÂN DÂN / XÃ PHÚ XUYÊN" |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | UNKNOWN_OR_AMBIGUOUS — document body date blank; filename date 10.5.2026 is FILENAME_ONLY and insufficient for final backfill without operator confirmation |

---

| Field | T11A-CAND-003 |
| --- | --- |
| `candidateId` | T11A-CAND-003 |
| `filename` | Kien nghi thành ủy hà nội (1).docx |
| `candidateFamily` | applied_policy_record |
| `documentType` | other |
| `sourceHashSha256` | `265047c2ca26b13f2c6212313f550f3ce0f66f85bd7470ec9c3618d4c54cb4f6` |
| `pathVerification` | HASH_MATCH (T11B index 3, size 45314 bytes) |
| `promulgationDateCandidate` | 2026-06-01 |
| `effectiveDateCandidate` | unknown (petition letter — no formal effective date clause) |
| `jurisdictionCandidate` | Hà Nội |
| `currentStatusCandidate` | active petition submitted to Hanoi Party Secretary and UBND Chairman |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | SOURCE_EVIDENCED |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `Kien nghi...txt` TABLE 1 R002: "Số: 158/CĐKTCN-ĐTXD / Hà Nội, ngày 01 tháng 06 năm 2026"; body paragraph [070]: "tính đến ngày hôm nay 1/06/2026" |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | SOURCE_EVIDENCED — promulgationDate 2026-06-01 proposed; document is kiến nghị (petition), not a regulatory instrument; operator should confirm document-type classification |

---

| Field | T11A-CAND-004 |
| --- | --- |
| `candidateId` | T11A-CAND-004 |
| `filename` | Phu luc danh sach du an.pdf |
| `candidateFamily` | project_case_record |
| `documentType` | other |
| `sourceHashSha256` | `cf4fa584fc62ea1edc9c9d27e7396040c7036b2f313c8f5586df04d5529ee46e` |
| `pathVerification` | HASH_MATCH (T11B index 4, size 537770 bytes) |
| `promulgationDateCandidate` | unknown |
| `effectiveDateCandidate` | unknown |
| `jurisdictionCandidate` | Hà Nội |
| `currentStatusCandidate` | draft annex — both parent TB number and date blank |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | UNKNOWN_OR_AMBIGUOUS |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `Phu luc...txt` PAGE 1 header: "(Kèm theo Thông báo số      /TB-UBND ngày   tháng   năm 2026 của UBND Thành phố)" — TB number and date both blank |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | UNKNOWN_OR_AMBIGUOUS — annex document; parent TB number and date both blank; date cannot be determined from document body alone |

---

| Field | T11A-CAND-005 |
| --- | --- |
| `candidateId` | T11A-CAND-005 |
| `filename` | QD chấm dứt.pdf |
| `candidateFamily` | administrative_decision |
| `documentType` | decision |
| `sourceHashSha256` | `47460fdfbdde10d69ae4838b711e086f4037cfd2609d6a4263caefbb1e9fabe7` |
| `pathVerification` | HASH_MATCH (T11B index 5, size 1292455 bytes) |
| `promulgationDateCandidate` | unknown |
| `effectiveDateCandidate` | unknown (Điều 4 states "có hiệu lực kể từ ngày ký" but signing date blank) |
| `jurisdictionCandidate` | Hà Nội |
| `currentStatusCandidate` | draft Quyết định (Decision) — QĐ number and date both blank; references TB 591/TB-UBND ngày 30/5/2026 as basis |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | UNKNOWN_OR_AMBIGUOUS |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `QD cham dut...txt` PAGE 1: date blank "Hà Nội, ngày       tháng       năm 2026"; QĐ number blank "Số:          /QĐ-UBND"; Điều 4: "có hiệu lực kể từ ngày ký"; WHEREAS references TB 591/TB-UBND ngày 30/5/2026 — suggests issue post-30/5/2026; signatory: "KT. CHỦ TỊCH / PHÓ CHỦ TỊCH / Bùi Duy Cường" |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | UNKNOWN_OR_AMBIGUOUS — draft decision; QĐ number and date blank; context suggests post-30/5/2026 but exact date requires operator confirmation; document is a formal revocation decision (documentType=decision) which is the strongest upgrade candidate once date and status are confirmed |

---

| Field | T11A-CAND-006 |
| --- | --- |
| `candidateId` | T11A-CAND-006 |
| `filename` | Thong bao thu hoi 24 du an.pdf |
| `candidateFamily` | administrative_notice |
| `documentType` | notice |
| `sourceHashSha256` | `4522d37bf8da78fb41d01d97cdb2bff3f7133af2b02e146f3537132ce603bee6` |
| `pathVerification` | HASH_MATCH (T11B index 6, size 1076338 bytes) |
| `promulgationDateCandidate` | unknown |
| `effectiveDateCandidate` | unknown |
| `jurisdictionCandidate` | Hà Nội |
| `currentStatusCandidate` | draft Thông báo (Notice) — TB number and date both blank; may be draft of TB 591/TB-UBND ngày 30/5/2026 referenced in CAND-005 |
| `proposedDocumentStatus` | STATUS_UNKNOWN |
| `operatorDateEvidenceState` | UNKNOWN_OR_AMBIGUOUS |
| `evidenceSourceType` | EXTRACTED_TEXT_AUXILIARY |
| `evidencePointer` | `Thong bao...txt` PAGE 1: date blank "Hà Nội, ngày       tháng      năm 2026"; TB number blank "Số:            /TB-UBND"; references TB 461-TB/TU ngày 28/5/2026 (Party directive); instructs completion by 31/5/2026; content matches TB 591/TB-UBND description in CAND-005 |
| `operatorConfirmationRequired` | true |
| `ec02GateRetained` | BLOCKED_UNTIL_2026-07-01 |
| `disposition` | UNKNOWN_OR_AMBIGUOUS — draft notice; TB number and date blank; contextual evidence suggests ~30/5/2026 but operator must confirm; possible relationship to TB 591/TB-UBND (CAND-005 reference) requires operator verification |

---

## Claim Boundary

This ledger asserts only that evidence was inspected in T11B-verified source
files and their corresponding extracted-text auxiliary files. It does not
claim current-law correctness, legal advice quality, source authenticity,
retrieval readiness, EC-T5 gate behavior, production readiness, public
readiness, or release readiness.

---

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance evidence ledger; no public-sync authorized.
