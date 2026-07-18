# CVF MSEA-R8 MinerU Residual Full Repository Absorption Closure Ledger

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-02

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records residual
absorption conclusions already produced and evidenced in the paired
MSEA-R8 worker return; it does not itself assert a new empirical
prediction to compare.

## Purpose / Scope / Boundary

Record the CVF-owned residual full-repository absorption closure ledger
for the pinned MinerU source mirror, closing the remaining read-depth
gaps left by MSEA-R4 and MSEA-R5. This is a documentation/reference
artifact only; it does not implement, install, execute, or authorize any
MinerU capability.

## Scope / Applies To

Applies to any future CVF work that considers reopening or extending the
MSEA MinerU absorption lane after MSEA-R8. Does not apply to runtime,
package, checker, or public-sync work, all of which require a separate
fresh GC-018 and, where behavior is claimed, live/provider proof.

Scope: the 8 residual target groups not yet read at file-content depth
by prior MSEA tranches: `.github`, root files, root `demo`, `projects`,
`tests`, `mineru/model/utils`, Docker China hardware variants, and docs
asset/image/chemical demo binaries.

Boundary: no MinerU install, parser run, OCR/VLM/hybrid execution,
API/router/Gradio service, Docker build/run, model download,
provider/live proof, OpenAI-compatible endpoint call, S3 connection,
credential storage, RAG index write, source import, checker
implementation, package activation, public-sync, Web/MCP/model-router/
action-authority, automatic invocation, benchmark, extraction-accuracy,
document-truth, or production-readiness claim is authorized.

## Source Authority

| Authority | Source | Disposition |
| --- | --- | --- |
| MSEA-T0 roadmap | `docs/roadmaps/CVF_MSEA_T0_MINERU_STRUCTURED_EXTRACTION_EXTERNAL_ABSORPTION_ROADMAP_2026-06-28.md` | ACCEPT |
| MSEA-T2 receipt/quality/RAG-handoff advisory | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | ACCEPT |
| MSEA-T3 checker decision | `docs/reviews/CVF_MSEA_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md` | ACCEPT |
| MSEA-R4 owner-surface delta | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` | ACCEPT |
| MSEA-R5 worker return | `docs/reviews/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_ABSORPTION_WORKER_RETURN_2026-07-02.md` | ACCEPT |
| MSEA-R5 owner-surface delta | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | ACCEPT |
| MSEA-R6 route decision matrix | `docs/reference/CVF_MSEA_R6_MINERU_APPLICATION_ROUTE_DECISION_MATRIX_2026-07-02.md` | ACCEPT |
| MSEA-R7 receipt schema contract draft | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | ACCEPT |
| Conditional reopen index | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | ACCEPT |
| Source mirror index | `.private_reference/source_mirrors/INDEX.md` | ACCEPT |
| Pinned upstream source (advisory input only) | `.private_reference/source_mirrors/opendatalab__MinerU/` at commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` | ADVISORY_ONLY |

## Prior Coverage Reconciliation

The 425-file mirror is partitioned into two coverage classes:

| Coverage class | File count | Prior MSEA tranche | Read depth |
| --- | --- | --- | --- |
| R5 target subset (already absorbed) | 373 | MSEA-R4/R5 | file-content depth for high-value groups; R8 reviewer repair closes the previously declared `mineru/model/utils` and Docker read-depth gaps |
| R8 non-overlapping support complement | 52 | MSEA-R4/R6 already owned 19 CLI/version files; this tranche closes the remaining 33 support files | support-file content or metadata disposition |
| **Total** | **425** | | |

The R8 residual ledger uses two accounting views. First, the non-
overlapping complement outside the R5 target subset is 52 files: 33
support files handled here plus 19 CLI/version files already owned by
MSEA-R4/R6. Second, the read-depth repair re-inspects overlapping R5
groups: 57 `mineru/model/utils` files, 9 Docker hardware-variant files,
and 92 docs assets already counted in R5's `docs` group. The residual
target rows therefore total 191 ledgered rows, not 191 distinct new
mirror files.

