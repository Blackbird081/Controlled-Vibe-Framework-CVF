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

Change summary: Two CVF Web quality fixes. First, the Home request check now recognises a request to act on the user's behalf when one to three describing words sit between the verb and the thing, for example "book me a hotel room for tomorrow" or "order a large pizza", in English and Vietnamese; requests to write instructions about booking stay ordinary writing tasks, and the physical-safety check still takes priority. Second, when a user has not chosen an OpenAI model, CVF Web now defaults to `gpt-6-luna` instead of `gpt-4o-mini`; a model the user already saved is kept, `gpt-4o-mini` stays selectable, and the OpenAI lane keeps its existing readiness status.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.ts` and its test; `cvf-web/src/lib/governed-route-providers.ts`, `cvf-web/src/lib/ai/types.ts`, `cvf-web/src/lib/ai-providers.ts`, `cvf-web/src/lib/budget.ts` and their tests; `cvf-web/src/components/ProviderSwitcher.tsx`, `cvf-web/src/components/ApiKeyWizard.tsx` and the Settings test; four execute and provider route tests and the canonical Web gateway execution test (default model expectations).

Validation: Every changed Web file is byte-identical to the stated private source commit. On the private source, lint, TypeScript, the production build, the full Web suite in Docker and the browser matrices in Vietnamese and English, on desktop and on phone, passed. An independent reviewer ran a held-out set of hazard, action and ordinary requests (14/14, 7/7 and 11/11) and one live assistant call confirmed the new default model answers.

In this public projection, lint passes for the changed files and six of the nine changed test files pass. The three execute route test files fail on the local Windows host with the same SQLite IO error on the unchanged public base (141 of 141 tests before and after). The full suite was not rerun locally. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"44ddf51b033958d3e95aa19551261ba981ec01c4","sourceCommit":"4c025dcd718aac381af5f02d363f19221d186269","changedPaths":["EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.canonical-build.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.canonical-denials.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ApiKeyWizard.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ProviderSwitcher.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai-providers.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai-providers.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/types.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/budget.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/budget.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/canonical-web-gateway-execution.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-route-providers.ts"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
