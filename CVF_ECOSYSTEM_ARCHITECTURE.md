# CVF ECOSYSTEM ARCHITECTURE — Master Blueprint & Treeview

> **Status:** Active — MANDATORY CHECKPOINT REFERENCE
> **Location:** Root level — for easy verification
> **Rule:** Mọi phase/task restructure phải đối chiếu file này trước và sau khi thực hiện.

---

## ⚠️ VERIFICATION RULE

> [!CAUTION]
> **KHÔNG ĐƯỢC tiến hành phase/task tiếp theo nếu chưa đối chiếu treeview dưới đây.**
> Mọi thay đổi cấu trúc (tạo folder, di chuyển file, đổi tên) phải:
> 1. Kiểm tra treeview TRƯỚC khi làm → biết file thuộc tầng nào
> 2. Kiểm tra treeview SAU khi làm → xác nhận đúng vị trí
> 3. Cập nhật treeview nếu có thay đổi cấu trúc mới

---

## 1. ARCHITECTURE SEPARATION

CVF tách biệt thành **2 tầng** — KHÔNG được trộn lẫn:

```
┌─────────────────────────────────────────────────────┐
│  TẦNG META — ECOSYSTEM/                             │
│  (Doctrine, Strategy, Operating Model)              │
│  WHY + WHAT + WHERE                                 │
│  → Governs everything below                         │
│  → Rarely changes (FROZEN doctrine)                 │
│  → Readable by non-coders                           │
└─────────────────────────┬───────────────────────────┘
                          │ governs
                          ▼
┌─────────────────────────────────────────────────────┐
│  TẦNG ENGINEERING — v1.0/ EXTENSIONS/ governance/   │
│  (Specs, Code, Guards, Tests, Docs)                 │
│  HOW                                                │
│  → Implements doctrine above                        │
│  → Changes with every version                       │
│  → Requires technical knowledge                     │
└─────────────────────────────────────────────────────┘
```

### Phân loại nhanh — File thuộc tầng nào?

| Nội dung | Tầng | Folder |
|----------|------|--------|
| Tư tưởng, nguyên lý, định vị | **META** | `ECOSYSTEM/doctrine/` |
| Chiến lược, roadmap, vision | **META** | `ECOSYSTEM/strategy/` |
| Mô hình vận hành (VOM) | **META** | `ECOSYSTEM/operating-model/` |
| Concepts, guides, tutorials | **ENGINEERING** | `docs/` |
| Extension code, specs | **ENGINEERING** | `EXTENSIONS/` |
| Guards, policies, toolkit | **ENGINEERING** | `governance/` |
| Tests, scripts | **ENGINEERING** | `tests/`, `scripts/` |
| Version specs (v1.0, v1.1) | **ENGINEERING** | `v1.0/`, `v1.1/` |

---

## 2. MASTER TREEVIEW — Current State