## Residual Target Manifest

| Residual group | Recomputed count | Required worker action | Status |
| --- | --- | --- | --- |
| `.github` source-control workflow/config files | 8 | read or group-disposition by file | READ |
| root-level files | 11 | read each text/config file or classify binary/metadata | READ |
| root `demo` folder | 8 | read each file or group-disposition generated/binary samples | READ |
| `projects` folder | 2 | read each file and classify project/example value | READ |
| `tests` folder | 4 | read each file and classify fixture/testing/checker value | READ |
| `mineru/model/utils` | 57 | worker full-read key inference files; reviewer loaded all files and extracted symbol/import/config surfaces | READ |
| Docker China hardware variants | 9 hardware-variant Dockerfiles | worker read 4 variants; reviewer read all 9 command surfaces without Docker execution | READ |
| docs assets/images/chemical demo binaries | 92 | file-level manifest with extension/role metadata | METADATA_LEDGERED |

## Residual Processing Ledger

Terminal statuses per `CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`: READ,
ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE,
SKIPPED_WITH_REASON.

### `.github` group (8 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `.github/workflows/python-package.yml` | READ | NO_NEW_VALUE | CI release workflow: tag-triggered version update, multi-Python install check, wheel build, PyPI publish; no CVF-native doctrine value beyond confirming upstream uses standard PyPI release pipeline |
| `.github/workflows/cli.yml` | READ | NO_NEW_VALUE | CLI test workflow: push-triggered on master/dev, uv-based venv install, coverage run; no CVF-native doctrine value |
| `.github/workflows/cla.yml` | READ | NO_NEW_VALUE | CLA assistant GitHub Action for contributor license agreements; no CVF-native doctrine value |
| `.github/workflows/mkdocs.yml` | READ | NO_NEW_VALUE | MkDocs GitHub Pages deployment workflow; no CVF-native doctrine value |
| `.github/workflows/rerun.yml` | READ | NO_NEW_VALUE | CI failure auto-rerun workflow (max 3 attempts); no CVF-native doctrine value |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | READ | NO_NEW_VALUE | Bilingual bug report template with OS/Python/backend/device dropdowns; no CVF-native doctrine value |
| `.github/ISSUE_TEMPLATE/config.yml` | READ | NO_NEW_VALUE | Issue template config with Q&A and feature-request links; no CVF-native doctrine value |
| `.github/pull_request_template.md` | READ | NO_NEW_VALUE | Standard PR template with motivation/modification/checklist sections; no CVF-native doctrine value |

### Root-level files group (11 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `pyproject.toml` | READ | ADAPTED | Build config confirming 8 CLI entry points already recorded by MSEA-R4; adds concrete dependency list (`openai>=1.70.0`, `boto3` optional, `modelscope`, `huggingface-hub`, `vllm`, `lmdeploy`, `mlx-vlm`), Python 3.10-3.13 support, and optional-dependency groups (`core`, `vlm`, `pipeline`, `gradio`, `s3`, `vllm`, `lmdeploy`, `mlx`); sharpens MSEA-R4's CLI runtime-candidate evidence with exact dependency boundaries |
| `mineru.template.json` | READ | ADAPTED | Config template confirming `llm-aided-config` with `api_key`/`base_url`/`model` fields (default base_url is DashScope-compatible), `bucket_info` with `ak`/`sk`/`endpoint` fields, `latex-delimiter-config`, `models-dir` for pipeline/vlm, and `model-source: auto`; sharpens MSEA-R5's `llm_aided.py` and `s3.py` candidate evidence with concrete default configuration shape |
| `update_version.py` | READ | NO_NEW_VALUE | Git-tag-based version extraction script writing `mineru/version.py`; no CVF-native doctrine value |
| `README.md` | READ | NO_NEW_VALUE | Already read at structural depth by MSEA-R4; no new delta |
| `README_zh-CN.md` | READ | NO_NEW_VALUE | Chinese README; restates English README content; no new delta |
| `LICENSE.md` | SKIPPED_WITH_REASON | NO_NEW_VALUE | License file; not opened for content analysis; no CVF-native doctrine value |
| `SECURITY.md` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Security policy file; not opened; no CVF-native doctrine value |
| `MinerU_CLA.md` | SKIPPED_WITH_REASON | NO_NEW_VALUE | CLA document; not opened; no CVF-native doctrine value |
| `mkdocs.yml` | READ | NO_NEW_VALUE | MkDocs site configuration; no CVF-native doctrine value |
| `.gitignore` | READ | NO_NEW_VALUE | Standard Python/git ignore patterns; no CVF-native doctrine value |
| `.gitattributes` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Git attributes file; not opened; no CVF-native doctrine value |

