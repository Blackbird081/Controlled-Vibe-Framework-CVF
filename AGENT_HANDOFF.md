# CVF Agent Handoff — 2026-04-11

> Branch: `main`
> Branch posture: `main` is the canonical continuation branch after 2026-04-04 convergence; `cvf-next` is kept as a synchronized mirror for compatibility
> Latest branch-governance posture: relocation closed-by-default; canon converged to `main`
> Remote tracking branch: `origin/main` (canonical continuation)
> Compatibility mirror branch: `origin/cvf-next`
> Exact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff
> State: **UNIFIED ON MAIN / NO ACTIVE TRANCHE** — W66-T1 CP2 closed delivered; Product Value Validation Wave CP2 (Run Harness Setup): **COMPLETE** — CFG-A/CFG-B configuration specs FROZEN; evidence capture schema FROZEN; reviewer calibration set (5 tasks: CAL-001 NORMAL / CAL-002 AMBIGUOUS / CAL-003 HIGH_RISK / CAL-004 ADVERSARIAL / CAL-005 MULTI_STEP) FROZEN; evidence completeness checklist (7-item pre-CP3 gate) FROZEN; test delta 0; code delta 0; W66-T1 CP1 (Corpus + Rubric Freeze): **COMPLETE** — 90-task corpus FROZEN; rubric FROZEN; GC-042 evidence chain foundation established; W65-T1 Phase B Packaging remains **COMPLETE** — 3 packages `CANDIDATE` + 1 `REVIEW_REQUIRED`; W64-T1 Track 5: **COMPLETE**; Post-MC5 Continuation Strategy: **ALL 6 ACTIONABLE TRACKS COMPLETE**; local verification baseline `2026-04-10`: CPF 2929 / EPF 1301 / GEF 625 / LPF 1465 all pass; `cvf-web` passes `tsc + full vitest (117 files / 1865 tests)`; W66-T1 CP1+CP2 test delta = 0; CP3 requires human operator confirmation before fresh GC-018
> Architecture baseline snapshot: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; document type: CLOSURE-ASSESSED; operational readout refreshed through `W64-T1`)

---

## Current State

- External agent memory files: non-canonical convenience only; resume from repo truth first
- Non-canonical side lanes are separate from this handoff; use this file for canonical continuation on `main`
- `cvf-next` is now a synchronized compatibility mirror and should not drift ahead of `main` without an explicit branch strategy change
- Pre-public restructuring posture is now narrowed, canonized, and closed-by-default: avoid reopening root-level relocation unless a separate preservation override explicitly justifies it
- Canonical scan continuity registry: `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`

### Local Verify Baseline (2026-04-10)
- CPF (Control Plane Foundation): `npm run check` + `npm test` clean; **2929 tests, 0 failures**
- EPF (Execution Plane Foundation): `npm run check` + `npm test` clean; **1301 tests, 0 failures**
- GEF (Governance Expansion Foundation): `npm run check` + `npm test` clean; **625 tests, 0 failures**
- LPF (Learning Plane Foundation): `npm run check` + `npm test` clean; **1465 tests, 0 failures**
- `cvf-web`: `npx tsc --noEmit` clean; `npm run test:run` clean; **1865 passed / 3 skipped**; `npm run build` clean
- `.github/workflows/cvf-ci.yml` now mirrors this local baseline across Guard Contract, MCP server, 4 foundation packages, and `cvf-web`; first hosted GitHub Actions confirmation is still pending

### Reuse Rule For Future Agents
- Treat the `2026-04-10` local verification set as the current shared baseline.
- Do **not** rerun the full foundation suites or full `cvf-web` baseline by default when your work does not touch those verified surfaces.
- Rerun only if at least one of these changes: package manifests or lockfiles, test/build config, shared contract exports, dependency install state, runtime/toolchain version, or files inside the surfaces you modify.
- If your change is tightly scoped, run the smallest proving command that covers your touched surface and inherit the remaining baseline from this handoff.

### Last Tranches Closed

| Tranche | Description | Status |
|---------|-------------|--------|
| W66-T1 CP2 | Product Value Validation Wave — Run Harness Setup (DOCUMENTATION / VALIDATION_TEST class) | CLOSED DELIVERED 2026-04-11 — CFG-A/CFG-B configuration specs FROZEN (`claude-sonnet-4-6`; CFG-A: direct API, temp 0.3, max_tokens 2048; CFG-B: cvf-web governed path, same parity); evidence capture schema FROZEN; reviewer calibration set (5 tasks, 1 per class) FROZEN; 7-item pre-CP3 evidence completeness checklist FROZEN; test delta 0; code delta 0; Fast Lane (GC-021) |
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

- Whitepaper: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; document type `CLOSURE-ASSESSED`; operational readout refreshed through `W64-T1`)
- Posture: `CLOSURE-ASSESSED` (CPF: **DONE-ready**; GEF: **DONE (6/6)**; LPF: **DONE-ready (7/7)**; EPF: **DONE-ready** — Track 5 deferred items are now delivered: Model Gateway Provider Router in CPF and Sandbox Runtime Physical Isolation via `SandboxIsolationContract` + `WorkerThreadSandboxAdapter`)
- All four planes: plane-banner promotion pass complete; W7 Governance Integration: `DONE`; post-W7 continuation: `DONE`; MC1 CPF: `DONE-ready`; MC2 GEF: **DONE (6/6)**; MC3 LPF: **DONE-ready (7/7)**; MC4 EPF: **DONE-ready**; MC5 whitepaper canon promotion: **COMPLETE**
- Continuation readout: `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1 / W16-T1 / W17-T1 / W18-T1 / W19-T1 / W20-T1 / W21-T1 / W22-T1 / W23-T1 / W24-T1 / W25-T1 / W26-T1 / W27-T1 / W28-T1 / W29-T1 / W30-T1 / W31-T1 / W32-T1 / W33-T1 / W34-T1 / W35-T1 / W36-T1 / W37-T1 / W38-T1 / W39-T1 / W40-T1 / W41-T1 / W42-T1 / W43-T1 / W44-T1 / W45-T1 / W46-T1 / W47-T1 / W48-T1 / W49-T1 / W50-T1 / W51-T1 / W52-T1 / W53-T1 / W54-T1 / W55-T1 / W56-T1 / W57-T1 / W58-T1 / W59-T1 / W60-T1 / W61-T1 / W62-T1 / W63-T1 / W64-T1`
- Documentation-to-implementation gap: CLOSED (`v3.7-W46T1`)

---

## Immediate Next Action Required

**No active tranche. Work from `main`. Keep relocation closed-by-default. MC1-MC5 is complete; W66-T1 CP1+CP2 closed; CP3 requires human operator confirmation before fresh GC-018.**

Current guidance:

- **Unified branch state** — `main` contains the previously canonical `cvf-next` state; keep `cvf-next` fast-forward aligned when compatibility requires it
- **W66-T1 CP2 CLOSED DELIVERED** — Product Value Validation Wave CP2 (DOCUMENTATION / VALIDATION_TEST class); CFG-A/CFG-B specs FROZEN; evidence schema FROZEN; reviewer calibration set (5 tasks) FROZEN; 7-item pre-CP3 gate checklist FROZEN; test delta 0; code delta 0; Fast Lane (GC-021)
- **W66-T1 CP1 CLOSED DELIVERED** — 90-task corpus FROZEN (A1×30 FAM-001/002/003 + A2×20 FAM-004/005 + B×20 real product + C×20 governance stress); rubric FROZEN; run manifest PLANNED; GC-042 evidence chain foundation established
- **W66-T1 CP3 (Blind Comparative Evaluation Runs)**: NOT YET AUTHORIZED — requires human operator to confirm all of the following before a fresh GC-018 can be opened: (1) execution infrastructure live (API keys, cvf-web instance, evidence storage), (2) 5 calibration pilot tasks run through CFG-A + CFG-B, (3) all 7 evidence completeness items confirmed, (4) reviewer pool assigned (≥ 3 reviewers), (5) reviewer calibration session complete (κ ≥ 0.70), (6) human freeze of corpus + rubric confirmed in writing
- **No active tranche** — any new implementation, capability expansion, CI widening, or product-surface remediation requires a fresh bounded `GC-018`
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
- **Product value rule**: all future value-proof packets and any Docker-sandbox justification must run through the `GC-042` frozen evidence chain (`corpus -> rubric -> run manifest -> assessment`), not demos or score vanity
- **Post-MC5 orientation**: `docs/guides/POST_MC5_ORIENTATION.md`
- **Post-MC5 Continuation Strategy**: **ALL 6 ACTIONABLE TRACKS COMPLETE** (Track 1: CI/CD Expansion ✅, Track 2: Product Hardening ✅, Track 3: Pre-Public Packaging ✅, Track 4: Documentation Curation ✅, Track 5A: Model Gateway ✅, Track 5B: Sandbox Runtime ✅)
- **Next recommended**: authorize W66-T1 CP2 (Run Harness) when execution infrastructure and reviewer pool are confirmed; PVV Wave CP1 is closed and the evidence chain foundation is ready
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
- **Verification baseline is already refreshed** — use the `2026-04-10` local baseline in this handoff and the quality readout in `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md`; do not spend time re-running the same full suites unless your change invalidates that baseline
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
