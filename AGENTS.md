# CVF Agent Instructions

## UI / Web Design Contract

For any UI, frontend, web app, redesign, dashboard, landing page, or visual
handoff work, read the root `DESIGN.md` before implementation. Treat
`DESIGN.md` as the canonical CVF visual contract.

Use external design repos, Claude Design prototypes, screenshots, and copied
HTML only as reference material. Absorb patterns into CVF language; do not
copy a third-party brand identity or override CVF's design contract.

## Mandatory Live Governance Proof

Any test, roadmap closure, release gate, demo proof, or public claim that asserts CVF governance behavior must use a real provider API call.

This includes claims about risk classification, approval flow, phase gates, DLP filtering, bypass detection, output validation, provider routing, audit trail updates, or CVF controlling AI/agent behavior for non-coders.

Mock mode is allowed only for pure UI structure checks such as navigation, routing, static badges, layout, and RBAC pages that do not assert AI governance behavior.

Required command for release-quality proof:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

This command must include live governance E2E and must fail if no DashScope-compatible live key is available. `DASHSCOPE_API_KEY` is accepted directly; `ALIBABA_API_KEY`, `CVF_ALIBABA_API_KEY`, and `CVF_BENCHMARK_ALIBABA_KEY` are accepted aliases. `--e2e` is a targeted UI-only mock check and is not a substitute for governance proof.

Never commit or print raw API key values. Use operator-supplied environment variables such as `DASHSCOPE_API_KEY`, `ALIBABA_API_KEY`, and `DEEPSEEK_API_KEY`.

## Latest Closed Continuation Roadmap

The latest closed implementation roadmap is `docs/roadmaps/CVF_W124_T1_NONCODER_CLARIFICATION_LOOP_AND_SAFE_ROUTING_RECOVERY_ROADMAP_2026-04-27.md`.

The previous closed implementation roadmap is `docs/roadmaps/CVF_W123_T1_NONCODER_ITERATION_MEMORY_AND_FOLLOW_UP_CONTINUITY_ROADMAP_2026-04-27.md`.

No next implementation roadmap is pre-authorized. Fresh GC-018 required for continuation.

Treat the W113/W116/W117/W118/W119/W122/W123/W124 boundary language as binding:

- Workspace bootstrap is now agent-enforcement-ready when generated artifacts, workspace-root `WORKSPACE_RULES.md`, and the workspace doctor pass. Canonical workspace topology is `docs/reference/CVF_WORKSPACE_RULES.md`: a non-git parent workspace, hidden `.Controlled-Vibe-Framework-CVF` governance clone, and sibling downstream application folders.
- W113 proved this in one real downstream sample project with live API-backed governance evidence.
- W116 proved the downstream knowledge pipeline: `.md` files in `knowledge/` → ingested chunks → positive retrieval delta confirmed by unit evidence tests (16/16 pass).
- W117 proved the writable knowledge store: `KNOWLEDGE_COLLECTIONS` constant replaced by `InProcessKnowledgeStore`; admin CRUD API and UI delivered; Wave 2 live regression 4/4 pass; D1.4b deferred note retired.
- W118 proved unified persistent knowledge store: `_runtimeCollections` Map eliminated; `InProcessKnowledgeStore` unified with ephemeral path (`registerEphemeral()`); `FileBackedKnowledgeStore` delivers JSON-file persistence for admin-CRUD collections; `KnowledgeStoreAuditEntry` append-only audit trail delivered; `GET /api/admin/knowledge/audit` route delivered; Wave 2 live regression 4/4 pass; CP2 evidence hardening added real file I/O regression coverage (11 CP4 tests + 3 audit route tests in targeted W118 coverage).
- W119 proved the bounded non-coder adoption journey: secret-free first-run readiness; project knowledge ingest into governed `/api/execute`; route-returned `governanceEvidenceReceipt`; ProcessingScreen/ResultViewer evidence visibility and copy/export; live W119 runner 3/3 locked journeys pass on Alibaba lane with raw keys not printed.
- W122 proved the noncoder intent-first front door: `intent-router.ts` as single routing source of truth; `IntentEntry` component extracted and rendered behind `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` feature flag (default `false`); weak-confidence fallback = no routed target (all target fields null, CTA disabled); wizard-family (9-entry) trusted routing subset enforced; evidence parity between routed and direct handoff paths proven (10/10); live E2E 6 passed / 2 skipped on Alibaba `qwen-turbo`; release gate 7/7 PASS. Feature flag default is `false` — rollout-safe. Known limit: VN `ứng dụng` `\b` boundary requires ASCII keywords for strong routing.
- W123 proved noncoder iteration memory and follow-up continuity: `execution-continuity.ts` helper module with `buildContinuationExecution`, `buildRootExecution`, thread selectors, `buildEvidenceSnapshot`, and `buildContinuityParityObject`; `Execution` type extended with `threadId`, `rootExecutionId`, `parentExecutionId`, `projectLabel`, `knowledgeCollectionId`, `evidenceReceiptSnapshot`, `starterSource`; Zustand store extended with `getThreadExecutions` + `setProjectLabel`; `handleFollowUp` in `home/page.tsx` creates durable continuation chain; `HistoryList` shows thread-label + follow-up badge + continue-work CTA behind `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` flag (default `false`); vitest 77/77 targeted; Playwright 6 passed / 1 skipped on Alibaba lane.
- W124 proved noncoder clarification loop and safe routing recovery: `intent-router-clarification.ts` with `startClarification`, `submitClarificationAnswer`, `buildEnrichedInput`, `buildNextQuestion` (max depth=2), `buildClarificationState`, `advanceClarificationState`; eligible cases = `weak_confidence` VN/EN only; browse-only cases = `unsupported_language`, `empty_input`; `IntentEntry` extended with clarification question + option buttons behind `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` flag (default `false`); 5 analytics event types added; vitest 23/23 clarification + 45/45 targeted; Playwright 2 passed / 2 skipped. Feature flag default `false` — rollout-safe. No parallel detector introduced; enrichment delegates to W122 `intent-router.ts`.
- Web is governance-inherited on the active governed AI path, not the full CVF runtime.
- Future work must improve enforcement without overstating either claim.
