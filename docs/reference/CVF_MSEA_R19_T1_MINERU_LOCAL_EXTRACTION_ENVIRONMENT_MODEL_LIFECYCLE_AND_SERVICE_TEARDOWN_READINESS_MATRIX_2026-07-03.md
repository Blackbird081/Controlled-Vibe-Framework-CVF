# CVF MSEA-R19-T1 MinerU Local Extraction Environment Model Lifecycle And Service Teardown Readiness Matrix

Status: ACTIVE_REFERENCE
docType: reference
Memory class: governed reference
Date: 2026-07-03
selectedRouteToken: OPEN_MODEL_CACHE_AND_LOCAL_SOURCE_PREP_WORK_ORDER_FIRST
ledger_terminal=COMPLETE_WITH_DECLARED_LIMITS

## Purpose

Record the source-verified readiness decision for MinerU local extraction environment planning before any future local runtime smoke pilot.

## Target / Source

| Field | Value |
| --- | --- |
| Target | MinerU local extraction pilot readiness |
| Work order | docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R19_T1_MINERU_LOCAL_EXTRACTION_ENVIRONMENT_MODEL_LIFECYCLE_AND_SERVICE_TEARDOWN_PLANNING_2026-07-03.md |
| Worker return | docs/reviews/CVF_MSEA_R19_T1_MINERU_LOCAL_EXTRACTION_ENVIRONMENT_MODEL_LIFECYCLE_AND_SERVICE_TEARDOWN_PLANNING_WORKER_RETURN_2026-07-03.md |
| Source mirror | .private_reference/source_mirrors/opendatalab__MinerU |
| Claim boundary | Planning matrix only; no runtime execution, install, model download, service startup, Docker/WSL command, provider call, output generation, public export, or production-readiness claim. |

## Scope / Applies To

This matrix applies to the next MinerU governed decision after MSEA-R18/R19 planning. It does not authorize local parsing. It classifies what must be prepared before a runtime smoke pilot can be safely dispatched.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| Pipeline backend supports CPU fallback. | .private_reference/source_mirrors/opendatalab__MinerU/README.md | Lines 74, 184, 334-336 | pipeline backend | MinerU CLI docs | ACCEPT |
| MinerU CLI can automatically start a local temporary service when API URL is absent. | .private_reference/source_mirrors/opendatalab__MinerU/README.md | Line 146 | mineru local temporary service | MinerU CLI orchestration docs | ACCEPT |
| MINERU_MODEL_SOURCE can be huggingface, modelscope, or local. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 12 | MINERU_MODEL_SOURCE | MinerU model source docs | ACCEPT |
| First-run auto source selection can write back model-source to mineru.json. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 26 | mineru.json model-source | MinerU model source docs | ACCEPT |
| Model download writes path/source to mineru.json. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Line 44 | mineru.json | MinerU model download lifecycle | ACCEPT |
| Local models can be enabled by setting MINERU_MODEL_SOURCE to the local value. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md | Lines 53-56 | MINERU_MODEL_SOURCE | MinerU local model docs | ACCEPT |
| Docker deployment requires Linux or Windows with WSL2. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/quick_start/docker_deployment.md | Lines 5-7 | Docker deployment | MinerU Docker docs | ACCEPT |
| Docker service startup maps service ports and compose profiles can start services. | .private_reference/source_mirrors/opendatalab__MinerU/docs/en/quick_start/docker_deployment.md | Lines 35-68 | docker run / compose profiles | MinerU Docker docs | ACCEPT |

## Read-Only Local Inventory

| Surface | Observed result | Readiness effect |
| --- | --- | --- |
| executionBaseHead | 0c7d9433 | Clean base for worker planning. |
| Worktree before worker writes | clean | Worker output can be isolated. |
| Python | Python 3.11.9 at user Python path | Host has Python surface, but MinerU install was not checked or invoked. |
| Docker command | docker.exe visible | Docker can be considered later, but no daemon/container proof exists. |
| WSL command | wsl.exe visible | WSL2 eligibility is plausible, but no WSL runtime proof exists. |
| MINERU_MODEL_SOURCE | not set | Model source/local-mode must be selected before runtime. |
| Private input paths | two operator-authorized legal data inputs exist | Future smoke can use metadata-only private test data if separately authorized. |
| Proposed private output root | absent | Output quarantine root must be prepared before runtime. |

## Environment Posture

