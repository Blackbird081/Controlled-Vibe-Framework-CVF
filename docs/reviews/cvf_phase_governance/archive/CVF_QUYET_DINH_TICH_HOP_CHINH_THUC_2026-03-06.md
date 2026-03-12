# 📌 QUYẾT ĐỊNH CHÍNH THỨC — Tích Hợp 13 De_xuat + 6 Docs + Whitepaper

**Ngày:** 2026-03-06  
**Phương pháp:** Self-audit theo CVF Decision Framework + Architecture Check + VERSIONING.md  
**Trạng thái:** CHỐT — Chờ User kiểm tra kết quả cuối cùng

---

## I. SELF-AUDIT LOG

### Audit #1: Phân loại De_xuat

**Kết quả:** 13 De_xuat chia thành 2 nhóm tự nhiên dựa trên bản chất:

| Nhóm | Bản chất | De_xuat | Decision Framework |
|---|---|---|---|
| **A** | Mở rộng logic bên trong files v1.1.1 đã có | 01-07, 11p, 12p | Scope=extension, Dep=v1.1.1, User=transparent → **Sub-extension** |
| **B** | Concept MỚI chưa tồn tại trong CVF | 08-13, docs, WP | Scope=new, Dep=3 modules mới, User=thay đổi workflow → **MAJOR version** |

### Audit #2: Branch vs Clone repo?

| Tiêu chí | Branch `cvf-next` | Clone repo mới |
|---|---|---|
| CVF Rule R1 ("Existing structure = standard") | ✅ Giữ cùng structure | ❌ Phá single-source |
| CVF Rule R2 ("Compatible, additive") | ✅ Merge ngược dễ | ❌ Manual sync |
| Git history lineage | ✅ Liên tục | ❌ Đứt gãy |
| Governance integrity | ✅ Cùng guards/ADRs | ⚠️ Guards tách rời |

**→ Quyết định: Branch `cvf-next` trong cùng repo.**

### Audit #3: Version number cho GĐ2?

VERSIONING.md Section "MAJOR Version": _"A MAJOR change occurs when: Core philosophy of CVF changes"_

- "Git for AI Development" thêm Layer 0 Foundation Primitives → **thay đổi core model**
- Nhưng CVF hiện tại KHÔNG bị phá → backward compatible
- "Git for AI" **bổ sung nền móng** dưới Layer 1, không thay thế Layer 1

**→ Quyết định: v3.0** — MAJOR vì thêm foundation layer, nhưng không breaking.

### Audit #4: GĐ1 cần tách branch không?

- GĐ1 = Hardening (mở rộng file existing, không thêm module)
- Theo CVF: sub-extension = PATCH level
- Rủi ro thấp, backward compatible 100%

**→ Quyết định: GĐ1 trực tiếp trên `main`**, không cần branch riêng.

---

## II. PHƯƠNG ÁN TỐI ƯU — CHỐT

```
┌────────────────────────────────────────────────┐
│        PHƯƠNG ÁN: 2 GIAI ĐOẠN                  │
│                                                 │
│  GĐ1: v1.1.2 Hardening (trên main)             │
│  ├── Fix lỗ hổng v1.1.1                        │
│  ├── Không phá treeview, không thêm module     │
│  └── Backward compatible 100%                  │
│                                                 │
│  GĐ2: branch cvf-next → merge v3.0             │
│  ├── Xây CVF Core (Git for AI Development)     │
│  ├── Thêm Layer 0 Foundation Primitives        │
│  └── Define CVF Core vs CVF Full identity      │
└────────────────────────────────────────────────┘
```

---

## III. GĐ1 — v1.1.2 PHASE GOVERNANCE HARDENING

**Where:** Trực tiếp trên `main`  
**Layer:** 1.5 (mở rộng v1.1.1)  
**Scope:** Mở rộng logic BÊN TRONG files hiện có, KHÔNG thêm module

### Checklist thực hiện

