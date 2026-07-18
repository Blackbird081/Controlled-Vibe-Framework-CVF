# CVF MSEA-R24-T1 MinerU Model Source Fallback Decision Matrix

Memory class: FULL_RECORD

docType: reference

Status: COMPLETE_PENDING_REVIEW

selectedRouteToken: SELECT_HUGGINGFACE_CACHE_RECOVERY

t2ReleaseDisposition: RELEASE_T2_WORK_ORDER_AUTHORING_ONLY

cacheCommandAuthorization: NOT_AUTHORIZED_IN_T1

runtimeSmokeGateDisposition: BLOCKED_UNTIL_T2_CACHE_CONFIG_RECEIPT

External knowledge intake routing: REQUIRED

External absorption core: REQUIRED

## Purpose

Record the MSEA-R24-T1 source-backed decision matrix comparing MinerU
HuggingFace, ModelScope, auto, and local model-source routes after R23 left
cache/config readiness unproven.

## Scope / Applies To

Applies only to MSEA-R24-T1 route selection and T2 work-order authoring
readiness. It does not authorize cache commands, model downloads, parser/OCR/
VLM/API/router/Gradio/Docker/WSL execution, local service startup, source
document copy/import, document body read, extraction outputs, provider/live
proof, public-sync, schema/writer/checker/adapter implementation, package
reinstall, runtime smoke, workflow-chain completion, or production readiness.

## Target / Source

| Field | Value |
|---|---|
| Target tranche | MSEA-R24-T1 |
| Worker return | `docs/reviews/CVF_MSEA_R24_T1_MINERU_MODEL_SOURCE_FALLBACK_DECISION_WORKER_RETURN_2026-07-03.md` |
| Work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T1_MINERU_MODEL_SOURCE_FALLBACK_DECISION_2026-07-03.md` |
| Roadmap | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` |
| Predecessor matrix | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` |
| Source mirror root | `.private_reference/source_mirrors/opendatalab__MinerU/` |

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|
| R23 selected the ModelScope retry or diagnostic hold. | VALUE_SET | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` | line 9 | `HOLD_PENDING_MODELSCOPE_RETRY_OR_NETWORK_DIAGNOSTIC` | R23 readiness matrix | ACCEPT |
| R23 did not write a config receipt. | VALUE_SET | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` | line 13 | `CONFIG_NOT_WRITTEN_AFTER_STOP` | R23 readiness matrix | ACCEPT |
| R23 did not establish cache completion. | VALUE_SET | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` | line 15 | `NOT_READY_INCOMPLETE_MODELSCOPE_CACHE_ONLY` | R23 readiness matrix | ACCEPT |
| R23 kept runtime smoke blocked. | VALUE_SET | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` | line 17 | `BLOCKED_NO_CACHE_CONFIG_RECEIPT` | R23 readiness matrix | ACCEPT |
| MinerU supports HuggingFace, ModelScope, and local model choices. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 3 | `HuggingFace`; `ModelScope`; local models | MinerU model-source docs | ACCEPT |
| MinerU documents auto as default source policy. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 5 | `auto` | MinerU model-source docs | ACCEPT |
| MinerU documents HuggingFace as globally stable. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 6 | `HuggingFace` | MinerU model-source docs | ACCEPT |
| MinerU documents ModelScope as mainly suited to mainland China access constraints. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 7 | `ModelScope` | MinerU model-source docs | ACCEPT |
| MinerU environment source values are `huggingface`, `modelscope`, and `local`; docs say not to set it to `auto`. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 12 | `MINERU_MODEL_SOURCE` | MinerU model-source docs | ACCEPT |
| MinerU completed download writes path and actual source into config. | RUNTIME_BEHAVIOR | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | line 44 | `mineru.json` | MinerU model-source docs | ACCEPT |
| MinerU download CLI exposes remote source choices. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/models_download.py` | lines 94-103 | `--source` | MinerU model download CLI | ACCEPT |
| MinerU download CLI supports pipeline model download selection. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/models_download.py` | lines 104-117 | `download_models` | MinerU model download CLI | ACCEPT |
| MinerU utility defines remote sources as HuggingFace and ModelScope. | VALUE_SET | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py` | line 20 | `REMOTE_MODEL_SOURCES` | MinerU model download utility | ACCEPT |
| MinerU utility resolves local source as `local`. | RUNTIME_BEHAVIOR | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py` | lines 232-234 | `resolve_model_source` | MinerU model download utility | ACCEPT |
| MinerU utility selects HuggingFace or ModelScope snapshot download by source. | RUNTIME_BEHAVIOR | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py` | lines 253-259 | `_snapshot_download_cached` | MinerU model download utility | ACCEPT |

