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

Change summary: Bring the CVF Web Home specification flow to the UI01 state accepted on the private source since the 2026-11-24 projection. It adds fixed physical-safety guidance and outside-action limits, checked before any template choice. Open questions name the unknown field once. Messages to one person get an assistant-first path. Signed-in users get an optional "AI clarification" appendix that never changes the plain specification. It also adds plain wording on the review screen and assistant header, and an empty state instead of sample rows on the AI Safety page.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/`; `cvf-web/src/app/(dashboard)/` (Home page and layout, dashboard layout, AI Safety page); `cvf-web/src/app/api/intent-spec/home-clarification/`; `cvf-web/src/lib/`: physical safety, Home clarification and budget, Home catalog and input hook, assistant chat hook, OpenClaw sample removal and Vietnamese strings; `cvf-web/src/components/AgentChatHeader.tsx`, `AgentChatMessageBubble.tsx` and `SpecExport.tsx`; `scripts/ui01-jev-eval/`: the frozen candidate inventory and its hash file, read by a Home export regression test.

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; new Home helper modules and tests inside the existing `cvf-web/src/components/home/` and `cvf-web/src/lib/` folders, one Home route layout, one signed-in API route under the existing `src/app/api/intent-spec/` folder, and two frozen JSON files under a new `scripts/ui01-jev-eval/` folder used only by tests; no new extension, dependency or package. The clarification route calls one OpenAI model only for signed-in users, requires a server key and a budget store, and caps spend per user and per site per day.

Validation: Every changed file is byte-identical to the stated private source commit. On that commit, the private source passed:

- lint, TypeScript and the production build;
- the full Web suite in Docker;
- the Home regression matrices in Vietnamese and English, on desktop and on phone.

An independent reviewer reran the hazard and outside-action verification sets on that commit.

In this public projection, lint and TypeScript pass for the changed files, and the Home, assistant, AI Safety and clarification tests pass. The exception is SQLite-backed store tests, which fail the same way on the unchanged public base on the local Windows host. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"1acf525d6284ff413adba4904c7d464f9be2f2d5","sourceCommit":"9dd6305d2b3d7b1bf02f79f710716cf6a00ae28c","changedPaths":["EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/layout.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/page.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/layout.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/intent-spec/home-clarification/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/intent-spec/home-clarification/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChatHeader.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChatHeader.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChatMessageBubble.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChatMessageBubble.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/SpecExport.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecClarification.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.clarification.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.export.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.f1.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.language.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.persistence.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.quick-message.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.readable.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-export.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.wave7b.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-external-request.wave7b2.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-intake.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-open-questions.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-open-questions.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-personal-message.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/home-spec-personal-message.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-clarification.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-jev-catalog.display.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-jev-catalog.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useAgentChat.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useAgentChat.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useHomeSpecInput.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/i18n/vi.json","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/openclaw-config.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/physical-safety.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification-budget.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification-provider.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification-provider.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification.wave7.fixtures.ts","scripts/ui01-jev-eval/candidate-inventory.json","scripts/ui01-jev-eval/freeze.sha256.json"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
