# CVF LPCI2-T11 Classification Pre-Check

Memory class: FULL_RECORD

Status: REVIEWED_PASS_BOUNDED

docType: reference

Date: 2026-06-07

workOrder: `docs/work_orders/CVF_AGENT_WORK_ORDER_LPCI2_T11C_POLICYLOCAL_CLASSIFICATION_PRE_CHECK_FOR_CLAUDE_2026-06-07.md`

GC-018: `docs/baselines/CVF_GC018_LPCI2_T11C_POLICYLOCAL_CLASSIFICATION_PRE_CHECK_2026-06-07.md`

executionBaseHead: `2bfd7ea1`

## Purpose

Record the T2-matrix classification pre-check for the 6 T11B-verified corpus
candidates and BNDL-006 non-corpus request artifact. Assigns domainCategory,
answerClass, ec02Gate, and t12Eligible per the T2 domain spec. No body
extraction, ingestion, or runtime action.

## Scope / Target / Owner Boundary

Target scope:

- 6 T11B-verified corpus candidate records (`T11A-CAND-001` through
  `T11A-CAND-006`);
- 1 T11B-verified non-corpus request artifact (`BNDL-006`);
- the additive `classificationPreCheck` fields in the external candidate
  manifest.

Owner boundary: this report is a metadata-only classification pre-check for
T11C. It does not authorize T11D readiness, T12 ingestion, runtime changes,
provider calls, public-sync, or legal/current-law claims.

## Scope / Applies To

This report applies only to the T11B-verified records named in the T11C work
order and to the external manifest update at:

`D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data\generated\policylocal-t11-candidate-manifest.json`

It does not apply to unverified files, extracted text, rendered outputs, T9/T10
pilot records, or any runtime corpus.

## Classification Table

| ID | candidateFamily | documentType | currentStatus | jurisdiction | domainCategory | answerClass | ec02Gate | t12Eligible | T2-matrix rationale |
|---|---|---|---|---|---|---|---|---|---|
| `T11A-CAND-001` | `applied_policy_record` | `other` | `unknown` | `unknown` | `applied_policy` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Decision matrix row: any/unknown/any/any -> ESCALATE_OR_ABSTAIN. Both currentStatus and jurisdiction unknown from filesystem metadata. ec02Applies=true. Eligible conditional on EC-02 review after 2026-07-01 and operator-supplied status/jurisdiction metadata. |
| `T11A-CAND-002` | `project_case_record` | `other` | `unknown` | `unknown` | `project_case` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Same matrix row. Project review report (Phu Xuyen district, 10.5.2026). currentStatus and jurisdiction unknown from metadata only. ec02Applies=true. CAND-002 required Unicode fallback path (T11B finding: resolved under Law use case_Codex). Eligible conditional on EC-02 review and operator metadata. |
| `T11A-CAND-003` | `applied_policy_record` | `other` | `unknown` | `unknown` | `applied_policy` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Same matrix row. Petition/recommendation to Hanoi City Party Committee. currentStatus and jurisdiction unknown. ec02Applies=true. CAND-003 required Unicode fallback path (T11B finding: resolved under Law use case_Codex). Eligible conditional on EC-02 review and operator metadata. |
| `T11A-CAND-004` | `project_case_record` | `other` | `unknown` | `unknown` | `project_case` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Same matrix row. Annex/appendix of project list. currentStatus and jurisdiction unknown. ec02Applies=true. Eligible conditional on EC-02 review and operator metadata. |
| `T11A-CAND-005` | `administrative_decision` | `decision` | `unknown` | `unknown` | `administrative_decision` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Decision matrix row: any/unknown/any/any -> ESCALATE_OR_ABSTAIN overrides the decision/effective/ACCEPT/yes -> DIRECT_CITED_ANSWER path. documentType=decision (from QD prefix) but currentStatus unknown and jurisdiction unknown. ec02Applies=true. CAND-005 required Unicode fallback path (T11B finding: resolved under Law use case_Codex). When EC-02 passes and operator supplies status=effective + jurisdiction, this record is the strongest candidate for DIRECT_CITED_ANSWER upgrade. |
| `T11A-CAND-006` | `administrative_notice` | `notice` | `unknown` | `unknown` | `administrative_notice` | `ESCALATE_OR_ABSTAIN` | `BLOCKED_UNTIL_2026-07-01` | `CONDITIONAL` | Decision matrix row: notice/any/ACCEPT/yes -> SUMMARY_WITH_SOURCE, but jurisdiction=unknown and currentStatus=unknown force ESCALATE_OR_ABSTAIN. ec02Applies=true. When EC-02 passes and operator supplies jurisdiction + status, upgrade path is SUMMARY_WITH_SOURCE. |
| `BNDL-006` | N/A (agent_request) | N/A | N/A | N/A | N/A | N/A (non-corpus) | N/A | `NO` | Non-corpus request artifact. bundleArtifactRole=agent_request in T11B result. Not a corpus record; no answerClass or domainCategory assigned. t12Eligible=NO; not eligible for corpus ingestion. |

