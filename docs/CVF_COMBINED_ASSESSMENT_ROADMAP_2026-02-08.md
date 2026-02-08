# CVF Combined Assessment & Remediation Roadmap

**Date:** 08/02/2026
**Sources:** Independent Expert Review (08/02) + Independent Audit Report (07/02)
**Status:** ACTIONABLE — Roadmap ready for execution
**Target:** Move CVF from 8.5/10 → 9.2+/10 (validated score)

---

## PART 1: CONSOLIDATED FINDINGS

### Phương pháp

Tổng hợp từ 2 đánh giá độc lập:
- **Expert Review** (08/02) — Architecture, code quality, competitive positioning, documentation
- **Audit Report** (07/02) — Governance pipeline, scoring accuracy, UAT coverage, data integrity

### Bản đồ vấn đề tổng hợp (Unified Issue Map)

| # | Vấn đề | Nguồn | Mức độ | Loại |
|---|--------|-------|:------:|------|
| **F-01** | Spec Scoring quá lạc quan (near-perfect cho mọi domain) | Audit + Expert | 🔴 Critical | Trust |
| **F-02** | UAT Coverage = 0% (chưa chạy, không phải fail) | Audit + Expert | 🔴 Critical | Trust |
| **F-03** | Chưa có real-world production validation | Expert | 🔴 Critical | Validation |
| **F-04** | Self-assessment bias (tự cho 9.5/10) | Expert | 🔴 Critical | Trust |
| **F-05** | Version sync giữa Skill → Mapping → UAT → Report | Audit + Expert | 🟡 Medium | Data Integrity |
| **F-06** | UI không giải thích lý do score ("why" behind score) | Audit | 🟡 Medium | UX Trust |
| **F-07** | Không phân biệt "Not Run" vs "Fail" cho UAT | Audit | 🟡 Medium | UX Trust |
| **F-08** | End-user quality vs System quality lẫn lộn | Audit | 🟡 Medium | UX Clarity |
| **F-09** | Skill similarity/deduplication yếu | Audit | 🟡 Medium | Quality at Scale |
| **F-10** | Complexity barrier cho adoption (8+ versions) | Expert | 🟡 Medium | Adoption |
| **F-11** | Scope creep: governance framework → full platform | Expert | 🟡 Medium | Strategy |
| **F-12** | Governance metrics thiếu data lineage | Audit | 🟢 Low | Governance |
| **F-13** | Community & ecosystem gần như zero | Expert | ⚪ Deferred | Growth |
| **F-14** | SDK chưa publish lên npm/PyPI | Expert | ⚪ Deferred | Distribution |
| **F-15** | Thiếu third-party integration (Slack, Jira) | Expert | ⚪ Deferred | Ecosystem |

### Tổng hợp theo nhóm

```
Trust & Scoring (F-01, F-02, F-04, F-06, F-07, F-08)
├── Root Cause: Scoring rubric quá dễ + UAT chưa chạy + UI không minh bạch
├── Impact: Users over-trust → governance thành "paper compliance"
└── Fix: Tighten rubric + Run UAT + Add transparency badges

Data Integrity (F-05, F-12)
├── Root Cause: Không có version lock giữa artifacts
├── Impact: Stale data → trust erosion
└── Fix: Embed version IDs + auto-invalidate stale artifacts

Validation & Adoption (F-03, F-10, F-11)
├── Root Cause: Framework chưa được real-world test + complexity cao
├── Impact: Không thể claim enterprise-ready
└── Fix: Pilot program + simplified onboarding + identity clarity

Ecosystem (F-13, F-14, F-15) — ⚪ DEFERRED
├── Root Cause: Single-author project chưa có community
├── Impact: Adoption chậm, dependency cao
├── Status: Chưa cần thiết cho cá nhân/team nhỏ
└── Sẽ xem xét khi có nhu cầu public
```

---

## PART 2: REMEDIATION ROADMAP

### Overview Timeline

