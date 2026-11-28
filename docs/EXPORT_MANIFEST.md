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

Change summary: CVF Web durable memory is bound to the server-resolved principal (ESC-002). Before this change a signed-in user could read another user's durable memory by sending that user's scope, and could overwrite another user's record by id. Every record written through Web now carries the server-resolved origin principal, every Web read must match it exactly, a record id owned by one principal cannot be rewritten by another, and read receipts no longer list other principals' record ids. One resolver (the service identity when a valid service token is present, otherwise the session user) is used by `/api/execute` reads and writes and by `/api/memory/write`; a request without a principal is denied. Durable memory is no longer shared across principals through Web, including project scopes, and origin-less legacy records are not read through Web.

Changed owners: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts` and its test; `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/durable-memory-route.ts` and new `durable-memory-route.origin.test.ts`; `cvf-web/src/app/api/execute/route.ts`, `route-context-selection.ts`, `route-final-response.ts` and two execute tests; `cvf-web/src/app/api/memory/write/route.ts` and its test.

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; one new test file inside an existing folder (`cvf-web/src/lib/durable-memory-route.origin.test.ts`); no new folder, extension, dependency, package, route or network call.

Validation: Every changed file is byte-identical to the stated private source commit. On that commit the full cvf-web suite in an offline container passed 7660 tests with two failing files that also fail on the unchanged base (artifact export bound operation, skill corpus governance); the Learning Plane offline tests, TypeScript and ESLint pass, and the new tests fail without the fix. An independent review found one high and two medium issues in the first round; all were fixed and the second round recommended shipping. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"c6918098347b78320170505b0f4b47286899da38","sourceCommit":"08cd5a34929865297ab49aba5612ac2ab854a3b8","changedPaths":["EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/durable-memory-store.ts","EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/durable-memory-store.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-context-selection.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-final-response.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route-memory-advisory.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.durable-memory.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/write/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/memory/write/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/durable-memory-route.origin.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/durable-memory-route.ts"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
