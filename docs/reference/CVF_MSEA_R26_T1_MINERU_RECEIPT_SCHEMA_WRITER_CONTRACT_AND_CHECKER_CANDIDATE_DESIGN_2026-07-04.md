# CVF MSEA R26 T1 MinerU Receipt Schema Writer Contract And Checker Candidate Design

Memory class: governed-reference-contract

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-04

## Purpose

Define a documentation-only receipt schema and writer contract for future
MinerU local extraction receipts, using accepted CVF predecessor policy and
upstream MinerU output-file documentation. This reference also records the
matching checker lane as candidate-only.

## Scope / Applies To

Applies to private local CVF foundation planning for MinerU receipt metadata.
It applies to receipt field vocabulary, private-output routing, writer boundary
rules, and future checker candidate criteria.

It does not apply to runtime execution, schema writer code, checker code,
adapter code, source import, memory ingestion, legal-domain product analysis,
public-sync, provider/live proof, production readiness, extraction accuracy, or
document-truth claims.

## Source Lineage

| Source | Role in this reference | Boundary |
|---|---|---|
| `docs/reference/CVF_MSEA_R25_MINERU_WORKFLOW_CHAIN_SYSTEMIZATION_DECISION_LEDGER_2026-07-04.md` | Route selection and no-implementation boundary. | CVF owner surface. |
| `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | Receipt envelope and private output class vocabulary. | CVF owner surface. |
| `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | Output filename-family facts only. | Source mirror reference input; not a CVF runtime dependency. |

## Source Verification Block

| Claimed item | Source fact type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|
| R25 selects schema/writer contract drafting and checker candidate only. | VALUE_SET | `docs/reference/CVF_MSEA_R25_MINERU_WORKFLOW_CHAIN_SYSTEMIZATION_DECISION_LEDGER_2026-07-04.md` | lines 46, 61, 94, 142 | `SELECT_SCHEMA_WRITER_CONTRACT_DRAFT`; `SELECT_CHECKER_CANDIDATE_ONLY` | MSEA-R25 decision ledger | ACCEPT |
| R25 keeps implementation-facing schema, writer, checker, adapter, memory, evaluation, and runtime lanes held or rejected. | LITERAL_INVARIANT | `docs/reference/CVF_MSEA_R25_MINERU_WORKFLOW_CHAIN_SYSTEMIZATION_DECISION_LEDGER_2026-07-04.md` | lines 98-102, 114, 209-215 | `implementation remains held`; `no runtime command`; `no checker implementation` | MSEA-R25 decision ledger | ACCEPT |
| T4 defines the private receipt envelope fields. | VALUE_SET | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | lines 39-56 | `receiptId`; `sourceInputSlot`; `inputSha256`; `inputSizeBytes`; `commandAttemptCount`; `executionBaseHead`; `exitCode`; `durationSeconds`; `outputFileCount`; `outputFileNames`; `outputContentRead`; `privateOutputDisposition`; `claimBoundary`; `downstreamRelease` | T4 receipt envelope | ACCEPT |
| T4 defines private output class vocabulary and committed evidence rules. | VALUE_SET | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | lines 58-66 | `PRIVATE_INPUT_ONLY`; `PRIVATE_RUNTIME_COPY`; `PRIVATE_GENERATED_OUTPUT`; `RECEIPT_METADATA_ALLOWED`; `EXCERPT_MINIMAL_SEPARATE_AUTHORITY` | T4 private output class matrix | ACCEPT |
| MinerU documents output filename families that can be cited as metadata-only names. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | lines 17-19, 35-40, 62-64, 109-111, 292-298, 396-402, 675, 729-742 | `layout.pdf`; `span.pdf`; `model.json`; `middle.json`; `content_list.json`; `content_list_v2.json`; `*.md` | MinerU output documentation | ACCEPT |

## New Doc-Only Fields

