# CVF MSEA-R7 MinerU Receipt Schema Contract Draft

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference drafts contract vocabulary
adapted from already-verified MSEA-T2/R5/R6 evidence; it does not itself
assert a new empirical corpus result, runtime behavior, or provider behavior
claim.

## Purpose

Draft a CVF-owned document-extraction receipt schema contract, adapted from
the pinned MinerU `docs/en/reference/output_files.md` evidence and MSEA-T2's
existing receipt advisory, so a future fresh GC-018 has concrete
artifact-family and field-family language to implement against. This is a
documentation/reference contract draft only; it does not implement a schema,
run any parser, import upstream source, call a provider, write a RAG index,
or claim production readiness.

## Scope / Boundary

Applies to: any future CVF-owned extraction receipt design that must record
what a document-parsing pass produced, without claiming the parse was
correct, complete, or production-ready.

Does not apply to: schema implementation, receipt-writer code, runtime
parser execution, provider/live proof, RAG index mutation, checker
implementation, or public-sync.

Non-claims (repeated here for emphasis, expanded in Claim Boundary below):
this draft does not claim CVF has implemented MinerU integration, installed
or run MinerU, produced a real receipt instance, or verified any extraction
output for correctness.

## Source Authority

| Authority | Source | Disposition |
| --- | --- | --- |
| MSEA-T2 receipt/quality/RAG-handoff advisory (existing owner surface this draft enriches) | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | ACCEPT |
| MSEA-R5 deep-read confirmation that `output_files.md` is the highest-value receipt-schema source | `docs/reviews/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_ABSORPTION_WORKER_RETURN_2026-07-02.md` | ACCEPT |
| MSEA-R5 owner-surface delta naming this exact conditional reopen candidate | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | ACCEPT |
| MSEA-R6 route decision selecting this tranche | `docs/reference/CVF_MSEA_R6_MINERU_APPLICATION_ROUTE_DECISION_MATRIX_2026-07-02.md` | ACCEPT |
| Pinned upstream source (advisory input only, not CVF authority) | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` at commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` | ADVISORY_ONLY |

## Claim Boundary Vocabulary (inherited from MSEA-T2, repeated for this draft)

Allowed bounded claims in this draft: MinerU's documented output-artifact
vocabulary can inform a future CVF receipt schema; artifact existence can be
recorded as manifest evidence; field-family names can be adapted into
CVF-owned language.

Forbidden claims: this draft does not claim CVF has implemented the schema,
that any receipt instance exists, that extraction accuracy or document truth
is certified, or that RAG/context ingestion is authorized by this draft
alone.

## Receipt Artifact Family Map

Adapted from `output_files.md` (upstream) into CVF-owned vocabulary. Column
`Upstream anchor` cites the source section for traceability; it is not a
schema import.

| CVF artifact family | Upstream anchor | Purpose | Backend applicability |
| --- | --- | --- | --- |
| Visual layout debug artifact | `output_files.md` "Layout Analysis File (layout.pdf)", line 17 | Human-review aid showing detected layout regions and reading-order numbering per page | pipeline and VLM backends both produce a layout debug artifact |
| Visual span debug artifact | `output_files.md` "Text Spans File (span.pdf)", line 35 | Human-review aid annotating page content by span type for text-loss/segmentation troubleshooting | pipeline backend only, per upstream's own documented note |
| Raw model-inference artifact | `output_files.md` "Model Inference Results (model.json)", line 62 | Lowest-level per-block model output (label, score, bounding box, reading-order index); intended for raw inspection, not end-user consumption | both pipeline and VLM backends produce a model-inference artifact, with different internal field shapes (see Backend Variant Boundary) |
| Intermediate hierarchical artifact | `output_files.md` "Intermediate Processing Results (middle.json)", line 109 | Page/block/line/span hierarchical structure intended for secondary development; carries backend and version identity | both pipeline and VLM backends produce this artifact with backend-specific field differences |
| Flattened reading-order artifact | `output_files.md` "Content List (content_list.json)", line 292 | Simplified, flattened, reading-order-sequenced content list derived from the intermediate artifact; intended for straightforward content extraction | both backends; VLM backend adds extra content types |
| Structured page-grouped artifact (development) | `output_files.md` "Common Content List V2 (content_list_v2.json)", line 396 | Newer page-grouped structured output with a unified type+content shape; explicitly marked upstream as a development-version artifact subject to change | all backends per upstream's stated intent, marked as evolving |
| Primary Markdown output | `output_files.md` Summary, line 730 area | Human-readable rendered document output | all backends |

