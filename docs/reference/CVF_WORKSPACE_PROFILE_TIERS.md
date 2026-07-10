# CVF Workspace Profile Tiers

Memory class: ACTIVE_REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-09

## Scope / Applies To

This reference defines the product-facing workspace profile tiers used by
`scripts/sync_cvf_workspace_rule_pack.ps1` and by local workspace guides.

It applies to local workspace rule-pack selection only. It does not change the
public repository, runtime behavior, provider behavior, checker severity,
project-level manifests, project-level policies, or workspace enforcement
rules.

## Purpose

Give the operator and future users a small, memorable profile vocabulary:

- `public-free`
- `paid-user-safe`
- `operator-local`

These names are product tiers. They sit on top of the lower-level profile
catalog so agents do not need to know every internal bundle name before choosing
a reasonable local rule pack.

## Tier Matrix

| Profile | Intended user | Includes | Excludes | Continuity flag |
|---|---|---|---|---|
| `public-free` | free/public-core workspace | core workspace rules, boundary guidance, local memory and handoff templates | private continuity state, extended governance library, live-operation runbooks | not required |
| `paid-user-safe` | paid user or shared downstream team | public-free set plus curated authoring and repository-boundary references | private continuity state, full governance library, and operator-machine-only history | not required |
| `operator-local` | private operator machine | paid-user-safe set plus full local continuity references for the operator's own workspace | public sharing, customer export, hosted claim, production claim | required |

## Command Examples

From a workspace root after a rule-pack wrapper exists:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" -ProfileName "public-free"
```

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" -ProfileName "paid-user-safe"
```

The private operator tier requires an explicit continuity allowance:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" -ProfileName "operator-local" -AllowProvenanceContinuity
```

## Selection Guidance

Use `public-free` when the workspace should stay close to public core and avoid
heavy governance context.

Use `paid-user-safe` when the workspace is for real downstream work and should
inherit more of CVF's useful authoring and boundary guardrails without exposing
private continuity state. Keep full startup-orientation and broader governance
library material in the private operator tier until separately reviewed
public-safe versions exist. Use
`docs/reference/CVF_WORKSPACE_PAID_USER_SAFE_ONBOARDING_FLOW.md` as the
profile setup checklist.

Use `operator-local` only on the operator's private machine. It is meant for
high-continuity local work and should not be copied into a public or customer
workspace.

## Claim Boundary

Rule packs are selected guidance. They do not turn a workspace into the full
CVF provenance repository and do not replace each downstream project's
`AGENTS.md`, `.cvf/manifest.json`, `.cvf/policy.json`, tests, or handoff.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this tier map is source guidance for local workspace profile selection.
Public-safe adaptation is allowed later only through a dedicated public-sync
decision.