## Model Source Route Matrix

| Route | Evidence | Benefits | Blocking evidence | Decision |
|---|---|---|---|---|
| `huggingface` | MinerU docs name it as a supported source and globally stable | clean explicit alternative to failed ModelScope path | T2 still needs fresh bounded command authority | SELECT_HUGGINGFACE_CACHE_RECOVERY |
| `modelscope` | supported source and valid remote CLI choice | known package path from R21-R23 | R23 has no config writeback or completed cache | HOLD |
| `auto` | default policy can probe source and persist actual source | useful fallback if explicit source fails | docs say not to set environment value to `auto`; T2 would need careful command design | HOLD |
| `local` | supported when model paths exist | avoids remote cache once local models are available | no local model-path receipt exists | HOLD |

## T2 Release Matrix

| Token | Release disposition | Reason |
|---|---|---|
| SELECT_HUGGINGFACE_CACHE_RECOVERY | SELECTED | best source-backed next route for one future bounded T2 cache-completion command |
| SELECT_MODELSCOPE_SUPERVISED_RETRY | NOT_SELECTED | predecessor evidence already used ModelScope and did not reach config/cache readiness |
| SELECT_AUTO_SOURCE_PROBE | NOT_SELECTED | valid concept but less explicit; environment value must not be set to `auto` |
| SELECT_LOCAL_MODEL_PATH_PREP | NOT_SELECTED | no local model-path evidence exists |
| HOLD_ALL_CACHE_RECOVERY | NOT_SELECTED | at least one source-backed route is ready for T2 authoring |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | pinned MinerU source mirror plus accepted R23 diagnostic evidence -> T1 model-source decision matrix |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this companion decision matrix |
| Disposition | ADAPT: select a source-backed T2 authoring route |
| Claim boundary | source verification and route decision only; no cache command, parser runtime, provider/live proof, public-sync, or production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `.private_reference/source_mirrors/opendatalab__MinerU/` |
| Enumeration command | `filesystem-backed direct reads of the three source files named in Source Verification Block plus accepted R23 matrix` |
| Manifest artifact or inline manifest | inline table: Source Verification Block in this matrix |
| Processing ledger artifact or inline ledger | inline table: Model Source Route Matrix and T2 Release Matrix |
| Ledger terminal statuses | READ; ADAPTED; DEFERRED; REJECTED; NO_NEW_VALUE; BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB; ADAPT; DEFER; REJECT; BLOCK; NO_NEW_VALUE |
| Owner-surface map | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md`; `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T1_MINERU_MODEL_SOURCE_FALLBACK_DECISION_2026-07-03.md`; `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md`; `.private_reference/source_mirrors/opendatalab__MinerU/` |
| Unresolved items | T2 cache command execution, T3 runtime smoke, and T4 workflow-chain receipt policy remain future tranches |
| Completion claim boundary | decision matrix only; no runtime, download, parser, document-body, extraction, source import, provider/live proof, public-sync, schema/writer/adapter/checker work |

ledger_terminal=READ for source-verified R23 and MinerU source files; ledger_terminal=ADAPTED for route selection; ledger_terminal=DEFERRED for T2/T3/T4 execution; ledger_terminal=REJECTED for direct runtime or workflow-chain claims in T1; ledger_terminal=NO_NEW_VALUE for already-owned package activation facts.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| R23 readiness matrix | ModelScope path did not yield config/cache receipt | DOCTRINE_ADAPTED | T1 route decision | preserve blocker | no runtime smoke |
| MinerU HuggingFace docs | supported globally stable remote source | RUNTIME_CANDIDATE | T2 work-order seed | author fresh T2 | no command in T1 |
| MinerU ModelScope docs | supported mainly for China access constraints | RUNTIME_CANDIDATE | T2 comparison | hold unless new diagnostic supports retry | no retry in T1 |
| MinerU auto docs | default probes source and writes resolved source | DOCTRINE_ADAPTED | route matrix | retain as fallback, not selected | no auto env setting |
| MinerU local docs | local source supported after local model paths exist | PACKAGE_CANDIDATE | future local-path prep | hold pending path evidence | no local runtime |
| Worker-output gates | route token and no-commit evidence shape | CHECKER_CANDIDATE | worker return and matrix | run fast gates | no checker implementation |
| Direct cache execution | out of T1 scope | REJECT_DIRECT_IMPORT | claim boundary | defer to fresh T2 work order | no download |
| Already-owned package install evidence | R22 owns local ignored package activation | NO_PACKAGE_OR_RUNTIME_VALUE | predecessor surfaces | cite only | no reinstall |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| R24 roadmap dependency route | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` | CONFIRMED_EXISTING | T1 already authorized as decision-only | execute T1 |
| R23 cache/config blocker | `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md` | CONFIRMED_EXISTING | no new runtime evidence | cite |
| HuggingFace source route | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | ENRICH_EXISTING | selected as T2 authoring seed | adapt |
| Direct cache command | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` | REJECT_DIRECT_IMPORT | T2 owns only after fresh work order | defer |
| Runtime smoke | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` | REJECT_DIRECT_IMPORT | T3 remains blocked until T2 receipt | defer |
| Source-mirror package facts | R22/R23 accepted matrices | NO_NEW_VALUE | no new package activation fact | cite only |

