# CVF MSEA-R28-T3 MinerU Receipt Boundary Checker Candidate Design Matrix

Memory class: governed-reference-contract

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-04

Batch ID: MSEA-R28-T3

rawMemoryReleased=false

## Purpose

Record a source-verified checker-candidate design for a future MinerU
receipt-boundary checker, mapping R26 candidate check families and R28-T1
metadata receipt writer behavior into candidate check families, evidence
inputs, failure dispositions, and non-goals, without implementing checker
code, hook wiring, or memory writes.

## Scope / Applies To

Applies to private CVF-foundation planning for a future
`governance/compat/check_mineru_receipt_boundary.py`-class checker. It
applies to candidate check design, source evidence mapping, and explicit
implementation/memory-route holds.

It does not apply to checker code, hook catalog wiring, MinerU runtime
execution, memory-layer or RAG write, adapter implementation, standalone PDF
app work, legal/use-case deep dive, provider/live proof, public-sync, or
production workflow-chain readiness claims.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| R28-T2 selected the checker-candidate design route and held memory-route release. | VALUE_SET | `docs/reviews/CVF_MSEA_R28_T2_MINERU_RECEIPT_BOUNDARY_CHECKER_AND_MEMORY_ROUTE_RELEASE_SELECTION_WORKER_RETURN_2026-07-04.md` | Decision / Disposition, lines 150-156 | `SELECT_RECEIPT_BOUNDARY_CHECKER_CANDIDATE_DESIGN_ONLY`; `HOLD_MEMORY_ROUTE_RELEASE_PENDING_RECEIPT_CHECKER_AND_QUALITY` | MSEA-R28-T2 worker return | ACCEPT |
| R26 names six checker-candidate check families without authorizing implementation. | VALUE_SET | `docs/reference/CVF_MSEA_R26_T1_MINERU_RECEIPT_SCHEMA_WRITER_CONTRACT_AND_CHECKER_CANDIDATE_DESIGN_2026-07-04.md` | Checker Candidate Design, lines 100-111 | `checkerCandidateStatus`; `CHECKER_CANDIDATE`; `NOT_AUTHORIZED_BY_R26` | MSEA-R26 receipt contract | ACCEPT |
| R24-T4 defines the private output class matrix and receipt envelope fields. | VALUE_SET | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | Receipt Envelope, lines 39-56; Private Output Class Matrix, lines 58-66 | `outputContentRead`; `downstreamRelease`; `PRIVATE_INPUT_ONLY`; `PRIVATE_RUNTIME_COPY`; `PRIVATE_GENERATED_OUTPUT`; `RECEIPT_METADATA_ALLOWED` | MSEA-R24-T4 private-output policy | ACCEPT |
| R28-T1 writer defines a stable payload builder that fails closed on required fields. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | line 18 (`DOWNSTREAM_RELEASE_HELD`); lines 66-76 (`MineruMetadataReceipt`); lines 112-138 (`build_mineru_metadata_receipt`); lines 159-176 (`mineru_metadata_receipt_payload`); lines 178-186 (`render_mineru_metadata_receipt_json`) | `DOWNSTREAM_RELEASE_HELD`; `MineruMetadataReceipt`; `build_mineru_metadata_receipt`; `mineru_metadata_receipt_payload`; `render_mineru_metadata_receipt_json` | Extraction Foundation metadata receipt writer | ACCEPT |
| R28-T1 writer rejects `output_content_read=True` and validates output file names against an allowlist. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | line 135 (`output_content_read is not False`); lines 26-35 (`ALLOWED_OUTPUT_FILE_NAMES`); lines 93-109 (`_validate_output_file_name`) | `OUTPUT_CONTENT_READ_FORBIDDEN`; `ALLOWED_OUTPUT_FILE_NAMES`; `_validate_output_file_name` | Extraction Foundation metadata receipt writer | ACCEPT |
| R28-T1 writer tests prove stable payload shape, held downstream release, and false output-content-read behavior. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/tests/test_mineru_metadata_receipt_writer.py` | lines 42-59 (required-field payload test); lines 62-74 (stable-rendering test); lines 133-141 (`downstream_lanes_remain_held` test) | `test_receipt_payload_contains_required_r24_r26_metadata_fields`; `test_downstream_lanes_remain_held_for_future_packets` | Extraction Foundation metadata receipt writer tests | ACCEPT |
| R27 requires receipt, quality, source pointer, allowed downstream use, and claim boundary before a memory-safe candidate is ready; memory write itself remains unauthorized. | VALUE_SET | `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | Scan-To-Memory Intake Route Matrix, lines 77-87 | `MEMORY_SAFE_CANDIDATE_READY`; `MEMORY_WRITE_AUTHORIZED`; `NOT_AUTHORIZED_BY_R27` | MSEA-R27 decision ledger | ACCEPT |
| Extraction Foundation pipeline owns quality, chunk, and storage-boundary primitives that a future memory-safe route would consume. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/extraction_pipeline.py` | line 101 (`ExtractionQualityReport`); line 117 (`ExtractionChunk`); line 152 (`ExtractionStorageBoundary`) | `ExtractionQualityReport`; `ExtractionChunk`; `ExtractionStorageBoundary` | Extraction Foundation pipeline | ACCEPT |

## New Doc-Only Fields

| Field or token | Purpose | Source fact type | Worker rule |
| --- | --- | --- | --- |
| `RECEIPT_BOUNDARY_CHECKER_CANDIDATE_DESIGN_ONLY` | selected R28-T3 route token | DOC_ONLY_NEW | use for design readiness only, not checker code |
| `CHECKER_IMPLEMENTATION_HELD_PENDING_ACCEPTED_DESIGN` | downstream implementation hold token | DOC_ONLY_NEW | use if design is complete but implementation remains unauthorized |
| `MEMORY_ROUTE_HELD_PENDING_ACTUAL_CHECKER_AND_QUALITY` | memory route hold token for R28-T3 | DOC_ONLY_NEW | preserve R28-T2 memory hold until actual checker and quality/source-pointer prerequisites exist |

## Checker Candidate Design Matrix

checkerCandidateStatus: `CHECKER_CANDIDATE`

| Candidate check family | Source evidence | Target receipt field | Input to checker | Failure disposition | Non-goal |
| --- | --- | --- | --- | --- | --- |
| Required receipt field presence | R26 Checker Candidate Design row "Required receipt field presence"; writer's `mineru_metadata_receipt_payload` fixed key set | `receiptId`, `sourceInputSlot`, `inputSha256`, `outputFileNames`, `outputContentRead`, `privateOutputDisposition`, `downstreamRelease`, `claimBoundary` | a committed receipt JSON/markdown document | `MISSING_REQUIRED_RECEIPT_FIELD` (candidate token, not implemented) | does not validate field *content correctness*, only presence |
| Private output class vocabulary | R24-T4 Private Output Class Matrix; writer's `MineruPrivateOutputClass` literal | `privateOutputClass` | the receipt's declared class value | `INVALID_PRIVATE_OUTPUT_CLASS` (candidate token) | does not judge whether the classification is factually accurate for the underlying document |
| Output-content boundary | writer line 135 `output_content_read is not False`; R26 row "Output-content boundary" | `outputContentRead` | boolean field on the receipt | `OUTPUT_CONTENT_READ_TRUE_WITHOUT_AUTHORITY` (candidate token) | does not itself read or inspect any document/output content |
| Filename-only output evidence | writer `ALLOWED_OUTPUT_FILE_NAMES` and `_validate_output_file_name`; R26 Output Filename Family Mapping | `outputFileNames` | list of output file name strings on the receipt | `OUTPUT_FILE_NAME_NOT_METADATA_ONLY` (candidate token) | does not open or validate the referenced files themselves |
| Downstream release hold | writer `DOWNSTREAM_RELEASE_HELD` constant; R27 `MEMORY_SAFE_CANDIDATE_READY` / `MEMORY_WRITE_AUTHORIZED` route tokens | `downstreamRelease` | receipt's declared release/hold token | `DOWNSTREAM_RELEASE_CLAIMS_UNAUTHORIZED_ROUTE` (candidate token) | does not grant or wire an actual memory-write or RAG-ingest route |
| Source-slot privacy | R26 row "Source slot privacy"; R24-T4 `sourceInputSlot` field disposition | `sourceInputSlot` | slot-label string on the receipt | `SOURCE_SLOT_EXPOSES_SENSITIVE_DETAIL` (candidate token) | does not perform legal/PII classification, only a bounded label-shape check |
| Quality/source-pointer prerequisite | R27 Scan-To-Memory Intake Route Matrix rows `QUALITY_DISPOSITION_READY` and `MEMORY_SAFE_CANDIDATE_READY`; Extraction Foundation `ExtractionQualityReport` | (future field, not yet in R28-T1 receipt) | a paired quality report and source pointer, once such a field exists | `QUALITY_OR_SOURCE_POINTER_MISSING` (candidate token) | does not itself compute extraction quality; only checks presence of the prerequisite artifact |

## Future Implementation Prerequisites

| Prerequisite | Current disposition | What a future implementation work order would need |
| --- | --- | --- |
| Checker module | not implemented | a new `governance/compat/check_mineru_receipt_boundary.py` with the candidate checks above as testable functions |
| Hook/catalog wiring | not implemented | registration in the applicable autorun/hook catalog once the checker module exists and passes focused tests |
| Quality/source-pointer field | not present in R28-T1 receipt shape | a schema extension (separate fresh GC-018) adding a quality-report reference and source pointer to the receipt envelope |
| Memory-write adapter | not implemented, `NOT_AUTHORIZED_BY_R27` | a dedicated memory-owner work order, only after the checker above exists and the quality/source-pointer field lands |

## Held / Rejected Lanes

| Lane | Disposition |
| --- | --- |
| Checker code / hook wiring | `CHECKER_IMPLEMENTATION_HELD_PENDING_ACCEPTED_DESIGN` |
| Memory-route release | `MEMORY_ROUTE_HELD_PENDING_ACTUAL_CHECKER_AND_QUALITY` |
| MinerU runtime execution | REJECTED - out of scope for a docs-only design tranche |
| Standalone PDF app / legal-use-case deep dive | REJECTED - CVF foundation-plane scope only, per operator instruction |
| Provider/live proof, public-sync | REJECTED - no such claim is made or needed for a design matrix |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
| --- | --- | --- | --- | --- |
| R28-T1 metadata writer | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | CONFIRMED_EXISTING | concrete receipt shape and fail-closed validation behavior | used as candidate-design input |
| R26 checker candidate criteria | R26 receipt contract reference | ENRICH_EXISTING | organized R26's prose criteria into a concrete check-family/field/failure-token matrix | design only |
| R28-T2 selected route | R28-T2 worker return and companion matrix | ENRICH_EXISTING | converts the route decision into a design artifact | this matrix |
| Memory-safe candidate route | R27 decision ledger and Extraction Foundation quality owners | CONFIRMED_EXISTING | no new release evidence; held lane restated | keep held |
| Checker implementation, memory write, runtime, app | R27/R28 held surfaces and operator CVF-foundation instruction | REJECT_DIRECT_IMPORT | useful later but out of scope now | keep held |

## Verification

| Check | Evidence | Disposition |
| --- | --- | --- |
| Source routes verified | all seven Source Verification Block rows re-checked against current file content at `executionBaseHead 8266c9eb` | PASS |
| Design-only boundary preserved | no checker code, hook wiring, or `governance/compat` edit made | PASS |
| Memory-route hold preserved | `MEMORY_ROUTE_HELD_PENDING_ACTUAL_CHECKER_AND_QUALITY` restated, not released | PASS |
| Privacy boundary preserved | no private document body or generated output content read or quoted | PASS |

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Expected Result / Prediction | Reconciling R26's checker-candidate criteria against the current R28-T1 writer source would produce a design matrix where every candidate check family maps to an existing, verifiable writer field, constant, or fail-closed branch, without requiring new source facts. |
| Evidence Comparison | Direct re-reads of `mineru_metadata_receipt_writer.py` and its tests confirmed every field, constant, and fail-closed branch cited in the Source Verification Block exists at the stated lines; R27's Scan-To-Memory Intake Route Matrix and R24-T4's Private Output Class Matrix aligned with the held-route rows without contradiction. |
| Contradiction Or Gap Disposition | No contradiction found; the only gap is the intentionally held absence of an actual checker module, quality/source-pointer field, and memory-write adapter, which this design tranche defers rather than closes. |
| Claim Update | The checker-candidate design matrix is ready for reviewer acceptance as design-only evidence; it does not upgrade the R28-T2 memory-route hold or the R26 `NOT_AUTHORIZED_BY_R26` implementation boundary. |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude worker |
| Provider or surface | Claude Code CLI, local workspace |
| Session or invocation | MSEA-R28-T3 MinerU Receipt Boundary Checker Candidate Design, 2026-07-04 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, Grep, Bash (`git`, `python governance/compat/*`), Write |
| Target paths | this design matrix and its paired worker return |
| Allowed scope source | `CVF_SESSION/ACTIVE_SESSION_STATE.json` `nextAllowedMove` and the named work order |
| Before status evidence | HEAD `8266c9eb`; `git status --short --untracked-files=all` returned no output before authoring; planned output paths confirmed absent |
| After status evidence | design matrix and paired worker return created, uncommitted; HEAD unchanged at `8266c9eb` |
| Diff evidence | `git diff --name-status` (empty; both files are new/untracked additions, not modifications of tracked files) |
| Approval boundary | worker execution under `WORKER_MUST_NOT_COMMIT` only |
| Claim boundary | docs-only checker-candidate design; no checker code, hook wiring, runtime, memory write, or production claim |
| Agent type | worker |
| Invocation ID | `msea-r28-t3-design-matrix-2026-07-04` |
| Expected manifest | worker return plus this companion design matrix |
| Actual changed set | worker return plus this companion design matrix |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename performed |

## Claim Boundary

This reference is a checker-candidate design matrix only. It does not
implement or prove a checker, hook wiring, MinerU runtime, receipt writer
change, memory-layer flow, RAG ingestion, adapter, provider/live behavior,
public-sync, workflow-chain production readiness, extraction accuracy,
document truth, or legal-quality analysis.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: R28-T3 is private provenance design work and does not change the
public-sync repository or public catalog.
