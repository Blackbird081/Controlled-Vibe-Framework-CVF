# CVF UNIFIED ROADMAP 2026

> **Loại tài liệu:** Master Roadmap — Nguồn chân lý duy nhất
> **Ngày tạo:** 2026-03-09
> **Cơ sở quyết định:** `CVF_ROADMAP_CONSOLIDATION_AUDIT_2026-03-09.md` (Depth Audit 9/10)
> **Mục tiêu:** CVF → AI Governance Infrastructure

---

## 1. DASHBOARD — Toàn cảnh 1 phút

```
TRACK I:  Hardening (Close W1-W7)          ██████████ 100%  ← ALL CLOSED ✅ W2 RELEASE-GRADE PASS
TRACK II: Ecosystem Restructure            ██████████ 100%  ← COMPLETE ✅ (Archive DONE)
TRACK III: Ecosystem Expansion             ██████████ 100%  ← COMPLETE ✅ Phase 2-5 (12 modules, 434 tests)
```

| Track | Phases | Tasks | Status | Next Action |
|---|---|---|---|---|
| **I. Hardening** | 0-6 | ~50 items | ✅ 85% — Phase 0-5 DONE; W1-W4 BASELINE; W2 RELEASE-GRADE PASS; Phase 6 DEPTH-FROZEN | See §2.1 Operational Reality |
| **II. Eco Restructure** | 1 (Eco) | 17 tasks | ✅ 100% — ALL SECTIONS COMPLETE incl. Archive | — (CLOSED) |
| **III. Eco Expansion** | 2-5 (Eco) | 65 tasks | ✅ 100% — Phase 2-5 ALL COMPLETE (434 tests, 12 extensions) | — (CLOSED) |

---

## 2. TRACK I — Hardening CVF (Close Weaknesses W1-W7)

> **Detail:** `docs/reviews/cvf_phase_governance/CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md`
> **Principle:** "Close first, expand later" (§9 Hardening Roadmap)

### 2.1 Operational Reality Assessment

> **Source:** `CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md` §1.3-1.4 (Detailed reality check)
> **Assessment Date:** 2026-03-09
> **Method:** Compare deliverables vs operational completeness

| Phase | Deliverable Status | Operational Reality | Gap | Production Ready? |
|---|---|---|---|---|
| **Phase 0** | ✅ DONE | ✅ **BASELINE COMPLETE** | None | ✅ YES |
| **Phase 1** | ✅ CLOSED | ⚠️ **MOSTLY DONE** | Not single-source control plane | 🔶 NEEDS UNIFICATION |
| **Phase 2** | ✅ RELEASE-GRADE PASS | ✅ **STRONG BASELINE** | Full release-candidate gate missing | 🔶 NEEDS EXPANSION |
| **Phase 3** | ✅ CLOSED | ⚠️ **RUNTIME BASELINE** | Broader rollout policy missing | 🔶 NEEDS POLICY EXPANSION |
| **Phase 4** | ✅ CLOSED | ⚠️ **BASELINE ORCHESTRATION** | Broader long-running orchestration missing | 🔶 NEEDS ORCHESTRATION EXPANSION |
| **Phase 5** | ✅ DONE | ✅ **BASELINE COMPLETE** | None | ✅ YES |
| **Phase 6** | ⏸ DEPTH-FROZEN | ⏸ **DEFERRED** | Depth Audit 3/10 = DEFER | ⚠️ INTENTIONALLY PAUSED |

**Overall Assessment:** 85% operational ready, 15% gaps remain for production readiness.

### 2.2 Detailed Fix Plan

#### Phase 1 — Complete Control Plane Unification
**Target:** Single-source governance state for entire ecosystem
**Current Gap:** Distributed state across multiple components
**Effort:** HIGH (4-6 weeks)
**Dependencies:** None

**Tasks:**
1. **Week 1-2:** Audit current distributed state sources
   - Map all governance state locations
   - Identify state synchronization gaps
   - Design unified state schema
2. **Week 3-4:** Implement unified control plane
   - Create single governance state registry
   - Migrate all components to read from unified source
   - Add state consistency validation
3. **Week 5-6:** Testing & Deployment
   - End-to-end testing of unified state
   - Backward compatibility verification
   - Production deployment plan

#### Phase 2 — Expand to Full Release-Candidate Gate
**Target:** Complete release-grade conformance for all future waves
**Current Gap:** Only Wave 1 covered, missing future extension coverage
**Effort:** MEDIUM (3-4 weeks)
**Dependencies:** Phase 1 completion

**Tasks:**
1. **Week 1:** Analyze Wave 1 gaps
   - Review current scenario coverage
   - Identify missing extension types
   - Design extensibility framework
2. **Week 2-3:** Implement extensibility
   - Create scenario template system
   - Build automated scenario generation
   - Add extension coverage validation
