# CVF MSEA-R11-T1 MinerU Productization Readiness Route Selection Decision Matrix

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-03

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference records a source-backed route
comparison and selection derived from accepted MSEA owner surfaces; it does
not assert a new empirical runtime, provider, or extraction-accuracy result.

## Purpose

Record the CVF-owned MSEA-R11-T1 candidate route comparison and selected next
roadmap/work-order direction for MinerU document extraction productization
readiness. This reference compares every candidate lane named in the R11
roadmap and the paired work order, selects exactly one next roadmap token or
`HOLD_ALL_PRODUCTIZATION_LANES`, and preserves every runtime, provider, S3,
RAG, Docker, package, checker, schema, receipt-writer, and adapter
implementation lane as held pending a fresh GC-018.

## Scope / Applies To

Applies to any future CVF work that authors a fresh implementation-facing
GC-018 or work order for MinerU document extraction productization. Does not
apply to runtime, package, checker, schema, receipt-writer, adapter, or
public-sync work, all of which require a separate fresh GC-018 and, where
behavior is claimed, live/provider proof.

Does not apply to: MinerU install, model download, parser/OCR/VLM/hybrid/
API/router/Gradio/Docker execution, provider/live call, credentials/S3, RAG
write, source import, package activation, checker implementation, schema
implementation, receipt-writer code, adapter implementation, public-sync,
document-truth, extraction-accuracy, benchmark, or production-readiness
claims.

## Source Authority

| Authority | Source | Disposition |
|---|---|---|
| MSEA-R11 productization readiness roadmap | `docs/roadmaps/CVF_MSEA_R11_MINERU_DOCUMENT_EXTRACTION_PRODUCTIZATION_READINESS_ROADMAP_2026-07-03.md` | ACCEPT |
| MSEA-R10 adapter contract draft | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` | ACCEPT |
| MSEA-R9 application blueprint and adapter contract readiness | `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md` | ACCEPT |
| MSEA-R8 residual full repository absorption closure ledger | `docs/reference/CVF_MSEA_R8_MINERU_RESIDUAL_FULL_REPOSITORY_ABSORPTION_CLOSURE_LEDGER_2026-07-02.md` | ACCEPT |
| MSEA-R7 receipt schema contract draft | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | ACCEPT |
| Pinned MinerU source mirror | `.private_reference/source_mirrors/opendatalab__MinerU/` recomputed at commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` with 425 files | ADVISORY_ONLY |

## Candidate Route Matrix

