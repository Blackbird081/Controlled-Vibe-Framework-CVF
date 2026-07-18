# CVF MSEA-R20-T1 MinerU Model Cache Local Source And Teardown Prep Readiness Matrix

Status: ACTIVE_REFERENCE
docType: reference
Memory class: governed reference
Date: 2026-07-03
selectedRouteToken: HOLD_PENDING_OPERATOR_MODEL_SOURCE_CHOICE
ledger_terminal=COMPLETE_WITH_DECLARED_LIMITS

## Purpose

Record the source-verified readiness decision for MinerU model-cache,
local-source, and service-teardown preparation before any future local runtime
smoke pilot.

## Target / Source

| Field | Value |
| --- | --- |
| Target | MinerU model-cache/local-source and teardown readiness |
| Work order | docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R20_T1_MINERU_MODEL_CACHE_LOCAL_SOURCE_AND_TEARDOWN_PREP_2026-07-03.md |
| Worker return | docs/reviews/CVF_MSEA_R20_T1_MINERU_MODEL_CACHE_LOCAL_SOURCE_AND_TEARDOWN_PREP_WORKER_RETURN_2026-07-03.md |
| Source mirror | .private_reference/source_mirrors/opendatalab__MinerU |
| Claim boundary | Planning matrix only; no runtime execution, install, model download, service startup, Docker/WSL command, provider call, output generation, public export, or production-readiness claim. |

## Scope / Applies To

This matrix applies to the next MinerU governed decision after MSEA-R20-T1
planning. It does not authorize local parsing. It classifies the operator
model-source/cache choice that must be resolved before a runtime smoke pilot
can be safely dispatched.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| R19 selected model-cache/local-source preparation before runtime smoke. | docs/reviews/CVF_MSEA_R19_T1_MINERU_LOCAL_EXTRACTION_ENVIRONMENT_MODEL_LIFECYCLE_AND_SERVICE_TEARDOWN_PLANNING_WORKER_RETURN_2026-07-03.md | Reviewer Decision / Closure Disposition | OPEN_MODEL_CACHE_AND_LOCAL_SOURCE_PREP_WORK_ORDER_FIRST | MSEA-R19-T1 worker return | ACCEPT |
| MinerU CLI can automatically start a local temporary service when API URL is absent. | .private_reference/source_mirrors/opendatalab__MinerU/README.md | Line 146 | mineru local temporary service | MinerU CLI orchestration docs | ACCEPT |
| MinerU CLI supports a pipeline command envelope for local input and output paths. | .private_reference/source_mirrors/opendatalab__MinerU/README.md | Lines 332-336 | mineru -p input -o output -b pipeline | MinerU CLI docs | ACCEPT |
| MINERU_MODEL_SOURCE can be huggingface, modelscope, or local. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 12 | MINERU_MODEL_SOURCE | MinerU model source docs | ACCEPT |
| First-run auto source selection can write back model-source to mineru.json. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 26 | model-source | MinerU model source docs | ACCEPT |
| Model download writes path/source to mineru.json. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 44 | mineru.json | MinerU model download lifecycle | ACCEPT |
| Model update can redownload to the default location and update config. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 48 | mineru-models-download | MinerU model download lifecycle | ACCEPT |
| Model download requires a remote source and ignores local mode for that invocation. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 49 | mineru-models-download | MinerU model download lifecycle | ACCEPT |
| Local models can be enabled by setting MINERU_MODEL_SOURCE to the local value. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Lines 53-56 | MINERU_MODEL_SOURCE | MinerU local model docs | ACCEPT |
| Docker deployment requires Linux or Windows with WSL2. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/quick_start/docker_deployment.md | Line 6 | Docker deployment | MinerU Docker docs | ACCEPT |

## Read-Only Local Metadata

| Surface | Observed result | Readiness effect |
| --- | --- | --- |
| executionBaseHead | 5dcc1410 | Clean base for worker planning. |
| Worktree before worker writes | clean | Worker output can be isolated. |
| Python | Python 3.11.9 at user Python path | Host has Python surface, but MinerU install was not checked or invoked. |
| Docker command | docker.exe visible | Docker can be considered later, but no daemon/container proof exists. |
| WSL command | wsl.exe visible | WSL2 eligibility is plausible, but no WSL runtime proof exists. |
| MINERU_MODEL_SOURCE | not set | Operator model-source choice is unresolved. |
| Local model path/cache proof | not supplied in this tranche | Local runtime route cannot be selected yet. |
| Proposed private output root | absent | Output quarantine root must be prepared before runtime. |

