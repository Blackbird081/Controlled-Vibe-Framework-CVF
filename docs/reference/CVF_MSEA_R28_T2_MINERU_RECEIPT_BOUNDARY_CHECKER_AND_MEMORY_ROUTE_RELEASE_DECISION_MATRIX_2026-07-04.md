# CVF MSEA R28 T2 MinerU Receipt Boundary Checker And Memory Route Release Decision Matrix

Memory class: governed-reference

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-04

Batch ID: MSEA-R28-T2-ROUTE-SELECTION

rawMemoryReleased: false

## Purpose

Record the source-backed route decision matrix for the post-writer R28-T2
selection. The matrix classifies each candidate lane with route token, evidence,
novelty, prerequisites, and forbidden expansion so the next dispatch can use it
as a decision aid without re-deriving the evidence from scratch.

## Scope / Applies To

| Field | Value |
| --- | --- |
| Applies to | MSEA-R28-T2 route-selection companion to the worker return |
| Worker return | `docs/reviews/CVF_MSEA_R28_T2_MINERU_RECEIPT_BOUNDARY_CHECKER_AND_MEMORY_ROUTE_RELEASE_SELECTION_WORKER_RETURN_2026-07-04.md` |
| Source basis | R28-T1 writer source/tests, R28 selection review, R27 decision ledger, R26 receipt contract, R24-T4 receipt policy, and Extraction Foundation pipeline source |
| Scope limit | docs-only decision matrix only; no runtime, output-content read, implementation, memory write, RAG write, public-sync, provider/live proof, product-app, or production claim |

## Target / Source

