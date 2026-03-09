# CVF UNIFIED ROADMAP 2026

> **Loại tài liệu:** Master Roadmap — Nguồn chân lý duy nhất
> **Ngày tạo:** 2026-03-09
> **Cơ sở quyết định:** `CVF_ROADMAP_CONSOLIDATION_AUDIT_2026-03-09.md` (Depth Audit 9/10)
> **Mục tiêu:** CVF → AI Governance Infrastructure

---

## 1. DASHBOARD — Toàn cảnh 1 phút

```
TRACK I:  Hardening (Close W1-W7)          ████████░░ 75%   ← ĐANG CHẠY
TRACK II: Ecosystem Restructure            ██░░░░░░░░ 20%   ← ĐANG CHUẨN BỊ
TRACK III: Ecosystem Expansion             ░░░░░░░░░░  0%   ← BLOCKED BY TRACK I
```

| Track | Phases | Tasks | Status | Next Action |
|---|---|---|---|---|
| **I. Hardening** | 0-6 | ~50 items | 75% — Phase 0,5 DONE; Phase 1,3,4,6 MOSTLY DONE; Phase 2 OPEN NEXT | Close W1 control plane unification |
| **II. Eco Restructure** | 1 (Eco) | 17 tasks | 60% — Doctrine ✅, VOM ✅, Guards ✅, Blueprint ✅, ECOSYSTEM/ ✅ | VOM Quick Start + Archive |
| **III. Eco Expansion** | 2-5 (Eco) | 65 tasks | 0% — Blocked by Track I W1-W4 | Wait until W1-W4 closed |

---

## 2. TRACK I — Hardening CVF (Close Weaknesses W1-W7)

> **Detail:** `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`
> **Principle:** "Close first, expand later" (§9 Hardening Roadmap)

| Phase | Weakness | Status | Summary |
|---|---|---|---|
| **Phase 0** | Baseline freeze | ✅ **DONE** | Baseline, executive review, decision matrix, trace chain, rotation rules |
| **Phase 1** | W1 — Unified control plane | 🟡 **MOSTLY DONE** | Contract, snapshot, resolver, registry — chưa single-source cho toàn ecosystem |
| **Phase 2** | W2 — E2E conformance | 🔵 **STRONG BASELINE** | 84/84 scenarios PASS, 18/18 critical anchors, 17/17 coverage groups — chưa phải full release gate |
| **Phase 3** | W3 — Skill governance | 🟡 **MOSTLY DONE** | Blocking, successor, dependency, phase compat — broader rollout policy còn mở |
| **Phase 4** | W4 — Durable execution | 🟡 **MOSTLY DONE** | Rollback, replay, checkpoint/resume, remediation — broader orchestration còn mở |
| **Phase 5** | W5-W6 — Release discipline | ✅ **DONE** | Release manifest, module inventory, maturity matrix |
| **Phase 6** | W7 — Enterprise evidence | ⏸ **DEPTH-FROZEN** | 4 packet postures, 8 runtime families, CF-084 — Depth Audit 3/10 = DEFER |

### Track I — Decision Rules

- Mỗi phase mở thêm layer → phải qua **Depth Audit** (§1.5, score ≥ 8/10)
- Ưu tiên: `risk reduced` > `detail added` > `semantic perfection`
- Phase 6 không mở thêm trừ khi có real risk mới

---

## 3. TRACK II — Ecosystem Restructure (Phase 1 Eco)

> **Detail:** `CVF_Restructure/Independent Review/CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` → Phase 1
> **ADR:** `CVF_Restructure/Independent Review/ADR-021_CVF_ECOSYSTEM_RESTRUCTURE.md`

| Section | Tasks | Status |
|---|---|---|
| 1.1 Doctrine Layer | 5 tasks | ✅ DONE — `ECOSYSTEM/doctrine/` (5 files) |
| 1.2 VOM (Operating Model) | 3 tasks | ✅ 2/3 DONE — `ECOSYSTEM/operating-model/` (2 files) |
| 1.3 Repository Restructure | 5 tasks | ✅ 4/5 DONE — `ECOSYSTEM/` created, README updated |
| 1.4 Governance Pipeline Blueprint | 2 tasks | ✅ DONE — `CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` |
| 1.5 Governance Enforcement | 3 tasks | ✅ DONE — Extension Versioning + Guard Registry + ADR-021 |
| 1.6 Archive CVF_Restructure | 4 tasks | 🔲 Chưa bắt đầu |

**Dependency:** Track II có thể chạy song song với Track I (không block nhau).

---

## 4. TRACK III — Ecosystem Expansion (Phase 2-5 Eco)

> **Detail:** `CVF_Restructure/Independent Review/CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` → Phase 2-5
> **Blueprint:** `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md`

| Phase | Key Deliverables | Tasks | Status | Blocked By |
|---|---|---|---|---|
| **Phase 2** (Q3 2026) | Intent Validation, NL Policy (Triple-S), LLM Risk, Domain Guards, Hierarchical RAG | 23 | 🔲 | Track I: W1, W2, W3 |
| **Phase 3** (Q4 2026) | Agent Guard SDK, Governance Canvas, CLI, Browser Extension | 17 | 🔲 | Track I: W4 + Phase 2 |
| **Phase 4** (2027) | Agent Identity, Graph Governance, Conflict Detection, Plugins | 8 | 🔲 | Phase 3 |
| **Phase 5** (2028+) | Task Marketplace, Reputation System, Agent Economy | 5 | 🔲 | Phase 4 |