| Candidate route | Value evidence | Risk / hold reason | Worker disposition |
|---|---|---|---|
| Sample corpus and expected receipt policy | R7 receipt artifact/field family map and R10 adapter contract obligations describe what a receipt must record, but no concrete input corpus or expected-output boundary yet exists to test against; this is the standard prerequisite most future implementation lanes need | Low risk: no runtime, no schema, no writer code; only defines a proof target and a small doc-only policy | **SELECT** |
| Receipt schema implementation | R7/R10 give field-family vocabulary but explicitly state schema types, required/optional status, and validation rules are undefined | Implementing exact types without a concrete sample corpus risks guessing field shapes that a real document would contradict; R10 lists `receipt schema implementation work order` as a distinct future prerequisite, not this tranche | DEFER: prerequisite (sample corpus) not yet satisfied |
| Receipt-writer code | R10 explicitly separates `receipt-writer code work order` from schema implementation as a distinct future step | No runtime receipt is created or consumed yet; writer code without a schema and a sample corpus has nothing concrete to write against | DEFER: two prerequisites (schema, sample corpus) not yet satisfied |
| Local parser runtime pilot | R4/R5/R9 CLI/API/Docker evidence exists, but every predecessor artifact (R9 readiness matrix, R10 held-lane table) marks this `HELD_RUNTIME_CANDIDATE` pending an operator-named use case | Forbidden without fresh GC-018 authorizing model download, execution, and live/provider proof; no operator-named use case exists in this dispatch | **HOLD** - reopen condition not met |
| RAG handoff adapter | T2/R5 RagFlow integration evidence exists, but T2's Central Rule and R9/R10 readiness matrices require receipt evidence and quality disposition before any ingestion | Forbidden until receipt schema and quality disposition exist; selecting this before the sample-corpus/receipt lane would violate the RAG boundary in R11's Design Control Gate | **HOLD** - reopen condition not met |
| Provider-assisted correction | R5 `llm_aided.py` OpenAI-compatible client evidence and R8 `mineru.template.json` config shape exist, but R9/R10 require an operator-named use case and fresh GC-018 for provider/live proof | No operator-named use case in this dispatch; provider/live proof cannot be claimed without a real API call under the CVF live-proof standard | **HOLD** - reopen condition not met |
| S3 storage boundary | R5 `s3.py` evidence and R8 `bucket_info` config shape exist, but R9/R10 require an operator-named use case and a credential plan | No operator-named remote-storage use case exists; credential handling is out of scope for this dispatch | **HOLD** - reopen condition not met |
| Docker/package lane | R4/R8 recorded 9 Docker China hardware variants at command-surface depth, but R9/R10 require a named deployment target and hardware profile | No concrete deployment target or hardware profile is named by the operator in this dispatch | **HOLD** - reopen condition not met |
| Overclaim checker | T3/R6/R9/R10 keep this `HELD_CHECKER_CANDIDATE` pending repeated real overclaim misses or an authorized RAG ingestion tranche | Neither condition is met: no repeated-miss evidence exists and RAG ingestion is not authorized | **HOLD** - reopen condition not met |
| Hold all productization lanes | Would apply only if no candidate had a source-backed value/risk advantage over the others | The sample corpus and expected receipt policy candidate has a clear, low-risk, source-backed advantage (no implementation, only a doc-only proof-target and policy), so a full hold is not justified | REJECTED as the overall outcome; individual runtime/provider/S3/RAG/Docker/checker lanes remain held per their own rows above |

## Selected Route

selectedRouteCandidate: Sample corpus and expected receipt policy

routeSelectionVerdict: `OPEN_SAMPLE_CORPUS_AND_EXPECTED_RECEIPT_POLICY_ROADMAP`

selectedNextRoadmapRecommendation: `OPEN_SAMPLE_CORPUS_AND_EXPECTED_RECEIPT_POLICY_ROADMAP`

## Rationale

The R11 roadmap's own Epistemic Process Block predicted that sample corpus
and expected receipt policy is likely the safest next roadmap because
schema, writer, runtime, and RAG routes all need concrete input/expected-
output boundaries first. The candidate route matrix above confirms this
prediction: every implementation-facing lane (schema, writer, runtime, RAG,
provider, S3, Docker, checker) is either missing a prerequisite that only a
sample corpus and receipt policy tranche can supply, or is explicitly held
behind an operator-named use case that does not exist in this dispatch. The
sample corpus and expected receipt policy route is the only candidate that:

- requires no runtime, schema, writer, or adapter implementation;
- does not touch provider, S3, Docker, RAG, or checker surfaces;
- directly unblocks the schema-or-writer-first decision named in R11's
  Future R11-T1 Work-Order Seed table;
- is fully justified by already-accepted R7/R8/R9/R10 evidence without
  requiring a new operator use case.

This selection does not itself define the sample corpus or the receipt
policy. It only authorizes a future fresh GC-018 and work order to do that
definition work.

## Held Lanes And Reopen Conditions (carried forward)