| Field | Purpose | Source fact type | Contract disposition |
|---|---|---|---|
| `writerContractStatus` | Names whether this reference contract is ready for future use. | DOC_ONLY_NEW | Allowed only as documentation status. |
| `checkerCandidateStatus` | Names whether checker work is a candidate lane. | DOC_ONLY_NEW | Allowed only as candidate classification. |

## Receipt Schema Draft

Contract result token: CONTRACT_DRAFT_READY

| Field | Required value class | Privacy disposition | Source basis | Writer rule |
|---|---|---|---|---|
| `receiptId` | governed local identifier | METADATA_ALLOWED | T4 receipt envelope | Must not encode sensitive source content. |
| `sourceInputSlot` | local private slot label | METADATA_ALLOWED | T4 receipt envelope | Must not reveal full document name or personal/legal detail. |
| `inputSha256` | digest string | METADATA_ALLOWED | T4 receipt envelope | Allowed only when digest was obtained under local-private authority. |
| `inputSizeBytes` | integer byte count | METADATA_ALLOWED | T4 receipt envelope | Allowed as metadata, not content. |
| `executionBaseHead` | git SHA metadata | METADATA_ALLOWED | T4 receipt envelope | Future execution receipt only. |
| `commandAttemptCount` | integer count | METADATA_ALLOWED | T4 receipt envelope | Future execution receipt only. |
| `exitCode` | process exit code | METADATA_ALLOWED | T4 receipt envelope | Future execution receipt only. |
| `durationSeconds` | elapsed seconds | METADATA_ALLOWED | T4 receipt envelope | Future execution receipt only. |
| `outputFileCount` | integer count | METADATA_ALLOWED | T4 receipt envelope | Count only; no generated content. |
| `outputFileNames` | filename-family list | METADATA_ALLOWED_WITH_NO_CONTENT | T4 receipt envelope plus MinerU output docs | Use safe family names only. |
| `outputContentRead` | boolean | MUST_BE_FALSE_FOR_PRIVATE_COMMIT | T4 receipt envelope | Must be false unless separate authority exists. |
| `privateOutputDisposition` | private output class token | REQUIRED | T4 private output class matrix | Must use one accepted private class. |
| `downstreamRelease` | route or hold token | REQUIRED | T4 receipt envelope and R25 decision ledger | Must preserve held implementation lanes. |
| `claimBoundary` | explicit boundary statement | REQUIRED | T4 receipt envelope and R25 claim boundary | Must reject production, legal-quality, document-truth, and extraction-accuracy claims. |
| `writerContractStatus` | status token | DOC_ONLY_METADATA | this reference | Must remain documentation-only. |
| `checkerCandidateStatus` | status token | DOC_ONLY_METADATA | this reference | Must remain candidate-only. |

## Output Filename Family Mapping

| MinerU documented family | Receipt field | Private output disposition | Commit rule |
|---|---|---|---|
| `layout.pdf` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `span.pdf` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `model.json` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `middle.json` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `content_list.json` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `content_list_v2.json` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |
| `*.md` | `outputFileNames` | `PRIVATE_GENERATED_OUTPUT` or `RECEIPT_METADATA_ALLOWED` for name only | File name only. |

## Writer Contract Draft

| Contract rule | Disposition |
|---|---|
| Writer implementation status | NOT_AUTHORIZED_BY_R26 |
| Writer output authority | Future writer may emit metadata receipt only after fresh GC-018 and implementation work order. |
| Private original document handling | Original documents remain outside committed governed artifacts. |
| Private generated output handling | Generated content remains private unless later authority permits excerpt-minimal evidence. |
| Output-content read flag | `outputContentRead` must be false for committed private receipts unless separate authority exists. |
| Downstream release | Receipt metadata alone must not release adapter, memory-layer, RAG, checker, production, or legal-product lanes. |

## Checker Candidate Design

checkerCandidateStatus: CHECKER_CANDIDATE

