# CVF ASSF Package: Engineering Debugging And Error Recovery

Memory class: FULL_RECORD

Status: APPROVED

docType: assf_package

Batch ID: AGSK-R3; AGSK-R7

skillId: cvf-engineering-debugging-error-recovery

## Purpose

Guide systematic root-cause debugging using a stop-the-line rule, evidence preservation, structured triage, root-fix discipline, and recurrence guards. Use when a governed CVF task encounters test failures, build breaks, runtime misbehavior, or unexpected errors. Do not use when: runtime activation, automated fix execution, provider/live proof, production incident response without human oversight, or authority beyond the active governed work order is required.

## Scope / Applies-To

| Field | Value |
|---|---|
| Package root | `docs/reference/agent_system_skills/packages/cvf-engineering-debugging-error-recovery/` |
| Owner surface | ASSF package proposal evidence under AGSK-R3 and bounded AGSK-R7 lifecycle promotion evidence |
| Applies to | APPROVED internal package body read through the AGSK-R4 runtime package loader after explicit request |
| Does not apply to | `ACTIVE`, automatic resolver invocation, CLI/MCP adapter, provider/live proof, public-sync, repair execution authority, commit authority, or production readiness |

## Invocation Boundary

| Field | Value |
|---|---|
| Allowed task classes | debugging, error-recovery, root-cause-analysis, regression-fix |
| Allowed roles | dispatcher, worker, reviewer |
| Allowed phases | INTAKE, DISPATCH_AUTHORING, WORKER_EXECUTION, REVIEWER_CLOSURE |
| Allowed surfaces | docs/reference/agent_system_skills/packages/cvf-engineering-debugging-error-recovery/, registry entries, review artifacts |
| Risk ceiling | R1 |
| Authority ceiling | metadata-only advisory; loading never authorizes automated fix execution, production change, or external actions |

## Inputs And Outputs

| Field | Value |
|---|---|
| Inputs | operator request or governed task context; source mirror file `.private_reference/source_mirrors/addyosmani__agent-skills/skills/debugging-and-error-recovery/SKILL.md`; active CVF authority and allowed-scope boundaries |
| Outputs | proposed package-body guidance (awaiting reviewer acceptance); structured triage checklist discipline; recommended CVF owner-surface routing |
| Acceptance evidence | AGSK-R3 worker return with package-root proposal evidence; reviewer-fast gate PASS; anatomy checker PASS |

## Risk And Authority

| Field | Value |
|---|---|
| Risk class | R1 |
| Authority ceiling | metadata-only advisory selection |
| Side effects | none from metadata reading; fix execution, production changes, or rollback actions require separate authorization |
| Rollback | delete this package root and revert registry entry to CANDIDATE; regenerate generated index |
| Safe stop | stop and open a fresh ASSF runtime tranche if automated fix execution, production change authority, or authority above the active work order is needed |
| Policy bindings | none until APPROVED or ACTIVE lifecycle state with separate reviewer authorization |

## Progressive Disclosure

| Stage | Accessible fields |
|---|---|
| Metadata-only (CANDIDATE/PROPOSED) | skillId, name, status, purpose, triggerPatterns, riskCeiling, sourceArtifacts |
| Post-reviewer-acceptance (APPROVED) | full triage checklist and debugging process guidance; requires reviewer decision gate |
| Runtime (ACTIVE) | full instructions with active resolver; requires UAT evidence and separate ACTIVE tranche |

## Evidence And UAT

| Field | Value |
|---|---|
| Required evidence | AGSK-R3 worker return with source reads and 24-candidate coverage table; anatomy checker PASS |
| UAT binding | PASSED for explicit internal package-loader body read only |
| Validation hooks | ASSF anatomy checker; certified metadata admission checker; generated-index drift checker; reviewer-fast gate |
| Review evidence | docs/reviews/CVF_AGSK_R3_RUNTIME_PACKAGE_ACTIVATION_WORKER_RETURN_2026-06-29.md; docs/reviews/CVF_AGSK_R7_RUNTIME_PACKAGE_BATCH_PROMOTION_COMPLETION_2026-06-30.md |

## External Disposition

| Field | Value |
|---|---|
| External CLI/MCP disposition | DEFERRED_WITH_REASON: no external adapter authorized in AGSK-R3 |
| Adapter contract | N/A with reason: external adapter not authored in AGSK-R3 |
| Adapter evidence | N/A with reason: no adapter implemented |
| External mutation boundary | no external mutation, CLI/MCP export, provider call, public-sync, or package activation until separate ASSF adapter or runtime work order accepted |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | AGSK-R3 worker with reviewer packet-shape repair |
| Provider or surface | Local workspace |
| Session or invocation | AGSK-R3 package proposal execution, 2026-06-29 |
| Working directory | Repository root |
| Command or tool surface | PowerShell, repo-local Python governance checkers, apply_patch |
| Target paths | `docs/reference/agent_system_skills/packages/cvf-engineering-debugging-error-recovery/` |
| Allowed scope source | `docs/work_orders/CVF_AGENT_WORK_ORDER_AGSK_R3_RUNTIME_PACKAGE_ACTIVATION_FOR_WORKER_2026-06-29.md` |
| Before status evidence | package root did not exist before AGSK-R3 worker execution |
| After status evidence | package root exists in PROPOSED state pending reviewer acceptance |
| Diff evidence | `git diff --name-status` over AGSK-R3 range |
| Approval boundary | WORKER_MUST_NOT_COMMIT; reviewer/closer owns acceptance and commit |
| Claim boundary | Historical AGSK-R3 package-root evidence only; no runtime activation claim before AGSK-R7 |
| Agent type | worker plus reviewer packet-shape repair |
| Invocation ID | `agsk-r3-package-cvf-engineering-debugging-error-recovery-2026-06-29` |
| Expected manifest | `SKILL.md`; `skill.source.json`; `README.md` |
| Actual changed set | `SKILL.md`; `skill.source.json`; `README.md` |
| Manifest delta | MATCH |
| Deletion or rename disposition | N/A with reason: no deletion or rename |

## Epistemic Process Block

### Expected Result / Prediction

An APPROVED ASSF package root should preserve the upstream skill's useful
workflow discipline while keeping CVF authority, lifecycle, and runtime
boundaries explicit.

### Evidence Comparison

The package cites the pinned upstream source mirror, AGSK-R2 source-mirror
backfill review, AGSK-R3 package-root worker return, AGSK-R6 pilot pattern, and
AGSK-R7 batch promotion review. The package is APPROVED for explicit internal
package-loader body reads only and does not claim ACTIVE resolver behavior,
provider behavior, public export, or external adapter support.

### Contradiction Or Gap Disposition

AGSK-R7 resolves the prior reviewer-acceptance, UAT, certification, and
internal-disposition gap for this batch package only. ACTIVE resolver behavior,
CLI/MCP adapter support, provider proof, public export, and production
readiness remain blockers for later promotion.

### Claim Update

The package claim is narrowed to CVF-owned APPROVED package-loader body-read
evidence only. It is not ACTIVE activation evidence.
## Claim Boundary

This package root is an APPROVED CVF adaptation sourced from the upstream `debugging-and-error-recovery` skill at pinned commit `aba7c4e9695c363e65cb59effe926c7f1d1abe3d`. It may be opened by the AGSK-R4 runtime package loader after AGSK-R7 lifecycle gates pass. It does not execute automated fixes, trigger production changes, implement a CLI/MCP adapter, or claim automatic invocation.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this package root cites private source mirror and private provenance registry surfaces.
