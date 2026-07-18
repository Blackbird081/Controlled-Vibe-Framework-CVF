# CVF MSEA-R5 MinerU Deep Document Layer Scan Owner-Surface Delta

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records comparison
conclusions already produced and evidenced in the paired MSEA-R5 worker
return; it does not itself assert a new empirical prediction to compare.

## Purpose

Record the CVF-owned delta between deep-read MinerU document-layer, backend,
and Docker source (`docs/`, non-CLI `mineru/` internals, `docker/`) and the
prior MSEA-T0/T2/T3/R4 conclusions, so future tranches can read this file
instead of re-deriving the comparison. This is a reference/documentation
artifact only; it does not implement, install, execute, or authorize any
MinerU capability.

## Scope / Applies To

Applies to any future CVF work that considers reopening or extending the MSEA
MinerU absorption lane, especially any tranche touching document-extraction
receipt vocabulary, RAG-handoff doctrine, or the two new candidate surfaces
this delta records (OpenAI-compatible provider calls, S3 credential storage).
Does not apply to runtime, package, checker, or public-sync work, all of
which require a separate fresh GC-018 and, where behavior is claimed,
live/provider proof.

## Prior MSEA Lane Status (unchanged by this delta)

| Tranche | Status | Scope | Disposition |
| --- | --- | --- | --- |
| MSEA-T0 | `CLOSED_PASS_BOUNDED` | audit upstream MinerU and copied adapter folder, move folder to legacy storage, select next move | documentation-only |
| MSEA-T1 | `CLOSED_PASS_BOUNDED` | source-verified reconciliation matrix mapping MinerU/external-adapter concepts to CVF Extraction Foundation, corpus, RAG, and receipt owner surfaces | no runtime/checker/import |
| MSEA-T2 | `CLOSED_PASS_BOUNDED` | promote highest-value subset into CVF-owned document extraction claim-boundary, receipt, quality, and RAG-handoff advisory reference | reference only |
| MSEA-T3 | `CLOSED_PASS_BOUNDED` | decide whether one static checker candidate is worth implementing | no checker now; reopen only on concrete conditions |
| MSEA-R4 | accepted at material commit `a6ddd8ba` | source-mirror reconciliation with full count/hash manifest, grouped ledger, and individual rows for high-value CLI/Docker files | no runtime/checker/import; `PARTIAL` blind-spot verdict on `docs/`/non-CLI `mineru/` read depth |
| MSEA-R5 | this delta | targeted deep ledger for `docs/`, non-CLI `mineru/` internals, and `docker/` (373-file target subset) | no runtime/checker/import; `PARTIAL` blind-spot verdict on `mineru/model/utils` (57 files) and 9 of 10 Docker hardware-variant file contents |

None of MSEA-T0, MSEA-T1, MSEA-T2, MSEA-T3, or MSEA-R4 is reopened by this
delta. All remain `CLOSED_PASS_BOUNDED` / `ACTIVE_REFERENCE` / accepted as
recorded above.

## Delta Summary

Deep reading confirms every MSEA-R4 finding and adds four concrete new
evidence items:

1. **Document-extraction receipt schema** (`docs/en/reference/output_files.md`)
   - upstream's own exhaustive block-type taxonomy, page/layer hierarchy, and
     dual pipeline/VLM backend output variants. This sharpens, without
     replacing, MSEA-T2's receipt vocabulary.

2. **Concrete RAG-integration evidence** - MinerU is already deeply
   integrated as RagFlow's built-in PDF parser (both hosted and local-Docker
   RagFlow deployments), plus 10 additional named third-party integration
   guides (Dify, FastGPT, n8n, Coze, BISHENG, Cherry Studio, DataFlow,
   DingTalk, ModelWhale, Sider). This is concrete, already-shipped evidence,
   not speculative candidate value.

3. **OpenAI-compatible provider-call surface** (`mineru/utils/llm_aided.py`)
   - a config-gated LLM-assisted title-correction feature that instantiates
   an `openai.OpenAI` client with caller-supplied `api_key`/`base_url`. This
   is a second, distinct provider-call surface beyond the CLI entry points
   MSEA-R4 already recorded.

4. **Credential-requiring storage surface** (`mineru/data/io/s3.py`) - an
   `S3Reader` requiring `bucket`/`ak`/`sk`/`endpoint_url` via an on-demand
   `boto3` import. No prior MSEA artifact had identified a credential-
   requiring storage surface.

All four remain candidate-only. None is authorized for implementation by
this delta or by MSEA-R5.

## Owner-Surface Map

| Value item | CVF owner surface | Current disposition |
| --- | --- | --- |
| Document-extraction receipt/block-type schema | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | owned; enriched with file-level schema detail, not changed |
| RAG-handoff and third-party integration evidence | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | owned; enriched with concrete RagFlow integration evidence |
| CLI/API/router/Gradio/model-download runtime surfaces | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` (deferred runtime lane) | owned; unchanged by this delta |
| OpenAI-compatible provider-call surface (`llm_aided.py`) | this delta (new owner surface; future MSEA-R6+ or MSEA-R4 delta may fold it in) | new candidate; `DEFER_DEMAND_GATED` |
| Credential-requiring storage surface (`s3.py`) | this delta (new owner surface) | new candidate; `DEFER_DEMAND_GATED` |
| Docker/hardware-variant deployment surfaces | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` (deferred package lane) | owned; enriched with hardware/driver precondition detail |
| Table/layout/OCR/formula model-quality claims | `docs/reviews/CVF_MSEA_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md` | owned; no-checker-now decision stands, enriched with two-engine table-recognition detail |
| Source mirror control-plane authority | `.private_reference/source_mirrors/INDEX.md` | owned; pinned and reconciled, no drift |

## Conditional Reopen Candidates

Six candidate sets are recorded here as the CVF-native owner-surface delta
this tranche adds or enriches. None is authorized for implementation by this
reference or by MSEA-R5. A future fresh GC-018 is required, and any behavior
claim requires live/provider proof.

| Candidate | Concrete reopen condition | Forbidden until reopened |
| --- | --- | --- |
| Document-extraction receipt schema adoption into a CVF-native receipt contract | An operator names a concrete downstream extraction use case and a fresh GC-018 authorizes drafting a CVF-owned receipt schema informed by (not copied from) `output_files.md`. | direct schema import, receipt contract implementation without fresh authorization |
| MinerU CLI/API runtime integration (`mineru/cli/*.py`, from MSEA-R4) | An operator names a concrete downstream use case that requires MinerU document parsing, and a fresh GC-018 authorizes model download, execution, and live/provider proof for the specific backend needed. | install, model download, execution, API/router/Gradio/server startup, provider/live proof |
| `llm_aided.py` OpenAI-compatible provider-call surface | An operator names a concrete downstream use case requiring LLM-assisted title correction, and a fresh GC-018 authorizes a provider/live-proof boundary for the specific OpenAI-compatible endpoint used. | any live call to `openai.OpenAI` inside this code path, credential provisioning |
| `s3.py` credential-requiring storage surface | An operator names a concrete downstream use case requiring remote S3-compatible storage, and a fresh GC-018 authorizes a credential-handling boundary (secret storage, rotation, access scope). | any live S3 connection, credential storage, or remote IO |
| MinerU Docker deployment recipes (`docker/`, from MSEA-R4, enriched with hardware preconditions) | An operator names a concrete deployment target and hardware profile (GPU/CUDA/driver version matching one of the 10 documented variants), and a fresh GC-018 authorizes Docker build/run and package-lane registration. | Docker build/run, package activation, registry mutation |
| Table-structure-recognition checker candidate (two independent engines: SLANet-plus, UNet-based) | CVF identifies a repeated real table-parsing miss or receipt-quality gap in an authorized future extraction use case. | checker implementation, hook wiring |

## Read-Depth Limitation

Per the paired worker return's Blind-Spot Control Block, `mineru/model/utils/`
(57 files, the single largest subfolder in the R5 target subset) was read at
directory-listing depth only, not file-by-file, because it is internal
plumbing supporting the layout/OCR/table/formula model layers already read
in detail. Nine of ten `docker/china/*.Dockerfile` hardware-variant files
were confirmed by name and count but not diffed line-by-line against the
base `Dockerfile`. A future tranche that needs deeper `mineru/model/utils`
or per-hardware-variant Docker content detail should name the specific pain
point or file rather than requesting a full re-read.

## Claim Boundary

This reference records a bounded deep-read file-level comparison delta only.
It does not authorize or claim MinerU runtime integration, parser execution,
OCR execution, VLM/hybrid backend routing, remote backend processing, model
download, API/router/Gradio service, Docker deployment, RAG indexing,
document truth verification, parser accuracy, table/formula correctness,
OpenAI-compatible or S3 live calls, public-sync export, checker enforcement,
package activation, certification, generated aggregate mutation, production
readiness, hosted readiness, model-router behavior, action authority, or
universal document intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this owner-surface delta is private provenance documentation over an
internal source-mirror comparison. No public-sync export is authorized.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (no-commit worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | dispatchBaseHead `ca07147e`; executionBaseHead `de533f18` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (source files, prior MSEA artifacts); Bash (find, git) |
| Target paths | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` |
| Allowed scope source | MSEA-R5 work order and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker return |
| After status evidence | one new untracked file |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | no MinerU install/execution, model download, API/router/Gradio/Docker/RAG/checker/package/model-router/action-authority work |
| Claim boundary | owner-surface delta documentation only |
| Agent type | Claude |
| Invocation ID | `msea-r5-mineru-deep-document-layer-scan-2026-07-02` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | MSEA-R5 owner-surface delta reference |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, or universal governed-coding-control claim is made by this reference. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed by this reference. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed by this reference. |
| invocationBoundary | Manual local documentation authoring only. |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized. |
| claimLanguage | Owner-surface delta documentation and candidate-classification only. |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router/adapter/MinerU install/execution/model-download/RAG/S3/OpenAI-compatible-call behavior without a fresh source-verified authorization. |
