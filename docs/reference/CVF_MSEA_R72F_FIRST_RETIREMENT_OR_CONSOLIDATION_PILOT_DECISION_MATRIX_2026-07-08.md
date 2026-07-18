# CVF MSEA-R72F First Retirement Or Consolidation Pilot Decision Matrix

Memory class: governed-reference
Status: DRAFT_PENDING_REVIEW
docType: reference
Date: 2026-07-08
Execution base head: 4050b0a37

## Purpose

Record the R72F pilot decision for the strongest R72B retirement/consolidation candidate and determine whether a safe non-zero retirement can proceed.

## Scope / Applies To

Applies to the `cross_family_approval_artifact` checker family identified by R72B as the strongest R72F candidate class.

Does not implement checker retirement, deletion, disablement, consolidation, hook edit, Fast Lane standard edit, runtime/source/test edit, public-sync mutation, provider/live proof, merge, push, or public/production claim.

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| R72F must either disposition a candidate or name the exact missing evidence | docs/reference/governance_control_index/CVF_GOVERNANCE_CONTROL_INDEX.md | R72 Routing table | `R72F` | Governance Control Index | ACCEPT |
| R72B selected cross-family approval artifact checkers as strongest candidate class | docs/reference/CVF_MSEA_R72B_GOVERNANCE_CONTROL_CHECKER_LIFECYCLE_INVENTORY_2026-07-08.md | R72F No-Silent-Zero-Retirement Guardrail | `R72F_RETIREMENT_REVIEW_CANDIDATE` | R72B inventory | ACCEPT |
| R72E says missing authority becomes a hold, not lightening | docs/reference/CVF_MSEA_R72E_ABSORB_LANE_CEREMONY_RECLASSIFICATION_TAXONOMY_AND_TRACE_SEED_2026-07-08.md | Taxonomy Principles | `HOLD_SOURCE_AUTHORITY` | R72E taxonomy | ACCEPT |
| Conformance scenarios still cite some deep cross-family checkers | docs/reference/CVF_CONFORMANCE_SCENARIOS.md | CF-076 through CF-079 rows | `run_cvf_packet_posture_gate_conformance.py` | Conformance scenarios | ACCEPT |
| Enterprise evidence pack still cites some deep cross-family checkers | docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md | conformance command list | `check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance_verification.py` | Enterprise evidence pack | ACCEPT |
| Representative direct checker currently fails without default manifest and packet artifacts | governance/compat/check_cross_family_approval_artifact_authority.py | default constants and main | `DEFAULT_MANIFEST`, `DEFAULT_PACKET` | checker source | ACCEPT |

## Checker Source Read-Ahead Block

| Field | Value |
| --- | --- |
| applicableCheckersRead | governance/compat/check_governed_artifact_checker_read_ahead.py; governance/compat/check_markdown_structural_completeness.py; governance/compat/check_agent_operation_trace.py; governance/compat/check_public_export_disposition.py; governance/compat/check_finding_to_governance_learning.py |
| literalTokensReviewed | `Source Verification Block`; `Scope / Applies To`; `Finding-To-Governance Learning Disposition`; `Public Export Disposition`; `Agent Operation Trace Block`; `Claim Boundary` |
| gateRunPurpose | Confirmation after checker-source read-ahead; gates are verification evidence, not first discovery. |
| claimBoundary | Read-ahead covers artifact shape only; retirement safety is established by source references and command evidence. |

## Candidate Selection

| Field | Disposition |
| --- | --- |
| candidateControlRow | GCI child-row candidate from R72B: `cross_family_approval_artifact` checker family |
| parentWatchRow | GCI-010 Fast Lane Governance Controls and GCI-009 External Knowledge Intake Controls remain WATCH references for ceremony-routing context; the selected child row has no standalone GCI row yet. |
| candidateCheckerFamily | `governance/compat/check_cross_family*.py`, with focus on the approval-artifact deep-chain subset |
| R72B original posture | `R72F_RETIREMENT_REVIEW_CANDIDATE` |
| R72F refreshed posture | RETIREMENT_HOLD_SOURCE_GAP |

## Current Source Search Evidence

| Evidence item | Command or source | Observed result | Disposition |
| --- | --- | --- | --- |
| Family size | `Get-ChildItem governance/compat -Filter 'check_cross_family*.py'` | 42 files | PASS |
| Approval-artifact subset size | `Get-ChildItem governance/compat -Filter 'check_cross_family_approval_artifact*.py'` | 33 files | PASS |
| Unreferenced-in-code subset | read-only Python scan across `governance/compat/*.py`, `scripts/*.py`, and `.github/workflows/*` | 9 deep-chain files have no code/workflow caller in that scan | PASS_WITH_LIMIT |
| Docs/source reference check | `rg` over `.github`, `scripts`, `docs/reference`, and `docs/reviews` for deep-chain names | conformance scenarios, enterprise evidence pack, conformance trace, and archive evidence still cite at least part of the deep-chain set | BLOCKS_RETIREMENT |
| Direct representative execution | `python governance/compat/check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification.py --enforce` | FAIL due missing default manifest and packet paths | BLOCKS_RETIREMENT |
| Git history | `git log --oneline -- governance/compat/check_cross_family_approval_artifact_external_revocation_issuer_proof_authority_provenance_attestation_provenance_freshness_proof_verification.py` | single introducing commit `7a6f909ef` | SUPPORTS_REVIEW |