| Decision area | Current posture | Required before runtime smoke |
| --- | --- | --- |
| CPU pipeline route | Plausible from source docs and Python surface. | Verify MinerU package/runtime only in a fresh runtime work order. |
| GPU/Docker route | Parked. Docker and WSL commands are visible, but no daemon, GPU, driver, WSL distro, or container proof was collected. | Operator must choose Docker/GPU route and authorize separate checks. |
| Local legal test input | Available and private-only. | Commit only metadata/redacted receipts; never public-sync original documents. |
| Output root | Not created. | Create or verify private output quarantine path in a fresh authorized tranche. |

## Model Lifecycle Plan

| Item | Current state | Required next action | Candidate class |
| --- | --- | --- | --- |
| model source | MINERU_MODEL_SOURCE not set | Decide local versus remote source without downloading in this tranche. | RUNTIME_CANDIDATE |
| mineru.json write-back | Source docs show write-back can occur after auto source selection or model download. | Future work order must define backup/diff/no-secret handling for user-level mineru.json before first run. | CHECKER_CANDIDATE |
| model cache | Not verified. | Plan cache discovery and local-source receipt without running download. | CHECKER_CANDIDATE |
| model download | Not authorized. | REMOVED_OR_REJECTED until operator authorizes download and quota/storage/privacy handling. | REMOVED_OR_REJECTED |
| local model mode | Source-supported. | If used, require operator-provided local model path and metadata-only proof. | RUNTIME_CANDIDATE |

## Temporary Service Teardown Plan

| Item | Current state | Required next action | Candidate class |
| --- | --- | --- | --- |
| implicit local temporary service | Source docs show possible auto startup when API URL is absent. | Future runtime work order must capture before/after process and port evidence. | CHECKER_CANDIDATE |
| service stop | No service was started. | Future work order must name teardown command or observation boundary before execution. | CHECKER_CANDIDATE |
| API/router/Gradio services | Out of scope. | REMOVED_OR_REJECTED unless a fresh service-lane work order exists. | REMOVED_OR_REJECTED |
| Docker services | Out of scope. | REMOVED_OR_REJECTED unless operator selects Docker lane. | REMOVED_OR_REJECTED |

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
| OPEN_MSEA_R20_LOCAL_RUNTIME_SMOKE_PILOT_WORK_ORDER | Not selected; runtime smoke is premature until model/cache/local-source and teardown plan exist. |
| OPEN_MODEL_CACHE_AND_LOCAL_SOURCE_PREP_WORK_ORDER_FIRST | selectedRouteToken |
| HOLD_PENDING_OPERATOR_ENVIRONMENT_CHOICE | Not selected; enough planning value exists without requiring an immediate operator CPU/GPU/Docker choice. |
| HOLD_RUNTIME_PENDING_SERVICE_TEARDOWN_PROOF | Not selected as terminal route because teardown proof should be folded into the model/cache/local-source preparation work order. |
| HOLD_ALL_RUNTIME_LANES | Not selected; a bounded prep lane is source-backed and valuable. |

## External Absorption Value Conversion Matrix

External absorption core: REQUIRED

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
| --- | --- | --- | --- | --- | --- |
| MinerU model source docs | Model/cache/local source should be prepared before first run. | RUNTIME_CANDIDATE | MSEA-R20 preparation work order | Author fresh GC-018/source-verified prep packet. | No download or parser run here. |
| MinerU CLI orchestration docs | Local temporary service may be started automatically. | CHECKER_CANDIDATE | Future teardown receipt checklist | Require before/after service/process evidence in runtime pilot. | No service started here. |
| MinerU Docker docs | Docker has WSL2, port, and GPU/vLLM constraints. | RUNTIME_CANDIDATE | Environment choice matrix | Keep Docker lane parked until operator chooses it. | No Docker command beyond command discovery. |
| Private legal use case boundary | Test data exists but committed evidence must be metadata/redacted. | DOCTRINE_ADAPTED | Privacy/redaction section in future pilot | Continue private-only evaluation discipline. | No document body content. |
| Direct upstream source import | Not needed for planning. | REJECT_DIRECT_IMPORT | This matrix | Use source facts only. | No package or source import. |
| Output quarantine and teardown rows | Future gates can validate receipts. | CHECKER_CANDIDATE | Future work-order acceptance criteria | Convert into machine-checkable evidence rows if implemented later. | No checker implementation. |

## Rescan Intelligence Hardening

