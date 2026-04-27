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

The latest closed continuation roadmap is `docs/roadmaps/CVF_W129_T1_NONCODER_CONTROLLED_ROLLOUT_AND_FIRST_SIGNAL_CAPTURE_ROADMAP_2026-04-27.md`.

The previous closed continuation roadmap is `docs/roadmaps/CVF_W128_T1_NONCODER_ROLLOUT_READOUT_AND_OPTIMIZATION_LOOP_ROADMAP_2026-04-27.md`.

No next implementation roadmap is pre-authorized. W130 requires measured signal before GC-018 can issue. Fresh GC-018 required for any continuation.

Treat the W113/W116/W117/W118/W119/W122/W123/W124/W125/W126/W127/W128/W129 boundary language as binding:

- Workspace bootstrap is now agent-enforcement-ready when generated artifacts, workspace-root `WORKSPACE_RULES.md`, and the workspace doctor pass. Canonical workspace topology is `docs/reference/CVF_WORKSPACE_RULES.md`: a non-git parent workspace, hidden `.Controlled-Vibe-Framework-CVF` governance clone, and sibling downstream application folders.
- W113 proved this in one real downstream sample project with live API-backed governance evidence.
- W116 proved the downstream knowledge pipeline: `.md` files in `knowledge/` → ingested chunks → positive retrieval delta confirmed by unit evidence tests (16/16 pass).
- W117 proved the writable knowledge store: `KNOWLEDGE_COLLECTIONS` constant replaced by `InProcessKnowledgeStore`; admin CRUD API and UI delivered; Wave 2 live regression 4/4 pass; D1.4b deferred note retired.
- W118 proved unified persistent knowledge store: `_runtimeCollections` Map eliminated; `InProcessKnowledgeStore` unified with ephemeral path (`registerEphemeral()`); `FileBackedKnowledgeStore` delivers JSON-file persistence for admin-CRUD collections; `KnowledgeStoreAuditEntry` append-only audit trail delivered; `GET /api/admin/knowledge/audit` route delivered; Wave 2 live regression 4/4 pass; CP2 evidence hardening added real file I/O regression coverage (11 CP4 tests + 3 audit route tests in targeted W118 coverage).
- W119 proved the bounded non-coder adoption journey: secret-free first-run readiness; project knowledge ingest into governed `/api/execute`; route-returned `governanceEvidenceReceipt`; ProcessingScreen/ResultViewer evidence visibility and copy/export; live W119 runner 3/3 locked journeys pass on Alibaba lane with raw keys not printed.
- W122 proved the noncoder intent-first front door: `intent-router.ts` as single routing source of truth; `IntentEntry` component extracted and rendered behind `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` feature flag (default `false`); weak-confidence fallback = no routed target (all target fields null, CTA disabled); wizard-family (9-entry) trusted routing subset enforced; evidence parity between routed and direct handoff paths proven (10/10); live E2E 6 passed / 2 skipped on Alibaba `qwen-turbo`; release gate 7/7 PASS. Feature flag default is `false` — rollout-safe. Known limit: VN `ứng dụng` `\b` boundary requires ASCII keywords for strong routing.
- W123 proved noncoder iteration memory and follow-up continuity: `execution-continuity.ts` helper module with `buildContinuationExecution`, `buildRootExecution`, thread selectors, `buildEvidenceSnapshot`, and `buildContinuityParityObject`; `Execution` type extended with `threadId`, `rootExecutionId`, `parentExecutionId`, `projectLabel`, `knowledgeCollectionId`, `evidenceReceiptSnapshot`, `starterSource`; Zustand store extended with `getThreadExecutions` + `setProjectLabel`; `handleFollowUp` in `home/page.tsx` creates durable continuation chain; `HistoryList` shows thread-label + follow-up badge + continue-work CTA behind `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` flag (default `false`); vitest 77/77 targeted; Playwright 6 passed / 1 skipped on Alibaba lane.
- W124 proved noncoder clarification loop and safe routing recovery: `intent-router-clarification.ts` with `startClarification`, `submitClarificationAnswer`, `buildEnrichedInput`, `buildNextQuestion` (max depth=2), `buildClarificationState`, `advanceClarificationState`; eligible cases = `weak_confidence` VN/EN only; browse-only cases = `unsupported_language`, `empty_input`; `IntentEntry` extended with clarification question + option buttons behind `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` flag (default `false`); 5 analytics event types added; vitest 23/23 clarification + 45/45 targeted; Playwright 2 passed / 2 skipped. Feature flag default `false` — rollout-safe. No parallel detector introduced; enrichment delegates to W122 `intent-router.ts`.
- W125 proved noncoder deliverable packs and handoff productization: `deliverable-pack.ts` typed contract (`DeliverablePack`, `PackType`, `PackGovernanceEvidence`); `inferPackType()` with template-match → category-fallback → `documentation_handoff` default; `generateDeliverablePack(execution, receipt?)` builds all pack fields; `serializePackToMarkdown()` 7-section export; `ResultViewer` upgraded with Result/Pack tab toggle and pack preview panel (6 sections); export menu extended with distinct "Download Deliverable Pack (.md)" option; 28/28 unit tests + 36/36 ResultViewer tests + E2E spec 4 journeys; release gate PASS.
- W126 proved trusted form-template routing expansion: `form-routing.ts` adds the bounded trusted-form subset (`email_template`, `documentation`, `competitor_review`, `risk_assessment`, `user_persona`, `feature_prioritization`, `pricing_strategy`, `strategy_analysis`); `routeIntent()` now enforces wizard -> trusted form -> weak-fallback precedence; form routes return `routeType: 'form'` with `starterKey: null`; Home handoff guard became route-type aware; vitest 28/28 pass. Routing claim remains bounded to the audited trusted subset, not the full template corpus.
- W127 proved noncoder adoption metrics and friction baseline: `noncoder-metrics.ts` computes 6 browser-local metrics (`time_to_first_value`, `route_recovery_rate`, `weak_fallback_rate`, `followup_continuation_rate`, `evidence_export_rate`, `deliverable_pack_export_rate`); `generateMetricReport()` + `summarizeFriction()` provide threshold-based readout; analytics instrumentation now includes `intent_routed`, `followup_started`, `evidence_exported`, and `deliverable_pack_exported`; Day-0 baseline artifact is published with N/A values until real traffic accumulates. Release gate PASS.
- W128 proved noncoder rollout readout and optimization loop: `noncoder-rollout-readout.ts` adds typed lane readouts and bounded `RolloutRecommendation` output across 6 lanes (`entry_routing`, `clarification_recovery`, `trusted_form`, `followup_continuity`, `evidence_export`, `deliverable_pack`); recommendations are feature-flag aware via `readNoncoderFlags()` and deterministic threshold logic; `AnalyticsDashboard` now exposes a `Noncoder Health` readout with low-data caveat, summary strip, flag posture, lane cards, and prioritized next actions. Targeted verification: 56/56 pass; release gate PASS 7/7.
- W129 proved noncoder controlled rollout posture and full Stage A → B → C signal capture: GC-018 issued 2026-04-27 (depth audit 9/10); rollout playbook (flag order + enable/hold/rollback criteria) + Stage A operator-local flag posture (`NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR`) + two rollout analytics events (`rollout_flag_enabled`, `rollout_session_start`) + dedicated live signal capture spec (`w129-stage-a-signal-capture.live.spec.ts`) with governed execution `ALLOW`, `intent_routed=5`, `clarification_browse_fallback=0`, and lane readout `entry_routing=healthy`, `trusted_form=healthy`. §7 post-closure addendum: `w129-stage-a-volume-capture.live.spec.ts` — `execution_created=12`, `entry_routing=healthy`, `stageBDecision=STAGE_B_MAY_ENABLE`. §8 Stage B signal capture (2026-04-28): `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true` enabled; `w129-stage-b-signal-capture.live.spec.ts` — 8 short-input (≤5 char) journeys, `clarification_question_asked=8`, `clarification_recovery=healthy`, `stageCDecision=STAGE_C_MAY_ENABLE`. §9 Stage C signal capture (2026-04-28): `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true` enabled; `w129-stage-c-signal-capture.live.spec.ts` — 5 live API journeys, `followup_started=3`, `followup_continuity=healthy`, `rolloutDecision=W129_ROLLOUT_COMPLETE`. All 3 noncoder flags now enabled in operator environment. W129 rollout is FULLY COMPLETE. W130 requires fresh GC-018.
- Web is governance-inherited on the active governed AI path, not the full CVF runtime.
- Future work must improve enforcement without overstating either claim.
