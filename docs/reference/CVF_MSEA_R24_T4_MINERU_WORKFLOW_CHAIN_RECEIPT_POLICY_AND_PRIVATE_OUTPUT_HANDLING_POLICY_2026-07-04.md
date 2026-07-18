# CVF MSEA-R24-T4 MinerU Workflow Chain Receipt Policy And Private Output Handling Policy

Memory class: governed-reference

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-04

Batch ID: MSEA-R24-T4

selectedResultToken: `WORKFLOW_RECEIPT_POLICY_READY`

## Purpose

Define the bounded receipt and private-output handling policy that lets CVF treat the accepted MSEA-R24-T3A MinerU smoke as a workflow-chain planning input without importing private source or generated document content.

## Scope / Applies To

| Field | Value |
|---|---|
| Applies to | MSEA-R24-T4 worker output review and successor MSEA-R25 roadmap authoring |
| Governing work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_2026-07-04.md` |
| Worker return | `docs/reviews/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_WORKER_RETURN_2026-07-04.md` |
| Source smoke evidence | accepted MSEA-R24-T3A metadata-only smoke receipt |
| Scope limit | policy and roadmap release only; no implementation or production claim |

## Target / Source

| Source | Evidence | Disposition |
|---|---|---|
| T3A command receipt | exit code `0`; duration `25.465`; output file count `6` | ACCEPT |
| Candidate input metadata | R17 local private testing authorization and metadata-only committed evidence boundary | ACCEPT |
| Output inventory | six generated runtime files named in T3A readiness matrix without content quotation | ACCEPT_METADATA_ONLY |
| MinerU output documentation | source mirror documents output file classes | ACCEPT |
| Production workflow claim | no schema/writer/checker/adapter/RAG/public/provider proof | REJECT_DIRECT_IMPORT |

## Receipt Envelope

| Field | Required value class | Privacy disposition |
|---|---|---|
| receiptId | governed local identifier | METADATA_ALLOWED |
| sourceInputSlot | candidate group and slot label, not full sensitive content | METADATA_ALLOWED |
| inputSha256 | digest from authorized ledger | METADATA_ALLOWED |
| inputSizeBytes | file size from authorized ledger | METADATA_ALLOWED |
| commandAttemptCount | integer count from accepted receipt | METADATA_ALLOWED |
| executionBaseHead | commit SHA captured by worker | METADATA_ALLOWED |
| exitCode | process exit code | METADATA_ALLOWED |
| durationSeconds | process duration | METADATA_ALLOWED |
| outputFileCount | count only | METADATA_ALLOWED |
| outputFileNames | file names only | METADATA_ALLOWED_WITH_NO_CONTENT |
| outputContentRead | boolean or no-content-read statement | MUST_BE_FALSE_FOR_PRIVATE_COMMIT |
| privateOutputDisposition | one token from Private Output Class Matrix | REQUIRED |
| claimBoundary | explicit no production/legal/extraction-quality claim | REQUIRED |
| downstreamRelease | roadmap-authoring or held token | REQUIRED |

## Private Output Class Matrix

| Output class | Examples | Governing disposition | Committed evidence rule |
|---|---|---|---|
| `PRIVATE_INPUT_ONLY` | authorized Candidate Group A original documents | original remains outside repo | metadata/hash/size only |
| `PRIVATE_RUNTIME_COPY` | generated `origin.docx` runtime copy | keep under ignored runtime output only | file name/count only |
| `PRIVATE_GENERATED_OUTPUT` | generated markdown, json, pdf, or intermediate outputs | keep under ignored runtime output only | file name/count only unless later authorized |
| `RECEIPT_METADATA_ALLOWED` | exit code, duration, log byte counts, output count | governed artifacts may cite | metadata only |
| `EXCERPT_MINIMAL_SEPARATE_AUTHORITY` | future redacted evaluation excerpt | requires later use-case work order | not authorized by T4 |

## Workflow Chain Boundary

| Claim | T4 disposition |
|---|---|
| MinerU process can run locally on the selected private sample | ACCEPT_BOUNDED: inherited from accepted T3A smoke receipt |
| MinerU extraction is accurate | REJECTED_NOT_EVALUATED |
| Legal analysis quality is proven | REJECTED_NOT_EVALUATED |
| Current-law correctness is proven | REJECTED_NOT_EVALUATED |
| CVF has a production workflow chain | REJECTED_NOT_IMPLEMENTED |
| R25 roadmap authoring may proceed | ACCEPT_ROADMAP_AUTHORING_ONLY |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | pinned MinerU source mirror plus accepted T3A smoke receipt plus R17 private-test boundary -> T4 policy reference |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this policy reference |
| Disposition | ADAPT: convert accepted smoke metadata into private workflow-chain receipt policy |
| Claim boundary | no parser result, extraction quality, public-sync, provider/live proof, implementation, or production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `.private_reference/source_mirrors/opendatalab__MinerU/` plus accepted MSEA owner surfaces |
| Enumeration command | filesystem-backed direct reads of cited T4/T3A/R17/MinerU owner surfaces |
| Manifest artifact or inline manifest | Receipt Envelope and Private Output Class Matrix |
| Processing ledger artifact or inline ledger | Workflow Chain Boundary |
| Ledger terminal statuses | READ; ADAPTED; DEFERRED; REJECTED; NO_NEW_VALUE; BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB; ADAPT; DEFER; REJECT; BLOCK; NO_NEW_VALUE |
| Owner-surface map | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_2026-07-04.md`; `docs/reviews/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_WORKER_RETURN_2026-07-04.md`; `docs/reference/CVF_MSEA_R24_T3A_MINERU_PATH_QUOTING_SAFE_LOCAL_PIPELINE_RERUN_READINESS_MATRIX_2026-07-04.md`; `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md`; inline table: Receipt Envelope |
| Unresolved items | R25 roadmap and later implementation authority |
| Completion claim boundary | policy ready only |

