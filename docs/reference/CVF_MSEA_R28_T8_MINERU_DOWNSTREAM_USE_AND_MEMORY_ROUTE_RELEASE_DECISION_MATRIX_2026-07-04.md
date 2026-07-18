# CVF MSEA R28 T8 MinerU Downstream Use And Memory Route Release Decision Matrix - 2026-07-04

Memory class: FULL_RECORD
Status: READY_FOR_REVIEW
docType: reference
rawMemoryReleased: false

## Purpose

Decide the bounded downstream-use and memory-route release posture after R28-T7
accepted deterministic metadata-only quality-report/source-pointer production
helper evidence.

## Scope / Target

This matrix compares release options only. It does not implement memory, RAG,
runtime, source/test/checker changes, provider/live proof, public-sync, or
private/generated content reads.

## Source Inventory

| Source | Role | Disposition |
| --- | --- | --- |
| `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R28_T8_MINERU_DOWNSTREAM_USE_AND_MEMORY_ROUTE_RELEASE_DECISION_2026-07-04.md` | Dispatch authority | ACCEPT |
| `docs/baselines/CVF_GC018_MSEA_R28_T8_MINERU_DOWNSTREAM_USE_AND_MEMORY_ROUTE_RELEASE_DECISION_2026-07-04.md` | GC-018 baseline | ACCEPT |
| `docs/reviews/CVF_MSEA_R28_T7_MINERU_ACTUAL_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_IMPLEMENTATION_WORKER_RETURN_2026-07-04.md` | Accepted T7 implementation evidence | ACCEPT |
| `CVF_SESSION/state/entries/mseaR28T7ActualQualityReportSourcePointerProductionImplementationClosure20260704.json` | T7 closure state | ACCEPT |
| `docs/reference/CVF_MSEA_R28_T6_MINERU_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_MATRIX_2026-07-04.md` | Production decision predecessor | ACCEPT |
| `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | Scan-to-memory prerequisite ledger | ACCEPT |
| `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | Private-output policy | ACCEPT |
| `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | Current receipt writer/helper source | SOURCE_VERIFIED |
| `governance/compat/check_mineru_receipt_boundary.py` | Current receipt-boundary checker source | SOURCE_VERIFIED |

## Source Verification Block

| Claimed item | Source fact type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| R28-T7 accepted the metadata-only helper and left memory route held. | VALUE_SET | `CVF_SESSION/state/entries/mseaR28T7ActualQualityReportSourcePointerProductionImplementationClosure20260704.json` | lines 5 and 17-23 | `QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_IMPLEMENTED`; `MEMORY_ROUTE_HELD_PENDING_ALLOWED_DOWNSTREAM_USE_AND_MEMORY_OWNER_DECISION` | active session state entry | ACCEPT |
| Current receipt writer keeps downstream release held by default. | LITERAL_INVARIANT | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | lines 19 and 81 | `DOWNSTREAM_RELEASE_HELD`; `downstream_release` | MinerU metadata receipt writer | ACCEPT |
| Current receipt writer owns deterministic metadata-only quality/source-pointer helper symbols. | EXISTS | `EXTENSIONS/CVF_EXTRACTION_FOUNDATION/src/mineru_metadata_receipt_writer.py` | lines 87 and 143 | `MineruQualityReportSourcePointer`; `build_mineru_quality_report_source_pointer` | MinerU metadata receipt writer | ACCEPT |
| Receipt checker requires quality/source-pointer metadata while keeping private output content unread. | RUNTIME_BEHAVIOR | `governance/compat/check_mineru_receipt_boundary.py` | lines 37-48, 235-250, and 307-320 | `REQUIRED_FIELDS`; `outputContentRead`; `qualityReportRef`; `sourcePointer` | MinerU receipt boundary checker | ACCEPT |
| R28-T6 holds direct memory/RAG release behind future authorization. | VALUE_SET | `docs/reference/CVF_MSEA_R28_T6_MINERU_QUALITY_REPORT_SOURCE_POINTER_PRODUCTION_DECISION_MATRIX_2026-07-04.md` | lines 71 and 88-91 | `MEMORY_WRITE_AUTHORIZED`; `HELD_PENDING_SOURCE_POINTER_PRODUCTION_CONTRACT` | MSEA-R28-T6 decision matrix | ACCEPT |
| R27 requires receipt, quality, source pointer, downstream-use status, claim boundary, and fresh memory owner work order before memory write. | VALUE_SET | `docs/reference/CVF_MSEA_R27_MINERU_DOCUMENT_INTELLIGENCE_PLANE_INTEGRATION_DECISION_LEDGER_2026-07-04.md` | lines 74 and 85-87 | `MEMORY_SAFE_CANDIDATE_READY`; `MEMORY_WRITE_AUTHORIZED`; `NOT_AUTHORIZED_BY_R27` | MSEA-R27 decision ledger | ACCEPT |
| R24-T4 allows metadata-only receipt evidence and forbids generated output content inspection for committed private evidence. | VALUE_SET | `docs/reference/CVF_MSEA_R24_T4_MINERU_WORKFLOW_CHAIN_RECEIPT_POLICY_AND_PRIVATE_OUTPUT_HANDLING_POLICY_2026-07-04.md` | lines 53-65 and 212 | `outputContentRead`; `privateOutputDisposition`; `RECEIPT_METADATA_ALLOWED` | MSEA-R24-T4 policy | ACCEPT |

## Decision Options

| Option | Requirements | Evidence fit | Disposition |
| --- | --- | --- | --- |
| Direct memory/RAG write release | fresh memory owner work order, memory record schema, downstream-use boundary, and write implementation authority | Not satisfied. R27 marks `MEMORY_WRITE_AUTHORIZED` as `NOT_AUTHORIZED_BY_R27`, and T8 dispatch forbids memory write. | REJECT_FOR_T8 |
| Memory-safe candidate contract first | receipt helper evidence, quality/source-pointer metadata, private-output boundary, and source-verified contract work order next | Satisfied as next tranche direction. T7 supplies helper evidence, but no memory owner write authority exists yet. | SELECT |
| Continued full hold with no next tranche | no sufficient candidate evidence | Too conservative. T7 supplies enough metadata helper evidence to define a candidate contract without writing memory. | REJECT_TOO_STRICT |

## Decision / Disposition

| Field | Value |
| --- | --- |
| selectedDecisionDisposition | `MEMORY_ROUTE_RELEASE_DECISION_MATRIX_READY` |
| selectedNextRoute | `MEMORY_SAFE_CANDIDATE_CONTRACT_RECOMMENDED` |
| downstreamUseDisposition | `DOWNSTREAM_USE_ALLOWED_FOR_METADATA_CONTRACT_DESIGN_ONLY` |
| memoryWriteDisposition | `MEMORY_WRITE_NOT_AUTHORIZED_BY_T8` |
| t9Recommendation | Author fresh GC-018/source-verified no-commit work order for a metadata-only memory-safe candidate contract builder or contract reference, without memory/RAG write. |
| t10Recommendation | Reserve T10 for closure/route selection after T9 evidence is accepted. |

## Risk / Corrective Action

| Risk | Corrective action |
| --- | --- |
| Treating source-pointer refs as memory write authority. | Keep direct memory/RAG write rejected and require a fresh memory-owner work order. |
| Reading private/generated output to decide downstream use. | Use only metadata and governed source evidence; preserve R24-T4 private-output boundary. |
| Starting T9/T10 prematurely. | Require T8 reviewer closure and session-sync release evidence before any T9 dispatch. |

## Epistemic Process Block

| Field | Value |
| --- | --- |
| Expected Result / Prediction | Accepted T7 helper evidence should justify a metadata-only memory-safe candidate contract recommendation, but not direct memory/RAG write. |
| Evidence Comparison | Source verification confirms helper, receipt checker, and private-output boundaries exist; R27 still marks memory write unauthorized without fresh memory-owner work order. |
| Contradiction Or Gap Disposition | No contradiction found. The gap is memory-owner contract authority, not quality/source-pointer helper availability. |
| Claim Update | T8 may recommend T9 memory-safe candidate contract work; direct memory/RAG write remains unauthorized. |

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | worker |
| Provider or surface | Codex local workspace |
| Session or invocation | MSEA-R28-T8 MinerU Downstream Use And Memory Route Release Decision, 2026-07-04 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell (`git`, `python governance/compat/*`), apply_patch |
| Target paths | this companion matrix |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R28_T8_MINERU_DOWNSTREAM_USE_AND_MEMORY_ROUTE_RELEASE_DECISION_2026-07-04.md` |
| Before status evidence | HEAD `fd073a1b`; `git status --short --untracked-files=all` returned no output before worker edits began |
| After status evidence | this matrix and the matching worker return are untracked; HEAD unchanged at `fd073a1b` |
| Diff evidence | `git diff --name-status` |
| Approval boundary | worker execution under WORKER_MUST_NOT_COMMIT only |
| Claim boundary | docs-only decision matrix; no runtime/private-output/memory/public/provider/source edit claim |
| Agent type | worker |
| Invocation ID | `msea-r28-t8-matrix-2026-07-04` |
| Expected manifest | companion decision matrix |
| Actual changed set | companion decision matrix |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

## Claim Boundary

This matrix selects a metadata-only memory-safe candidate contract route for a
future tranche. It does not authorize MinerU runtime execution, private or
generated content reads, Candidate Group A import, source/test/checker edits,
memory/RAG write, provider/live proof, public-sync, standalone app work,
legal/use-case deep dive, extraction accuracy, document truth, legal quality,
current-law correctness, workflow-chain production readiness, worker commit, or
push.
