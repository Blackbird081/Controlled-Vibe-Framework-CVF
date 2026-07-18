# CVF MSEA-R10 MinerU Adapter Contract Draft

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-03

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference adapts accepted MSEA owner
surfaces into contract vocabulary. It does not compare empirical runtime
claims, assert provider behavior, or update a truth claim.

## Purpose

Define a CVF-owned, documentation-only MinerU adapter contract draft that a
future authorized tranche can use as source-verification vocabulary. The draft
connects MSEA-R7 receipt artifact and field families to MSEA-R9 application
route readiness while preserving runtime, provider, S3, RAG, Docker, package,
checker, schema implementation, receipt-writer code, adapter implementation,
public-sync, document-truth, extraction-accuracy, and production work as held.

## Scope / Applies To

Applies to future CVF GC-018 baselines, work orders, reviews, and references
that need to discuss a potential MinerU adapter contract without claiming that
CVF has implemented or executed an adapter.

Does not apply to runtime implementation, parser execution, OCR/VLM/hybrid
execution, model download, API/router/Gradio startup, Docker build/run,
provider/live proof, S3 connection, credential handling, RAG index write,
source import, package activation, checker implementation, schema
implementation, receipt-writer code, public-sync, document-truth verification,
extraction-accuracy certification, benchmark, model-router behavior, action
authority, automatic invocation, or production readiness.

## Source Authority

