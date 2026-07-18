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
│     v1.5.2 — Skill Library (62 active skills, 12 domains)   │
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

Authoritative inventory lives in:

- `docs/reference/CVF_MODULE_INVENTORY.md`

This Core KB keeps Section II as the placement map. Do not duplicate the full
version table here; update the module inventory when version/folder/status facts
change.

---

## IV. 4-PHASE PROCESS (CVF Core — Bất biến)

Canonical process rules live in:

- `CLAUDE.md`

Summary boundary:

- Phase A: Discovery — Human decides requirements
- Phase B: Design — Human decides architecture
- Phase C: Build — AI executes approved spec
- Phase D: Review — Human validates and approves/fixes

Do not skip or merge phases.

---

## V. RISK MODEL CVF GỐC (R0–R3)

Canonical risk model lives in:

- `docs/concepts/risk-model.md`

Quick orientation:

| Dashboard | Risk |
|---|---|
| Safe | R0 |
| Attention | R1 |
| Review | R2 |
| Dangerous | R3 |

---

## VI. 5-LAYER SAFETY KERNEL (v1.7.1 — Đang chạy)

Authoritative owner surfaces:

- Section II of this file for layer placement.
- `docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md` for architecture diagrams.

Kernel summary:

`Domain Lock -> Contract Runtime -> Contamination Guard -> Refusal Router -> Creative Control -> Audit Logger`

---

## VII. GOVERNANCE SYSTEM

Authoritative owner surfaces:

- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/toolkit/05_OPERATION/`
- `governance/compat/`

This Core KB records only the governance-system pointer. Guard triggers,
machine checks, active/archive registries, and compatibility commands must be
read from the owner surfaces above.

---

## VIII. SKILL LIBRARY (v1.5.2)

Authoritative skill-library facts live in:

- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/README.md`

Current orientation fact: 62 active skills across 12 domains.

---

## IX. CẤU TRÚC FILE HỆ THỐNG

Authoritative repository-structure surfaces:

- `ARCHITECTURE.md`
- `CLAUDE.md`
- `docs/reference/CVF_MODULE_INVENTORY.md`

This Core KB does not duplicate the full tree. Use the owner files above before
moving roots, adding extension folders, or making public/provenance claims.

---

## X. QUALITY METRICS

Authoritative quality and release status surfaces:

- `docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md`
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `CHANGELOG.md`

Do not update quality, readiness, test-count, or score claims in this Core KB
unless this file itself is the reviewed source for a structural release.

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

## XIII. CVF MCP SERVER (M1-M7)

Authoritative MCP owner surface:

- `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`

This Core KB does not duplicate MCP tools, tests, quick-start commands, or
feature tables. Read the MCP README before changing MCP behavior, CLI commands,
or IDE integration claims.

---

## XIV. KEY DOCS ĐỂ ĐỌC THÊM

| File | Khi nào đọc |
|------|------------|
| [`docs/reference/CVF_POSITIONING.md`](reference/CVF_POSITIONING.md) | Identity CVF, anti-patterns |
| [`docs/reference/CVF_ARCHITECTURE_DIAGRAMS.md`](reference/CVF_ARCHITECTURE_DIAGRAMS.md) | Mermaid architecture diagrams |
| [`docs/reference/CVF_MODULE_INVENTORY.md`](reference/CVF_MODULE_INVENTORY.md) | Version, module, folder, and owner inventory |
| [`docs/CVF_ARCHITECTURE_DECISIONS.md`](CVF_ARCHITECTURE_DECISIONS.md) | ADR history |
| [`EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md`](../EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/README.md) | MCP Server usage guide |
| [`governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`](../governance/toolkit/05_OPERATION/CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md) | Doctrine-first / governance-first absorption |
| [`governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`](../governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md) | `TRUSTED_FOR_VALUE_PROOF` admission boundary |
Guard registry marker set: `CVF_ACTIVE_ARCHIVE_GUARD.md`, `CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`, `CVF_ADR_GUARD.md`, `CVF_AGENT_HANDOFF_GUARD.md`, `CVF_AGENT_HANDOFF_TRANSITION_GUARD.md`, `CVF_AGENT_REVIEW_ANTI_COLLUSION_GUARD.md`, `CVF_ARCHITECTURE_CHECK_GUARD.md`, `CVF_BARREL_SMOKE_OWNERSHIP_GUARD.md`, `CVF_BASELINE_UPDATE_GUARD.md`, `CVF_BATCH_CONTRACT_DETERMINISM_GUARD.md`, `CVF_BOARDROOM_RUNTIME_GUARD.md`, `CVF_BUG_DOCUMENTATION_GUARD.md`, `CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD.md`, `CVF_CAPABILITY_INTAKE_PIPELINE_GUARD.md`, `CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md`, `CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md`, `CVF_CONTINUATION_CHAIN_GUARD.md`, `CVF_CORE_GUARD_SELF_PROTECTION_GUARD.md`, `CVF_CORPUS_COMPLETENESS_AND_REPORT_INTEGRITY_GUARD.md`, `CVF_CORPUS_INTELLIGENCE_CLASSIFICATION_GUARD.md`, `CVF_CORPUS_TO_KNOWLEDGE_MAP_RECONCILIATION_GUARD.md`, `CVF_DEPTH_AUDIT_GUARD.md`, `CVF_DIAGRAM_VALIDATION_GUARD.md`, `CVF_DOCUMENT_NAMING_GUARD.md`, `CVF_DOCUMENT_STORAGE_GUARD.md`, `CVF_EXECUTE_ROUTE_STEP_SEQUENCE_GUARD.md`, `CVF_EXTENSION_PACKAGE_CHECK_GUARD.md`, `CVF_EXTENSION_VERSIONING_GUARD.md`, `CVF_FAST_LANE_GOVERNANCE_GUARD.md`, `CVF_GC051_CORPUS_SCAN_REGISTRY_GUARD.md`, `CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`, `CVF_GOVERNED_FILE_SIZE_GUARD.md`, `CVF_GOVERNED_PACK_CONTRACT_GUARD.md`, `CVF_GUARD_AUTHORING_STANDARD_GUARD.md`, `CVF_GUARD_REGISTRY_GUARD.md`, `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md`, `CVF_KNOWLEDGE_ABSORPTION_PRIORITY_GUARD.md`, `CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`, `CVF_MEMORY_GOVERNANCE_GUARD.md`, `CVF_MULTI_AGENT_REVIEW_DOC_GUARD.md`, `CVF_PREPUBLIC_P3_READINESS_GUARD.md`, `CVF_PRODUCT_VALUE_VALIDATION_GUARD.md`, `CVF_PROGRESS_TRACKER_SYNC_GUARD.md`, `CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD.md`, `CVF_PYTHON_AUTOMATION_SIZE_GUARD.md`, `CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD.md`, `CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD.md`, `CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD.md`, `CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD.md`, `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD.md`, `CVF_SURFACE_SCAN_CONTINUITY_GUARD.md`, `CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`, `CVF_TEST_DEPTH_CLASSIFICATION_GUARD.md`, `CVF_TEST_DOCUMENTATION_GUARD.md`, `CVF_TEST_PARTITION_OWNERSHIP_GUARD.md`, `CVF_WORKSPACE_ISOLATION_GUARD.md`

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