| # | Nội dung | File thay đổi | Loại |
|---|---|---|---|
| 1 | **Pipeline Execution Order** — GOVERNANCE_PIPELINE const cố định thứ tự 7 modules | `governance/phase_gate/gate.rules.ts` | Mở rộng |
| 2 | **Trust Boundary** — Artifact hash verification trước khi governance đọc | `governance/phase_protocol/artifact.registry.ts` | Mở rộng |
| 3 | **Hash Ledger** — SHA256 cho mỗi artifact, detect silent rewrite | `governance/reports/governance.audit.log.ts` | Mở rộng |
| 4 | **Capability Isolation** — Phase capabilities (read/write permissions theo phase) | `governance/phase_protocol/phase.protocol.ts` | Mở rộng |
| 5 | **Self-Debugging** — Anomaly detection: dead path, unreachable state, loop trap | `governance/scenario_simulator/execution.trace.ts` | Mở rộng |
| 6 | **System Invariants** — Cross-state invariant check sau scenario simulation | `governance/scenario_simulator/scenario.generator.ts` | Mở rộng |
| 7 | **Governance Executor** — Runtime pipeline orchestrator | `runtime/governance.executor.ts` (file MỚI, NGOÀI /governance) | Thêm mới |
| 8 | **5 Design Invariants** — Framework governance rules | `EXTENSIONS/CVF_v1.1.1_*/README.md` + KB | Documentation |
| 9 | **Evolution Governance** — Core/Verification/Observability split doc | `docs/CVF_CORE_KNOWLEDGE_BASE.md` | Documentation |

**Ưu điểm:**
- ✅ Giữ nguyên treeview /governance (7 modules không thay đổi)
- ✅ Không thêm module bên trong /governance
- ✅ Governance executor ở layer riêng (đúng De_xuat_01: engine ≠ executor)
- ✅ User không cần thay đổi cách dùng

---

## IV. GĐ2 — BRANCH `cvf-next` → v3.0

**Where:** Branch `cvf-next` tách từ `main`  
**Layer mới:** Layer 0 — Foundation Primitives  
**Scope:** Paradigm shift — thêm CVF Core identity

### Checklist thực hiện

| # | Nội dung | Files/Modules | Nguồn |
|---|---|---|---|
| 1 | **AI Commit Model** — Schema, Parser, Validator | `governance/ai_commit/` (3 files) | De_xuat 08-10, docs/ai_commit_model |
| 2 | **Artifact Staging** — Candidate → Governance → Accepted flow | `governance/artifact_staging/` | docs/CVF vs Git mục 10-12 |
| 3 | **Artifact Ledger** — Version tracking + hash + lineage | `governance/artifact_ledger/` | De_xuat 08-09 |
| 4 | **Process Model** — Phase transition rules + formal process | `governance/process_model/` | De_xuat 09, docs/git_for_ai_model |
| 5 | **3+1 Primitives definition** — Commit + Artifact + Process + Staging | Formal docs | De_xuat 11, docs/cvf_architecture |
| 6 | **CVF Core vs CVF Full** — 2 editions identity | README, architecture docs | docs/cvf_architecture mục 8 |
| 7 | **5 Design Invariants** — Enforce trong governance | Guard files | De_xuat 12 |
| 8 | **Whitepaper** — "Git for AI Development" | `docs/git_for_ai/` | Whitepaper file |
| 9 | **Architecture Map** — Entry point document | `docs/cvf_architecture.md` | De_xuat 13 |
| 10 | **Adoption Strategy** — 5-phase deployment spec | `docs/cvf_adoption.md` | docs/CVF Adoption Strategy |
| 11 | **Skill Lifecycle** — 6-state model | `docs/skill_lifecycle.md` | docs/skill_lifecycle |
| 12 | **CVF vs Git mapping** — Primitive equivalence | `docs/git_for_ai/cvf_vs_git.md` | docs/CVF vs Git |

### Architecture sau khi merge v3.0

