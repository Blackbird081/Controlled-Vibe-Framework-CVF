# CVF MSEA-R22-T1 MinerU Package Install Activation And ModelScope Pipeline Cache Preparation Readiness Matrix

Memory class: governed reference

docType: reference

Status: ACTIVE_REFERENCE

Date: 2026-07-03

selectedRouteToken: HOLD_PENDING_MODELSCOPE_DOWNLOAD_DIAGNOSTIC

packageInstallDisposition: PACKAGE_INSTALL_SUCCEEDED_LOCAL_IGNORED_VENV

activationCommandStatus: VENV_LOCAL_COMMAND_PRESENT

modelCachePrepDisposition: TIMEOUT_PARTIAL_DOWNLOAD_DIAGNOSTIC_RECORDED

configWritebackReceipt: CONFIG_NOT_WRITTEN_AFTER_TIMEOUT

runtimeSmokeGateDisposition: BLOCKED_UNTIL_CACHE_PREP_COMPLETES_UNDER_FRESH_OR_RESUMED_AUTHORITY

## Purpose

Record the R22 readiness decision after local MinerU package activation and the single authorized ModelScope pipeline cache-prep attempt. The matrix separates package activation success from model-cache readiness, which remains unproven because the download timed out before config writeback.

## Target / Source

Target surface: MSEA-R22-T1 reviewer/dispatcher decision support.

Source authority: the R22 baseline and work order, accepted R21 package blocker, active session continuity, pinned MinerU source mirror, local venv metadata, install log, cache-prep log, and secret-safe cache/config metadata.

## Scope / Applies To

Applies to the immediate post-R22 decision on whether CVF can proceed toward a future MinerU local pipeline runtime smoke work order. It does not apply to parser smoke execution, OCR/VLM selection, Docker or service deployment, public-sync, production readiness, workflow-chain completion, extraction accuracy, document-truth, current-law correctness, or legal use-case quality.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| MinerU source mirror remains the current upstream authority. | `.private_reference/source_mirrors/INDEX.md` | line 35 | `opendatalab__MinerU` | source mirror index | ACCEPT |
| MinerU project requires Python 3.10 through below 3.14. | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | line 12 | `requires-python` | project metadata | ACCEPT |
| MinerU project exposes pipeline optional dependencies. | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | lines 93-110 | `pipeline` | project optional dependencies | ACCEPT |
| MinerU exposes model download through a console script. | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | line 133 | `mineru-models-download` | project scripts | ACCEPT |
| MinerU supports ModelScope as an explicit model-source environment value. | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | lines 12-20 | `MINERU_MODEL_SOURCE` | model-source usage documentation | ACCEPT |
| MinerU completed downloads write model path and model source to config. | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | lines 37-49 | `mineru-models-download` | model-source usage documentation | ACCEPT |
| MinerU download CLI supports source and model type options. | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/models_download.py` | lines 96-114 | `download_models` | model download CLI | ACCEPT |
| MinerU config path uses the `MINERU_TOOLS_CONFIG_JSON` override. | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py` | lines 23-25 | `get_tools_config_file_path` | config path helper | ACCEPT |
| Local ignored runtime path covers the R22 venv/log/config side effects. | `.gitignore` | lines 49-51 | `.cvf/runtime/` | repository ignore policy | ACCEPT |
| Local R22 package install succeeded. | local install log and venv package metadata | R22 worker command evidence | `mineru 3.4.0` | local venv metadata | ACCEPT |
| Local R22 cache prep did not complete. | local cache-prep log and config metadata | R22 worker command evidence | `model.safetensors.incomplete`; absent R22 config | local cache metadata | ACCEPT |

## Local Runtime Readiness Matrix

| Dimension | Evidence | Readiness effect |
|---|---|---|
| package install | `mineru 3.4.0` installed in `.cvf/runtime/msea-r22-mineru-venv` from the pinned mirror | READY_LOCAL_ONLY |
| command activation | `mineru-models-download.exe` exists in the R22 venv scripts directory | READY_LOCAL_ONLY |
| model source | process-local `MINERU_MODEL_SOURCE=modelscope` used for the single command | SELECTED_FOR_TEST |
| config redirection | process-local `MINERU_TOOLS_CONFIG_JSON` pointed to `.cvf/runtime/msea-r22-mineru.json` | SET_FOR_ATTEMPT |
| config writeback | R22 config file absent after timeout | NOT_READY |
| cache contents | user ModelScope cache contains an incomplete model file and small companion files | PARTIAL_NOT_READY |
| parser runtime | not executed and not authorized | HELD |

