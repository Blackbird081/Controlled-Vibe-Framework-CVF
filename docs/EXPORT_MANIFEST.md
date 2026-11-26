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

Change summary: Add a "Latest governance checks" block to the CVF Web AI Safety page. It shows the newest run on the public repository's main branch of three workflows (Documentation & Testing, CVF Static CI Gate, Public Sync Preflight), with the result, the start time in the viewer's time zone, the short commit and a link to the GitHub run. The server reads the public GitHub REST API without a token and keeps the answer for about ten minutes. When GitHub cannot be reached or the rate limit is hit, the page says the results could not be loaded instead of showing old or invented numbers. A Git attribute keeps the frozen UI01 evaluation JSON files on LF endings so their SHA-256 values match on Windows checkouts.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/` (AI Safety page and its test); `cvf-web/src/app/api/governance/check-runs/` (new route); `cvf-web/src/components/GovernanceCheckRuns.tsx`; `cvf-web/src/lib/governance-check-runs.ts`; `cvf-web/src/lib/server/github-governance-checks.ts` and its test; `.gitattributes` (one line for `scripts/ui01-jev-eval/`).

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; one new read-only route under a new `src/app/api/governance/check-runs/` folder inside the existing `src/app/api/` tree, one component in the existing `src/components/` folder, one shared type file in `src/lib/` and one server module with its test in `src/lib/server/`; no new extension, dependency or package. The server module calls only `api.github.com` for the repository named by `CVF_GOVERNANCE_GITHUB_REPOSITORY` (default: this public repository), with no secret and a five-second timeout.

Validation: Every changed Web file is byte-identical to private source commit `ce12ae4f8`, and `.gitattributes` differs from the public base by one added line. On that commit, the private source passed:

- lint, TypeScript and the production build;
- the full Web suite in Docker;
- the browser matrices in Vietnamese and English, on desktop and on phone.

A live call to the GitHub API returned the three expected `success` results. An independent reviewer reran the focused tests and the system chain checks.

In this public projection, lint and the tests for the AI Safety page and the GitHub check source pass. The full suite was not rerun locally. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"543ed3ddad3faa7134523bd05034cefa40c2c667","sourceCommit":"ce12ae4f8695ae536279d96810794c835bd14ba7","changedPaths":[".gitattributes","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/check-runs/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/GovernanceCheckRuns.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governance-check-runs.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/github-governance-checks.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/github-governance-checks.ts"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
