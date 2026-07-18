# CVF Learning-To-Acceleration Reference Front Door

Memory class: POINTER_RECORD

INDEX type: IDX-2 PLANE_OWNER_MAP

Source authority: `docs/baselines/CVF_GC018_L2A_T0_LEARNING_TO_ACCELERATION_CLASSIFICATION_STANDARD_2026-06-22.md`

Status: ACTIVE_REFERENCE

Date: 2026-06-22

Human-reviewable: YES - every routed item maps to a named standard or candidate lane verifiable against cited source.

Claim boundary: navigation and classification routing only; no helper, scaffold, checker, patch-preview, apply mode, runtime, provider/live, public-sync, or universal-control behavior is implemented or claimed by this front door.

Public Export Disposition: DEFERRED_PRIVATE_ONLY

EPISTEMIC_PROCESS_NA_WITH_REASON: front-door index - it routes readers to the L2A standard and related surfaces; it makes no evidence comparison claim.

## Purpose

Provide the stable entry point for the Learning-To-Acceleration (L2A) loop: how
CVF classifies a repeated finding into prevention work and, additionally, into
safe acceleration candidates (helper, scaffold, patch preview, template, or an
explicit no-automation disposition).

This is a POINTER_RECORD. It routes; it does not duplicate standard content.

## Scope / Applies To

Applies to the `docs/reference/learning_to_acceleration/` folder as the stable
front door for the L2A loop. It routes readers to the L2A classification
standard and related learning surfaces.

Does not apply to F2G checker semantics, the autorun workflow, or any helper,
scaffold, checker, or runtime surface. Those remain governed by their own
contracts.

## Scope / Target / Owner Boundary

Target: any role consulting CVF's learning loop that needs to route a repeated
finding into prevention and acceleration classification.

Owner: CVF governance control chain, the same owner surface as F2G and the
agent-error learning philosophy.

Boundary: navigation and routing only. This front door implements no
accelerator, scaffold, checker, patch preview, apply mode, runtime, provider,
public-sync, or universal-control behavior.

## Documents In This Folder

| Document | Role |
|---|---|
| `CVF_L2A_T0_LEARNING_TO_ACCELERATION_CLASSIFICATION_STANDARD.md` | The L2A-T0 classification standard: taxonomy, safety levels, required classification questions, and example use cases. |

## Related Governance Surfaces

| Surface | Relationship |
|---|---|
| `docs/reference/CVF_FINDING_TO_GOVERNANCE_LEARNING_TRIGGER_STANDARD.md` | F2G is the source learning surface and machine-enforced trigger. L2A extends it with an acceleration axis; it does not replace it. |
| `docs/reference/CVF_AGENT_ERROR_TO_GOVERNANCE_LEARNING_PHILOSOPHY_2026-05-28.md` | The Escalation Ladder formalizes the prevention direction (rule to machine check to earliest phase gate). L2A adds the acceleration direction. |
| `docs/reviews/CVF_AAF_T5_WORKER_EXPERIENCE_RETROSPECTIVE_CAPTURE_FOUNDATION_COMPLETION_2026-06-20.md` | AAF-T5 captures worker-experience friction. AAF-T7A closure-conversion assistance is one example L2A use case, deferred until after L2A-T0 closure. |

## How To Use

1. Record the F2G disposition for the finding as usual (prevention axis).
2. Consult the L2A standard and record an `accelerationDisposition` token plus a
   safe automation level when acceleration is relevant.
3. If no acceleration is safe or worthwhile, record `NO_ACCELERATION_APPLICABLE`
   with a reason.
4. Naming an acceleration candidate is a routing decision only. Building the
   accelerator is always a separate operator-selected governed tranche.

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | L2A front-door navigation only |
| claimDisposition | N/A with reason: no Delta execution-control behavior is implemented or claimed |
| receiptEvidence | N/A with reason: no Delta receipt is created or consumed |
| actionEvidence | N/A with reason: no runtime action is executed or observed |
| invocationBoundary | governed documentation/reference navigation only |
| interceptionBoundary | no IDE/shell/git/filesystem/provider interception claim |
| claimLanguage | learning-loop navigation and routing only |
| forbiddenExpansion | helper implementation, scaffold generator, patch application, wrapper/proxy enforcement, arbitrary-command execution, EDIT/COMMIT execution, provider/live, public-sync, queue/daemon, watcher, readiness, full-hook equivalence, and universal control remain out of scope |

## Claim Boundary

This front door routes to the L2A classification standard and related learning
surfaces. It does not implement or authorize any accelerator, scaffold, checker,
patch preview, apply mode, runtime behavior, provider behavior, CLI/MCP
behavior, public-sync, readiness claim, or universal governed-coding control.