## Route Decision Matrix

| Route token | Condition | Current evidence | Decision |
|---|---|---|---|
| OPEN_MSEA_R23_LOCAL_PIPELINE_RUNTIME_SMOKE_WORK_ORDER | package install, command activation, ModelScope pipeline cache prep, and config writeback all complete. | Not satisfied; cache command timed out and config file is absent. | HOLD |
| HOLD_PENDING_PACKAGE_INSTALL_DIAGNOSTIC | venv or package install failed. | Not satisfied; package install succeeded. | HOLD |
| HOLD_PENDING_MODELSCOPE_DOWNLOAD_DIAGNOSTIC | package activation succeeded but the one allowed cache-prep command failed, timed out, or produced incomplete cache evidence. | Satisfied; timeout, read-timeout retry warning, incomplete model file, and absent config. | SELECTED |
| HOLD_PENDING_CONFIG_WRITEBACK_REVIEW | download appears successful but config/cache receipt is ambiguous. | Not satisfied; download did not appear successful. | HOLD |
| HOLD_ALL_MINERU_RUNTIME_LANES | operator or environment blocks further package/cache work. | Available reviewer/operator option after diagnostic. | HOLD_OPTION |

## ModelScope Cache Preparation Posture

| Dimension | Posture | Evidence |
|---|---|---|
| model source | modelscope selected for test-first route | operator selection after R20 and R21/R22 work orders |
| model type | pipeline only | R22 allowed command sequence |
| package lifecycle | local ignored activation succeeded | venv package metadata |
| cache prep | partial and timed out | cache-prep log |
| config writeback | no receipt | R22 config file absent |
| runtime smoke | blocked | fresh runtime smoke work order remains required after cache readiness |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | Operator authorized local private MinerU package/cache prerequisite testing after R21 held on package installation. |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | this readiness matrix |
| Disposition | ROUTED_TO_GOVERNED_REFERENCE_WITH_LOCAL_RUNTIME_DIAGNOSTIC |
| Claim boundary | Decision support only; no parser runtime, extraction output, public-sync, or production claim. |

## External Absorption Core

External absorption core: REQUIRED

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `.private_reference/source_mirrors/opendatalab__MinerU` |
| Enumeration command | N/A with reason: R22 reuses the pinned source mirror and does not claim a new full mirror enumeration. |
| Manifest artifact or inline manifest | inline manifest in source verification and route matrix tables |
| Processing ledger artifact or inline ledger | inline ledger in local runtime readiness and route decision tables |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | `docs/reviews/CVF_MSEA_R22_T1_MINERU_PACKAGE_INSTALL_ACTIVATION_AND_MODELSCOPE_PIPELINE_CACHE_PREPARATION_WORKER_RETURN_2026-07-03.md` owns command evidence; `docs/reference/CVF_MSEA_R22_T1_MINERU_PACKAGE_INSTALL_ACTIVATION_AND_MODELSCOPE_PIPELINE_CACHE_PREPARATION_READINESS_MATRIX_2026-07-03.md` owns route decision support |
| Unresolved items | ModelScope pipeline download did not complete and config was not written. |
| Completion claim boundary | route decision only; no source import, parser runtime, extraction output, public-sync, or production claim |

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MinerU package metadata | Local editable install exposes package command in the R22 venv. | PACKAGE_CANDIDATE | R22 readiness decision | accept local package activation as bounded evidence | no distribution claim |
| MinerU model-source docs | ModelScope is a documented source. | DOCTRINE_ADAPTED | this matrix | keep selected source as modelscope | no parser claim |
| MinerU download CLI | Pipeline model download is the next runtime prerequisite, but it timed out. | RUNTIME_CANDIDATE | possible resumed cache-prep packet | require diagnostic-aware authorization before retry or resume | parser blocked |
| Checker source read-ahead | Matrix must carry route, corpus, value, trace, and Delta evidence. | CHECKER_CANDIDATE | this matrix | keep output shape literal-safe | no checker implementation |
| Direct source import | Not required for package activation evidence. | REJECT_DIRECT_IMPORT | governance boundary | keep source mirror as reference input only | source import blocked |
| Candidate Group A documents | No document body needed for package/cache preparation. | NO_PACKAGE_OR_RUNTIME_VALUE | privacy boundary | keep documents private | no document processing |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| R21 package-install blocker | `docs/reviews/CVF_MSEA_R21_T1_MINERU_MODELSCOPE_TEST_CACHE_PREPARATION_AND_RUNTIME_SMOKE_GATE_WORKER_RETURN_2026-07-03.md`; `docs/reference/CVF_MSEA_R21_T1_MINERU_MODELSCOPE_TEST_CACHE_PREPARATION_AND_RUNTIME_SMOKE_GATE_READINESS_MATRIX_2026-07-03.md` | ENRICH_EXISTING | R22 resolves local package activation in ignored venv. | record readiness improvement |
| ModelScope cache-prep route | `docs/reference/CVF_MSEA_R20_T1_MINERU_MODEL_CACHE_LOCAL_SOURCE_AND_TEARDOWN_PREP_READINESS_MATRIX_2026-07-03.md`; `docs/reference/CVF_MSEA_R21_T1_MINERU_MODELSCOPE_TEST_CACHE_PREPARATION_AND_RUNTIME_SMOKE_GATE_READINESS_MATRIX_2026-07-03.md` | ENRICH_EXISTING | R22 adds timeout evidence and partial-cache diagnostic. | hold runtime smoke |
| MinerU source mirror facts | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R22_T1_MINERU_PACKAGE_INSTALL_ACTIVATION_AND_MODELSCOPE_PIPELINE_CACHE_PREPARATION_2026-07-03.md` | CONFIRMED_EXISTING | Current source facts remain in pinned source mirror. | no new owner |
| Parser/runtime smoke | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R22_T1_MINERU_PACKAGE_INSTALL_ACTIVATION_AND_MODELSCOPE_PIPELINE_CACHE_PREPARATION_2026-07-03.md` | REJECT_DIRECT_IMPORT | Not opened by package activation alone. | defer |
| Private sample documents | `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md` | NO_NEW_VALUE | No document body content used. | preserve private boundary |

