# 🗺️ CVF CORE KNOWLEDGE BASE — Architectural Map

> **Developed by Tien - Tan Thuan Port@2026**

> **Loại tài liệu:** Governance Reference (Permanent)
> **Mục đích:** Bản đồ kiến trúc toàn diện của CVF gốc.
> Dùng để **định vị nhanh** bất kỳ extension/version/layer mới vào đúng chỗ trong cấu trúc,
> kiểm tra overlap và backward compatibility — **không cần đọc lại codebase CVF mỗi lần**.
>
> **Phiên bản hiện tại:** v2.0.0 | **Cập nhật:** 2026-03-05
> **Nguồn xác minh:** GitHub repo + README.md + CVF_POSITIONING.md + CVF_ARCHITECTURE_DIAGRAMS.md

---

## I. ĐỊNH DANH & ĐỊNH VỊ CVF

```
CVF = Governance Framework (Rules + Process + Tools)
    ≠ AI model / AI tool / Code library / Software product
```

| Thuộc tính | Giá trị |
|---|---|
| **Tên chính thức** | Controlled Vibe Framework (CVF) |
| **Phiên bản hiện tại** | **v2.0.0** (Mar 2026) |
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
│     v1.5.2 — Skill Library (141 skills, 12 domains, ACTIVE) │
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
| v1.5.2 | Skill Library (141 skills) | 1 | Active ✅ | `CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` |
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
| Bug Documentation Guard | `fix:` commits | `docs/BUG_HISTORY.md` |
| Test Documentation Guard | `test:` commits | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| Test Log Rotation Guard | active test log window exceeds threshold | `docs/CVF_INCREMENTAL_TEST_LOG.md` + `docs/logs/` |
| ADR Guard | `feat(governance):`, `refactor(arch):`, `docs(policy):` | `docs/CVF_ARCHITECTURE_DECISIONS.md` |
| Document Naming Guard | New/migrated long-term governance docs | `CVF_` naming convention + approved exceptions |
| Document Storage Guard | New long-term docs in `docs/` | Correct taxonomy folder per `docs/INDEX.md` |
| Depth Audit Guard | Any roadmap deepening / new semantic layer | Explicit scoring before continuing deeper |
| Workspace Isolation Guard | Opening projects in CVF root | Sibling workspace only |
| Test Depth Classification Guard | Any test count report in assessment/review/release | T1–T4 tier breakdown + Meaningful Assertion Rate |
| **Architecture Check Guard** | **Any new version/layer/extension/module proposal** | **`docs/CVF_CORE_KNOWLEDGE_BASE.md` ← file này** |

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
| Tổng số skills | **141 skills** |
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
| Web Tests | 1764 passing |
| Kernel Tests (v1.7.1) | 51 passing |
| v1.8 Safety Hardening Tests | **42 passing** (12 describe blocks) |
| v1.9 Reproducibility Tests | **29 passing** |
| v2.0 Non-Coder Runtime Tests | **32 passing** |
| v1.2.1 External Integration Tests | **29 passing** |
| **Total Kernel+Extension Tests** | **183 tests** |
| Web Coverage | 93.05% Stmts |
| Kernel Coverage | 96.45% Stmts · 91.41% Branch · 99.09% Fn · 97.01% Lines |
| Skills | 141 skills, 12 domains |
| Agent Tools | 34 tools |
| Overall Score | 9.4/10 (independent) · 8.5/10 (Antigravity) |
| **v1.7.3 addition** | Runtime Adapter Hub: 5 contracts + 4 adapters |

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

## XIII. KEY DOCS ĐỂ ĐỌC THÊM

| File | Khi nào đọc |
|------|------------|
| [`docs/reference/CVF_POSITIONING.md`](reference/CVF_POSITIONING.md) | Cần hiểu identity CVF, anti-patterns |
| [`docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`](reference/CVF_ARCHITECTURE_DIAGRAMS.md) | Cần xem Mermaid diagrams đầy đủ |
| [`docs/CVF_ARCHITECTURE_DECISIONS.md`](CVF_ARCHITECTURE_DECISIONS.md) | Xem ADR history, quyết định thiết kế |
| [`docs/baselines/CVF_CORE_COMPAT_BASELINE.md`](baselines/CVF_CORE_COMPAT_BASELINE.md) | Chạy compat check |
| [`EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md`](../EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md) | Hiểu reference vs production separation |

---

## XIV. CVF EXTENSION RULES (Bất di bất dịch)

> 🔒 **Ượu tiên cao nhất.** Ba quy tắc này áp dụng cho mọi thứ được bổ sung vào CVF, không có ngoại lệ.

### RULE 1 — Cấu trúc hiện tại luôn là chuẩn

> **CVF củ luôn là điểm tham chiếu, không phải philosphy mới.**

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
