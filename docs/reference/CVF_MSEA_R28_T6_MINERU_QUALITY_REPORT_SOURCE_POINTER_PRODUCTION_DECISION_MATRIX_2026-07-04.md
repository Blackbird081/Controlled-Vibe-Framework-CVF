# CVF MSEA R28 T6 MinerU Quality Report Source Pointer Production Decision Matrix - 2026-07-04

Memory class: FULL_RECORD
Status: COMPLETE_PENDING_REVIEW
docType: reference
Review scope: MSEA-R28-T6 quality report source pointer production decision
dispatchWorkOrder: docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R28_T6_MINERU_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_2026-07-04.md
executionBaseHead: b2bee319
rawMemoryReleased: false

## Purpose

Select the next bounded production path for MinerU quality-report and source-pointer evidence after R28-T5 added receipt-side `qualityReportRef` and `sourcePointer` fields. This matrix distinguishes receipt field existence from actual quality-report production, source-pointer resolution, downstream-use authorization, and memory-route release.

## Scope / Applies To

This decision matrix applies only to R28-T6. It does not implement checker code, hook wiring, receipt writer changes, runtime extraction, private-output reads, memory writes, RAG writes, provider/live proof, public-sync, app delivery, legal/use-case review, or extraction-quality correctness claims.

## Source Inventory

| Source | Role | Disposition |
| --- | --- | --- |
| R28-T6 work order | Dispatch authority and output contract | ACCEPT |
| R28-T6 baseline | GC-018 authorization and claim boundary | ACCEPT |
| R28-T5 worker return | Receipt-side quality/source-pointer schema result and remaining hold | ACCEPT |
| R28-T5 writer and checker source | Current receipt field and validation surface | ACCEPT |
| R28-T3 design matrix | Pre-implementation design gap and memory-route hold | ACCEPT |
| R27 decision ledger | Memory-safe candidate prerequisites and memory-write hold | ACCEPT |
| R24-T4 private-output policy | Metadata-only private-output boundary | ACCEPT |
| Extraction Foundation pipeline source | Quality-report owner surface | ACCEPT |

## Checker Source Read-Ahead Block

