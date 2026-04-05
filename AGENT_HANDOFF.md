# CVF Agent Handoff — 2026-04-05

> Branch: `main`
> Branch posture: `main` is the canonical continuation branch after 2026-04-04 convergence; `cvf-next` is kept as a synchronized mirror for compatibility
> Latest branch-governance posture: relocation closed-by-default; canon converged to `main`
> Remote tracking branch: `origin/main` (canonical continuation)
> Compatibility mirror branch: `origin/cvf-next`
> Exact remote SHA must be derived live from git when needed; do not hand-maintain it in handoff
> State: **UNIFIED ON MAIN / NO ACTIVE TRANCHE** — W56-T1 closed delivered; MC2 GEF Plane Closure Assessment: **DONE-ready**; Trust & Isolation deferred (cross-plane aspiration, non-blocking); CPF 2929 / EPF 1301 / GEF 625 / LPF 1465 tests unchanged; canonical next step: W57-T1 MC3 LPF Closure Assessment
> Architecture baseline snapshot: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; operational readout refreshed through `W56-T1`)

---

## Current State

- External agent memory files: non-canonical convenience only; resume from repo truth first
- Non-canonical side lanes are separate from this handoff; use this file for canonical continuation on `main`
- `cvf-next` is now a synchronized compatibility mirror and should not drift ahead of `main` without an explicit branch strategy change
- Pre-public restructuring posture is now narrowed, canonized, and closed-by-default: avoid reopening root-level relocation unless a separate preservation override explicitly justifies it
- Canonical scan continuity registry: `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json`

### Test Counts (last verified clean)
- CPF (Control Plane Foundation): **2929 tests, 0 failures**
- EPF (Execution Plane Foundation): **1301 tests, 0 failures** (isolated; pre-existing ordering-sensitive flakiness in `policy.gate.batch.contract.test.ts` in full-suite runs)
- GEF (Governance Expansion Foundation): **625 tests, 0 failures**
- LPF (Learning Plane Foundation): **1465 tests, 0 failures**

### Last Tranches Closed

