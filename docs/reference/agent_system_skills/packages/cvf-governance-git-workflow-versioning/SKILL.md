# CVF ASSF Package: Governance Git Workflow And Versioning

Memory class: FULL_RECORD

Status: ACTIVE

docType: assf_package

Batch ID: AGSK-R3; ASCP-P4-P6

skillId: cvf-governance-git-workflow-versioning

## Purpose

Guide disciplined branching, commits, conflict handling, and versioning while preserving CVF material/session-sync commit separation.

Use when a governed CVF task matches the `git-workflow-and-versioning` package pattern after explicit package selection and receipt-backed production execution. Do not use as autonomous runtime authority, provider routing authority, public-sync proof, merge approval, commit permission, or permission to bypass active CVF work-order gates.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-governance-git-workflow-versioning/` |
| Owner surface | ASSF package proposal evidence under AGSK-R3 and production scale-up evidence under ASCP-P4-P6 |
| Applies to | ACTIVE receipt-backed production package execution through CVF adapters after explicit request |
| Does not apply to | automatic invocation, full MCP server behavior, provider router mutation, public-sync, merge execution, commit authority, filesystem/browser authority, or downstream action authority |

## Invocation Boundary

| Field | Value |
|---|---|
| Allowed task classes | commit-prep, worktree-hygiene, version-control |
| Allowed roles | dispatcher, worker, reviewer |
| Allowed phases | INTAKE, DISPATCH_AUTHORING, WORKER_EXECUTION, REVIEWER_CLOSURE |
| Allowed surfaces | docs/reference/agent_system_skills/packages/cvf-governance-git-workflow-versioning/, registry entries, truth packets, review artifacts |
| Risk ceiling | R0 |
| Authority ceiling | bounded advisory package guidance; loading never authorizes commit, merge, provider routing, public, production action, filesystem, browser, or external actions |

## Inputs And Outputs

| Field | Value |
|---|---|
| Inputs | operator request or governed task context; source mirror file `.private_reference/source_mirrors/addyosmani__agent-skills/skills/git-workflow-and-versioning/SKILL.md`; active CVF authority and allowed-scope boundaries |
| Outputs | bounded package guidance after explicit production executor request; risk trigger notes; recommended CVF owner-surface routing; receipt-backed source-truth trace for package use |
| Acceptance evidence | AGSK-R3 worker return; AGSK-R5 eligibility audit; SCPL-T2 selection profile coverage; ASCP-P4-P6 production scale-up completion; generated index checks; representative live proof |
| Trigger patterns | git workflow, commit, branching, merge conflict, versioning |

## Risk And Authority

| Field | Value |
|---|---|
| Risk class | R0 |
| Authority ceiling | bounded advisory package guidance only |
| Side effects | none from metadata or package-body loading; actions require separate governed authorization |
| Rollback | restore this package root and registry entry to pre-ASCP-P4-P6 PROPOSED state; remove matching truth packet; regenerate generated indexes |
| Safe stop | stop if ACTIVE source checks, receipt checks, provider diagnostics, or governed work-order authority are missing |
| Policy bindings | ASCP-P4-P6 permits explicit receipt-backed production execution only; no automatic invocation or action authority |

## Progressive Disclosure

| Stage | Accessible fields |
|---|---|
| Metadata selection | skillId, name, domain, purpose, triggerPatterns, riskCeiling, sourceArtifacts |
| Production dry-run | package body may be read only with explicit receipt-backed loader request |
| Production live proof | provider output may be consumed only as proof evidence with usage, policy, use-proof, and production execution receipts |

## Evidence And UAT

| Field | Value |
|---|---|
| Required evidence | AGSK-R3 worker return; AGSK-R5 runtime eligibility audit; SCPL-T2 selection guidance; ASCP-P4-P6 completion review; anatomy checker PASS; certified metadata admission checker PASS; truth packet checker PASS |
| UAT binding | PASSED for explicit receipt-backed production package execution |
| Validation hooks | ASSF anatomy checker; certified metadata admission checker; truth packet checker; package productionization pipeline checker; generated-index drift checker |
| Review evidence | docs/reviews/CVF_ASCP_P4_P6_REMAINING_PACKAGE_PRODUCTION_SCALE_UP_COMPLETION_2026-06-30.md |

## External Disposition

| Field | Value |
|---|---|
| External CLI/MCP disposition | IMPLEMENTED: bounded CLI/MCP envelope delegates to CVF production package executor |
| Adapter contract | docs/reference/agent_system_skills/CVF_ASSF_PRODUCTION_PACKAGE_SCALE_UP_STANDARD.md |
| Adapter evidence | docs/reviews/CVF_ASCP_P4_P6_REMAINING_PACKAGE_PRODUCTION_SCALE_UP_COMPLETION_2026-06-30.md |
| External mutation boundary | external CLI/MCP wrapper may return receipt-backed package execution envelopes only; no external mutation, daemon behavior, public API, provider routing, public-sync, commit, or merge authority is permitted |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer |
| Provider or surface | local workspace plus representative Alibaba DashScope-compatible live model proof |
| Session or invocation | ASCP-P4-P6 package production scale-up, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | mechanical package source rewrite, generated indexes, dry-run smoke, live provider proof, governance gates |
| Target paths | `docs/reference/agent_system_skills/packages/cvf-governance-git-workflow-versioning/` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_ASCP_P4_P6_REMAINING_PACKAGE_PRODUCTION_SCALE_UP_2026-06-30.md` |
| Before status evidence | package root existed in PROPOSED state before ASCP-P4-P6 |
| After status evidence | package root exists in ACTIVE state with receipt-backed production execution boundary |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | ASCP-P4-P6 remaining-package production scale-up only |
| Claim boundary | ACTIVE package-root production evidence only; no automatic invocation or action authority |
| Agent type | reviewer/closer |
| Invocation ID | `ascp-p4-p6-package-cvf-governance-git-workflow-versioning-2026-06-30` |
| Expected manifest | `SKILL.md`; `skill.source.json`; `README.md`; registry entry; truth packet |
| Actual changed set | `SKILL.md`; `skill.source.json`; `README.md`; registry entry; truth packet |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Epistemic Process Block

### Expected Result / Prediction

An ACTIVE ASSF package root should preserve useful upstream workflow discipline while keeping CVF authority, lifecycle, and runtime boundaries explicit.

### Evidence Comparison

The package cites the pinned upstream source mirror, AGSK-R3 package-root creation, AGSK-R5 eligibility audit, SCPL-T2 selection guidance, and ASCP-P4-P6 production scale-up evidence. The package is ACTIVE for explicit receipt-backed production execution only and does not claim automatic invocation, provider routing, public export, or action authority.

### Contradiction Or Gap Disposition

ASCP-P4-P6 resolves the prior UAT, certification, internal-disposition, truth-packet, and adapter-evidence gaps for this package. Full MCP server behavior, provider registry mutation, public export, and downstream action authority remain separate future work.

### Claim Update

The package claim is updated to CVF-owned ACTIVE production package evidence with receipt-backed execution only.

## Claim Boundary

This package root is an ACTIVE CVF adaptation sourced from the upstream `git-workflow-and-versioning` skill at pinned commit `aba7c4e9695c363e65cb59effe926c7f1d1abe3d`. It may be opened only through CVF receipt-backed production package adapters under active governed work-order authority. It does not execute actions autonomously, trigger merges, mutate provider routing, publish public artifacts, or claim automatic invocation.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this package root cites private source mirror, private provenance registry surfaces, and production package proof evidence. Public-safe publication requires separate redaction and public-sync authorization.