## Rescan Intelligence Hardening

- Original source artifact: R22 baseline and work order.

- Predecessor intake artifact: MSEA-R21-T1 readiness matrix.

- Delta ledger status: COMPLETE_WITH_DECLARED_LIMITS

- Routing matrix status: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

- Semantic sampling status: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Delta category | Source claim | R22 check | Disposition |
|---|---|---|---|
| UNCHANGED_FROM_INTAKE | ModelScope remains the selected test route. | R22 used ModelScope for the one cache-prep command. | retained |
| CHANGED_DISPOSITION | R21 held on package activation. | R22 installed MinerU locally and activated the command. | changed to download diagnostic |
| NEW_FINDING | ModelScope transfer was too slow and timed out. | Cache log and partial file show incomplete download. | blocker |
| REMOVED_OR_REJECTED | Runtime smoke can follow immediately. | Config writeback is absent. | rejected for this tranche |

### Follow-Up Routing Matrix

| Routing lane | Candidate | Disposition |
|---|---|---|
| DO_NOW | reviewer accepts R22 diagnostic evidence | allowed |
| SEPARATE_RUNTIME_TRANCHE | parser smoke after full cache/config readiness | held |
| STRATEGIC_OPERATOR_DECISION | resume or retry ModelScope cache prep | open |
| OUT_OF_SCOPE | public-sync, legal advice quality, production chain | rejected |
| RESOLVED_BY_DESIGN | no document body read in package/cache prep | resolved |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
|---|---|---|---|---|---|
| R22-S1 | R22 route matrix | package activation can unblock the R21 install blocker | package installed | Could this open runtime smoke? | NO; cache/config still incomplete |
| R22-S2 | MinerU config docs | completed download writes config | no config receipt | Could partial cache files count? | NO; incomplete file and absent config block readiness |
| R22-S3 | privacy boundary | package/cache prep does not need private document body | preserved | Could the legal test use case be invoked now? | NO; no parser or document read authorized |

## Corpus Completeness And Report Integrity

- Corpus task class: READINESS_MATRIX_ONLY

- Corpus root: N/A with reason: no corpus processing or source-document inventory is claimed.

- Snapshot time: 2026-07-03T13:50:00Z

- Enumeration command: `rg --files --hidden --no-ignore` not run because this matrix does not claim corpus coverage.

- Manifest artifact or inline manifest: inline route matrix only.

- Manifest hash: N/A with reason: no corpus manifest generated.