3. **Week 4:** Validation & Documentation
   - Test with hypothetical Wave 2 extensions
   - Update conformance documentation
   - Create extension onboarding guide

#### Phase 3 — Complete Skill Rollout Policy
**Target:** Enterprise-scale skill governance rollout
**Current Gap:** Basic runtime blocking, missing enterprise policies
**Effort:** MEDIUM (2-3 weeks)
**Dependencies:** Phase 1 completion

**Tasks:**
1. **Week 1:** Design enterprise rollout framework
   - Multi-environment skill deployment
   - Staged rollout policies
   - Rollback procedures for skill updates
2. **Week 2:** Implementation
   - Build rollout orchestration engine
   - Add skill lifecycle management
   - Implement monitoring & alerting
3. **Week 3:** Testing & Documentation
   - Enterprise scenario testing
   - Rollback procedure validation
   - Operations documentation

#### Phase 4 — Expand Durable Execution Orchestration
**Target:** Production-grade long-running workflow orchestration
**Current Gap:** Basic recovery, missing production orchestration
**Effort:** HIGH (4-5 weeks)
**Dependencies:** Phase 1-3 completion

**Tasks:**
1. **Week 1-2:** Design orchestration framework
   - Complex workflow modeling
   - Resource management strategies
   - Failure handling policies
2. **Week 3-4:** Implementation
   - Build orchestration engine
   - Add resource scheduling
   - Implement advanced recovery patterns
3. **Week 5:** Production Readiness
   - Load testing
   - Disaster recovery testing
   - Operations documentation

### 2.3 Updated Timeline

| Phase | Original Status | Target Completion | Priority |
|---|---|---|---|
| **Phase 1** | 85% (MOSTLY DONE) | Q2 2026 (6 weeks) | P0 - CRITICAL |
| **Phase 2** | 85% (STRONG BASELINE) | Q3 2026 (4 weeks) | P1 - HIGH |
| **Phase 3** | 85% (RUNTIME BASELINE) | Q3 2026 (3 weeks) | P1 - HIGH |
| **Phase 4** | 80% (BASELINE ORCHESTRATION) | Q4 2026 (5 weeks) | P1 - HIGH |
| **Phase 6** | DEFERRED | REMAIN DEFERRED | P2 - LOW |

**Total Effort:** ~18 weeks across 4 phases
**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Parallel Work:** Phases 2-3 can run in parallel after Phase 1 completion

| Phase | Weakness | Status | Summary | Operational Reality |
|---|---|---|---|---|
| **Phase 0** | Baseline freeze | ✅ **DONE** | Baseline, executive review, decision matrix, trace chain, rotation rules | ✅ **PRODUCTION READY** |
| **Phase 1** | W1 — Unified control plane | ⚠️ **OPERATIONAL BASELINE** | Ecosystem Governance Contract + distributed state | 🔶 **NEEDS UNIFICATION** (85% complete) |
| **Phase 2** | W2 — E2E conformance | ✅ **RELEASE-GRADE PASS** | 84/84 scenarios, 18/18 anchors, 17/17 groups, golden diff clean | 🔶 **NEEDS EXPANSION** (85% complete) |
| **Phase 3** | W3 — Skill governance | ⚠️ **RUNTIME BASELINE** | Blocking, successor, dependency, phase compat + basic rollout | 🔶 **NEEDS POLICY EXPANSION** (85% complete) |
| **Phase 4** | W4 — Durable execution | ⚠️ **BASELINE ORCHESTRATION** | Rollback, replay, checkpoint/resume, remediation + basic orchestration | 🔶 **NEEDS ORCHESTRATION EXPANSION** (80% complete) |
| **Phase 5** | W5-W6 — Release discipline | ✅ **DONE** | Release manifest, module inventory, maturity matrix | ✅ **PRODUCTION READY** |
| **Phase 6** | W7 — Enterprise evidence | ⏸ **DEPTH-FROZEN** | 4 packet postures, 8 runtime families, CF-084 — Depth Audit 3/10 = DEFER | ⚠️ **INTENTIONALLY DEFERRED** |

### Track I — Decision Rules

- Mỗi phase mở thêm layer → phải qua **Depth Audit** (§1.5, score ≥ 8/10)
- Ưu tiên: `risk reduced` > `detail added` > `semantic perfection`
- Phase 6 không mở thêm trừ khi có real risk mới
- **NEW:** Operational completeness > deliverable existence — production readiness requires full operational coverage

---

## 3. TRACK II — Ecosystem Restructure (Phase 1 Eco)

> **Detail:** `CVF_Restructure/Independent Review/CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` → Phase 1
> **ADR:** `CVF_Restructure/Independent Review/ADR-021_CVF_ECOSYSTEM_RESTRUCTURE.md`

