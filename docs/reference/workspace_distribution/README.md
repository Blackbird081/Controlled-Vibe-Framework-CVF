# CVF Workspace Distribution

Memory class: POINTER_RECORD

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-07-10

## Purpose

Provide the stable public-safe front door for the Windows CVF Workspace
distribution contract.

## Scope / Applies To

Applies to the standalone Windows installer, public profile materializer,
distribution builder, and machine-readable manifest in this directory.

Supported profiles are `public-free` and `paid-user-safe`. Private continuity
profiles are not part of this distribution.

## Files

- `CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json` defines version, public remote,
  required core files, profile artifacts, and root template targets.
- `scripts/install_cvf_workspace.ps1` installs a workspace from the public repo.
- `scripts/sync_cvf_workspace_public_profile.ps1` materializes an allowlisted
  profile from the public core.
- `scripts/build_cvf_workspace_distribution.ps1` builds a checksum-bearing
  bootstrap package.
- `scripts/get_cvf_workspace_status.ps1` reports local or remote-aware health.
- `scripts/repair_cvf_workspace.ps1` restores generated root/profile artifacts
  without changing the hidden-core revision or selected profile.
- `scripts/manage_cvf_workspace.ps1` provides the status, update, and repair
  command surface used by the generated root wrapper.
- `docs/guides/CVF_WORKSPACE_CLASSIFICATION_AND_USAGE_GUIDE.md` explains how
  to choose an audience profile, interpret health status, and classify each
  downstream project before work begins. The installer materializes it at the
  workspace root as `CVF_WORKSPACE_CLASSIFICATION_GUIDE.md`.

## Operator Commands

From the workspace root:

```powershell
.\Manage-CVF-Workspace.ps1 -Action Status -CheckRemote
.\Manage-CVF-Workspace.ps1 -Action Repair
.\Manage-CVF-Workspace.ps1 -Action Update -RunGate
```

Status returns one of `CURRENT`, `UPDATE_AVAILABLE`, `DRIFTED`, or
`REPAIR_REQUIRED`. Status is read-only. Repair does not fetch or replace the
hidden public core and does not select a different profile.

## Boundary

The distribution clones only the public CVF repository. It does not contain or
select private provenance continuity, internal session state, private source
mirrors, credentials, or downstream application data.

## Public Export Disposition

EXPORTED

Public commit: `a4d5dba915f9ca8acea251a3a479ca9e1420d1fc`

The stable front door was exported during R82. R83 changes require their own
bounded public-sync decision before the new command surface is public.

## Claim Boundary

This front door defines a Windows release-candidate distribution surface. It
does not claim cross-platform, hosted, provider, paid-user production, or SLA
readiness.