```
Sprint 1 (Week 1-2)     Sprint 2 (Week 3-4)     Sprint 3 (Week 5-6)     Sprint 4 (Week 7-8)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ TRUST            │     │ DATA INTEGRITY   │     │ VALIDATION       │     │ ECOSYSTEM        │
│ CALIBRATION      │     │ + UI TRUST       │     │ + ADOPTION       │     │ + GROWTH         │
│                  │     │                  │     │                  │     │                  │
│ F-01 Scoring     │     │ F-05 Version Sync│     │ F-03 Pilot       │     │ F-13 Community   │
│ F-02 UAT Run     │     │ F-06 Score "Why" │     │ F-10 CVF Lite    │     │ F-14 npm/PyPI    │
│ F-04 Recalibrate │     │ F-07 UAT Badges  │     │ F-11 Identity    │     │ F-15 Integrations│
│ F-09 Dedupe      │     │ F-08 Quality Sep │     │                  │     │                  │
│                  │     │ F-12 Lineage     │     │                  │     │                  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
   🔴 CRITICAL              🟡 MEDIUM              🟡+🔴 MIXED            🟢 GROWTH
   Est: 20h                 Est: 18h               Est: 16h               Est: 12h
```

---

### SPRINT 1: Trust Calibration (Week 1-2) — ✅ COMPLETED (Feb 08, 2026)

**Goal:** Scores phản ánh thực tế. UAT có trạng thái rõ ràng. Loại bỏ duplicates.

> **Status:** All 5 tasks completed. Scoring v2 deployed, UAT badges live, dedup policy created, self-assessment recalibrated.

#### Task 1.1: Tighten Spec Score Rubric ← F-01, F-04 ✅

**Problem:** `report_spec_metrics.py` cho gần 100% tất cả domains vì rubric chỉ check section existence, không check content quality.

**Current rubric (quá dễ):**
```python
# Chỉ check section có tồn tại → hầu hết đạt 100%
SCORE_WEIGHTS = {
    "purpose": 15,
    "form_input": 25,
    "expected_output": 20,
    "constraints": 15,
    "validation": 15,
    "example": 10,
}
```

**New rubric (nghiêm khắc hơn):**

| Check | Current | New | Weight |
|-------|---------|-----|:------:|
| Section exists | ✅ | ✅ Keep | 40% |
| Content depth (word count ≥ threshold) | ❌ | ✅ Add | 20% |
| Concrete examples (not placeholders) | ❌ | ✅ Add | 15% |
| Input constraints defined (types, ranges) | ❌ | ✅ Add | 10% |
| Output format explicit (schema/template) | ❌ | ✅ Add | 10% |
| Domain-specific required fields met | ❌ | ✅ Add | 5% |

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 1.1.1 | Add content depth scoring to `report_spec_metrics.py` | `governance/skill-library/registry/report_spec_metrics.py` | 2h |
| 1.1.2 | Add domain-specific minimum required fields config | `governance/skill-library/specs/DOMAIN_SCORING_CONFIG.md` | 1h |
| 1.1.3 | Create golden set: 3 skills per domain (manually curated) | `governance/skill-library/registry/golden-set/` | 2h |
| 1.1.4 | Calibrate scoring thresholds against golden set | `report_spec_metrics.py` | 1h |
| 1.1.5 | Re-run metrics, verify score differentiation | Terminal | 30m |
| 1.1.6 | Update `spec_metrics_report.md` with new scores | Auto-generated | 15m |

**Expected outcome:** Domain averages drop from 92-100 → 65-90 range (realistic differentiation).

**Acceptance criteria:**
- [x] No domain has Avg Spec Score = 100% (unless golden set all pass)
- [x] At least 3 tiers visible: Excellent (≥85), Good (70-84), Needs Review (<70)
- [x] Golden set skills score ≥ 85 (they are the benchmark)

---

#### Task 1.2: Run UAT + Add Status Badges ← F-02, F-07