```
┌─────────────────────────────────────────────────────────┐
│ 🏛️ LAYER 0 — FOUNDATION PRIMITIVES (MỚI — v3.0)       │
│    CVF Core = Git for AI Development                     │
│    Commit + Artifact + Process + Staging                 │
├─────────────────────────────────────────────────────────┤
│ 📖 LAYER 1 — CORE (giữ nguyên)                          │
│    v1.0 Manifesto, v1.1, v1.2, v1.5.x                   │
├─────────────────────────────────────────────────────────┤
│ 🛡️ LAYER 1.5 — DEV GOVERNANCE (v1.1.1 + v1.1.2)        │
│    Phase Governance Protocol + Hardening                 │
├─────────────────────────────────────────────────────────┤
│ ⚙️ LAYER 2 — TOOLS (giữ nguyên)                         │
│    v1.3 SDK, v1.2.1, v1.2.2                             │
├─────────────────────────────────────────────────────────┤
│ ⚙️ LAYER 2.5 — SAFETY RUNTIME (giữ nguyên)              │
│    v1.7.1, v1.8, v1.9                                   │
├─────────────────────────────────────────────────────────┤
│ 🌐 LAYER 3 — PLATFORM (giữ nguyên)                      │
│    v1.6 Agent Platform                                   │
├─────────────────────────────────────────────────────────┤
│ 🛡️ LAYER 4 — SAFETY UI (giữ nguyên)                     │
│    v1.7.2, v2.0                                         │
├─────────────────────────────────────────────────────────┤
│ 🔌 LAYER 5 — ADAPTER HUB (giữ nguyên)                   │
│    v1.7.3                                               │
└─────────────────────────────────────────────────────────┘
```

### CVF Identity sau v3.0

```
CVF CORE (Git for AI Development)
  = 3+1 Primitives (Commit + Artifact + Process + Staging)
  = ≈ 500-800 LOC
  Target: AI dev teams

CVF FULL (AI Governance Framework)
  = CVF Core + Verification Plugins + Observability
  = Toàn bộ CVF hiện tại + Layer 0
  Target: Enterprise, AI safety, regulated industries
```

---

## V. LỘ TRÌNH THỰC HIỆN

```
HIỆN TẠI (2026-03-06)
       │
       ▼
 GĐ1: v1.1.2 Hardening ──────── trên main
       │  • Pipeline Order
       │  • Trust Boundary + Hash
       │  • Capability Isolation
       │  • Self-Debugging + Invariants
       │  • Governance Executor
       │  • Docs (Invariants, Evolution)
       │  • Commit + ADR-015
       │
       ▼
 GĐ2: cvf-next branch ────────── tách branch
       │  • AI Commit Model
       │  • Artifact Staging + Ledger
       │  • Process Model
       │  • 3+1 Primitives
       │  • CVF Core vs Full identity
       │  • Whitepaper + Architecture Map
       │  • Adoption Strategy
       │
       ▼
 MERGE: cvf-next → main ─────── v3.0 release
       │  • Layer 0 thêm vào architecture
       │  • README update (CVF Core + Full)
       │  • ADR-016
       │
       ▼
 CVF V3.0 — Git for AI Development + AI Governance Framework
```

---

## VI. CAM KẾT

Tôi (Antigravity) chịu trách nhiệm với phương án này dựa trên:

1. **CVF Decision Framework** — 3/3 criteria cho Nhóm B → MAJOR version
2. **VERSIONING.md** — "Core philosophy changes" = MAJOR → v3.0
3. **CVF Rule R1** — Structure hiện tại là standard → branch, không clone
4. **CVF Rule R2** — Compatible, additive → Layer 0 dưới Layer 1, không phá gì
5. **Architecture Check Guard** — Layer 0 mới không bypass Layer 1+

**Rủi ro đã đánh giá:**
- GĐ1: Rủi ro THẤP (mở rộng file existing)
- GĐ2: Rủi ro TRUNG BÌNH (paradigm shift nhưng additive, không breaking)
- Version sprawl: KIỂM SOÁT ĐƯỢC (CVF Core = minimal, CVF Full = comprehensive)
