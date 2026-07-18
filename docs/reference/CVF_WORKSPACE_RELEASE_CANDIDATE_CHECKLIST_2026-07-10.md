# CVF Workspace Release Candidate Checklist

Memory class: ACTIVE_REFERENCE

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-10

## Purpose

Provide the smallest repeatable local check for the CVF Workspace product
surface. It covers a fresh project, an adopted existing project, workspace
refresh, and profile boundaries. It is intentionally a release-candidate
checklist, not a hosted, public, or production release gate.

## Scope / Applies To

Applies to local CVF Workspace release-candidate checks on disposable fresh
and existing projects, local rule-pack outputs, and the documented workspace
refresh wrapper. The operator or assigned reviewer owns the final decision.

Does not apply to public-sync, hosted deployment, provider/live behavior,
downstream application correctness, or production certification.

## Preconditions

- Use disposable projects outside any downstream application under active work.
- Do not use `Policy_Local` as an R81 proof target.
- Run commands from the local workspace root unless the command states the
  provenance repository.
- Keep the active operator profile unchanged, or prove its restoration.

## Checklist

| Area | Command or inspection | Pass meaning | Failure disposition |
|---|---|---|---|
| Fresh bootstrap | `New-CVF-Governed-Project.ps1 -ProjectName <disposable-name>` | The new project exists and its doctor reports all required checks passing. | RC_BLOCKED_WITH_REASON |
| Existing-project adoption | Create an empty disposable directory, then run `New-CVF-Governed-Project.ps1 -ProjectName <existing-name>` | The project is adopted and workspace enforcement reports all checks passing. | RC_BLOCKED_WITH_REASON |
| Workspace refresh | `Update-CVF-Workspace.ps1 -RunGate` | Hidden public core, root wrappers, guides, and workspace enforcement refresh without error. | RC_BLOCKED_WITH_REASON |
| Public-free profile | `sync_cvf_workspace_rule_pack.ps1 -ProfileName public-free` in a disposable workspace | The pack is created and a boundary scan finds no private continuity token. | RC_BLOCKED_WITH_REASON |
| Paid-user-safe profile | `sync_cvf_workspace_rule_pack.ps1 -ProfileName paid-user-safe` in a disposable workspace | The pack is created and a boundary scan finds no private continuity token. | RC_BLOCKED_WITH_REASON |
| Operator-local boundary | Run `operator-local` first without, then with, `-AllowProvenanceContinuity` in a disposable workspace | It fails without the explicit allowance and succeeds with it. | RC_BLOCKED_WITH_REASON |
| Evidence closure | Record commands, target paths, results, changed paths, and the final gate output. | The claim remains bounded to local workspace RC evidence. | RC_BLOCKED_WITH_REASON |

## Boundary Scan Tokens

For public-free and paid-user-safe pack output, scan for the following tokens:

- `CVF_SESSION`
- `provenance-local`
- `Get-CVF-Workspace-OverlayProfiles`
- `Update-CVF-Workspace-Overlay`

A match blocks the RC decision. The operator-local profile is intentionally
excluded from this scan because it is private local continuity by design and
requires the explicit allowance.

## Claim Boundary

Passing this checklist proves only that the local workspace RC flow was
repeatable on the recorded machine and targets. It does not prove a public
release, hosted service, paid-user deployment, provider behavior, or the
suitability of any downstream project.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this is private provenance operational guidance. Public export needs a
separate public-safe review and public-sync decision.
