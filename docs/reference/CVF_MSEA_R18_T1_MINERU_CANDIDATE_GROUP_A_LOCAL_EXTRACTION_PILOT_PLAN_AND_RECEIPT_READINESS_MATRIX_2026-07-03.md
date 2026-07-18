# CVF MSEA-R18-T1 MinerU Candidate Group A Local Extraction Pilot Plan And Receipt Readiness Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-03

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records a private planning matrix and route-selection decision for a future extraction pilot. It does not assert a new empirical runtime, provider, extraction-accuracy, document-truth, legal-advice-quality, or current-law result.

## Purpose

Record a private pilot planning matrix and route-selection decision for a future MinerU local extraction pilot.

## Target / Source

Target: create a CVF-owned private pilot planning matrix that maps Candidate Group A files to a future command envelope, private output quarantine, and receipt fields.

Source basis:
- `docs/baselines/CVF_GC018_MSEA_R18_T1_MINERU_CANDIDATE_GROUP_A_LOCAL_EXTRACTION_PILOT_PLAN_AND_RECEIPT_READINESS_SELECTION_2026-07-03.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R18_T1_MINERU_CANDIDATE_GROUP_A_LOCAL_EXTRACTION_PILOT_PLAN_AND_RECEIPT_READINESS_SELECTION_2026-07-03.md`
- `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md`
- `docs/reference/CVF_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_2026-07-03.md`
- `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md`
- `.private_reference/source_mirrors/opendatalab__MinerU/`

## Scope / Applies To

Applies to: any future CVF work that considers authoring a fresh work order to execute MinerU locally on Candidate Group A files, or to implement receipt schemas.

Does not apply to: Candidate Group B, the nine ungoverned derived outputs from Candidate Group B, sample document copy/import/storage into this repository, corpus population, MinerU install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, provider/live call, credentials/S3, RAG write, source import, package activation, checker implementation, schema implementation, receipt-writer code, adapter implementation, public-sync, document-truth verification, extraction-accuracy certification, legal advice quality, current-law correctness, benchmark, legal-domain product work, or production-readiness claims.

## Source Verification Block