| Checker | Read-ahead result |
| --- | --- |
| `governance/compat/check_markdown_structural_completeness.py` | Headings and structural blocks are explicit. |
| `governance/compat/check_worker_return_quality_gate.py` | Worker return companion evidence and claim boundaries are kept concrete. |
| `governance/compat/check_worker_experience_retrospective.py` | Retrospective section is included in the worker return. |
| `governance/compat/check_finding_to_governance_learning.py` | Learning disposition is included with no new ADIF entry opened. |
| `governance/compat/check_governed_artifact_checker_read_ahead.py` | This block records checker read-ahead before writing. |
| `governance/compat/check_agent_operation_trace.py` | Operation trace block is included below. |
| `governance/compat/check_delta_execution_claim_boundary.py` | Delta claim boundary block is included below. |
| `governance/compat/check_public_export_disposition.py` | Public export disposition is explicit. |
| `governance/compat/check_external_knowledge_intake_routing.py` | External knowledge routing is explicit and bounded. |
| `governance/compat/check_corpus_completeness_report_integrity.py` | Corpus completeness statement is explicit. |
| `governance/compat/check_rescan_intelligence_hardening.py` | Rescan applicability is explicit. |
| `governance/compat/check_epistemic_process_packet.py` | Prediction, evidence comparison, gap disposition, and claim update are included. |
| `governance/compat/check_machine_closure_package.py` | Closure package is marked N/A with reason because this is a worker reference artifact. |
| `governance/compat/check_agent_packet_authority_and_encoding.py` | Source authority is CVF-governed and ASCII-only. |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| Receipt writer declares current receipt version. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | line 16 | `RECEIPT_VERSION` | MinerU metadata receipt writer | ACCEPT |
| Receipt writer keeps downstream release held. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | lines 18, 79 | `DOWNSTREAM_RELEASE_HELD`; `downstream_release` | MinerU metadata receipt writer | ACCEPT |
| Receipt writer exposes the quality/source-pointer missing token. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | lines 49, 122, 128 | `QUALITY_OR_SOURCE_POINTER_MISSING` | MinerU metadata receipt writer validation | ACCEPT |
| Receipt writer owns the receipt dataclass. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | lines 67, 133, 185, 206 | `MineruMetadataReceipt`; `build_mineru_metadata_receipt`; `mineru_metadata_receipt_payload`; `render_mineru_metadata_receipt_json` | MinerU metadata receipt writer | ACCEPT |
| Receipt payload emits a quality report reference. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | line 198 | `qualityReportRef` | `mineru_metadata_receipt_payload` | ACCEPT |
| Receipt payload emits a source pointer. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | line 202 | `sourcePointer` | `mineru_metadata_receipt_payload` | ACCEPT |
| Receipt checker documents metadata-only quality/source-pointer validation. | `governance/compat/check_mineru_receipt_boundary.py` | line 7 | `qualityReportRef`; `sourcePointer` | MinerU receipt boundary checker | ACCEPT |
| Receipt checker requires quality report and source pointer fields. | `governance/compat/check_mineru_receipt_boundary.py` | lines 37, 47-48, 212, 215 | `REQUIRED_FIELDS`; `_validate_receipt` | MinerU receipt boundary checker | ACCEPT |
| Receipt checker keeps downstream release held. | `governance/compat/check_mineru_receipt_boundary.py` | line 62 | `HELD_PENDING_RECEIPT_CHECKER_AND_MEMORY_ROUTE` | MinerU receipt boundary checker | ACCEPT |
| Receipt checker validates quality/source-pointer values as metadata fields. | `governance/compat/check_mineru_receipt_boundary.py` | lines 307-320 | `qualityReportRef`; `sourcePointer`; `QUALITY_OR_SOURCE_POINTER_MISSING` | MinerU receipt boundary checker | ACCEPT |
| Extraction Foundation owns a quality report dataclass. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | lines 101-113 | `ExtractionQualityReport`; `quality_flags`; `raw_ocr_retained` | Extraction Foundation pipeline | ACCEPT |
| Extraction Foundation owns a storage boundary that carries quality report state. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | lines 152-158, 424-438 | `ExtractionStorageBoundary`; `build_extraction_storage_boundary`; `quality_report` | Extraction Foundation pipeline | ACCEPT |
| Extraction Foundation owns quality evaluation logic. | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | lines 235, 259 | `evaluate_extraction_quality`; `quality_flags` | Extraction Foundation pipeline | ACCEPT |
| R28-T5 confirms receipt fields are metadata-shaped references, not actual quality production. | `docs/reviews/CVF_MSEA_R28_T5_MINERU_QUALITY_SOURCE_POINTER_RECEIPT_SCHEMA_EXTENSION_AND_CHECKER_UPDATE_DECISION_WORKER_RETURN_2026-07-04.md` | lines 103-118, 146-148 | `qualityReportRef`; `sourcePointer`; quality/source-pointer future implementation | MSEA-R28-T5 worker return | ACCEPT |
| R28-T5 keeps memory route held after the schema extension. | `docs/reviews/CVF_MSEA_R28_T5_MINERU_QUALITY_SOURCE_POINTER_RECEIPT_SCHEMA_EXTENSION_AND_CHECKER_UPDATE_DECISION_WORKER_RETURN_2026-07-04.md` | line 138 | `MEMORY_ROUTE_STILL_HELD_AFTER_QUALITY_SOURCE_POINTER_SCHEMA_EXTENSION` | MSEA-R28-T5 worker return | ACCEPT |
| R28-T3 identified quality/source-pointer as a future field and memory-write adapter as not implemented. | `docs/reference/CVF_MSEA_R28_T3_MINERU_RECEIPT_BOUNDARY_CHECKER_CANDIDATE_DESIGN_MATRIX_2026-07-04.md` | lines 68, 76-77 | `QUALITY_OR_SOURCE_POINTER_MISSING`; quality/source-pointer field; memory-write adapter | MSEA-R28-T3 design matrix | ACCEPT |
| R27 requires quality and source pointer before a memory-safe candidate. | `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | lines 74, 85-87 | `QUALITY_DISPOSITION_READY`; `MEMORY_SAFE_CANDIDATE_READY`; `MEMORY_WRITE_AUTHORIZED`; `NOT_AUTHORIZED_BY_R27` | MSEA-R27 decision ledger | ACCEPT |
| R27 leaves implementation and production gaps deferred. | `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | line 263 | implementation and production gaps | MSEA-R27 decision ledger | ACCEPT |
| R24-T4 allows metadata-only receipt fields and keeps generated output content private. | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | lines 44, 51-54, 62-65, 205 | `sourceInputSlot`; `outputFileCount`; `outputFileNames`; `outputContentRead`; `privateOutputDisposition`; private output classes | MSEA-R24-T4 policy | ACCEPT |