## EC-02 Gate Accounting

- Total corpus candidates: 6
- `ec02Gate=BLOCKED_UNTIL_2026-07-01`: 6 (all six)
- `ec02Gate=PASSES_EC02`: 0
- `ec02Gate=REQUIRES_REVIEW`: 0
- EC-02 invariant check: zero `BLOCKED_UNTIL_2026-07-01` records carry `t12Eligible=YES`. SATISFIED.

## t12-Eligibility Summary

| Verdict | Count | Records |
|---|---|---|
| `YES` | 0 | none |
| `CONDITIONAL` | 6 | T11A-CAND-001 through T11A-CAND-006 |
| `NO` | 1 | BNDL-006 |

All six corpus candidates are `CONDITIONAL`: T11B path-fidelity is HASH_MATCH
for all, but T12 ingestion requires EC-02 freshness review (on or after
2026-07-01) and operator-supplied `currentStatus` and `jurisdiction` metadata
before any candidate can advance to `t12Eligible=YES`.

## Unicode Path Carry-Forward

T11B finding confirmed: CAND-002, CAND-003, CAND-005 required Unicode fallback
through bundle manifest. Their T11B-resolved absolute paths (under
`Law use case_Codex\`) are the authoritative source; T11A `readableAt` literals
for these three must not be used as standalone path evidence.

| ID | Unicode fallback required | T11B-resolved path (authoritative) |
|---|---|---|
| `T11A-CAND-002` | YES | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex\BC- Ket qua ra soat du an cham trien khai - Phu Xuyen 10.5.2026.pdf` |
| `T11A-CAND-003` | YES | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex\Kien nghi thanh uy ha noi (1).docx` |
| `T11A-CAND-005` | YES | `D:\UNG DUNG AI\TOOL AI 2026\CVF-Workspace\Policy_Local\data_input\Law use case_Codex\QD cham dut.pdf` |

Note: filenames above use ASCII transliteration for agent-authored prose (per
CVF Text Encoding and Symbol Discipline Standard). Exact Unicode filenames are
preserved in the T11B result JSON.

## answerClass Integrity Check

All answerClass values assigned in this report:

- `ESCALATE_OR_ABSTAIN` (6 corpus candidates)
- N/A / non-corpus (BNDL-006, no corpus answerClass assigned)

All within the four canonical T2 matrix values (`DIRECT_CITED_ANSWER`,
`SUMMARY_WITH_SOURCE`, `PROCEDURAL_GUIDANCE`, `ESCALATE_OR_ABSTAIN`).
No new vocabulary introduced.

## Upgrade Path Notes (forward-looking, not a current-law claim)

These are classification structure observations only. No current-law status
is claimed. Upgrades require EC-02 review after 2026-07-01 plus
operator-supplied metadata.

- **CAND-005** (`administrative_decision`, documentType=decision): if operator
  confirms `currentStatus=effective` and supplies `jurisdiction`, this record
  is a candidate for `DIRECT_CITED_ANSWER` per decision matrix row
  `decision/effective/ACCEPT/yes`.
- **CAND-006** (`administrative_notice`, documentType=notice): if operator
  confirms jurisdiction, upgrade path is `SUMMARY_WITH_SOURCE`.
- **CAND-002, CAND-003, CAND-004** (`project_case_record` / `applied_policy_record`,
  documentType=other): `other` has no fixed default path; upgrade depends on
  operator reclassifying documentType to a canonical enum value after body review.
- **CAND-001** (applied_policy_record, documentType=other): same as above.

## Claim Boundary

This report claims: T2-matrix classification (metadata-only), EC-02 gate
assignment, and t12-eligibility verdict for the 6 T11B-verified corpus
candidates and BNDL-006 non-corpus request artifact, based on T11A manifest
metadata and T11B resolved-path evidence.

This report does NOT claim: document body parsing, OCR, summarization,
ingestion, chunking, search runtime, provider calls, source authenticity,
current-law status, legal advice quality, hosted readiness, production
readiness, public readiness, or release readiness.
