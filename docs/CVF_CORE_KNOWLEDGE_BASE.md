# 🗺️ CVF CORE KNOWLEDGE BASE — Architectural Map

> **Developed by Tien - Tan Thuan Port@2026**

> **Loại tài liệu:** Governance Reference (Permanent)
> **Mục đích:** Bản đồ kiến trúc toàn diện của CVF gốc.
> Dùng để **định vị nhanh** bất kỳ extension/version/layer mới vào đúng chỗ trong cấu trúc,
> kiểm tra overlap và backward compatibility — **không cần đọc lại codebase CVF mỗi lần**.
>
> **Phiên bản hiện tại:** v4.0.0 Runtime | **Cập nhật:** 2026-04-21
> **Nguồn xác minh:** GitHub repo + README.md + ARCHITECTURE.md + live evidence packet + provider lane receipts

> **Current evidence posture:** CVF has live non-coder governance proof and two certified provider lanes: Alibaba `qwen-turbo` and DeepSeek `deepseek-chat`. Release-quality governance claims require `python scripts/run_cvf_release_gate_bundle.py --json`; mock mode is UI-only.

---

## I. ĐỊNH DANH & ĐỊNH VỊ CVF

```
CVF = Governance Framework (Rules + Process + Tools)
    ≠ AI model / AI tool / Code library / Software product
```

| Thuộc tính | Giá trị |
|---|---|
| **Tên chính thức** | Controlled Vibe Framework (CVF) |
| **Phiên bản hiện tại** | **v4.0.0 Runtime** (Apr 2026) |
| **Slogan** | "Controlled vibe coding — not faster, but smarter." |
| **Định vị** | Governance Framework for AI-assisted development |
| **Agent-agnostic** | ✅ Works with Claude, GPT, Gemini, Copilot, local LLMs |
| **Mục tiêu** | Human controls quality; AI executes under governance |
| **License** | CC BY-NC-ND 4.0 |

### CVF IS / IS NOT
| CVF IS | CVF IS NOT |
|--------|-----------|
| Governance framework | AI model / AI tool |
| Process + standards | Code library / SDK |
| Human + AI collaboration | Pure AI automation |
| Rules, specs, checklists | App / Software product |
| Agent-agnostic | Tied to specific AI |

### Product Value Doctrine — Governed Provider Hub

Khi đánh giá giá trị sản phẩm hiện tại của CVF, mặc định hiểu như sau:

- CVF **không** được định nghĩa như wrapper cho một provider duy nhất
- `cvf-web` và master architecture đi theo hướng **provider-agnostic governed hub**
- user/operator có thể bật provider keys khác nhau; CVF giữ phần routing, policy, trace, evidence trong cùng một governed path

**Run lane** là đơn vị chuẩn để chứng minh giá trị:

- `run lane = provider + model` configuration đã được CVF admit vào governed flow
- đổi API key / provider / model hợp lệ sẽ sinh ra lane mới trong validation matrix
- muốn chứng minh CVF là model-agnostic hub, phải có evidence trên nhiều lanes
- muốn chứng minh giá trị do governance của CVF, phải so direct vs governed trong cùng một lane
- hiện tại Alibaba `qwen-turbo` và DeepSeek `deepseek-chat` là hai certified lanes; provider parity không được claim
- mọi bằng chứng governance phải chạy live API; mock chỉ hợp lệ cho UI structure

---

## II. KIẾN TRÚC 5 LAYERS (CHÍNH THỨC)

Đây là bản đồ kiến trúc authoritative. **Mọi extension/version mới phải xác định rõ nằm ở layer nào.**