## Decision Matrix

| Candidate | Retirement criteria | Evidence | Decision |
| --- | --- | --- | --- |
| 9 deep-chain cross-family files with no current code/workflow caller | No current caller, no active docs/source reference, no default artifact dependency, no public or release evidence use, and no manual-run runbook dependency | No current code/workflow caller is source-backed, but docs/source references and conformance evidence remain. Direct execution also fails because default artifacts are absent from current path. | RETIREMENT_HOLD_SOURCE_GAP |
| 33 approval-artifact files referenced by conformance script | Script reachability must be either wired/valuable or explicitly retired as obsolete with replacement evidence | `scripts/run_cvf_cross_family_packet_coverage_conformance.py` calls many of these directly; older conformance traces record successful use. | CONSOLIDATION_REVIEW_LATER |
| GCI-010 Fast Lane Governance Controls | Low-risk routing can be widened only after no boundary/source weakening is proven | R72C/R72E provide proposal evidence, but R72F does not implement Fast Lane behavior. | WATCH_KEEP |

## R72F No-Silent-Zero-Retirement Closure Row

| Required item | Disposition |
| --- | --- |
| Named `WATCH` row | GCI-010 Fast Lane Governance Controls |
| Named child row | R72B child row: `cross_family_approval_artifact` checker family |
| Exact missing evidence | Source-backed proof that deep-chain checker names are no longer part of conformance scenarios, enterprise evidence pack guidance, conformance trace expectations, or any manual-run/release runbook. |
| Next action | Open a later checker-maintenance tranche that either removes stale conformance references and then retires the files, or reattaches the files to a documented conformance command if they remain valuable. |

## Finding-To-Governance Learning Disposition

| Field | Disposition |
| --- | --- |
| Defect class | RULE_GAP |
| Learning lane | GOVERNANCE_LOAD_REBALANCING |
| Disposition | N/A_WITH_REASON |
| Reason | R72F found a source-backed retirement hold, not a new repeated checker defect. The governance lesson is already represented by R72F closure criteria. |

## Epistemic Process Block

### Expected Result / Prediction

The R72B strongest candidate would either satisfy retirement criteria or expose exact source-backed missing evidence.

### Evidence Comparison

The candidate exposed exact missing evidence: code/workflow caller absence is not enough because conformance scenarios, enterprise evidence-pack guidance, and conformance traces still cite part of the deep-chain set.

### Contradiction Or Gap Disposition

This partially revises R72B's orphan-candidate interpretation. The family remains a governance-load concern, but immediate retirement is not source-safe.

### Claim Update

R72F closes the pilot as `RETIREMENT_HOLD_SOURCE_GAP`, not as actual retirement.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance decision matrix; it does not mutate public-sync or publish public artifacts.

## Agent Operation Trace Block

| Field | Evidence |
| --- | --- |
| Actor | Codex |
| Provider or surface | Local repository worker execution |
| Session or invocation | R72F no-commit decision pilot |
| Working directory | D:\UNG DUNG AI\TOOL AI 2026\Controlled-Vibe-Framework-CVF |
| Command or tool surface | PowerShell, git, rg, read-only Python scan, governed checker commands |
| Target paths | docs/reference/CVF_MSEA_R72F_FIRST_RETIREMENT_OR_CONSOLIDATION_PILOT_DECISION_MATRIX_2026-07-08.md |
| Allowed scope source | docs/work_orders/CVF_AGENT_WORK_ORDER_MSEA_R72F_FIRST_RETIREMENT_OR_CONSOLIDATION_PILOT_2026-07-08.md |
| Before status evidence | executionBaseHead: 4050b0a37 |
| After status evidence | Pending reviewer closure conversion |
| Diff evidence | `git status --short` lists worker-owned R72F files untracked before reviewer commit. |
| Approval boundary | WORKER_MUST_NOT_COMMIT |
| Claim boundary | Docs-only decision matrix; no implementation or checker mutation. |
| Agent type | Worker |
| Invocation ID | R72F-Codex-2026-07-08 |
| Expected manifest | docs/reference/CVF_MSEA_R72F_FIRST_RETIREMENT_OR_CONSOLIDATION_PILOT_DECISION_MATRIX_2026-07-08.md; docs/reviews/CVF_MSEA_R72F_FIRST_RETIREMENT_OR_CONSOLIDATION_PILOT_WORKER_RETURN_2026-07-08.md |
| Actual changed set | Pending final worker-return status evidence. |
| Manifest delta | Pending final worker-return status evidence. |
| Deletion or rename disposition | No deletion or rename performed. |

## Claim Boundary

This matrix makes a bounded R72F decision: actual retirement is held because source-backed references remain. It does not retire, delete, disable, consolidate, or edit any checker, hook, runtime/source/test file, Fast Lane standard, public-sync file, or session state.
