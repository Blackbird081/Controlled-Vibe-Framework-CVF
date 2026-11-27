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

Change summary: CVF Local small-job route. A small low-risk request (R0 or R1) written on CVF Web Home can now reach a first local preview without the full intake ceremony. The Home specification starts with a short section in the user's language, drops unrequested Category and Mode lines, uses R1 instead of the R3 fallback for a generic request, allows 3000-character answers with visible counters and up to ten open questions. For a generic request with no outside-effect cue, the packet grants one first local preview under hard written limits: new files only, sample or typed data only, no network or provider call, no sending, publishing, account, sheet or database connection, money, device or location access, no real personal, payment or secret data, nothing read outside the project and nothing installed; a part of the request that needs any of these is not built or imitated and is named in the handoff. Every other Home packet states that the first preview is not granted. The project agent template carries the matching first-preview clause in its phase model.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx`; `cvf-web/src/components/home/HomeSpecComposer.tsx`, `home-spec-export.ts`, new `home-spec-readable.ts` and three Home tests; `cvf-web/src/lib/spec-export-home-intake.ts`; new `cvf-web/src/lib/home-spec-outside-effect-cues.ts` and its test; `governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md` (Phase Model and gate-profile lines; 180 lines, ASCII, carrier check compliant).

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; three new source files and two new test files inside existing folders (`cvf-web/src/components/home/home-spec-readable.ts` and `HomeSpecComposer.wave2.test.tsx`, `cvf-web/src/lib/home-spec-outside-effect-cues.ts` and its test); no new folder, extension, dependency, package, route or network call. The project agent template keeps its section layout, 180 lines and ASCII text.

Validation: Every changed file is byte-identical to the stated private source commit. On that commit the focused Home and specification suite (19 files, 942 tests), TypeScript and ESLint on the changed files pass, and the instruction carrier check is compliant. Two independent review rounds checked hazardous and ordinary requests in Vietnamese and English; the second round found the packet and template wording consistent and that the written limits contain requests the cue list misses. The cue list is a best-effort net, not the control. In this public projection, ESLint passes on the changed files and 941 of 942 focused tests pass; the one failure is a frozen-file hash check that fails the same way on the unchanged public base in this Windows checkout (line endings). The full suite was not rerun locally. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"1a4a64e398dfa752a3ae5d0cb8af953ae69cc3b3","sourceCommit":"def08f65cb348ac88160bc3af696dd90a19e522c","changedPaths":["EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.export.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.wave2.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-export.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-open-questions.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-readable.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-outside-effect-cues.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-outside-effect-cues.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/spec-export-home-intake.ts","governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
