# CHANGELOG — Controlled Vibe Framework (CVF)

---

## [2026-02-16] — Independent Assessment Fixes & Coverage Push

### Added
- **Security headers** in `next.config.ts` — 7 headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, X-DNS-Prefetch-Control)
- **CVF_SKILL_LIBRARY/README.md** — Redirect to canonical skill library location
- **44 new tests** across 7 test files (i18n, Settings, ResultViewer, SkillLibrary, useAgentChat, AgentChatHeader, AgentChatMessageBubble, AnalyticsDashboard, auth/login)
- **Independent Assessment Report** (`docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-16.md`)

### Changed
- **Test coverage** — 1068 tests passing (71 files), up from 1024 tests (70 files)
- **Coverage metrics** — 95.57% Stmts | 79.40% Branch | 94.52% Funcs | 96.17% Lines
- **Skill count** — Corrected from 114 → 131 across 15 documentation files
- **README.md** — Updated badges, fixed broken URLs (Discord, support email)
- **ResultViewer.tsx** — Removed dead code (`QualityBadge`, `QualityBreakdown`)
- **useAgentChat.test.ts** — Refactored checkBudget mock (replaced dynamic imports with static mock pattern)

### Fixed
- Broken Discord URL → placeholder "Coming soon"
- Broken support email → placeholder "Coming soon"
- Incorrect skill count (114 → 131) in 15 files

---

## [2026-02-08] — Quality Calibration & Governance Overhaul

### Added
- **Independent Expert Review** (`docs/CVF_INDEPENDENT_EXPERT_REVIEW_2026-02-08.md`) — 8.5/10 calibrated score
- **Combined Assessment Roadmap** (`docs/CVF_COMBINED_ASSESSMENT_ROADMAP_2026-02-08.md`) — 15 findings, 4 sprints
- **Scoring Methodology** (`docs/CVF_SCORING_METHODOLOGY.md`) — Self vs Independent rating process
- **CVF Lite** (`CVF_LITE.md`) — 5-minute quick start guide
- **CVF Positioning** (`docs/CVF_POSITIONING.md`) — Clear identity definition (3-layer architecture)
- **Quality Dimensions Spec** (`specs/QUALITY_DIMENSIONS.md`) — Separates Spec/UAT/Satisfaction scoring
- **UAT Status Spec** (`specs/UAT_STATUS_SPEC.md`) — 4-state badge system (NOT_RUN/NEEDS_UAT/VALIDATED/FAILED)
- **Deduplication Policy** (`specs/SKILL_DEDUPLICATION_POLICY.md`) — Similarity thresholds and process
- **Data Lineage Spec** (`specs/DATA_LINEAGE.md`) — Origin tracking (CURATED/IMPORTED/ADAPTED)
- **Version Lock Spec** (`specs/ARTIFACT_VERSION_LOCK.md`) — Skill-governance sync system
- `check_version_sync.py` — Version lock checker + fixer (124 files synced)
- `inject_spec_scores.py` — Spec score block injector for `.gov.md` files
- `inject_lineage.py` — Data lineage tag injector for `.gov.md` files

### Changed
- **`report_spec_metrics.py`** — Complete rewrite with calibrated v2 scoring (content depth, concrete examples, input constraints, output schema, placeholder penalty). Scores dropped from 92-100 → 84-94 range.
- **`score_uat.py`** — Added badge field to `ScoreResult`, badge summary in reports
- **README.md** — Assessment updated to 8.5/10 (calibrated), added 3-tier architecture diagram, skill count corrected to 124
- **124 `.gov.md` files** — Injected `## Spec Score` blocks with per-section breakdown
- **124 `.gov.md` files** — Injected `## Version Lock` blocks (all SYNCED)
- **124 `.gov.md` files** — Injected Origin/Origin Source lineage tags in Governance table

### Status
- Sprint 1 (Trust Calibration): ✅ COMPLETED
- Sprint 2 (Data Integrity): ✅ COMPLETED
- Sprint 3 (Validation + Adoption): 🟡 Partially complete (CVF Lite, Positioning, Version Consolidation done; Pilot remains)
- Sprint 4 (Ecosystem): ⏸️ DEFERRED

---

## [2026-02-07] — Quality Pass 2 + Platform Updates

### Added
- Domain Refinement (Quality Pass 2) completed for CVF v1.5.2 Skill Library (12 domains, 131 skills)
- Real-world examples across Security/Compliance, AI/ML, Legal, Product & UX, Marketing, and other domains
- Shared skill validation tools under `tools/skill-validation`
- Playwright E2E tests for CVF v1.6 Agent Platform (Simple / With Rules / CVF Full flows)
- v1.5 UX Platform smoke/unit tests (analytics, store, TemplateCard)
- Telemetry policy + schema docs for v1.6 (`docs/telemetry/*`)
- Mobile web audit + spec docs for v1.6 (`docs/mobile/*`)

### Changed
- Skill metadata and Version History normalized across v1.5.2 library
- Related Skills and Next Step flows aligned per domain
- Roadmaps updated to reflect domain refinement completion
- Root README updated with accurate counts and links
- v1.6 roadmap updated to mark Domain Refinement complete (v1.5.2)
- v1.5 UX Platform set to **FROZEN** (maintenance-only); new improvements focus on v1.6 while v1.5.2 Skill Library continues
- v1.6 analytics upgraded with skill/domain tracking + export (CSV/JSON) + retention/opt-out
- v1.6 mobile UX pass: full-screen modals on mobile, sticky chat input, safe-area padding, responsive Skill Library + Decision Log
- v1.6 test suite expanded to 176 tests (23 files) with 85%+ branch coverage

### Fixed
- Placeholder examples replaced with concrete scenarios
- Inconsistent domain counts in README
- Validation warnings eliminated (131 skills pass `validate_skills.py`)

---