## New Doc-Only Fields

| Field | Value | Purpose | Runtime status |
| --- | --- | --- | --- |
| `selectedDecisionDisposition` | `QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_MATRIX_READY` | Names the R28-T6 decision outcome. | DOC_ONLY_NEW |
| `selectedRoute` | `QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_ONLY` | Keeps this tranche in decision scope. | DOC_ONLY_NEW |
| `memoryRouteDisposition` | `MEMORY_ROUTE_STILL_HELD_PENDING_ACTUAL_PRODUCTION_AND_MEMORY_OWNER_DECISION` | Prevents receipt-side fields from being treated as memory-release authority. | DOC_ONLY_NEW |

## Decision Matrix

| Decision surface | Current evidence | Decision | Required later owner | R28-T6 disposition |
| --- | --- | --- | --- | --- |
| Receipt-side quality/source-pointer fields | R28-T5 writer and checker source emit and validate `qualityReportRef` and `sourcePointer`. | Treat as receipt-reference shape, not actual quality production. | None for receipt schema in this tranche. | SATISFIED_FOR_RECEIPT_REFERENCE_SHAPE |
| Actual quality-report production | Extraction Foundation owns `ExtractionQualityReport`, `evaluate_extraction_quality`, and storage-boundary quality state. | Use the existing Extraction Foundation quality owner surface in a later implementation packet. | Future source-verified implementation work order. | HELD_PENDING_ACTUAL_PRODUCTION_IMPLEMENTATION |
| Source-pointer resolution | Receipt field exists; R24-T4 restricts private outputs to metadata-only evidence. | Source pointer must be a bounded metadata reference, not raw document text, generated output content, or a private full path. | Future source-verified implementation work order. | HELD_PENDING_SOURCE_POINTER_PRODUCTION_CONTRACT |
| Downstream-use status | Receipt writer and checker keep downstream release held; R27 requires allowed downstream use and claim boundary before memory-safe candidate. | Keep downstream release held until actual quality/source-pointer evidence and owner authorization exist. | Future receipt or memory-candidate work order. | HELD |
| Memory/RAG route | R27 marks `MEMORY_WRITE_AUTHORIZED` as `NOT_AUTHORIZED_BY_R27`. | Do not release memory or RAG route in R28-T6. | Future memory-owner GC-018 and work order. | HELD |

## Selected Disposition

| Field | Value |
| --- | --- |
| `selectedDecisionDisposition` | `QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_MATRIX_READY` |
| `selectedRoute` | `QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_ONLY` |
| `memoryRouteDisposition` | `MEMORY_ROUTE_STILL_HELD_PENDING_ACTUAL_PRODUCTION_AND_MEMORY_OWNER_DECISION` |
| Next recommended move | Author a fresh R28-T7 GC-018/source-verified work order for actual quality-report/source-pointer production implementation, still excluding memory/RAG release unless a separate memory-owner decision exists. |

## Risk / Corrective Action

| Risk | Corrective action |
| --- | --- |
| Receipt fields could be mistaken for actual quality generation. | This matrix separates receipt-reference shape from actual quality-report production and assigns production to a later source-verified implementation packet. |
| A source pointer could expose private paths or generated content. | Future implementation must keep the pointer metadata-only under R24-T4 and must not read or publish private/generated output content without separate authority. |
| Memory route could be reopened early. | `MEMORY_ROUTE_STILL_HELD_PENDING_ACTUAL_PRODUCTION_AND_MEMORY_OWNER_DECISION` is the selected hold token for this tranche. |

## Agent Operation Trace Block