## Model Source Choice Posture

| Option | Current posture | Required before runtime smoke |
| --- | --- | --- |
| local | Source-supported but no local model path/cache proof was supplied. | Operator supplies local model path/cache evidence and accepts metadata-only proof. |
| modelscope | Source-supported remote mode, but no download permission exists. | Operator explicitly authorizes download/source use and storage/quota boundary. |
| huggingface | Source-supported remote mode, but no download permission exists. | Operator explicitly authorizes download/source use and storage/quota boundary. |
| auto | Source-supported only by leaving env unset, but auto can write back resolved source. | Operator explicitly accepts config write-back risk before runtime. |

## MinerU Config Writeback Risk

| Item | Current state | Required next action | Candidate class |
| --- | --- | --- | --- |
| model-source auto write-back | Source docs say resolved source can be written to mineru.json. | Decide whether auto write-back is acceptable before runtime. | CHECKER_CANDIDATE |
| model path/source write-back after download | Source docs say download writes model path and source to mineru.json. | Require backup/diff/redaction receipt if download is later authorized. | CHECKER_CANDIDATE |
| local model mode | Source-supported through MINERU_MODEL_SOURCE local. | Require operator-provided local path/cache proof. | RUNTIME_CANDIDATE |
| model download | Not authorized. | REMOVED_OR_REJECTED until operator authorizes remote download. | REMOVED_OR_REJECTED |

## Temporary Service Teardown Receipt

| Receipt field | Required later evidence | Current disposition |
| --- | --- | --- |
| before_process_snapshot | Process metadata before MinerU invocation, secret-safe and document-content-free. | CHECKER_CANDIDATE |
| before_port_snapshot | Port metadata before MinerU invocation, if future work order permits. | CHECKER_CANDIDATE |
| invocation_mode | Whether runtime uses api-url or permits implicit local temporary service. | CHECKER_CANDIDATE |
| after_process_snapshot | Process metadata after invocation and teardown. | CHECKER_CANDIDATE |
| after_port_snapshot | Port metadata after invocation and teardown. | CHECKER_CANDIDATE |
| teardown_disposition | stopped, not-started, or blocked-with-diagnostic. | CHECKER_CANDIDATE |

## Output Quarantine Disposition

| Item | Disposition |
| --- | --- |
| Original legal documents | Private local testing only; do not public-sync or redistribute. |
| Future extracted outputs | Must remain in a private output root and be committed only as metadata/redacted receipts unless operator separately authorizes fuller inclusion. |
| Current tranche outputs | No extraction outputs were created. |
| Public export | DEFERRED_PRIVATE_ONLY |

## Forbidden Runtime Action Checklist

| Action | Disposition |
| --- | --- |
| Import MinerU modules | REMOVED_OR_REJECTED |
| Invoke mineru, mineru-api, mineru-router, mineru-gradio, or mineru-models-download | REMOVED_OR_REJECTED |
| Run pip, uv, conda, Docker containers, WSL commands, API calls, model downloads, OCR/VLM/hybrid parsing, or output creation | REMOVED_OR_REJECTED |
| Read document body content | REMOVED_OR_REJECTED |
| Implement adapter/schema/writer/checker/runtime code | REMOVED_OR_REJECTED |

## Route Decision Menu Selection

| Token | Decision |
| --- | --- |
| OPEN_MSEA_R21_LOCAL_RUNTIME_SMOKE_PILOT_WORK_ORDER | Not selected; runtime smoke is premature until operator chooses model source/cache route. |
| HOLD_PENDING_OPERATOR_MODEL_SOURCE_CHOICE | selectedRouteToken |
| HOLD_PENDING_LOCAL_MODEL_PATH_OR_CACHE_PROOF | Secondary blocker if operator chooses local mode. |
| HOLD_RUNTIME_PENDING_SERVICE_TEARDOWN_RECEIPT | Not selected as terminal route because teardown fields are defined here; they must be carried into future runtime work. |
| HOLD_ALL_RUNTIME_LANES | Not selected; a concrete operator checkpoint can release the next decision. |

