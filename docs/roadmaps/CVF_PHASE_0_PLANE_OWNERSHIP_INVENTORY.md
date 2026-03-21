# CVF Phase 0 — Plane Ownership Inventory
> **Date:** 2026-03-21
> **Roadmap Ref:** `docs/roadmaps/CVF_RESTRUCTURING_ROADMAP_2026-03-21.md` — Phase 0
> **Status:** DELIVERABLE — Pending User Sign-off
> **Baseline Re-verified:** Risk Model = `R0-R3` ✅ | Guard Shared Default = `8` ✅ | Guard Full Runtime = `15` ✅

---

## Deliverable 1: Plane Ownership Matrix

> Mỗi module được gán: **Primary Plane**, **Lifecycle Label** (KEEP / MERGE / DEPRECATE / FACADE), và **Criticality** (Active-Path / Ecosystem-Breadth).

### 🛡️ GOVERNANCE Plane

| # | Module | Lifecycle | Criticality | Merge Target | Notes |
|---|--------|-----------|-------------|-------------|-------|
| 1 | `CVF_GUARD_CONTRACT` | **KEEP** | 🔴 Active-Path | — | Source of truth: 8 guards shared, 15 full. KHÔNG ĐƯỢC SỬA. |
| 2 | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` | **KEEP** | 🔴 Active-Path | — | Pipeline Orchestrator + 5-Phase enforcement + SDK (cvf.sdk.ts) |
| 3 | `CVF_v1.6.1_GOVERNANCE_ENGINE` | **MERGE** | 🟡 Active-Path | → MERGE với `CVF_ECO_v1.1_NL_POLICY` → **Policy Engine** | Policy logic cần hợp nhất |
| 4 | `CVF_ECO_v1.1_NL_POLICY` | **MERGE** | 🟡 Ecosystem | → MERGE vào Governance Engine → **Policy Engine** | Natural Language Policy input |
| 5 | `CVF_ECO_v1.0_INTENT_VALIDATION` | **KEEP** | 🟡 Ecosystem | — | Reverse Prompting cho INTAKE phase |
| 6 | `CVF_ECO_v1.2_LLM_RISK_ENGINE` | **KEEP** | 🟡 Ecosystem | — | Risk scorer (hiện tại R0-R3). Nâng cấp khi/nếu migrate L0-L4 |
| 7 | `CVF_ECO_v1.3_DOMAIN_GUARDS` | **KEEP** | 🟢 Ecosystem | — | Domain-specific guards — extends GUARD_CONTRACT |
| 8 | `CVF_ECO_v2.3_AGENT_IDENTITY` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_v1.2_CAPABILITY_EXTENSION` → **Agent Definition** | Identity + Capability = Agent Profile |
| 9 | `CVF_v1.2_CAPABILITY_EXTENSION` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_ECO_v2.3_AGENT_IDENTITY` → **Agent Definition** | Capability Registry |
| 10 | `CVF_v1.7_CONTROLLED_INTELLIGENCE` | **KEEP** | 🟡 Ecosystem | — | CEO Orchestrator reasoning logic |

### ⚡ EXECUTION Plane

| # | Module | Lifecycle | Criticality | Merge Target | Notes |
|---|--------|-----------|-------------|-------------|-------|
| 11 | `CVF_v1.6_AGENT_PLATFORM` | **KEEP** | 🔴 Active-Path | — | Web runtime (Next.js). Consumes GUARD_CONTRACT singleton. |
| 12 | `CVF_v1.2.1_EXTERNAL_INTEGRATION` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` → **Model Gateway Adapters** | External provider adapters |
| 13 | `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_v1.2.1_EXTERNAL_INTEGRATION` → **Model Gateway Adapters** | Multi-provider connector |
| 14 | `CVF_ECO_v2.5_MCP_SERVER` | **KEEP** | 🟡 Ecosystem | — | MCP Tool Bridge (nâng cấp, không merge) |
| 15 | `CVF_v1.3_IMPLEMENTATION_TOOLKIT` | **KEEP** | 🟢 Ecosystem | — | Execution utilities |
| 16 | `CVF_v1.3.1_OPERATOR_EDITION` | **KEEP** | 🟢 Ecosystem | — | Operator runtime variant |
| 17 | `CVF_v1.7.1_SAFETY_RUNTIME` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_ECO_v2.0_AGENT_GUARD_SDK` → **Trust & Sandbox** | Safety sandbox runtime |
| 18 | `CVF_ECO_v2.0_AGENT_GUARD_SDK` | **MERGE** | 🟡 Ecosystem | → MERGE với `CVF_v1.7.1_SAFETY_RUNTIME` → **Trust & Sandbox** | Guard SDK for developers |
| 19 | `CVF_v3.0_CORE_GIT_FOR_AI` | **KEEP** | 🟢 Ecosystem | — | Version control / artifact store |

### 🧭 CONTROL Plane

| # | Module | Lifecycle | Criticality | Merge Target | Notes |
|---|--------|-----------|-------------|-------------|-------|
| 20 | `CVF_ECO_v2.1_GOVERNANCE_CANVAS` | **KEEP** | 🟢 Ecosystem | — | AI Boardroom / Visual Strategy |
| 21 | `CVF_ECO_v1.4_RAG_PIPELINE` | **KEEP** | 🟡 Ecosystem | — | Knowledge Layer (nâng cấp, không merge) |
| 22 | `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` | **KEEP** | 🟡 Ecosystem | — | Context Packager + Snapshot (nâng cấp) |
| 23 | `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` | **KEEP** | 🟢 Ecosystem | — | Skill = Context input cho Agent |

### 🧠 LEARNING Plane

| # | Module | Lifecycle | Criticality | Merge Target | Notes |
|---|--------|-----------|-------------|-------------|-------|
| 24 | `CVF_ECO_v3.0_TASK_MARKETPLACE` | **MERGE** | 🟢 Ecosystem | → MERGE với `CVF_ECO_v3.1_REPUTATION` → **Agent Ledger + Reputation** | Task history |
| 25 | `CVF_ECO_v3.1_REPUTATION` | **MERGE** | 🟢 Ecosystem | → MERGE với `CVF_ECO_v3.0_TASK_MARKETPLACE` → **Agent Ledger + Reputation** | Reputation scoring |
| 26 | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | **KEEP** | 🟡 Ecosystem | — | Observability + Telemetry (nâng cấp) |
| 27 | `CVF_v1.8_SAFETY_HARDENING` | **KEEP** | 🟢 Ecosystem | — | Safety Evaluation Engine |

### 👤 UX / NON-CODER Layer (Không ảnh hưởng bởi Restructuring)

| # | Module | Lifecycle | Criticality | Notes |
|---|--------|-----------|-------------|-------|
| 28 | `CVF_v1.4_USAGE_LAYER` | **KEEP** | 🟢 | Usage documentation |
| 29 | `CVF_v1.5_UX_PLATFORM` | **KEEP** | 🟢 | Web UI platform |
| 30 | `CVF_v1.5.1_END_USER_ORIENTATION` | **KEEP** | 🟢 | Onboarding |
| 31 | `CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS` | **KEEP** | 🟢 | Skill library UI |
| 32 | `CVF_v2.0_NONCODER_SAFETY_RUNTIME` | **KEEP** | 🟡 | 9 Governed Wizards |
| 33 | `CVF_ECO_v2.2_GOVERNANCE_CLI` | **KEEP** | 🟢 | CLI tool |
| 34 | `CVF_ECO_v2.4_GRAPH_GOVERNANCE` | **KEEP** | 🟢 | Graph visualization |
| 35 | `CVF_v1.7.2_SAFETY_DASHBOARD` | **KEEP** | 🟢 | Safety dashboard UI |

### 📦 REFERENCE / TEMPLATES (Không phải runtime module)

| # | Module | Lifecycle | Notes |
|---|--------|-----------|-------|
| 36 | `CVF_STARTER_TEMPLATE_REFERENCE` | **KEEP** | Template for new projects |
| 37 | `CVF_TOOLKIT_REFERENCE` | **KEEP** | Toolkit reference docs |
| 38 | `examples` | **KEEP** | Example implementations |
| 39 | `ARCHITECTURE_SEPARATION_DIAGRAM.md` | **DEPRECATE** | Thay thế bởi Whitepaper diagram |

---

## Deliverable 2: Dependency Map (Cross-Plane Dependencies)

```
                    ┌────────────────────────────────┐
                    │      GOVERNANCE PLANE           │
                    │  CVF_GUARD_CONTRACT ◄───────────┤──── Source of Truth
                    │  (8 shared / 15 full)           │
                    │           │                     │
                    │           ▼                     │
                    │  CVF_v1.1.1_PHASE_GOV_PROTOCOL  │
                    │  (Pipeline Orchestrator + SDK)   │
                    └────────────┬───────────────────┘
                                 │ imports from
                                 ▼
                    ┌────────────────────────────────┐
                    │      EXECUTION PLANE            │
                    │  CVF_v1.6_AGENT_PLATFORM        │
                    │  (Web Runtime — Next.js)         │
                    │  - guard-engine-singleton.ts     │
                    │  - guard-runtime-adapter.ts      │
                    │           │                     │
                    │           ▼                     │
                    │  execute/route.ts → guardEngine  │
                    │  evaluate/route.ts → guardEngine │
                    │  audit-log/route.ts → guardEngine│
                    └────────────────────────────────┘