| Field | Value |
| --- | --- |
| Actor | worker |
| Provider or surface | Codex local workspace |
| Session or invocation | MSEA-R28-T6 MinerU Quality Report Source Pointer Production Decision, 2026-07-04 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell (`git`, `rg`, `python governance/compat/*`), apply_patch |
| Target paths | docs/reference/CVF_MSEA_R28_T6_MINERU_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_MATRIX_2026-07-04.md; docs/reviews/CVF_MSEA_R28_T6_MINERU_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_WORKER_RETURN_2026-07-04.md |
| Allowed scope source | `CVF_SESSION/ACTIVE_SESSION_STATE.json` `nextAllowedMove` and the named work order's Scope / Target / Owner Boundary |
| Before status evidence | HEAD `b2bee319`; `git status --short --untracked-files=all` returned no output before worker edits began; both target paths returned `False` by `Test-Path` |
| After status evidence | two new untracked R28-T6 artifacts only; HEAD unchanged at `b2bee319` |
| Diff evidence | `git diff --name-status` and `git status --short --untracked-files=all` show only the two authorized added artifacts |
| Approval boundary | worker execution under `WORKER_MUST_NOT_COMMIT` only |
| Claim boundary | docs-only decision matrix and worker return only; no implementation, runtime, private-output read, memory/RAG write, public-sync, or provider/live proof |
| Agent type | worker |
| Invocation ID | `msea-r28-t6-worker-return-2026-07-04` |
| Expected manifest | companion matrix and worker return |
| Actual changed set | companion matrix and worker return |
| Manifest delta | MATCH |
| Deletion or rename disposition | NONE |
| Execution base head | b2bee319 |
| Commit authority | WORKER_MUST_NOT_COMMIT |
| Runtime/private-output status | Not run; not read |

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | R28-T6 docs-only quality-report/source-pointer production decision matrix |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, or mandatory-wrapper behavior is claimed. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: prior receipt writer/checker evidence is cited as predecessor source only; no new runtime receipt is created by this matrix. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no MinerU, provider, external service, memory, RAG, or runtime action is executed or observed by this matrix. |
| invocationBoundary | local file reads, source searches, artifact drafting, and governance gate commands only |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized or claimed. |
| claimLanguage | docs-only decision matrix only |
| forbiddenExpansion | Do not expand into implementation, runtime/provider/live/public/package/Web/MCP/model-router behavior, private-output inspection, or memory write without fresh source-verified authorization. |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

This reference artifact is private provenance material. No public-sync export, public repository commit, or public catalog claim is included in R28-T6.

## External Knowledge Intake Routing

| Field | Value |
| --- | --- |
| Input type | Corpus scan or extraction intake |
| Intake route | GOVERNED_CVF_LOCAL_ONLY |
| External content read | NO |
| Private/generated content read | NO |
| Memory/RAG write | NO |
| Routing disposition | DECISION_ONLY_NO_INTAKE |

## Foundation Storage Layout

N/A with reason: this worker reference artifact does not create runtime storage, generated aggregate sources, workspace state, receipt instances, private output directories, or memory records.

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
- N/A with reason: R28-T6 does not add a scanner, corpus import, or rescan rule. It only records a source-backed decision matrix.

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON
- N/A with reason: no corpus was scanned, imported, sampled, or completeness-claimed in this tranche.

## Finding-To-Governance Learning Disposition

| Field | Value |
| --- | --- |
| Finding class | RULE_GAP |
| New ADIF entry | N/A_WITH_REASON |
| Reason | No new repeated checker or workflow defect was observed while drafting the matrix. The known GC-051 path-literal discipline is handled by placing exact source paths in this companion reference instead of the worker review packet. |

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Epistemic Process Applicability | BOUNDED_DECISION_PACKET |
| Expected Result / Prediction | Source evidence will show that R28-T5 satisfied receipt-reference shape only, while actual quality-report/source-pointer production remains a future implementation decision. |
| Evidence Comparison | The writer/checker rows confirm receipt field existence; Extraction Foundation rows confirm a quality-report owner surface; R27 and R24-T4 rows keep downstream and private-output boundaries held. |
| Contradiction Or Gap Disposition | No contradiction found. The remaining gap is actual production of quality-report/source-pointer evidence under a future source-verified packet. |
| Claim Update | R28-T6 may mark the production decision matrix ready, but must not claim actual production, extraction correctness, memory-safe candidate readiness, or memory/RAG authorization. |

## Machine Closure Package

N/A with reason: this is a worker-produced companion reference, not a reviewer closure packet. Closure conversion belongs to the reviewer if the worker return is accepted.

## Claim Boundary

This matrix claims only that a source-backed production-decision route is selected for R28-T6. It does not claim runtime execution, generated output inspection, source/test implementation, receipt instance production, quality-report correctness, source-pointer correctness, memory/RAG release, provider/live proof, public-sync, legal/use-case validity, or production workflow readiness.
