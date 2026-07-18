# CVF MSEA-R12-T1 MinerU Sample Corpus Expected Receipt Policy

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-03

EPISTEMIC_PROCESS_NA_WITH_REASON: this reference defines a documentation-only
sample-corpus and expected-receipt policy derived from accepted MSEA owner
surfaces; it does not assert a new empirical runtime, provider, or
extraction-accuracy result, and it does not compare a prediction against a
new corpus observation.

## Purpose

Define, as documentation only, how a future CVF tranche should select a small
MinerU document-extraction sample corpus and how a future extraction receipt
should be judged, before any schema, writer, runtime, RAG, provider, S3,
Docker, package, checker, or adapter implementation work begins. This policy
was selected by MSEA-R11-T1 and roadmapped by MSEA-R12. It does not create,
import, or claim the existence of any sample document, and it does not
implement a schema, receipt writer, adapter, or checker.

## Scope / Applies To

Applies to: any future CVF work that selects, requests, receives, or
evaluates a MinerU document-extraction sample corpus, and any future work
that defines what a MinerU extraction receipt may or may not assert.

Does not apply to: sample document creation or import, corpus population,
MinerU install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/
Docker execution, provider/live call, credentials/S3, RAG write, source
import, package activation, checker implementation, schema implementation,
receipt-writer code, adapter implementation, public-sync, document-truth
verification, extraction-accuracy certification, benchmark, or
production-readiness claims.

## Source Basis

| Authority | Source | Contract use | Disposition |
|---|---|---|---|
| Selected productization route | `docs/reference/CVF_MSEA_R11_T1_MINERU_PRODUCTIZATION_READINESS_ROUTE_SELECTION_DECISION_MATRIX_2026-07-03.md` | route token and rationale for this policy tranche | ACCEPT |
| Sample-corpus and receipt-policy roadmap | `docs/roadmaps/CVF_MSEA_R12_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_ROADMAP_2026-07-03.md` | policy-area seed table and non-goals | ACCEPT |
| Receipt schema contract draft | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | receipt artifact families and field families | ACCEPT |
| Adapter contract draft | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` | held-lane prerequisites and explicit non-claims | ACCEPT |
| Application blueprint and readiness | `docs/reference/CVF_MSEA_R9_MINERU_CVF_APPLICATION_BLUEPRINT_AND_ADAPTER_CONTRACT_READINESS_2026-07-02.md` | source-backed hold conditions for runtime/provider/RAG/S3/checker | ACCEPT |
| Residual full repository absorption closure ledger | `docs/reference/CVF_MSEA_R8_MINERU_RESIDUAL_FULL_REPOSITORY_ABSORPTION_CLOSURE_LEDGER_2026-07-02.md` | runtime/package candidate evidence, no execution | ACCEPT |
| Pinned MinerU source mirror | `.private_reference/source_mirrors/opendatalab__MinerU/` recomputed at commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491` with 425 files | advisory input only | ADVISORY_ONLY |

## Sample Corpus Slot Taxonomy

This taxonomy defines document-class categories a future operator-provided
sample corpus should cover so a later schema/writer/runtime tranche has
concrete input variety to test against. No file is assigned to any slot by
this policy.

| Slot | Purpose | Grounding | Sample files present now |
|---|---|---|---|
| Text-dominant document | Exercise the flattened reading-order artifact and heading-level marker field on ordinary prose | R7 Field Family Map: reading-order position, heading-level marker | NONE |
| Table-bearing document | Exercise table block type, caption/footnote association, and table-body content fields | R7 Field Family Map: block type, caption/footnote association | NONE |
| Formula-bearing document | Exercise math/formula content fields and backend-variant differences (pipeline vs. VLM formula handling) | R7 Backend Variant Boundary | NONE |
| Multi-column or complex-layout document | Exercise geometry locator and reading-order position under non-linear layout | R7 Field Family Map: geometry locator, reading-order position | NONE |
| Scanned or OCR-dependent document | Exercise raw model-inference artifact and quality-disposition boundary for OCR-derived content | R7 Receipt Artifact Family Map: raw model-inference artifact | NONE |
| Mixed-language or non-Latin-script document | Exercise source-identity and content fields under non-English text, without any accuracy claim | R7 Field Family Map: textual or structured content | NONE |
| List and code-block document | Exercise structural sub-type field (ordinary vs. reference-style list; code vs. algorithm) | R7 Backend Variant Boundary: list and code block handling | NONE |
| Minimal or edge-case document (single page, empty sections) | Exercise artifact-existence and non-assertion boundaries on sparse input | this policy's Expected Receipt Non-Assertions section | NONE |

