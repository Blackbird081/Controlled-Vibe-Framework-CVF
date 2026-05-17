# Changelog

All notable changes to CVF Toolkit Integration Spec will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-17

### Fixed
- Unified phase model to 7-phase (P0–P6) across all mapping docs
- Separated spec documentation from TypeScript implementation (3 files)
- Standardized risk naming to R1/R2/R3/R4 across all modules
- Fixed broken imports in adapter layer
- Fixed `audit.logger.ts` timestamp field (made optional)

### Added
- `governance.guard.spec.md` — Governance spec documentation
- `risk.classifier.spec.md` — Risk classifier spec documentation
- `phase.controller.spec.md` — Phase controller spec documentation
- `change.controller.ts` — Change control lifecycle engine
- `errors.ts` — Centralized error classes with CVF_ERR codes
- `cvf.config.ts` — Centralized configuration values
- `interfaces.ts` — Shared type definitions
- `tsconfig.json` — TypeScript compiler configuration
- `package.json` — Project configuration and dependencies
- `CHANGELOG.md` — This file
- `REVIEW_BASELINE.md` — Independent review and recommendations

## [1.0.0] - 2026-02-01

### Added
- Initial CVF Toolkit Integration Specification
- 9 modules: Canonical Reference through Documentation
- Core mapping specs (governance, risk, skill, change, agent lifecycle)
- Toolkit core implementation (TS)
- Adapter layer (5 adapters)
- Extension layer (Financial, Dexter)
- UAT & Certification framework
- Versioning & Freeze protocol
- AI Provider abstraction (OpenAI, Claude, Gemini)
- Documentation (architecture, playbook, bootstrap, behavior contract)
