# CHANGELOG — Controlled Vibe Framework (CVF)

---

## [2026-02-07] — Quality Pass 2 + Platform Updates

### Added
- Domain Refinement (Quality Pass 2) completed for CVF v1.5.2 Skill Library (12 domains, 114 skills)
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
- Validation warnings eliminated (114 skills pass `validate_skills.py`)

---