**Problem:** UAT records exist but are "Not Run". UI shows 0% coverage → users perceive as failure.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 1.2.1 | Define 3 UAT status badges: `NOT_RUN`, `NEEDS_UAT`, `VALIDATED` | `governance/skill-library/specs/UAT_STATUS_SPEC.md` | 30m |
| 1.2.2 | Update `score_uat.py` to support 3-state badges | `governance/skill-library/uat/score_uat.py` | 1h |
| 1.2.3 | Run UAT on golden set (3 per domain × 12 = 36 skills) | `governance/skill-library/uat/results/` | 3h |
| 1.2.4 | Generate UAT reports with badge status | `governance/skill-library/uat/reports/` | 30m |
| 1.2.5 | Update `generate_uat_records.py` to embed badge in `.gov.md` | `governance/skill-library/uat/generate_uat_records.py` | 1h |

**Badge definition:**

```markdown
## UAT Status Badges

| Badge | Meaning | Visual | Condition |
|-------|---------|--------|-----------|
| `NOT_RUN` | UAT chưa được thực thi | 🔘 Gray | No UAT result exists |
| `NEEDS_UAT` | Spec changed, UAT stale | ⚠️ Yellow | Spec version > UAT version |
| `VALIDATED` | UAT passed on current spec | ✅ Green | UAT result + version match |
| `FAILED` | UAT explicitly failed | ❌ Red | UAT result = FAIL |
```

**Acceptance criteria:**
- [x] All 36 golden set skills have status ≠ `NOT_RUN`
- [x] Badge visible in `.gov.md` files
- [x] Script can auto-detect stale UAT (spec version > uat version)

---

#### Task 1.3: Skill Similarity & Deduplication ← F-09

**Problem:** Imported skills can be near-duplicates. No deduplication enforcement.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 1.3.1 | Run existing `dedupe_skill_similarity.py` → generate report | `governance/skill-library/registry/` | 30m |
| 1.3.2 | Review similarity report, quarantine duplicates (>80% similar) | `governance/skill-library/registry/dupe-quarantine/` | 1h |
| 1.3.3 | Define similarity threshold in governance spec | `governance/skill-library/specs/SKILL_DEDUPLICATION_POLICY.md` | 30m |
| 1.3.4 | Add deduplication check to `validate_skills.py` pipeline | `tools/skill-validation/validate_skills.py` | 1h |

**Acceptance criteria:**
- [x] Similarity report generated for all 114+ skills
- [x] Skills > 80% similarity either merged or quarantined
- [x] Deduplication check runs as part of validation pipeline

---

#### Task 1.4: Recalibrate Self-Assessment ← F-04

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 1.4.1 | Update `CVF_COMPREHENSIVE_ASSESSMENT_2026-02-07.md` — add "Calibrated Score" section | `docs/CVF_COMPREHENSIVE_ASSESSMENT_2026-02-07.md` | 30m |
| 1.4.2 | Update root `README.md` — change score to reflect calibrated assessment | `README.md` | 15m |
| 1.4.3 | Add scoring methodology doc explaining self vs independent rating | `docs/CVF_SCORING_METHODOLOGY.md` | 30m |

**New scoring table:**

| Version | Self-Assessment | Independent | Calibrated |
|---------|:--------------:|:-----------:|:----------:|
| v1.0-v1.2 (Core) | 9.5 | 9.0 | **9.0** |
| v1.3 (Toolkit) | 8.5 | 8.0 | **8.0** |
| v1.5.2 (Skills) | 9.5 | 8.5 | **8.5** |
| v1.6 (Agent) | 9.5 | 8.5 | **8.5** |
| **Overall** | **9.5** | **8.5** | **8.5** |

**Acceptance criteria:**
- [x] README shows calibrated score with link to methodology
- [x] Methodology doc explains how score is calculated
- [x] Both self-assessment and independent scores are visible (transparency)

---

### SPRINT 2: Data Integrity + UI Trust (Week 3-4) — ✅ COMPLETED (Feb 08, 2026)

**Goal:** Artifacts are version-locked. UI explains score reasoning. Quality types clearly separated.

> **Status:** All 4 tasks completed. Version locks on 124 files, spec scores injected, quality dimensions defined, data lineage tagged.

#### Task 2.1: Version Lock System ← F-05 ✅