```
┌─────────────────────────────────────────────────────────────┐
│  🔌 LAYER 5 — ADAPTER HUB                                   │
│     v1.7.3 — Runtime Adapter Hub                            │
│     5 contract interfaces: LLM / Runtime / Tool /           │
│                             Memory / Policy                  │
│     4 runtime adapters: OpenClaw / PicoClaw /               │
│                          ZeroClaw / Nano                     │
│     Kết nối Safety Dashboard với runtime execution          │
│     + Edge Security (PII/Secret masking, injection precheck) │
├─────────────────────────────────────────────────────────────┤
│  🛡️ LAYER 4 — SAFETY UI (Non-Coder Interface)               │
│     v1.7.2 — Safety Dashboard (Read-only risk view)         │
│     ● Risk: 🟢Safe 🟡Attention 🟠Review 🔴Dangerous        │
│     ● Health Dashboard + Trace Viewer + Risk Chart          │
│     ● Policy Selector + Creative Mode + Domain Map          │
│     ● Policy Simulation (what-if scenarios)                 │
│     v2.0 — Non-Coder Safety Runtime (Implemented ✅)       │
│     ● ModeMapper: SAFE/BALANCED/CREATIVE → KernelPolicy    │
│     ● IntentInterpreter: NL → ParsedIntent (pattern-based) │
│     ● ConfirmationEngine: per-mode + R3+ hard stop         │
│     ● Stability Index override: <70→SAFE, <50→no CREATIVE  │
│     ● 3 modules | 32 tests | 100% pass                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 LAYER 3 — PLATFORM (Web UI + Agent Platform)            │
│     v1.6 — Agent Platform (Web UI Next.js, Agent Chat,      │
│             34 Agent Tools, Template Marketplace)           │
│     v1.6.1 — Governance Engine (Enterprise enforcement,     │
│               Bug/Test/ADR guards, CI/CD, audit)            │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ LAYER 2.5 — SAFETY RUNTIME (AI Behavior Control)        │
│     v1.7 — Controlled Intelligence                          │
│     ● Reasoning Gate / Entropy Guard / Prompt Sanitizer     │
│     ● Anomaly Detector                                      │
│     v1.7.1 — Safety Runtime (5-Layer Kernel)                │
│     ● Domain Lock → Contract Runtime →                      │
│       Contamination Guard → Refusal Router →                │
│       Creative Control                                      │
│     ● 51 Kernel Tests | 96.45%+ coverage                   │
│     ● Anti-bypass Symbol guard | 12-step pipeline           │
│     ● Forensic tracing: requestId + traceHash               │
│     v1.8 — Safety Hardening (Implemented ✅)               │
│     ● 7-phase state machine: INTENT→COMMIT                  │
│     ● Deterministic Mutation Sandbox + Rollback Manager     │
│     ● Drift Monitor + Stability Index                       │
│     ● 10 modules | 42 tests | 100% pass                    │
│     v1.9 — Deterministic Reproducibility (Implemented ✅)   │
│     ● ExecutionRecord (9-field, immutable)                  │
│     ● Context Freezer + Replay Engine + Forensic audit      │
│     ● 5 modules | 29 tests | 100% pass                     │
│     v1.8.1 — Adaptive Observability Runtime (Implemented ✅)│
│     ● Adaptive Governance: risk→mode→guard feedback loop   │
│     ● Observability: telemetry, satisfaction, cost, regress │
│     ● 10 observability modules + 3 stores + 4 dashboards   │
├─────────────────────────────────────────────────────────────┤
│  🛠️ LAYER 2 — TOOLS (Validation + Automation)               │
│     v1.3 — Python SDK + cvf-validate CLI                    │
│     v1.3.1 — Operator Edition                               │
│     v1.4 — Usage Layer                                      │
│     v1.2.1 — External Integration (Implemented ✅)          │
│     ● Skill Supply Chain: intake→validate→certify→publish   │
│     ● Policy Decision Engine (6-layer precedence)           │
│     ● Blockchain-style Governance Audit Ledger              │
│     ● 29 tests | 100% pass                                  │
│     v1.2.2 — Skill Governance Engine (Implemented ✅)       │
│     ● Skill Spec Schema (CSS-1.0) với R0–R3 mapping         │
│     ● Maturity Model: EXPERIMENTAL→PROBATION→STABLE         │
│     ● Fusion Intelligence: semantic+historical+cost rank    │
│     ● Evolution Engine (Acontext-style dynamic skills)      │
│     ● Constitution + Phase Gate + Internal Ledger           │
│     governance/ — Compat scripts, CI/CD, Skill-library      │
│     tools/     — Python validation scripts                  │
├─────────────────────────────────────────────────────────────┤
│  📖 LAYER 1 — CORE (Bất biến — Always Required)             │
│     v1.0 — Manifesto, 4-Phase Process, Governance checklists│
│     v1.1 — Extended control: Input/Output specs, Multi-agent│
│     v1.2 — Skill Governance: Registry, Risk model R0–R3    │
│     v1.5 — UX Platform (FROZEN)                            │
│     v1.5.1 — End-User Orientation                           │
│     v1.5.2 — Skill Library (131 active skills, 12 domains)  │
├─────────────────────────────────────────────────────────────┤
│  🛡️ LAYER 1.5 — DEVELOPMENT GOVERNANCE                      │
│     v1.1.1 — Phase Governance Protocol (STABLE ✅)          │
│     v1.1.2 — Phase Governance Hardening (NEW ✅)            │
│     ● GOVERNANCE_PIPELINE: deterministic 6-module order      │
│     ● Trust Boundary + Hash Ledger (SHA-256)                 │
│     ● Capability Isolation (PHASE_CAPABILITIES)              │
│     ● Self-Debugging (detectAnomalies)                       │
│     ● System Invariants (INV-01/02/03)                       │
│     ● Governance Executor (runtime/)                         │
│     ● 22 tests | coverage 90/80/90/90                        │
├─────────────────────────────────────────────────────────────┤
│  🧬 LAYER 0 — CVF CORE FOUNDATION (branch cvf-next)   v3.0  │
│     "Git for AI Development" — 3+1 Primitives:               │
│     ● AI Commit (schema + parser + validator)                │
│     ● Artifact Staging (CANDIDATE→ACCEPTED, 4-state)        │
│     ● Artifact Ledger (append-only, content-addressed)       │
│     ● Process Model (gate-required, multi-process)           │
│     ● 49 tests | coverage 90/80/90/90                        │
│     ● CVF Core = standalone | CVF Full = Core + Governance   │
└─────────────────────────────────────────────────────────────┘
```

> **Quy tắc định vị:** Extension mới thuộc layer nào? → Xác định rõ trước khi implement.
> Extension ở Layer N không được bypass hoặc phá Layer N-1 trở xuống.

---

## III. LỊCH SỬ CÁC VERSION (Chronological)

