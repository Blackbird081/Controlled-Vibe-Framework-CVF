# CVF ERH-PD1 Public Surface Drift Workflow Chain

Memory class: FULL_RECORD

Status: CLOSED_PASS_BOUNDED

docType: reference

Date: 2026-06-04

Chain version: `cvf.erhPublicSurfaceDriftWorkflow.pd1.v1`

Checker: `governance/compat/check_erh_public_surface_drift_workflow.py`

## Purpose

Define the ERH public-surface drift workflow chain. The chain converts private
ERH evidence into a bounded public-sync decision model so external agents can
evaluate CVF from public GitHub without being handed stale, missing, or
overbroad claims.

## Scope / Target / Owner Boundary

Target: private provenance governance for public GitHub evaluation readiness.

Owner boundary: this reference owns the drift workflow contract and checker
boundary. It does not own public-sync edits, public push, README wording,
runtime behavior, provider execution, hosted deployment, or dependency
migration.

## Scope / Applies-To

Applies to ERH-derived claims where private evidence may need a public-facing
summary, caveat, or explicit deferral.

Does not apply to production deployment, live governance proof, hosted
freshness, public catalog approval, dependency-audit hardening, or public
marketing copy.

## Workflow Stages

| Stage | Source | Required signal | Claim allowed |
| --- | --- | --- | --- |
| `private_erh_evidence_available` | ERH-T1C/T2C/CI1 completion packets | private evidence paths exist | private evidence can be considered for public-surface routing |
| `workflow_chain_reference` | this file | chain version and bounded verdict markers | workflow contract exists |
| `ledger_required_markers` | PD1 drift ledger | public remote, commit, matrix, action queue, no-live-proof boundary | snapshot is auditable |
| `drift_ledger_traceability` | PD1 drift ledger | private evidence -> public artifact -> status | each ERH item has a public disposition |
| `public_sync_snapshot_recorded` | PD1 drift ledger | public remote, commit, artifact list | public state baseline is recorded |
| `system_loop_interlock` | GC-052 registry | PD1 connection and checker path | loop routing is declared |
| `roadmap_pd1_status` | ERH roadmap | ERH-PD1 and workflow status markers | roadmap tracks this tranche |

## Machine Gate

Run:

```powershell
python governance/compat/check_erh_public_surface_drift_workflow.py --enforce
```

Allowed verdicts:

- `PUBLIC_SUMMARY_EXPORTED_BOUNDED`
- `DRIFT_BOUNDED_WITH_UPDATE_CANDIDATES`
- `BLOCKED`

`PUBLIC_SUMMARY_EXPORTED_BOUNDED` means ERH private evidence has a
source-backed public-surface drift ledger and a bounded public-sync summary was
exported for ERH-T2C and ERH-CI1. It does not mean live governance proof
passed, public readiness is established, dependency/auth posture changed, or
private evidence can be quoted in public documentation.

`DRIFT_BOUNDED_WITH_UPDATE_CANDIDATES` means ERH private evidence has a
source-backed public-surface drift ledger. It does not mean public-sync was
updated, public claims are complete, or public readiness is proven.

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `EXPORTED_IN_PUBLIC_SYNC` | Public-safe summary was exported to the recorded public commit. |
| `EXPORTED_IN_PUBLIC_SYNC_SUMMARY` | Public-safe bounded summary was exported without raw private provenance packets. |
| `PRIVATE_ONLY_DEFERRED` | Private evidence stays private and must not become a public claim yet. |
| `PUBLIC_SUMMARY_UPDATE_CANDIDATE` | A future public-sync tranche may add a bounded summary or caveat. |
| `NO_PUBLIC_CLAIM` | No public-facing claim should be added for this evidence. |

## Claim Boundary

This workflow chain proves only private-to-public drift discipline:
`private evidence -> public artifact -> status`. It does not prove live
governance behavior, provider behavior, hosted freshness, production readiness,
public readiness, dependency-audit hardening, route coverage completeness, or
automatic public readiness.

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Escalation state | Next control action |
| --- | --- | --- | --- | --- |
| Private ERH evidence can outrun public GitHub summaries | OPERATOR_SCOPE_CLARITY_GAP | GOVERNANCE_CONTROL_PLANE | MACHINE_CHECK_ADDED | PD1 drift ledger and checker |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance workflow-chain reference. Public-sync may later
export a smaller bounded summary if the operator approves public surface
updates.

Next action: use the PD1 ledger to decide whether T2C/CI1 require a public
claim-boundary update.
