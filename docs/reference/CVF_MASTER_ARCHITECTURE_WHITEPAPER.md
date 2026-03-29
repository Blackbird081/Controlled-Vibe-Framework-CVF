# 🏛️ CVF Master Architecture Whitepaper
Memory class: POINTER_RECORD

> **Version:** 3.3-W15T1
> **Date:** 2026-03-30
> **Document Type:** SUBSTANTIALLY DELIVERED ARCHITECTURE WHITEPAPER — all four planes fully bridged; W7 Governance Integration Wave complete 2026-03-28; post-W7 continuation complete through W15-T1 2026-03-30; canonical architecture baseline updated to `v3.3-W15T1`
> **Authorization Status:** W5-T2 whitepaper update canonically closed 2026-03-28 (v3.0-W7T10). W11-T1 whitepaper update canonically closed 2026-03-29 (v3.1-W10T1). W12-T1 closure canonically closed 2026-03-29 and reflected in `v3.2-W12T1`. W13-T1 (`AgentDefinitionCapabilityBatchContract`) canonically closed 2026-03-30. W14-T1 (`AgentScopeResolutionBatchContract`) canonically closed 2026-03-30. W15-T1 (`AgentDefinitionAuditBatchContract`) canonically closed 2026-03-30 and now reflected in this synchronized baseline (`v3.3-W15T1`). Post-baseline continuation reconciled through `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1`. Current active tranche is `NONE`; any further continuation requires a new `GC-018` wave decision.
> **Clean Baseline References:**
> - `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` (phases, risk model)
> - `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts` (shared default guard stack)
> - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts` (full runtime preset)
> - `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` (current quick status through `W12-T1`)
> - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` (canonical delivered wave line and post-cycle continuation history)
> - `docs/reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md` (historical reconciliation snapshot through `W5-T1`)

> **Status Note:** this document now contains a reconciled mix of:
> - delivered current truth already evidenced in code and tranche packets
> - partially delivered target-state areas
> - future-facing design principles that still require later governed waves

> **Baseline Tracking Note:** as of `2026-03-30`, this whitepaper is updated to `v3.3-W15T1` — reflecting complete consumer pipeline bridge coverage across all four planes, the W7 Governance Integration Wave, and all post-W7 continuation deliveries (W8-T1: TrustIsolation + ModelGateway; W8-T2: PerformanceBenchmarkHarness; W9-T1: RagContextEngineConvergence; W10-T1: ReputationSignal + TaskMarketplace; W12-T1: AgentDefinitionBoundary; W13-T1: AgentDefinitionCapabilityBatch; W14-T1: AgentScopeResolutionBatch; W15-T1: AgentDefinitionAuditBatch). Use this file for architectural shape, the progress tracker for quick current posture, the roadmap for tranche history, and the handoff for execution rules.

> **Core Principle:** *"Agents may execute tasks, but they cannot control the system that governs them."*

> **Cross-Plane Context Continuity Principle:** `memory = repository of facts, history, and durable evidence`; `handoff = governance-filtered summary and transfer checkpoint`; `context loading = phase-bounded loading of only what the current step needs`. In CVF, handoff is context quality control by phase for multi-agent continuation.

---

## 1. Mô hình Thực thi Chính thức — CURRENT BASELINE (Đã xác minh bằng Code)

```
INTAKE → DESIGN → BUILD → REVIEW → FREEZE
```

> **Source of truth:** `CVF_GUARD_CONTRACT/src/types.ts:19-28`
> ```typescript
> export type CanonicalCVFPhase =
>   | 'INTAKE' | 'DESIGN' | 'BUILD' | 'REVIEW' | 'FREEZE';
> export type LegacyCVFPhaseAlias = 'DISCOVERY'; // compatibility only
> ```

| Phase | Mô tả | Không có Phase nào tên "EXECUTE" |
|-------|--------|----------------------------------|
| **INTAKE** | Thu nhận Signal/Intent | |
| **DESIGN** | AI Boardroom, Context Packager | |
| **BUILD** | Worker Agents thực thi (execution xảy ra ở đây) | |
| **REVIEW** | Audit/kiểm tra kết quả trước đóng băng | |
| **FREEZE** | Đóng băng, lưu artifacts | |