ledger_terminal=READ for cited source evidence; ledger_terminal=ADAPTED for T4 policy; ledger_terminal=DEFERRED for R25 implementation lanes; ledger_terminal=REJECTED for direct production/workflow-chain claims.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| T3A smoke receipt | process-level smoke passed with metadata-only output inventory | DOCTRINE_ADAPTED | T4 policy | close policy | no rerun |
| T3A runtime receipt | accepted receipt exists as source evidence | RUNTIME_CANDIDATE | T4 policy | reuse metadata only | no new runtime |
| MinerU output docs | named output artifact classes | DOCTRINE_ADAPTED | T4 policy | map privacy classes | no output read |
| R17 privacy boundary | local private testing and committed metadata limits | DOCTRINE_ADAPTED | T4 policy | preserve private handling | no public-sync |
| Future receipt checker | possible later enforcement | CHECKER_CANDIDATE | R25 roadmap | defer to fresh work order | no checker implementation |
| Existing MinerU package surface | package was relevant to T3A but not T4 policy | PACKAGE_CANDIDATE | pending owner: no T4 package owner surface needed | cite only | no package mutation |
| Direct production workflow | unsupported by T4 policy alone | REJECT_DIRECT_IMPORT | claim boundary | reject | no production claim |
| Runtime/package mutation | outside T4 | NO_PACKAGE_OR_RUNTIME_VALUE | none | none | no mutation |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| R24 roadmap T4 route | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` | CONFIRMED_EXISTING | dependency satisfied | cite |
| T3A metadata receipt | `docs/reviews/CVF_MSEA_R24_T3A_MINERU_PATH_QUOTING_SAFE_LOCAL_PIPELINE_RERUN_WORKER_RETURN_2026-07-04.md`; `docs/reference/CVF_MSEA_R24_T3A_MINERU_PATH_QUOTING_SAFE_LOCAL_PIPELINE_RERUN_READINESS_MATRIX_2026-07-04.md` | ENRICH_EXISTING | enables policy | adapt |
| MinerU output classes | inline table: Receipt Envelope | ENRICH_EXISTING | sharpens private output taxonomy | adapt |
| Candidate Group A privacy | `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md` | CONFIRMED_EXISTING | remains binding | cite |
| Schema/writer/checker implementation | OWNER_SURFACE_NOT_FOUND | REJECT_DIRECT_IMPORT | future R25 only | defer |

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON
- N/A with reason: this is a bounded policy reference from accepted T3A metadata, not a rescan or intake-refresh output; no source corpus was re-enumerated and no generated output content was inspected.

## Corpus Completeness And Report Integrity

- Corpus task class: T4 companion policy reference.
- Corpus root: T4 work order, T4 worker return, accepted T3A artifacts, R17 ledger, and pinned MinerU output documentation.
- Snapshot time: 2026-07-04 worker execution.
- Enumeration command: filesystem-backed direct reads of cited source files; no generated output content read.
- Manifest artifact or inline manifest: Receipt Envelope and Private Output Class Matrix.
- Manifest hash: N/A with reason: bounded policy source set, not a new corpus snapshot.
- Processing ledger artifact or inline ledger: Workflow Chain Boundary.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE.
- Reconciliation: manifest=T4/T3A/R17/MinerU source evidence; ledger_terminal=READ/ADAPTED/DEFERRED/REJECTED/NO_NEW_VALUE; exclusions=runtime rerun, generated-output content read, public-sync, implementation work, production claims; unresolved=0 for policy reference.
- Unresolved files: none for policy authoring.
- Declared exclusions: runtime execution, output-content quotation, schema/writer/adapter/checker work, public-sync, provider/live proof, production readiness.
- Unreadable or unsupported files: none identified for policy authoring.
- Aggregation check: PASS.
- Drift check: PASS.
- Output traceability: worker return and this policy reference align on selected token.
- Adversarial verification: direct workflow-chain production and legal/extraction-quality claims are rejected.
- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex worker |
| Provider or surface | local PowerShell plus governed markdown authoring |
| Session or invocation | MSEA-R24-T4 policy reference creation, 2026-07-04 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | source reads; `apply_patch`; governance gates |
| Target paths | this policy reference and paired worker return |
| Allowed scope source | MSEA-R24-T4 work order |
| Before status evidence | HEAD `0aa1f6c2`; clean worktree confirmed before worker output creation; planned output paths absent |
| After status evidence | policy reference and worker return uncommitted pending review |
| Diff evidence | `git diff --name-status`; `git status --short --untracked-files=all` |
| Approval boundary | worker execution only |
| Claim boundary | private receipt policy only |
| Agent type | worker |
| Invocation ID | `msea-r24-t4-policy-reference-2026-07-04` |
| Expected manifest | policy reference plus paired worker return |
| Actual changed set | policy reference plus paired worker return |
| Manifest delta | MATCH pending final git status confirmation |
| Deletion or rename disposition | N/A with reason: no deletion or rename performed |

## Delta Execution Claim Boundary Control Block

| Field | Value |
|---|---|
| claimScope | MSEA-R24-T4 private receipt policy reference |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE: policy is source-backed by accepted T3A metadata receipt and R17 privacy boundary |
| receiptEvidence | CVF_RECEIPT_PRESENT: accepted T3A metadata-only receipt is cited; T4 creates no new runtime receipt |
| actionEvidence | ACTION_EVIDENCE_PRESENT: worker created governed policy artifacts only |
| invocationBoundary | governed markdown worker execution only |
| interceptionBoundary | no provider/live, public, wrapper/proxy, or production enforcement behavior |
| claimLanguage | workflow receipt policy ready; production workflow chain not claimed |
| forbiddenExpansion | no runtime/provider/live/public/package/checker/source-import/schema/receipt-writer/adapter/Web/MCP/model-router/action-authority/document-truth/extraction-accuracy/legal-quality/workflow-chain production claim |

## Verification

| Check | Evidence | Disposition |
|---|---|---|
| selected token consistency | worker return and this policy both select `WORKFLOW_RECEIPT_POLICY_READY` | PASS |
| privacy boundary | no source or generated output content quoted | PASS |
| runtime boundary | no MinerU command run by T4 | PASS |
| R25 boundary | only roadmap authoring released | PASS |

## Epistemic Process Block

| Field | Value |
|---|---|
| Expected Result / Prediction | A policy-only T4 can convert accepted T3A metadata into workflow-chain planning rules without reading private output content. |
| Evidence Comparison | T3A provides metadata-only smoke evidence; R17 provides privacy constraints; MinerU output docs provide output class names. |
| Contradiction Or Gap Disposition | No contradiction found; implementation gaps remain deferred to R25 or later source-verified work orders. |
| Claim Update | The policy reference supports roadmap authoring only and rejects production workflow-chain claims. |

## Claim Boundary

This policy reference governs private receipt metadata and successor roadmap authoring only. It does not authorize runtime execution, output-content inspection, public-sync, provider/live proof, schema/writer/adapter/checker implementation, legal-quality evaluation, or production workflow-chain readiness.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: T4 uses private local MinerU smoke evidence and Candidate Group A privacy constraints. No public-sync export is authorized.