| Source | Evidence used | Disposition |
| --- | --- | --- |
| R28-T1 writer source | `MineruMetadataReceipt`, `build_mineru_metadata_receipt`, `DOWNSTREAM_RELEASE_HELD`, `OUTPUT_CONTENT_READ_FORBIDDEN` | ACCEPT |
| R28 selection review | `RECEIPT_BOUNDARY_CHECKER` as `NEXT_AFTER_WRITER`; `MEMORY_SAFE_CANDIDATE_CONTRACT` as `NEXT_AFTER_RECEIPT_AND_CHECKER` | ACCEPT |
| R27 decision ledger | Scan-to-memory route matrix; `MEMORY_WRITE_AUTHORIZED` as `NOT_AUTHORIZED_BY_R27` | ACCEPT |
| R26 receipt contract | Six checker candidate checks; `checkerCandidateStatus: CHECKER_CANDIDATE`; `NOT_AUTHORIZED_BY_R26` | ACCEPT |
| R24-T4 receipt policy | Receipt envelope and private output class vocabulary | ACCEPT |
| Extraction Foundation pipeline | `ExtractionQualityReport`, `ExtractionChunk`, `ExtractionStorageBoundary` | ACCEPT |
| Runtime/private content | not executed, read, quoted, copied, imported, staged, or committed | REJECT_DIRECT_IMPORT |

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| R28-T1 writer source exposes held downstream-release constant and rejects output-content-read true. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | constants and builder validation | `DOWNSTREAM_RELEASE_HELD`; `OUTPUT_CONTENT_READ_FORBIDDEN`; `build_mineru_metadata_receipt` | Extraction Foundation metadata receipt writer | ACCEPT |
| R28 selection names receipt boundary checker second and memory-safe candidate after receipt and checker. | VALUE_SET | `docs/reviews/CVF_MSEA_R28_FOUNDATION_IMPLEMENTATION_SEQUENCE_AUDIT_AND_SELECTION_2026-07-04.md` | R28 Selection Matrix | `RECEIPT_BOUNDARY_CHECKER`; `NEXT_AFTER_WRITER`; `NEXT_AFTER_RECEIPT_AND_CHECKER` | MSEA-R28 selection review | ACCEPT |
| R27 scan-to-memory route matrix requires receipt, quality, source pointer, allowed downstream use, and claim boundary before MEMORY_SAFE_CANDIDATE_READY. | VALUE_SET | `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | Scan-To-Memory Intake Route Matrix | `MEMORY_SAFE_CANDIDATE_READY`; `MEMORY_WRITE_AUTHORIZED`; `NOT_AUTHORIZED_BY_R27` | MSEA-R27 decision ledger | ACCEPT |
| R26 records six checker candidate checks and CHECKER_CANDIDATE status without authorizing checker implementation. | VALUE_SET | `docs/reference/CVF_MSEA_R26_T1_MINERU_RECEIPT_SCHEMA_WRITER_CONTRACT_AND_CHECKER_CANDIDATE_DESIGN_2026-07-04.md` | Checker Candidate Design | `checkerCandidateStatus`; `CHECKER_CANDIDATE`; `NOT_AUTHORIZED_BY_R26` | MSEA-R26 receipt contract | ACCEPT |
| R24-T4 defines the receipt envelope and private output classes that any checker candidate must protect. | VALUE_SET | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | Receipt Envelope and Private Output Class Matrix | `outputContentRead`; `downstreamRelease`; `PRIVATE_INPUT_ONLY`; `PRIVATE_RUNTIME_COPY`; `PRIVATE_GENERATED_OUTPUT` | MSEA-R24-T4 private-output policy | ACCEPT |
| Extraction Foundation pipeline owns quality and chunk primitives, so memory-route release must account for quality and source pointers before any memory write. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | dataclasses and builders | `ExtractionQualityReport`; `ExtractionChunk`; `ExtractionStorageBoundary` | Extraction Foundation pipeline | ACCEPT |

## Route Decision Matrix

| Lane | Route token | Evidence | Novelty | Prerequisites | Forbidden expansion | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Receipt-boundary checker candidate design | `SELECT_RECEIPT_BOUNDARY_CHECKER_CANDIDATE_DESIGN_ONLY` | R28-T1 writer provides concrete receipt shape; R26 records six candidate checks with CHECKER_CANDIDATE status; R28 selection names checker as NEXT_AFTER_WRITER | Turns R26 criteria and R28-T1 receipt shape into a source-verified design readiness packet | Fresh GC-018 and source-verified work order; no checker code or hook wiring | No checker implementation, hook wiring, protected governance mutation, runtime execution, or memory write | SELECTED |
| Memory-route release | `HOLD_MEMORY_ROUTE_RELEASE_PENDING_RECEIPT_CHECKER_AND_QUALITY` | R27 route matrix requires MEMORY_SAFE_CANDIDATE_READY before memory write; no receipt checker exists yet; no quality/source-pointer proof through governed route | Names concrete prerequisites for future memory-route release | Receipt checker implementation; quality disposition; source pointer; allowed downstream use; claim boundary | No memory write, RAG write, memory-safe candidate contract implementation, or memory adapter implementation | HELD |
| Memory-safe candidate contract | `NEXT_AFTER_RECEIPT_AND_CHECKER` | R28 selection names memory-safe candidate as third in sequence; R27 requires receipt, quality, source pointer, and claim boundary | Future bridge between receipt/quality/chunk data and memory without writing yet | Receipt checker implementation; quality disposition; source pointer; allowed downstream use; claim boundary | No memory write, RAG write, or memory adapter implementation | HELD |
| Memory write adapter | `HELD` | R27 holds MEMORY_WRITE_AUTHORIZED as NOT_AUTHORIZED_BY_R27; R28 selection names memory write as HELD | Useful only after candidate contract and owner surface are source-verified | Memory-safe candidate contract; fresh GC-018 and memory owner work order | No memory write, RAG write, or memory adapter implementation | HELD |
| MinerU runtime workflow | `HELD` | R27 holds runtime workflow; R28 selection names runtime as HELD; operator scoped current work to CVF foundation | Useful only after receipt/checker/privacy gates exist | Receipt checker; memory-safe candidate; fresh GC-018 and runtime work order | No MinerU runtime, model/cache mutation, ModelScope, VLM, OCR, parser, router, Gradio, Docker, WSL, or runtime smoke | HELD |
| Standalone PDF app or legal use case | `REJECTED_FOR_NOW` | R27 holds standalone app and legal deep dive; R28 selection rejects for now; operator scoped current work to CVF foundation planes | Belongs to a separate project on CVF foundation | Separate project authority; fresh GC-018 and source-verified work order | No standalone app, legal/use-case deep dive, extraction-accuracy claim, document-truth claim, legal-quality claim, or current-law correctness claim | REJECTED_FOR_NOW |

## Checker Candidate Design Readiness Summary

| R26 candidate check | R28-T1 source evidence | Design readiness |
| --- | --- | --- |
| Required receipt field presence | `MineruMetadataReceipt` dataclass with `receipt_id`, `source_input_slot`, `input_sha256`, `output_file_names`, `private_output_class`, `private_output_disposition`, `output_content_read`, `downstream_release`, `receipt_version`, `claim_boundary` | READY_FOR_DESIGN |
| Private output class vocabulary | `MineruPrivateOutputClass` Literal with `PRIVATE_INPUT_ONLY`, `PRIVATE_RUNTIME_COPY`, `PRIVATE_GENERATED_OUTPUT` | READY_FOR_DESIGN |
| Output-content boundary | `OUTPUT_CONTENT_READ_FORBIDDEN` failure token; `output_content_read` must be false | READY_FOR_DESIGN |
| Filename-only output evidence | `ALLOWED_OUTPUT_FILE_NAMES` frozenset with `layout.pdf`, `span.pdf`, `model.json`, `middle.json`, `content_list.json`, `content_list_v2.json`; `_SAFE_MARKDOWN_RE` for `.md` | READY_FOR_DESIGN |
| Downstream release boundary | `DOWNSTREAM_RELEASE_HELD` constant set to `HELD_PENDING_RECEIPT_CHECKER_AND_MEMORY_ROUTE` | READY_FOR_DESIGN |
| Source slot privacy | `_SAFE_ID_RE` and `_UNSAFE_TEXT_MARKERS` validation in `_validate_safe_id` | READY_FOR_DESIGN |

## Memory-Route Release Prerequisite Summary

| Prerequisite | Current status | Release condition |
| --- | --- | --- |
| Receipt checker implementation | NOT_IMPLEMENTED | Fresh GC-018 and source-verified work order for checker candidate design, then checker implementation |
| Quality disposition | EXTRACTION_FOUNDATION_OWNER_EXISTS | `ExtractionQualityReport` exists but no governed quality disposition has been produced for a MinerU extraction run |
| Source pointer | NOT_PROVEN | No source pointer proof through a governed route for a MinerU extraction output |
| Allowed downstream use | NOT_AUTHORIZED | R27 holds `MEMORY_WRITE_AUTHORIZED` as `NOT_AUTHORIZED_BY_R27` |
| Claim boundary | CONTRACT_ONLY | R27 scan-to-memory route matrix is contract-only; no runtime claim boundary has been proven |

## External Knowledge Intake Routing

| Field | Value |
| --- | --- |
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | accepted MinerU owner surfaces plus Extraction Foundation owners -> R27 route matrix -> R28 writer closure -> R28-T2 route-selection decision matrix |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | this decision matrix |
| Disposition | ADAPT: convert accepted receipt and route evidence into a bounded CVF-foundation decision matrix |
| Claim boundary | no runtime command, private source/output content read, schema/writer/checker/adapter implementation, memory ingestion, RAG write, public-sync, provider/live proof, or product-app claim |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
| --- | --- | --- | --- | --- |
| R28-T1 metadata writer | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | CONFIRMED_EXISTING | concrete receipt shape is now available | use as predecessor evidence |
| Receipt checker candidate | R26 contract and R28 selection | ENRICH_EXISTING | route-selection sharpens design readiness | classify, do not implement |
| Memory-safe candidate route | R27 decision ledger and Extraction Foundation quality owners | ENRICH_EXISTING | route-selection states release prerequisites | classify and hold unless released |
| Runtime, app, use-case, memory-write lanes | R27/R28 held surfaces and operator instruction | REJECT_DIRECT_IMPORT | useful later but outside current CVF-foundation step | keep held |

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
- N/A with reason: this decision matrix is a route-selection companion, not a rescan, reabsorption, or contradiction-removal packet.

## Corpus Completeness And Report Integrity

- Corpus verdict: NOT_APPLICABLE_WITH_REASON - this decision matrix is not a corpus enumeration, residual absorption ledger, or corpus completeness report.
- ledger_terminal=NOT_APPLICABLE_WITH_REASON

## Finding-To-Governance Learning Disposition

| Field | Value |
| --- | --- |
| Disposition | N/A_WITH_REASON |
| Reason | No new repeated checker trap, governance gap, or agent-defect pattern was discovered during this route selection. |
| Defect class token reviewed | RULE_GAP |
| Learning lane token reviewed | DOCUMENTATION_ONLY_LEARNING |
| Next action | No ADIF or gotcha update is required by this decision matrix. |

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: docs-only route-selection decision matrix; no evidence-heavy contradiction analysis is required beyond source-backed verification.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | delegated worker |
| Provider or surface | local workspace plus governance gate reads |
| Session or invocation | MSEA-R28-T2 MinerU Receipt Boundary Checker And Memory Route Release Selection, 2026-07-04 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | startup reads; source/checker reads; governance gates; git status |
| Target paths | this decision matrix |
| Allowed scope source | work order allowed only worker return and companion decision matrix under WORKER_MUST_NOT_COMMIT |
| Before status evidence | `git rev-parse --short HEAD` returned `eaffb52e`; `git status --short --untracked-files=all` returned clean before writing. |
| After status evidence | `git status --short --untracked-files=all` shows this file as untracked. |
| Diff evidence | `git diff --name-status`; untracked-file evidence comes from `git status --short --untracked-files=all`. |
| Approval boundary | WORKER_MUST_NOT_COMMIT; no stage, commit, push, public-sync, or forbidden path mutation. |
| Claim boundary | Docs-only route-selection decision matrix only; no MinerU runtime, private content read, memory route, RAG, checker code, hook wiring, app, provider/live, public, or production claim. |
| Agent type | worker |
| Invocation ID | `msea-r28-t2-receipt-boundary-checker-memory-route-selection-matrix-2026-07-04` |
| Expected manifest | this decision matrix |
| Actual changed set | this decision matrix |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename performed |

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | R28-T2 docs-only route-selection decision matrix |
| claimDisposition | CLAIM_REJECTED for runtime governance, provider/live proof, MinerU extraction accuracy, document truth, legal advice quality, current-law correctness, memory ingestion, RAG retrieval, checker implementation, workflow-chain production readiness, and public export claims. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT for runtime, provider, live, public, memory-route, RAG, schema-checker, and production workflow claims. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed by this decision matrix. |
| invocationBoundary | local file reads, searches, and governance gate reads only |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized. |
| claimLanguage | route-selection decision matrix only |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router behavior without fresh source-verified authorization. |

## Claim Boundary

This decision matrix is a CVF foundation route-selection companion only. It does
not authorize or claim checker implementation, hook wiring, MinerU runtime
execution, private document read, generated output content read or quote,
public-sync, provider/live proof, memory ingestion, RAG write, app packaging,
legal-quality analysis, current-law correctness, extraction accuracy, document
truth, production workflow readiness, action authority, or push.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: R28-T2 is private provenance route-selection work and does not change the
public-sync repository or public catalog.