Explicit non-claim: no document has been assigned to any slot above. This
table is a selection target, not a manifest of files that exist in this
repository.

## Sample Intake And Provenance Policy

A future operator-provided sample document may be accepted into a
corpus-population tranche only if all of the following evidence accompanies
it. This policy does not itself collect, request in a blocking way, or
ingest any document.

| Required evidence | Reason |
|---|---|
| Source identity (where the document came from) | needed to record source identity per R7's Field Family Map without claiming that identity is verified |
| Explicit permission or license basis for CVF to store and process the document | prevents an unauthorized-copy or license-violation risk in a private provenance repository |
| Privacy/redaction disposition (contains no personal data, or has been redacted, or has explicit consent) | prevents accidental storage of sensitive personal data in a governed repository |
| Intended slot assignment from the Sample Corpus Slot Taxonomy above | keeps corpus population traceable to a concrete policy target instead of ad hoc accumulation |
| File format and approximate size | needed for future dependency and storage planning without implying a storage or S3 tranche is authorized |
| Operator confirmation that the document may be used for schema/writer/runtime proof, not just illustration | prevents using illustrative-only material as if it were proof evidence |

Explicit non-claim: this section does not authorize collecting, requesting
in a blocking way, or importing any document. It defines what evidence a
later corpus-population tranche must require before treating a document as
CVF-owned sample material.

## Expected Receipt Assertion Policy

A future MinerU extraction receipt (once implemented) may assert only the
following claim classes, grounded in R7's Receipt Artifact Family Map and
Field Family Map:

| Assertion class | Allowed claim | Source grounding |
|---|---|---|
| Artifact existence | that a named artifact family (layout debug, span debug, raw model-inference, intermediate hierarchical, flattened reading-order, structured page-grouped, primary Markdown) was produced by an authorized route | R7 Receipt Artifact Family Map |
| Backend identity | which parsing backend (pipeline, VLM, or office) and which schema version produced the artifact | R7 Field Family Map: backend identity |
| Page/block locator evidence | which page, and which structural position, a content unit occupies | R7 Field Family Map: page locator, reading-order position, geometry locator |
| Content-type classification | that a structural unit was classified into a content type (heading, paragraph, table, image, chart, formula, code, list) by the producing backend | R7 Field Family Map: block type, structural sub-type |
| Quality disposition | an explicit, separately-recorded quality status for the artifact (for example, unreviewed, human-reviewed, flagged) | MSEA-T2 receipt/quality/RAG-handoff advisory, as inherited by R7's Downstream Use Boundary |
| Downstream-use status | an explicit, separately-recorded status naming which downstream uses (if any) the artifact is currently authorized for | MSEA-T2 receipt/quality/RAG-handoff advisory, as inherited by R7's Downstream Use Boundary |

## Expected Receipt Non-Assertions

A future MinerU extraction receipt must never assert any of the following,
regardless of artifact existence:

| Forbidden claim | Reason |
|---|---|
| Document truth (that extracted content correctly represents the source document) | R7's Downstream Use Boundary: recording that an artifact exists does not certify its content is correct |
| Extraction accuracy (OCR, table, formula, or layout correctness) | R7 Field Family Map non-claims for textual/structured content, table type, and geometry locator |
| Benchmark pass or certification | no benchmark authority exists for this policy tranche |
| Runtime or provider proof (that MinerU or a provider was actually invoked) | this policy tranche performs no runtime or provider action and authorizes none |
| Production readiness or hosted readiness | no production or hosting authorization exists for MinerU work at this tranche |
| RAG/context ingestion authorization by artifact existence alone | MSEA-T2's Central Rule: ingestion requires receipt evidence, quality disposition, and an explicit downstream-use status, not artifact existence alone |
| Universal document intelligence or general-purpose accuracy claim | no such claim is supported by any accepted MSEA owner surface |

## Held-Lane Reopen Routing

The following implementation-facing lanes remain held. Concrete reopen
conditions are carried forward unchanged from R9/R10; this policy does not
weaken or satisfy any of them.