```
Controlled-Vibe-Framework-CVF/
│
│══════════════════════════════════════════════════════
│  ROOT FILES
│══════════════════════════════════════════════════════
├── README.md                           ← Entry point (links to ECOSYSTEM/)
├── CVF_ECOSYSTEM_ARCHITECTURE.md       ← THIS FILE (verification checkpoint)
├── CHANGELOG.md
├── LICENSE
├── .gitignore
│
│══════════════════════════════════════════════════════
│  TẦNG META — ECOSYSTEM/
│══════════════════════════════════════════════════════
├── ECOSYSTEM/
│   ├── README.md                       ← Overview + authority hierarchy
│   │
│   ├── doctrine/                       ← L0: Supreme Doctrine (FROZEN)
│   │   ├── CVF_ARCHITECTURE_PRINCIPLES.md   12 principles
│   │   ├── CVF_PRODUCT_POSITIONING.md       Mission + competitive table
│   │   ├── CVF_ECOSYSTEM_MAP.md             AI stack + 4 pillars
│   │   ├── CVF_LAYER_MODEL.md               L0-L6 layer architecture
│   │   └── CVF_DOCTRINE_RULES.md            Supreme layer governance rules
│   │
│   ├── operating-model/                ← L3: VOM
│   │   ├── CVF_AGENT_OPERATING_MODEL.md     For dev teams
│   │   └── CVF_BUILDER_MODEL.md             For non-coders
│   │
│   └── strategy/                       ← Direction + Roadmap
│       ├── CVF_STRATEGIC_SUMMARY.md         1-page strategic reference
│       └── CVF_UNIFIED_ROADMAP_2026.md      Master roadmap (3 tracks)
│
│══════════════════════════════════════════════════════
│  TẦNG ENGINEERING — CVF Core + Full
│══════════════════════════════════════════════════════
├── v1.0/                               ← Layer 0 (FROZEN)
│   ├── phases/
│   ├── governance/
│   └── ...
│
├── v1.1/                               ← Layer 0 (FROZEN)
│   ├── agents/
│   ├── governance/
│   └── ...
│
├── EXTENSIONS/                         ← Layer 1-5 (22 legacy + 12 CVF_ECO)
│   ├── Legacy Extensions (v1.1.1-v3.0)      ← 22 modules
│   │   ├── CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/
│   │   ├── CVF_v1.2_CAPABILITY_EXTENSION/
│   │   ├── CVF_v1.2.1_EXTERNAL_INTEGRATION/
│   │   ├── CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/
│   │   ├── CVF_v1.3_IMPLEMENTATION_TOOLKIT/
│   │   ├── CVF_v1.3.1_OPERATOR_EDITION/
│   │   ├── CVF_v1.4_USAGE_LAYER/
│   │   ├── CVF_v1.5_UX_PLATFORM/
│   │   ├── CVF_v1.5.1_END_USER_ORIENTATION/
│   │   ├── CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
│   │   ├── CVF_v1.6_AGENT_PLATFORM/
│   │   ├── CVF_v1.6.1_GOVERNANCE_ENGINE/
│   │   ├── CVF_v1.7_CONTROLLED_INTELLIGENCE/
│   │   ├── CVF_v1.7.1_SAFETY_RUNTIME/
│   │   ├── CVF_v1.7.2_SAFETY_DASHBOARD/
│   │   ├── CVF_v1.7.3_RUNTIME_ADAPTER_HUB/
│   │   ├── CVF_v1.8_SAFETY_HARDENING/
│   │   ├── CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/
│   │   ├── CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/
│   │   ├── CVF_v2.0_NONCODER_SAFETY_RUNTIME/
│   │   ├── CVF_v3.0_CORE_GIT_FOR_AI/
│   │   ├── ARCHITECTURE_SEPARATION_DIAGRAM.md
│   │   └── examples/
│   │
│   └── CVF_ECO Extensions (Track III)        ← 12 modules, 434 tests ✅
│       ├── CVF_ECO_v1.0_INTENT_VALIDATION/       ← 41 tests
│       ├── CVF_ECO_v1.1_NL_POLICY/                ← 46 tests
│       ├── CVF_ECO_v1.2_LLM_RISK_ENGINE/         ← 37 tests
│       ├── CVF_ECO_v1.3_DOMAIN_GUARDS/          ← 39 tests
│       ├── CVF_ECO_v1.4_RAG_PIPELINE/             ← 34 tests
│       ├── CVF_ECO_v2.0_AGENT_GUARD_SDK/         ← 43 tests
│       ├── CVF_ECO_v2.1_GOVERNANCE_CANVAS/       ← 30 tests
│       ├── CVF_ECO_v2.2_GOVERNANCE_CLI/          ← 39 tests
│       ├── CVF_ECO_v2.3_AGENT_IDENTITY/          ← 39 tests
│       ├── CVF_ECO_v2.4_GRAPH_GOVERNANCE/         ← 27 tests
│       ├── CVF_ECO_v3.0_TASK_MARKETPLACE/         ← 29 tests
│       └── CVF_ECO_v3.1_REPUTATION/              ← 30 tests
│
├── governance/                         ← Guards, policies, toolkit
│   ├── toolkit/
│   │   └── 05_OPERATION/               15 guards
│   ├── compat/                         Automated check scripts
│   └── skill-library/
│
├── docs/                               ← Engineering documentation
│   ├── concepts/                       ← Including CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md
│   ├── guides/
│   ├── tutorials/
│   ├── reference/
│   ├── reviews/
│   │   └── cvf_phase_governance/       Hardening roadmap + reports
│   ├── assessments/
│   ├── baselines/
│   ├── roadmaps/                       ← Engineering roadmaps (migration, skill upgrade...)
│   └── CVF_CORE_KNOWLEDGE_BASE.md
│
├── tests/                              ← 341 tests
├── scripts/                            ← Automation scripts
├── tools/                              ← CLI tools
│
│══════════════════════════════════════════════════════
│  LOCAL / PRIVATE
│══════════════════════════════════════════════════════
├── .private_reference/                 ← ignored local recovery space (non-canonical)
│   └── legacy/CVF_Restructure/         Optional historical recovery copy only
│
└── .github/workflows/                  ← CI/CD
```