**Problem:** Skill changes don't invalidate mapping/UAT/report artifacts.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 2.1.1 | Define version lock schema | `governance/skill-library/specs/ARTIFACT_VERSION_LOCK.md` | 1h |
| 2.1.2 | Add `skill_version`, `mapping_version`, `uat_version` to `.gov.md` template | `.gov.md` template | 30m |
| 2.1.3 | Create `check_version_sync.py` — detect stale artifacts | `governance/skill-library/registry/check_version_sync.py` | 2h |
| 2.1.4 | Integrate version check into `validate_registry.py` | `governance/skill-library/registry/validate_registry.py` | 1h |
| 2.1.5 | Auto-flag stale UAT when spec changes (CI hook) | `tools/skill-validation/` | 1h |

**Version lock schema:**

```yaml
# Embedded in each .gov.md
version_lock:
  skill_version: "1.2.0"       # from .skill.md
  mapping_version: "1.1.0"     # from mapping record
  uat_version: "1.0.0"         # from UAT result
  report_version: "1.0.0"      # from spec_metrics
  sync_status: "SYNCED"        # SYNCED | STALE | MISMATCH
  last_checked: "2026-02-15"
```

**Acceptance criteria:**
- [x] All `.gov.md` files contain version lock block
- [x] `check_version_sync.py` can detect stale artifacts
- [x] Stale artifacts auto-flagged with `⚠️ STALE` badge

---

#### Task 2.2: Score Explanation ("Why") ← F-06

**Problem:** UI shows score but not reasoning. User sees "85" without knowing what's missing.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 2.2.1 | Update `report_spec_metrics.py` to output missing/weak signals per skill | `governance/skill-library/registry/report_spec_metrics.py` | 1.5h |
| 2.2.2 | Add `score_breakdown` field to JSON report | `spec_metrics_report.json` | 30m |
| 2.2.3 | Update `.gov.md` template to include score reasoning | `.gov.md` template | 30m |
| 2.2.4 | Create dashboard spec for score tooltip/explanation | `governance/skill-library/specs/GOVERNANCE_DASHBOARD_DESIGN.md` | 1h |

**Score breakdown example:**

```json
{
  "skill_id": "USR-042",
  "spec_score": 78,
  "breakdown": {
    "purpose": { "score": 15, "max": 15, "status": "PASS" },
    "form_input": { "score": 20, "max": 25, "status": "WEAK", "reason": "Missing input types/ranges" },
    "expected_output": { "score": 15, "max": 20, "status": "WEAK", "reason": "No output schema" },
    "constraints": { "score": 15, "max": 15, "status": "PASS" },
    "validation": { "score": 8, "max": 15, "status": "WEAK", "reason": "Generic checklist only" },
    "example": { "score": 5, "max": 10, "status": "WEAK", "reason": "Example lacks concrete values" }
  },
  "missing_for_excellent": ["Input types/ranges", "Output schema", "Specific validation criteria"]
}
```

**Acceptance criteria:**
- [x] Every skill has a `score_breakdown` in JSON report
- [x] `.gov.md` files show top 3 missing/weak signals
- [x] Dashboard design spec includes score tooltip

---

#### Task 2.3: Separate Quality Types ← F-08