```

### Cross-Plane Dependencies Identified

| From (Consumer) | To (Provider) | Interface | Coupling Level |
|---------|------|-----------|---------------|
| `CVF_v1.6_AGENT_PLATFORM` | `CVF_GUARD_CONTRACT` | `createGuardEngine()`, shared types | **Strong** — direct import |
| `CVF_v1.1.1_PHASE_GOV_PROTOCOL` | `CVF_GUARD_CONTRACT` | `GuardRuntimeEngine`, types | **Strong** — direct import |
| `CVF_v1.6_AGENT_PLATFORM` | `CVF_v1.1.1_PHASE_GOV_PROTOCOL` | SDK functions | **Medium** — via SDK |
| `CVF_ECO_v1.3_DOMAIN_GUARDS` | `CVF_GUARD_CONTRACT` | Guard interface | **Medium** — extends contract |
| `CVF_ECO_v2.0_AGENT_GUARD_SDK` | `CVF_GUARD_CONTRACT` | Guard interface | **Medium** — SDK wrapper |

---

## Deliverable 3: Overlap Register

| Overlap Group | Modules Involved | Resolution | Owner |
|---------------|-----------------|------------|-------|
| **Gateway / Router / Strategy** | `CVF_v1.2.1_EXTERNAL_INTEGRATION` + `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` | **MERGE** → Model Gateway Adapters | Execution Plane |
| **Audit / Consensus** | (From ADDING proposals: R3 + R5) | **MERGE** → Audit/Consensus Engine | Governance Plane |
| **Identity / Capability** | `CVF_ECO_v2.3_AGENT_IDENTITY` + `CVF_v1.2_CAPABILITY_EXTENSION` | **MERGE** → Agent Definition | Governance Plane |
| **Safety / Trust** | `CVF_v1.7.1_SAFETY_RUNTIME` + `CVF_ECO_v2.0_AGENT_GUARD_SDK` | **MERGE** → Trust & Sandbox | Execution Plane |
| **Governance / Policy** | `CVF_v1.6.1_GOVERNANCE_ENGINE` + `CVF_ECO_v1.1_NL_POLICY` | **MERGE** → Policy Engine | Governance Plane |
| **Task / Reputation** | `CVF_ECO_v3.0_TASK_MARKETPLACE` + `CVF_ECO_v3.1_REPUTATION` | **MERGE** → Agent Ledger + Reputation | Learning Plane |

---

## Deliverable 4: Active-Path Criticality Register

| Criticality | Count | Modules |
|-------------|-------|---------|
| 🔴 **Active-Path Critical** | **3** | `CVF_GUARD_CONTRACT`, `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`, `CVF_v1.6_AGENT_PLATFORM` |
| 🟡 **Active-Path Important** | **12** | Governance Engine, NL Policy, Risk Engine, Intent Validation, Agent Identity, Capability Ext, Controlled Intelligence, Safety Runtime, Guard SDK, RAG Pipeline, Deterministic Repro, Adaptive Observability |
| 🟢 **Ecosystem Breadth** | **24** | All remaining modules (UX, Templates, CLI, Dashboard, etc.) |

---

## Baseline Re-verification ✅

| Baseline Fact | Verified Value | Source |
|---------------|---------------|--------|
| **Canonical Phases** | `INTAKE → DESIGN → BUILD → REVIEW → FREEZE` | `types.ts:19-28` ✅ |
| **Risk Model** | `R0 → R3` | `types.ts:31` ✅ |
| **Guard Shared Default** | **8 guards** | `index.ts:47-59` ✅ |
| **Guard Full Runtime Preset** | **15 guards** | `cvf.sdk.ts:819-839` ✅ |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Modules Classified | **39** (38 dirs + 1 file) |
| KEEP | **24** |
| MERGE (into 6 target groups) | **12** (6 pairs) |
| DEPRECATE | **1** (`ARCHITECTURE_SEPARATION_DIAGRAM.md`) |
| FACADE | **0** (deferred to Phase 2) |
| Unclassified | **0** ✅ |
| Active-Path Critical | **3** |
| Overlap Groups | **6** |
| Baseline Re-verified | **Yes** ✅ |