---

## 2. Risk Model — CURRENT BASELINE vs PROPOSED

### Hiện trạng (Source of Truth)
> **Source:** `CVF_GUARD_CONTRACT/src/types.ts:31`
> ```typescript
> export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
> ```

| Level | Mô tả |
|-------|--------|
| **R0** | Safe — đọc file, xem log |
| **R1** | Low Risk — sửa docs |
| **R2** | Medium Risk — sửa backend code |
| **R3** | High Risk — deploy, xoá DB |

### Đề xuất từ Constitutional Layer (CHƯA ĐƯỢC PHÊ DUYỆT)
> ⚠️ Thang `L0-L4` chỉ tồn tại dưới dạng **design proposal** trong `ADDING_AI Constitutional Layer`. Codebase hiện tại **không hề có** `L0-L4`. Nếu muốn migrate, cần **GC-018 approval riêng** cho việc mở rộng Risk Model.

| Level | Mô tả | Trạng thái |
|-------|--------|------------|
| L0-L4 | 5-mức thay vì 4-mức | **PROPOSAL ONLY — NOT IN CODE** |

---

## 3. Guard Baseline — CURRENT BASELINE (Đã xác minh bằng Code)

### Shared Hardened Default: 8 Guards
> **Source:** `CVF_GUARD_CONTRACT/src/index.ts:47-59`

```
1. AiCommitGuard
2. PhaseGateGuard
3. RiskGateGuard
4. AuthorityGateGuard
5. MutationBudgetGuard
6. FileScopeGuard
7. ScopeGuard
8. AuditTrailGuard
```

### Full Runtime Preset: 15 Guards
> **Source:** `cvf.sdk.ts:819-839` (bổ sung 7 guards trên nền 8 guards mặc định)

> ⚠️ **Không bao giờ là "13 guards".** Mọi tài liệu trước đó ghi "13" đều sai so với source code.

---

## 4. Sơ đồ Kiến trúc Hiện hành (CURRENT CANONICAL ARCHITECTURE — BASELINE W4-T11, REFRESHED THROUGH W15-T1 ON 2026-03-30)

> [!WARNING]
> Sơ đồ bên dưới giữ nguyên anchor kiến trúc canon ở mốc `W4-T11`, nhưng phần readout đã được refresh theo continuation packet mới nhất. Nó cho thấy cái gì đã delivered ở baseline, cái gì đã tiến thêm sau baseline, và cái gì vẫn còn future-facing.

**Legend maturity**

- `DONE`: đã có governed delivery và closure canon
- `SUBSTANTIALLY DELIVERED`: đã có usable governed path và nhiều bridge quan trọng, nhưng chưa phải full target-state
- `PARTIAL`: mới có slice vận hành đầu tiên hoặc một phần chuỗi giá trị
- `PROPOSAL ONLY`: vẫn là ý định kiến trúc, chưa được mở thành wave canon

