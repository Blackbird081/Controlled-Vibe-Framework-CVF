# CHANGELOG — Controlled Vibe Framework (CVF)

---

## [2026-02-28] — v1.7.3 Runtime Adapter Hub + Web UI Integration

### Added
- **CVF v1.7.3 Runtime Adapter Hub** — Extracted from CVF_Hypervisor Mode into `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/`
  - 5 contract interfaces (LLM, Runtime, Tool, Memory, Policy)
  - 4 runtime adapters (OpenClaw, PicoClaw, ZeroClaw, Nano)
  - Explainability layer with Vietnamese/English i18n
  - NLP policy parser with priority-based conflict resolution
  - 4 risk model JSON configs
  - 41 unit tests passing
- **Web UI Integration** — Ported v1.7.3 modules into `cvf-web/src/lib/`:
  - `explainability.ts` — NL action explanations
  - `natural-policy-parser.ts` — NLP → structured rules
  - `runtime-adapters.ts` — Adapter registry for UI
  - `risk-models.ts` — Risk matrix + destructive patterns
  - 4 new sections on Safety Dashboard: Runtime Adapters, Action Explainability, NLP Policy Editor, Risk Matrix
- **CI job** `runtime-adapter-hub-tests` for v1.7.3 (vitest + typecheck)
- **ADR-005** — Architectural decision record for Hypervisor Mode extraction
- **BUG-010 → BUG-014** — 5 new entries in `BUG_HISTORY.md`

### Fixed
- **BUG-010** — Safety page test regression: ambiguous `/send/i` selector (added `aria-label="Submit OpenClaw"`)
- **BUG-011** — CI workflow missing v1.7.3 path filter
- **BUG-012** — v1.7.3 typecheck failure (added `@types/node` + DOM lib)
- **BUG-013** — Risk model drift risk (added sync warning comments)
- **BUG-014** — README quality snapshot outdated (updated to 2026-02-28)

### Changed
- `README.md` — Updated version to 1.7.3, quality snapshot, architecture diagram
- `VERSIONING.md` — Added v1.7.3 to version table
- `VERSION_COMPARISON.md` — Added v1.7.3 comparison

### Removed
- `CVF_Hypervisor Mode/` folder — Deleted after extracting unique value (added to `.gitignore`)

---

## [2026-02-17] — Reference Implementation Restructuring

### Changed
- **CVF Toolkit** → moved to `EXTENSIONS/CVF_TOOLKIT_REFERENCE/` as controlled extension
- **cvf-starter-template** → moved to `EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/` as controlled extension
- **Architecture Separation Diagram** → moved to `EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md`, fully rewritten to reflect actual system structure
- Both READMEs rewritten to clearly state **reference implementation** status (not production runtime)
- Root README updated — architecture section now mentions reference implementations

### Fixed (CVF Toolkit Reference)
- **Type deduplication** — All modules now import from `interfaces.ts` instead of re-declaring types locally (~30 duplicate type definitions removed)
- **RiskLevel** — Added `R0` to align with CVF v1.2 spec (R0–R4)
- **OperatorRole** — Added `VIEWER` role
- **AuditEventType** — Added 4 missing event types from audit.logger
- **Provider interface mismatch** — `provider.interface.ts` now imports from `interfaces.ts` (was incompatible 2-param vs 1-param)
- **skill.registry.get() bug** — Fixed `!skill.active` → `skill.active === false` (skills without explicit `active: true` were inaccessible)
- **tsconfig.json** — Added `00_CANONICAL_REFERENCE` and `06_VERSIONING_AND_FREEZE` to `include`
- **5 test files fixed** — async/await for governance.guard, correct API calls in phase.controller, accurate assertions
- **dependency.map.md** — Updated to reflect actual import relationships
- **cvf.config.ts** — Added R0 entries to all risk mappings

### Fixed (CVF Starter Template Reference)
- **26 dead code files annotated** — `@reference-only` marker added to unused modules
- **Phase type mismatch** — Mapping comment added between ExecutionState and ExecutionPhase
- **Provider cost tracking** — TODO comments for hardcoded `costUSD: 0`
- **Risk escalation** — Warning comment about overly aggressive HIGH risk blocking
- Added `.gitignore` and `.dockerignore`

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