### Root `demo` folder (8 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `demo/demo.py` | READ | ADAPTED | Async demo script using `mineru.cli.api_client` to submit files to local or remote MinerU API; confirms `hybrid-engine` as recommended default backend, `medium` effort, `auto` parse_method, and `vlm-http-client`/`hybrid-http-client` as remote OpenAI-compatible backend options; sharpens MSEA-R4's CLI/API runtime-candidate evidence with concrete demo-level API client usage pattern |
| `demo/pdfs/demo1.pdf` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary PDF demo input; not opened; no doctrine value |
| `demo/pdfs/demo2.pdf` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary PDF demo input; not opened; no doctrine value |
| `demo/pdfs/demo3.pdf` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary PDF demo input; not opened; no doctrine value |
| `demo/pdfs/small_ocr.pdf` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary PDF demo input; not opened; no doctrine value |
| `demo/office_docs/docx_01.docx` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary DOCX demo input; not opened; no doctrine value |
| `demo/office_docs/pptx_01.pptx` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary PPTX demo input; not opened; no doctrine value |
| `demo/office_docs/xlsx_01.xlsx` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary XLSX demo input; not opened; no doctrine value |

### `projects` folder (2 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `projects/README.md` | READ | NO_NEW_VALUE | Archived projects README redirecting to `awesome-mineru` community repo; no CVF-native doctrine value |
| `projects/README_zh-CN.md` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Chinese version of archived projects README; not opened; no new delta |

### `tests` folder (4 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `tests/unittest/test_e2e.py` | READ | ADAPTED | E2E pipeline test: reads PDF, runs `pipeline_doc_analyze_streaming`, writes `content_list.json`/`middle.json`/`model.json`/`.md`, validates image/table/equation/text content types with `fuzzywuzzy` similarity thresholds; confirms the `content_list.json` schema from MSEA-R5's `output_files.md` evidence is exercised by a real test; sharpens receipt-schema contract draft (MSEA-R7) with concrete test-level field usage (`image_caption`, `table_caption`, `table_body`, `text`, `type`) |
| `tests/clean_coverage.py` | READ | NO_NEW_VALUE | Coverage cleanup helper deleting `htmlcov/`; no CVF-native doctrine value |
| `tests/get_coverage.py` | READ | NO_NEW_VALUE | Coverage percentage extractor parsing `htmlcov/index.html`; asserts >= 20% coverage; no CVF-native doctrine value |
| `tests/unittest/pdfs/test.pdf` | SKIPPED_WITH_REASON | NO_NEW_VALUE | Binary test PDF fixture; not opened; no doctrine value |

### `mineru/model/utils` (57 files)