| Held lane | Concrete reopen condition | Source |
|---|---|---|
| Receipt schema implementation | sample corpus and expected receipt policy tranche completes and supplies concrete field shapes to validate against | this matrix; R10 Future Implementation Prerequisites |
| Receipt-writer code | receipt schema implementation exists | R10 Future Implementation Prerequisites |
| Local parser runtime pilot | operator names a concrete downstream use case requiring MinerU document parsing; fresh GC-018 authorizes model download, execution, and live/provider proof | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| RAG handoff adapter | operator names a concrete downstream RAG use case; fresh GC-018 authorizes RAG index write and adapter execution | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Provider-assisted correction | operator names a concrete downstream use case requiring LLM-assisted title correction; fresh GC-018 authorizes provider/live-proof boundary | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| S3 storage boundary | operator names a concrete downstream use case requiring remote S3-compatible storage; fresh GC-018 authorizes credential-handling boundary | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Docker/package lane | operator names a concrete deployment target and hardware profile; fresh GC-018 authorizes Docker build/run and package-lane registration | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Overclaim checker | two or more real overclaim misses not caught by existing gates, or authorized RAG ingestion tranche | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external repo or copied folder |
| Chain map route | accepted MSEA owner surfaces plus pinned MinerU source mirror -> MSEA-R11 roadmap -> MSEA-R11-T1 route-selection decision matrix |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this reference |
| Disposition | ADAPT: convert accepted MinerU absorption and contract vocabulary into a source-backed route selection |
| Claim boundary | dispatch-only; no runtime/provider/live/S3/RAG/Docker/package/checker/source-import/schema/receipt-writer/adapter implementation/public-sync/production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `https://github.com/opendatalab/MinerU.git` at `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`; local mirror `.private_reference/source_mirrors/opendatalab__MinerU/`; accepted MSEA-T2/R4/R5/R6/R7/R8/R9/R10/R11 evidence |
| Enumeration command | `rg --files --hidden --no-ignore .private_reference/source_mirrors/opendatalab__MinerU -g '!**/.git/**'` returned `425` during worker execution |
| Manifest artifact or inline manifest | `.private_reference/source_mirrors/INDEX.md` row `opendatalab__MinerU` |
| Processing ledger artifact or inline ledger | this reference plus paired worker return |
| Ledger terminal statuses | READ, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | MSEA-T2/R4/R5/R6/R7/R8/R9/R10/R11 owner surfaces |
| Unresolved items | none in this reference scope; every candidate route received a disposition |
| Completion claim boundary | route-selection decision only; no runtime/provider/public/package/checker/source-import/schema/receipt-writer/adapter expansion |

ledger_terminal=READ for accepted MSEA owner surfaces; ledger_terminal=SOURCE_VERIFIED for source mirror commit/count; ledger_terminal=ADAPTED for the selected sample-corpus route; ledger_terminal=DEFERRED for held runtime/provider/RAG/S3/Docker/checker candidates; ledger_terminal=REJECTED for direct upstream import and for the hold-all outcome; ledger_terminal=NO_NEW_VALUE for already-owned absorption facts.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MSEA-R11 roadmap candidate table | productization route candidates and predicted route bias | DOCTRINE_ADAPTED | this decision matrix | select next roadmap token | no implementation |
| MSEA-R10 adapter contract draft held-lane table | held-lane prerequisites and reopen conditions | DOCTRINE_ADAPTED | this decision matrix Held Lanes table | preserve holds until reopened | no adapter implementation |
| MSEA-R7 receipt vocabulary | receipt families and fields lacking concrete sample-corpus grounding | DOCTRINE_ADAPTED | this decision matrix Selected Route rationale | inform future sample-corpus/receipt-policy tranche | no schema implementation |
| MSEA-R8/R9 runtime and package evidence | runtime/provider/S3/Docker/package candidates | RUNTIME_CANDIDATE | held candidate rows | keep demand-gated unless operator names a use case | no install, execution, Docker build/run, or package activation |
| MSEA-T3/R6/R9/R10 checker notes | overclaim checker candidate | CHECKER_CANDIDATE | held candidate row | keep condition-gated | no checker implementation |
| Direct upstream implementation | advisory source only | REJECT_DIRECT_IMPORT | source mirror control | reject direct import | no source import |
| Prior MSEA absorption facts | already-owned evidence | NO_PACKAGE_OR_RUNTIME_VALUE | predecessor owner surfaces | cite only | no runtime/package behavior |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| MSEA-R11-T1 route-selection decision matrix | `docs/roadmaps/CVF_MSEA_R11_MINERU_DOCUMENT_EXTRACTION_PRODUCTIZATION_READINESS_ROADMAP_2026-07-03.md` | ENRICH_EXISTING | converts the roadmap's candidate table into a concrete selected-route decision | create this reference |
| Adapter contract vocabulary | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` | CONFIRMED_EXISTING | used as source input for held-lane rationale | cite |
| Receipt vocabulary | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | CONFIRMED_EXISTING | used as source input for selected-route rationale | cite |
| Runtime/provider/S3/Docker/RAG/package/checker holds | `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md`; `docs/reference/CVF_MSEA_R8_MINERU_RESIDUAL_FULL_REPOSITORY_ABSORPTION_CLOSURE_LEDGER_2026-07-02.md` | CONFIRMED_EXISTING | preserved as held lanes with no reopen condition met | defer |
| Direct upstream implementation | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md`; `.private_reference/source_mirrors/INDEX.md` | REJECT_DIRECT_IMPORT | direct import remains forbidden | reject |

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

