# CVF MSEA-R24-T3 MinerU Local Pipeline Runtime Smoke Readiness Matrix

Memory class: POINTER_RECORD

Status: COMPLETE_PENDING_REVIEW

docType: reference

Date: 2026-07-03

selectedRouteToken: SMOKE_FAIL_DIAGNOSTIC_RECORDED

runtimeSmokeReceiptDisposition: DIAGNOSTIC_RECORDED_NO_OUTPUT_RECEIPT

## Purpose

Record the companion readiness matrix for MSEA-R24-T3 after one authorized
local MinerU CLI smoke attempt failed before output generation and produced a
metadata-safe diagnostic receipt.

## Scope / Applies To

This matrix applies only to MSEA-R24-T3 local private diagnostic evidence for
one command attempt using the accepted T2A config/cache receipt and the smaller
authorized Candidate Group A DOCX file. It does not apply to a successful parser
receipt, extraction output content, provider/live proof, public-sync, RAG/S3,
schema/writer/adapter/checker implementation, legal advice quality,
current-law correctness, workflow-chain completion, or production readiness.

## Source / Receipt Summary

| Field | Value |
|---|---|
| executionBaseHead | `dcb31ace` |
| work order | `docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_2026-07-03.md` |
| worker return | `docs/reviews/CVF_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_WORKER_RETURN_2026-07-03.md` |
| local receipt | `.cvf/runtime/msea-r24-t3-runtime-smoke-receipt.json` |
| stdout log | `.cvf/runtime/msea-r24-t3-runtime-smoke.log` |
| stderr log | `.cvf/runtime/msea-r24-t3-runtime-smoke.err.log` |
| command count | 1 |
| command exit code | 2 |
| command duration | 4.294 seconds |
| timed out | false |
| lingering MinerU process count | 0 |

## Route Decision Matrix

| Route token | Observed evidence | Decision |
|---|---|---|
| SMOKE_FAIL_DIAGNOSTIC_RECORDED | one command ran, exited `2`, created no output directory, and left no MinerU process running | SELECTED |

ledger_terminal=SMOKE_FAIL_DIAGNOSTIC_RECORDED

## Runtime Receipt Matrix

| Receipt field | Observed value | Verification | Disposition |
|---|---|---|---|
| commandAttemptCount | 1 | local receipt JSON | PASS |
| exitCode | 2 | local receipt JSON | FAIL_DIAGNOSTIC |
| outputDirectoryExists | false | local receipt JSON and `Test-Path` | FAIL_DIAGNOSTIC |
| apiOutputDirectoryExists | false | local receipt JSON and `Test-Path` | FAIL_DIAGNOSTIC |
| stdoutLogLength | 0 bytes | filesystem metadata | PASS |
| stderrLogLength | 132 bytes | filesystem metadata | PASS |
| lingeringMineruProcessCount | 0 | local receipt JSON | PASS |

## Diagnostic Matrix