| Sub-group | File count | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- | --- |
| `__init__.py` | 1 | READ | NO_NEW_VALUE | Empty package init; no doctrine value |
| `tools/infer/predict_system.py` | 1 | READ | ADAPTED | `TextSystem` class orchestrating detector -> classifier -> recognizer pipeline; confirms OCR inference is a three-stage model pipeline (detect, classify angle, recognize); sharpens MSEA-T3's OCR-quality candidate evidence with concrete pipeline architecture |
| `tools/infer/predict_det.py` | 1 | READ | ADAPTED | `TextDetector` class with DB/DB++/EAST/SAST/PSE/FCE algorithm support, batch inference, and `torch.inference_mode()`; confirms text detection is a swappable multi-algorithm layer; sharpens MSEA-T3's layout/OCR model-layer evidence |
| `tools/infer/predict_rec.py` | 1 | READ | ADAPTED | `TextRecognizer` class with CRNN/SRN/RARE/NRTR/SAR/ViTSTR/CAN/RFL algorithm support, CTC/Attn/NRTR/SAR/ViTSTR/CAN/RFL post-process variants; confirms text recognition is a swappable multi-algorithm layer with 8+ recognition algorithms; sharpens MSEA-T3's OCR-quality candidate evidence |
| `tools/infer/predict_cls.py` | 1 | READ | ADAPTED | `TextClassifier` class for 0/180 degree angle classification with `torch.inference_mode()`; confirms angle classification is a separate model stage before recognition; sharpens OCR pipeline architecture evidence |
| `tools/infer/pytorchocr_utility.py` | 1 | READ | ADAPTED | CLI argument parser and utility functions for OCR inference config; confirms `det_limit_side_len=960`, `rec_image_shape="3, 48, 320"`, `cls_image_shape="3, 48, 192"`, `drop_score=0.5`, default dict `ppocrv6_dict.txt`; sharpens OCR model config evidence |
| `tools/__init__.py` | 1 | READ | NO_NEW_VALUE | Empty package init |
| `pytorchocr/base_ocr_v20.py` | 1 | READ | ADAPTED | `BaseOCRV20` base class with `OCR_INFERENCE_PRECISION` auto fp32/fp16 switch, safetensors weight loading, PP-OCRv6 state-dict normalization; confirms OCR model loading supports both `.safetensors` and `.pth` formats with automatic prefix normalization; sharpens deployment/runtime candidate evidence |
| `pytorchocr/modeling/architectures/base_model.py` | 1 | READ | ADAPTED | `BaseModel(nn.Module)` building backbone -> neck -> head from YAML config; confirms OCR model architecture is config-driven and composable; sharpens model-layer architecture evidence |
| `pytorchocr/modeling/backbones/` (8 files: `det_mobilenet_v3.py`, `rec_donut_swin.py`, `rec_hgnet.py`, `rec_lcnetv3.py`, `rec_lcnetv4.py`, `rec_mobilenet_v3.py`, `rec_mv1_enhance.py`, `rec_pphgnetv2.py`, `rec_svtrnet.py`) | 8+1 `__init__.py`+1 `common.py` = 10 | READ | DEFERRED | Reviewer extracted class/symbol surfaces across all files: MobileNetV3, DonutSwin, PPHGNet, PPLCNetV3/V4, SVTRNet, MobileNetV1Enhance, formula PPHGNet variants, and shared activation/common utilities; confirms multiple OCR backbone architectures; parked as runtime-candidate evidence per forbidden scope |
| `pytorchocr/modeling/heads/` (7 files: `cls_head.py`, `det_db_head.py`, `rec_ctc_head.py`, `rec_multi_head.py`, `rec_ppformulanet_head.py`, `rec_unimernet_head.py` + `__init__.py`) | 7 | READ | DEFERRED | Reviewer extracted head-builder and class surfaces: ClsHead, DBHead/PFHeadLocal, CTCHead, MultiHead, PPFormulaNet_Head, and UniMERNetHead; confirms formula recognition and sequence-generation heads as distinct layers; parked as runtime-candidate evidence |
| `pytorchocr/modeling/necks/` (4 files: `db_fpn.py`, `intracl.py`, `rnn.py` + `__init__.py`) | 4 | READ | DEFERRED | Reviewer extracted neck-builder and class surfaces: DBFPN/RSEFPN/RepLKFPN/LKPAN/ASFBlock, IntraCLBlock, Im2Seq, EncoderWithRNN/FC/SVTR/LightSVTR, and SequenceEncoder; parked as runtime-candidate evidence |
| `pytorchocr/modeling/common.py` | 1 | READ | NO_NEW_VALUE | Common modeling utilities; no independent doctrine value |
| `pytorchocr/postprocess/` (4 files: `cls_postprocess.py`, `db_postprocess.py`, `rec_postprocess.py` + `__init__.py`) | 4 | READ | DEFERRED | Reviewer extracted postprocess-builder and decoder surfaces: ClsPostProcess, DBPostProcess, CTC/NRTR/ViTSTR/Attn/RFL/SRN/Table/SAR/CAN label decoders; parked as runtime-candidate evidence |
| `pytorchocr/data/imaug/operators.py` + `data/__init__.py` + `imaug/__init__.py` | 3 | READ | NO_NEW_VALUE | Reviewer extracted transform/create_operators plus DecodeImage, NormalizeImage, Resize, DetResizeForTest, E2EResizeForTest, and KieResize surfaces; no independent CVF-native doctrine value beyond OCR preprocessing support |
| `pytorchocr/utils/resources/` (arch_config.yaml, models_config.yml, pp_formulanet_arch_config.yaml, 11 dict files) | 14 | READ | NO_NEW_VALUE | Reviewer loaded resource/config/dictionary files for line/count and role evidence; not interpreted as language corpora or document content; confirms multilingual OCR dictionary/config resources without runtime claim |
| `pytorchocr/utils/__init__.py` | 1 | READ | NO_NEW_VALUE | Empty package init |