### Mapping: Hardening Directions → Ecosystem Phases

| Hardening Direction | Ecosystem Phase | Notes |
|---|---|---|
| Direction A (Agent Operating Substrate) | Phase 2 (Intelligence) | Concepts evolved into concrete tasks |
| Direction B (Policy-as-Code Runtime) | Phase 2 (NL Policy Triple-S) | Triple-S architecture replaces concept |
| Direction C (Multi-Agent Governance) | Phase 4 (Governance Network) | Graph + Identity added |
| Direction D (Enterprise Adoption) | Phase 3 (Product Packaging) | SDK + UI + CLI added |

---

## 5. DEPENDENCY MAP

```
TRACK I (Hardening)                    TRACK II (Restructure)
═══════════════════                    ══════════════════════
Phase 0 ✅ ──────────────────────────→ 1.5 Guards ✅
Phase 5 ✅ ──────────────────────────→ 1.3 Restructure
                                       1.1 Doctrine  ──┐
Phase 1 (W1) ─┐                        1.2 VOM ───────┤
Phase 2 (W2) ─┤                        1.4 Blueprint ✅│
Phase 3 (W3) ─┼── ALL MUST CLOSE ───→  1.6 Archive ───┘
Phase 4 (W4) ─┘         │                    │
                         │             TRACK III (Expansion)
                         │             ══════════════════════
                         └──────────→ Phase 2 Eco (Intelligence)
                                           │
                                      Phase 3 Eco (Packaging)
                                           │
                                      Phase 4 Eco (Network)
                                           │
                                      Phase 5 Eco (Economy)
```

### Critical Path

```
W1 Close → W2 Close → W3 Close → W4 Close → Eco Phase 2 → Eco Phase 3 → ...
     ↑                                            ↑
     └── Track I (hardening)                      └── Track III (expansion)

Track II (restructure) runs PARALLEL to everything above
```

---

## 6. DECISION RULES

### 6.1 Khi nào chuyển từ Track I sang Track III?

Track III chỉ bắt đầu khi Track I đạt tất cả:

```
✅ W1 — Control plane có single-source state cho ecosystem
✅ W2 — Conformance có release-grade gate (đã đạt: 84/84)
✅ W3 — Skill governance có runtime blocking
✅ W4 — Durable execution có checkpoint/recovery
```

W2 đã đạt ở mức baseline. W1, W3, W4 cần close phần "MOSTLY DONE" → "DONE".

### 6.2 Depth Audit vẫn áp dụng

Mọi track, mọi phase muốn mở thêm layer → phải qua 5 câu hỏi Depth Audit:
1. Risk reduction ≠ 0?
2. Decision value ≠ 0?
3. Machine enforcement ≠ 0?
4. Operational cost chấp nhận được?
5. Opportunity cost — có gì quan trọng hơn?

Score ≥ 8 → CONTINUE. Score 6-7 → REVIEW. Score ≤ 5 → DEFER.

### 6.3 Guard Registry áp dụng

Mọi guard mới (ở bất kỳ track nào) → phải qua `check_guard_registry.py`.

---

## 7. NEXT ACTIONS (Cụ thể)

| # | Action | Track | Priority | Effort |
|---|---|---|---|---|
| 2 | **VOM Quick Start Guide** — Tài liệu giúp non-coders bắt đầu | Track II | P1 | Low |
| 3 | **Close W1** — Single-source governance contract cho ecosystem | Track I | P0 | High |
| 4 | **Close W3** — Broader skill rollout policy | Track I | P1 | Medium |
| 5 | **Close W4** — Broader durable execution coverage | Track I | P1 | Medium |
| 6 | **Archive CVF_Restructure** — Migrate + archive | Track II | P2 | Low |
| 7 | **Begin Eco Phase 2** — ONLY after W1-W4 closed | Track III | P2 | High |

---

## 8. REFERENCE FILES

| Document | Role |
|---|---|
| `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md` | Track I detail (974 lines) |
| `CVF_Restructure/Independent Review/CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` | Track II + III detail (430 lines) |
| `CVF_Restructure/Independent Review/CVF_ROADMAP_CONSOLIDATION_AUDIT_2026-03-09.md` | Audit dẫn tới quyết định hợp nhất |
| `CVF_Restructure/Independent Review/ADR-021_CVF_ECOSYSTEM_RESTRUCTURE.md` | Architecture decision record |
| `CVF_Restructure/Independent Review/CVF_STRATEGIC_INTEGRATION_REVIEW_2026-03-08.md` | Tích hợp 3 nguồn |
| `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md` | Blueprint cho Track III Phase 2-4 |

---

> **Nguyên tắc vận hành:** File này là nguồn chân lý. Khi status thay đổi → cập nhật bảng ở §1 + §2/3/4. Khi cần chi tiết → đọc file reference. Không duplicate nội dung.