## Field Family Map

Adapted field-family vocabulary. This is contract-language, not a runtime
schema definition; a future implementation tranche must define exact types,
required/optional status, and validation rules.

| CVF field family | Adapted meaning | Upstream anchor concept |
| --- | --- | --- |
| Source identity | Which input file and which artifact family this record describes | `{original_filename}` naming pattern used across all artifact families |
| Backend identity | Which parsing backend (pipeline, VLM, or office) and which schema version produced this artifact | `_backend`, `_version_name` top-level fields in the intermediate artifact |
| Page locator | Which page of the source document a block belongs to | `page_idx` |
| Block type | The content classification of a structural unit (heading, paragraph, table, image, chart, formula, code, list, or page-auxiliary type) | Level 1/2 block `type` taxonomy and content-list `type` field |
| Reading-order position | The sequence position of a block relative to other blocks on the page or document | reading-order index used in visual debug artifacts and `text_level`/ordering in the flattened artifact |
| Geometry locator | The bounding-box position of a content unit within a page | `bbox` field, present at multiple hierarchy levels |
| Textual or structured content | The extracted content payload for a block, in the form appropriate to its type | `content`, `text`, `table_body`, `code_body`, `math_content`, and related type-specific fields |
| Heading-level marker | Whether a text block is body text or a heading, and at what depth | `text_level` field |
| Caption/footnote association | Auxiliary text associated with a table, image, chart, or code block | `*_caption`, `*_footnote` field families |
| Structural sub-type | A finer classification within a block type (for example, ordinary list vs. reference-style list, or code vs. algorithm) | `sub_type` field |

## Backend Variant Boundary

The intermediate and flattened artifacts differ by backend. A future CVF
receipt schema must not assume one universal shape.

| Aspect | Pipeline backend | VLM backend |
| --- | --- | --- |
| Raw model-inference artifact shape | Per-block list with `cls_id`, `label`, `score`, `bbox`, `index` | Two-level nested list (pages, then blocks) with `type`, `bbox`, `angle`, `content`, and optional `score`/`block_tags`/`content_tags`/`format` |
| List block handling | Not documented as a distinct second-level block type in the same way | Adds a `sub_type` distinguishing ordinary vs. reference-style lists |
| Code block handling | Not present as a distinct type in the pipeline shape documented here | Adds a `code`/`algorithm` block type with `code_body`/`code_caption` |
| Discarded-block visibility | Limited set | Broader set including header/footer/page-number/aside-text/page-footnote |
| Coordinate normalization | Raw pixel-space bounding boxes at the intermediate-artifact level | Normalized `[0,1]` percentages at the raw-model-artifact level; the flattened artifact for both backends maps `bbox` into a 0-1000 range |
| V2 structured artifact | Emitted starting with the version noted in the upstream reference as a development addition | Emitted starting with the same version, explicitly marked subject to change |

A future receipt schema must record which backend produced an artifact
before interpreting field shapes, since the same field name can carry
different structure across backends.

## Downstream Use Boundary

Inherits and does not weaken MSEA-T2's existing rule: artifact existence is
not accuracy proof. A future receipt schema built from this draft must still
satisfy MSEA-T2's Central Rule and Document Extraction Rule before any
RAG/context handoff is authorized:

- an artifact family listed above may be recorded as manifest evidence once
  produced by an authorized route;
- recording that a `middle.json` or `content_list.json` artifact exists does
  not certify that its OCR, table, formula, or layout content is correct;
- RAG/context/memory ingestion remains forbidden unless the handoff includes
  receipt evidence, quality disposition, and a downstream-use status that
  authorizes that specific use, per MSEA-T2's Quality And RAG Handoff
  Advisory;