- Original source artifact: MSEA-R18 planning outputs and MinerU source mirror documentation.
- Predecessor intake artifact: docs/reviews/CVF_MSEA_R18_T1_MINERU_LOCAL_EXTRACTION_PILOT_PLANNING_WORKER_RETURN_2026-07-03.md
- Delta ledger status: NEW_FINDING for model-source write-back and local temporary service teardown; REMOVED_OR_REJECTED for direct runtime, Docker, service, package, and model download actions.
- Routing matrix status: SEPARATE_RUNTIME_TRANCHE for model/cache/local-source preparation; RESOLVED_BY_DESIGN for private-only output disposition; OUT_OF_SCOPE for public sync and production readiness.
- Semantic sampling status: sampleId=MSEA-R19-M1; source section=model_source.md and README local service behavior; source claim=first run can mutate config and start temporary service; disposition checked=runtime smoke must wait; adversarial challenge=visible Python/Docker/WSL could be enough; verdict=not enough without prep receipts.
- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Item | Delta category | Evidence | Disposition |
| --- | --- | --- | --- |
| R18 private runtime boundary | UNCHANGED_FROM_INTAKE | R18 remained planning-only. | Runtime still requires fresh work order. |
| Model source/cache first-run behavior | NEW_FINDING | model_source.md lines 12, 26, 44. | Open model/cache prep first. |
| Local temporary service behavior | NEW_FINDING | README.md line 146. | Add teardown receipt requirement. |
| Docker visibility | CHANGED_DISPOSITION | docker.exe exists locally, but Docker docs require WSL2 and service caution. | Visibility does not authorize Docker runtime. |
| Direct package/runtime execution | REMOVED_OR_REJECTED | Work-order forbidden actions. | No runtime execution in this tranche. |

### Follow-Up Routing Matrix

| Lane | Routing lane | Action |
| --- | --- | --- |
| Model/cache/local-source prep | DO_NOW | Author next fresh GC-018/source-verified work order. |
| Runtime smoke | SEPARATE_RUNTIME_TRANCHE | Wait for prep route and explicit runtime authorization. |
| Operator CPU/GPU/Docker choice | STRATEGIC_OPERATOR_DECISION | Needed only if future prep decides multiple viable runtime modes. |
| Privacy/redaction boundary | RESOLVED_BY_DESIGN | Private-only metadata/redaction rule already confirmed. |
| Public sync, package install, Docker run | OUT_OF_SCOPE | Keep parked. |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
| --- | --- | --- | --- | --- | --- |
| MSEA-R19-M1 | model_source.md lines 12, 26, 44 | Model source may be env-selected, auto-probed, and written back. | Runtime smoke held. | Host has Python and private inputs, so maybe run now. | Hold; model/cache prep must come first. |
| MSEA-R19-M2 | README.md line 146 | CLI can start local temporary service when API URL is absent. | Teardown proof required. | No explicit service command was planned in R18. | Add teardown receipt before runtime. |

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Epistemic Process Applicability | HIGH_EVIDENCE |
| Expected Result / Prediction | Local environment may be close enough for a later runtime pilot. |
| Evidence Comparison | Host inventory supports future feasibility, while MinerU source facts show model/cache and service teardown prep gaps. |
| Contradiction Or Gap Disposition | Runtime readiness claim narrowed to preparation-first route. |
| Claim Update | Select model cache/local-source preparation before runtime smoke. |

## Agent Operation Trace Block

| Field | Value |
| --- | --- |
| Actor | Codex as MSEA-R19-T1 worker |
| Provider or surface | Local CLI and governed markdown editing |
| Session or invocation | 2026-07-03 resumed CVF session |
| Working directory | D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF |
| Command or tool surface | PowerShell read-only inventory; apply_patch artifact creation |
| Target paths | Companion readiness matrix |
| Allowed scope source | MSEA-R19-T1 work order write ownership and allowed inventory sections |
| Before status evidence | git status --short had no output before worker writes |
| After status evidence | git status --short lists the worker return and this matrix before reviewer conversion |
| Diff evidence | git diff --name-status reports no tracked edits during worker phase; untracked paths are listed by git status --short |
| Approval boundary | WORKER_MUST_NOT_COMMIT |
| Claim boundary | Planning and read-only inventory only; no runtime, model, service, package, public, adapter, checker, or production claim |
| Agent type | worker |
| Invocation ID | MSEA-R19-T1-matrix-2026-07-03 |
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
| claimLanguage | Use planning, preparation, candidate, and held language only. |
| forbiddenExpansion | Do not read this packet as production readiness, runtime proof, public export, provider proof, or automatic teardown. |

## Claim Boundary

This matrix is not runtime proof. It does not claim MinerU is installed, models exist, Docker daemon works, WSL2 is configured, GPU is available, services can be started/stopped, extraction quality is acceptable, or CVF has a production workflow chain. It authorizes only the next governed planning direction.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

No public-sync action is authorized. The private legal test use case remains local-only with metadata/redaction requirements for any future committed receipts.