## Explicit Non-Claims

This reference does not claim:

- that a sample corpus or expected receipt policy has been defined;
- that a CVF-owned receipt schema or receipt-writer code has been
  implemented;
- that MinerU has been installed, executed, or is production-ready;
- that any parser, OCR, table, formula, layout, or VLM output is accurate
  or represents document truth;
- that RAG/context ingestion, provider/live calls, S3 access, Docker/package
  activation, or checker enforcement is authorized;
- that this route selection is itself an implementation authorization - a
  future fresh GC-018 and source-verified work order is required before any
  sample corpus or receipt policy work begins.

## Claim Boundary

This decision matrix records only a CVF-owned, source-backed route
comparison and selection derived from accepted MSEA owner surfaces and the
pinned MinerU source mirror. It does not authorize or claim MinerU runtime
integration, parser execution, OCR execution, VLM/hybrid backend routing,
remote backend processing, model download, API/router/Gradio service,
Docker deployment, RAG indexing, provider/live proof, S3 access, credential
handling, document truth verification, parser accuracy, table/formula
correctness, public-sync export, checker enforcement, package activation,
certification, generated aggregate mutation, schema implementation,
receipt-writer code, adapter implementation, production readiness, hosted
readiness, model-router behavior, action authority, or universal document
intelligence.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference is private provenance documentation derived from
private source-mirror absorption evidence. No public-sync export is
authorized.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R11-T1 MinerU productization readiness route selection decision matrix |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, provider, parser, adapter, schema, receipt-writer, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local governed documentation authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, daemon, parser, RAG index, or production route interception claim |
| claimLanguage | route-selection decision documentation and source-backed non-claim boundary only |
| forbiddenExpansion | no MinerU runtime, install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, provider/live call, credentials/S3, RAG write, source import, package activation, checker implementation, public-sync, Web/MCP/model-router/action-authority, automatic invocation, benchmark, document-truth, extraction-accuracy, schema implementation, receipt-writer code, adapter implementation, or production-readiness claim |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated worker role |
| Provider or surface | local governed documentation worker |
| Session or invocation | MSEA-R11-T1 route selection, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, Grep, git, governance checkers |
| Target paths | this file |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R11_T1_MINERU_PRODUCTIZATION_READINESS_ROUTE_SELECTION_2026-07-03.md` and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker execution; `git status --short` was empty at execution start |
| After status evidence | one new untracked reference file plus the paired worker return |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | route-selection decision documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/schema/receipt-writer/adapter/Web/MCP/model-router/action-authority claim |
| Agent type | worker |
| Invocation ID | `msea-r11-t1-mineru-productization-readiness-route-selection-2026-07-03` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |
