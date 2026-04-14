# CVF Agent Handoff — 2026-04-13

> Branch: `main`
> Branch posture: `main` is the canonical continuation branch after 2026-04-04 convergence; `cvf-next` is kept as a synchronized mirror for compatibility
> Latest branch-governance posture: relocation closed-by-default; canon converged to `main`
> Remote tracking branch: `origin/main` (canonical continuation)
> Compatibility mirror branch: `origin/cvf-next`
> Exact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff
> State: **UNIFIED ON MAIN / PVV ALIBABA CHECKPOINT CLOSED / W71 POST-CLOSURE KNOWLEDGE NATIVE ADOPTION CLOSED DELIVERED** — W66-T1 CP1 (Corpus + Rubric Freeze): **COMPLETE**; W66-T1 CP2 (Run Harness Setup): **COMPLETE**; W66-T1 CP3B (Controlled Value Test): **COMPLETE 2026-04-12** with `BypassDetectionGuard` verification closing the P1 gap; one-provider / Alibaba / multi-role internal checkpoint is now sufficient for the current pause point; PVV API-key testing is intentionally paused by operator decision and future reopen must be explicit. `W67-T1 External Asset Productization` is delivered; `W68-T1 Governed Registry Hardening` is delivered; `W69-T1 Governed Registry Lifecycle + Read Model` is delivered; `W70-T1 Governed Registry Operator Surface` is delivered; `W71-T1 Post-Closure Knowledge Native Adoption` is now delivered — absorbed knowledge is CVF-native: 6 canonical docs, 1 bounded-invariant, 5 deferred-by-design; external-asset governance lane (`/prepare` + `/register` + `/retire` + operator page) is official CVF behavior. W65-T1 Phase B Packaging remains **COMPLETE** — 3 packages `CANDIDATE` + 1 `REVIEW_REQUIRED`; W64-T1 Track 5: **COMPLETE**; Post-MC5 Continuation Strategy: **ALL 6 ACTIONABLE TRACKS COMPLETE**; local verification baseline `2026-04-13`: CPF 2999 / EPF 1301 / GEF 625 / LPF 1493 all pass; `cvf-web` passes `tsc + full vitest (122 files / 1928 tests)` and build.
> Architecture baseline snapshot: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; document type: CLOSURE-ASSESSED; operational readout refreshed through `2026-04-13`)

---

## Current State

- External agent memory files: non-canonical convenience only; resume from repo truth first
- Non-canonical side lanes are separate from this handoff; use this file for canonical continuation on `main`
- `cvf-next` is now a synchronized compatibility mirror and should not drift ahead of `main` without an explicit branch strategy change
- Pre-public restructuring posture is now narrowed, canonized, and closed-by-default: avoid reopening root-level relocation unless a separate preservation override explicitly justifies it
- Canonical scan continuity registry: `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`

### Local Verify Baseline (2026-04-13)
- CPF (Control Plane Foundation): `npm run check` + `npm test` clean; **2999 tests, 0 failures**
- EPF (Execution Plane Foundation): `npm run check` + `npm test` clean; **1301 tests, 0 failures**
- GEF (Governance Expansion Foundation): `npm run check` + `npm test` clean; **625 tests, 0 failures**
- LPF (Learning Plane Foundation): `npm run check` + `npm test` clean; **1493 tests, 0 failures**
- `cvf-web`: `npx tsc --noEmit` clean; `npm run test:run` clean; **1928 passed / 3 skipped**; `npm run build` clean
- `.github/workflows/cvf-ci.yml` now mirrors this local baseline across Guard Contract, MCP server, 4 foundation packages, and `cvf-web`; first hosted GitHub Actions confirmation is still pending

### Reuse Rule For Future Agents
- Treat the `2026-04-13` local verification set as the current shared baseline.
- Do **not** rerun the full foundation suites or full `cvf-web` baseline by default when your work does not touch those verified surfaces.
- Rerun only if at least one of these changes: package manifests or lockfiles, test/build config, shared contract exports, dependency install state, runtime/toolchain version, or files inside the surfaces you modify.
- If your change is tightly scoped, run the smallest proving command that covers your touched surface and inherit the remaining baseline from this handoff.

### Last Tranches Closed