| Authority | Source | Contract use | Disposition |
|---|---|---|---|
| Document extraction claim boundary | `docs/reference/CVF_MSEA_T2_DOCUMENT_EXTRACTION_CLAIM_BOUNDARY_RECEIPT_QUALITY_AND_RAG_HANDOFF_ADVISORY_2026-06-28.md` | claim boundary, receipt, quality, RAG handoff vocabulary | ACCEPT |
| Upstream owner-surface delta | `docs/reference/CVF_MSEA_R4_MINERU_UPSTREAM_OWNER_SURFACE_DELTA_2026-07-02.md` | CLI/API/Docker runtime and package holds | ACCEPT |
| Deep document-layer delta | `docs/reference/CVF_MSEA_R5_MINERU_DEEP_DOCUMENT_LAYER_SCAN_OWNER_SURFACE_DELTA_2026-07-02.md` | receipt-schema, RagFlow, provider, S3, Docker holds | ACCEPT |
| Route decision matrix | `docs/reference/CVF_MSEA_R6_MINERU_APPLICATION_ROUTE_DECISION_MATRIX_2026-07-02.md` | concrete reopen conditions for runtime/RAG/provider/S3/checker alternatives | ACCEPT |
| Receipt schema contract draft | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | receipt artifact families, field families, backend variant boundary | ACCEPT |
| Residual repository closure ledger | `docs/reference/CVF_MSEA_R8_MINERU_RESIDUAL_FULL_REPOSITORY_ABSORPTION_CLOSURE_LEDGER_2026-07-02.md` | residual corpus closure, package/runtime candidate enrichment | ACCEPT |
| Application blueprint and readiness | `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md` | selected route and application blueprint layers | ACCEPT |
| Pinned MinerU source mirror | `.private_reference/source_mirrors/opendatalab__MinerU/` at commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` with 425 files | advisory source input only | ADVISORY_ONLY |

## Contract Class

| Field | Contract value |
|---|---|
| contractKind | documentation/reference adapter contract draft |
| selectedRoute | `OPEN_ADAPTER_CONTRACT_DRAFT_ONLY` |
| runtimeExecutionAuthorized | false |
| schemaImplementationAuthorized | false |
| receiptWriterAuthorized | false |
| adapterImplementationAuthorized | false |
| publicSyncAuthorized | false |
| implementationPrerequisite | fresh GC-018, source verification, and live/provider proof when governance behavior is claimed |

## Adapter Contract Boundary

This draft defines what a future adapter contract would need to name and refuse
to claim. It does not define Python interfaces, JSON schema, executable
receipts, parser calls, router wiring, package registration, or runtime tests.

| Contract dimension | Required future evidence | Current R10 disposition |
|---|---|---|
| source file identity | future authorized receipt or storage boundary | vocabulary only |
| parser/backend identity | future authorized route decision and control envelope | vocabulary only |
| artifact manifest | future authorized extraction receipt | vocabulary only |
| quality status | future authorized quality report or successor | vocabulary only |
| downstream-use status | future authorized handoff packet | vocabulary only |
| source pointers | future authorized extraction chunks | vocabulary only |
| privacy route | future authorized security/review packet | held |
| human review | future review packet | held |

## Receipt Family Obligations

| CVF receipt family | Contract obligation | Source basis | Current status |
|---|---|---|---|
| Visual layout debug artifact | A future adapter contract must distinguish layout visualization from correctness proof. | MSEA-R7 visual layout debug artifact | contract vocabulary only |
| Visual span debug artifact | A future adapter contract must mark span debug output as human-review support, not extraction truth. | MSEA-R7 visual span debug artifact | contract vocabulary only |
| Raw model-inference artifact | A future adapter contract must classify raw model output as low-level evidence requiring quality disposition. | MSEA-R7 raw model-inference artifact | contract vocabulary only |
| Intermediate hierarchical artifact | A future adapter contract must preserve page/block/line/span hierarchy and backend/version identity. | MSEA-R7 intermediate hierarchical artifact | contract vocabulary only |
| Flattened reading-order artifact | A future adapter contract must preserve reading-order sequence and content-type boundaries. | MSEA-R7 flattened reading-order artifact | contract vocabulary only |
| Structured page-grouped artifact | A future adapter contract must treat the V2 page-grouped output as development-version vocabulary until a later schema tranche stabilizes it. | MSEA-R7 structured page-grouped artifact | contract vocabulary only |
| Primary Markdown output | A future adapter contract must treat Markdown as rendered output, not source truth. | MSEA-R7 primary Markdown output | contract vocabulary only |

## Field Family Obligations

| Field family | Contract obligation | Non-claim |
|---|---|---|
| Source identity | record input identity only when an authorized receipt exists | does not prove source truth |
| Backend identity | record parser/backend/version only after route authorization | does not authorize backend execution |
| Page locator | preserve page-level provenance | does not certify page segmentation |
| Block type | preserve content classification | does not certify classification correctness |
| Reading-order position | preserve ordering evidence | does not certify reading order |
| Geometry locator | preserve bounding-box evidence | does not certify layout accuracy |
| Textual or structured content | preserve extracted payload and type-specific content | does not certify OCR/table/formula correctness |
| Heading-level marker | preserve heading/body distinction | does not certify semantic hierarchy |
| Caption/footnote association | preserve auxiliary text association | does not certify association correctness |
| Structural sub-type | preserve finer block classification where present | does not certify schema completeness |

## Backend Variant Boundary

Any future adapter contract must carry backend identity before interpreting
artifact shape. MSEA-R7 shows pipeline and VLM outputs differ in raw model
artifact shape, list/code block handling, discarded-block visibility,
coordinate normalization, and development-version V2 output behavior.

Current R10 disposition: record this as a contract obligation only. No backend
is executed, installed, selected for runtime, or validated by this reference.

## Application Route Binding

| Application layer | Contract binding | Held boundary |
|---|---|---|
| Document extraction receipt | Bind R7 receipt families and field families to future receipt evidence. | no schema implementation or receipt writer |
| Deep document/layer scan | Require layout/span/block evidence to remain traceable to receipt families. | no parser execution or model download |
| RAG handoff boundary | Require receipt evidence, quality disposition, and allowed downstream-use status before ingestion. | no RAG index write or plugin wiring |
| Runtime/parser adapter | Preserve local parser route as a future runtime tranche only. | no install, execution, API/router/Gradio startup, or live proof |
| Provider-assisted correction | Preserve LLM-assisted title correction as a future provider/live tranche only. | no provider call or credential use |
| Storage credential boundary | Preserve remote storage as a future credential-handling tranche only. | no S3 connection or credential storage |
| Checker candidate | Preserve overclaim checker candidates behind repeated-miss or authorized RAG-ingestion conditions. | no checker implementation or hook wiring |

## Held Lanes And Reopen Conditions

| Held lane | Concrete reopen condition | Forbidden until reopened |
|---|---|---|
| Runtime/parser adapter | operator names a concrete downstream use case requiring MinerU document parsing; fresh GC-018 authorizes model download, execution, and live/provider proof | install, model download, execution, API/router/Gradio/server startup, provider/live proof |
| Provider-assisted correction | operator names a concrete downstream use case requiring LLM-assisted title correction; fresh GC-018 authorizes provider/live proof boundary | live call to OpenAI-compatible client, credential provisioning |
| RAG handoff adapter | operator names a concrete downstream RAG use case; fresh GC-018 authorizes RAG index write and adapter execution | RAG index write, plugin wiring, adapter execution |
| Storage credential boundary | operator names a concrete downstream use case requiring remote S3-compatible storage; fresh GC-018 authorizes credential-handling boundary | live S3 connection, credential storage, remote IO |
| Docker/package lane | operator names a concrete deployment target and hardware profile; fresh GC-018 authorizes Docker build/run and package-lane registration | Docker build/run, package activation, registry mutation |
| Checker candidate | two or more real overclaim misses not caught by existing gates, or authorized RAG ingestion tranche | checker implementation, hook wiring |

## Future Implementation Prerequisites

A future implementation tranche must provide all of the following before any
runtime or adapter behavior can be claimed:

| Prerequisite | Reason |
|---|---|
| fresh GC-018 and source-verified work order | R10 is documentation/reference only |
| runtime route and privacy/security boundary | MinerU has local, VLM, hybrid, remote, API, and Docker surfaces |
| model lifecycle and storage plan | model download and local model source are candidate-only |
| secret-safe provider/S3 diagnostic plan when applicable | provider and S3 paths require credentials |
| receipt schema implementation work order | R10 does not implement schema fields |
| receipt-writer code work order | R10 does not write receipt instances |
| live/provider proof when governance behavior is claimed | required by CVF live proof standard |
| public/provenance boundary review | no public-sync is authorized here |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | MinerU source mirror plus accepted MSEA owner surfaces -> CVF-owned adapter contract draft reference -> future implementation only by fresh authorization |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this reference |
| Disposition | ADAPT high-value MinerU receipt and route doctrine into CVF-owned adapter contract language |
| Claim boundary | documentation/reference-only draft; no runtime, provider/live, S3, RAG, Docker, package, checker, source import, schema implementation, receipt-writer code, adapter implementation, public-sync, or production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `https://github.com/opendatalab/MinerU.git` at `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`; local mirror `.private_reference/source_mirrors/opendatalab__MinerU/`; accepted MSEA-T2/R4/R5/R6/R7/R8/R9 evidence |
| Enumeration command | `rg --files --hidden --no-ignore .private_reference/source_mirrors/opendatalab__MinerU -g '!**/.git/**'` |
| Manifest artifact or inline manifest | `.private_reference/source_mirrors/INDEX.md` row `opendatalab__MinerU` |
| Processing ledger artifact or inline ledger | this reference and paired worker return |
| Ledger terminal statuses | READ, SOURCE_VERIFIED, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, SKIPPED_WITH_REASON, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | MSEA-T2/R4/R5/R6/R7/R8/R9 owner surfaces |
| Unresolved items | none in this reference scope |
| Completion claim boundary | adapter contract draft only; no runtime/provider/public/package/checker/source-import/schema/receipt-writer/adapter expansion |