## Rescan Intelligence Hardening

Original source artifact: `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md`

Predecessor intake artifact: `docs/reviews/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_DECISION_WORKER_RETURN_2026-07-03.md`

Delta ledger status: COMPLETE_WITH_DECLARED_EXCLUSIONS

Routing matrix status: COMPLETE_WITH_DECLARED_LIMITS

Semantic sampling status: COMPLETE_WITH_DECLARED_LIMITS

- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Delta category | R24-T1 disposition |
|---|---|
| UNCHANGED_FROM_INTAKE | R23 cache/config readiness remains unproven |
| CHANGED_DISPOSITION | R23 hold is converted into a selected HuggingFace T2-authoring route |
| NEW_FINDING | HuggingFace is the lowest-risk explicit next source route from current source facts |
| REMOVED_OR_REJECTED | direct runtime smoke and workflow-chain claims remain rejected before receipts |

### Follow-Up Routing Matrix

| Routing lane | R24-T1 disposition |
|---|---|
| DO_NOW | reviewer may accept T1 and author fresh MSEA-R24-T2 work order |
| SEPARATE_RUNTIME_TRANCHE | T2 cache, T3 smoke, and T4 policy remain dependent |
| STRATEGIC_OPERATOR_DECISION | local model path remains operator-sensitive if later chosen |
| OUT_OF_SCOPE | parser runtime, document processing, public-sync, production chain |
| RESOLVED_BY_DESIGN | dependency gates prevent T3/T4 before receipts |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
|---|---|---|---|---|---|
| R24T1-M1 | R23 matrix | config not written | T2 required | skip to smoke | REJECT |
| R24T1-M2 | MinerU docs | HuggingFace is supported and stable | selected route | retry ModelScope again | REJECT |
| R24T1-M3 | MinerU docs | auto should not be set as env value | hold auto | set env to auto | REJECT |
| R24T1-M4 | MinerU docs | local source is supported | hold local | claim local model ready | REJECT |

## Corpus Completeness And Report Integrity

- Corpus task class: decision-only model-source fallback companion matrix.
- Corpus root: accepted R23 matrix plus pinned MinerU model-source docs and helper files.
- Snapshot time: 2026-07-03 worker execution.
- Enumeration command: filesystem-backed direct reads of `docs/reference/CVF_MSEA_R23_T1_MINERU_MODELSCOPE_CACHE_DIAGNOSTIC_RESOLUTION_AND_ALTERNATE_SOURCE_READINESS_MATRIX_2026-07-03.md`, `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md`, `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/models_download.py`, and `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py`.
- Manifest artifact or inline manifest: inline table: Source Verification Block in this matrix.
- Manifest hash: N/A with reason: bounded decision source set, not a new corpus snapshot.
- Processing ledger artifact or inline ledger: inline table: Model Source Route Matrix and T2 Release Matrix in this matrix.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE.
- Reconciliation: manifest=R23/MinerU source files; ledger_terminal=READ/ADAPTED/DEFERRED/REJECTED/NO_NEW_VALUE; exclusions=cache command, alternate-source download, runtime smoke, document body read, extraction outputs, public-sync, provider/live proof, production claims; unresolved=0 for T1 decision scope.
- Unresolved files: none for T1 decision scope.
- Declared exclusions: T2 cache execution, T3 runtime smoke, T4 workflow policy, document processing, public-sync, provider/live proof, production readiness.
- Unreadable or unsupported files: none identified.
- Aggregation check: PASS - accepted owner surfaces are cited instead of regenerated into a corpus aggregate.
- Drift check: PASS - R23 accepted matrix still records no config/cache receipt.
- Output traceability: route token appears in this matrix and worker return.
- Adversarial verification: direct runtime smoke, direct cache command, direct local-model readiness, and workflow-chain completion are rejected for T1.
- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Checker Source Read-Ahead Block

