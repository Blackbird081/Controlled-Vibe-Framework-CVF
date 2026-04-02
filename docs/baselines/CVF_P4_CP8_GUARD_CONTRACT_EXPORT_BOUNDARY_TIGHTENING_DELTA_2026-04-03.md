# CVF P4 CP8 Guard Contract Export Boundary Tightening Delta — 2026-04-03

Memory class: SUMMARY_RECORD
Status: summarized delta for the second candidate-scoped export implementation packet.

## Summary

`P4/CP8` tightens the public package surface for `CVF_GUARD_CONTRACT` so that the manifest matches the approved first-wave shortlist boundary.

## Delivered Changes

- `EXTENSIONS/CVF_GUARD_CONTRACT/package.json`
  - removes wildcard runtime export
  - removes `enterprise` export
  - adds explicit package `files` allowlist
- `EXTENSIONS/CVF_GUARD_CONTRACT/README.md`
  - documents allowed entries and explicit non-goals
- `EXTENSIONS/CVF_GUARD_CONTRACT/src/package.boundary.test.ts`
  - locks the allowed export map and package file envelope
- `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
  - records the canonical narrowed surface

## Explicitly Unchanged

- `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json`
  - `CVF_GUARD_CONTRACT` remains `exportReadiness: NEEDS_PACKAGING`
- provider-specific runtime integrations remain internal
- no package publication workflow was added