- Processing ledger artifact or inline ledger: inline ledger in route decision and local runtime readiness tables.

- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE

- Reconciliation: manifest=route decision matrix; ledger_terminal=COMPLETE_WITH_DECLARED_LIMITS; exclusions=all document-body and runtime processing; unresolved=0

- Unresolved files: 0

- Declared exclusions: Candidate Group A document bodies, parser/OCR/VLM/API/service execution, public-sync, extraction outputs, production workflow-chain claims, and legal-quality claims.

- Unreadable or unsupported files: none encountered within allowed governed scope.

- Aggregation check: no aggregate corpus count claimed.

- Drift check: no source mirror refresh performed.

- Output traceability: matrix traces to R22 worker return, local install metadata, cache-prep log, and source verification rows.

- Adversarial verification: tested whether package activation or partial cache can substitute for completed config/cache receipt; it cannot.

- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Epistemic Process Block

### Expected Result

The readiness matrix should open a runtime smoke route only if package activation, cache preparation, and config writeback all complete.

### Evidence Comparison

| Evidence class | Evidence | Result |
|---|---|---|
| Source-positive | MinerU has a documented ModelScope/pipeline download route and config writeback after completion. | route is valid in source |
| Local-positive | Package install and command activation succeeded in the R22 venv. | install blocker resolved |
| Local-negative | Download timed out, config absent, cache contains incomplete file. | cache readiness blocked |
| Authority-negative | Parser/document/runtime work is forbidden in R22. | no runtime smoke route now |

### Contradiction Or Gap Disposition

There is no source contradiction. The current gap is incomplete ModelScope pipeline cache preparation under local network/time constraints.

### Claim Update

The matrix selects `HOLD_PENDING_MODELSCOPE_DOWNLOAD_DIAGNOSTIC` and keeps runtime smoke held.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex acting as delegated worker |
| Provider or surface | Local PowerShell, git, Python, pip, ModelScope package download command, apply_patch |
| Session or invocation | MSEA-R22-T1 companion matrix, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | source reads; checker reads; local venv/package/cache metadata checks; artifact writing |
| Target paths | this readiness matrix; `docs/reviews/CVF_MSEA_R22_T1_MINERU_PACKAGE_INSTALL_ACTIVATION_AND_MODELSCOPE_PIPELINE_CACHE_PREPARATION_WORKER_RETURN_2026-07-03.md` |
| Allowed scope source | R22 GC-018 baseline and work order after session-sync commit `48194e1c` |
| Before status evidence | `git rev-parse --short HEAD` returned `48194e1c`; clean worktree before worker writes |
| After status evidence | two authorized worker output artifacts expected before reviewer acceptance; ignored local runtime side effects recorded in worker return |
| Diff evidence | `git diff --name-status` and `git status --short` after artifact creation |
| Approval boundary | operator authorized R22 package install activation and ModelScope cache-prep prerequisite lane |
| Claim boundary | route decision only; no parser runtime, source import, public-sync, extraction accuracy, legal advice quality, production, or workflow-chain claim |
| Agent type | worker |
| Invocation ID | `msea-r22-t1-readiness-matrix-2026-07-03` |
| Expected manifest | two authorized worker output artifacts |
| Actual changed set | this readiness matrix; R22 worker return |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename performed |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | R22 route readiness after local package activation and cache-prep diagnostic |
| claimDisposition | CLAIM_REJECTED: no execution-control, parser runtime, mandatory wrapper, provider governance, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT - no runtime receipt exists because no parser/runtime command ran |
| actionEvidence | ACTION_EVIDENCE_PRESENT - local package activation and one cache-prep attempt were performed |
| invocationBoundary | route matrix and local prerequisite metadata only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, or adapter interception claim is made |
| claimLanguage | hold route and prerequisite decision only |
| forbiddenExpansion | no parser/OCR/VLM/API/router/Gradio/Docker/WSL/service execution, document body read, extraction output, public-sync, schema/writer/adapter/checker implementation, model-router, action-authority, legal advice, current-law, production, or workflow-chain claim |

## Claim Boundary

This matrix records only that the R22 local package activation and command activation succeeded, but ModelScope pipeline cache preparation did not complete and config writeback did not occur. It does not claim model cache readiness, MinerU runtime readiness, extraction accuracy, legal data quality, current-law correctness, production readiness, or workflow-chain completion.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: local private CVF testing only; no public-sync export or redistribution is authorized.