ledger_terminal=READ for accepted MSEA owner surfaces; ledger_terminal=SOURCE_VERIFIED for source mirror commit/count; ledger_terminal=ADAPTED for this contract draft; ledger_terminal=DEFERRED for held runtime/provider/RAG/S3/Docker/package/checker routes; ledger_terminal=REJECTED for direct upstream import; ledger_terminal=NO_NEW_VALUE for already-owned evidence.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MSEA-R7 receipt artifact and field vocabulary | receipt families, field families, backend boundary | DOCTRINE_ADAPTED | this reference | record adapter contract obligations | no schema implementation or receipt writer |
| MSEA-R9 blueprint/readiness route | selected docs-only adapter contract route | DOCTRINE_ADAPTED | this reference | bind route readiness to contract sections | no adapter implementation |
| R4/R5/R8 runtime/provider/S3/Docker/RAG evidence | held candidate surfaces and reopen conditions | RUNTIME_CANDIDATE | held-lane section | preserve holds | no install, model download, parser run, provider call, S3 connection, Docker build/run, RAG write, or source import |
| R4/R8 Docker/deployment evidence | deployment recipes and hardware variant evidence | PACKAGE_CANDIDATE | held-lane section | preserve package/deployment hold only | no Docker build/run or package activation |
| MSEA-T3/R6 checker candidate evidence | future overclaim guard candidates | CHECKER_CANDIDATE | future implementation prerequisites | preserve no-checker-now | no checker implementation or hook wiring |
| Direct MinerU upstream code | source mirror is advisory input only | REJECT_DIRECT_IMPORT | source authority boundary | reject copy/import | no direct import |
| Already-owned predecessor evidence | route, receipt, and held-lane facts are already owned | NO_PACKAGE_OR_RUNTIME_VALUE | prior MSEA owner surfaces | cite rather than duplicate | no runtime or package behavior |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| Receipt artifact and field vocabulary | MSEA-T2 advisory and MSEA-R7 receipt contract draft | ENRICH_EXISTING | R10 converts receipt vocabulary into adapter contract obligations | adapt |
| Application route readiness | MSEA-R6 route decision and MSEA-R9 readiness reference | ENRICH_EXISTING | R10 binds readiness to contract sections | adapt |
| Adapter contract draft owner surface | `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md` | NEW_FINDING | R10 creates the first adapter contract draft reference | create this reference |
| Runtime/provider/S3/Docker/RAG/package/checker candidates | MSEA-R4/R5/R6/R8/R9 held-lane surfaces | CONFIRMED_EXISTING | R10 preserves holds rather than reopen execution | defer |
| Direct upstream implementation | external absorption core standard and source mirror index | REJECT_DIRECT_IMPORT | no direct import allowed | reject import |
| Binary/resource corpus limits | MSEA-R8 residual ledger | NO_NEW_VALUE | R10 does not reopen binary/content interpretation | cite R8 |