| Held lane | Concrete reopen condition | Source |
|---|---|---|
| Receipt schema implementation | this sample-corpus and expected-receipt policy exists (satisfied by this reference) and a future fresh GC-018 authorizes schema implementation using this policy's assertion/non-assertion classes | R10 Future Implementation Prerequisites; R11-T1 decision matrix rationale |
| Receipt-writer code | receipt schema implementation exists | R10 Future Implementation Prerequisites |
| Local parser runtime pilot | operator names a concrete downstream use case requiring MinerU document parsing; fresh GC-018 authorizes model download, execution, and live/provider proof | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| RAG handoff adapter | operator names a concrete downstream RAG use case; fresh GC-018 authorizes RAG index write and adapter execution | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Provider-assisted correction | operator names a concrete downstream use case requiring LLM-assisted title correction; fresh GC-018 authorizes provider/live-proof boundary | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| S3 storage boundary | operator names a concrete downstream use case requiring remote S3-compatible storage; fresh GC-018 authorizes credential-handling boundary | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Docker/package lane | operator names a concrete deployment target and hardware profile; fresh GC-018 authorizes Docker build/run and package-lane registration | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Overclaim checker | two or more real overclaim misses not caught by existing gates, or an authorized RAG ingestion tranche | R9 Source-Backed Hold Conditions; R10 Held Lanes And Reopen Conditions |
| Sample corpus population | operator supplies at least one document meeting the Sample Intake And Provenance Policy above, assigned to a slot in the Sample Corpus Slot Taxonomy, under a fresh GC-018 authorizing corpus-population work | this policy |

## Operator Handoff Requirements

Before any future corpus-population tranche begins, the operator (or an
authorized dispatcher acting on operator instruction) must provide:

| Requirement | Detail |
|---|---|
| At least one candidate document per targeted slot | selected from the Sample Corpus Slot Taxonomy; not all slots need to be filled in the first tranche |
| Complete Sample Intake And Provenance Policy evidence per document | source identity, permission/license basis, privacy/redaction disposition, intended slot, format/size, and proof-use confirmation |
| A concrete first-use statement | which of schema implementation, receipt-writer code, or runtime pilot the sample is intended to unblock first |
| Confirmation that the intake is a corpus-population tranche, not illustrative-only | prevents treating example screenshots or descriptions as proof-grade sample material |
| A fresh GC-018 authorizing the corpus-population tranche | this policy reference does not itself authorize document intake |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | accepted MSEA owner surfaces plus pinned MinerU source mirror -> R11-T1 selected route -> R12 roadmap -> R12-T1 sample-corpus and expected-receipt policy reference |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this reference |
| Disposition | ADAPT: convert accepted MinerU route selection and receipt vocabulary into a documentation-only sample-corpus and expected-receipt policy |
| Claim boundary | dispatch-only; no runtime/provider/live/S3/RAG/Docker/package/checker/source-import/schema/receipt-writer/adapter implementation/public-sync/production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `https://github.com/opendatalab/MinerU.git` at `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`; local mirror `.private_reference/source_mirrors/opendatalab__MinerU/`; accepted MSEA-T2/R4/R5/R6/R7/R8/R9/R10/R11/R11-T1/R12 evidence |
| Enumeration command | `rg --files --hidden --no-ignore .private_reference/source_mirrors/opendatalab__MinerU -g '!**/.git/**'` returned `425` during this worker execution |
| Manifest artifact or inline manifest | `.private_reference/source_mirrors/INDEX.md` row `opendatalab__MinerU` |
| Processing ledger artifact or inline ledger | this reference (inline ledger below) and `docs/reviews/CVF_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_WORKER_RETURN_2026-07-03.md` |
| Ledger terminal statuses | READ, SOURCE_VERIFIED, ADAPTED, DEFERRED, REJECTED, NO_NEW_VALUE, SKIPPED_WITH_REASON, BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB, ADAPT, DEFER, REJECT, BLOCK, NO_NEW_VALUE |
| Owner-surface map | MSEA-R7/R8/R9/R10/R11/R11-T1/R12 owner surfaces |
| Unresolved items | none; every policy area named in the roadmap's Future R12-T1 Work-Order Seed table received a dedicated section above |
| Completion claim boundary | policy-definition reference only; no runtime/provider/public/package/checker/source-import/schema/receipt-writer/adapter expansion |