| Section | Tasks | Status | Expected Output (Treeview Target) |
|---|---|---|---|
| 1.1 Doctrine Layer | 5 tasks | ✅ DONE | `ECOSYSTEM/doctrine/` (5 files) |
| 1.2 VOM (Operating Model) | 3 tasks | ✅ 3/3 DONE | `ECOSYSTEM/operating-model/` (3 files incl. Quick Start) |
| 1.3 Repository Restructure | 5 tasks | ✅ 5/5 DONE | `ECOSYSTEM/strategy/` + Root README + Arch Diagram updated |
| 1.4 Governance Pipeline | 2 tasks | ✅ DONE | `docs/concepts/CVF_HIERARCHICAL...md` |
| 1.5 Governance Enforcement | 3 tasks | ✅ DONE | `governance/toolkit/05_OPERATION/` (5 guards) |
| 1.6 Archive CVF_Restructure | 4 tasks | ✅ DONE | Archive manifest + 4 docs integrated + .gitignore updated |

**Dependency:** Track II có thể chạy song song với Track I (không block nhau).

---

## 4. TRACK III — Ecosystem Expansion (Phase 2-5 Eco)

> **Detail:** `CVF_Restructure/Independent Review/CVF_ECOSYSTEM_ROADMAP_2026-03-08.md` → Phase 2-5
> **Blueprint:** `docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md`

| Phase | Key Deliverables | Tasks | Status | Expected Output (Treeview Target) | Blocked By |
|---|---|---|---|---|---|
| **Phase 2** (Q3 2026) | Intent Validation, NL Policy, LLM Risk, Domain Guards, RAG Pipeline | 23 | ✅ 5/5 | `CVF_ECO_v1.0-v1.4` (5 extensions, 197 tests) | Phase 3 |
| **Phase 3** (Q4 2026) | Agent Guard SDK, Governance Canvas, CLI | 17 | ✅ 3/3 | `CVF_ECO_v2.0-v2.2` (3 extensions, 112 tests) | Phase 4 |
| **Phase 4** (2027) | Agent Identity, Graph Governance | 8 | ✅ 2/2 | `CVF_ECO_v2.3-v2.4` (2 extensions, 66 tests) | Phase 5 |
| **Phase 5** (2028+) | Task Marketplace, Reputation | 5 | ✅ 2/2 | `CVF_ECO_v3.0-v3.1` (2 extensions, 59 tests) | — |

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

| # | Action | Track | Priority | Effort | Status |
|---|---|---|---|---|---|
| 2 | **VOM Quick Start Guide** — Tài liệu giúp non-coders bắt đầu | Track II | P1 | Low | ✅ DONE |
| 3 | **Close W1** — Ecosystem Governance Contract | Track I | P0 | High | ✅ DONE |
| 4 | **Close W3** — Skill Rollout Policy | Track I | P1 | Medium | ✅ DONE |
| 5 | **Close W4** — Durable Execution Policy | Track I | P1 | Medium | ✅ DONE |
| 6 | **Archive CVF_Restructure** — Migrate + archive | Track II | P2 | Low | ✅ DONE |
| 7 | **Intent Validation** — Triple-S engine (41 tests) | Track III | P2 | High | ✅ DONE |
| 8 | **NL Policy** — Compiler + Templates + Store + Serializer (46 tests) | Track III | P2 | High | ✅ DONE |
| 9 | **LLM Risk Engine** — RiskScorer + ContextAnalyzer + Aggregator (37 tests) | Track III | P2 | Medium | ✅ DONE |
| 10 | **Domain Guards** — Finance + Privacy + CodeSecurity guards (39 tests) | Track III | P2 | Medium | ✅ DONE |
| 11 | **Hierarchical RAG Pipeline** — DocumentStore + Retriever + Pipeline (34 tests) | Track III | P2 | Medium | ✅ DONE |
| 12 | **Agent Guard SDK** — Unified SDK: RiskModule + GuardModule + SessionManager + AuditLogger (43 tests) | Track III | P3 | High | ✅ DONE |
| 13 | **Governance Canvas** — MetricsCollector + ReportRenderer text/markdown (30 tests) | Track III | P3 | Medium | ✅ DONE |
| 14 | **Governance CLI** — ArgParser + CommandRegistry + 7 commands (39 tests) | Track III | P3 | Medium | ✅ DONE |
| 15 | **Agent Identity** — AgentRegistry + CredentialStore + IdentityManager (39 tests) | Track III | P4 | High | ✅ DONE |
| 16 | **Graph Governance** — GraphStore + TrustPropagator + GovernanceGraph (27 tests) | Track III | P4 | High | ✅ DONE |
| 17 | **Task Marketplace** — TaskRegistry + BidManager + Marketplace (29 tests) | Track III | P5 | High | ✅ DONE |
| 18 | **Reputation System** — ScoreCalculator + ReputationSystem (30 tests) | Track III | P5 | High | ✅ DONE |

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