## Source Mirror Migration Control

| Field | Disposition |
|---|---|
| Legacy source path | Legacy MinerU adapter folder remains secondary historical material only |
| Source mirror path | `.private_reference/source_mirrors/opendatalab__MinerU/` |
| Mirror index row | `.private_reference/source_mirrors/INDEX.md` row `opendatalab__MinerU` |
| Pinned upstream commit | `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` |
| Migration disposition | MIGRATED_TO_SOURCE_MIRROR |
| Legacy cleanup disposition | LEGACY_REFERENCE_ONLY_WITH_REASON: historical comparison only; source facts prefer pinned mirror or governed MSEA artifacts |
| Claim boundary | source-mirror authority control only; no runtime, install, package activation, provider/live proof, public-sync, checker implementation, source import, schema implementation, receipt-writer code, adapter implementation, or production-readiness claim |

## Corpus Completeness And Report Integrity

- Corpus task class: adapter contract drafting from accepted MinerU absorption evidence.
- Corpus root: `.private_reference/source_mirrors/opendatalab__MinerU/` plus accepted MSEA governed artifacts.
- Snapshot time: 2026-07-03 worker execution session.
- Enumeration command: `rg --files --hidden --no-ignore .private_reference/source_mirrors/opendatalab__MinerU -g '!**/.git/**'` returned `425` files.
- Manifest artifact or inline manifest: `.private_reference/source_mirrors/INDEX.md` plus MSEA-R8 residual closure ledger.
- Manifest hash: source mirror commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`.
- Processing ledger artifact or inline ledger: this reference plus paired worker return.
- Allowed terminal statuses: READ, SOURCE_VERIFIED, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, SKIPPED_WITH_REASON, BLOCKED_UNREADABLE, BLOCKED_WITH_REASON.
- ledger_terminal=READ for accepted MSEA owner surfaces; ledger_terminal=SOURCE_VERIFIED for source mirror commit/count; ledger_terminal=ADAPTED for this contract draft; ledger_terminal=DEFERRED for held runtime/provider/RAG/S3/Docker/checker routes; ledger_terminal=REJECTED for direct upstream import; ledger_terminal=NO_NEW_VALUE for already-owned evidence.
- Reconciliation: manifest=425 source-mirror files; ledger_terminal=READ/SOURCE_VERIFIED/ADAPTED/DEFERRED/REJECTED/NO_NEW_VALUE/SKIPPED_WITH_REASON/BLOCKED_UNREADABLE for cited artifacts; exclusions=0; unresolved=0.
- Unresolved files: 0 for this reference scope.
- Declared exclusions: no new source files are excluded; R10 does not claim a new full-file corpus pass.
- Unreadable or unsupported files: none introduced by R10; binary/content limits remain owned by MSEA-R8.
- Aggregation check: PASS: R10 uses accepted MSEA owner surfaces and source mirror index.
- Drift check: PASS: mirror commit/count match `.private_reference/source_mirrors/INDEX.md`.
- Output traceability: each contract section traces to MSEA owner surfaces or source mirror facts.
- Adversarial verification: contract distinguishes docs-only vocabulary from runtime readiness, schema implementation, adapter implementation, document truth, extraction accuracy, and production readiness.
- Corpus verdict: PARTIAL

## Rescan Intelligence Hardening

- Original source artifact: `https://github.com/opendatalab/MinerU.git` at `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`, mirrored at `.private_reference/source_mirrors/opendatalab__MinerU/`
- Predecessor intake artifact: `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md`
- Delta ledger status: PRESENT
- Routing matrix status: PRESENT
- Semantic sampling status: PRESENT
- Rescan intelligence verdict: PARTIAL

