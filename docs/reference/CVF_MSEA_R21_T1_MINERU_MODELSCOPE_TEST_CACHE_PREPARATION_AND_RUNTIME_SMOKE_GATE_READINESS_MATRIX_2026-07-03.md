# CVF MSEA-R21-T1 MinerU ModelScope Test Cache Preparation And Runtime Smoke Gate Readiness Matrix

Memory class: governed reference

docType: reference

Status: ACTIVE_REFERENCE

Date: 2026-07-03

selectedRouteToken: HOLD_PENDING_MINERU_PACKAGE_INSTALL_AUTHORIZATION

modelSourceRoute: modelscope

## Purpose

Record the R21 worker readiness decision for MinerU ModelScope pipeline cache preparation after local command discovery. The matrix preserves the blocker route without installing packages or claiming parser/runtime readiness.

## Target / Source

Target surface: MSEA-R21-T1 reviewer/dispatcher decision support.

Source authority: the R21 baseline and work order, active session continuity, pinned MinerU source mirror, and secret-safe local command/config metadata.

## Scope / Applies To

Applies to the immediate post-R21 decision on whether CVF can proceed to ModelScope pipeline cache preparation. It does not apply to parser smoke execution, OCR/VLM selection, Docker or service deployment, public-sync, production readiness, or legal use-case quality.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
| MinerU supports ModelScope as an explicit model-source environment value. | `.private_reference/source_mirrors/opendatalab__MinerU/docs/en/usage/model_source.md` | lines 12-14 | `MINERU_MODEL_SOURCE` | model-source usage documentation | ACCEPT |
| MinerU exposes model download through a console script. | `.private_reference/source_mirrors/opendatalab__MinerU/pyproject.toml` | line 133 | `mineru-models-download` | project scripts | ACCEPT |
| MinerU model download CLI supports source and model type options. | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/models_download.py` | lines 91-117 | `download_models` | `download_models` | ACCEPT |
| MinerU config path uses environment override or user-home default. | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/utils/models_download_utils.py` | lines 23-28 | `get_tools_config_file_path` | config path helper | ACCEPT |
| Local shell lacks the MinerU download command. | local PowerShell command discovery | R21 worker command evidence | `mineru-models-download` | local command discovery | ACCEPT |

## Read-Only Local Metadata

| Item | Evidence | Readiness effect |
|---|---|---|
| command availability | `MINERU_MODELS_DOWNLOAD=MISSING` | cache-prep cannot run in R21 |
| Python availability | Python 3.11.9 found | insufficient because MinerU CLI is absent |
| `MINERU_MODEL_SOURCE` | unset | no conflicting environment override |
| `MINERU_TOOLS_CONFIG_JSON` | unset | default config path applies |
| default config path | `C:\Users\DELL\mineru.json` absent | no config writeback receipt exists |

## Route Decision Matrix

| Route token | Condition | Current evidence | Decision |
|---|---|---|---|
| OPEN_MSEA_R22_LOCAL_PIPELINE_RUNTIME_SMOKE_WORK_ORDER | MinerU download CLI exists and ModelScope pipeline cache-prep succeeds. | Not satisfied; CLI missing and command not run. | HOLD |
| HOLD_PENDING_MINERU_PACKAGE_INSTALL_AUTHORIZATION | CLI is missing or would require package install/activation. | Satisfied; `mineru-models-download` missing. | SELECTED |
| HOLD_PENDING_MODELSCOPE_DOWNLOAD_DIAGNOSTIC | CLI exists but the one allowed download attempt fails. | Not evaluated because CLI missing. | HOLD |
| HOLD_PENDING_CONFIG_WRITEBACK_REVIEW | CLI succeeds but config writeback evidence is unclear. | Not evaluated because command not run. | HOLD |
| HOLD_ALL_MINERU_RUNTIME_LANES | Operator declines package activation/install and no further route is authorized. | Available reviewer option after this blocker. | HOLD_OPTION |

## ModelScope Cache Preparation Posture