| Tranche | Description | Status |
|---------|-------------|--------|
| W56-T1 | MC2: GEF Plane Closure Assessment (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-05 — GEF plane-level posture: **DONE-ready**; 5/6 whitepaper components at DONE; all 13 base contracts + consumer pipeline batch contracts present; `watchdog.escalation.pipeline.batch.contract.ts` present; GEF 625 tests 0 failures; Trust & Isolation deferred (cross-plane aspiration, non-blocking); promote to DONE in MC5 |
| W55-T1 | MC1: CPF Plane Closure Assessment (ASSESSMENT / DECISION class) | CLOSED DELIVERED 2026-04-05 — CPF plane-level posture: **DONE-ready**; all CPF batch barrel families verified FULLY CLOSED; all CPF consumer bridges closed; CPF 2929 tests 0 failures; agent-definition registry + L0-L4 consolidation deferred (relocation-class, CLOSED-BY-DEFAULT); no new CPF implementation needed; promote to DONE in MC5 |
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

- Whitepaper: `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` (`v3.7-W46T1`; operational readout refreshed through `W56-T1`)
- Posture: `SUBSTANTIALLY DELIVERED` (CPF: **DONE-ready**; GEF: **DONE-ready**; LPF/EPF: assessment pending MC3/MC4)
- All four planes: `SUBSTANTIALLY DELIVERED`; W7 Governance Integration: `DONE`; post-W7 continuation: `DONE`; MC1 CPF: `DONE-ready`; MC2 GEF: `DONE-ready`
- Continuation readout: `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1 / W16-T1 / W17-T1 / W18-T1 / W19-T1 / W20-T1 / W21-T1 / W22-T1 / W23-T1 / W24-T1 / W25-T1 / W26-T1 / W27-T1 / W28-T1 / W29-T1 / W30-T1 / W31-T1 / W32-T1 / W33-T1 / W34-T1 / W35-T1 / W36-T1 / W37-T1 / W38-T1 / W39-T1 / W40-T1 / W41-T1 / W42-T1 / W43-T1 / W44-T1 / W45-T1 / W46-T1 / W47-T1 / W48-T1 / W49-T1 / W50-T1 / W51-T1 / W52-T1 / W53-T1 / W54-T1 / W55-T1 / W56-T1`
- Documentation-to-implementation gap: CLOSED (`v3.7-W46T1`)

---

## Immediate Next Action Required

**No active tranche. Work from `main`. Keep relocation closed-by-default. Canonical next step: W56-T1 MC2 GEF Closure Assessment.**

Current guidance:

- **Unified branch state** — `main` contains the previously canonical `cvf-next` state; keep `cvf-next` fast-forward aligned when compatibility requires it
- **W56-T1 CLOSED DELIVERED** — MC2: GEF Plane Closure Assessment (ASSESSMENT / DECISION class); GEF **DONE-ready**; Trust & Isolation deferred (cross-plane aspiration, non-blocking); no new GEF code needed before MC5
- **W55-T1 CLOSED DELIVERED** — MC1: CPF Plane Closure Assessment (ASSESSMENT / DECISION class); CPF **DONE-ready**; agent-definition registry + L0-L4 consolidation deferred (CLOSED-BY-DEFAULT)
- **W54-T1 CLOSED DELIVERED** — ExecutionReintakeBatchContract (REALIZATION class); EPF 1301 (+26); dispatch-gate-runtime-async-status-reintake barrel family FULLY CLOSED
- **W47-T1 CLOSED DELIVERED** — Whitepaper Update v3.7-W46T1 (DOCUMENTATION class); documentation-to-implementation gap CLOSED
- **Next**: open W57-T1 — MC3 LPF Closure Assessment; LPF scan continuity status is `NOT_YET_SCANNED`; read `governance/compat/CVF_SURFACE_SCAN_REGISTRY.json` and `docs/roadmaps/CVF_MASTER_ARCHITECTURE_CLOSURE_ROADMAP_2026-04-05.md` §6.3 before starting; do not assume LPF closed state from GEF/CPF evidence
- W56-T1 closure review: `docs/reviews/CVF_W56_T1_TRANCHE_CLOSURE_REVIEW_2026-04-05.md`
- GC-026 closed sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W56_T1_CLOSED_2026-04-05.md`
- **Before any fresh GC-018 on CPF**: read `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` and preserve the maintainability perimeter adopted in `GC-033` through `GC-036`
- **Do not open a fresh tranche before consulting the canonical scan continuity registry.**
- **Canonical closure sequence — MC1 DONE, MC2 DONE; remaining**: `MC3 LPF closure assessment -> MC4 EPF closure focus (Model Gateway + Sandbox Runtime) -> MC5 whitepaper/tracker promotion pass`
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
- Run `npx vitest run EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION` (isolated) to baseline before any new EPF work.

### Known EPF Flakiness — Pre-Existing
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/bridge.runtime.pipeline.test.ts` — hash determinism test fails **only when full EPF suite runs** due to ordering-sensitive state interaction. Passes in isolation and together with W48-T1 tests. **Do not spend time fixing this without isolating the root cause first.** Run the specific test file in isolation to verify your work, not the full suite.

---

## GEF / LPF Surface State — Not Yet Scanned

> These planes remain `NOT_YET_SCANNED` in the canonical scan continuity registry as of 2026-04-05. Next agent must assess before starting work.

- **GEF (Governance Expansion Foundation)**: 625 tests, 0 failures. No batch surfaces were opened or closed in W44–W48. Scan required — read `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` GEF section.
- **LPF (Learning Plane Foundation)**: 1465 tests, 0 failures. No batch surfaces were opened or closed in W44–W48. Scan required — read `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` LPF section.
- Do not assume GEF/LPF barrels are closed. Their scan state is unknown as of 2026-04-05.

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
