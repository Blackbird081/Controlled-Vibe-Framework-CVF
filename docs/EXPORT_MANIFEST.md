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

Change summary: Bring CVF Web to the private state accepted after the UI01 safety, compliance-report and browser-compatibility fixes. The optional Home "AI clarification" now runs in the browser with the user's own saved OpenAI key. Without a saved key the button is disabled and links to Settings. The site no longer needs a server key or a budget store for it. The AI Safety page and the kernel telemetry route no longer show simulated numbers, and monitoring appears only when backed by data. The compliance report page shows an empty state instead of sample metrics, without the PDF export. Opening a web link from chat minimizes the chat and keeps the conversation. Chat links and clarification cancellation also work in browsers without `URL.parse` or `AbortSignal.any`. The system chain map records its 2026-11-26 review date; that review validated the existing evidence and added none.

Changed owners: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/` (Home composer and clarification panel); `cvf-web/src/app/(dashboard)/` (dashboard layout, removed Home layout, AI Safety page); `cvf-web/src/app/api/intent-spec/home-clarification/` (removed); `cvf-web/src/app/api/kernel-telemetry/`; `cvf-web/src/app/reports/compliance/`; `cvf-web/src/lib/`: Home clarification moved out of `lib/server/`, budget and server provider removed, Home input hook, and English and Vietnamese strings; `cvf-web/src/components/AgentChat.tsx` and `AgentChatMessageBubble.tsx`; `docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json` (review date only).

Structural review: PUBLIC_PROJECTION_STRUCTURE_REVIEWED; the Home clarification module, its test and its fixtures move from `cvf-web/src/lib/server/` to `cvf-web/src/lib/`; the signed-in clarification API route, the server budget store and the server provider are deleted, together with the Home route layout; two new tests sit in the existing `src/app/api/kernel-telemetry/` and `src/app/reports/compliance/` folders; no new folder, extension, dependency or package. The clarification call goes from the browser to OpenAI only with the key the user saved in Settings.

Validation: Every changed Web file is byte-identical to the stated private source commit, and the map differs from the public base only by its review date. On that commit, the private source passed:

- lint, TypeScript and the production build;
- the full Web suite in Docker;
- the browser regression matrices in Vietnamese and English, on desktop and on phone.

An independent reviewer checked that the clarification prompts kept their reviewed SHA-256 values and that the browser-compatibility change matches the reviewed patch.

In this public projection, lint and TypeScript pass for the changed files. The chat, Home clarification, AI Safety, kernel telemetry and compliance report tests pass. The full suite was not rerun locally. CI is the public gate.

```public-change-evidence-json
{"schemaVersion":"cvf.publicChangeEvidence.v1","publicBase":"8593454f337a13c248d2dc0f168c3f7af111587a","sourceCommit":"302147e4cb53cf1905de418bdb1273f9a8150720","changedPaths":["EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/home/layout.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/layout.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/intent-spec/home-clarification/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/intent-spec/home-clarification/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/kernel-telemetry/route.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/kernel-telemetry/route.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/reports/compliance/page.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/reports/compliance/page.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChat.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChat.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AgentChatMessageBubble.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecClarification.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.clarification.test.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/home/HomeSpecComposer.tsx","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-clarification.test.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-clarification.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/home-spec-clarification.wave7.fixtures.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useHomeSpecInput.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/i18n/en.json","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/i18n/vi.json","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification-budget.ts","EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/server/home-spec-clarification-provider.ts","docs/reference/system_chain/CVF_SYSTEM_CHAIN_MAP.json"],"claimBoundary":"PUBLIC_CHANGE_TRACEABILITY_NOT_PRIVATE_CLOSURE"}
```

## Historical Export Binding

- Public source checkout: `30c5e53f33cc9a0be72dc4faa83d61b930b4a8c3`.
- Original export date: `2026-05-09`.
- Provenance tag: `provenance-pre-renewal-2026-05-09`.
- Provenance commit: `16cff60c596af619da040ba8887ce81396dad04e`.
- Original manifest bundle SHA256: `8c7c9924efc94ce9715c1ac5de5554cd338dc56e0f5073fdb339d9ed0165c4dc`.
- Frozen inventory is preserved byte-for-byte at `docs/evidence/archive/EXPORT_MANIFEST_2026-05-09.md`.
- Archived inventory SHA256: `2ED5727817E3C0BBFBDE0F906437F04E06922359967CA0F3ED121A5E7B4E6D0A`.