| Candidate check | Future fail condition | Current R26 disposition |
|---|---|---|
| Required receipt field presence | A receipt omits one of the required contract fields. | Candidate only. |
| Private output class vocabulary | `privateOutputDisposition` uses a value outside the T4 class matrix. | Candidate only. |
| Output-content boundary | `outputContentRead` is true without separate authority. | Candidate only. |
| Filename-only output evidence | A receipt commits generated output content instead of metadata. | Candidate only. |
| Downstream release boundary | A receipt claims adapter, memory, production, legal-quality, document-truth, or extraction-accuracy readiness. | Candidate only. |
| Source slot privacy | `sourceInputSlot` exposes sensitive original document details. | Candidate only. |

## Privacy / Redaction Boundary

| Data class | R26 disposition |
|---|---|
| Original private documents | Local private testing only; do not public-sync or redistribute. |
| Generated MinerU outputs | Private runtime outputs; do not commit generated content. |
| Metadata | Allowed when limited to digest, size, counts, safe filename families, command metadata, and boundary fields. |
| Excerpts | Not authorized by R26; requires separate operator approval and source-verified work order. |
| Legal or personal details | Do not include in committed artifacts. |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| T4 receipt envelope | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | CONFIRMED_EXISTING | R26 reorganizes accepted fields into a reference contract. | ENRICH_EXISTING |
| T4 private output class matrix | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | CONFIRMED_EXISTING | R26 binds each class to receipt writer rules. | ENRICH_EXISTING |
| MinerU output filename families | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | ENRICH_EXISTING | R26 maps upstream names to metadata-only receipt slots. | ADD_REFERENCE_MAPPING |
| Future checker lane | `docs/reference/CVF_MSEA_R25_MINERU_WORKFLOW_CHAIN_SYSTEMIZATION_DECISION_LEDGER_2026-07-04.md` | CONFIRMED_EXISTING | R26 records candidate criteria without implementation. | KEEP_CHECKER_CANDIDATE_ONLY |
| Runtime writer or checker code | `docs/reference/CVF_MSEA_R25_MINERU_WORKFLOW_CHAIN_SYSTEMIZATION_DECISION_LEDGER_2026-07-04.md` | REJECT_DIRECT_IMPORT | R26 has no implementation authority. | HOLD_FOR_FRESH_GC018 |

## Contract Result

| Field | Value |
|---|---|
| contractResult | CONTRACT_DRAFT_READY |
| writerContractStatus | DOCUMENTATION_ONLY_READY |
| checkerCandidateStatus | CHECKER_CANDIDATE |
| downstreamRelease | HOLD_IMPLEMENTATION_PENDING_FRESH_GC018 |
| useCaseBoundary | CVF foundation only; no legal-domain deep dive. |

## Verification

| Check | Evidence | Disposition |
|---|---|---|
| Source routes verified | R25, T4, and MinerU output documentation lines cited above. | PASS |
| Privacy boundary preserved | Only metadata fields and filename families are listed. | PASS |
| Implementation boundary preserved | Writer and checker remain not authorized by R26. | PASS |
| Use-case depth avoided | No legal-quality, current-law, document-truth, or extraction-accuracy criteria are added. | PASS |

## Epistemic Process Block

| Field | Value |
|---|---|
| Expected Result | R26 should produce a metadata-only contract draft and checker-candidate design without runtime or use-case deepening. |
| Evidence Comparison | R25 route evidence, T4 receipt policy, and MinerU output filename documentation align with the drafted contract fields. |
| Contradiction Or Gap Disposition | No contradiction found; implementation authority is still absent and held. |
| Claim Update | Contract draft is ready as reference guidance; implementation remains future work. |

## Claim Boundary

This reference is a CVF foundation contract draft only. It does not implement or
prove a MinerU runtime, receipt writer, checker, adapter, memory-layer flow,
RAG ingestion, source import, package behavior, provider/live behavior,
public-sync, workflow-chain production readiness, extraction accuracy,
document truth, current-law adequacy, or legal-quality analysis.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: R26 uses private provenance planning and source-mirror evidence. No
public-sync export is authorized.
