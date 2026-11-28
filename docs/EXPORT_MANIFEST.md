# Public Export Manifest

Memory class: POINTER_RECORD
Status: ACTIVE_REFERENCE
docType: reference

## Purpose

Bind current public changes to their source and preserve the historical export
inventory without presenting that inventory as current release proof.

## Scope / Applies To

Owner: public projection release steward. Applies to the curated public export;
private session, dispatch and release approval evidence remain in provenance.

## Contract / Requirements

Every substantive public change carries the summary below and a generated
same-delta path binding. The exporter derives that binding after projection.

## Enforcement / Verification

The existing public candidate preflight and baseline-update public profile
reject missing, unchanged or incomplete change evidence. Frozen inventory bytes
are checked by their raw SHA256. Current public CI determines candidate status.

## Related Artifacts

- [Public documentation index](INDEX.md).
- [Release manifest](reference/CVF_RELEASE_MANIFEST.md).
- [Frozen May 9 inventory](evidence/archive/EXPORT_MANIFEST_2026-05-09.md).

## Claim Boundary

Public change traceability does not prove private closure, provider governance,
production readiness or a successful QBS benchmark claim.

## Public Change Evidence

Change summary: An advisory host load check for CVF builders and CVF Local owners on Windows. `scripts/cvf_host_check.ps1` takes one bounded sample from native Windows counters (memory commit and available memory first, then CPU, disk activity, latency, queue and free space) and reports OK, BUSY, PRESSURE or UNKNOWN with plain English or Vietnamese text, a suggested number of parallel workers and an optional bounded wait while the machine is under pressure. It is advisory only: it never blocks, never stops or pauses processes, never deletes anything, runs no background service, needs no administrator rights and makes no network call. A counter that cannot be read is UNKNOWN, never OK. Exit code 0 for any well-formed command line unless `-FailOnPressure` is given; callers treat any other exit code or empty output as UNKNOWN.

Changed owners: new `scripts/cvf_host_check.ps1` and its test `scripts/test_cvf_host_check.py`.

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; one new script and one new test file inside the existing `scripts/` folder; no new folder, extension, dependency, package, route or network call.

Validation: Both files are byte-identical to the stated private source commit. On that commit the test file passes 143 tests with one non-Windows case skipped, under Windows PowerShell 5.1 and PowerShell 7; tests skip when PowerShell is not available. Two independent review rounds found boundary, message, error-text and runtime issues; all were fixed. Thresholds are tunable proposals, and non-English Windows and a truly saturated disk are not yet verified. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"3501fac72f8f2e21b5997449cb31eb5b1e6374dc","sourceCommit":"fecc0901c11ca8c0e5d2a16cd9e4af8731cc7763","changedPaths":["scripts/cvf_host_check.ps1","scripts/test_cvf_host_check.py"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