| Dimension | Posture | Evidence |
|---|---|---|
| model source | modelscope selected for test-first route | operator selection after R20 |
| model type | pipeline only | R21 work order and upstream CLI option |
| cache prep | not run | command missing |
| config writeback | no receipt | config file absent and command not run |
| package lifecycle | blocked | R21 forbids install |
| parser runtime | blocked | fresh runtime smoke work order required |

## External Absorption Core

External absorption core: REQUIRED

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `.private_reference/source_mirrors/opendatalab__MinerU` |
| Enumeration command | N/A with reason: R21 reuses the pinned source mirror and does not claim a new full mirror enumeration. |
| Manifest artifact or inline manifest | inline manifest in source verification and route matrix tables |
| Processing ledger artifact or inline ledger | inline ledger in local metadata and route matrix tables |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | worker return owns command evidence; this matrix owns route decision support |
| Unresolved items | no source unresolved item; local CLI missing remains an environment blocker |
| Completion claim boundary | route decision only; no source import, package install, parser runtime, extraction output, or production claim |

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MinerU model-source docs | ModelScope is a documented source. | DOCTRINE_ADAPTED | MSEA-R21 readiness decision | keep selected model source as modelscope | no runtime claim |
| MinerU console script metadata | Download command is package-provided. | PACKAGE_CANDIDATE | possible next work order | authorize package install or activation separately | install blocked here |
| MinerU download CLI | Pipeline model download is a runtime-precondition command. | RUNTIME_CANDIDATE | possible later runtime smoke | run only after CLI exists | parser still blocked |
| Checker source read-ahead | Matrix needs explicit conversion lanes and route evidence. | CHECKER_CANDIDATE | worker output shape | keep matrix literal-safe | no checker implementation |
| Direct source import | Not required for CLI discovery. | REJECT_DIRECT_IMPORT | governance boundary | do not import source | source import blocked |
| Candidate Group A documents | No document body needed for package prerequisite. | NO_PACKAGE_OR_RUNTIME_VALUE | privacy boundary | keep documents private | no document processing |

## Rescan Intelligence Hardening

- Original source artifact: R21 baseline and work order.

- Predecessor intake artifact: MSEA-R20-T1 readiness matrix.

- Delta ledger status: COMPLETE_WITH_DECLARED_LIMITS

- Routing matrix status: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

- Semantic sampling status: COMPLETE_WITH_DELTA_ROUTING_SAMPLE

- Rescan intelligence verdict: COMPLETE_WITH_DECLARED_LIMITS

### Original-Intake Delta Ledger

| Delta category | Source claim | R21 check | Disposition |
|---|---|---|---|
| UNCHANGED_FROM_INTAKE | ModelScope is an available source route. | Source docs still support ModelScope. | retained |
| CHANGED_DISPOSITION | R20 held for operator choice. | Operator selected ModelScope; local CLI missing. | changed to install/activation blocker |
| NEW_FINDING | Local command is absent. | PowerShell command discovery returned missing. | blocker route |
| REMOVED_OR_REJECTED | Parser smoke cannot follow immediately. | Cache-prep command did not run. | rejected for this tranche |

### Follow-Up Routing Matrix

| Routing lane | Candidate | Disposition |
|---|---|---|
| DO_NOW | reviewer accepts R21 blocker evidence | allowed |
| SEPARATE_RUNTIME_TRANCHE | parser smoke after cache prep | held |
| STRATEGIC_OPERATOR_DECISION | whether to authorize package install or activation | open |
| OUT_OF_SCOPE | public-sync, legal advice quality, production chain | rejected |
| RESOLVED_BY_DESIGN | no document body read in cache-prep gate | resolved |

### Semantic Sampling / Adversarial Review

| sampleId | source section | source claim | disposition checked | adversarial challenge | verdict |
|---|---|---|---|---|---|
| R21-S1 | R21 work order command gate | run command only if it already exists | hold selected | Could Python availability be enough? | BLOCKED because CLI is missing |
| R21-S2 | MinerU source docs | config writeback occurs after download | no receipt | Could absent config prove failure? | NO; command never ran |
| R21-S3 | privacy boundary | Candidate Group A remains private | preserved | Could runtime prep need document bodies? | NO; not for CLI discovery |

## Corpus Completeness And Report Integrity

- Corpus task class: READINESS_MATRIX_ONLY

