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

## Boundary

The distribution clones only the public CVF repository. It does not contain or
select private provenance continuity, internal session state, private source
mirrors, credentials, or downstream application data.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this provenance source becomes public only through the bounded R82
public-sync decision.

## Claim Boundary

This front door defines a Windows release-candidate distribution surface. It
does not claim cross-platform, hosted, provider, paid-user production, or SLA
readiness.