## External Absorption Value Conversion Matrix

External absorption core: REQUIRED

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
| --- | --- | --- | --- | --- | --- |
| MinerU model source docs | Runtime requires operator choice among local, remote, or auto write-back risk. | RUNTIME_CANDIDATE | Operator checkpoint or fresh runtime work order | Hold pending model-source choice. | No download or parser run here. |
| MinerU local model docs | Local mode is source-supported but needs path/cache proof. | CHECKER_CANDIDATE | Local-source receipt | Require metadata-only local path/cache proof if local route chosen. | No package or model mutation. |
| MinerU CLI orchestration docs | Local temporary service may be started automatically. | CHECKER_CANDIDATE | Future teardown receipt checklist | Require before/after service/process evidence in runtime pilot. | No service started here. |
| Private legal use case boundary | Test data remains private and committed evidence must be metadata/redacted. | DOCTRINE_ADAPTED | Privacy/redaction section in future pilot | Continue private-only evaluation discipline. | No document body content. |
| Direct upstream source import | Not needed for planning. | REJECT_DIRECT_IMPORT | This matrix | Use source facts only. | No package or source import. |
| MinerU package installation surface | Package activation could be useful later but is not authorized here. | PACKAGE_CANDIDATE | Future package/runtime preparation packet if operator authorizes install checks | Keep as future candidate only. | No package lifecycle mutation. |
| Already-captured non-runtime documentation | R12-R19 already captured the non-runtime policy and receipt boundaries needed here. | NO_PACKAGE_OR_RUNTIME_VALUE | Prior MSEA owner surfaces | Keep prior conclusions unreopened. | No runtime or package claim. |

## Rescan Intelligence Hardening

- Original source artifact: MSEA-R19 planning outputs and MinerU source mirror documentation.
- Predecessor intake artifact: docs/reviews/CVF_MSEA_R19_T1_MINERU_LOCAL_EXTRACTION_ENVIRONMENT_MODEL_LIFECYCLE_AND_SERVICE_TEARDOWN_PLANNING_WORKER_RETURN_2026-07-03.md
- Delta ledger status: ENRICH_EXISTING for model-source write-back and local mode; REMOVED_OR_REJECTED for direct runtime, Docker, service, package, and model download actions.
- Routing matrix status: HOLD_PENDING_OPERATOR_MODEL_SOURCE_CHOICE; RESOLVED_BY_DESIGN for private-only output disposition; OUT_OF_SCOPE for public sync and production readiness.
- Semantic sampling status: sampleId=MSEA-R20-M1; source section=model_source.md and README local service behavior; source claim=first run can mutate config and start temporary service; disposition checked=runtime smoke must wait; adversarial challenge=visible Python/Docker/WSL could be enough; verdict=not enough without operator model-source choice.
- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Item | Delta category | Evidence | Disposition |
| --- | --- | --- | --- |
| R19 preparation route | UNCHANGED_FROM_INTAKE | R19 selected model-cache/local-source prep. | R20 resolves prep into operator choice. |
| Model source choice | NEW_FINDING | source docs and unset env var. | HOLD_PENDING_OPERATOR_MODEL_SOURCE_CHOICE |
| Local model path/cache | ENRICH_EXISTING | no local path/cache proof supplied. | HOLD_PENDING_LOCAL_MODEL_PATH_OR_CACHE_PROOF |
| Host tool visibility | CHANGED_DISPOSITION | Python, Docker, and WSL are visible, but model-source choice is unresolved. | Visibility is not runtime readiness. |
| Direct package/runtime execution | REMOVED_OR_REJECTED | Work-order forbidden actions. | No runtime execution in this tranche. |
| Privacy boundary | RESOLVED_BY_DESIGN | R17 Candidate Group A boundary. | Keep metadata/redacted receipts only. |

### Follow-Up Routing Matrix