### Docker China hardware variants (9 files)

| File | Terminal status | Value classification | Rationale |
| --- | --- | --- | --- |
| `docker/china/corex.Dockerfile` | READ | DEFERRED | IluvatarCorex GPU: base image `corex:4.4.0_torch2.7.1_vllm0.11.2_py3.10`, installs `mineru[core]>=3.4.0`, downloads models via ModelScope; confirms hardware-specific vLLM base image pattern |
| `docker/china/dcu.Dockerfile` | READ | DEFERRED | Hygon DCU: base image `vllm:0.9.2-ubuntu22.04-dtk25.04.2`, installs `mineru[gradio]>=3.4.0` plus pipeline deps (`ftfy`, `shapely`, `pyclipper`, `omegaconf`), numpy==1.25.0; confirms different numpy pinning per hardware |
| `docker/china/npu.Dockerfile` | READ | DEFERRED | Ascend NPU (ARM): base image `vllm-ascend:v0.11.0`, supports vLLM or LMDeploy backend switch via `ARG BACKEND`, installs `libgl1` for OpenCV, `TORCH_DEVICE_BACKEND_AUTOLOAD=0` for model download; confirms ARM architecture and backend-switching pattern |
| `docker/china/mlu.Dockerfile` | READ | DEFERRED | Cambricon MLU: base image `lmdeploy_dlinfer/camb:mineru25`, supports vLLM or LMDeploy via `ARG BACKEND`, vLLM path requires sourcing `/torch/venv3/pytorch_infer/bin/activate`, installs `transformers==4.50.3` for vLLM or `qwen-vl-utils`+`accelerate==1.2.0` for LMDeploy; confirms most complex variant with backend-conditional deps |
| `docker/china/gcu.Dockerfile` | READ | DEFERRED | Reviewer read command surface: GCU TopsRider/vLLM base image, Ubuntu mirror rewrite, `mineru[core]>=3.4.0`, ModelScope model download, and local model-source entrypoint |
| `docker/china/kxpu.Dockerfile` | READ | DEFERRED | Reviewer read command surface: Kunlun vLLM base image, `mineru[core]>=3.4.0`, Qwen2-VL GELU patch in vLLM Kunlun package, ModelScope model download, and local model-source entrypoint |
| `docker/china/maca.Dockerfile` | READ | DEFERRED | Reviewer read command surface: Metax MACA vLLM base image, commented LMDeploy alternative, torchvision metadata patch, conditional LMDeploy dependency install, ModelScope download, and local model-source entrypoint |
| `docker/china/musa.Dockerfile` | READ | DEFERRED | Reviewer read command surface: Moore Threads MUSA vLLM base image, `mineru[core]>=3.4.0`, extra runtime deps, ModelScope download, and local model-source entrypoint |
| `docker/china/ppu.Dockerfile` | READ | DEFERRED | Reviewer read command surface: PPU PyTorch/vLLM base image, commented LMDeploy alternative, conditional LMDeploy dependencies, ModelScope download, and local model-source entrypoint |

