# 🏛️ CVF Master Architecture Whitepaper
Memory class: POINTER_RECORD

> **Version:** 2.1-RECONCILED
> **Date:** 2026-03-23
> **Document Type:** PARTIALLY DELIVERED ARCHITECTURE WHITEPAPER — evidence-backed truth reconciliation complete as of 2026-03-22
> **Authorization Status:** First whitepaper-completion cycle through `W5-T1` is canonically closed. Any further continuation requires a new `GC-018` wave decision.
> **Clean Baseline References:**
> - `EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts` (phases, risk model)
> - `EXTENSIONS/CVF_GUARD_CONTRACT/src/index.ts` (shared default guard stack)
> - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/guard_runtime/sdk/cvf.sdk.ts` (full runtime preset)
> - `docs/reviews/CVF_WHITEPAPER_COMPLETION_STATUS_2026-03-21.md` (current evidence-backed status)
> - `docs/roadmaps/CVF_WHITEPAPER_COMPLETION_ROADMAP_2026-03-21.md` (canonical delivered wave line)

> **Status Note:** this document now contains a reconciled mix of:
> - delivered current truth already evidenced in code and tranche packets
> - partially delivered target-state areas
> - future-facing design principles that still require later governed waves

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

## 4. Sơ đồ Kiến trúc Đề xuất (TARGET-STATE / PARTIALLY DELIVERED)

> [!WARNING]
> Sơ đồ bên dưới là kiến trúc mục tiêu đã được hiện thực hóa một phần. Không phải mọi khối trong sơ đồ đều đã fully delivered ở runtime hiện tại; continuation lớn hơn vẫn cần GC-018.

```
                         USER / External Signal
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│               🛡️  CONTROL PLANE (Đề xuất)                      │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ AI Gateway   │───▶│ Knowledge    │───▶│ Context Builder  │  │
│  │ (Env Signals)│    │ Layer        │    │ & Packager       │  │
│  │ + Privacy    │    │ (Unified:    │    │ (Token Bounding, │  │
│  │   Filter     │    │  RAG+Memory  │    │  Deterministic)  │  │
│  │              │    │  +Graph)     │    │  [Nâng cấp v1.9] │  │
│  └──────────────┘    │ [Nâng cấp   │    └────────┬─────────┘  │
│                      │  v1.4 RAG]  │             │            │
│                      └──────────────┘             │            │
│                                                   ▼            │
│  PHASE: INTAKE ──────────────────────────────────────────────  │
│                                                                 │
│                      ┌───────────────────────────────────┐     │
│                      │ AI Boardroom / Reverse Prompting   │     │
│                      │ [Nâng cấp Canvas v2.1+Intent v1.0] │     │
│                      └───────────────┬───────────────────┘     │
│                                      ▼                         │
│  PHASE: DESIGN ──────────────────────────────────────────────  │
│                                                                 │
│                      ┌───────────────────────────────────┐     │
│                      │ CEO Orchestrator Agent             │     │
│                      │ [Nâng cấp Controlled Intel. v1.7]  │     │
│                      └───────────────┬───────────────────┘     │
│                                      ▼                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           ⚖️  GOVERNANCE LAYER                            │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐   │ │
│  │  │ Policy      │  │ Trust &        │  │ Audit /      │   │ │
│  │  │ Engine      │  │ Isolation      │  │ Consensus    │   │ │
│  │  │ (R0-R3      │  │ Layer          │  │ Engine       │   │ │
│  │  │  current)   │  │ [Nâng cấp     │  │ (Multi-LLM,  │   │ │
│  │  │ [Nâng cấp   │  │  Safety v1.7.1 │  │  R2+ only)   │   │ │
│  │  │  Gov v1.6.1] │  │  +Guard SDK]  │  │              │   │ │
│  │  └─────────────┘  └────────────────┘  └──────────────┘   │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌────────────────┐  ┌──────────────┐   │ │
│  │  │ CVF         │  │ Guard Engine   │  │ Agent Def &  │   │ │
│  │  │ Watchdog    │  │ Shared: 8      │  │ Capability   │   │ │
│  │  │             │  │ Runtime: 15    │  │ Registry     │   │ │
│  │  │             │  │ [GUARD_CONTRACT│  │ [Nâng cấp    │   │ │
│  │  │             │  │  giữ nguyên]   │  │  Identity    │   │ │
│  │  │             │  │               │  │  v2.3+Cap    │   │ │
│  │  │             │  │               │  │  Ext v1.2]   │   │ │
│  │  └─────────────┘  └────────────────┘  └──────────────┘   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Execution Authorization (Scope-Bounded Command)               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               ⚡  EXECUTION PLANE (Đề xuất)                     │
│                                                                 │
│  PHASE: BUILD ───────────────────────────────────────────────  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Command Runtime  [MỚI — từ System Reality Layer]         │  │
│  │ (Action → JSON Command → Queue → Dispatch)               │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│    ┌─────────────────────┼──────────────────────┐              │
│    ▼                     ▼                      ▼              │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │ Process  │  │ CVF Model        │  │ MCP Tool         │     │
│  │ Manager  │  │ Gateway (HỢP     │  │ Bridge           │     │
│  │ [MỚI]    │  │ NHẤT R7+R8+R9)   │  │ [Nâng cấp MCP   │     │
│  │          │  │ ┌──────────────┐ │  │  Server v2.5]    │     │
│  │          │  │ │Routing Layer │ │  └──────────────────┘     │
│  │          │  │ │(R0→CHEAP,    │ │                            │
│  │          │  │ │ R3→REASONING)│ │                            │
│  │          │  │ ├──────────────┤ │                            │
│  │          │  │ │Strategy Layer│ │                            │
│  │          │  │ ├──────────────┤ │                            │
│  │          │  │ │Adapter Layer │ │                            │
│  │          │  │ │[Nâng cấp Ext│ │                            │
│  │          │  │ │ v1.2.1+Hub  │ │                            │
│  │          │  │ │ v1.7.3]     │ │                            │
│  │          │  │ ├──────────────┤ │                            │
│  │          │  │ │Telemetry    │ │                            │
│  │          │  │ └──────────────┘ │                            │
│  └──────────┘  └──────────────────┘                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Sandbox Runtime (Worker Agents)                          │  │
│  │ [Nâng cấp Agent Platform v1.6 + Safety Runtime v1.7.1]   │  │
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
│          🧠  LEARNING PLANE (Đề xuất — Triển khai cuối cùng)    │
│                                                                 │
│  Artifacts ──▶ Truth Model ──▶ Evaluation Engine                │
│                        │                                        │
│               Immutable Ledger [Nâng cấp Task Mkt v3.0]        │
│                        │                                        │
│               Reputation Model [Nâng cấp Reputation v3.1]      │
│                        │                                        │
│               ◄── Feedback → Governance Layer                   │
│                                                                 │
│  Observability [Nâng cấp Adaptive Observability v1.8.1]         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│          👤  UX / NON-CODER LAYER (Giữ nguyên — Không ảnh hưởng)│
│  9 Governed Wizards, SDK, CLI, Graph UI                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Bảng Hợp nhất Module (Merge Map — Target-State / Delivered Anchors)