```
                         USER / External Signal
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│       🛡️  CONTROL PLANE [SUBSTANTIALLY DELIVERED]              │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │ AI Gateway      │─▶│ Knowledge Layer │─▶│ Context Builder│ │
│  │ [SUBSTANTIALLY  │  │ [PARTIAL]       │  │ & Packager     │ │
│  │  DELIVERED]     │  │                 │  │                │ │
│  │ auth/routing/   │  │ query + ranking │  │ [PARTIAL]      │ │
│  │ pii/gateway     │  │ + consumer path │  │ deterministic  │ │
│  │ consumer paths  │  │                 │  │ context paths  │ │
│  └─────────────────┘  └─────────────────┘  └───────┬────────┘ │
│                                                     │          │
│  PHASE: INTAKE ─────────────────────────────────────▼────────  │
│                                                                 │
│                 ┌──────────────────────────────────────┐      │
│                 │ AI Boardroom / Reverse Prompting     │      │
│                 │ [SUBSTANTIALLY DELIVERED]            │      │
│                 │ orchestration + reverse prompting +  │      │
│                 │ clarification refinement + boardroom │      │
│                 │ consumer paths                       │      │
│                 └────────────────┬─────────────────────┘      │
│                                  ▼                            │
│  PHASE: DESIGN ──────────────────────────────────────────────  │
│                                                                 │
│                 ┌──────────────────────────────────────┐      │
│                 │ CEO / Orchestrator Surface           │      │
│                 │ [SUBSTANTIALLY DELIVERED]            │      │
│                 │ orchestration + boardroom + reverse  │      │
│                 │ prompting + clarification refinement │      │
│                 │ consumer bridges canonically closed  │      │
│                 └────────────────┬─────────────────────┘      │
│                                  ▼                            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ⚖️  GOVERNANCE LAYER [SUBSTANTIALLY DELIVERED]           │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐   │ │
│  │  │ Policy      │  │ Trust &        │  │ Audit /      │   │ │
│  │  │ Engine      │  │ Isolation      │  │ Consensus    │   │ │
│  │  │ [DONE /     │  │ [PARTIAL]      │  │ [DONE]       │   │ │
│  │  │ INVARIANT]  │  │ safety + guard │  │ all audit +  │   │ │
│  │  │ R0-R3       │  │ boundary exists│  │ consensus    │   │ │
│  │  │ current     │  │                │  │ bridges done │   │ │
│  │  └─────────────┘  └────────────────┘  └──────────────┘   │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐   │ │
│  │  │ CVF         │  │ Guard Engine   │  │ Skill/Agent  │   │ │
│  │  │ Watchdog    │  │ Shared: 8      │  │ Registry     │   │ │
│  │  │ [DONE]      │  │ Runtime: 15    │  │ [W7 DONE]    │   │ │
│  │  │ all watch-  │  │ [DONE /        │  │ SkillForm +  │   │ │
│  │  │ dog bridges │  │ INVARIANT]     │  │ StructSpec   │   │ │
│  │  │ canonically │  │                │  │ + W7 guards  │   │ │
│  │  └─────────────┘  └────────────────┘  └──────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🔗  W7 GOVERNANCE INTEGRATION LAYER [DONE — 2026-03-28]  │ │
│  │  SkillFormationRecord · StructuredSpec · W7RuntimeRecord  │ │
│  │  W7ArtifactRecord · W7TraceRecord · W7PlannerRecord       │ │
│  │  W7DecisionRecord · W7AgentBuilderRecord · W7EvalRecord   │ │
│  │  W7MemoryRecord — 8 guards G1-G8 · 32 presets · P1-P8    │ │
│  │  Dependency chain: Runtime→Artifact→Trace→Planner→        │ │
│  │  Decision→Eval/Builder→Memory — no fake-learning path     │ │
│  └───────────────────────────────────────────────────────────┘ │
│  Execution Authorization (Scope-Bounded Command)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│         ⚡  EXECUTION PLANE [SUBSTANTIALLY DELIVERED]           │
│                                                                 │
│  PHASE: BUILD ───────────────────────────────────────────────  │
│                                                                 │
│  ┌────────────────┐    ┌────────────────┐   ┌───────────────┐ │
│  │ Command Runtime│───▶│ Execution      │──▶│ Feedback /    │ │
│  │ [SUBSTANTIALLY │    │ Pipeline       │   │ Re-intake     │ │
│  │  DELIVERED]    │    │ [SUBSTANTIALLY │   │ [SUBSTANTIALLY│ │
│  │ dispatch +     │    │  DELIVERED]    │   │  DELIVERED]   │ │
│  │ async ticket   │    │ execution      │   │ observer,     │ │
│  │ surfaces       │    │ pipeline +     │   │ routing,      │ │
│  └────────────────┘    │ status + batch │   │ resolution,   │ │
│                        └────────┬───────┘   │ summary loops │ │
│                                 │           └──────┬────────┘ │
│    ┌────────────────────────────┼──────────────────┐│          │
│    ▼                            ▼                  ▼│          │
│  ┌──────────────┐        ┌──────────────┐   ┌────────────────┐│
│  │ Model Gateway│        │ MCP Bridge   │   │ Policy Gate    ││
│  │ [PARTIAL]    │        │ [SUBSTANTIALLY│   │ [SUBSTANTIALLY││
│  │              │        │  DELIVERED]  │   │  DELIVERED]   ││
│  │ provider/rte │        │ invocation + │   │ execution      ││
│  │ convergence  │        │ batch paths  │   │ authorization  ││
│  │ future-facing│        │ delivered    │   │ + feedback rtg ││
│  └──────────────┘        └──────────────┘   └────────────────┘│
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Sandbox Runtime (Worker Agents)                          │  │
│  │ [PARTIAL] worker execution remains governed, but full     │  │
│  │ target-state convergence is still not closed              │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│  PHASE: REVIEW ──── Audit ── │ ──────────────────────────────  │
│  PHASE: FREEZE ──── Seal ─── │ ──────────────────────────────  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                          Artifacts / Results
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│       🧠  LEARNING PLANE [SUBSTANTIALLY DELIVERED]              │
│                                                                 │
│  Artifacts / Results                                            │
│      │                                                          │
│      ▼                                                          │
│  FeedbackLedger → PatternInsight → TruthModel                   │
│                                                                 │
│  Storage / TruthScore / Evaluation Engine                       │
│  [SUBSTANTIALLY DELIVERED]                                      │
│                                                                 │
│  Observability [SUBSTANTIALLY DELIVERED]                        │
│                                                                 │
│  ThresholdAssessment [DONE]                                     │
│      → GovernanceSignal [SUBSTANTIALLY DELIVERED]               │
│      → Re-injection [DONE]                                      │
│      → Governance Layer                                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              👤  UX / NON-CODER LAYER [DONE ON ACTIVE PATH]     │
│  governed wizards, SDK, CLI, graph/UI surfaces remain usable    │
│  and are not the current architectural bottleneck               │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 Maturity Snapshot by Plane

> Read this table as: `baseline architecture shape = W15-T1`, `governed progress readout = refreshed through 2026-03-30`.

| Plane | Current posture | What is already true |
|---|---|---|
| Control Plane | `SUBSTANTIALLY DELIVERED` | AI Gateway, Boardroom/Reverse Prompting, typed context packaging, knowledge ranking/query, gateway auth, clarification refinement, gateway/log, intake, route-match, context build batch, knowledge query batch, retrieval consumer pipeline bridges — ALL canonically closed through `W2-T38` / `W1-T30`; W8-T1: `TrustIsolationBoundaryContract`, `ModelGatewayBoundaryContract` canonically closed; W9-T1: `RagContextEngineConvergenceContract` + batch contract canonically closed; W12-T1: `AgentDefinitionBoundaryContract` canonically closed; W13-T1: `AgentDefinitionCapabilityBatchContract` canonically closed; W14-T1: `AgentScopeResolutionBatchContract` canonically closed; W15-T1: `AgentDefinitionAuditBatchContract` canonically closed — CPF 2222 tests, 0 failures |
| Execution Plane | `SUBSTANTIALLY DELIVERED` | all EPF consumer pipeline bridges canonically closed through `W2-T29`; W6-T1 (streaming execution + aggregator), W6-T4/T5 (governance checkpoint/reintake) added post-baseline — EPF 1123 tests, 0 failures |
| Governance Layer | `SUBSTANTIALLY DELIVERED` | all GEF consumer pipeline bridges canonically closed through `W3-T18`; W6-T6 (pattern drift); W7 governance integration: SkillFormationRecord, StructuredSpec, 8 guards G1-G8, 32 presets — GEF 625 tests, 0 failures |
| Learning Plane | `SUBSTANTIALLY DELIVERED` | ALL 18 LPF base contracts fully bridged — consumer pipeline bridges canonically closed through `W4-T25`; W10-T1: `ReputationSignalContract`, `TaskMarketplaceContract` + 2 batch contracts canonically closed — LPF 1465 tests, 0 failures |
| W7 Governance Integration | `DONE` | 11 schemas across 4 planes, 32 guard presets, all P1-P8 gates satisfied, full dependency chain Runtime→Memory, 10 no-fake-learning invariants, 0 governance violations — W7-T10 CLOSED 2026-03-28 |
| Post-W7 Continuation (W8–W15) | `DONE` | W8-T1: TrustIsolation + ModelGateway boundary convergence; W8-T2: PerformanceBenchmarkHarness (acceptance-policy PROPOSAL ONLY); W9-T1: RAG + Context Engine convergence; W10-T1: ReputationSignal + TaskMarketplace Learning Expansion; W12-T1: Agent Definition boundary convergence; W13-T1: AgentDefinitionCapabilityBatch (CPF +26); W14-T1: AgentScopeResolutionBatch (CPF +26); W15-T1: AgentDefinitionAuditBatch (CPF +26) — W12-T1 agent definition family fully closed 2026-03-30; all post-W7 realization candidates CLOSED DELIVERED |
| Whitepaper Truth Reconciliation | `DONE` | W5-T1 evidence-backed partial delivery; W5-T2 updated to v3.0-W7T10 (W7 wave); W11-T1 updated to v3.1-W10T1 (post-W7 continuation through W10-T1); W12-T1 synchronized baseline refreshed to v3.2-W12T1; W16-T1 updated to v3.3-W15T1 (W13-T1/W14-T1/W15-T1 batch contracts; CPF 2222) |

### 4.1A Post-Baseline Continuation Delta

| Plane | Added closure beyond original whitepaper freeze |
|---|---|
| Control Plane | `W1-T23` to `W1-T30` added gateway auth log, gateway pii log, route match log, design, boardroom, AI gateway, intake, and route-match consumer pipeline continuations; `W2-T36` to `W2-T38` added context build batch, knowledge query batch, and retrieval consumer pipeline bridges — ALL CPF bridges canonically closed through `W2-T38` |
| Execution Plane | `W2-T25` to `W2-T29` added command runtime, dispatch, async runtime, and streaming execution consumer pipeline continuations; `W6-T1` added streaming execution contract + aggregator — ALL EPF bridges canonically closed |
| Governance Layer | `W6-T4` (governance checkpoint), `W6-T5` (checkpoint reintake), `W6-T6` (pattern drift) added post-baseline GEF contracts — ALL GEF bridges canonically closed through `W3-T18` + `W6-T6`; `W7-T0` to `W7-T10` added full governance integration wave: 11 schemas, 32 guard presets (G1-G8, P-01→P-15, B-01→B-05, M-01→M-04), 10 no-fake-learning invariants |
| Learning Plane | `W4-T12` to `W4-T13` added pattern drift and learning observability consumer pipeline continuations; `W4-T14` to `W4-T25` closed all 12 remaining LPF consumer pipeline bridges — ALL 18 LPF base contracts fully bridged through `W4-T25`; 1465 tests, 0 failures |
| W7 Governance Integration | `W7-T0` to `W7-T10` (2026-03-25 to 2026-03-28) closed the full W7 Integration Wave — SkillFormation (T4), StructuredSpec (T5), Runtime/Artifact/Trace/Planner/Decision/Eval/Builder/Memory schemas (T0-T3, T6-T9), Wave Closure (T10); all P1-P8 gates satisfied; dependency chain Runtime→Artifact→Trace→Planner→Decision→Eval/Builder→Memory fully closed |
| Post-W7 Continuation (W8–W15) | `W8-T1` (2026-03-29): `TrustIsolationBoundaryContract` + `ModelGatewayBoundaryContract` — CPF trust/model-gateway boundary convergence, +83 CPF tests; `W8-T2` (2026-03-29): `PerformanceBenchmarkHarnessContract` — benchmark harness + acceptance-policy baseline (PROPOSAL ONLY), +42 CPF tests; `W9-T1` (2026-03-29): `RagContextEngineConvergenceContract` + batch contract — RAG retrieval authority + deterministic packaging API canonical, +83 CPF tests; `W10-T1` (2026-03-29): `ReputationSignalContract` + `TaskMarketplaceContract` + 2 batch contracts — reputation/learning plane expansion, +132 LPF tests; `W12-T1` (2026-03-29): `AgentDefinitionBoundaryContract` — governed agent-definition authority boundary canonical, +36 CPF tests; `W13-T1` (2026-03-30): `AgentDefinitionCapabilityBatchContract` — batches `CapabilityValidationResult[]`, +26 CPF tests; `W14-T1` (2026-03-30): `AgentScopeResolutionBatchContract` — batches `AgentScopeResolution[]`, +26 CPF tests; `W15-T1` (2026-03-30): `AgentDefinitionAuditBatchContract` — batches `AgentDefinitionAudit[]`, aggregates `totalAgentsAcrossAudits`, +26 CPF tests; CPF suite 2222, LPF 1465, W12-T1 agent definition family fully closed; all post-W7 realization candidates CLOSED DELIVERED |

### 4.2 What This Diagram No Longer Claims

- It no longer claims that the entire architecture is only future-state.
- It no longer implies the Learning Plane is merely a final proposal; at baseline `W4-T11` it already had a governed closed chain from `FeedbackLedger` through `GovernanceSignalConsumerPipeline`, and the refreshed readout now extends that line through `LearningObservabilityConsumerPipeline`.
- It no longer treats Watchdog, Policy Gate, Evaluation Engine, Truth Score, or Pattern Detection as conceptual-only blocks.
- It no longer claims that trust/isolation consolidation is unclosed — `TrustIsolationBoundaryContract` and `ModelGatewayBoundaryContract` are canonically delivered as of W8-T1 (2026-03-29).
- It no longer claims that unified RAG is purely future-facing — `RagContextEngineConvergenceContract` with deterministic packaging API is canonically delivered as of W9-T1 (2026-03-29).
- It no longer claims that reputation signals and task marketplace learning are undelivered — `ReputationSignalContract` and `TaskMarketplaceContract` are canonically delivered as of W10-T1 (2026-03-29).
- It still does **not** claim a fully consolidated agent-definition registry or L0–L4 physical source-tree consolidation.

### 4.3 Baseline Freeze Before Next Development

| Baseline field | Value |
|---|---|
| Multi-agent repo/docs convergence | `GC-027` canonical review-doc chain |
| Highest-priority live multi-agent deliberation surface | `AI Boardroom` in Control Plane, governed by `GC-028`; see `docs/reference/CVF_BOARDROOM_DELIBERATION_PROTOCOL.md` |
| Snapshot date | `2026-03-30` |
| Canonical architecture snapshot | this document (`CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`, `v3.3-W15T1`) |
| Last canonical closure | `W15-T1 CLOSED DELIVERED — Agent Definition Audit Batch Contract; W12-T1 agent definition family complete` |
| Current active tranche | `NONE` |
| Current posture | `SUBSTANTIALLY DELIVERED` — all four planes `SUBSTANTIALLY DELIVERED`; W7 Governance Integration `DONE`; post-W7 continuation `DONE` (W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1); continuation readout `W1-T30 / W2-T38 / W3-T18 / W4-T25 / W6-T6 / W7-T10 / W8-T1 / W8-T2 / W9-T1 / W10-T1 / W12-T1 / W13-T1 / W14-T1 / W15-T1` |
| Required gate before any new implementation | fresh `GC-018` authorization |
| Supporting status docs | `CVF_WHITEPAPER_PROGRESS_TRACKER.md`, `CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md`, `CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`, `AGENT_HANDOFF.md` |

### 4.4 Two Multi-Agent Scope Boundaries

CVF now distinguishes two different multi-agent scopes on purpose:

- `GC-027` covers canonical repository documentation for intake review, rebuttal, and decision-pack convergence before roadmap intake or implementation selection.
- `GC-028` covers live `AI Boardroom` deliberation during `INTAKE -> DESIGN`, where the system must choose the best governed path before downstream orchestration continues.

These two scopes are related, but not interchangeable.

The Boardroom scope is the more critical runtime decision surface because it sits above downstream design/orchestration and therefore shapes what the system is allowed to build next.

---

## 5. Bảng Hợp nhất Module (Merge Map — Target-State / Delivered Anchors)

> ⚠️ Bảng này hiện chứa cả:
> - các anchor đã được delivered trong current-cycle và whitepaper-completion cycle
> - các merge/upgrade target vẫn future-facing và chỉ được mở lại qua GC-018

| Module CVF hiện có | Đề xuất mới | Hành động | Vị trí đề xuất | Posture hiện tại |
|---|---|---|---|---|
| `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` | ADDING_AGENT DEFINITION | **MERGE** | Governance: Agent Def | `SUBSTANTIALLY DELIVERED` — `AgentDefinitionBoundaryContract` canonically closed W12-T1 2026-03-29; agent definition registration, capability scope validation, scope resolution, and governance audit delivered; W13-T1: `AgentDefinitionCapabilityBatchContract` canonically closed 2026-03-30; W14-T1: `AgentScopeResolutionBatchContract` canonically closed 2026-03-30; W15-T1: `AgentDefinitionAuditBatchContract` canonically closed 2026-03-30; W12-T1 agent definition family fully closed |
| `CVF_ECO_v1.4_RAG_PIPELINE` | ADDING_RAG ARCHITECTURE | **UPGRADE** | Control: Knowledge Layer | `SUBSTANTIALLY DELIVERED` — `RagContextEngineConvergenceContract` + batch contract canonically closed W9-T1 2026-03-29; RAG retrieval authority + deterministic packaging API canonical |
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | ADDING_CONTEXT ENGINE | **MERGE** | Control: Context Packager | `SUBSTANTIALLY DELIVERED` — deterministic context packaging API canonically closed via W9-T1; `pack() -> packageHash -> packageId` declared canonical with frozen seeds |
| `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` | ADDING_AI CONSTITUTIONAL | **MERGE** | Governance: Policy Engine | `DONE / INVARIANT` ở lớp policy baseline hiện hành |
| `CVF_ECO_v2.0_AGENT_GUARD_SDK` + `CVF_v1.7.1_SAFETY_RUNTIME` | ADDING_TRUST & ISOLATION | **MERGE** | Governance: Trust Layer | `SUBSTANTIALLY DELIVERED` — `TrustIsolationBoundaryContract` canonically closed W8-T1 2026-03-29; trust isolation boundary convergence delivered |
| `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | ADDING_MODEL GATEWAY (gộp R7+R8+R9) | **MERGE** | Execution: Model Gateway | `SUBSTANTIALLY DELIVERED` — `ModelGatewayBoundaryContract` canonically closed W8-T1 2026-03-29; model gateway boundary convergence delivered |
| `CVF_ECO_v2.5_MCP_SERVER` | ADDING_SYSTEM REALITY | **MERGE** | Execution: MCP Bridge | `SUBSTANTIALLY DELIVERED` — MCP invocation + batch bridges đã canonically closed |
| `CVF_ECO_v3.1_REPUTATION` + `CVF_ECO_v3.0_TASK_MARKETPLACE` | ADDING_LEARNING PLANE | **MERGE** | Learning: Reputation+Ledger | `SUBSTANTIALLY DELIVERED` — `ReputationSignalContract` + `TaskMarketplaceContract` + 2 batch contracts canonically closed W10-T1 2026-03-29; LPF 1465 tests, 0 failures |
| `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | Learning Observability | **MERGE** | Learning: Observability | `SUBSTANTIALLY DELIVERED` — observability slice và consumer pipelines đã canonically closed |
| `CVF_GUARD_CONTRACT` | — | **GIỮ NGUYÊN** | Governance: Guard Engine | `DONE / INVARIANT` |

---

## 6. Performance Targets (PROPOSAL ONLY — Chưa benchmark, không phải baseline hiện hành)

| Đường đi | Guard Pipeline | Target Latency |
|----------|----------------|----------------|
| R0/R1 — Fast Path | Shared 8 guards, bypass Audit | **< 50ms** |
| R2 — Standard Path | 8 guards + Orchestrator Approval | **< 200ms** |
| R3 — Full Path | 8+ guards + Audit Council + Human Gate | **< 500ms** (excl. human wait) |

> **W8-T2 Acceptance-Policy Baseline:** `PerformanceBenchmarkHarnessContract` is canonically delivered (W8-T2, 2026-03-29). The benchmark harness and acceptance-policy threshold document (`docs/reference/CVF_PERFORMANCE_ACCEPTANCE_POLICY_BASELINE_2026-03-29.md`) are committed as **PROPOSAL ONLY** — thresholds above are targets, not measured baselines. All reports generated by the harness carry `evidenceClass: "PROPOSAL_ONLY"` and cannot be promoted to governance truth without an authorized benchmarking wave.

---

## 7. Architectural Truth Layers

> [!IMPORTANT]
> Ba nhóm dưới đây **KHÔNG ĐƯỢC trộn lẫn**. Mỗi nhóm có bản chất khác nhau: sự thật hiện tại, kỷ luật chuyển đổi, và ý định thiết kế tương lai.

### 7.1 Current Frozen Invariants
> Những điều **đã đúng** trong codebase và governance hiện tại. Vi phạm = vi phạm kiến trúc hiện hành.

1. **Canonical 5-Phase Loop**
   - `INTAKE → DESIGN → BUILD → REVIEW → FREEZE`
   - Source: `CVF_GUARD_CONTRACT/src/types.ts:19-28`

2. **Current Risk Model**
   - `R0 → R3`
   - Source: `CVF_GUARD_CONTRACT/src/types.ts:31`

3. **Current Guard Baseline**
   - Shared hardened default: **8 guards** (`index.ts:47-59`)
   - Full runtime preset: **15 guards** (`cvf.sdk.ts:819-839`)

4. **Continuation Governance**
   - Mọi mở rộng hoặc tái cấu trúc cần GC-018 Continuation authorization
   - Source: `docs/reference/CVF_WHITEPAPER_PROGRESS_TRACKER.md` + `docs/reviews/CVF_W2_T29_TRANCHE_CLOSURE_REVIEW_2026-03-27.md`

5. **Marginal-Value Stop Boundary**
   - validation/test-only breadth, packaging-only continuation, và truth-label/claim expansion không được tiếp tục theo quán tính
   - khi confidence đã mạnh hoặc posture đã đủ rõ, burden of proof chuyển sang `DEFER` và ưu tiên nên dịch ngang sang gap kiến trúc/capability lớn hơn
   - Source: `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`

---

### 7.2 Migration Guardrails
> Quy tắc cho **quá trình chuyển đổi an toàn**. Áp dụng khi có Restructuring Wave được phê duyệt.

1. **Merge before create**
   - Ưu tiên hợp nhất module trùng lặp thay vì tạo module mới đè lên

2. **Backward compatibility first**
   - Duy trì tương thích ngược cho critical paths trong quá trình chuyển đổi

3. **Rollback is mandatory**
   - Mỗi phase tái cấu trúc phải định nghĩa rollback path rõ ràng

4. **Learning plane is last**
   - Adaptive behavior chỉ được giới thiệu sau khi các tầng dưới ổn định

5. **Risk-model migration is a separate decision**
   - Không migrate từ `R0-R3` sang taxonomy khác mà không có GC-018 approval riêng

6. **Boundary strengthening before physical consolidation**
   - Contracts, interfaces, ownership phải ổn định trước khi dồn source tree

---

### 7.3 Target-State Design Principles
> Nguyên tắc thiết kế **dài hạn** cho nền tảng hội tụ. **Chưa phải sự thật runtime hiện tại.**

1. **Control Plane does not execute**
   - Chỉ sinh plans, policies, và authorizations

2. **Execution Plane does not decide policy**
   - Chỉ thực thi trong ranh giới đã được phê duyệt

3. **Agents do not own secrets or durable context**
   - Đây là tài sản do hệ thống quản trị

4. **Agents do not call AI providers directly**
   - Provider access qua governed Model Gateway

5. **Agents do not access knowledge stores directly**
   - Knowledge access qua governed knowledge interfaces

6. **New architecture should converge through stronger boundaries**
   - Hệ thống phải trở nên explicit hơn, governable hơn, dễ audit hơn
