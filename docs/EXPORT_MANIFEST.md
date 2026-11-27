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

Change summary: CVF Local owner-clarity fixes for the Home specification and the project agent template. A generic small request (R0 or R1, not an external-action request, no matched template) now always grants the bounded first local preview; when the request may mention sending, publishing, an account, real personal data or changing existing files, the packet and the user's readable part say conditionally that such a part is left out of the first version, and if nothing useful remains the agent builds nothing and asks. Every Home packet carries a "Talking to the user" block, and the project agent template a "Talking to the owner" line under its phase model: the owner's language, plain words, no CVF terms, at most three questions with a suggested answer, numbered steps to open and try the result. The no-AI clarification step shows three or four concrete questions chosen from the request text, and the exported specification states the request once in each part without dropping any distinct answer.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx` and its new non-Home fixture test; `cvf-web/src/components/home/HomeSpecComposer.tsx`, `home-spec-export.ts`, `home-spec-readable.ts`, new `home-spec-clarify-questions.ts` and the Home tests; `cvf-web/src/lib/spec-export-home-intake.ts`; `cvf-web/src/lib/home-spec-outside-effect-cues.ts` (comment only); `governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md` (Phase Model lines; two wrapped lines in the handoff section joined without wording change; 180 lines, ASCII, carrier check compliant).

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; one new source file, three new test files and one new test fixture folder `cvf-web/src/components/__fixtures__/` holding an ASCII JSON snapshot; no new extension, dependency, package, route or network call.

Validation: Every changed file is byte-identical to the stated private source commit. On that commit the focused Home and specification suite (22 files, 964 tests), TypeScript, ESLint on the changed files, the instruction carrier check and the private pre-commit governance hooks pass; non-Home exports are byte-identical to the previous generator for all language and mode combinations. Two independent review rounds generated packets for ten hazardous request types in Vietnamese with and without accents and in English and found none that would lead an agent to a real outside effect; the second round confirmed the fixes of the first. In this public projection, ESLint passes on the changed files and 963 of 964 focused tests pass; the one failure is the frozen-file hash check that also fails on the unchanged public base in this Windows checkout (line endings). The full suite was not rerun locally. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"e768ccd1d7e3d58200f43347b3d62d258041a7a8","sourceCommit":"87fdd0cbb6831f63632d33a72d1644be32ca8e50","changedPaths":["EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.non-home.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/__fixtures__/non-home-spec-export.fixture.json","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.export.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.wave2.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-clarify-questions.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-clarify-questions.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-export.dedupe.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-export.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-readable.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-outside-effect-cues.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/spec-export-home-intake.ts","governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