> ⚠️ Bảng này hiện chứa cả:
> - các anchor đã được delivered trong current-cycle và whitepaper-completion cycle
> - các merge/upgrade target vẫn future-facing và chỉ được mở lại qua GC-018

| Module CVF hiện có | Đề xuất mới | Hành động | Vị trí đề xuất |
|---|---|---|---|
| `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` | ADDING_AGENT DEFINITION | **MERGE** | Governance: Agent Def |
| `CVF_ECO_v1.4_RAG_PIPELINE` | ADDING_RAG ARCHITECTURE | **UPGRADE** | Control: Knowledge Layer |
| `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | ADDING_CONTEXT ENGINE | **MERGE** | Control: Context Packager |
| `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` | ADDING_AI CONSTITUTIONAL | **MERGE** | Governance: Policy Engine |
| `CVF_ECO_v2.0_AGENT_GUARD_SDK` + `CVF_v1.7.1_SAFETY_RUNTIME` | ADDING_TRUST & ISOLATION | **MERGE** | Governance: Trust Layer |
| `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | ADDING_MODEL GATEWAY (gộp R7+R8+R9) | **MERGE** | Execution: Model Gateway |
| `CVF_ECO_v2.5_MCP_SERVER` | ADDING_SYSTEM REALITY | **MERGE** | Execution: MCP Bridge |
| `CVF_ECO_v3.1_REPUTATION` + `CVF_ECO_v3.0_TASK_MARKETPLACE` | ADDING_LEARNING PLANE | **MERGE** | Learning: Reputation+Ledger |
| `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | Learning Observability | **MERGE** | Learning: Observability |
| `CVF_GUARD_CONTRACT` | — | **GIỮ NGUYÊN** | Governance: Guard Engine |

---

## 6. Performance Constraints (Đề xuất — Chưa benchmark)

| Đường đi | Guard Pipeline | Target Latency |
|----------|----------------|----------------|
| R0/R1 — Fast Path | Shared 8 guards, bypass Audit | **< 50ms** |
| R2 — Standard Path | 8 guards + Orchestrator Approval | **< 200ms** |
| R3 — Full Path | 8+ guards + Audit Council + Human Gate | **< 500ms** (excl. human wait) |

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
   - Source: `CVF_GC018_CONTINUATION_CANDIDATE_N1_2026-03-20.md`

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