**Problem:** Spec quality (input), output UAT, and user satisfaction are conflated in UI labels.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 2.3.1 | Define 3 quality dimensions in governance spec | `governance/skill-library/specs/QUALITY_DIMENSIONS.md` | 1h |
| 2.3.2 | Update Governance Dashboard Design with separated metrics | `governance/skill-library/specs/GOVERNANCE_DASHBOARD_DESIGN.md` | 1h |
| 2.3.3 | Update v1.6 UI — split domain report (Spec Avg vs UAT Avg) | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` | 2h |

**Quality dimensions:**

```
┌──────────────────────────────────────────────────────┐
│                 QUALITY TAXONOMY                      │
├──────────────────┬───────────────┬───────────────────┤
│ Spec Quality     │ Output UAT    │ User Satisfaction  │
│ (Input)          │ (Output)      │ (Experience)       │
├──────────────────┼───────────────┼───────────────────┤
│ "Is the input    │ "Did the AI   │ "Was the user     │
│  well-defined?"  │  output pass  │  satisfied with   │
│                  │  validation?" │  the result?"     │
├──────────────────┼───────────────┼───────────────────┤
│ Measured by:     │ Measured by:  │ Measured by:      │
│ Spec Score       │ UAT Pass/Fail │ Accept/Reject %   │
│ (0-100)          │ (Badge)       │ (0-100)           │
├──────────────────┼───────────────┼───────────────────┤
│ Source:          │ Source:       │ Source:           │
│ report_spec_     │ score_uat.py  │ v1.6 analytics    │
│ metrics.py       │               │                   │
└──────────────────┴───────────────┴───────────────────┘
```

**Acceptance criteria:**
- [x] 3 quality dimensions documented
- [x] Dashboard design shows them separately
- [x] Domain report shows Spec Avg and UAT status in separate columns

---

#### Task 2.4: Data Lineage Tags ← F-12

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 2.4.1 | Add `origin` field to `.gov.md`: `auto-imported` / `manually-curated` / `output-validated` | `.gov.md` template | 30m |
| 2.4.2 | Update `generate_user_skills.py` to tag origin | `governance/skill-library/registry/generate_user_skills.py` | 30m |
| 2.4.3 | Add lineage filter to dashboard spec | `governance/skill-library/specs/GOVERNANCE_DASHBOARD_DESIGN.md` | 30m |

**Acceptance criteria:**
- [x] Every `.gov.md` has `origin` tag
- [x] Dashboard can filter by origin

---

### SPRINT 3: Validation + Adoption (Week 5-6) — 🟡 PARTIALLY COMPLETED

**Goal:** CVF validated with real projects. Onboarding simplified. Identity clarified.

> **Status (Feb 08, 2026):** Tasks 3.2 (CVF Lite), 3.3 (Identity), 3.4 (Version Consolidation) completed. Task 3.1 (Pilot Program) remains — requires real project execution.

#### Task 3.1: Real-World Pilot Program ← F-03

**This is the single most important task for CVF's credibility.**

**Action Items:**

| # | Task | Deliverable | Est. |
|---|------|-------------|------|
| 3.1.1 | Select 3 pilot projects (1 small, 1 medium, 1 complex) | `docs/PILOT_PROGRAM.md` | 1h |
| 3.1.2 | Define measurement framework | Metrics doc | 1h |
| 3.1.3 | Execute Pilot 1 (small project with v1.6 Agent Platform) | Case study | 4h |
| 3.1.4 | Execute Pilot 2 (medium project with v1.3 SDK) | Case study | 6h |
| 3.1.5 | Collect metrics & write post-mortem | `docs/case-studies/` | 2h |
| 3.1.6 | Update assessment scores based on empirical data | `docs/` | 1h |

**Measurement framework:**

| Metric | How to Measure | Baseline (without CVF) |
|--------|----------------|------------------------|
| Time-to-delivery | Start → acceptance | Estimate from past projects |
| Rework rate | # of reject/retry cycles | Track in v1.6 analytics |
| Governance overhead | Time spent on CVF activities | Timer |
| Decision traceability | % decisions with audit trail | Count in Decision Log |
| User satisfaction | 1-5 rating post-project | Survey |
| Error escape rate | Issues found post-acceptance | Bug tracker |

**Pilot project criteria:**

| Pilot | Size | CVF Version | Domain | Duration |
|-------|------|-------------|--------|----------|
| Pilot 1 | Small (1 person, 2-3 days) | v1.6 Agent Platform | Web development | 1 week |
| Pilot 2 | Medium (2 people, 1 week) | v1.3 SDK + v1.6 | App development | 2 weeks |
| Pilot 3 | Complex (team, 2+ weeks) | Full CVF stack | Enterprise feature | 3 weeks |

**Acceptance criteria:**
- [ ] At least 2 pilots completed
- [ ] Metrics collected for time, rework, satisfaction
- [ ] Post-mortem written as real case study (not hypothetical)
- [ ] Assessment score updated based on actual data

---

#### Task 3.2: CVF Lite — Simplified Onboarding ← F-10

**Problem:** 8+ versions overwhelm newcomers. Need a "5-minute start" path.

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 3.2.1 | Create `CVF_LITE.md` — 1-page guide | `docs/CVF_LITE.md` | 1h |
| 3.2.2 | Create single starter template | `templates/CVF_LITE_TEMPLATE.md` | 30m |
| 3.2.3 | Add "CVF Lite" path to README quick start | `README.md` | 15m |
| 3.2.4 | Create 5-minute video script (optional) | `docs/VIDEO_SCRIPT.md` | 30m |

**CVF Lite contents:**

```markdown
# CVF Lite (5 Minutes)

## Step 1: Define your goal (1 min)
What does "done" look like?

## Step 2: Write INPUT_SPEC (2 min)
- Goal: [one sentence]
- Must have: [3 items]
- Must NOT have: [2 items]

## Step 3: Execute with AI (1 min)
Paste this into your AI tool: [template]

## Step 4: Review (1 min)
- [ ] Meets goal?
- [ ] No forbidden actions?
- [ ] Accept / Reject / Retry

Done! For more control → use CVF v1.1+
```

**Acceptance criteria:**
- [ ] CVF Lite fits in 1 page
- [ ] New user can go from zero to first CVF-governed AI interaction in < 5 minutes
- [ ] README links to CVF Lite as the first option

---

#### Task 3.3: Clarify CVF Identity ← F-11

**Problem:** Is CVF a governance framework or a full platform?

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 3.3.1 | Write `CVF_POSITIONING.md` — official identity statement | `docs/CVF_POSITIONING.md` | 1h |
| 3.3.2 | Update README tagline to reflect positioning | `README.md` | 15m |
| 3.3.3 | Add "CVF vs X" comparison section in docs | `docs/CVF_VS_OTHERS.md` | 1h |

**Proposed positioning:**

```
CVF = AI Governance Framework (core identity)
     + Reference Implementation (v1.3 SDK, v1.6 Platform)

CVF does NOT replace: LangChain, MCP, OpenAI Assistants
CVF COMPLEMENTS them by adding: governance, risk control, audit, lifecycle management
```

**Acceptance criteria:**
- [ ] Clear identity statement exists
- [ ] README reflects positioning
- [ ] Comparison doc shows CVF as complementary, not competing

---

#### Task 3.4: Version Consolidation (Conceptual) ← F-10

**Action Items:**

| # | Task | File | Est. |
|---|------|------|------|
| 3.4.1 | Create user-facing grouping (3 tiers instead of 8 versions) | `README.md` | 30m |
| 3.4.2 | Update docs/INDEX.md with simplified navigation | `docs/INDEX.md` | 30m |

**Proposed simplification:**

```
Instead of: v1.0, v1.1, v1.2, v1.3, v1.3.1, v1.4, v1.5, v1.5.1, v1.5.2, v1.6