| Prior intake claim | R10 treatment | Delta category | Evidence |
|---|---|---|---|
| MSEA-R8 closed residual repository accounting | reuse accepted corpus closure rather than reopen full scan | UNCHANGED_FROM_INTAKE | MSEA-R8 residual ledger |
| R9 selected docs-only adapter contract route | convert into actual draft reference | CHANGED_DISPOSITION | MSEA-R9 reference |
| R7 receipt vocabulary exists | adapt into contract obligations | CHANGED_DISPOSITION | MSEA-R7 reference |
| Adapter contract draft did not yet exist as an owner surface | create this reference | NEW_FINDING | this reference |
| Runtime/provider/S3/RAG/Docker/package/checker routes remain held | preserve as held lanes | REMOVED_OR_REJECTED | R4/R5/R6/R8/R9 boundaries |

| Route lane | R10 handling | Boundary |
|---|---|---|
| DO_NOW | create adapter contract draft reference | docs/reference only |
| RESOLVED_BY_DESIGN | no runtime route is needed for docs-only draft | no runtime proof |
| SEPARATE_RUNTIME_TRANCHE | runtime/provider/RAG/S3/Docker/package/checker routes remain held | fresh GC-018 and live/provider proof if behavior is claimed |
| STRATEGIC_OPERATOR_DECISION | operator may later choose a concrete runtime/product route | outside R10 |
| OUT_OF_SCOPE | install, execution, provider call, source import, public-sync, checker implementation | forbidden |

## Explicit Non-Claims

This reference does not claim:

- CVF has implemented a MinerU adapter contract;
- CVF has implemented a schema or receipt writer;
- MinerU has been installed, executed, or made production-ready;
- any parser, OCR, table, formula, layout, or VLM output is accurate;
- any extracted text represents document truth;
- RAG/context ingestion is authorized;
- provider/S3 credentials may be used;
- Docker/package deployment is active;
- checker implementation is authorized.

## Claim Boundary

This adapter contract draft records only CVF-owned documentation/reference
language derived from accepted MSEA owner surfaces and the pinned MinerU source
mirror. It does not authorize or claim MinerU runtime integration, parser
execution, OCR execution, VLM/hybrid backend routing, remote backend processing,
model download, API/router/Gradio service, Docker deployment, RAG indexing,
provider/live proof, S3 access, credential handling, document truth
verification, parser accuracy, table/formula correctness, public-sync export,
checker enforcement, package activation, certification, generated aggregate
mutation, schema implementation, receipt-writer code, adapter implementation,
production readiness, hosted readiness, model-router behavior, action
authority, or universal document intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference is private provenance documentation derived from private
source-mirror absorption evidence. No public-sync export is authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R10 MinerU adapter contract draft reference |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, provider, parser, adapter, schema, receipt-writer, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local governed documentation authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, daemon, parser, RAG index, or production route interception claim |
| claimLanguage | adapter contract draft documentation and source-backed non-claim boundary only |
| forbiddenExpansion | no MinerU runtime, install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, provider/live call, credentials/S3, RAG write, source import, package activation, checker implementation, public-sync, Web/MCP/model-router/action-authority, automatic invocation, benchmark, document-truth, extraction-accuracy, schema implementation, receipt-writer code, adapter implementation, or production-readiness claim |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated worker role |
| Provider or surface | Codex local workspace |
| Session or invocation | MSEA-R10 adapter contract draft reference, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell, `rg`, source reads, `apply_patch`, governance gates |
| Target paths | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` and paired GC-018 baseline |
| Before status evidence | file did not exist before worker execution |
| After status evidence | one new untracked reference file |
| Diff evidence | `git diff --name-status`; `git status --short` before worker handoff |
| Approval boundary | adapter contract draft documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/schema/receipt-writer/adapter/Web/MCP/model-router/action-authority claim |
| Agent type | worker |
| Invocation ID | `msea-r10-mineru-adapter-contract-draft-reference-2026-07-03` |
| Expected manifest | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` |
| Actual changed set | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |
