# CVF MSEA-R4 MinerU Upstream Owner-Surface Delta

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records comparison
conclusions already produced and evidenced in the paired MSEA-R4 worker
return; it does not itself assert a new empirical prediction to compare.

## Purpose

Record the CVF-owned delta between the pinned upstream MinerU source mirror
(commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`, 425 files) and the prior
MSEA-T0/T1/T2/T3 conclusions, so future tranches can read this file instead of
re-deriving the comparison. This is a reference/documentation artifact only;
it does not implement, install, execute, or authorize any MinerU capability.

## Scope / Applies To

Applies to any future CVF work that considers reopening or extending the MSEA
MinerU absorption lane. Does not apply to runtime, package, checker, or
public-sync work, all of which require a separate fresh GC-018 and, where
behavior is claimed, live/provider proof.

## Prior MSEA Lane Status (unchanged by this delta)

| Tranche | Status | Scope | Disposition |
| --- | --- | --- | --- |
| MSEA-T0 | `CLOSED_PASS_BOUNDED` | audit upstream MinerU and copied adapter folder, move folder to legacy storage, select next move | documentation-only |
| MSEA-T1 | `CLOSED_PASS_BOUNDED` | source-verified reconciliation matrix mapping MinerU/external-adapter concepts to CVF Extraction Foundation, corpus, RAG, and receipt owner surfaces | no runtime/checker/import |
| MSEA-T2 | `CLOSED_PASS_BOUNDED` | promote highest-value subset into CVF-owned document extraction claim-boundary, receipt, quality, and RAG-handoff advisory reference | reference only |
| MSEA-T3 | `CLOSED_PASS_BOUNDED` | decide whether one static checker candidate is worth implementing | no checker now; reopen only on concrete conditions |
| MSEA-R4 | this delta | source-mirror reconciliation with full count/hash manifest, grouped ledger, and individual rows for high-value CLI/Docker files | no runtime/checker/import; PARTIAL blind-spot verdict on `docs/`/non-CLI `mineru/` read depth |

None of MSEA-T0, MSEA-T1, MSEA-T2, or MSEA-T3 is reopened by this delta. All
four remain `CLOSED_PASS_BOUNDED` / `ACTIVE_REFERENCE` as recorded above.

## Delta Summary

The current upstream mirror confirms every claim already cited in the MSEA-R4
GC-018 baseline's Source Verification Block (package identity, VLM/pipeline/
Gradio extras, CLI/API/router/model-download entry points, README output-
format and MCP/RAG/CLI/API/Docker/Gradio claims). No prior MSEA conclusion is
contradicted.

Two concrete new file-level evidence sets are added by this pass, both
classified as candidate-only per the MSEA-R4 work order's forbidden scope:

1. **CLI runtime-candidate file paths** - the exact source files behind each
   `pyproject.toml` script entry are now known:
   - `mineru = "mineru.cli.client:main"`
   - `mineru-api = "mineru.cli.fast_api:main"`
   - `mineru-vllm-server` / `mineru-lmdeploy-server` / `mineru-openai-server` = `mineru.cli.vlm_server:*`
   - `mineru-models-download = "mineru.cli.models_download:download_models"`
   - README's `mineru-router` and Gradio claims map to `mineru/cli/router.py` and `mineru/cli/gradio_app.py`

2. **Docker deployment-candidate file set** - 12 files: `docker/global/Dockerfile`,
   `docker/compose.yaml`, `docker/china/Dockerfile`, and 9 hardware-variant
   Dockerfiles under `docker/china/` (corex, dcu, gcu, kxpu, maca, mlu, musa,
   npu, ppu).

## Owner-Surface Map

| Value item | CVF owner surface | Current disposition |
| --- | --- | --- |
| Document conversion into Markdown/JSON | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | owned; confirmed, not changed |
| Extraction receipt vocabulary | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | owned; confirmed, not changed |
| CLI/API/router/Gradio/model-download runtime surfaces | `docs/roadmaps/CVF_MSEA_T0_MINERU_STRUCTURED_EXTRACTION_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` (deferred runtime lane) | owned; file-level evidence added, still deferred |
| Docker/hardware-variant deployment surfaces | `docs/roadmaps/CVF_MSEA_T0_MINERU_STRUCTURED_EXTRACTION_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` (deferred package lane) | owned; new file-level evidence, still deferred |
| Model-backed OCR/table/formula/layout/VLM quality claims | `docs/reviews/CVF_MSEA_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md` | owned; no-checker-now decision stands |
| Source mirror control-plane authority | `.private_reference/source_mirrors/INDEX.md` | owned; pinned and reconciled |

## Conditional Reopen Candidates

These two candidate sets are recorded here as the CVF-native owner-surface
delta this tranche adds. Neither is authorized for implementation by this
reference or by MSEA-R4. A future fresh GC-018 is required, and any behavior
claim requires live/provider proof.

| Candidate | Concrete reopen condition | Forbidden until reopened |
| --- | --- | --- |
| MinerU CLI/API runtime integration (`mineru/cli/*.py`) | An operator names a concrete downstream use case that requires MinerU document parsing, and a fresh GC-018 authorizes model download, execution, and live/provider proof for the specific backend needed. | install, model download, execution, API/router/Gradio/server startup, provider/live proof |
| MinerU Docker deployment recipes (`docker/`) | An operator names a concrete deployment target and hardware profile, and a fresh GC-018 authorizes Docker build/run and package-lane registration. | Docker build/run, package activation, registry mutation |

## Read-Depth Limitation

Per the paired worker return's Blind-Spot Control Block, `docs/` (146 files)
and the non-CLI `mineru/` subfolders (`backend`, `data`, `model`, `resources`,
`utils`; 215 files) were read at structural/top-level depth only, not
individually file-by-file. This is recorded as `NO_NEW_VALUE` (bulk `docs/`
restates already-owned MSEA-T2 doctrine) or `OUT_OF_SCOPE` (model/backend/
data/utils/resources internals require execution to evaluate, which this
tranche forbids). A future tranche that needs deeper `docs/` or
`mineru/model/` file-level detail should name the specific pain point or
subfolder rather than requesting a full re-read.

## Claim Boundary

This reference records a bounded file-level comparison delta only. It does
not authorize or claim MinerU runtime integration, parser execution, OCR
execution, VLM/hybrid backend routing, remote backend processing, model
download, API/router/Gradio service, Docker deployment, RAG indexing,
document truth verification, parser accuracy, table/formula correctness,
public-sync export, checker enforcement, package activation, certification,
generated aggregate mutation, production readiness, hosted readiness,
model-router behavior, action authority, or universal document intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this owner-surface delta is private provenance documentation over an
internal source-mirror comparison. No public-sync export is authorized.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Claude (no-commit worker) |
| Provider or surface | Claude Code CLI / VSCode extension |
| Session or invocation | dispatchBaseHead `4d6cd237`; executionBaseHead `514220ac` |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (source files, prior MSEA artifacts); Bash (find, git, grep) |
| Target paths | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` |
| Allowed scope source | MSEA-R4 work order and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker return |
| After status evidence | one new untracked file |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | no MinerU install/execution, model download, API/router/Gradio/Docker/RAG/checker/package/model-router/action-authority work |
| Claim boundary | owner-surface delta documentation only |
| Agent type | Claude |
| Invocation ID | `msea-r4-mineru-upstream-source-mirror-2026-07-02` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |

## Delta Execution Claim Boundary Control Block

| Field | Value |
| --- | --- |
| claimScope | MSEA-R4 owner-surface delta reference |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, or universal governed-coding-control claim is made by this reference. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed by this reference. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed by this reference. |
| invocationBoundary | Manual local documentation authoring only. |
| interceptionBoundary | No direct interception, wrapper/proxy enforcement, runtime gate, or agent coding control is authorized. |
| claimLanguage | Owner-surface delta documentation and candidate-classification only. |
| forbiddenExpansion | Do not expand into runtime/provider/live/public/package/Web/MCP/model-router/adapter/MinerU install/execution/model-download/RAG behavior without a fresh source-verified authorization. |