| Lane | Routing lane | Action |
| --- | --- | --- |
| Operator model-source choice | STRATEGIC_OPERATOR_DECISION | Choose local path/cache proof, modelscope download permission, huggingface download permission, or explicit auto/config write-back authorization. |
| Operator checkpoint packet | DO_NOW | Record the selected model-source route before any runtime smoke work order. |
| Runtime smoke | SEPARATE_RUNTIME_TRANCHE | Wait for operator choice and fresh runtime work order. |
| Teardown receipt | SEPARATE_RUNTIME_TRANCHE | Carry defined receipt fields into runtime work order. |
| Privacy/redaction boundary | RESOLVED_BY_DESIGN | Private-only metadata/redaction rule already confirmed. |
| Public sync, package install, Docker run | OUT_OF_SCOPE | Keep parked. |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
| --- | --- | --- | --- | --- | --- |
| MSEA-R20-M1 | model_source.md line 12 | Supported source values include remote and local. | Operator choice required. | Leave env unset and let auto decide. | Hold; auto write-back is an operator decision. |
| MSEA-R20-M2 | model_source.md line 49 | model download uses a remote source. | No model download. | Download now to unblock runtime. | Reject; no download authorization exists. |
| MSEA-R20-M3 | README.md line 146 | CLI can start temporary service when API URL is absent. | Teardown receipt required. | Teardown can be handled after runtime. | Reject; future runtime work order must define before/after evidence first. |

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Epistemic Process Applicability | HIGH_EVIDENCE |
| Expected Result / Prediction | Model-cache prep might release a runtime smoke work order. |
| Evidence Comparison | Prep sharpened the unresolved decision: no operator model-source choice and no local path/cache proof. |
| Contradiction Or Gap Disposition | Runtime smoke remains held pending operator model-source choice. |
| Claim Update | Select HOLD_PENDING_OPERATOR_MODEL_SOURCE_CHOICE. |

## Agent Operation Trace Block

| Field | Value |
| --- | --- |
| Actor | Codex as MSEA-R20-T1 worker |
| Provider or surface | Local CLI and governed markdown editing |
| Session or invocation | 2026-07-03 resumed CVF session |
| Working directory | D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF |
| Command or tool surface | PowerShell read-only metadata; apply_patch artifact creation |
| Target paths | Companion readiness matrix |
| Allowed scope source | MSEA-R20-T1 work order write ownership and allowed metadata sections |
| Before status evidence | git status --short had no output before worker writes |
| After status evidence | git status --short lists the worker return and this matrix before reviewer conversion |
| Diff evidence | git diff --name-status reports no tracked edits during worker phase; untracked paths are listed by git status --short |
| Approval boundary | WORKER_MUST_NOT_COMMIT |
| Claim boundary | Planning and read-only metadata only; no runtime, model, service, package, public, adapter, checker, or production claim |
| Agent type | worker |
| Invocation ID | MSEA-R20-T1-matrix-2026-07-03 |
| Expected manifest | companion readiness matrix |
| Actual changed set | companion readiness matrix plus paired worker return |
| Manifest delta | none |

## Delta Execution Claim Boundary Control Block

Delta execution claim boundary: REQUIRED

| Field | Value |
| --- | --- |
| claimScope | This matrix does not claim CVF controls runtime execution; it only records a planning route. |
| claimDisposition | CLAIM_REJECTED for any execution-control or runtime-readiness interpretation. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT - no runtime receipt was produced. |
| actionEvidence | CLAIM_REJECTED_NO_ACTION - no parser/service/model/container action was performed. |
| invocationBoundary | No MinerU command, package command, Docker container, WSL command, API call, or provider call was invoked. |
| interceptionBoundary | No direct interception, wrapper, or automatic enforcement was implemented. |
| claimLanguage | Use planning, candidate, held, and operator-checkpoint language only. |
| forbiddenExpansion | Do not read this packet as production readiness, runtime proof, public export, provider proof, or automatic teardown. |

## Claim Boundary

This matrix is not runtime proof. It does not claim MinerU is installed, models
exist, Docker daemon works, WSL2 is configured, GPU is available, services can
be started/stopped, extraction quality is acceptable, or CVF has a production
workflow chain. It authorizes only the next governed decision boundary.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

No public-sync action is authorized. The private legal test use case remains
local-only with metadata/redaction requirements for any future committed
receipts.