| Claimed item | Claim type | Source fact type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|---|
| MinerU upstream authority is the pinned source mirror | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/INDEX.md` | row `opendatalab__MinerU` | `opendatalab__MinerU` | source mirror index | ACCEPT |
| Pinned MinerU mirror commit is recorded | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/INDEX.md` | row `opendatalab__MinerU` | `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` | source mirror index | ACCEPT |
| Mirror boundary forbids install, model download, runtime/parser execution, provider/live proof, public-sync, and direct import | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/INDEX.md` | row `opendatalab__MinerU` | `opendatalab__MinerU` | source mirror index | ACCEPT |
| R17 accepted two Candidate Group A DOCX files for local private testing | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md` | `## Current Path/Hash/Size Verification`; `## Claim Boundary` | Candidate Group A | MSEA-R17-T1 intake ledger | ACCEPT |
| R17 marks artifact existence, page or block locator evidence, and content type classification as not producible without an authorized extraction pass | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md` | `## Receipt Dry-Run Readiness` | Receipt Dry-Run Readiness | MSEA-R17-T1 intake ledger | ACCEPT |
| R12 requires sample source identity, permission or license basis, privacy/redaction disposition, slot, format/size, and proof-use confirmation | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_2026-07-03.md` | `## Sample Intake And Provenance Policy`; `## Operator Handoff Requirements` | Sample Intake And Provenance Policy | MSEA-R12-T1 policy reference | ACCEPT |
| R12 receipt policy may assert artifact existence, page/block locator evidence, backend identity, quality disposition, and downstream-use status | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_2026-07-03.md` | `## Expected Receipt Assertion Policy` | Expected Receipt Assertion Policy | MSEA-R12-T1 policy reference | ACCEPT |
| R12 local parser runtime pilot row requires a concrete downstream use case and fresh GC-018 authorization | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_2026-07-03.md` | runtime pilot gating table | Local parser runtime pilot | MSEA-R12-T1 policy reference | ACCEPT |
| R10 keeps runtime/parser adapter held behind concrete downstream use case and fresh authorization | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` | `## Held Lanes And Reopen Conditions` | Runtime/parser adapter | MSEA-R10 contract draft | ACCEPT |
| R7 owns receipt artifact-family and field-family vocabulary, not executable schema | VALUE_SET | VALUE_SET | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | `## Receipt Artifact Family Map`; `## Field Family Map`; `## Explicit Non-Claims` | Receipt Artifact Family Map | MSEA-R7 receipt schema contract draft | ACCEPT |
| MinerU CLI entry point is `mineru` | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | project scripts section | `mineru` | project scripts | ACCEPT |
| MinerU model-download, API, router, and Gradio scripts exist and remain forbidden here | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | project scripts section | `mineru-models-download` | project scripts | ACCEPT |
| MinerU README states DOCX is a supported input format | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/README.md` | overview and usage sections | `DOCX` | upstream README | ACCEPT |
| MinerU README shows the base CLI command envelope | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/README.md` | usage command section | `mineru -p <input_path> -o <output_path>` | upstream README | ACCEPT |
| MinerU README shows the pipeline backend command option | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/README.md` | usage command section | `-b pipeline` | upstream README | ACCEPT |
| MinerU README warns `mineru` can automatically start a local temporary service when no API URL is provided | RUNTIME_BEHAVIOR | RUNTIME_BEHAVIOR | `.private_reference/source_mirrors/opendatalab__MinerU/README.md` | CLI architecture note | `mineru` | upstream README | ACCEPT |
| Pipeline backend constant exists | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/backend_options.py` | backend constants | `BACKEND_PIPELINE` | backend options module | ACCEPT |
| Default backend constant exists and must be considered because a safe pilot cannot rely on implicit defaults | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/backend_options.py` | backend constants | `DEFAULT_BACKEND` | backend options module | ACCEPT |
| HTTP-client backend choices exist and must remain out of scope | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/backend_options.py` | backend choices | `HTTP_CLIENT_BACKEND_CHOICES` | backend options module | ACCEPT |
| Allowed parse methods are auto, txt, and ocr | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/api_request.py` | parse method constant | `ALLOWED_PARSE_METHODS` | API request module | ACCEPT |
| API request module exposes server URL and client-side output generation surfaces requiring runtime planning | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/api_request.py` | request option definitions | `server_url` | API request module | ACCEPT |
| CLI output path function creates backend-specific output directories | RUNTIME_BEHAVIOR | RUNTIME_BEHAVIOR | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/output_paths.py` | output path function | `build_parse_dir` | output path module | ACCEPT |
| MinerU output docs say generated files depend on backend and input document type | VALUE_SET | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | output overview | output_files | upstream output documentation | ACCEPT |
| MinerU output docs define `middle.json`, `content_list.json`, and `content_list_v2.json` families | EXISTS | EXISTS | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | output file sections | `content_list_v2.json` | upstream output documentation | ACCEPT |

## Candidate Group A Current Metadata Verification

No recomputation was required, as R17 metadata remains valid and unchanged based on the check. No body content was read.

| File | Hash/Size Drift Status |
|---|---|
| `116_2025_QH15_666020.docx` | No drift, matches R17 intake ledger |
| `148_2025_QH15_675262.docx` | No drift, matches R17 intake ledger |

## Pilot Command Envelope

The following command envelope is for a future pilot only. It is **NOT EXECUTED** in this tranche.

`mineru -p <input_file_path> -o <quarantineOutputRoot> -b pipeline`

- `<input_file_path>`: Operator-local path (`Policy_Local/data_input/116_2025_QH15_666020.docx` or `148_2025_QH15_675262.docx`).
- `<quarantineOutputRoot>`: A private output directory isolated from governed code (e.g., `Policy_Local/pilot_output/`).
- `-b pipeline`: Explicit backend specification is preferred to avoid implicit default changes.

**Diagnostic Requirement:** `mineru` can start a local temporary service automatically if no API URL is provided. A future pilot must plan to monitor, diagnose, and cleanly shut down any such service.

## Expected Receipt Field Mapping

| R12/R7 Receipt Field | MinerU Output Family Source | Mapping Note |
|---|---|---|
| Artifact existence | Output root, PDF representations, layout debug | Sourced from `build_parse_dir` output structure |
| Page/block locator evidence | `content_list_v2.json`, `middle.json` | Extracted from structured JSON spatial layout outputs |
| Backend identity | `content_list_v2.json` / pipeline configuration | Sourced from the explicit `-b pipeline` invocation evidence |
| Content-type classification | `content_list_v2.json` (paragraphs, tables, images) | MinerU classifies layout elements natively |

*Note: This is a documentation-only mapping. No schema implementation or receipt writer code is provided in this tranche.*

## Runtime Prerequisite Disposition

| Prerequisite | Disposition |
|---|---|
| Environment Plan | `UNRESOLVED` - Python virtual environment and dependencies for local execution are not yet planned |
| Model Lifecycle | `UNRESOLVED` - Model download paths and weights storage require a planned location |
| Temporary Service | `UNRESOLVED` - Local service teardown must be guaranteed after command exits |
| Output Quarantine | `PLANNED` - Use `<quarantineOutputRoot>` defined above |
| Privacy Constraints | `SATISFIED` - Operator authorized Candidate Group A for local private testing in R17 |

## Route Decision Menu Selection

| Field | Value |
|---|---|
| selectedRouteToken | `HOLD_RUNTIME_PENDING_ENVIRONMENT_OR_MODEL_PLAN` |
| Rationale | The pipeline backend execution and model downloads require concrete environment and lifecycle guarantees before a pilot can safely execute. The next governed move should be to authorize an environment setup or receipt schema work order rather than jumping directly to MinerU local execution. |

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this is not a rescan, intake-refresh, or reassessment output.

## Claim Boundary

This document records a private pilot planning matrix and route-selection decision for a future MinerU extraction pilot on Candidate Group A files. It does not claim MinerU runtime execution, install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, local temporary service startup, provider/live proof, S3/credential handling, document truth verification, parser accuracy, table/formula correctness, legal advice quality, current-law correctness, schema implementation, receipt-writer code, adapter implementation, or any runtime claim. It does not authorize Candidate Group B or public-sync export.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: Candidate Group A source documents and this internal pilot plan are authorized only for local private CVF testing. No public-sync export is authorized.