| Version | Tên | Layer | Trạng thái | Folder trong EXTENSIONS/ |
|---------|-----|-------|-----------|--------------------------|
| v1.0 | Core Baseline | 1 | Active ✅ | `v1.0/` (root) |
| v1.1 | Extended Control | 1 | Active ✅ | `v1.1/` (root) |
| v1.1.1 | Phase Governance Protocol | 1.5 | **STABLE** 🔒 | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` |
| v1.1.2 | Phase Governance Hardening | 1.5 | **NEW** 🆕 | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/` |
| v1.2 | Skill Governance | 1 | Active ✅ | `CVF_v1.2_CAPABILITY_EXTENSION/` |
| v1.2.1 | External Integration | 2 | **Implemented** ✅ | `CVF_v1.2.1_EXTERNAL_INTEGRATION/` |
| v1.2.2 | Skill Governance Engine | 2 | **Implemented** ✅ | `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/` |
| v1.3 | SDK & Tooling | 2 | Active ✅ | `CVF_v1.3_IMPLEMENTATION_TOOLKIT/` |
| v1.3.1 | Operator Edition | 2 | Active ✅ | `CVF_v1.3.1_OPERATOR_EDITION/` |
| v1.4 | Usage Layer | 2 | Active ✅ | `CVF_v1.4_USAGE_LAYER/` |
| v1.5 | UX Platform | 1 | **FROZEN** ❄️ | `CVF_v1.5_UX_PLATFORM/` |
| v1.5.1 | End-User Orientation | 1 | Active ✅ | `CVF_v1.5.1_END_USER_ORIENTATION/` |
| v1.5.2 | Skill Library (131 active skills) | 1 | Active ✅ | `CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` |
| v1.6 | Agent Platform | 3 | Active ⭐ | `CVF_v1.6_AGENT_PLATFORM/` |
| v1.6.1 | Governance Engine | 3 | Active 🔐 | `CVF_v1.6.1_GOVERNANCE_ENGINE/` |
| v1.7 | Controlled Intelligence | 2.5 | Active 🧠 | `CVF_v1.7_CONTROLLED_INTELLIGENCE/` |
| v1.7.1 | Safety Runtime | 2.5 | Active ⚙️ | `CVF_v1.7.1_SAFETY_RUNTIME/` |
| v1.7.2 | Safety Dashboard | 4 | Active 🛡️ | `CVF_v1.7.2_SAFETY_DASHBOARD/` |
| v1.7.3 | Runtime Adapter Hub | 5 | **CURRENT** 🔌 | *(integrated)* |
| v1.8 | Safety Hardening | 2.5 | **Implemented** ✅ | `CVF_v1.8_SAFETY_HARDENING/` |
| v1.8.1 | Adaptive Observability Runtime | 2.5+3 | **Implemented** ✅ | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/` |
| v1.9 | Deterministic Reproducibility | 2.5 | **Implemented** ✅ | `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/` |
| v2.0 | Non-Coder Safety Runtime | 4 | **Implemented** ✅ | `CVF_v2.0_NONCODER_SAFETY_RUNTIME/` |
| v3.0 | Core Foundation — Git for AI | 0 | **DRAFT** 🔵 (cvf-next) | `CVF_v3.0_CORE_GIT_FOR_AI/` |
| v1.0 | Intent Validation | 2 | **Implemented** ✅ | `CVF_ECO_v1.0_INTENT_VALIDATION/` |
| v1.1 | NL Policy | 2 | **Implemented** ✅ | `CVF_ECO_v1.1_NL_POLICY/` |
| v1.2 | LLM Risk Engine | 2 | **Implemented** ✅ | `CVF_ECO_v1.2_LLM_RISK_ENGINE/` |
| v1.3 | Domain Guards | 2 | **Implemented** ✅ | `CVF_ECO_v1.3_DOMAIN_GUARDS/` |
| v1.4 | RAG Pipeline | 2 | **Implemented** ✅ | `CVF_ECO_v1.4_RAG_PIPELINE/` |
| v2.0 | Agent Guard SDK | 3 | **Implemented** ✅ | `CVF_ECO_v2.0_AGENT_GUARD_SDK/` |
| v2.1 | Governance Canvas | 3 | **Implemented** ✅ | `CVF_ECO_v2.1_GOVERNANCE_CANVAS/` |
| v2.2 | Governance CLI | 3 | **Implemented** ✅ | `CVF_ECO_v2.2_GOVERNANCE_CLI/` |
| v2.3 | Agent Identity | 4 | **Implemented** ✅ | `CVF_ECO_v2.3_AGENT_IDENTITY/` |
| v2.4 | Graph Governance | 4 | **Implemented** ✅ | `CVF_ECO_v2.4_GRAPH_GOVERNANCE/` |
| v3.0 | Task Marketplace | 5 | **Implemented** ✅ | `CVF_ECO_v3.0_TASK_MARKETPLACE/` |
| v3.1 | Reputation System | 5 | **Implemented** ✅ | `CVF_ECO_v3.1_REPUTATION/` |

---

## IV. 4-PHASE PROCESS (CVF Core — Bất biến)

```
Phase A: Discovery  → Human quyết định requirements
Phase B: Design     → Human quyết định architecture
Phase C: Build      → AI executes (viết code theo spec)
Phase D: Review     → Human validates, approve/fix
```

**Nguyên tắc cứng:**
- Human luôn là authority cuối cùng ở Phase A, B, D
- AI chỉ thực thi Phase C theo spec đã được approve
- Không skip phase, không merge phase

---

## V. RISK MODEL CVF GỐC (R0–R3)

**R0–R3** là risk model chính thức (nguồn: `CVF_POSITIONING.md`).

| Level | Tên | Nghĩa | Required Controls |
|-------|-----|-------|-------------------|
| R0 | Passive | No side effects — read/analyze only | Logging |
| R1 | Controlled | Small, bounded changes — single file | Logging + Scope Guard |
| R2 | Elevated | Has authority, may chain — module-level | Logging + Scope Guard + Approval + Audit |
| R3 | Critical | System changes — cross-module/architecture | All above + Hard Gate + Human-in-the-loop |

**Mapping Safety Dashboard:**
```
🟢 Safe      = R0
🟡 Attention = R1
🟠 Review    = R2
🔴 Dangerous = R3
```

**Mapping numeric (dành cho v1.8+ khi implement):**
```
0–5   = LOW      ≈ R0–R1
6–10  = MODERATE ≈ R2
11–15 = HIGH     ≈ R3
16+   = CRITICAL ≈ R3+ (hard stop)
```

> ⚠️ Cần canonical mapping chính thức khi implement 1.8+

---

## VI. 5-LAYER SAFETY KERNEL (v1.7.1 — Đang chạy)

Pipeline xử lý mọi AI request, **không thể bypass:**

```
User Request
  ↓
[1] Domain Lock         → Kiểm tra scope, từ chối out-of-domain
  ↓
[2] Contract Runtime    → Validate input/output contract
  ↓
[3] Contamination Guard → Detect cross-domain pollution
  ↓
[4] Refusal Router      → Từ chối nếu vi phạm policy
  ↓
[5] Creative Control    → Giới hạn autonomy AI (Creative Mode toggle)
  ↓
Audit Logger → Decision logged với requestId + traceHash
  ↓