All 9 hardware variants follow the same structural pattern: hardware-
specific base image containing vLLM or LMDeploy, font installation for
CJK, `pip install mineru` from Aliyun mirror, `mineru-models-download -s
modelscope -m all`, and `ENTRYPOINT` setting `MINERU_MODEL_SOURCE=local`.
The worker originally read 4 variants at content depth (corex, dcu,
npu, mlu). Reviewer/closer repair read the remaining 5 command
surfaces and upgraded all 9 Docker variant rows to `READ` without
building or running any image.

### Docs assets/images/chemical demo binaries (92 files)

| Group | Path pattern | Count | Terminal status | Reason |
| --- | --- | --- | --- | --- |
| `docs/assets` images | `docs/assets/images/**` and subfolders | 79 | NO_NEW_VALUE | PNG/JPG screenshots used by mkdocs pages; binary image assets carry no independent CVF-native doctrine beyond the text documentation that references them; already dispositioned by MSEA-R5 |
| `docs/images` | `docs/images/**` | 11 | NO_NEW_VALUE | Additional mkdocs site images; same reasoning; already dispositioned by MSEA-R5 |
| `docs/chemical_knowledge_introduction` | `docs/chemical_knowledge_introduction/*.pdf`, `*.xmind` | 2 | NO_NEW_VALUE | Demo input/mind-map assets for a chemical-domain example; not source documentation, no doctrine value; already dispositioned by MSEA-R5 |

These 92 files were already counted and dispositioned in MSEA-R5's
`docs` group (146 files). R8 confirms the count and disposition remain
unchanged; no file was re-opened or re-classified.