Present as:
┌─────────────────────────────────────────────┐
│  CVF Core          │ Governance rules       │ → v1.0 + v1.1 + v1.2
│  CVF Tools         │ SDK, CLI, automation   │ → v1.3 + v1.3.1 + v1.4
│  CVF Platform      │ Web UI, Agent Chat     │ → v1.5 + v1.5.2 + v1.6
└─────────────────────────────────────────────┘
```

*Note: Internal versioning stays the same. This is user-facing simplification only.*

**Acceptance criteria:**
- [ ] README presents 3 tiers prominently (before version table)
- [ ] New user can pick a tier in < 30 seconds

---

### SPRINT 4: Ecosystem & Growth — ⚪ DEFERRED

> **Status:** Chưa xem xét ở thời điểm này.  
> **Lý do:** Ưu tiên #1 là sử dụng cho cá nhân và team nhỏ. Các vấn đề community, publish package, third-party integration sẽ được đánh giá khi có nhu cầu mở rộng.  
> **Sẽ bổ sung:** Đánh giá chi tiết khi chuyển sang giai đoạn public.

---

## PART 3: EXECUTION TRACKER

### Master Checklist

| Sprint | Task | Priority | Est. | Status | Owner |
|:------:|------|:--------:|:----:|:------:|:-----:|
| **S1** | 1.1 Tighten Spec Scoring | 🔴 | 7h | ✅ | — |
| **S1** | 1.2 Run UAT + Status Badges | 🔴 | 6h | ✅ | — |
| **S1** | 1.3 Skill Deduplication | 🟡 | 3h | ✅ | — |
| **S1** | 1.4 Recalibrate Self-Assessment | 🔴 | 1.5h | ✅ | — |
| **S2** | 2.1 Version Lock System | 🟡 | 5.5h | ✅ | — |
| **S2** | 2.2 Score Explanation | 🟡 | 3.5h | ✅ | — |
| **S2** | 2.3 Separate Quality Dimensions | 🟡 | 4h | ✅ | — |
| **S2** | 2.4 Data Lineage Tags | 🟢 | 1.5h | ✅ | — |
| **S3** | 3.1 Real-World Pilot Program | 🔴 | 15h | ⬜ | — |
| **S3** | 3.2 CVF Lite Onboarding | 🟡 | 2.5h | ⬜ | — |
| **S3** | 3.3 Clarify Identity | 🟡 | 2.5h | ⬜ | — |
| **S3** | 3.4 Version Consolidation | 🟡 | 1h | ⬜ | — |
| **S4** | 4.x Community / Publish / Integrations | ⚪ | — | ⏸️ DEFERRED | — |

**Total estimated (active): ~54 hours (~7 working days spread across 6 weeks)**  
*Sprint 4 deferred — sẽ đánh giá khi chuyển sang public.*

---

### Score Projection

| Milestone | Expected Score | Key Unlocks |
|-----------|:--------------:|-------------|
| **Current** | 8.5/10 | Architecture, documentation, code quality |
| **After Sprint 1** | 8.8/10 | ✅ Trust calibration, real scores, deduplication |
| **After Sprint 2** | 9.0/10 | ✅ Data integrity, UI trust, quality transparency |
| **After Sprint 3** | 9.2/10 | 🟡 Pending: Real-world pilot validation |
| **After Sprint 4** | 9.3+/10 | ⏸️ Deferred — ecosystem khi cần public |

---

### Dependencies & Risks

```
Sprint 1 ──→ Sprint 2 (Score data feeds UI trust improvements)
Sprint 1 ──→ Sprint 3 (Calibrated scores needed before pilots can validate)
Sprint 2 ──→ Sprint 4 (Version lock needed before publishing packages)

Risk 1: Pilot projects may reveal fundamental issues → budget extra time
Risk 2: Score recalibration may alarm existing users → communicate change clearly
Risk 3: Deduplication may reduce skill count → frame as quality improvement
```

---

## PART 4: QUICK-START — WHAT TO DO RIGHT NOW

### Immediate Actions (Today)

1. **Run `dedupe_skill_similarity.py`** → See current duplication state
2. **Review `spec_metrics_report.md`** → Confirm over-optimistic scores
3. **Pick 3 golden set skills per domain** → Start in the strongest domain first

### This Week

4. **Modify `report_spec_metrics.py`** → Add content depth checks
5. **Create `UAT_STATUS_SPEC.md`** → Define the 3-state badge system
6. **Update README score** → Show 8.5 (calibrated) alongside 9.5 (self-assessed)

### Decision Required

> **CVF Team must decide:**
> 1. Accept calibrated score of 8.5/10? (Recommended: Yes — honesty builds trust)
> 2. Which 3 projects for pilot program? (Recommend: 1 internal, 1 external, 1 team)
> 3. Proceed with Version Consolidation (3-tier)? (Recommend: Yes — user-facing only)

---

*Document created: 08/02/2026*
*Sources: CVF Independent Expert Review (08/02) + Independent Audit Report (07/02)*
*Next review: After Sprint 1 completion (Target: 22/02/2026)*