- Corpus root: N/A with reason: no corpus processing or source-document inventory is claimed.

- Snapshot time: 2026-07-03T00:00:00Z

- Enumeration command: `rg --files --hidden --no-ignore` not run because this matrix does not claim corpus coverage.

- Manifest artifact or inline manifest: inline route matrix only.

- Manifest hash: N/A with reason: no corpus manifest generated.

- Processing ledger artifact or inline ledger: inline ledger in route decision and local metadata tables.

- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE

- Reconciliation: manifest=route decision matrix; ledger_terminal=COMPLETE_WITH_DECLARED_LIMITS; exclusions=all document-body and runtime processing; unresolved=0

- Unresolved files: 0

- Declared exclusions: Candidate Group A document bodies, parser/OCR/VLM/API/service execution, package install, public-sync, and extraction outputs.

- Unreadable or unsupported files: none encountered within allowed scope.

- Aggregation check: no aggregate corpus count claimed.

- Drift check: no source mirror refresh performed.

- Output traceability: matrix traces to R21 worker return and local command metadata.

- Adversarial verification: tested whether Python availability can substitute for the MinerU console script; it cannot under R21.

- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Epistemic Process Block

### Expected Result

The readiness matrix should open a runtime smoke route only if the MinerU download CLI exists and cache-prep can complete within R21 authority.

### Evidence Comparison

| Evidence class | Evidence | Result |
|---|---|---|
| Source-positive | MinerU has a documented ModelScope/pipeline download route. | route is valid in source |
| Local-negative | Required download CLI is missing. | cache-prep cannot run |
| Authority-negative | Package install is not authorized in R21. | no install workaround |

### Contradiction Or Gap Disposition

There is no source contradiction. The current gap is local package/CLI availability.

### Claim Update

The matrix selects `HOLD_PENDING_MINERU_PACKAGE_INSTALL_AUTHORIZATION` and keeps runtime smoke held.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex acting as delegated worker |
| Provider or surface | Local PowerShell, git, rg, Python, apply_patch |
| Session or invocation | MSEA-R21-T1 companion matrix, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | source reads; checker reads; local command/env/config metadata checks; artifact writing |
| Target paths | this readiness matrix; `docs/reviews/CVF_MSEA_R21_T1_MINERU_MODELSCOPE_TEST_CACHE_PREPARATION_AND_RUNTIME_SMOKE_GATE_WORKER_RETURN_2026-07-03.md` |
| Allowed scope source | R21 GC-018 baseline and work order after session-sync commit `b7f8dd0c` |
| Before status evidence | `git rev-parse --short HEAD` returned `b7f8dd0c`; clean worktree before worker writes |
| After status evidence | two authorized worker output artifacts expected before reviewer acceptance |
| Diff evidence | `git diff --name-status` and `git status --short` to be rerun after artifact creation |
| Approval boundary | operator requested R21 worker execution |
| Claim boundary | route decision only; no runtime, package install, source import, public-sync, or production claim |
| Agent type | worker |
| Invocation ID | `msea-r21-t1-readiness-matrix-2026-07-03` |
| Expected manifest | two authorized worker output artifacts |
| Actual changed set | this readiness matrix; R21 worker return |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename performed |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | R21 route readiness after local command discovery |
| claimDisposition | CLAIM_REJECTED: no execution-control, parser runtime, mandatory wrapper, provider governance, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT - no runtime receipt exists because no runtime command ran |
| actionEvidence | ACTION_EVIDENCE_PRESENT - local command discovery and config metadata checks were performed |
| invocationBoundary | route matrix and local metadata only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, or adapter interception claim is made |
| claimLanguage | hold route and prerequisite decision only |
| forbiddenExpansion | no package install, source import, parser/OCR/VLM/API/router/Gradio/Docker/WSL/service execution, document body read, extraction output, public-sync, schema/writer/adapter/checker implementation, model-router, action-authority, legal advice, current-law, production, or workflow-chain claim |

## Claim Boundary

This matrix records only that ModelScope remains the selected test-first source but local cache preparation cannot proceed because the required MinerU CLI is missing and package install is outside R21 authority.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: local private CVF testing only; no public-sync export or redistribution is authorized.
