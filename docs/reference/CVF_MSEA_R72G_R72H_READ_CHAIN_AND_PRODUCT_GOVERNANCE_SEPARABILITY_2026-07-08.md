# CVF MSEA-R72G/R72H Read Chain And Product/Governance Separability

Memory class: governed-reference-evidence
Status: ACCEPTED_PENDING_REVIEW
Batch ID: MSEA_R72G_R72H_READ_CHAIN_AND_SEPARABILITY
executionBaseHead: b896cc759

## Purpose

Record the R72G/R72H evidence needed to finish the governance refactor coverage gap without implementing any new gate, package, guide rewrite, public release, or runtime behavior.

## Scope / Applies-To

This artifact applies only to R72G/R72H documentation evidence in the private provenance workspace. It does not apply to public-sync, product extraction, hosted claims, runtime behavior, checker behavior, hook behavior, or production packaging.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| R72G owns the human/operator onboarding and bus-factor risk | EXISTS | docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md | line 244 | `R72G` | R72 roadmap Work Plan | ACCEPT |
| R72H owns the product/governance separability assessment | EXISTS | docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md | line 245 | `R72H` | R72 roadmap Work Plan | ACCEPT |
| Product candidate `cvf-web` has measurable local file surface | COMMAND_EVIDENCE | PowerShell command output | `(rg --files EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web | Measure-Object).Count` returned 835 | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` | repository file tree | ACCEPT |
| Direct checker script count has measurable governance surface | COMMAND_EVIDENCE | PowerShell command output | `(rg --files governance/compat -g "check_*.py" | Measure-Object).Count` returned 186 | `governance/compat/check_*.py` | repository file tree | ACCEPT |
| EXTENSIONS contains distinct product and ecosystem candidate surfaces | COMMAND_EVIDENCE | PowerShell command output | `Get-ChildItem EXTENSIONS -Directory` returned named CVF product/ecosystem directories | `EXTENSIONS` | repository file tree | ACCEPT |

## R72G Read-Chain Burden Table

| Read surface | Current role | Operator minimum? | Agent governed startup? | Disposition |
| --- | --- | --- | --- | --- |
| CVF_SESSION_MEMORY.md | Compact continuity front door | YES | YES | Keep as operator summary and agent startup anchor. |
| CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json | Compact machine-readable state | YES | YES | Keep for quick status and next-move readout. |
| CVF_SESSION/ACTIVE_SESSION_STATE.json | Complete canonical state registry | NO | YES | Operator can skip unless resolving drift; agent must read for governed work. |
| AGENT_HANDOFF_V39_2026-07-08.md | Active detailed handoff | CONDITIONAL | YES | Operator needs only if deciding next tranche; agent needs before work. |
| docs/reference/guard_orientation/README.md | Guard routing index | NO | YES | Operator-facing summary should cite outcome, not require full read. |
| docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md | Artifact formatting hazard list | NO | YES | Agent/tooling burden; should not be part of ordinary operator onboarding. |
| docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md | Governance lifecycle control index | CONDITIONAL | YES | Operator reads when deciding retire/keep/widen; agent reads for governance changes. |
| DESIGN.md | UI/Web visual contract | CONDITIONAL | CONDITIONAL | Required only for UI/Web/dashboard work. |

## R72G Tiered Guide Proposal

| Tier | Audience | Content | Protected control preserved |
| --- | --- | --- | --- |
| Operator quick path | Human operator deciding next move | current mode, latest material commit, dirty paths, next allowed move, explicit operator checkpoints | source verification preserved by linking to governed artifacts, not rewriting facts |
| Agent governed path | Codex/Claude worker, reviewer, or closer | mandatory startup files, active handoff, guard orientation, literal gotchas, applicable work order, applicable checker source | public/private boundary, no-commit separation, closure evidence preserved |
| Maintainer deep path | Governance maintainer changing rules/checkers | GCI, relevant checker source, ADIF entries, roadmap trace, steward preflight, hook chain evidence | protected controls preserved before any lightening or retirement |

R72G recommendation: create a future operator-facing readme or handoff excerpt only after the current R72 series is closed. That future artifact should be informational and must not replace the governed startup chain for agents doing material work.

## R72H Product/Governance Separability Matrix

| Surface | Evidence | Separability class | Candidate future action | Extraction disposition |
| --- | --- | --- | --- | --- |
| EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web | 835 local files under `cvf-web` | PRODUCT_RUNTIME_CANDIDATE | Evaluate as a product-facing web surface in a future product tranche | DO_NOT_EXTRACT_IN_R72H |
| EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER | Directory exists under EXTENSIONS | PRODUCT_INTERFACE_CANDIDATE | Evaluate as an ecosystem/interface asset in a future source-verified tranche | DO_NOT_EXTRACT_IN_R72H |
| EXTENSIONS/CVF_MODEL_GATEWAY | Directory exists under EXTENSIONS | PRODUCT_INFRA_CANDIDATE | Evaluate after public/private and provider-claim boundaries are rechecked | DO_NOT_EXTRACT_IN_R72H |
| governance/compat | 186 direct `check_*.py` scripts | GOVERNANCE_CONTROL_SURFACE | Keep governed; use GCI/R72F style retirement evidence before any reduction | NOT_PRODUCT_PACKAGE |
| docs/reference/governance_control_index | GCI front door and index exist | GOVERNANCE_MANAGEMENT_SURFACE | Keep as control lifecycle front door | NOT_PRODUCT_PACKAGE |
| docs/baselines, docs/work_orders, docs/reviews | governed execution artifacts | GOVERNANCE_EVIDENCE_SURFACE | Keep private/provenance unless separately exported through public-sync | NOT_PRODUCT_PACKAGE |
| CVF_SESSION and active handoff | session continuity/front door | PRIVATE_CONTINUITY_SURFACE | Keep private; summarize only through allowed handoff/read model | NOT_PRODUCT_PACKAGE |

## R72H Decision

Product assets are separable enough to evaluate in future product tranches, but R72H does not authorize extraction, packaging, public sync, hosted claims, runtime changes, or commercial claims. The clean next step after R72 closure is a fresh product-roadmap decision that selects one product candidate and defines public/private boundary evidence before any mutation.

## Protected Control Preservation

| Protected control | Preservation decision |
| --- | --- |
| Public/private boundary | Product candidates are inventoried only; no public-sync or release path changes. |
| Source verification | All claims cite roadmap, GCI, AGENTS.md, or local command evidence. |
| No-commit plus reviewer separation | Worker output remains pending review until reviewer commit. |
| Closure evidence | Worker return records commands and gates before acceptance. |

## Command Evidence

| Command | Result |
| --- | --- |
| `git rev-parse --short HEAD` | b896cc759 |
| `(rg --files EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web | Measure-Object).Count` | 835 |
| `(rg --files governance/compat -g "check_*.py" | Measure-Object).Count` | 186 |
| `Get-ChildItem EXTENSIONS -Directory` | returned CVF product/ecosystem/foundation candidate directories |
| `rg -n "R72G|R72H|Own human|Own product" docs/roadmaps/CVF_MSEA_R72_EA_ASSESSMENT_INTAKE_AND_GOVERNANCE_LOAD_REBALANCING_ROADMAP_2026-07-07.md` | returned roadmap authority lines |

## Epistemic Process Block

### Expected Result / Prediction

R72G should show that operator onboarding can be shortened without changing the governed agent startup chain. R72H should show whether product surfaces can be evaluated separately without extracting or releasing them.

### Evidence Comparison

The evidence supports a split. Operator-facing quick guidance can summarize the startup chain, while agents still need the full governed read path. Product candidates exist under EXTENSIONS, but governance evidence and session continuity are distinct surfaces that should not be packaged as product assets.

### Contradiction Or Gap Disposition

No contradiction blocks this docs-only evidence output. The remaining gap is implementation authority: any actual guide rewrite, product extraction, packaging, or public release needs a later source-verified tranche.

### Claim Update

Claim narrowed: R72G/R72H prove a separability proposal and read-chain burden model, not an implemented simplification or product release.

## External Knowledge Intake Routing

| Field | Value |
| --- | --- |
| Chain map | docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | EA governance-load critique -> R72 roadmap -> R72G/R72H source-backed evidence |
| Matching local-view guard | governance/compat/check_external_knowledge_intake_routing.py |
| Owner surface | docs/reference/CVF_MSEA_R72G_R72H_READ_CHAIN_AND_PRODUCT_GOVERNANCE_SEPARABILITY_2026-07-08.md |
| Disposition | ADAPT |
| Claim boundary | External critique is not promoted as authority; CVF-governed roadmap and local command evidence control. |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
| --- | --- |
| claimScope | R72G/R72H docs-only evidence matrix. |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, checker-retirement, or public behavior is claimed. |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT |
| actionEvidence | CLAIM_REJECTED_NO_ACTION |
| invocationBoundary | local governed document authoring and source search only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, wrapper, proxy, public repository, checker, hook, or product-package interception claim |
| claimLanguage | records evidence and recommendations only |
| forbiddenExpansion | no runtime/provider/live/public/package/Web/MCP/model-router behavior, merge, push, public-sync mutation, checker edit, hook edit, source/test edit, product extraction, or product release |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex |
| Provider or surface | local workspace |
| Session or invocation | R72G/R72H combined read-chain and separability evidence |
| Working directory | D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF |
| Command or tool surface | PowerShell, apply_patch, git, rg, Python governance checkers |
| Target paths | docs/reference/CVF_MSEA_R72G_R72H_READ_CHAIN_AND_PRODUCT_GOVERNANCE_SEPARABILITY_2026-07-08.md |
| Allowed scope source | operator request and R72 roadmap R72G/R72H rows |
| Before status evidence | clean worktree; HEAD b896cc759 |
| After status evidence | combined reference matrix added pending review |
| Diff evidence | `git diff --name-status`; `git status --short` |
| Approval boundary | WORKER_MUST_NOT_COMMIT worker output; reviewer/closer commit only |
| Claim boundary | evidence only; no implementation or public/runtime/provider behavior |
| Agent type | Codex |
| Invocation ID | r72g-r72h-read-chain-and-separability-2026-07-08 |
| Expected manifest | combined reference matrix |
| Actual changed set | combined reference matrix |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance R72G/R72H evidence artifact; it does not mutate public-sync or publish public artifacts.

## Claim Boundary

This artifact records R72G/R72H evidence and recommendations only. It does not implement guide rewrites, checker edits, hook changes, runtime/source/test changes, public-sync changes, product extraction, product packaging, provider/live proof, merge, push, or public/production claims.