ledger_terminal=READ for accepted MSEA owner surfaces; ledger_terminal=SOURCE_VERIFIED for source mirror commit/count recomputed in this execution; ledger_terminal=ADAPTED for the sample-corpus slot taxonomy, intake policy, and receipt assertion/non-assertion classes defined above; ledger_terminal=DEFERRED for corpus population and every held implementation-facing lane; ledger_terminal=REJECTED for direct upstream import; ledger_terminal=NO_NEW_VALUE for already-owned absorption facts cited rather than re-derived.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MSEA-R11-T1 selected route | sample corpus and expected receipt policy is the lowest-risk next tranche | DOCTRINE_ADAPTED | this reference | define policy sections | no implementation |
| MSEA-R7 receipt vocabulary | artifact families and field families | DOCTRINE_ADAPTED | Sample Corpus Slot Taxonomy; Expected Receipt Assertion Policy | ground future schema work in this vocabulary | no schema implementation |
| MSEA-R10 held-lane table | schema/writer/runtime/RAG/provider/S3/Docker/checker prerequisites | DOCTRINE_ADAPTED | Held-Lane Reopen Routing | carry conditions forward unchanged | no adapter implementation |
| MSEA-R9 runtime/provider/RAG/S3/checker holds | held candidates with concrete reopen conditions | RUNTIME_CANDIDATE | Held-Lane Reopen Routing | keep demand-gated | no runtime/provider/RAG/S3 action |
| MSEA-R8 Docker/package evidence | deployment/package candidates remain held | PACKAGE_CANDIDATE | Held-Lane Reopen Routing | keep deployment/package work held | no Docker build/run or package activation |
| MSEA-T3/R6/R9/R10 checker notes | overclaim checker remains condition-gated | CHECKER_CANDIDATE | Held-Lane Reopen Routing | defer checker work | no checker implementation |
| Direct upstream files | advisory input only | REJECT_DIRECT_IMPORT | source mirror control | reject direct import | no source import |
| Prior MSEA absorption facts | already-owned evidence | NO_PACKAGE_OR_RUNTIME_VALUE | predecessor owner surfaces | cite only | no runtime/package behavior |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| Sample-corpus and expected-receipt-policy definition | `docs/roadmaps/CVF_MSEA_R12_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_ROADMAP_2026-07-03.md` | ENRICH_EXISTING | converts the roadmap's Future R12-T1 Work-Order Seed table into a concrete policy reference | create this reference |
| Receipt vocabulary | `docs/reference/CVF_MSEA_R7_MINERU_RECEIPT_SCHEMA_CONTRACT_DRAFT_2026-07-02.md` | CONFIRMED_EXISTING | used as source input for assertion/non-assertion classes | cite |
| Adapter contract prerequisites | `docs/reference/CVF_MSEA_R10_MINERU_ADAPTER_CONTRACT_DRAFT_2026-07-03.md` | CONFIRMED_EXISTING | used as source input for held-lane rationale | cite |
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

## Corpus Completeness And Report Integrity

- Corpus task class: documentation-only sample-corpus and expected-receipt policy definition.
- Corpus root: `.private_reference/source_mirrors/opendatalab__MinerU/` plus accepted MSEA owner surfaces.
- Snapshot time: 2026-07-03 worker execution.
- Enumeration command: `rg --files --hidden --no-ignore .private_reference/source_mirrors/opendatalab__MinerU -g '!**/.git/**'`.
- Manifest artifact or inline manifest: `.private_reference/source_mirrors/INDEX.md` row `opendatalab__MinerU`.
- Manifest hash: source mirror commit `3e60291846cb7c3bf8fe7f4f16238f4fc6cce491`.
- Processing ledger artifact or inline ledger: this reference (inline ledger above) and the paired worker return.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE.
- Reconciliation: manifest=source mirror index row plus accepted MSEA owner surfaces; ledger_terminal=READ/SKIPPED_WITH_REASON/DEFERRED/BLOCKED_UNREADABLE for cited owner surfaces and policy areas (BLOCKED_UNREADABLE count is zero); exclusions=sample document import, corpus population, full 425-file reabsorption, runtime execution, package activation, provider/live proof, source import, schema implementation, receipt-writer code, adapter implementation, production readiness; unresolved=0.
- Unresolved files: none for this policy-definition scope.
- Declared exclusions: sample document import, corpus population, full 425-file per-file reabsorption, runtime execution, package activation, provider/live proof, source import, schema implementation, receipt-writer code, adapter implementation, production-readiness claims.
- Unreadable or unsupported files: none identified for this worker execution.
- Aggregation check: PASS - accepted MSEA owner surfaces are cited instead of regenerated into a new corpus aggregate.
- Drift check: PASS - source mirror HEAD and file count recomputed in this execution matched the work order's expected values exactly.
- Output traceability: every policy area named in the roadmap's Future R12-T1 Work-Order Seed table maps to a dedicated section in this reference.
- Adversarial verification: this reference rejects actual corpus population, runtime execution, schema implementation, receipt-writer code, adapter implementation, document truth, extraction accuracy, and production readiness in every relevant section.
- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: this reference defines a policy from already-accepted MSEA owner
surfaces and an already-accepted route selection; it is not a rescan,
intake-refresh, or source-backed reassessment of a prior intake.