---

## 3. PHASE VERIFICATION CHECKPOINTS

### Track II Phase 1.1 — Doctrine Integration ✅ DONE

```
EXPECTED:                              ACTUAL:
ECOSYSTEM/doctrine/                    ECOSYSTEM/doctrine/
├── CVF_ARCHITECTURE_PRINCIPLES.md     ├── CVF_ARCHITECTURE_PRINCIPLES.md  ✅
├── CVF_PRODUCT_POSITIONING.md         ├── CVF_PRODUCT_POSITIONING.md      ✅
├── CVF_ECOSYSTEM_MAP.md               ├── CVF_ECOSYSTEM_MAP.md            ✅
├── CVF_LAYER_MODEL.md                 ├── CVF_LAYER_MODEL.md              ✅
└── CVF_DOCTRINE_RULES.md              └── CVF_DOCTRINE_RULES.md           ✅
```

### Track II Phase 1.2 — VOM Integration ✅ DONE

```
EXPECTED:                              ACTUAL:
ECOSYSTEM/operating-model/             ECOSYSTEM/operating-model/
├── CVF_AGENT_OPERATING_MODEL.md       ├── CVF_AGENT_OPERATING_MODEL.md    ✅
├── CVF_BUILDER_MODEL.md               ├── CVF_BUILDER_MODEL.md            ✅
└── CVF_VOM_QUICK_START.md             └── CVF_VOM_QUICK_START.md          ✅
```

### Track II Phase 1.3 — Repository Restructure ✅ 4/5 DONE

```
EXPECTED:                              ACTUAL:
ECOSYSTEM/                             ECOSYSTEM/                          ✅
├── doctrine/  (5 files)               ├── doctrine/  (5 files)            ✅
├── operating-model/  (2+ files)       ├── operating-model/  (2 files)     ✅
├── strategy/  (2 files)               ├── strategy/  (2 files)            ✅
└── README.md                          └── README.md                       ✅

README.md links → ECOSYSTEM/           README.md links → ECOSYSTEM/        ✅
CVF_ECOSYSTEM_ARCHITECTURE.md at root  CVF_ECOSYSTEM_ARCHITECTURE.md       ✅
```

### Track II Phase 1.4 — Governance Pipeline ✅ DONE

```
EXPECTED:                              ACTUAL:
docs/concepts/                         docs/concepts/
└── CVF_HIERARCHICAL_GOVERNANCE_       └── CVF_HIERARCHICAL_GOVERNANCE_    ✅
    PIPELINE.md                            PIPELINE.md
```

### Track II Phase 1.5 — Governance Enforcement ✅ DONE

```
EXPECTED:                                  ACTUAL:
governance/toolkit/05_OPERATION/           governance/toolkit/05_OPERATION/
├── CVF_EXTENSION_VERSIONING_GUARD.md      ├── CVF_EXTENSION_VERSIONING_GUARD.md  ✅
└── CVF_GUARD_REGISTRY_GUARD.md            └── CVF_GUARD_REGISTRY_GUARD.md        ✅

governance/compat/                         governance/compat/
└── check_guard_registry.py                └── check_guard_registry.py            ✅
```

### Track II Phase 1.6 — Archive CVF_Restructure ✅ DONE

```
EXPECTED:                              ACTUAL:
visible root retired                   visible root retired                ✅
optional local copy under              .private_reference/legacy/          ✅
.private_reference/legacy/             (local-only if retained)
```

---

## 4. DEPENDENCY ARROWS — What governs what

```
ECOSYSTEM/doctrine/                         ← LEVEL 0: SUPREME
    │ defines principles for
    ▼
ECOSYSTEM/operating-model/                  ← LEVEL 3: HOW TO USE
    │ guides usage of
    ▼
ECOSYSTEM/strategy/                         ← STRATEGIC DIRECTION
    │ directs work in
    ▼
governance/ + docs/ + EXTENSIONS/           ← ENGINEERING IMPLEMENTATION
    │ verified by
    ▼
tests/ + governance/compat/                 ← VERIFICATION
    │ recorded in
    ▼
docs/reviews/ + CHANGELOG.md               ← EVIDENCE
```

---

> **Nguyên tắc:** File này phải được đối chiếu trước MỌI thao tác restructure. Nếu có thay đổi cấu trúc → cập nhật treeview tại §2 + checkpoint tại §3 trước khi commit.