> **Quy tắc:** Mỗi khi version/layer mới được implement hoặc nâng cấp, **phải cập nhật** Section II của `CVF_CORE_KNOWLEDGE_BASE.md` và `docs/reference/CVF_MODULE_INVENTORY.md` ngay lập tức.

**Cụ thể phải update:**
- **Section II** (Layer Diagram): thêm version mới vào đúng layer, ghi trạng thái (Spec/Implemented)
- **`docs/reference/CVF_MODULE_INVENTORY.md`**: cập nhật trạng thái, folder, owner
- **Owner quality/release docs**: thêm test-count hoặc release evidence mới khi có
- **Header**: cập nhật version hiện tại

**Tại sao bắt buộc:**
- File này là **base cho tất cả lần bổ sung sau** — nếu không update, contributor sau sẽ đề xuất dựa trên thông tin cũ
- Governance check sẽ dẫn vào file này — nếu file lỗi thời thì governance cũng sai theo
- Giữ tính **liên tục** và **tự cập nhật** — không cần nhớ, chỉ cần follow rule

```
❌ SAI:  Implement v3.0 xong → quên update Knowledge Base → contributor sau không biết v3.0 tồn tại
✅ ĐÚNG: Implement v3.0 xong → Update Section II + Module Inventory + owner evidence docs ngay → Commit cùng lúc
```

---

> **Cập nhật file này khi:** CVF có major structural change hoặc new layer/version được chính thức release. **(Rule 4: BẮT BUỘC)**
> **Không cập nhật khi:** Chỉ thêm skills, fix bugs, hoặc update docs thông thường.
> **Vị trí cố định:** `docs/CVF_CORE_KNOWLEDGE_BASE.md` — không được di chuyển hay đổi tên.

---

## XV. QUALITY ASSESSMENT CANON

Canonical owner:

- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD.md`

Quality claims must use the canonical rubric and governed evidence, not
agent-private scoring notes. Trước mọi fresh `GC-018`, phải đọc active quality
assessment; trước mọi fresh `GC-018`, phải đọc active quality assessment.

---

## XVI. PRE-PUBLIC P3 EXECUTION ISOLATION

Canonical owner:

- `docs/reference/CVF_PREPUBLIC_P3_READINESS.md`

P3 relocation remains isolated from direct `cvf-next` execution until the owner
standard and matching readiness gates say otherwise.

---

## XVII. MARKDOWN STRUCTURAL COMPLETENESS

Canonical owner:

- `docs/reference/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_STANDARD.md`
- `governance/toolkit/05_OPERATION/CVF_MARKDOWN_STRUCTURAL_COMPLETENESS_GUARD.md`
- `governance/compat/check_markdown_structural_completeness.py`
- `governance/compat/check_corpus_intelligence_classification.py`

Markdown structural completeness requires new governed Markdown to satisfy its
artifact-specific structural section set before ready, dispatch, closure, or
public-sync claims.

---

## XVIII. SESSION MEMORY FRONT DOOR

Canonical owners:

- `CVF_SESSION_MEMORY.md`
- `CVF_SESSION/ACTIVE_SESSION_STATE.json`
- `governance/compat/check_active_session_state.py`

Agents must resolve the active-state registry before treating a handoff as
current.

---

## XIX. GOVERNED FILE MAINTAINABILITY PLANNING

Canonical owners:

- `governance/toolkit/05_OPERATION/CVF_GOVERNED_FILE_SIZE_GUARD.md`
- `governance/compat/check_governed_file_size.py`

Touched governed files near threshold must be split, rotated, archived, or
materially reduced in the same batch before closure.