- this draft does not itself authorize any RAG/context ingestion.

## Future Checker Readiness Note

MSEA-T2 already names `MSEA-CC-4` ("validate a future extraction receipt
schema") with a `low now, defer until CVF owns schema fields` disposition.
This draft is exactly the schema-field ownership step that disposition
anticipates. It does not change `MSEA-CC-4`'s disposition or implement a
checker. A future tranche may reconsider `MSEA-CC-4`'s priority only after a
real CVF receipt schema (informed by this draft) is implemented and produces
real receipt instances to validate against.

## Explicit Non-Claims

This draft does not claim:

- that a CVF-owned receipt schema has been implemented;
- that any receipt instance has ever been produced;
- that MinerU has been installed, executed, or is production-ready;
- that any extraction output's OCR, table, formula, or layout content is
  accurate or represents document truth;
- that RAG/context ingestion is authorized;
- that the field-family vocabulary above is a finished, versioned, or
  validated schema - it is contract-draft language only, pending a future
  fresh GC-018 for actual schema implementation.

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
| --- | --- | --- | --- | --- |
| Receipt artifact family vocabulary | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` Receipt Advisory table | ENRICH_EXISTING | MSEA-T2 named field families abstractly ("artifact manifest", "source file identity"); this draft adds concrete upstream-anchored artifact families and field names | this draft; MSEA-T2 remains the canonical claim-boundary owner |
| Field-family vocabulary | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` Advisory field family table | ENRICH_EXISTING | Sharpens "artifact manifest" and "source file identity" rows with concrete field names traceable to `output_files.md` | this draft |
| Backend-variant differences | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | ENRICH_EXISTING | R5 confirmed a dual-backend schema exists at file level; this draft adds the concrete field-shape differences | this draft |
| `MSEA-CC-4` disposition | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` Checker Candidate Ledger | CONFIRMED_EXISTING | No change to disposition; this draft is preparatory groundwork, not a trigger to reopen it | no action; disposition unchanged |
| Direct upstream sample JSON | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/reference/output_files.md` | REJECT_DIRECT_IMPORT | Upstream sample payloads are not copied into this draft as a CVF schema | field names are adapted into prose vocabulary; no JSON schema block is copied |

## Claim Boundary

This contract draft records only adapted receipt-vocabulary language derived
from accepted MSEA-T2/R5/R6 evidence and the pinned MinerU source mirror. It
does not authorize or claim MinerU runtime integration, parser execution,
OCR execution, VLM/hybrid backend routing, remote backend processing, model
download, API/router/Gradio service, Docker deployment, RAG indexing,
provider/live proof, S3 access, credential handling, document truth
verification, parser accuracy, table/formula correctness, public-sync
export, checker enforcement, package activation, certification, generated
aggregate mutation, production readiness, hosted readiness, model-router
behavior, action authority, or universal document intelligence. A future
fresh GC-018 and source-verified work order is required before any schema
implementation, receipt-writer code, or runtime behavior.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this contract draft is private provenance documentation derived from
private source-mirror absorption evidence. No public-sync export is
authorized.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (no-commit worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | dispatchBaseHead `ce48461e`; executionBaseHead `d7b0bc96` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (source files, MSEA-T2/R5/R6 governed artifacts, pinned source mirror); Bash (git rev-parse, git status) |
| Target paths | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` |
| Allowed scope source | MSEA-R7 work order and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker return |
| After status evidence | one new untracked file |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | receipt schema contract draft documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/Web/MCP/model-router/action-authority claim |
| Agent type | Claude |
| Invocation ID | `msea-r7-mineru-receipt-schema-contract-draft-2026-07-02` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | MSEA-R7 receipt schema contract draft reference |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, or universal governed-coding-control claim is made by this reference. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed by this reference. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed by this reference. |
| invocationBoundary | Manual local documentation authoring only. |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized. |
| claimLanguage | Contract-draft vocabulary documentation and candidate-classification only. |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router/adapter/MinerU install/execution/model-download/RAG/S3/OpenAI-compatible-call/schema-implementation behavior without a fresh source-verified authorization. |