| Field | Value |
|---|---|
| applicableCheckersRead | `governance/compat/check_markdown_structural_completeness.py`; `governance/compat/check_governed_artifact_checker_read_ahead.py`; `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_corpus_completeness_report_integrity.py`; `governance/compat/check_rescan_intelligence_hardening.py`; `governance/compat/check_agent_operation_trace.py`; `governance/compat/check_delta_execution_claim_boundary.py`; `governance/compat/check_public_export_disposition.py` |
| literalTokensReviewed | Scope / Applies To; Target / Source; Source Verification Block; External Knowledge Intake Routing field labels; External Absorption Core field labels; External Absorption Value Conversion Matrix columns; Overlap And Novelty Classification dispositions; Rescan intelligence verdict; Corpus task class; ledger_terminal=; Corpus verdict bullet; Agent Operation Trace Block labels; Delta Execution Claim Boundary Control Block fields; Public Export Disposition |
| gateRunPurpose | Confirmation evidence after reference-output checker read-ahead; gates confirm this companion matrix shape. |
| claimBoundary | Read-ahead covers this companion matrix only; no cache command, parser runtime, provider/live proof, public-sync, or production behavior is claimed. |

## Epistemic Process Block

| Field | Value |
|---|---|
| Expected Result / Prediction | R24-T1 should select exactly one route token or hold all cache recovery. |
| Evidence Comparison | Compared R23 ModelScope non-readiness against MinerU source docs for HuggingFace, ModelScope, auto, and local options. |
| Contradiction Or Gap Disposition | No contradiction found; the remaining gap is absence of a cache/config receipt, routed to T2. |
| Claim Update | Claim narrowed to SELECT_HUGGINGFACE_CACHE_RECOVERY for T2 work-order authoring only. |
| Claim Boundary | decision-only; no cache, runtime, provider/live, document, public, or production proof. |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated worker |
| Provider or surface | Codex local workspace |
| Session or invocation | MSEA-R24-T1 companion decision matrix, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, direct source reads, `apply_patch`, governance gates |
| Target paths | companion decision matrix |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T1_MINERU_MODEL_SOURCE_FALLBACK_DECISION_2026-07-03.md` |
| Before status evidence | `git status --short --untracked-files=all` returned empty at execution base `5b870df7` before worker-owned output creation |
| After status evidence | matrix is untracked with worker return pending reviewer/closer acceptance |
| Diff evidence | `git diff --name-status` plus untracked status before handoff |
| Approval boundary | MSEA-R24-T1 source verification and route selection only |
| Claim boundary | no cache command, model download, parser runtime, document body read, extraction output, provider/live proof, public-sync, or production claim |
| Agent type | worker |
| Invocation ID | `msea-r24-t1-model-source-fallback-decision-matrix-2026-07-03` |
| Expected manifest | companion decision matrix |
| Actual changed set | companion decision matrix |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in companion matrix |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R24-T1 companion decision matrix |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, cache execution, parser, adapter, schema, provider, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed in T1 |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no cache/download/parser/runtime action is executed in T1 |
| invocationBoundary | local governed source reads and matrix authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, daemon, parser, model cache, corpus store, or production route interception claim |
| claimLanguage | route decision and T2 authoring release only |
| forbiddenExpansion | no cache mutation, alternate-source download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, local service startup, source document import, document body read, extraction output, provider/live call, public-sync, RAG write, source import, package activation, checker implementation, Web/MCP/model-router/action-authority, benchmark, document-truth, extraction-accuracy, legal advice quality, current-law correctness, schema implementation, receipt-writer code, adapter implementation, workflow-chain completion, or production-readiness claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance companion matrix; no public-sync export is authorized.

## Claim Boundary

This matrix records only the MSEA-R24-T1 source-backed route decision. The
selected token opens fresh T2 work-order authoring only. It does not authorize
cache mutation, model download, alternate-source execution, parser/OCR/VLM/API/
router/Gradio/Docker/WSL execution, local service startup, source document
copy/import, document body read, extraction output, provider/live proof,
public-sync, schema/writer/checker/adapter implementation, runtime smoke,
workflow-chain completion, production readiness, stage, commit, or push.