## Explicit Non-Claims

This reference does not claim:

- that any sample document has been created, imported, or received;
- that a sample corpus exists;
- that a CVF-owned receipt schema or receipt-writer code has been
  implemented;
- that MinerU has been installed, executed, or is production-ready;
- that any parser, OCR, table, formula, layout, or VLM output is accurate
  or represents document truth;
- that RAG/context ingestion, provider/live calls, S3 access, Docker/package
  activation, or checker enforcement is authorized;
- that this policy is itself an implementation authorization - a future
  fresh GC-018 and source-verified work order is required before any
  corpus-population, schema, writer, runtime, or adapter work begins.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R12-T1 MinerU sample corpus and expected receipt policy reference |
| claimDisposition | CLAIM_REJECTED: no execution-control, runtime-enforcement, direct-interception, mandatory-wrapper, provider, parser, adapter, schema, receipt-writer, or production behavior is claimed |
| receiptEvidence | CLAIM_REJECTED_NO_RECEIPT: no runtime receipt is created or consumed |
| actionEvidence | CLAIM_REJECTED_NO_ACTION: no runtime action is executed or observed |
| invocationBoundary | local governed documentation authoring only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, Web runtime, adapter, package, watcher, daemon, parser, RAG index, or production route interception claim |
| claimLanguage | policy-definition documentation and source-backed non-claim boundary only |
| forbiddenExpansion | no sample document import, corpus population, MinerU runtime, install, model download, parser/OCR/VLM/hybrid/API/router/Gradio/Docker execution, provider/live call, credentials/S3, RAG write, source import, package activation, checker implementation, public-sync, Web/MCP/model-router/action-authority, automatic invocation, benchmark, document-truth, extraction-accuracy, schema implementation, receipt-writer code, adapter implementation, or production-readiness claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this reference is private provenance documentation derived from
private source-mirror absorption evidence. No public-sync export is
authorized.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | delegated worker role |
| Provider or surface | local governed documentation worker |
| Session or invocation | MSEA-R12-T1 sample corpus and expected receipt policy definition, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | Read, Grep, git, governance checkers |
| Target paths | this file |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R12_T1_MINERU_SAMPLE_CORPUS_EXPECTED_RECEIPT_POLICY_2026-07-03.md` and paired GC-018 baseline |
| Before status evidence | file did not exist before this worker execution; `git status --short` was empty at execution start |
| After status evidence | one new untracked reference file plus the paired worker return |
| Diff evidence | `git diff --name-status` shows no tracked-file mutations |
| Approval boundary | policy-definition documentation only |
| Claim boundary | no runtime/provider/live/public/package/checker/source-import/schema/receipt-writer/adapter/Web/MCP/model-router/action-authority claim |
| Agent type | worker |
| Invocation ID | `msea-r12-t1-mineru-sample-corpus-expected-receipt-policy-2026-07-03` |
| Expected manifest | this file |
| Actual changed set | this file |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename; one new file created |

## Claim Boundary

This reference records only a CVF-owned, documentation-only sample-corpus
and expected-receipt policy derived from accepted MSEA owner surfaces and
the pinned MinerU source mirror. It does not authorize or claim sample
document creation or import, corpus population, MinerU runtime integration,
parser execution, OCR execution, VLM/hybrid backend routing, remote backend
processing, model download, API/router/Gradio service, Docker deployment,
RAG indexing, provider/live proof, S3 access, credential handling, document
truth verification, parser accuracy, table/formula correctness, public-sync
export, checker enforcement, package activation, certification, generated
aggregate mutation, schema implementation, receipt-writer code, adapter
implementation, production readiness, hosted readiness, model-router
behavior, action authority, or universal document intelligence.