| Field | Value |
|---|---|
| stage | CLI_ARGUMENT_VALIDATION |
| class | LOCAL_INVOCATION_ARGUMENT_QUOTING |
| safe message | MinerU received `D:\UNG` as the path value because the Windows path with spaces was split by the invocation wrapper. |
| retryability | retryable only under a fresh work order because this tranche authorized one command attempt |
| T4 disposition | NOT_RELEASED_WITH_REASON |

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | operator-provided external comparison, critique, or recommendation |
| Chain map route | pinned MinerU source mirror plus accepted T2A local receipt plus R17 private-test boundary to T3 diagnostic readiness matrix |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py`; `governance/compat/check_external_absorption_core.py`; `governance/compat/check_external_absorption_value_conversion.py`; `governance/compat/check_external_absorption_overlap_discipline.py`; `governance/compat/check_source_mirror_migration.py` |
| Owner surface | this readiness matrix |
| Disposition | ADAPT: record one failed smoke diagnostic and no T4 release |
| Claim boundary | private diagnostic matrix only; no source import, public-sync, provider/live proof, extraction-quality claim, or production claim |

## External Absorption Core

| Field | Value |
|---|---|
| Standard | `docs/reference/external_agent_review/CVF_EXTERNAL_ABSORPTION_CORE_STANDARD.md` |
| Input root or repository | `.private_reference/source_mirrors/opendatalab__MinerU/` plus ignored local T3 diagnostic receipt evidence |
| Enumeration command | `Get-ChildItem -Recurse -LiteralPath '.cvf/runtime' -Filter 'msea-r24-t3*' -Force`; safe JSON receipt read |
| Manifest artifact or inline manifest | inline table: Source / Receipt Summary |
| Processing ledger artifact or inline ledger | inline table: Route Decision Matrix and Runtime Receipt Matrix |
| Ledger terminal statuses | READ; ADAPTED; DEFERRED; REJECTED; NO_NEW_VALUE; BLOCKED_UNREADABLE |
| Disposition taxonomy | ABSORB; ADAPT; DEFER; REJECT; BLOCK; NO_NEW_VALUE |
| Owner-surface map | `docs/reviews/CVF_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_WORKER_RETURN_2026-07-03.md`; `docs/reference/CVF_MSEA_R24_T2A_MINERU_ABSOLUTE_CONFIG_PATH_AND_LOCAL_CACHE_BINDING_READINESS_MATRIX_2026-07-03.md`; `docs/reference/CVF_MSEA_R17_T1_MINERU_CANDIDATE_GROUP_A_PRIVATE_TEST_CORPUS_INTAKE_LEDGER_2026-07-03.md` |
| Unresolved items | successful runtime smoke and T4 workflow-chain release remain deferred |
| Completion claim boundary | failed local diagnostic only; no parser success, extraction output, public-sync, or production claim |

ledger_terminal=READ for source and receipt evidence; ledger_terminal=ADAPTED for diagnostic classification; ledger_terminal=DEFERRED for successful smoke and T4; ledger_terminal=REJECTED for direct workflow-chain release.

## External Absorption Value Conversion Matrix

| Source item | Value extracted | Conversion lane | CVF target surface | Next governed action | Runtime/package boundary |
|---|---|---|---|---|---|
| MinerU CLI docs/source | local command surface exists | DOCTRINE_ADAPTED | this readiness matrix | record bounded diagnostic | no source patch |
| Local MinerU venv | CLI binary exists | PACKAGE_CANDIDATE | future rerun packet | verify invocation wrapper | no package mutation |
| T2A config receipt | pipeline path exists | RUNTIME_CANDIDATE | this readiness matrix | preserve preflight evidence | no model download |
| One failed command attempt | invocation wrapper split path with spaces | RUNTIME_CANDIDATE | future rerun packet | fresh work order only | no second command here |
| T4 release condition | successful smoke receipt absent | CHECKER_CANDIDATE | future T4 release decision | keep held | no checker implementation |
| Direct workflow-chain completion | not supported by failed smoke | REJECT_DIRECT_IMPORT | claim boundary | reject | no workflow-chain claim |
| Public export | not authorized | NO_PACKAGE_OR_RUNTIME_VALUE | private provenance only | none | no public-sync |

## Overlap And Novelty Classification

| Source item or group | Existing CVF owner surface checked | Overlap disposition | Novelty / delta | Action |
|---|---|---|---|---|
| T2A config/cache receipt | `docs/reference/CVF_MSEA_R24_T2A_MINERU_ABSOLUTE_CONFIG_PATH_AND_LOCAL_CACHE_BINDING_READINESS_MATRIX_2026-07-03.md` | CONFIRMED_EXISTING | unchanged preflight release evidence | cite |
| MinerU CLI path and options | `.private_reference/source_mirrors/opendatalab__MinerU/mineru/cli/client.py` | CONFIRMED_EXISTING | no new source surface | cite |
| T3 failed invocation diagnostic | OWNER_SURFACE_NOT_FOUND | NEW_FINDING | path-space wrapper failure captured as local diagnostic | record |
| Workflow-chain release | `docs/roadmaps/CVF_MSEA_R24_MINERU_MODEL_SOURCE_FALLBACK_AND_CACHE_COMPLETION_RECOVERY_ROADMAP_2026-07-03.md` | REJECT_DIRECT_IMPORT | not released without successful smoke | defer |

## Corpus Completeness And Report Integrity

- Corpus task class: MSEA-R24-T3 diagnostic readiness matrix.
- Corpus root: ignored local T3 receipt/log metadata and cited T2A/R17/MinerU source surfaces.
- Snapshot time: 2026-07-04T00:02:30+07:00.
- Enumeration command: `Get-ChildItem -Recurse -LiteralPath '.cvf/runtime' -Filter 'msea-r24-t3*' -Force`.
- Manifest artifact or inline manifest: Source / Receipt Summary in this matrix.
- Manifest hash: N/A with reason: ignored local runtime evidence is private and not committed.
- Processing ledger artifact or inline ledger: Route Decision Matrix and Runtime Receipt Matrix.
- Allowed terminal statuses: READ, SKIPPED_WITH_REASON, DEFERRED, BLOCKED_UNREADABLE.
- Reconciliation: manifest=receipt/log metadata plus T2A/R17/MinerU source surfaces; ledger_terminal=READ/ADAPTED/DEFERRED/REJECTED; exclusions=successful parser output, second command, content quotation, public-sync, provider/live proof, production claims; unresolved=0.
- Unresolved files: none for this diagnostic scope.
- Declared exclusions: successful parser output, extraction output content, second command, source document body read, public-sync, provider/live proof, workflow-chain release, production claim.
- Unreadable or unsupported files: none identified for diagnostic metadata.
- Aggregation check: PASS - receipt/log metadata was enumerated.
- Drift check: PASS - input hash and size matched R17 before command.
- Output traceability: worker return and this readiness matrix.
- Adversarial verification: failed command is not treated as parser failure, extraction result, or workflow-chain release.
- Corpus verdict: COMPLETE_WITH_DECLARED_EXCLUSIONS

## Rescan Intelligence Hardening

- Rescan intelligence verdict: NOT_APPLICABLE_WITH_REASON

Reason: N/A with reason: this matrix records one bounded command diagnostic,
not a repository rescan, source refresh, or coverage pass.

| Token | Pre-command state | Post-command state | Disposition |
|---|---|---|---|
| CHANGED_DISPOSITION | no T3 attempt | failed attempt recorded | changed |
| REMOVED_OR_REJECTED | direct T4 release unsupported | direct T4 release rejected | rejected |
| RESOLVED_BY_DESIGN | one-command cap active | no rerun performed | resolved |

## Epistemic Process Block

Epistemic Process Applicability: HIGH_EVIDENCE

Expected Result / Prediction: T3 would either produce a bounded local output
receipt or a diagnostic from one command attempt.

Evidence Comparison Requirement: compare exit code, output directory presence,
receipt fields, and teardown state against the allowed result tokens.

Contradiction or Gap Disposition: a diagnostic occurred before document
processing; successful runtime smoke remains unproven.

Claim Update: T4 stays held because no successful output receipt exists.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next control action | Handled or deferred |
|---|---|---|---|---|---|
| Windows path-space invocation wrappers can split a local path before command validation. | ORCHESTRATOR_PACKET_GAP | GOVERNANCE_CONTROL_PLANE | N/A_WITH_REASON | Future rerun work order should specify literal path-preserving invocation evidence. | deferred |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | worker |
| Provider or surface | Codex local workspace |
| Session or invocation | MSEA-R24-T3 readiness matrix, 2026-07-03 |
| Working directory | `D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF` |
| Command or tool surface | PowerShell safe receipt read and metadata enumeration |
| Target paths | `docs/reference/CVF_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_READINESS_MATRIX_2026-07-03.md` |
| Allowed scope source | T3 work order at `dcb31ace` |
| Before status evidence | companion reference absent before worker execution |
| After status evidence | companion reference untracked; ignored runtime receipt/log files present |
| Diff evidence | `git diff --name-status`; `git ls-files --others --exclude-standard` |
| Approval boundary | companion matrix only |
| Claim boundary | failed local diagnostic matrix only |
| Agent type | worker |
| Invocation ID | `msea-r24-t3-readiness-matrix-2026-07-03` |
| Expected manifest | `docs/reference/CVF_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_READINESS_MATRIX_2026-07-03.md` |
| Actual changed set | `docs/reference/CVF_MSEA_R24_T3_MINERU_LOCAL_PIPELINE_RUNTIME_SMOKE_READINESS_MATRIX_2026-07-03.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename in worker execution |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | MSEA-R24-T3 diagnostic readiness after one local MinerU CLI attempt |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE: diagnostic receipt exists and no success is claimed |
| receiptEvidence | CVF_RECEIPT_PRESENT: `.cvf/runtime/msea-r24-t3-runtime-smoke-receipt.json` |
| actionEvidence | ACTION_EVIDENCE_PRESENT: one command attempt recorded |
| invocationBoundary | local ignored runtime diagnostic only |
| interceptionBoundary | no IDE, provider, CLI/MCP adapter, Web runtime, router, action-authority, or production-route interception claim |
| claimLanguage | readiness matrix for failed diagnostic and held T4 |
| forbiddenExpansion | no second smoke, model download, public-sync, provider/live proof, RAG/S3, schema/writer/adapter/checker implementation, benchmark, extraction-accuracy, legal-quality, workflow-chain completion, or production-readiness claim |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private local runtime diagnostic and Candidate Group A metadata are not
authorized for public-sync or redistribution.

## Claim Boundary

This readiness matrix records only one failed local invocation diagnostic. It
does not claim successful parser execution, extraction output, extraction
accuracy, document truth, legal advice quality, current-law correctness,
workflow-chain completion, public readiness, production readiness, or rerun
authorization.