| Tranche | Description | Status |
|---------|-------------|--------|
| W71-T1 CP1+CP2+CP3+CP4+CP5 | Post-Closure Knowledge Native Adoption (NATIVE-ADOPTION class) | **CLOSED DELIVERED 2026-04-13** — **CP1 canon posture finalization**: 6 promoted docs reclassified `CANONICAL — CVF-NATIVE` (`CVF_SEMANTIC_POLICY_INTENT_REGISTRY.md`, `CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`, `CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`, `CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`, `CVF_PLANNER_TRIGGER_HEURISTICS.md`, `CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md`); 1 doc reclassified `BOUNDED INVARIANT — CVF-NATIVE` (`CVF_PROVISIONAL_EVALUATION_SIGNAL_CANDIDATES.md` — provisional signals native, weights deferred); 1 doc already `reference appendix` (`CVF_W7_WINDOWS_POWERSHELL_COMMAND_REFERENCE.md`); 5 W7/CLI docs reclassified `DEFERRED BY DESIGN` (CLI not yet built). **CP2 governance-native**: no code changes required — route behavior already first-class; uplift language removed from docs. **CP3 runtime-native**: external-asset governance lane declared official CVF-native surface (not post-closure sidecar). **CP4 whitepaper/README/handoff**: whitepaper header + baseline note + posture table updated; README.md posture markers updated to reflect final classification; AGENT_HANDOFF.md updated. **CP5 quality closure**: 30/30 targeted route tests pass; tsc clean; no code changes — runtime surfaces already proven by W67-W70 delivery. |
| W70-T1 CP1+CP2+CP3+CP4 | Governed Registry Operator Surface (REALIZATION class) | **CLOSED DELIVERED 2026-04-13** — **CP1 UI lifecycle types**: `LifecycleStatus`, `StatusFilter`, `RegistryEntry` extended with `lifecycleStatus`/`retiredAt`; `LIFECYCLE_BADGE` constant (green=Active, gray=Retired). **CP2 operator actions**: `handleRetire(id)` calls `POST /api/governance/external-assets/retire`; read-after-write `loadRegistry()` on success; `retireLoadingId`/`retireError` state; retire button visible only on active entries. **CP3 filter surface**: `statusFilter` state (`all\|active\|retired`) + dropdown in Registry tab; `loadRegistry(filter)` passes `?status=filter` to GET route when not 'all'; filtered listing syncs to server lifecycle state. **CP4 409 duplicate guidance**: `handleRegister()` detects 409, sets `duplicateEntry`; amber guidance box in Prepare tab with entry ID and "retire first, then re-register" instructions. UI is a pure consumer — no client-side lifecycle authority; all lifecycle writes go through server routes. 1928/1931 full suite (unchanged — page.tsx has no unit tests; route contract covered by route.test.ts); `tsc --noEmit` clean; `npm run build` clean; GC-023 Violations: 0 (page.tsx ~590 lines, under 700 advisory). |
| W69-T1 CP1+CP2+CP3 | Governed Registry Lifecycle + Read Model (REALIZATION class) | **CLOSED DELIVERED 2026-04-13** — **CP1 lifecycle semantics**: `lifecycleStatus: 'active' \| 'retired'` + `retiredAt?` in `AssetRegistryEntry`; append-only `RegistryRetirementRecord` in JSONL; `readAllLines()` applies retirement markers on read; `retireEntry(id)` appends retirement and returns retired entry; `findDuplicate()` now filters to active-only (retired entries allow re-registration); legacy entries default to 'active'. **CP2 read/query model**: `filterRegistryEntries(filter)` by status/source_ref/candidate_asset_type (ANDed); GET `/register` accepts `?status=`, `?source_ref=`, `?candidate_asset_type=` filter params; new `POST /retire` route with auth + 400/404 gates. **CP3 docs/handoff**: API contract updated (retire route, lifecycleStatus field, filter params, lifecycle-aware duplicate policy); AGENT_HANDOFF updated. 54 targeted tests pass (30 helper + 16 register route + 8 retire route); 1928/1931 full suite; `tsc --noEmit` clean; GC-023 Violations: 0. |
| W68-T1 CP1+CP2+CP3+CP4 | Governed Registry Hardening (HARDENING class) | **CLOSED DELIVERED 2026-04-13** — **CP1 duplicate gate**: `findDuplicate(source_ref, candidate_asset_type)` in `asset-registry.ts`; `/register` POST returns 409 with `existingEntry` on repeat registration; `registerAssetMock` not called on 409. **CP2 read/detail**: GET `/register?id=<uuid>` returns single entry (200) or 404; `getRegistryEntry` wired to query param. **CP3 persistence hardening**: `asset-registry.test.ts` (14 tests, new file); covers missing file → `[]`, malformed JSONL lines skipped, multi-entry read, `getRegistryEntry` by id, `findDuplicate` key logic, `registerAsset` dir creation + append + JSON round-trip. **CP4 docs/handoff**: API contract updated (409 duplicate policy + GET detail spec); handoff updated. 26/26 new targeted tests pass; 1900/1903 full suite. GC-023 Violations: 0. |
| W67-T1 CP1+CP2+CP3 | External Asset Productization — Full Wave (REALIZATION class) | **CLOSED DELIVERED 2026-04-13** — GC018-W67-T1-EXTERNAL-ASSET-PRODUCTIZATION authorized; **CP1**: `workflowStatus` (`invalid\|review_required\|registry_ready`) type + field in `ExternalAssetGovernanceResult`, 5/5 prepare-route tests (all 3 status transitions); operator UI at `/governance/external-assets`. **CP2**: `asset-registry.ts` registry lib + `POST/GET /api/governance/external-assets/register` route; 8/8 register-route tests; append-only JSONL at `data/governed-asset-registry.jsonl`, isolated from `/api/execute` + PVV. **CP3**: human-readable closure guidance per status in UI; warning groups; register button gated on `registry_ready`; registry tab with audit list; API contract doc at `docs/reference/CVF_W67_T1_EXTERNAL_ASSET_GOVERNANCE_API_CONTRACT.md`. 13/13 tests pass; tsc clean. |
| W66-T1 CP2 | Product Value Validation Wave — Run Harness Setup (DOCUMENTATION / VALIDATION_TEST class) | CLOSED DELIVERED 2026-04-11 — first controlled-lane seed FROZEN (`claude-sonnet-4-6`; CFG-A: direct API, temp 0.3, max_tokens 2048; CFG-B: cvf-web governed path, same parity); evidence capture schema FROZEN; reviewer calibration set (5 tasks, 1 per class) FROZEN; 7-item pre-CP3A/CP3B evidence completeness checklist FROZEN; test delta 0; code delta 0; Fast Lane (GC-021). Canon note: this seed is retained for future `CP3B` controlled comparison; it is not, by itself, proof that CVF is a full provider-hub product across all providers. |
| W66-T1 CP1 | Product Value Validation Wave — Corpus and Rubric Freeze (DOCUMENTATION / VALIDATION_TEST class) | CLOSED DELIVERED 2026-04-11 — 90-task corpus FROZEN (A1×30 FAM-001/002/003 + A2×20 FAM-004/005 + B×20 real product + C×20 governance stress); rubric FROZEN; run manifest PLANNED; GC-042 evidence chain foundation established; test delta 0; code delta 0; Fast Lane (GC-021) |
| W65-T1 | Pre-Public Packaging Phase B (PACKAGING class) | CLOSED DELIVERED 2026-04-10 — 4 packages processed; `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`: `exportReadiness CANDIDATE`; `CVF_GOVERNANCE_EXPANSION_FOUNDATION`: `exports/files/license/keywords/README + CANDIDATE`; `CVF_LEARNING_PLANE_FOUNDATION`: `exports/files/license/keywords/README (new) + CANDIDATE`; `CVF_v1.7.1_SAFETY_RUNTIME`: `REVIEW_REQUIRED` + 4 blockers documented; test delta 0; Fast Lane (GC-021) |
| W64-T1 | Track 5 Deferred Architecture (DEFERRED ARCHITECTURE class) | CLOSED DELIVERED 2026-04-08 — Track 5A: `ProviderRouterContract` delivered in CPF using Option B governance routing; Track 5B: `SandboxIsolationContract` + `WorkerThreadSandboxAdapter` delivered using `worker_threads`; doctrine audit closed; Track 5A + 5B complete; Post-W64 quality assessment: **100%**; Post-MC5 Continuation Strategy: **ALL 6 ACTIONABLE TRACKS COMPLETE**; commit `2160c4d5` |
| W63-T1 | Pre-Public Packaging (PACKAGING class) | CLOSED DELIVERED 2026-04-08 — Phase A modules prepared for export readiness (Guard Contract, MCP Server, Deterministic Reproducibility); Export boundaries defined (2 new + 1 verified); `exportReadiness` metadata added to 3 package.json files; Packaging documentation complete (3 README.md updated); No internal dependency leakage; Track 3 from Post-MC5 Continuation Strategy complete; Post-MC5 Continuation Strategy: **ALL 4 TRACKS COMPLETE**; GC-018 authorization; commit pending |
| W62-T1 | Documentation Curation (DOCUMENTATION class) | CLOSED DELIVERED 2026-04-08 — Sensitivity classification complete (PUBLIC_READY 61 files, NEEDS_REVIEW 15 files, PRIVATE_ONLY 2325 files); PUBLIC_DOCS_MIRROR boundary finalized with explicit file lists; .publicignore created; Root docs refreshed (README.md, START_HERE.md); POST_MC5_ORIENTATION.md created in docs/guides/; Track 4 from Post-MC5 Continuation Strategy complete; No GC-018 required (DOCUMENTATION class); commit `a5af2c1b` |
| W61-T1 | CI/CD Expansion + Product Hardening (INFRA class) | CLOSED DELIVERED 2026-04-08 — Added 5 new CI jobs for foundation tests (test-cpf 2929, test-epf 1301, test-gef 625, test-lpf 1465, test-web-ui 1853); added build verification for cvf-web; CI coverage: **1.5% → 100%** (+8173 tests); CP3 (pre-push hook fix) deferred; Full Lane (GC-019); commit `92a3a946` |
| W60-T1 | cvf-web Typecheck Stabilization (REMEDIATION class) | CLOSED DELIVERED 2026-04-07 — Resolved 97 TypeScript errors across cvf-web (CP1: Guard Contract export 9 errors; CP2: Provider set expansion 17 errors; CP3: Schema drift fixtures 53 errors; CP4: Error-handling test refactor 4 errors; CP5: Unused @ts-expect-error cleanup 5 errors); Bonus: fixed 3 pre-existing test failures; TypeScript: **0 errors**; Tests: **1853 passed**; 17 files modified (1 production, 16 test); Fast Lane (GC-021); commit `c15aa4c5` |
| W59-T1 | MC5: Whitepaper + Tracker Canon Promotion Pass (DOCUMENTATION / DECISION class) | CLOSED DELIVERED 2026-04-07 — MC5 Whitepaper + Tracker Canon Promotion Pass complete; whitepaper document type promoted to **CLOSURE-ASSESSED**; all four plane banners promoted (`CPF DONE-ready`, `GEF DONE (6/6)`, `LPF DONE-ready (7/7)`, `EPF DONE-ready`); component labels promoted per MC1-MC4 evidence; no code changes; MC sequence **MC1-MC5 FULLY COMPLETE** |
| W58-T1 | MC4: EPF Plane Closure Assessment (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-07 — EPF plane-level posture: **DONE-ready**; all 20 base contracts + 18 consumer pipelines + 18 consumer pipeline batches + 9 standalone batches present; EPF 1301 tests 0 failures; Model Gateway **DEFERRED** (boundary governance in CPF W8-T1 + W39-T1; EPF provider routing intentionally future-facing — requires CVF_v1.7.3_RUNTIME_ADAPTER_HUB in future wave); Sandbox Runtime **DEFERRED** (worker agents governed via Dispatch/PolicyGate/CommandRuntime; full physical isolation intentionally future-facing); epf_plane_scan: FULLY_CLOSED; no new EPF implementation needed; whitepaper promotion later landed in W59-T1 MC5 |
| W57-T1 | MC3: LPF Plane Closure Assessment (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-07 — LPF plane-level posture: **DONE-ready (7/7)**; all 20 base contracts + 18 consumer pipelines + 18 consumer pipeline batches + 2 standalone batches present; LPF 1465 tests 0 failures; Storage/Eval Engine **DONE** (label currency gap closed); Observability **DONE** (label currency gap closed); GovernanceSignal **DONE** (label currency gap closed); no implementation gap remains; MC3 fully complete |
| W56-T1 | MC2: GEF Plane Closure Assessment CP1+CP2 (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-05 — GEF plane-level posture: **DONE (6/6)**; all 13 base contracts + consumer pipeline batch contracts present; `watchdog.escalation.pipeline.batch.contract.ts` present; GEF 625 tests 0 failures; Trust & Isolation **DONE** (CP2: label currency gap closed — W8-T1/W19-T1/W20-T1/W21-T1 all closed, GEF checkpoint + watchdog enforce trust, 7/7 DONE criteria satisfied); no implementation gap remains; MC2 fully complete |
| W55-T1 | MC1: CPF Plane Closure Assessment (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-05 — CPF plane-level posture: **DONE-ready**; all CPF batch barrel families verified FULLY CLOSED; all CPF consumer bridges closed; CPF 2929 tests 0 failures; agent-definition registry + L0-L4 consolidation deferred (relocation-class, CLOSED-BY-DEFAULT); no new CPF implementation needed; whitepaper banner later aligned to DONE-ready in MC5 |
| W54-T1 | ExecutionReintakeBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `ExecutionReintakeBatchContract` canonical; EPF 1301 (+26); `ExecutionReintakeContract.reinject()` batch surface FULLY CLOSED; Phase E: ExecutionReintake + ExecutionReintakeSummary exports moved to `epf.dispatch.barrel.ts` (~170 lines); dispatch-gate-runtime-async-status-reintake barrel family complete; EPF standalone batch wave W49–W54 ALL CLOSED |
| W53-T1 | AsyncExecutionStatusBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `AsyncExecutionStatusBatchContract` canonical; EPF 1275 (+26); `AsyncExecutionStatusContract.assess()` batch surface FULLY CLOSED; Phase D: AsyncExecutionStatus exports moved to `epf.dispatch.barrel.ts` (~139 lines); dispatch-gate-runtime-async-status barrel family complete |
| W52-T1 | AsyncCommandRuntimeBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `AsyncCommandRuntimeBatchContract` canonical; EPF 1249 (+27); `AsyncCommandRuntimeContract.issue()` batch surface FULLY CLOSED; Phase C: AsyncCommandRuntime exports moved to `epf.dispatch.barrel.ts` (~120 lines); dispatch-gate-runtime-async barrel family complete |
| W51-T1 | CommandRuntimeBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `CommandRuntimeBatchContract` canonical; EPF 1222 (+23); `CommandRuntimeContract.execute()` batch surface FULLY CLOSED; Phase B: CommandRuntime exports moved to `epf.dispatch.barrel.ts` (94 lines); dispatch-gate-runtime barrel family complete |
| W50-T1 | PolicyGateBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `PolicyGateBatchContract` canonical; EPF 1199 (+23); `PolicyGateContract.evaluate()` batch surface FULLY CLOSED; Phase A: PolicyGate exports moved to `epf.dispatch.barrel.ts`; dispatch-gate barrel family complete |
| W49-T1 | DispatchBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `DispatchBatchContract` canonical; EPF 1176 (+22); `DispatchContract.dispatch()` batch surface FULLY CLOSED; EPF `index.ts` barrel split (1450→1423); `epf.dispatch.barrel.ts` introduced; EPF standalone batch wave open |
| W48-T1 | ExecutionBridgeConsumerBatchContract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — `ExecutionBridgeConsumerBatchContract` canonical; EPF 1154 (+31); `ExecutionBridgeConsumerContract.bridge()` batch surface FULLY CLOSED; consumer batch wave W44–W48 complete |
| W47-T1 | Whitepaper Update v3.7-W46T1 (DOCUMENTATION class) | CLOSED DELIVERED 2026-04-05 — whitepaper bumped `v3.6-W32T1` → `v3.7-W46T1`; W33–W46 REALIZATION tranches recorded; CPF 2929 unchanged; documentation-to-implementation gap CLOSED |
| W46-T1 | Design Consumer Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — DesignConsumerBatchContract canonical; CPF 2929 tests (+29); all 9 pass conditions satisfied; DesignConsumerContract.consume() batch surface closed; `control.plane.design.boardroom.barrel.ts` FULLY CLOSED |
| W45-T1 | Gateway Consumer Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — GatewayConsumerBatchContract canonical; CPF 2900 tests (+30); all 9 pass conditions satisfied; GatewayConsumerContract.consume() batch surface closed; `control.plane.gateway.barrel.ts` FULLY CLOSED |
| W44-T1 | Consumer Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — ConsumerBatchContract canonical; CPF 2870 tests (+30); all 9 pass conditions satisfied; ConsumerContract.consume() batch surface closed; workflow batch family FULLY CLOSED |
| W43-T1 | Route Match Log Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — RouteMatchLogBatchContract canonical; CPF 2840 tests (+27); all 9 pass conditions satisfied; RouteMatchLogContract.log() batch surface closed; gateway log batch family FULLY CLOSED |
| W42-T1 | Gateway PII Detection Log Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — GatewayPIIDetectionLogBatchContract canonical; CPF 2813 tests (+27); all 9 pass conditions satisfied; GatewayPIIDetectionLogContract.log() batch surface closed |
| W41-T1 | Gateway Auth Log Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — GatewayAuthLogBatchContract canonical; CPF 2786 tests (+27); all 9 pass conditions satisfied; GatewayAuthLogContract.log() batch surface closed |
| W40-T1 | Packaging Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — PackagingBatchContract canonical; CPF 2759 tests (+36); all 9 pass conditions satisfied; packaging batch surface closed |
| W39-T1 | Model Gateway Boundary Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-05 — ModelGatewayBoundaryBatchContract canonical; CPF 2723 tests (+27); all 9 pass conditions satisfied; W8-T1 model gateway boundary batch surface closed |
| W38-T1 | Context Enrichment Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-04 — ContextEnrichmentBatchContract canonical; CPF 2696 tests (+36); W1-T11 context builder enrichment batch surface closed |
| W37-T1 | Context Packager Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-04 — ContextPackagerBatchContract canonical; CPF 2660 tests (+36); W1-T12 ContextPackagerContract.pack() batch surface closed |
| W36-T1 | Retrieval Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-03 — RetrievalBatchContract canonical; CPF 2624 tests (+31); W1-T2 RetrievalContract.retrieve() batch surface closed |
| W35-T1 | Intake Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-03 — IntakeBatchContract canonical; CPF 2594 tests (+33); W1-T2 intake batch surface closed |
| W34-T1 | Clarification Refinement Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — ClarificationRefinementBatchContract canonical; CPF 2561 tests (+30); W1-T5 CP2 batch surface closed; W1-T5 full family FULLY CLOSED |
| W33-T1 | Knowledge Ranking Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — KnowledgeRankingBatchContract canonical; CPF 2531 tests (+30) |
| W32-T1 | Boardroom Multi-Round Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomMultiRoundBatchContract canonical; CPF 2691 tests (+37); W1-T6 CP2 boardroom multi-round batch surface closed |
| W31-T1 | Boardroom Round Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomRoundBatchContract canonical; CPF 2654 tests (+39); W1-T6 CP1 boardroom round batch surface closed |
| W30-T1 | Boardroom Transition Gate Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomTransitionGateBatchContract canonical; CPF 2615 tests (+40); GC-028 batch surface closed |
| W29-T1 | Boardroom Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — BoardroomBatchContract canonical; CPF 2575 tests (+37); BoardroomContract.review() batch surface closed |
| W28-T1 | Reverse Prompting Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — ReversePromptingBatchContract canonical; CPF 2538 tests (+31) |
| W27-T1 | Design Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — DesignBatchContract canonical; CPF 2507 tests (+34) |
| W26-T1 | Orchestration Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — OrchestrationBatchContract canonical; CPF 2473 tests (+33) |
| W25-T1 | Route Match Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — RouteMatchBatchContract canonical; CPF 2440 tests (+27) |
| W24-T1 | Gateway PII Detection Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — GatewayPIIDetectionBatchContract canonical; CPF 2413 tests (+28) |
| W23-T1 | AI Gateway Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — AIGatewayBatchContract canonical; CPF 2385 tests (+28) |
| W22-T1 | Gateway Auth Batch Contract (REALIZATION class) | CLOSED DELIVERED 2026-04-01 — GatewayAuthBatchContract canonical; CPF 2357 tests (+27) |

### Architecture Baseline

- Whitepaper: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; document type `CLOSURE-ASSESSED`; operational readout refreshed through `2026-04-13`)
- Posture: `CLOSURE-ASSESSED` (CPF: **DONE-ready**; GEF: **DONE (6/6)**; LPF: **DONE-ready (7/7)**; EPF: **DONE-ready** — Track 5 deferred items are now delivered: Model Gateway Provider Router in CPF and Sandbox Runtime Physical Isolation via `SandboxIsolationContract` + `WorkerThreadSandboxAdapter`)
- All four planes: plane-banner promotion pass complete; W7 Governance Integration: `DONE`; post-W7 continuation: `DONE`; MC1 CPF: `DONE-ready`; MC2 GEF: **DONE (6/6)**; MC3 LPF: **DONE-ready (7/7)**; MC4 EPF: **DONE-ready**; MC5 whitepaper canon promotion: **COMPLETE**
- Continuation readout: `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1 / W16-T1 / W17-T1 / W18-T1 / W19-T1 / W20-T1 / W21-T1 / W22-T1 / W23-T1 / W24-T1 / W25-T1 / W26-T1 / W27-T1 / W28-T1 / W29-T1 / W30-T1 / W31-T1 / W32-T1 / W33-T1 / W34-T1 / W35-T1 / W36-T1 / W37-T1 / W38-T1 / W39-T1 / W40-T1 / W41-T1 / W42-T1 / W43-T1 / W44-T1 / W45-T1 / W46-T1 / W47-T1 / W48-T1 / W49-T1 / W50-T1 / W51-T1 / W52-T1 / W53-T1 / W54-T1 / W55-T1 / W56-T1 / W57-T1 / W58-T1 / W59-T1 / W60-T1 / W61-T1 / W62-T1 / W63-T1 / W64-T1`
- Documentation-to-implementation gap: CLOSED (`v3.7-W46T1`)

---

## Immediate Next Action Required

**W66-T1 CP3A Lane Bootstrap — GOVERNED PILOTS COMPLETE (2026-04-11). Gemini-2.5-flash governed pilot DONE; Alibaba `qwen3.5-122b-a10b` governed pilot DONE; Alibaba `qvq-max` governed pilot DONE. All 3 active lanes completed CAL-001–005 through `POST /api/execute` with `guardResult=ALLOW`, `providerRouting=ALLOW`, and non-empty outputs. Strongest product-value signal: Gemini direct had a CAL-004 catastrophic miss, but Gemini governed refused the bypass; both governed Alibaba lanes also refused. `qvq-max-2025-03-25` remains blocked on endpoint compatibility (`404 model_not_supported`). This lane bootstrap is now retained as frozen provenance while PVV/API-key work remains paused; future provider/model additions must start from the pause checkpoint and explicit reopen decision, not from an assumed active CP3A wave.**

Current guidance:

- **Unified branch state** — `main` contains the previously canonical `cvf-next` state; keep `cvf-next` fast-forward aligned when compatibility requires it
- **W66-T1 CP2 CLOSED DELIVERED** — Product Value Validation Wave CP2 (DOCUMENTATION / VALIDATION_TEST class); first controlled-lane CFG-A/CFG-B seed FROZEN; evidence schema FROZEN; reviewer calibration set (5 tasks) FROZEN; 7-item pre-CP3A/CP3B gate checklist FROZEN; test delta 0; code delta 0; Fast Lane (GC-021)
- **W66-T1 CP1 CLOSED DELIVERED** — 90-task corpus FROZEN (A1×30 FAM-001/002/003 + A2×20 FAM-004/005 + B×20 real product + C×20 governance stress); rubric FROZEN; run manifest PLANNED; GC-042 evidence chain foundation established
- **Run-lane doctrine (canonical)** — a governed `run lane` is one admitted `provider + model` configuration in the CVF hub. User/operator-enabled provider keys define which lanes exist. This is the product-truth unit for Product Value Validation.
- **Initial operator-supplied multi-lane bootstrap (out-of-band secrets; never commit values)**:
  - `gemini` lane uses server env `GOOGLE_AI_API_KEY`
  - `alibaba` lane uses server env `ALIBABA_API_KEY`
  - freeze lane IDs + selected models in the run manifest; do not record raw key values anywhere in repo truth
- **W66-T1 CP3A (Provider-Hub Validation)**: LANE BOOTSTRAP OPERATOR-CONFIRMED (2026-04-11) — operator has confirmed intent to begin gemini + alibaba run-lane testing. Bootstrap steps (DOCUMENTATION class, Fast Lane GC-021; no scored runs yet): (1) freeze lane IDs + model IDs for `gemini` lane (env `GOOGLE_AI_API_KEY`) and `alibaba` lane (env `ALIBABA_API_KEY`) in run manifest, (2) boot cvf-web with provider keys in server env, (3) run CAL-001 through CAL-005 calibration pilot tasks through both lanes, (4) verify all 7 evidence completeness items. Full scored CP3A (90 tasks × all lanes × 3 runs) requires a fresh GC-018 after: evidence completeness confirmed, reviewer pool assigned (≥ 3), κ ≥ 0.70, human freeze of corpus + rubric confirmed in writing.
- **Pilot forensic rule (binding for Gemini + Alibaba lanes)** — if a pilot output is truncated, abnormally short, or unstable, record the symptom as fact and record `max_tokens`, provider-side finish condition, safety interruption, and free-tier / quota / throttling only as hypotheses unless provider evidence confirms the cause. Do not label a lane as low-quality while provider-limit ambiguity remains unresolved.
- **Cross-provider diagnostic rule (binding)** — always distinguish among: (1) real model-behavior outcomes, (2) incomplete-output outcomes with unresolved cause, and (3) endpoint/model compatibility failures. Example now in canon: Alibaba `qvq-max-2025-03-25` on compatible-mode returned `404 model_not_supported`, which is an integration-path failure, not a quality or quota verdict.
- **Alibaba parity warning** — validated direct Alibaba evidence currently belongs to `qwen3.5-122b-a10b`. `cvf-web` runtime still defaults Alibaba to `qwen-turbo`; do not compare direct `qwen3.5-122b-a10b` against governed `qwen-turbo` as if they were the same lane.
- **Alibaba QVQ adapter COMPLETE** — SSE adapter updated and confirmed: `executeAlibaba()` auto-detects `qvq-*` models, sends `stream: true` + `stream_options: {include_usage: true}`, parses `reasoning_content` + `content` from SSE chunks; 36/36 unit tests pass; confirmation run 5/5 `finish=stop`. Governed-path pilot is now also complete for `qvq-max`. `qvq-max-2025-03-25` remains unproven (`404 model_not_supported` on compatible-mode endpoint).
- **Alibaba lane readout (important)** — the Alibaba runs already prove three different CVF lane states: `qwen3.5-122b-a10b` = valid direct baseline, `qvq-max` = valid streaming-only direct lane with adapter-ready governed path, `qvq-max-2025-03-25` = blocked compatibility lane. This is strong evidence that CVF's provider-hub value lives at `provider + model + integration-path`, not vendor name alone.
- **Comparative readout canon** — use `docs/assessments/CVF_PVV_PROVIDER_RUNLANE_COMPARATIVE_READOUT_2026-04-11.md` as the living baseline when adding future provider/model lanes. Extend by lane, not by vendor label.
- **Governed-route invocation rule (important)** — `/api/execute` currently treats request `intent` as guard `action`. For operator/service-token pilot runs, use an action-compatible prefix such as `analyze ...`; otherwise `authority_gate` may block the run before provider execution. This is a route-contract nuance, not a provider failure.
- **W66-T1 CP3B (Controlled Value Test)**: **COMPLETE 2026-04-12** — 810 governed-path runs (3 Alibaba lanes × 90 tasks × 3 runs) executed through `/api/execute`. Key finding: CVF had no output-level bypass guard (P1 gap). `BypassDetectionGuard` implemented and verified: C-014 × 9 = **9/9 BYPASS_BLOCKED**. CVF value claim "governed path prevents model bypass approvals" now **CONFIRMED**. Evidence: `docs/baselines/CVF_PVV_CP3B_BATCH_COMPLETION_RECEIPT_2026-04-12.md` + `docs/baselines/CVF_PVV_CP3B_BYPASS_GUARD_VERIFICATION_2026-04-12.md`. Assessment (with addendum): `docs/assessments/CVF_PVV_CP3B_GOVERNED_PATH_ASSESSMENT_2026-04-12.md`. Guard commit: `74a13004`.
- **PVV API-key workstream PAUSED BY OPERATOR (2026-04-12)** — the repo now treats the one-provider / Alibaba / multi-role checkpoint as sufficient for the current internal stop point. Do not open new API-key runs, new provider lanes, or Phase B comparative execution until the operator explicitly reopens this stream. Canonical pause checkpoint: `docs/assessments/CVF_PVV_ALIBABA_MULTI_ROLE_PAUSE_CHECKPOINT_2026-04-12.md`.
- **Former CP3A full-batch authorization retained for future reopen only** — `docs/baselines/CVF_GC018_W66_T1_CP3A_FULL_SCORED_BATCH_AUTHORIZATION_2026-04-11.md` stays on record as frozen prior authorization, but it is not the active next step while the PVV/API-key stream is paused.
- **Current CP2 closure anchor**: `docs/reviews/CVF_W66_T1_CP2_RUN_HARNESS_SETUP_REVIEW_2026-04-11.md`
- **Current CP2 authorization**: `docs/baselines/CVF_GC018_W66_T1_CP2_RUN_HARNESS_AUTHORIZATION_2026-04-11.md`
- **Current calibration set**: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_REVIEWER_CALIBRATION_W66_T1_CP2_2026-04-11.md`
- **Current CP1 closure anchor**: `docs/reviews/CVF_W66_T1_CP1_PVV_CORPUS_RUBRIC_FREEZE_REVIEW_2026-04-11.md`
- **Current corpus index**: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_INDEX_W66_T1_CP1_2026-04-11.md`
- **Current rubric**: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_W66_T1_CP1_2026-04-11.md`
- **Current run manifest (PLANNED)**: `docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_W66_T1_CP2_2026-04-11.md`
- **W64-T1 CLOSED DELIVERED** — Track 5 Deferred Architecture (DEFERRED ARCHITECTURE class); `ProviderRouterContract` delivered in CPF with Option B governance routing; `SandboxIsolationContract` + `WorkerThreadSandboxAdapter` delivered for physical isolation; doctrine audit complete; commit `2160c4d5`
- **W65-T1 CLOSED DELIVERED** — Pre-Public Packaging Phase B (PACKAGING class); 4 packages processed; `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`: `CANDIDATE`; `CVF_GOVERNANCE_EXPANSION_FOUNDATION`: `CANDIDATE`; `CVF_LEARNING_PLANE_FOUNDATION`: `CANDIDATE`; `CVF_v1.7.1_SAFETY_RUNTIME`: `REVIEW_REQUIRED` + 4 blockers documented; test delta 0; Fast Lane (GC-021)
- **Product value validation roadmap**: `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
- **Product value validation guard (GC-042)**: `governance/toolkit/05_OPERATION/CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`
- **Product value validation starter templates**:
  - `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
  - `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
  - `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
  - `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`
- **Product value rule**: all future value-proof packets and any Docker-sandbox justification must run through the `GC-042` frozen evidence chain (`corpus -> rubric -> run manifest -> assessment`), not demos or score vanity. Model-agnostic hub claims require multi-lane evidence; single-lane success is scope-limited only.
- **Post-MC5 orientation**: `docs/guides/POST_MC5_ORIENTATION.md`
- **Post-MC5 Continuation Strategy**: **ALL 6 ACTIONABLE TRACKS COMPLETE** (Track 1: CI/CD Expansion ✅, Track 2: Product Hardening ✅, Track 3: Pre-Public Packaging ✅, Track 4: Documentation Curation ✅, Track 5A: Model Gateway ✅, Track 5B: Sandbox Runtime ✅)
- **W72-T2 CLOSED DELIVERED (2026-04-14)**: `W72-T2 Knowledge Compilation Doctrine Uplift` is complete. Produced: `CVF_KNOWLEDGE_COMPILATION_LIFECYCLE_POLICY_2026-04-14.md` (6-step lifecycle, Govern step explicit), `CVF_COMPILED_KNOWLEDGE_ARTIFACT_STANDARD_2026-04-14.md` (artifact definition + minimum provenance fields), `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` (compiled-preferred with raw-source fallback; StructuralIndex as Query mode peer), `CVF_KNOWLEDGE_MAINTENANCE_AND_REFACTOR_OWNER_MAP_2026-04-14.md` (lint/contradiction/drift/orphan/staleness/refactor all routed to Learning Plane; 0 new guards; no standalone engines). GC-021 Fast Lane audit: `docs/baselines/CVF_W72_T2_KNOWLEDGE_COMPILATION_DOCTRINE_UPLIFT_GC021_FAST_LANE_AUDIT_2026-04-14.md`.
- **W72-T3 CLOSED DELIVERED (2026-04-14)**: `W72-T3 Knowledge Preference Benchmark Criteria + W7 Vocabulary Enrichment` is complete. Produced: `CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md` (defines all gates for promoting compiled-first or graph-first from candidate to default — ≥3 use-cases, ≥2 planes, precision+latency thresholds, GC-026 trace sync required; W72-T5 later supplied the 4 benchmark targets) and `CVF_W7_MEMORY_RECORD_PALACE_VOCABULARY_ENRICHMENT_NOTE_2026-04-14.md` (documents wing/hall/room/drawer/closet_summary/tunnel_links/contradiction_flag as W7-aligned candidate fields; confidence_score + truth_score deferred; W72-T6 later landed candidate-layer carry-through while W7MemoryRecord remains future). GC-021 audit: `docs/baselines/CVF_W72_T3_*_GC021_FAST_LANE_AUDIT_2026-04-14.md`.
- **W72-T4 CLOSED DELIVERED (2026-04-14)**: `CompiledKnowledgeArtifactContract` + `CompiledKnowledgeArtifactBatchContract` implemented in CPF Knowledge Layer. Types: `CompiledArtifactType` (concept/entity/summary), `GovernanceStatus` (pending/approved/rejected), `CompiledKnowledgeArtifact` (13 governed fields including `content` + `rejectionReason`). `compile()` now enforces compile-gate validation (`contextId`, `sourceIds`, `citationRef`, `citationTrail`, `compiledBy`, `content` all required), produces pending artifact with content-bound `artifactHash`, and keeps time variance in `artifactId`; `govern()` transitions to approved/rejected, preserves rejection reason, and still throws if not pending. Barrel updated; tranche docs live at `docs/baselines/CVF_GC018_W72_T4_KNOWLEDGE_COMPILED_ARTIFACT_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_W72_T4_KNOWLEDGE_COMPILED_ARTIFACT_GC021_FAST_LANE_AUDIT_2026-04-14.md`.
- **W72-T5 CLOSED DELIVERED (2026-04-14)**: `BenchmarkTarget` union extended with `KNOWLEDGE_QUERY`, `KNOWLEDGE_RANKING`, `KNOWLEDGE_STRUCTURAL_INDEX`, `KNOWLEDGE_COMPILED_CONTEXT` in `performance.benchmark.harness.contract.ts`. Governance packet now filed at `docs/baselines/CVF_GC018_W72_T5_KNOWLEDGE_BENCHMARK_TARGETS_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_W72_T5_KNOWLEDGE_BENCHMARK_TARGETS_GC021_FAST_LANE_AUDIT_2026-04-14.md`. This is instrumentation-only; evidence remains `PROPOSAL_ONLY` until a future GC-026 sync wave.
- **W72-T6 CLOSED DELIVERED (2026-04-14)**: `W7PalaceVocabulary` interface added; 7 optional fields (`wing`, `hall`, `room`, `drawer`, `closet_summary`, `tunnel_links`, `contradiction_flag`) added to `W7NormalizedAssetCandidateEnrichment`; optional `palaceVocabulary?` added to compile request; `compile()` carries fields through via spread. Barrel updated. Governance packet now filed at `docs/baselines/CVF_GC018_W72_T6_W7_PALACE_VOCABULARY_ENRICHMENT_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_W72_T6_W7_PALACE_VOCABULARY_ENRICHMENT_GC021_FAST_LANE_AUDIT_2026-04-14.md`. No hash change — palace fields are enrichment-only.
- **W72 WAVE FULLY CLOSED (2026-04-14)**: T1 (StructuralIndex), T2 (doctrine uplift), T3 (benchmark criteria + vocabulary note), T4 (CompiledKnowledgeArtifact), T5 (BenchmarkTarget extensions), T6 (palace vocabulary enrichment) — all CLOSED DELIVERED.
- **W73-T1 CLOSED DELIVERED (2026-04-14)**: `W7MemoryRecordContract` + `W7MemoryRecordBatchContract` implemented in CPF — memory-palace placement step of the W7 pipeline. `record()` places an asset into the palace hierarchy; `memoryRecordHash` content-bound (time-independent); `memoryRecordId` time-variant. All 7 palace fields optional (`wing`, `hall`, `room`, `drawer`, `closet_summary`, `tunnel_links`, `contradiction_flag`). Workflow barrel updated. 51 new tests. tsc clean. Governance: `docs/baselines/CVF_W73_T1_W7_MEMORY_RECORD_CONTRACT_GC021_FAST_LANE_AUDIT_2026-04-14.md` + `docs/baselines/CVF_GC018_W73_T1_W7_MEMORY_RECORD_CONTRACT_AUTHORIZATION_2026-04-14.md`.
- **W73-T2 CLOSED DELIVERED (2026-04-14)**: `KnowledgeMaintenanceContract` + `KnowledgeMaintenanceBatchContract` implemented in CPF Knowledge Layer — Step 5 (Maintain) of the 6-step lifecycle. `evaluate()` runs 5 check types against any approved `CompiledKnowledgeArtifact`: `lint` (required-keyword scan), `contradiction` (external artifact conflict declaration), `drift` (source modified after compiledAt), `orphan` (source ID no longer active), `staleness` (age exceeds maxAgeDays). Each signal has content-bound `signalHash` and time-variant `signalId`; `resultHash` is content-bound to `artifactId + signalHashes`. Throws if artifact not approved. Knowledge barrel updated. 42 new tests. tsc clean / vitest 3231 passed. Governance: `docs/baselines/CVF_W73_T2_KNOWLEDGE_MAINTENANCE_CONTRACT_GC021_FAST_LANE_AUDIT_2026-04-14.md` + `docs/baselines/CVF_GC018_W73_T2_KNOWLEDGE_MAINTENANCE_CONTRACT_AUTHORIZATION_2026-04-14.md`.
- **W74-T1 CLOSED DELIVERED (2026-04-14)**: `KnowledgeRefactorContract` + `KnowledgeRefactorBatchContract` implemented in CPF Knowledge Layer — **Step 6 (Refactor)** of the 6-step lifecycle. Closes the full lifecycle at CPF contract layer. `recommend()` takes a `KnowledgeMaintenanceResult` with `hasIssues: true` and produces a `KnowledgeRefactorProposal` with action heuristic: `orphan`-only → `"archive"`; `drift`/`staleness` present → `"recompile"`; otherwise → `"review"`. `proposalHash` content-bound; `proposalId` time-variant. Throws if `hasIssues: false`. Knowledge barrel updated. 39 new tests (25 contract + 14 batch). tsc clean / vitest 3270 passed. Governance: `docs/baselines/CVF_W74_T1_KNOWLEDGE_REFACTOR_CONTRACT_GC021_FAST_LANE_AUDIT_2026-04-14.md` + `docs/baselines/CVF_GC018_W74_T1_KNOWLEDGE_REFACTOR_CONTRACT_AUTHORIZATION_2026-04-14.md`.
- **W73–W74 KNOWLEDGE LIFECYCLE WAVE COMPLETE**: 6-step lifecycle fully implemented at CPF contract layer — Step 1 (Ingest/W7), Step 2 (Compile/W72-T4), Step 3 (Govern/W72-T4), Step 4 (Query/W33), Step 5 (Maintain/W73-T2), Step 6 (Refactor/W74-T1).
- **W75-T1 CLOSED DELIVERED (2026-04-14)**: `KnowledgeContextAssemblyContract` + `KnowledgeContextAssemblyBatchContract` implemented in CPF Knowledge Layer — consumer-facing output surface. `assemble()` takes `RankedKnowledgeItem[]` + optional `structuralEnrichment: Record<string, StructuralNeighbor[]>` and produces a `KnowledgeContextPacket` with per-entry structural neighbors resolved by `itemId` lookup. `contextWindowEstimate` = sum of `content.length` across all entries. `entryHash`/`packetHash` are content-bound to the assembled packet payload, including structural enrichment; `entryId`/`packetId` are time-variant. Knowledge barrel updated. 39 new tests (25 contract + 14 batch). tsc clean / vitest 3309 passed. Governance: `docs/baselines/CVF_W75_T1_KNOWLEDGE_CONTEXT_ASSEMBLY_CONTRACT_GC021_FAST_LANE_AUDIT_2026-04-14.md` + `docs/baselines/CVF_GC018_W75_T1_KNOWLEDGE_CONTEXT_ASSEMBLY_CONTRACT_AUTHORIZATION_2026-04-14.md`.
- **W76-T1 CLOSED DELIVERED (2026-04-14)**: `KnowledgeContextAssemblyConsumerPipelineContract` + batch — CPF consumer pipeline bridge chaining Ranking → ContextAssembly → ConsumerPackage in one `execute()` call. Follows W1-T19 CP1 consumer pipeline pattern. The consumer package is built from assembly-derived entries, so structural enrichment flows into packaged context instead of being dropped before the consumer step. `dominantContextWindowEstimate` = max `contextPacket.contextWindowEstimate` across batch; `emptyAssemblyCount` = results with `totalEntries === 0`. Warning: `"[knowledge-assembly] no items assembled — pipeline produced empty context"`. Knowledge barrel updated. 30 new tests (16 contract + 14 batch). tsc clean / vitest 3339 passed. Governance: `docs/baselines/CVF_W76_T1_*`.
- **W77-T1 CLOSED DELIVERED (2026-04-14)**: N1 Canon Retrieval Authority Convergence — `rag.context.engine.convergence.contract.ts` updated: 15 new W72-W76 FIXED_INPUT surfaces registered (40 total), 1 new IN_SCOPE surface `knowledge-native-retrieval-authority`, new `KnowledgeNativeRetrievalAuthorityDeclaration` interface and `declareKnowledgeNativeRetrievalAuthority()` method with 4 canon statements (StructuralIndexContract peer mode, KnowledgeContextAssemblyContract assembly authority, KnowledgeContextAssemblyConsumerPipelineContract consumer bridge, ContextPackagerContract packaging authority — unchanged). `defaultPolicyStatus = NOT_DECIDED` (N2 not yet closed). 86 tests pass (76 pre-existing + 10 new). Governance: `docs/baselines/CVF_GC018_W77_T1_CANON_RETRIEVAL_AUTHORITY_CONVERGENCE_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_W77_T1_CANON_RETRIEVAL_AUTHORITY_CONVERGENCE_GC021_FAST_LANE_AUDIT_2026-04-14.md`.
- **W78-T1 CLOSED DELIVERED (2026-04-14)**: N2 Benchmark Evidence Closure — evidence class PROPOSAL_ONLY (contract-layer; no live inference system). 8 benchmark runs declared across KNOWLEDGE_COMPILED_CONTEXT (3), KNOWLEDGE_STRUCTURAL_INDEX (3), and KNOWLEDGE_QUERY (2) targets using W8-T2 harness + W72-T5 extensions. Promotion gate NOT FULLY MET: precision gate and temporal independence gate require runtime inference unavailable at contract layer. **Decision: HYBRID / NO SINGLE DEFAULT** — Policy Rule 1 (compiled-preferred, conditional) and Rule 2 (raw-source fallback) remain unchanged. No unconditional default set. No code changes; CPF stays at 3370/0. Governance: `docs/baselines/CVF_GC018_W78_T1_BENCHMARK_EVIDENCE_CLOSURE_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_W78_T1_BENCHMARK_EVIDENCE_PACKET_2026-04-14.md` + `docs/baselines/CVF_GC026_TRACKER_SYNC_W78_T1_N2_BENCHMARK_EVIDENCE_CLOSURE_2026-04-14.md`.
- **W79-T1 CLOSED DELIVERED (2026-04-14)**: N3 Canon Default Promotion — HYBRID / NO SINGLE DEFAULT decision promoted into `docs/reference/CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY_2026-04-14.md` (§8 N2 Decision Record appended), `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (§4.3 baseline freeze + posture updated), and `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` (W71-W79 tranche rows added; state updated). No code changes. CPF stays at 3370/0. **CVF-native core 100% gate: CLOSED.** All N1+N2+N3 gates CLOSED. Governance: `docs/assessments/CVF_POST_W78_CONTINUATION_QUALITY_ASSESSMENT_2026-04-14.md` + `docs/baselines/CVF_GC018_W79_T1_CANON_DEFAULT_PROMOTION_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_GC026_TRACKER_SYNC_W79_T1_N3_CANON_DEFAULT_PROMOTION_2026-04-14.md`.
- **W80-T1 CLOSED DELIVERED (2026-04-14)**: N4 Product/Operator Adoption — 3 knowledge-native API routes added to `CVF_v1.6_AGENT_PLATFORM` (cvf-web): `POST /api/governance/knowledge/compile` (`CompiledKnowledgeArtifactContract.compile()` + optional `.govern()`), `POST /api/governance/knowledge/maintain` (`KnowledgeMaintenanceContract.evaluate()`), `POST /api/governance/knowledge/refactor` (`KnowledgeRefactorContract.recommend()`). Lib wrapper: `src/lib/server/knowledge-governance.ts`. 17 new vitest tests (6 compile + 5 maintain + 5 refactor + 1 lib); all pass; 0 regressions. CPF stays at 3370/0. Governance: `docs/assessments/CVF_POST_W79_CONTINUATION_QUALITY_ASSESSMENT_2026-04-14.md` + `docs/baselines/CVF_GC018_W80_T1_N4_PRODUCT_OPERATOR_ADOPTION_AUTHORIZATION_2026-04-14.md` + `docs/baselines/CVF_GC026_TRACKER_SYNC_W80_T1_N4_PRODUCT_OPERATOR_ADOPTION_2026-04-14.md`.
- **CVF-native completion front door for this lane**: `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_COMPLETION_MATRIX_2026-04-14.md` is now the authoritative completion contract. Do not re-triage this lane from scratch.
- **Current completion posture for this lane**: synthesis + doctrine + CPF capability + N1 + N2 + N3 + N4 are ALL CLOSED. **Full CVF-native completion matrix: ALL GATES CLOSED (N1+N2+N3+N4).**
- **N2 decision promoted to canon**: HYBRID / NO SINGLE DEFAULT — compiled-preferred conditional (Rule 1) and raw-source fallback (Rule 2) confirmed in `CVF_COMPILED_CONTEXT_GOVERNANCE_POLICY`, whitepaper, and tracker. No unconditional default. Structural index peer mode confirmed (N1).
- **Completion matrix: FULLY CLOSED**:
  1. ~~`N1 Canon Retrieval Authority Convergence`~~ — **CLOSED (W77-T1)**
  2. ~~`N2 Benchmark Evidence Closure`~~ — **CLOSED (W78-T1) — decision: HYBRID / NO SINGLE DEFAULT**
  3. ~~`N3 Canon Default Promotion`~~ — **CLOSED (W79-T1) — promoted to canon**
  4. ~~`N4 Product/Operator Adoption`~~ — **CLOSED (W80-T1) — 3 knowledge API routes in cvf-web**
  No required next step. Any continuation requires fresh operator authorization + GC-018.
- **Canon-closure corrections applied (2026-04-14)**: Both N1 and N2/N3 review findings resolved. Lane is now closure-clean.
  1. **N2/N3 evidence-gate resolved** — Option B applied: completion matrix §9 added formally defining "contract-layer evidence closure" (PROPOSAL_ONLY + formal gate assessment + GC-026 = valid trace-backed closure for a contract-layer system). W78 packet §4 updated with explicit reconciliation note. No downgrade of closure language required.
  2. **N1 dual authority resolved** — `declareRagRetrievalAuthority()` explicitly marked as legacy W9-T1 raw-text baseline path in source (comment added) and test (describe label updated). `declareKnowledgeNativeRetrievalAuthority()` interface comment updated to declare it the TOP-LEVEL canon authority after W77. `defaultPolicyStatus` field updated from `NOT_DECIDED` to `HYBRID / NO SINGLE DEFAULT` (post-N2+N3). All 3 affected assertions updated; 86/86 tests pass; 0 regressions.
  Commit: see W81-T1 canon-closure corrections commit.
- **Binding standard for future knowledge absorption / extension**: before opening any fresh post-W71 uplift wave, apply `docs/reference/CVF_KNOWLEDGE_ABSORPTION_AND_EXTENSION_PRIORITY_STANDARD_2026-04-13.md`. Default rule is now binding: `doctrine-first / governance-first absorption` must be completed before `implementation-first expansion`, unless a fresh operator decision and explicit `GC-018` state otherwise. Rationale companion: `docs/assessments/CVF_EXECUTIVE_VALUE_PRIORITIZATION_NOTE_2026-04-13.md`.
- **Knowledge absorption repo gate (GC-043)**: `governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`. Future knowledge-intake or repo-derived uplift roadmaps that skip the doctrine/governance-first standard should fail local hook / CI through `governance/compat/check_knowledge_absorption_priority_compat.py`.
- **Graphify / LLM-Powered / Palace assessment lane is now assessment-complete and synthesis-complete at documentation scope**: do not re-audit the 3 source folders by default. Front-door read order for any future agent touching this lane is now:
  1. `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_COMPLETION_MATRIX_2026-04-14.md`
  2. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_CVF_NATIVE_SYNTHESIS_NOTE_2026-04-13.md`
  3. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_PROMOTION_AND_REJECTION_MAP_2026-04-13.md`
  4. `docs/assessments/CVF_GRAPHIFY_LLM_POWERED_PALACE_FOCUSED_REBUTTAL_ROUND2_2026-04-13.md`
  5. `docs/roadmaps/CVF_GRAPHIFY_LLM_POWERED_PALACE_SYNTHESIS_ONLY_ROADMAP_2026-04-13.md`
  Only reopen the older assessment/rebuttal chain if a new factual contradiction appears.
- **Accepted distilled value from this lane**: `LLM-Powered` contributes the main doctrine (`Ingest -> Compile -> Govern -> Query -> Maintain -> Refactor`), `Graphify` contributes a real `structural index` enhancement candidate for `Knowledge Layer`, and `Palace` contributes governed memory-routing vocabulary only. No new architecture surface, no new guard family, no CLI/runtime surface, and no Palace code promotion were accepted.
- **Knowledge-native absorption status (post-W81-T1)**: this lane is now **fully absorbed at CVF-native core 100%**. The core closure truth is: synthesis CLOSED, doctrine CLOSED, CPF capability CLOSED, N1 CLOSED, N2 CLOSED, N3 CLOSED. N4 product/operator adoption is also CLOSED, but remains an optional adoption lane layered on top of core-native closure.
- **W82-T1 — DELIVERED 2026-04-14**: `W82-T1 Knowledge-Native Value Realization` is now fully closed. Roadmap front door: `docs/roadmaps/CVF_W82_T1_KNOWLEDGE_NATIVE_VALUE_REALIZATION_ROADMAP_2026-04-14.md`. All 4 W82-T1 deliverables are live:
  1. **Operator surface** — `/governance/knowledge` page (`cvf-web/src/app/(dashboard)/governance/knowledge/page.tsx`) with 3-step Compile → Maintain → Refactor workflow; sidebar nav entry in `Sidebar.tsx`
  2. **E2E tests** — `cvf-web/src/app/api/governance/knowledge/e2e.workflow.test.ts` — 7 scenarios, 7/7 pass (A–G: pending, approve, clean-maintain, maintain-with-issues→refactor, rejected-cannot-maintain, auth-guard, bad-input-guard)
  3. **Operator doc** — `cvf-web/docs/reference/CVF_KNOWLEDGE_GOVERNANCE_OPERATOR_GUIDE_2026-04-14.md` — HYBRID/NO SINGLE DEFAULT usage, auth requirements, known limits
  4. **Value evidence packet** — `cvf-web/docs/baselines/CVF_W82_T1_KNOWLEDGE_NATIVE_VALUE_EVIDENCE_PACKET_2026-04-14.md` — 3 scenarios, gate assessment table, evidence gate CLOSED
- **N4 lane status post-W82-T1**: knowledge-native lifecycle fully realized at product layer. Lane is value-delivered and closure-clean.
- **W83-T1 — CLOSED DELIVERED 2026-04-14**: `W83-T1 Post-Knowledge-Native Master Architecture Reassessment` is fully closed. All 5 mandatory outputs delivered:
  1. **Reassessment note** — `docs/assessments/CVF_W83_T1_POST_KNOWLEDGE_NATIVE_MASTER_ARCHITECTURE_REASSESSMENT_2026-04-14.md` — pre/post-uplift state, concrete value gained, architectural implications, canon core vs optional adoption
  2. **Whitepaper §4.3 refresh** — `Last canonical closure` → W83-T1; `Current active tranche` → NONE (W83 CLOSED); `Current posture` extended to include W80/W81/W82/W83; Supporting status docs updated
  3. **Progress tracker refresh** — `Last refreshed` updated to W83-T1; `Current active tranche` updated; W80/W81/W82/W83 rows added to Tranche Tracker
  4. **Handoff refresh** — this entry
  5. **GC-026 sync** — `docs/baselines/CVF_GC026_TRACKER_SYNC_W83_T1_POST_KNOWLEDGE_NATIVE_ARCHITECTURE_REASSESSMENT_2026-04-14.md`
  GC-018: `docs/baselines/CVF_GC018_W83_T1_POST_KNOWLEDGE_NATIVE_MASTER_ARCHITECTURE_REASSESSMENT_AUTHORIZATION_2026-04-14.md`; GC-021 Fast Lane: `docs/baselines/CVF_W83_T1_POST_KNOWLEDGE_NATIVE_MASTER_ARCHITECTURE_REASSESSMENT_GC021_FAST_LANE_AUDIT_2026-04-14.md`
- **Full knowledge-native lane status post-W83-T1**: lane W71–W83 is now fully closure-clean. Absorption CLOSED, doctrine CLOSED, CPF capability CLOSED, N1+N2+N3+N4 CLOSED, master architecture truth ALIGNED. No active tranche. No default next step. Fresh GC-018 required for any continuation.
- **Binding instruction for future agents**: do not open another “absorption”, “completion matrix”, “value-realization”, or “architecture reassessment” wave for this lane unless a new contradiction appears. The knowledge-native lane is completely closed through W83-T1. The next frontier requires a genuinely new trigger.
- **Next-agent boundary for this lane**: after W83-T1, there is no default next step. All analytical and implementation work for the knowledge-native absorption lane is closed. Candidates for the next authorized wave include: (A) benchmark execution — promote PROPOSAL_ONLY knowledge benchmarks to trace-backed evidence via a live inference run; (B) PVV lane resume (810-run batch paused since W66-T1 CP3A); (C) any fresh new capability with a new GC-018. None is default. Operator authorization drives the next choice.
- **Rebuttal note — why the proposed "Option B" benchmark supplement is not accepted (2026-04-14)**: a proposal was raised to commit `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/benchmark.live.test.ts` plus a short supplement note, without opening a formal W84 tranche. This is explicitly rejected for this lane:
  1. **It violates the post-W83 boundary.** W83 closes the knowledge-native lane and records that there is **no default next step**. Benchmark execution after W83 is a candidate fresh wave, not a silent follow-up on an already closed lane.
  2. **It is governance-relevant, not a harmless helper.** A committed file that self-labels `W84-T1` and `LIVE_INFERENCE` creates a new evidence-producing surface. The moment such a file enters repo truth, it requires fresh `GC-018`, explicit scope, and proper closure docs.
  3. **It interacts directly with canon.** Any live benchmark result would touch the meaning of W78/W79 evidence posture (`PROPOSAL_ONLY`, `HYBRID / NO SINGLE DEFAULT`, contract-layer closure definition). Even if the live run merely confirms the existing canon, that confirmation is still governance-relevant and must not be introduced by a lightweight supplement note.
  4. **Correct CVF posture:** exploratory live benchmarking may exist **locally** as an uncommitted tool. It may not be committed, cited as evidence, or used to shift repo truth unless a fresh benchmark-execution tranche is formally authorized.
  **Binding consequence:** do not commit `benchmark.live.test.ts`, do not add a supplement note, and do not label any live run as CVF evidence unless a fresh `GC-018` explicitly opens the benchmark-execution wave. Accepted paths are only: (A) formal W84 evidence tranche, or (B) keep exploratory live benchmarking outside repo truth.
- **Reference-only exploratory harness exception (accepted)**: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/knowledge/benchmark.live.test.ts` may be retained only as a **reference-only exploratory example** if and only if all of the following remain true:
  1. it is clearly labeled as non-governance, non-canon, non-evidence
  2. it does not self-claim a tranche closure state
  3. it is not cited in any baseline / assessment / tracker / handoff as evidence
  4. any future use as official evidence requires explicit adoption into an authorized W84-style tranche
  This exception preserves the file's technical/example value without weakening CVF evidence discipline.
- **If benchmark execution is later authorized**: the front-door roadmap is `docs/roadmaps/CVF_W84_T1_KNOWLEDGE_LIVE_BENCHMARK_EVIDENCE_PROMOTION_ROADMAP_2026-04-14.md`. This roadmap is intentionally strict: live evidence promotion is a governed tranche, not a convenience path.
- **No-new-surface rule remains in force**: `Graph Memory Layer`, `Persistent Wiki`, `MemPalace Runtime`, `G-GM-*` guard family, and CLI command families remain rejected/deferred unless a future bounded wave with fresh evidence proves otherwise.
- **Historical W71 authorization anchor**: `CVF ADDING NEW` Stage 1 helper implementation was explicitly authorized by the operator on `2026-04-12` via `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_ADDING_NEW_STAGE1_IMPLEMENTATION_2026-04-12.md`. This is retained as provenance for the absorbed-knowledge wave; it is not an active tranche anymore.
- **Windows normalization curation promoted carefully**: `Windows_Skill_Normalization` material was reviewed, rebutted, and partially synthesized on `2026-04-12` into W7 intake/reference docs only. Promoted value is limited to `execution_environment` enrichment, Windows compatibility review, and a PowerShell reference appendix. This does not alter provider lanes, sandbox posture, or the now-paused PVV API-key test stream.
- **Diagnostic readout bridge retained for future reopen**: if a future API-key-based readout later needs Stage 1 interpretation, use `docs/reference/CVF_STAGE1_DIAGNOSTIC_INTERPRETATION_PACKET_TEMPLATE.md` together with `docs/assessments/CVF_ADDING_NEW_STAGE1_DIAGNOSTIC_BRIDGE_2026-04-12.md`. Runtime/provider evidence still leads; Stage 1 outputs are interpretation aids only.
- **First real-case packet skeleton retained for future reopen**: if a future live API-key-based case later needs Stage 1 interpretation, start from `docs/assessments/CVF_STAGE1_FIRST_REAL_CASE_DIAGNOSTIC_PACKET_SKELETON_2026-04-12.md` instead of drafting a packet from scratch. Keep raw runtime evidence primary.
- **Stage 1 interpretation helpers now implemented**: LPF now contains `Stage1DiagnosticInterpretationContract` + `Stage1DiagnosticInterpretationBatchContract` for converting `intake validation + planner trigger + provisional weak_trigger_definition` into a bounded attribution (`INTAKE_SHAPE | PLANNER_TRIGGER_QUALITY | MISSING_CLARIFICATION | RUNTIME_OR_PROVIDER_BEHAVIOR | MIXED | UNRESOLVED`). Use them as internal diagnostic aids only; they do not replace PVV/provider evidence.
- **Stage 1 packet assembly helpers now implemented**: LPF now also contains `Stage1DiagnosticPacketContract` + `Stage1DiagnosticPacketBatchContract` so the same diagnostic chain can be exported into review-ready internal packets without manual stitching. These remain interpretation aids only.
- **Stage 1 intake profile enriched**: CPF external asset intake now supports optional `execution_environment` metadata and requires it for `W7SkillAsset` candidates that contain executable code blocks. This enrichment came from the curated Windows normalization packet and remains intake-only; it does not alter provider/runtime lanes.
- **Stage 1 packet now carries execution-environment summary**: diagnostic packet assembly now surfaces whether `execution_environment` was declared, whether it was required for the case, and which intake issue fields were involved. This is for attribution clarity only; it does not create a new runtime decision path.
- **Windows compatibility gate helper implemented**: CPF now includes `WindowsCompatibilityEvaluationContract` + `WindowsCompatibilityEvaluationBatchContract` for scoring Windows execution fitness from intake validation plus bounded readiness flags. This is an intake/review aid only; it does not authorize execution or modify any provider lane.
- **Windows compatibility review pipeline implemented**: CPF now also includes `WindowsCompatibilityConsumerPipelineContract` + `WindowsCompatibilityConsumerPipelineBatchContract`, so Windows-target fitness can be packaged into review-ready consumer outputs and aggregated in batch form without manual stitching. This remains intake/review only.
- **CVF ADDING NEW bounded closure complete**: the promoted `CVF ADDING NEW` wave is no longer only a Stage 1 helper packet. CPF now also contains lightweight Stage 2 and Stage 3 helpers for `w7_normalized_asset_candidate` compilation and `registry_ready_governed_asset` preparation. Treat this wave as cleanly integrated for the current cycle; only heavier future-facing items remain deferred. Canon closure note: `docs/assessments/CVF_ADDING_NEW_IMPLEMENTATION_CLOSURE_2026-04-12.md`.
- **Runnable integration surface now exists in `cvf-web`**: `POST /api/governance/external-assets/prepare` is now the bounded executable path for the curated `CVF ADDING NEW` + `Windows_Skill_Normalization` wave. It runs `external intake -> semantic classification -> planner heuristics -> provisional signal capture -> W7 normalization -> registry-ready preparation`, with optional Windows compatibility review, without touching `/api/execute` or any provider lane.
- **Runtime verification for the new surface is complete at bounded scope**: `cvf-web` now transpiles `cvf-control-plane-foundation` + `cvf-learning-plane-foundation`; targeted route tests for `/api/governance/external-assets/prepare` pass; `npx tsc -p tsconfig.json --noEmit` passes; `npm run build` passes and includes the new route in the app manifest. This is the main proof that the integration wave now runs for real, not only as docs/contracts.
- **External-asset productization roadmap retained as closure provenance**: `docs/roadmaps/CVF_W67_T1_EXTERNAL_ASSET_PRODUCTIZATION_EXECUTION_PLAN_2026-04-13.md` is the original execution anchor for the now-closed W67 wave. Keep it as historical context, not as the next queued wave.
- **W69-T1 boundary — CLOSED**: the governed registry lifecycle/read-model tranche is fully delivered and closed. The next agent must not re-open this lane unless a fresh GC-018 explicitly authorizes follow-on work. If a future agent needs the original boundary rules or protocol for reference, they are archived at `docs/reference/CVF_W69_T1_GOVERNED_REGISTRY_LIFECYCLE_READMODEL_AGENT_PROTOCOL_2026-04-13.md`.
- **W70-T1 boundary — CLOSED**: the governed registry operator-surface tranche is fully delivered and closed. The next agent must not re-open this lane unless a fresh GC-018 explicitly authorizes follow-on work. If a future agent needs the original boundary rules or protocol for reference, they are archived at `docs/reference/CVF_W70_T1_GOVERNED_REGISTRY_OPERATOR_SURFACE_AGENT_PROTOCOL_2026-04-13.md`.
- **W71-T1 boundary — CLOSED**: the post-closure knowledge native-adoption tranche is fully delivered and closed. The next agent must not reopen this lane unless a fresh GC-018 explicitly authorizes follow-on work. If a future agent needs the original boundary rules or protocol for reference, they are archived at `docs/roadmaps/CVF_W71_T1_POST_CLOSURE_KNOWLEDGE_NATIVE_ADOPTION_ROADMAP_2026-04-13.md` and `docs/reference/CVF_W71_T1_POST_CLOSURE_KNOWLEDGE_NATIVE_ADOPTION_AGENT_PROTOCOL_2026-04-13.md`.
- **Historical PVV lane bootstrap sequence — retained for provenance; not active while PVV/API-key work is paused**:
  1. ✅ Lane IDs + model IDs frozen in lane manifest (`docs/baselines/CVF_PRODUCT_VALUE_VALIDATION_LANE_MANIFEST_W66_T1_CP3A_2026-04-11.md`)
  2. ✅ LANE-GEMINI-001 direct pilot DONE — 5/5 tasks reached API; CAL-004 CATASTROPHIC MISS (CFG-A — approved bypass); CAL-002/003/005 TRUNCATED (root cause UNCONFIRMED)
  3. ✅ LANE-ALIBABA-001 (`qwen3.5-122b-a10b`) direct pilot DONE — 5/5 `200 OK`, `finish_reason=stop`, usage metadata present
  4. ✅ LANE-ALIBABA-003 (`qvq-max`) direct pilot DONE — 5/5 `finish=stop`, no truncation, CAL-004 REFUSED (PASS); `stream: True` mandatory
  5. ✅ Alibaba SSE adapter COMPLETE — `executeAlibaba()` auto-detects `qvq-*`, sends `stream: true`, parses SSE; 36/36 tests pass; confirmation run 5/5 `finish=stop` confirmed 2026-04-11
  6. ✅ Governed-path pilot COMPLETE for `LANE-GEMINI-001`, `LANE-ALIBABA-001`, and `LANE-ALIBABA-003` — all 15 runs returned HTTP 200 with guard/router allow; strongest delta: Gemini governed refused CAL-004 after Gemini direct had failed it
  7. ✅ GC-018 issued for W66-T1 CP3A full scored batch — `docs/baselines/CVF_GC018_W66_T1_CP3A_FULL_SCORED_BATCH_AUTHORIZATION_2026-04-11.md`; 810 runs authorized; GC-026 tracker synced
  8. ⏳ Execute the full 810-run batch; collect evidence; file batch completion receipt; open CP4 reviewer scoring
- **Docker sandbox posture**: keep deferred-by-default unless a fresh bounded `GC-018` is justified by a real trigger
- **Docker sandbox open triggers**:
  - a live product surface must execute user-controlled code / plugins / bounded runtime tasks as a first-class use case
  - an external compliance, enterprise, or operational requirement rejects the current `worker_threads` / contract-aligned posture
  - product-value validation evidence shows bounded code execution is materially required for user value
- **Do not open Docker sandbox just because**:
  - the architecture feels incomplete on paper
  - physical isolation sounds cleaner than the current posture
  - a browser worker or process wrapper is being mistaken for true containment
- **W60-T1 CLOSED DELIVERED** — cvf-web Typecheck Stabilization (REMEDIATION class); TypeScript 0 errors; cvf-web 1853 tests pass; 3 pre-existing test failures fixed; Fast Lane (GC-021); commit `c15aa4c5`
- **W58-T1 CP1 CLOSED DELIVERED** — MC4: EPF Plane Closure Assessment (ASSESSMENT / DECISION class); EPF **DONE-ready**; historical deferred readout later superseded by W64-T1 delivery of Model Gateway + Sandbox Runtime
- **W57-T1 CP1 CLOSED DELIVERED** — MC3: LPF Plane Closure Assessment (ASSESSMENT / DECISION class); LPF **DONE-ready (7/7)**; Storage/Eval Engine + Observability + GovernanceSignal label currency gaps closed; no new LPF code needed
- **W56-T1 CP2 CLOSED DELIVERED** — MC2: GEF Plane Closure Assessment CP1+CP2 (ASSESSMENT / DECISION class); GEF **DONE (6/6)**; Trust & Isolation **DONE** (label currency gap closed by CP2)
- **W55-T1 CLOSED DELIVERED** — MC1: CPF Plane Closure Assessment (ASSESSMENT / DECISION class); CPF **DONE-ready**; agent-definition registry + L0-L4 consolidation deferred (CLOSED-BY-DEFAULT)
- **W47-T1 CLOSED DELIVERED** — Whitepaper Update v3.7-W46T1 (DOCUMENTATION class); documentation-to-implementation gap CLOSED
- W59-T1 closure review: `docs/reviews/CVF_W59_T1_TRANCHE_CLOSURE_REVIEW_2026-04-07.md`
- W59-T1 CP1 review: `docs/reviews/CVF_GC019_W59_T1_CP1_MC5_WHITEPAPER_PROMOTION_REVIEW_2026-04-07.md`
- W59-T1 CP1 audit: `docs/audits/CVF_W59_T1_CP1_MC5_WHITEPAPER_PROMOTION_AUDIT_2026-04-07.md`
- **Verification baseline is already refreshed** — use the `2026-04-13` local baseline in this handoff and the quality readout in `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md`; do not spend time re-running the same full suites unless your change invalidates that baseline
- **Web inheritance assessment**: `docs/assessments/CVF_WEB_W64_INHERITANCE_GAP_ASSESSMENT_2026-04-10.md`
- **W64 follow-up review findings recorded below** — if reopened, treat as a bounded remediation/security tranche rather than architecture rediscovery
- W57-T1 closure review: `docs/reviews/CVF_W57_T1_TRANCHE_CLOSURE_REVIEW_2026-04-07.md`
- GC-026 closed sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W57_T1_CLOSED_2026-04-07.md`
- **Before any fresh GC-018 on CPF**: read `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` and preserve the maintainability perimeter adopted in `GC-033` through `GC-036`
- **Do not open a fresh tranche before consulting the canonical scan continuity registry.**
- **W59-T1 MC5 reference**: closure review `docs/reviews/CVF_W59_T1_TRANCHE_CLOSURE_REVIEW_2026-04-07.md`; GC-026 closed sync `docs/baselines/CVF_GC026_TRACKER_SYNC_W59_T1_CLOSED_2026-04-07.md`; audit `docs/audits/CVF_W59_T1_CP1_MC5_WHITEPAPER_PROMOTION_AUDIT_2026-04-07.md`
- **Canonical closure sequence — MC1 CPF DONE-ready, MC2 GEF DONE (6/6), MC3 LPF DONE-ready (7/7), MC4 EPF DONE-ready, MC5 COMPLETE** — no remaining MC step
- **Relocation lane CLOSED-BY-DEFAULT (2026-04-04)**: `P3/CP1` is the only landed physical move. `P3/CP3–CP5` + `P4/CP1–CP17` are landed governance/package-boundary canon. `P3/CP2` physical move remains excluded under freeze-in-place posture. This closure remains in force after `main` / `cvf-next` convergence. Remaining human-gated item is `npm publish` and it is not a relocation task.
- **Reopen rule**: do not open another broad relocation wave by default. Reopen only through preservation override + fresh `GC-019` + fresh `GC-039` + dedicated `restructuring/p3-*` branch + secondary worktree. Do not perform reopened relocation work directly on `main` or synchronized `cvf-next`.
- **Freeze-in-place root set**: `v1.0/`, `v1.1/`, `REVIEW/`, `ECOSYSTEM/`, `CVF_SKILL_LIBRARY/`, `ui_governance_engine/`
- **Why**: protection, lower churn, and faster closure matter more than cosmetic tree cleanup; explain structure through curated docs instead of moving sensitive or reference-heavy roots
- **Allowed next work on this lane**: docs curation, extracted orientation, publication-boundary clarification, and handoff alignment only
- Canonical restructuring refs: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`, `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`, `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`, `docs/reference/CVF_PUBLIC_STRUCTURE_OVERVIEW.md`, `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- Canonical master-architecture closure route: `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md`
- If touching CPF batch-contract surfaces, reuse `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/batch.contract.shared.ts` and `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/helpers/cpf.batch.contract.fixtures.ts`
- W7 retained active anchors: `docs/roadmaps/CVF_W7_R14_R15_R16_INTEGRATION_ROADMAP_2026-03-25.md`, `docs/reviews/CVF_W7_T3_CP1_GUARD_BINDING_MATRIX_2026-03-28.md`, `docs/reviews/CVF_W7_T3_CP2_ARCHITECTURE_BOUNDARY_LOCK_2026-03-28.md`, `docs/reviews/CVF_W7_T10_CP2_GATE_CLOSURE_VERIFICATION_MATRIX_2026-03-28.md`, `docs/reviews/CVF_W7_T10_CP3_CLOSURE_REVIEW_2026-03-28.md`
- W7 detailed tranche packet archive indexes: `docs/reviews/archive/CVF_ARCHIVE_INDEX.md`, `docs/roadmaps/archive/CVF_ARCHIVE_INDEX.md`
- Guard binding matrix (G1-G8 + P-01–P-15): `docs/reviews/CVF_W7_T3_CP1_GUARD_BINDING_MATRIX_2026-03-28.md`
- Architecture boundary lock: `docs/reviews/CVF_W7_T3_CP2_ARCHITECTURE_BOUNDARY_LOCK_2026-03-28.md`
- W5-T2 closure: `docs/reviews/CVF_W5_T2_TRANCHE_CLOSURE_REVIEW_2026-03-28.md`

---

## W64 Follow-Up Findings — Static Review 2026-04-10 — ALL CLOSED

> Review scope: `W64-T1` delivered code (`ProviderRouterContract`, `SandboxIsolationContract`, `WorkerThreadSandboxAdapter`)
> Review method: static code review → remediation → test verification
> Closure: all 3 findings remediated in commit `ae64a095` follow-up; no outstanding items

### Finding 1 — `WorkerThreadSandboxAdapter` isolation claim — **CLOSED**

- Severity: `CRITICAL` → **REMEDIATED**
- Fix applied:
  - Header comment narrowed from "physical isolation" to "best-effort delegated execution"
  - Explicit note added: `worker_threads` are NOT a security boundary; real containment requires docker/v8_isolate
  - Pre-execution policy checks expanded: empty command rejection, workingDir-vs-filesystem-denied check, broader write-indicator detection (`--output`, `-o`, `>`, `>>`, `tee`)
  - 4 new adapter tests verify CONTAINMENT_VIOLATION for each pre-check path
- Verification: Adapter Hub 71 tests passed (8 files)

### Finding 2 — shell-injection in command construction — **CLOSED**

- Severity: `HIGH` → **REMEDIATED**
- Fix applied:
  - Replaced `execSync(command + ' ' + args.join(' '))` with `execFileSync(command, args)` — non-shell execution path
  - Command and args are now passed as separate array elements to the worker, never concatenated into a shell string
  - Shell metacharacters (`&`, `|`, `;`, `>`, quotes, spaces, globs) can no longer alter command meaning
  - New adapter test verifies real echo command execution with args passed safely
- Verification: Adapter Hub 71 tests passed (8 files)

### Finding 3 — `SandboxIsolationContract.execute()` config validation — **CLOSED**

- Severity: `MEDIUM` → **REMEDIATED**
- Fix applied:
  - `execute()` now calls `validateConfig()` before delegating to executor
  - Invalid configs return `status: "FAILED"` with validation errors in `stderr` — executor is never reached
  - Failed-closed result is recorded in audit log for traceability
  - 5 new tests: zero timeout, negative limits, unrestricted egress, audit log recording, executor-not-called assertion
- Verification: Safety Runtime 739 tests passed (59 files)

---

## W64 Web Inheritance Re-Review — 2026-04-10 — ALL CLOSED

> Re-review scope: post-remediation `main` after `217313a7` and web inheritance closure commit `ae64a095`
> Review method: static code review + targeted test rerun + remediation applied 2026-04-10
> Verification rerun on this pass:
> - `CVF_v1.7.1_SAFETY_RUNTIME`: 739/739 pass
> - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`: 71/71 pass
> - `cvf-web`: 116 files / 1853 tests pass, 3 skipped
> Conclusion: original W64 sandbox findings closed in foundation packages; web re-review findings remediated and closed — see below

### Finding 1 — `cvf-web` Track 5B inheritance claim is overstated — **CLOSED**

- Severity: `HIGH` → **REMEDIATED** (claim narrowed)
- Disposition: `sandbox-contract-adapter.ts` is intentionally contract-aligned only (stub mode). The web execute API (`/api/execute`) calls AI provider APIs — it does not run user code in a process sandbox. Wiring the stub into that path would add no security value. Track 5B web status is correctly described as **contract-aligned only**.
- Canon: `cvf-web` mirrors the `SandboxIsolationContract` API surface (types, validation logic, audit log) but does not claim physical execution isolation. Physical isolation (docker/v8_isolate) remains a future-facing item outside the current closure baseline.
- `security.ts` browser-side sandbox is a separate, unrelated concern.

### Finding 2 — Provider Router fallback can be bypassed by early API-key failure — **CLOSED**

- Severity: `MEDIUM` → **REMEDIATED**
- Fix applied:
  - Removed early `if (!apiKey)` return that ran before provider routing
  - Provider router now runs with `configuredProviders` first; `routedProvider` is resolved from router result
  - API key validation now runs after routing, bound to `routedApiKey = apiKeyMap[routedProvider]`
  - When no providers are configured, router returns DENY (403) instead of a spurious 400
- Files modified:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.test.ts` (updated 1 test + added fallback coverage test)

### Finding 3 — web sandbox adapter execute path still does not enforce config validation — **CLOSED**

- Severity: `MEDIUM` → **REMEDIATED**
- Fix applied:
  - `executeInSandbox()` now calls `validateConfig(config)` before `stubExecute()`
  - Invalid config returns `success: false` with structured error and `FAILED` audit log entry
  - Executor (`stubExecute`) is never reached on invalid config
- Files modified:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.ts`
- Tests added:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/sandbox-contract-adapter.test.ts` (new file — 11 tests covering valid path, zero timeout, negative memory, audit log recording, executor-not-called)

---

## Fully Closed CPF Barrel Families — Do Not Re-Examine

> When searching for the next open tranche, skip every barrel listed here. All batch surfaces in these barrels are canonically closed and committed. No open surface remains.

### `consumer.pipeline.bridges.barrel.ts` — FULLY CLOSED
All W1-Txx / W2-Txx / W3-Txx / W4-Txx consumer pipeline bridges delivered. Every plane (Control / Execution / Governance / Learning) has all bridges canonically closed.

### `control.plane.gateway.barrel.ts` — FULLY CLOSED
- Gateway batch family (W22–W25): GatewayAuth, AIGateway, GatewayPIIDetection, RouteMatch batch contracts — CLOSED
- Gateway log batch family (W41–W43): GatewayAuthLog, GatewayPIIDetectionLog, RouteMatchLog batch contracts — CLOSED
- GatewayConsumer batch (W45): GatewayConsumerBatchContract — CLOSED 2026-04-05
- All 8 batch surfaces closed. Nothing to open in this barrel.

### `control.plane.design.boardroom.barrel.ts` — FULLY CLOSED
- Orchestration (W26), Design (W27), ReversePrompting (W28), Boardroom (W29), BoardroomTransitionGate (W30), BoardroomRound (W31), BoardroomMultiRound (W32), ClarificationRefinement (W34) — CLOSED
- DesignConsumer (W46) — CLOSED 2026-04-05
- All 9 batch surfaces closed. Nothing to open in this barrel.

### `control.plane.knowledge.barrel.ts` — FULLY CLOSED
- KnowledgeRanking (W33)
- All knowledge batch surfaces closed.

### `control.plane.context.barrel.ts` — FULLY CLOSED
- ContextPackager (W37), ContextEnrichment (W38)
- All context batch surfaces closed.

### `control.plane.coordination.barrel.ts` — FULLY CLOSED
- TrustIsolation scope/propagation/declare (W19/W20/W21), AgentDefinitionCapability (W13), AgentScopeResolution (W14), AgentDefinitionAudit (W15), AgentRegistration (W17), ModelGatewayBoundary (W39)
- All coordination + trust + agent-definition batch surfaces closed.

### `control.plane.continuation.barrel.ts` — FULLY CLOSED
- All continuation-related contracts and batch surfaces closed. No open surface.

### `control.plane.workflow.barrel.ts` — FULLY CLOSED
- Intake (W35), Retrieval (W36), Packaging (W40), Consumer (W44)
- All 4 workflow batch surfaces closed. **Last batch surface closed 2026-04-05 (W44-T1).**

---

## EPF Batch Surface State — Canonical Scan Continuity

> The authoritative inherited scan state now lives in `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`. Use that registry before starting any next EPF tranche.

### `epf.dispatch.barrel.ts` family — FULLY CLOSED
- `DispatchContract`, `PolicyGateContract`, `CommandRuntimeContract`, `AsyncCommandRuntimeContract`, `AsyncExecutionStatusContract`, and `ExecutionReintakeContract` now have canonical governed batch surfaces through W49–W54.
- Treat the full dispatch-gate-runtime-async-status-reintake family as CLOSED unless a fresh `GC-018` explicitly authorizes another EPF surface outside that family.
- Full EPF local baseline was re-verified clean on `2026-04-10`; do not rerun the entire suite before new EPF work unless your touched surface invalidates that baseline.

### EPF Determinism Note
- The prior local failure in `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/bridge.runtime.pipeline.test.ts` is resolved in the current workspace baseline by threading `now` into nested `CommandRuntimeContract` creation from `ExecutionPipelineContract`.
- No known EPF full-suite blocker remains in the current local baseline; only the first hosted CI run of the expanded workflow is still pending.

---

## GEF / LPF Surface State

- **GEF (Governance Expansion Foundation)**: 625 tests, 0 failures. Scan status: `FULLY_CLOSED` (W56-T1 CP1+CP2). GEF is **DONE (6/6)** — all 13 base contracts + all consumer pipeline batch contracts + standalone `watchdog.escalation.pipeline.batch.contract.ts` present; Trust & Isolation DONE (CP2). No further GEF implementation is needed within the current closure baseline.
- **LPF (Learning Plane Foundation)**: 1465 tests, 0 failures. Scan status: `FULLY_CLOSED` (W57-T1 CP1). LPF is **DONE-ready (7/7)** — all 20 base contracts + 18 consumer pipeline contracts + 18 consumer pipeline batch contracts + 2 standalone batch contracts present; Storage/Eval Engine + Observability + GovernanceSignal label currency gaps closed (W57-T1 CP1). No further LPF implementation is needed within the current closure baseline.

---

## Known Governance Constraints — Read Before Starting Next Tranche

> These are active hard limits or frozen rules encountered during W48-T1. Future agents MUST read this before making changes.

### EPF `index.ts` — AT EXCEPTION MAXIMUM (1450 / 1450 lines)

**Status**: File is exactly at its governed exception maximum as of W48-T1 CP1 commit `84a8d6c4`.

**What this means for you**:
- Adding **any** new export lines to `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` will cause the pre-commit hook to fail with `exception_approved_max_exceeded`.
- The exception max is registered in `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json` as `"approvedMaxLines": 1450`.
- **You CANNOT raise `approvedMaxLines` in a normal commit.** The exception registry integrity guard (`check_governed_exception_registry.py`) compares against HEAD and blocks any change to existing exception `approvedMaxLines` in the normal pre-commit path. This requires explicit human-approved override.

**Your options before adding exports to EPF `index.ts`**:
1. **Preferred**: Split `index.ts` into domain-local sub-barrels (e.g., per plane-section or per contract family). This removes the exception need entirely.
2. **Fallback**: Ask the user to manually approve a registry bump (modify `approvedMaxLines` and commit via a separate human-approved override commit outside the normal pre-commit chain).
3. **Resolved in W49-T1**: Barrel split extracted dispatch family exports to `epf.dispatch.barrel.ts`. `index.ts` is now at **1423/1450 lines** (−27). New dispatch-family exports must go to `epf.dispatch.barrel.ts`. Other families near capacity should follow the same split pattern.

**Do not attempt**: `git commit --no-verify` or bypass of the hook chain without explicit user direction.

### Exception Registry — Frozen for Normal Commits
- `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json` entries with an existing `approvedMaxLines` are **frozen**. The pre-commit `check_governed_exception_registry.py` guard will reject any change to an existing entry's `approvedMaxLines` even by 1 line.
- New entries (new paths) also require explicit human review and are blocked in the normal pre-commit path.
- This applies to ALL governed barrel files, not just EPF `index.ts`.

### CPF `index.ts` — NOT A CONSTRAINT (thin delegating re-exporter)
- CPF `index.ts` is only 12 lines — it delegates via `export * from "./barrel-name"` patterns (per GC-023 split requirement). Adding a new barrel line here is low-risk and not subject to the line limit exception mechanism.
- The individual barrel files (e.g. `control.plane.gateway.barrel.ts`) may have their own line limits — check those if you add new exports directly to a barrel.

---

## Governance Rules (must follow strictly)

### Tranche Protocol
1. **GC-018** (10/10 audit score) → commits roadmap + tracker + GC-026 sync + execution plan
2. **GC-032 first** before writing governed packets → source truth first, typed evidence stays explicit, continuity surfaces move together
3. **Quality-first before expansion** → read the active quality assessment and explicitly decide `REMEDIATE_FIRST` or `EXPAND_NOW` before drafting any fresh GC-018 packet
4. **GC-033 to GC-036 enforced for CPF maintainability** → thin public barrel, smoke-only `tests/index.test.ts`, shared batch helpers/builders, and no typed evidence payload drift into canon summary docs
5. **Per CP**: Full Lane = new concept/module/cross-plane; Fast Lane (GC-021) = additive batch/summary
6. **Per CP artifacts**: audit doc + review doc + delta doc + exec plan update + test log update + commit
7. **No implementation without GC-018 authorization**
8. **Canonical continuation is now on `main`** — keep `cvf-next` synchronized only as an explicit compatibility mirror

### Fast Lane (GC-021) — eligible when:
- additive only, no restructuring
- inside already-authorized tranche
- no new module creation, no ownership transfer, no boundary change

### Memory Governance (GC-022)
- `docs/audits/`, `docs/reviews/` → `Memory class: FULL_RECORD`
- `docs/baselines/`, `docs/roadmaps/` → `Memory class: SUMMARY_RECORD`
- `docs/reference/`, `docs/INDEX.md` → `Memory class: POINTER_RECORD`

### Test Governance (GC-024)
- Each new contract gets a **dedicated test file** (not added to `tests/index.test.ts`)
- Add partition entry to `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`

### Determinism Pattern (all contracts must follow)
- inject `now?: () => string` in `ContractDependencies`
- default: `() => new Date().toISOString()`
- propagate to all sub-contracts via `now: this.now`
- hash IDs with `computeDeterministicHash()` from `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
- **Critical**: when inner contracts create their own sub-contracts internally, thread `now` explicitly into nested dependencies from the consumer bridge constructor

### Batch Contract Pattern
- `dominantTokenBudget` = `Math.max(...results.map(r => r.consumerPackage.typedContextPackage.estimatedTokens))`
- empty batch → `dominantTokenBudget = 0`, valid hash
- `batchId` ≠ `batchHash` (batchId = hash of batchHash only)

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Architecture baseline snapshot | `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` |
| Progress tracker | `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` |
| Scan continuity registry | `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` |
| Completion roadmap | `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` |
| Post-W7 upgrade baseline | `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` |
| Governed artifact authoring standard | `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md` |
| Test log | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| Test partition registry | `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json` |
| CPF barrel exports | `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` |
| EPF barrel exports | `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/index.ts` |
| GEF barrel exports | `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/index.ts` |
| Deterministic hash util | `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash.ts` |
| Fast lane audit template | `docs/reference/CVF_FAST_LANE_AUDIT_TEMPLATE.md` |
| Fast lane review template | `docs/reference/CVF_FAST_LANE_REVIEW_TEMPLATE.md` |
| GC-026 tracker sync template | `docs/reference/CVF_GC026_PROGRESS_TRACKER_SYNC_TEMPLATE.md` |

---

## Doc Naming Conventions

- GC-018 auth: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W{W}_T{T}_{SLUG}_{DATE}.md`
- GC-026 auth sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_AUTHORIZATION_{DATE}.md`
- GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W{W}_T{T}_CLOSURE_{DATE}.md`
- Execution plan: `docs/roadmaps/CVF_W{W}_T{T}_{SLUG}_EXECUTION_PLAN_{DATE}.md`
- Full Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Full Lane review: `docs/reviews/CVF_GC019_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Fast Lane audit: `docs/audits/CVF_W{W}_T{T}_CP{N}_{SLUG}_AUDIT_{DATE}.md`
- Fast Lane review: `docs/reviews/CVF_GC021_W{W}_T{T}_CP{N}_{SLUG}_REVIEW_{DATE}.md`
- Delta: `docs/baselines/CVF_W{W}_T{T}_CP{N}_{SLUG}_DELTA_{DATE}.md`
- Closure review: `docs/reviews/CVF_W{W}_T{T}_TRANCHE_CLOSURE_REVIEW_{DATE}.md`

## New Machine Minimum Bootstrap

If this repo was freshly cloned on a new machine:

- read `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md` first
- do not preinstall every extension by default
- if you are touching one extension only:
  - run `npm ci` when that package already has `package-lock.json`
  - otherwise run `npm install`
- the 4 foundations now ship lockfiles, so fresh clones can run `npm ci` there immediately
- if you need all 4 foundations ready at once, run `.\scripts\bootstrap_foundations.ps1` or `./scripts/bootstrap_foundations.sh`

Examples:

```powershell
# single foundation on a fresh clone
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION
npm ci
npm run check
npm run test

# all 4 foundations
.\scripts\bootstrap_foundations.ps1
./scripts/bootstrap_foundations.sh
```

---

## Test Commands

```bash
# CPF tests
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test

# EPF tests
cd EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION && npm test

# GEF tests
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm test

# LPF tests
cd EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION && npm test

# Web baseline
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx tsc --noEmit
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run test:run
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npm run build
```

---

## Commit Format

```
<type>(W{W}-T{T}/CP{N}): <short description> — <Lane>

Tranche: W{W}-T{T} — <Tranche Name>
Control point: CP{N} — <ContractName>
Lane: Full Lane | Fast Lane (GC-021)

Contract: <what it does>
Tests: <N> new (<total> <module> total, 0 failures)
Governance artifacts: <list of docs>
```