Output (Allow / Strip & Allow / Block)
```

**Specs kỹ thuật:**
- 12-step non-bypass pipeline
- Symbol guard chống bypass
- 51 kernel tests, 96.45% statement coverage, 91.41% branch coverage
- requestId + traceHash cho mọi request (forensic)

---

## VII. GOVERNANCE SYSTEM

### 3 Lớp thực thi:

**Layer 1 — System Prompt (Rule 16)**
- AI Agent được instruct gọi `governance_check` tool khi: fix bug, run test, change code

**Layer 2 — Post-Processing (`governance-post-check.ts`)**
- Auto-scan AI responses, inject 🚨 enforcement message nếu thiếu documentation

**Layer 3 — UI Governance Checker**
- Interactive checklist trên Safety page + Tools page

### Governance Guards (Mandatory):

| Guard | Trigger | Required File |
|-------|---------|---------------|
| CVF_BUG_DOCUMENTATION_GUARD.md | `fix:` commits | `docs/BUG_HISTORY.md` |
| CVF_TEST_DOCUMENTATION_GUARD.md | `test:` commits | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md | active test log window exceeds threshold | `docs/CVF_INCREMENTAL_TEST_LOG.md` + `docs/logs/` |
| CVF_ADR_GUARD.md | `feat(governance):`, `refactor(arch):`, `docs(policy):` | `docs/CVF_ARCHITECTURE_DECISIONS.md` |
| CVF_DOCUMENT_NAMING_GUARD.md | New/migrated long-term governance docs | `CVF_` naming convention + approved exceptions |
| CVF_DIAGRAM_VALIDATION_GUARD.md | Diagram changes | `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md` |
| CVF_DOCUMENT_STORAGE_GUARD.md | New long-term docs in `docs/` | Correct taxonomy folder per `docs/INDEX.md` |
| CVF_DEPTH_AUDIT_GUARD.md | Any roadmap deepening / new semantic layer | Explicit scoring before continuing deeper |
| CVF_WORKSPACE_ISOLATION_GUARD.md | Opening projects in CVF root | Sibling workspace only |
| CVF_TEST_DEPTH_CLASSIFICATION_GUARD.md | Any test count report in assessment/review/release | T1–T4 tier breakdown + Meaningful Assertion Rate |
| CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md | Trace exceeds threshold | Rotate to `docs/reviews/*/logs/` |
| CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md | Wave 1 closure | Sequential runner, shared bootstrap |
| CVF_PYTHON_AUTOMATION_SIZE_GUARD.md | Scripts in `scripts/`, `governance/compat/` | Stay within size thresholds |
| CVF_ARCHITECTURE_CHECK_GUARD.md | Any new version/layer/extension/module proposal | `docs/CVF_CORE_KNOWLEDGE_BASE.md` ← file này |
| CVF_EXTENSION_VERSIONING_GUARD.md | New extension folder in `EXTENSIONS/` | `CVF_{STREAM}_v{major}.{minor}_{NAME}/` format |
| CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md | Governed packets, evidence docs, or continuity docs being written | Source-truth first + typed evidence stays explicit + continuity surfaces move together |
| CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md | CPF public barrel changes | Keep `src/index.ts` thin and re-export-only |
| CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md | CPF barrel smoke changes | Keep `tests/index.test.ts` smoke-only and ownership-clean |
| CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md | Governed CPF batch family changes | Shared batch helper + shared fixture adoption required |
| CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md | Governed CPF/EPF batch contract changes | `batchId = hash(batchHash)` only + nested `now` propagation mandatory |
| CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md | Canon summary doc changes | Summary docs must cite evidence, not inline typed evidence payloads |
| CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md | Pre-public repository cleanup or root/extension lifecycle review | Visible roots and extension roots must be lifecycle-classified before relocation |
| CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md | Pre-public publication or selective-distribution planning | Visible roots and extension roots must declare public/private exposure posture before publication decisions |
| CVF_PREPUBLIC_P3_READINESS_GUARD.md | Pre-public `P3` relocation readiness review | `P3` stays blocked until phase-gates, root-file exposure, docs-root curation, export-readiness, and memo freshness are explicit |
| CVF_GUARD_AUTHORING_STANDARD_GUARD.md | New or materially revised governance guard | Guard must satisfy the mandatory authoring contract before commit |
| CVF_GUARD_REGISTRY_GUARD.md | New guard created | Register in README.md + KB |
| CVF_ACTIVE_ARCHIVE_GUARD.md | Active archive maintenance | Keep active/archive split truthful and append-only |
| CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md | New or revised active trace/log window with dedicated rotation guard | Register canonical active window + class + archive protection |
| check_repository_lifecycle_classification.py | Pre-public restructure planning | Enforces lifecycle coverage before publish-facing folder cleanup |
| check_repository_exposure_classification.py | Pre-public publication planning | Enforces private-by-default exposure coverage before any public-facing release posture is assumed |
| CVF_AGENT_HANDOFF_GUARD.md | Governed pause/resume transfer | Canonical handoff packet before another worker continues; record tracked remote branch and derive exact remote SHA live when needed |
| CVF_AGENT_HANDOFF_TRANSITION_GUARD.md | Pause/resume classification | Transition class chosen before handoff is written |
| CVF_BASELINE_UPDATE_GUARD.md | Substantive repo change | Matching baseline/review artifact required |
| CVF_BOARDROOM_RUNTIME_GUARD.md | Live boardroom decisions | Canonical boardroom runtime convergence packet |
| CVF_EXTENSION_PACKAGE_CHECK_GUARD.md | Touched extension package changes | Package-level `check` script must pass before push |
| CVF_FAST_LANE_GOVERNANCE_GUARD.md | Low-risk additive tranche work | Fast-lane packet and limits must remain truthful |
| CVF_GOVERNED_FILE_SIZE_GUARD.md | Governed source/test/frontend/docs growth | File stays under threshold or carries approved exception |
| CVF_MEMORY_GOVERNANCE_GUARD.md | Durable governance records | Correct memory class markers required |
| CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md | Future knowledge absorption, repo-derived skill intake, or post-closure extension planning | Doctrine-first / governance-first absorption must complete before implementation-first expansion |
| CVF_TEMPLATE_SKILL_STANDARD_GUARD.md | Future skill/template intake, corpus rescreen, or trusted-subset admission for public non-coder use | Deterministic CVF-standard screen required; only `TRUSTED_FOR_VALUE_PROOF` may enter benchmark truth |
| CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md | Multi-agent intake/rebuttal/decision docs | Canonical review doc chain must be standardized |
| CVF_PRODUCT_VALUE_VALIDATION_GUARD.md | Product-value proof, comparative validation, or Docker-sandbox justification claims | Frozen corpus + rubric + run manifest + no-spin assessment required |
| CVF_PROGRESS_TRACKER_SYNC_GUARD.md | Tranche posture change | Canonical tracker and sync note must stay aligned |
| CVF_SURFACE_SCAN_CONTINUITY_GUARD.md | Fresh tranche selection or scan-state change | Canonical scan registry must preserve what was already scanned |
| CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md | New/resumed governed sessions | Canonical bootstrap must load first |
| CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md | Major structural merge or move | Audit -> review -> decision path required |

Automated foundational surface gate:

- `governance/compat/check_foundational_guard_surfaces.py` now enforces ADR update truth, architecture-baseline refresh, extension naming/versioning, GC-019 packet presence, test-depth reporting markers, and workspace-isolation drift within the same change range
- local pre-push and CI both run this gate so these six foundational guards are no longer policy-only review checkpoints

Archive protection note:

- generic archive cleanup must never auto-archive canonical active windows owned by dedicated rotation guards
- canonical source of truth is `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- grouped management map is `docs/reference/CVF_ACTIVE_WINDOW_CLASSIFICATION.md`
- historical `docs/audits/` and `docs/reviews/` now use explicit retain-evidence registries instead of one-off manual exceptions
- canonical retention sources are `governance/compat/CVF_AUDIT_RETENTION_REGISTRY.json` and `governance/compat/CVF_REVIEW_RETENTION_REGISTRY.json`
- generic archive cleanup runs incrementally from `governance/compat/CVF_ACTIVE_ARCHIVE_BASELINE.json`; full scans are bootstrap/recovery only
| CVF_TEST_PARTITION_OWNERSHIP_GUARD.md | Extracted governed test surfaces | Canonical test home must remain exclusive |

Guard management map:

- `docs/reference/CVF_GUARD_SURFACE_CLASSIFICATION.md`

Continuity truth note:

- `GC-020` handoff stores stable transition truth, not volatile push-boundary trivia
- record the tracked remote branch in `AGENT_HANDOFF.md` when the branch has an upstream
- derive exact remote SHA live from git when a resume, comparison, or push decision depends on it
- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md` is the canonical rule for thin barrels, smoke ownership, shared batch helpers, shared test builders, and summary-vs-evidence separation
- external memory remains convenience-only and must not override repo truth or handoff truth


### Compatibility Gates (Chạy trước khi merge):
```bash
python governance/compat/check_core_compat.py --base <BASE_REF> --head <HEAD_REF>
python governance/compat/check_bug_doc_compat.py --enforce
python governance/compat/check_test_doc_compat.py --enforce
python governance/compat/check_docs_governance_compat.py --enforce
```

---

## VIII. SKILL LIBRARY (v1.5.2)

| Thuộc tính | Giá trị |
|---|---|
| Tổng số skills | **131 active skills** |
| Số domains | **12 domains** |
| Agent Tools | **34 tools** |
| Location | `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` |
| Linked với | 50 Templates trong Web UI |

**12 Domains:** Application Development, Security/Compliance, AI/ML, Testing, Frontend, Backend, Database, Cloud/DevOps, Code Review, Product & UX, Marketing, Legal

**34 Agent Tools (nhóm):** RAG, Data Viz, Agentic Loop, Browser Auto, MCP, Workflow Hooks, Scientific Research, Agent Teams, Context Engineering, Debugging, API Architecture, Testing, Security, Database, Frontend, Cloud Deployment, Code Review, MCP Builder, AI Multimodal, Operator Workflow & more

---

## IX. CẤU TRÚC FILE HỆ THỐNG

```
Controlled-Vibe-Framework-CVF/
├── v1.0/                        ← Core: Manifesto, 4-Phase, Governance
├── v1.1/                        ← Core: Extended control
├── EXTENSIONS/                  ← Tất cả extensions (v1.2 → v1.7.3)
│   ├── CVF_v1.2_CAPABILITY_EXTENSION/
│   ├── CVF_v1.2.1_EXTERNAL_INTEGRATION/     (Implemented ✅)
│   ├── CVF_v1.3_IMPLEMENTATION_TOOLKIT/
│   ├── CVF_v1.3.1_OPERATOR_EDITION/
│   ├── CVF_v1.4_USAGE_LAYER/
│   ├── CVF_v1.5_UX_PLATFORM/        (FROZEN)
│   ├── CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
│   ├── CVF_v1.6_AGENT_PLATFORM/
│   ├── CVF_v1.6.1_GOVERNANCE_ENGINE/
│   ├── CVF_v1.7_CONTROLLED_INTELLIGENCE/
│   ├── CVF_v1.7.1_SAFETY_RUNTIME/
│   ├── CVF_v1.7.2_SAFETY_DASHBOARD/
│   ├── CVF_v1.8_SAFETY_HARDENING/           (Implemented ✅)
│   ├── CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/ (Implemented ✅)
│   ├── CVF_v2.0_NONCODER_SAFETY_RUNTIME/    (Implemented ✅)
│   ├── CVF_TOOLKIT_REFERENCE/       (Reference only)
│   ├── CVF_STARTER_TEMPLATE_REFERENCE/ (Reference only)
│   └── examples/
│
│   └── CVF_ECO Extensions (Track III)              ← 12 modules, 434 tests ✅
│       ├── CVF_ECO_v1.0_INTENT_VALIDATION/         ← 41 tests
│       ├── CVF_ECO_v1.1_NL_POLICY/                  ← 46 tests
│       ├── CVF_ECO_v1.2_LLM_RISK_ENGINE/           ← 37 tests
│       ├── CVF_ECO_v1.3_DOMAIN_GUARDS/            ← 39 tests
│       ├── CVF_ECO_v1.4_RAG_PIPELINE/               ← 34 tests
│       ├── CVF_ECO_v2.0_AGENT_GUARD_SDK/           ← 43 tests
│       ├── CVF_ECO_v2.1_GOVERNANCE_CANVAS/         ← 30 tests
│       ├── CVF_ECO_v2.2_GOVERNANCE_CLI/              ← 39 tests
│       ├── CVF_ECO_v2.3_AGENT_IDENTITY/            ← 39 tests
│       ├── CVF_ECO_v2.4_GRAPH_GOVERNANCE/           ← 27 tests
│       ├── CVF_ECO_v3.0_TASK_MARKETPLACE/           ← 29 tests
│       └── CVF_ECO_v3.1_REPUTATION/                ← 30 tests
├── docs/                        ← Governance & Documentation hub
│   ├── CVF_CORE_KNOWLEDGE_BASE.md   ← ★ FILE NÀY (Governance permanent)
│   ├── reference/
│   │   ├── CVF_POSITIONING.md           ← Định vị chiến lược
│   │   ├── CVF_ARCHITECTURE_DIAGRAMS.md ← Mermaid diagrams
│   │   ├── CVF_ARCHITECTURE_MAP.md
│   │   ├── CVF_ADOPTION_STRATEGY.md
│   │   ├── CVF_SKILL_LIFECYCLE.md
│   │   ├── CVF_WEB_TOOLKIT_GUIDE.md
│   │   ├── CVF_WHITEPAPER_GIT_FOR_AI.md
│   │   └── CVF_v16_AGENT_PLATFORM.md
│   ├── CVF_ARCHITECTURE_DECISIONS.md ← ADR records
│   ├── baselines/
│   │   ├── CVF_CORE_COMPAT_BASELINE.md  ← Official compat baseline
│   │   └── CVF_TESTER_BASELINE_2026-02-25.md
│   ├── assessments/
│   │   ├── CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md
│   │   ├── CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md
│   │   └── CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md
│   ├── logs/
│   │   └── CVF_INCREMENTAL_TEST_LOG_ARCHIVE_<YYYY>_PART_<NN>.md
│   ├── BUG_HISTORY.md               ← Bug knowledge base
│   ├── CVF_INCREMENTAL_TEST_LOG.md  ← Test history entrypoint + active window
│   └── VERSIONING.md, VERSION_COMPARISON.md, GET_STARTED.md ...
├── governance/
│   ├── compat/                  ← Compatibility gate scripts
│   ├── skill-library/registry/  ← Skill registry + agent skills
│   └── toolkit/05_OPERATION/    ← Governance guards
│       ├── CVF_ARCHITECTURE_CHECK_GUARD.md ← Guard dẫn đến file này
│       ├── CVF_ADR_GUARD.md
│       ├── CVF_BUG_DOCUMENTATION_GUARD.md
│       ├── CVF_DEPTH_AUDIT_GUARD.md
│       ├── CVF_TEST_DOCUMENTATION_GUARD.md
│       ├── CVF_DOCUMENT_NAMING_GUARD.md
│       └── CVF_DOCUMENT_STORAGE_GUARD.md
├── tools/                       ← Python validation scripts
├── README.md                    ← Main entry point
├── CHANGELOG.md                 ← Version history
└── CVF_LITE.md                  ← 5-min quick start
```

> **REVIEW/ folder:** Chứa các review tạm thời về extensions đang được đánh giá.
> Không có giá trị dài hạn — xóa sau khi extension được tích hợp vào CVF chính thức.

---

## X. QUALITY METRICS (Snapshot 2026-02-26)

| Metric | Giá trị |
|--------|---------|
| CVF Core v3.0 Tests | 49 passing |
| Kernel Tests (v1.7.1) | 51 passing |
| v1.8 Safety Hardening Tests | **42 passing** (12 describe blocks) |
| v1.9 Reproducibility Tests | **29 passing** |
| v2.0 Non-Coder Runtime Tests | **32 passing** |
| v1.2.1 External Integration Tests | **29 passing** |
| **CVF_ECO Extensions Tests** | **434 passing** (12 modules) |
| Legacy Extension Tests | **1764+ passing** (22 modules) |
| **Total Tests** | **~2,430+ tests** |
| Web Coverage | 93.05% Stmts |
| Kernel Coverage | 96.45% Stmts · 91.41% Branch · 99.09% Fn · 97.01% Lines |
| Skills | 131 active skills, 12 domains |
| Agent Tools | 34 tools |
| Overall Score | 9.4/10 (independent) · 8.5/10 (Antigravity) · **7.8/10** (system assessment 2026-03-09) |
| **v1.7.3 addition** | Runtime Adapter Hub: 5 contracts + 4 adapters |
| **CVF_ECO addition** | Track III: 12 extensions, 434 tests, 100% pass |
| **Full Ecosystem** | CVF Core + Legacy + CVF_ECO: 34 extensions |
| **Hardening Track I** | 76 new tests (Phase 1-4: UnifiedStateResolver, SkillRolloutEngine, WorkflowCoordinator) |
| **Track IV Runtime Evolution** | ✅ COMPLETE: Phase A-E, 394 runtime tests, 453 total, governance-enforced runtime platform |
| **Overall Score** | **9.2/10** (Runtime Evolution achieved) |

---

## XI. NGUYÊN TẮC BẤT BIẾN (Không được vi phạm)

Extension/version mới **bắt buộc** phải tôn trọng:

1. **Human authority** — Con người là decision maker cuối cùng, AI là executor
2. **Safety over speed** — Không tối ưu tốc độ mà hi sinh an toàn
3. **No silent mutation** — Mọi thay đổi phải được thông báo, logged
4. **Backward compatibility** — Layer N không phá Layer N-1 trở xuống
5. **Governance-first** — Mọi action phải pass governance gate
6. **Audit trail mandatory** — Mọi execution có trace, rollback available
7. **Phase integrity** — 4-Phase A→D không thể skip hay merge
8. **Workspace isolation** — Downstream projects phải là sibling workspace, không phát triển trong CVF root
9. **Architecture check mandatory** — Mọi addition mới phải đọc file này và xác định Layer, overlap, backward compat trước khi implement
10. **KB auto-update mandatory** — Sau mỗi lần nâng cấp/bổ sung version mới, **phải cập nhật file này** (Section II, III, X) để nó luôn là base chính xác cho lần bổ sung sau
11. **Depth audit mandatory before deeper layering** — Không tiếp tục đào sâu roadmap nếu chưa chứng minh được `risk reduction`, `decision value`, và `machine-enforceable closure`

---

## XII. CHECKLIST ĐỊNH VỊ EXTENSION MỚI

> 🚨 **BẮT BUỘC** theo [`CVF_ARCHITECTURE_CHECK_GUARD`](../governance/toolkit/05_OPERATION/CVF_ARCHITECTURE_CHECK_GUARD.md):
> Khi phát triển extension/layer/version mới, phải trả lời đủ **9 câu hỏi** này trước khi implement.

```
ARCHITECTURE CHECK — Phải hoàn thành trước khi bất kỳ proposal nào được chấp nhận
══════════════════════════════════════════════════════════════════
[ ] 1. Layer placement: Thuộc Layer ___
        (1=Core | 2=Tools | 2.5=Safety Runtime | 3=Platform | 4=Safety UI | 5=Adapter)

[ ] 2. Principle check: KHÔNG vi phạm nguyên tắc nào trong Section XI
        Đã kiểm tra nguyên tắc: ___________________________

[ ] 3. Overlap check: So sánh với version history (Section III)
        Không trùng lặp với: _______________________________
        HOẶC: Mở rộng (không phải duplicate) từ: ____________

[ ] 4. Risk model: Dùng R0–R3 hoặc có mapping documentation nếu khác

[ ] 5. Safety Kernel: KHÔNG bypass 5-layer Safety Kernel (Section VI)

[ ] 6. Governance Guards: Sẽ gọi đúng guards (Section VII)

[ ] 7. Compat Gate: Sẽ pass compatibility gates
        → python governance/compat/check_core_compat.py

[ ] 8. ADR Entry: Sẽ tạo ADR trong docs/CVF_ARCHITECTURE_DECISIONS.md

[ ] 9. KB Update: Nếu architecture thay đổi, sẽ cập nhật file này
══════════════════════════════════════════════════════════════════
Tất cả 9 checkbox phải được check trước khi bắt đầu implement.
```

---

## XIII. CVF MCP SERVER (M1-M7) — Complete Implementation

> **Phiên bản:** v2.1.0 | **Cập nhật:** 2026-03-09  
> **Location:** `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/`  
> **Tests:** 476 passing across 14 test files  
> **Status:** ✅ All milestones complete, pushed to `cvf-next`

### Architecture Overview

```
EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/
├── guards/           — 6 guards + engine (102 tests)
├── persistence/      — JSON file adapter (26 tests)
├── prompt/          — System prompt generator (37 tests)
├── cli/             — 9-command CLI wrapper (38 tests)
├── registry/        — Unified guard registry + skill-guard wire (54 tests)
├── vibe-translator/ — Vibe parser, clarification, confirmation card (96 tests)
├── memory/          — Session memory with TTL (40 tests)
├── non-coder/       — 5 Golden Screens + Smart Onboarding (60 tests)
├── integration/     — E2E pipeline tests (23 tests)
├── sdk.ts           — Barrel exports for consumers
└── index.ts         — MCP server entry point (7 tools)
```

### Key Capabilities

| Capability | Description | Tests |
|------------|-------------|-------|
| **MCP Server** | 7 tools: phase_gate, risk_gate, authority, validate_output, advance_phase, audit_log, evaluate_full | 102 |
| **Guard Persistence** | JSON file audit log + session state | 26 |
| **System Prompt** | Context-aware prompt with MCP tool references | 37 |
| **CLI** | Terminal commands for non-IDE usage | 38 |
| **Unified Registry** | Single source of truth for all guards | 54 |
| **Skill-Guard Wire** | Map skills to required guards | 54 |
| **Vibe Translator** | NL input → structured intent → guard evaluation (EN/VI) | 96 |
| **Session Memory** | Cross-request state with TTL expiry | 40 |
| **Non-coder Screens** | 5 Golden Screens data models + Smart Onboarding | 60 |
| **E2E Tests** | Full pipeline integration tests | 23 |

### MCP Tools (IDE Integration)

| Tool | Usage |
|------|-------|
| `cvf_check_phase_gate` | Before starting work in a new phase |
| `cvf_check_risk_gate` | Before any action with side effects |
| `cvf_check_authority` | Before approve/merge/deploy actions |
| `cvf_validate_output` | After generating output, before presenting |
| `cvf_advance_phase` | When current phase work is complete |
| `cvf_get_audit_log` | Retrieve session audit trail |
| `cvf_evaluate_full` | Run full 6-guard pipeline on an action |

### Non-coder First Product Features

| Feature | Description |
|---------|-------------|
| **Vibe Box** | Single input + voice, phase-specific prompts |
| **Intention Map** | Mindmap confirmation + auto-guardrails |
| **Live Dashboard** | Progress + budget + pause controls |
| **Human-in-the-Loop** | Push notifications for risk events |
| **Audit Ledger** | Human-language daily summaries |
| **Smart Onboarding** | Persona profiling + red lines + personal dictionary |

### Quick Start

```bash
# Install
cd EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER
npm install

# Run tests
npm test          # 476 tests pass
npm run test:run  # Single run

# Start MCP server (stdio transport)
npm start

# CLI usage
npx tsx src/cli.ts evaluate --phase BUILD --risk R0 --role HUMAN --action "write code"
```

### Integration Points

- **IDEs**: Add to Windsurf/Cursor MCP settings to get guard tools
- **CLI**: Use for CI/CD, shell scripts, Python integration
- **SDK**: Import from `./sdk.ts` for TypeScript consumers
- **Frontend**: Use `generateVibeBoxScreen()` etc. for UI data contracts

---

## XIV. KEY DOCS ĐỂ ĐỌC THÊM

| File | Khi nào đọc |
|------|------------|
| [`docs/reference/CVF_POSITIONING.md`](reference/CVF_POSITIONING.md) | Cần hiểu identity CVF, anti-patterns |
| [`docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`](reference/CVF_ARCHITECTURE_DIAGRAMS.md) | Cần xem Mermaid diagrams đầy đủ |
| [`docs/CVF_ARCHITECTURE_DECISIONS.md`](CVF_ARCHITECTURE_DECISIONS.md) | Xem ADR history, quyết định thiết kế |
| [`docs/baselines/CVF_CORE_COMPAT_BASELINE.md`](baselines/CVF_CORE_COMPAT_BASELINE.md) | Chạy compat check |
| [`EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md`](../EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md) | Hiểu reference vs production separation |
| [`EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`](../EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md) | MCP Server usage guide |

---

## XIV. CVF EXTENSION RULES (Bất di bất dịch)

> 🔒 **Ưu tiên cao nhất.** Ba quy tắc này áp dụng cho mọi thứ được bổ sung vào CVF, không có ngoại lệ.

### RULE 1 — Cấu trúc hiện tại luôn là chuẩn

> **CVF cũ luôn là điểm tham chiếu, không phải philosphy mới.**

- Cấu trúc CVF hiện tại (5 layers, version history, 4-Phase Process, Risk Model R0–R3) là **ground truth**
- Bất kỳ đề xuất nào MUỐN đặt lại tên, redefine, hay "cải tiến" cấu trúc cũ → phải hỏi **tại sao cấu trúc cũ chưa đủ** thay vì replace nó
- Người muốn sửa structure hiện tại phải viết ADR và có approval rõ ràng

```
❌ SAI:  "Cấu trúc cũ hạn chế, tôi đề xuất 6-layer mới"
✅ ĐÚNG: "Tôi muốn thêm Layer 5.5 giữa Adapter và Safety UI vì [lý do cụ thể]"
```

---

### RULE 2 — Mọi addition phải tương thích và bổ sung, không thay thế

> **Nâng cấp CVF = thêm vào, không phải viết lại.**

- Mọi version mới phải **interoperate** với tất cả version đã tồn tại
- Không được **silent-replace** bất kỳ component nào — nếu cần replace, viết ADR trước
- **Test backward compat** trước khi propose: chạy `governance/compat/check_core_compat.py`
- Phương châm: **"CVF 1.9 không phá 1.8. CVF 2.0 không phá 1.9."**

```
❌ SAI:  "Module mới sẽ thay thế Risk Model cũ"
✅ ĐÚNG: "Module mới thêm numeric scoring, dùng song song với R0–R3, có mapping chính thức"
```

---

### RULE 3 — Governance và Naming phải theo chuẩn CVF

> **Không tư ý đặt tên version, layer, hay guard mới.**

**Version naming:**
```
Đúng:  CVF_v[MAJOR].[MINOR]_[TEN_VIET_HOA]
         ví dụ: CVF_v1.8_SAFETY_HARDENING
Đưa cho AI: CVF_v1.8_ENHANCED_KERNEL (không rõ nội dung)
```

**Layer naming:**
```
Đúng:  LAYER [N] — [MÔ TẢ CHỤC NĂNG]
         ví dụ: LAYER 5 — ADAPTER HUB
Đưa cho AI: "AI Execution Layer" (không rõ vị trí trong 5-layer)
```

**Guard naming:**
```
ĐúNG: CVF_[MỤC_ĐÍCH]_GUARD.md
        ví dụ: CVF_ARCHITECTURE_CHECK_GUARD.md
Đưa cho AI: "new_safety_rules.md" (không follow convention)
```

**Document naming (long-term records in `docs/` / `governance/`):**
```
ĐúNG: CVF_[MỤC_ĐÍCH]_[PHẠM_VI]_[YYYY-MM-DD].md
        ví dụ: CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md
        ví dụ: CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md
SAI:   roadmap_latest.md / final_review.md / danh_gia_moi.md
```

**Approved standard exceptions:**
`README.md`, `INDEX.md`, `CHANGELOG.md`, `LICENSE`, `BUG_HISTORY.md`,
`GET_STARTED.md`, `VERSIONING.md`, `VERSION_COMPARISON.md`

**Document storage placement (new long-term docs):**
```
reference/    = authoritative long-lived reference docs
assessments/  = assessments, audits, reassessments
baselines/    = baseline snapshots and comparison anchors
roadmaps/     = remediation / upgrade / rollout plans
reviews/      = review archives by module or scope
```

**Quy tắc cứng:** Không tạo hồ sơ dài hạn mới trực tiếp ở `docs/` root nếu không có phê duyệt rõ ràng.

**Governance additions:** Phải với:
- Scope rõ ràng (trigger condition, what it covers)
- Không duplicate guard đã tồn tại
- ADR entry vì mang ý nghĩa architectural decision

---

### RULE 4 — KB Auto-Update sau mỗi nâng cấp (Bắt buộc)

> **Quy tắc:** Mỗi khi version/layer mới được implement hoặc nâng cấp, **phải cập nhật** `CVF_CORE_KNOWLEDGE_BASE.md` ngay lập tức.

**Cụ thể phải update:**
- **Section II** (Layer Diagram): thêm version mới vào đúng layer, ghi trạng thái (Spec/Implemented)
- **Section III** (Version Table): cập nhật trạng thái, folder
- **Section X** (Quality Metrics): thêm test count mới
- **Header**: cập nhật version hiện tại

**Tại sao bắt buộc:**
- File này là **base cho tất cả lần bổ sung sau** — nếu không update, contributor sau sẽ đề xuất dựa trên thông tin cũ
- Governance check sẽ dẫn vào file này — nếu file lỗi thời thì governance cũng sai theo
- Giữ tính **liên tục** và **tự cập nhật** — không cần nhớ, chỉ cần follow rule

```
❌ SAI:  Implement v3.0 xong → quên update Knowledge Base → contributor sau không biết v3.0 tồn tại
✅ ĐÚNG: Implement v3.0 xong → Update Section II, III, X ngay → Commit cùng lúc
```

---

> **Cập nhật file này khi:** CVF có major structural change hoặc new layer/version được chính thức release. **(Rule 4: BẮT BUỘC)**
> **Không cập nhật khi:** Chỉ thêm skills, fix bugs, hoặc update docs thông thường.
> **Vị trí cố định:** `docs/CVF_CORE_KNOWLEDGE_BASE.md` — không được di chuyển hay đổi tên.

---

## XV. QUALITY ASSESSMENT CANON

> Từ nay mọi quality review cấp tranche, wave, hoặc architecture phải dùng chung một rubric, không chấm cảm tính theo từng agent.

- Canonical rubric:
  - `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- Current active quality snapshot for the post-W7 continuation line:
  - `docs/assessments/CVF_POST_W32_CONTINUATION_QUALITY_ASSESSMENT_2026-04-01.md`

Rubric cố định gồm 6 chiều:

- Governance Discipline
- Contract / Architecture Quality
- Evidence and Traceability
- Test and Verification Confidence
- Maintainability
- Canonical Documentation Quality

Quy tắc cứng:

- quality claim phải bám governed evidence, không bám note riêng của agent
- nếu bất kỳ dimension nào `< 6.0`, scope đó phải chuyển sang remediation-first
- nếu Governance Discipline, Test and Verification Confidence, hoặc Canonical Documentation Quality `< 8.0`, không được coi scope đó là strong mà không có follow-up bắt buộc
- trước mọi fresh `GC-018`, phải đọc active quality assessment và chốt rõ `REMEDIATE_FIRST` hoặc `EXPAND_NOW`

---

## XVI. PRE-PUBLIC P3 EXECUTION ISOLATION

> `P3` pre-public relocation is not allowed to execute directly on `cvf-next`.

Canonical rule:

- future physical `P3` relocation waves must run on a dedicated branch matching `restructuring/p3-*`
- future physical `P3` relocation waves must run from a secondary git worktree
- `cvf-next` remains the canonical integration branch; however, post-review landing semantics for isolated `P3` relocation branches remain unresolved under current `GC-039` until a separate governance clarification is approved

This rule is additive to, not a replacement for:

- fresh `GC-019` structural audit/review for the concrete move set
- `GC-039` readiness pass for the same move set

Canonical references:

- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`
- `docs/reference/CVF_PREPUBLIC_RESTRUCTURING_UNIFIED_AGENT_PROTOCOL.md`
- `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md`
- `governance/toolkit/05_OPERATION/CVF_PREPUBLIC_P3_READINESS_GUARD.md`
- `governance/compat/check_prepublic_p3_readiness.py`