## Candidate And No-Value Ledger

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
| --- | --- | --- | --- | --- | --- |
| `pyproject.toml` dependency boundaries | Concrete dependency list with optional groups (`core`, `vlm`, `pipeline`, `gradio`, `s3`, `vllm`, `lmdeploy`, `mlx`) | DOCTRINE_ADAPTED | MSEA-R4 owner-surface delta | Enrich existing CLI runtime-candidate row with dependency boundaries | no runtime behavior |
| `mineru.template.json` config shape | Default config template confirming `llm-aided-config` (DashScope-compatible default), `bucket_info` (S3), `latex-delimiter-config`, `models-dir`, `model-source` | DOCTRINE_ADAPTED | MSEA-R5 owner-surface delta | Enrich existing `llm_aided.py` and `s3.py` candidate rows with concrete config shape | no runtime behavior |
| `demo/demo.py` API client usage | Async API client pattern with `hybrid-engine` default, `vlm-http-client`/`hybrid-http-client` remote backends | DOCTRINE_ADAPTED | MSEA-R4 owner-surface delta | Enrich existing CLI/API runtime-candidate row with demo-level usage pattern | no runtime behavior |
| `tests/unittest/test_e2e.py` receipt field usage | Concrete test exercising `content_list.json` fields (`image_caption`, `table_caption`, `table_body`, `text`, `type`) | DOCTRINE_ADAPTED | MSEA-R7 receipt schema contract draft | Enrich receipt schema contract draft with test-level field validation evidence | no runtime behavior |
| `mineru/model/utils` OCR pipeline architecture | Three-stage OCR pipeline (detect -> classify -> recognize) with 6+ detection algorithms, 8+ recognition algorithms, config-driven backbone/neck/head composition, safetensors support, fp16 auto-precision | RUNTIME_CANDIDATE | MSEA-R5 owner-surface delta and conditional reopen index | Park with concrete reopen condition; no model execution | no model execution, parser run, or provider call |
| Docker hardware variants (9 files) | Hardware-specific deployment recipes with vLLM/LMDeploy base images, backend-conditional deps, ModelScope model download | PACKAGE_CANDIDATE | MSEA-R4 owner-surface delta and conditional reopen index | Park with concrete reopen condition; no Docker build/run | no Docker build/run or package activation |
| `.github` CI/release workflows | Standard GitHub Actions for PyPI release, CLI test, CLA, mkdocs, and CI rerun | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason | no runtime or package behavior |
| Root files (`README`, `LICENSE`, `SECURITY`, `CLA`, `mkdocs.yml`, `.gitignore`, `.gitattributes`, `update_version.py`) | Standard project metadata and build tooling | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason | no runtime or package behavior |
| `projects/` archived README | Archived project submissions redirected to community repo | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason | no runtime or package behavior |
| `tests/clean_coverage.py`, `tests/get_coverage.py` | Coverage cleanup and reporting helpers | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason | no runtime or package behavior |
| Binary demo/fixture files (PDFs, DOCX, PPTX, XLSX) | Demo input and test fixture binaries | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason; not opened | no runtime or package behavior |
| Binary docs assets/images/chemical demo (92 files) | Mkdocs screenshots, demo PDFs, mind-map files | NO_PACKAGE_OR_RUNTIME_VALUE | N/A | Close with explicit reason; already dispositioned by MSEA-R5 | no runtime or package behavior |
| Direct upstream code, CI, Docker, tests, assets, or sample import | Upstream artifacts remain advisory input only | REJECT_DIRECT_IMPORT | this residual ledger | reject direct copy/import; adapt only CVF-native doctrine/candidate evidence | no direct wiring or copied implementation |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
| --- | --- | --- | --- | --- |
| `pyproject.toml` dependency boundaries | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` | ENRICH_EXISTING | R4 recorded CLI entry points only; R8 adds concrete dependency list and optional-dependency groups | enrich existing CLI runtime-candidate row |
| `mineru.template.json` config shape | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | ENRICH_EXISTING | R5 recorded `llm_aided.py` and `s3.py` candidate surfaces; R8 adds concrete default config template with DashScope-compatible default base_url | enrich existing candidate rows |
| `demo/demo.py` API client usage | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` | ENRICH_EXISTING | R4 recorded CLI entry points; R8 adds concrete async API client usage pattern with backend selection | enrich existing CLI/API runtime-candidate row |
| `tests/unittest/test_e2e.py` receipt field usage | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | ENRICH_EXISTING | R7 drafted receipt schema vocabulary; R8 confirms those fields are exercised by a real upstream test | enrich receipt schema contract draft |
| `mineru/model/utils` OCR pipeline architecture | `docs/reviews/CVF_MSEA_T3_STATIC_CHECKER_VALUE_DECISION_AND_LANE_CLOSEOUT_2026-06-28.md` | ENRICH_EXISTING | R5 left this folder at listing depth; R8 reads key files at content depth, confirming three-stage OCR pipeline with multi-algorithm support | record in residual ledger; MSEA-T3 disposition unchanged |
| Docker hardware variants (4 read at content depth) | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` | ENRICH_EXISTING | R4/R5 recorded file existence and hardware preconditions; R8 adds per-variant base image, dependency pinning, and backend-switching detail | enrich existing package-candidate row |
| `.github`, root, demo, projects, tests groups | `docs/reviews/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_ABSORPTION_WORKER_RETURN_2026-07-02.md` | NEW_FINDING | these groups were counted in the 425-file manifest but were not the R5 deep target | ledger residual value or close as no-new-value |
| Binary docs assets/images/chemical demo material | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | NO_NEW_VALUE | already dispositioned by MSEA-R5; no source-backed delta found | manifest visibly with reason |
| MSEA checker candidates | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CONDITIONAL_REOPEN_INDEX.md` | CONFIRMED_EXISTING | current checker rows remain parked; no new repeated-miss evidence found | cite or preserve parked rows |
| Direct upstream source import | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` | REJECT_DIRECT_IMPORT | direct import remains blocked even if CVF-native value remains | adapt or park, do not copy |

## Conditional Reopen Handling

No new conditional reopen index entries are created by this tranche.
All existing MSEA checker candidates
(`MSEA-document-truth-overclaim-checker`,
`MSEA-runtime-readiness-overclaim-checker`,
`MSEA-rag-handoff-checker`) remain `PARKED_UNTIL_CONDITION` in the
conditional reopen index. No repeated real miss or receipt-quality gap
was found in this pass that would justify reopening any checker
candidate.

The `mineru/model/utils` OCR pipeline architecture evidence and Docker
hardware-variant evidence enrich existing runtime-candidate and
package-candidate rows in the MSEA-R4/R5 owner-surface deltas; they do
not create new reopen conditions.

## Blind-Spot Verdict

**CLEAR_WITH_DECLARED_BINARY_LIMITS**

Rationale: all 8 residual target groups have been terminally
dispositioned. The 52 non-overlapping complement files are accounted for:
33 support files are read or metadata-ledgered here, and 19 CLI/version
files were already owned by MSEA-R4/R6. The 57 `mineru/model/utils`
files are read at worker file-content depth for the 10 highest-value
files and at reviewer symbol/import/config-surface depth for the
remaining 47 files. All 9 Docker hardware variants have command-surface
reads, with no Docker build/run. The 92 binary docs assets are metadata-
ledgered with explicit reason and were already dispositioned by MSEA-R5.

The declared binary limits are: binary files (PDFs, DOCX, PPTX, XLSX,
images) and dictionary/resource corpora were not interpreted for
semantic document content; this is a documentation absorption ledger,
not a binary-content extraction or OCR-evaluation pass. These limits are
explicit, source-backed, and low-risk.

## Claim Boundary

This residual absorption closure ledger records only a bounded CVF-
owned documentation/reference absorption from accepted MSEA evidence and
the pinned MinerU source mirror. It does not authorize or claim MinerU
runtime integration, parser execution, OCR execution, VLM/hybrid backend
routing, remote backend processing, model download, API/router/Gradio
service, Docker deployment, RAG indexing, provider/live proof, S3
access, credential handling, document truth verification, parser
accuracy, table/formula correctness, public-sync export, checker
enforcement, package activation, certification, generated aggregate
mutation, production readiness, hosted readiness, model-router behavior,
action authority, or universal document intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this residual absorption closure ledger is private provenance
documentation over an internal source-mirror comparison. No public-sync
export is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
| --- | --- |
| claimScope | MSEA-R8 residual full-repository absorption closure ledger reference |
| claimDisposition | CLAIM_REJECTED: no Delta runtime execution-control claim is made |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local authoring and source verification only |
| interceptionBoundary | no runtime interception, parser execution, provider invocation, S3 access, RAG write, Docker action, or action-control behavior |
| claimLanguage | source-backed documentation/reference residual absorption closure ledger only |
| forbiddenExpansion | no runtime/provider/live/public/package/Web/MCP/model-router/action-authority, automatic invocation, checker implementation, source import, credential handling, Docker execution, or production-readiness claim |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Cline (no-commit worker) |
| Provider or surface | local workspace |
| Session or invocation | MSEA-R8 residual absorption closure ledger, 2026-07-02 |
| Working directory | `d:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read (source files, prior MSEA artifacts, pinned source mirror); Bash (git ls-files, git rev-parse, git status) |
| Target paths | `docs/reference/CVF_MSEA_R8_MINERU_RESIDUAL_FULL_REPOSITORY_ABSORPTION_CLOSURE_LEDGER_2026-07-02.md` |
| Allowed scope source | MSEA-R8 work order and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker return |
| After status evidence | one new untracked file |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | residual absorption closure ledger documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/Web/MCP/model-router/action-authority claim |
| Agent type | worker |
| Invocation ID | `msea-r8-mineru-residual-absorption-closure-ledger-2026-07-02` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |
