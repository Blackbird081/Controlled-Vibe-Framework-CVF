# CHANGELOG — Controlled Vibe Framework (CVF)

---

## [2026-03-19] — CVF Edit Integration: Phase 1-6 Verified Complete (Level 4.0)

### Verified
- **Phase 1 — Governance Runtime Hardening** — 15 guards, `MANDATORY_GUARD_IDS` (`authority_gate`, `phase_gate`, `ai_commit`), pipeline orchestrator with rollback/fail/pause
- **Phase 2 — Verification & Review Hardening** — Conformance runner (22 scenarios, 14 categories), `cvf-checklists.ts`, anomaly detection (DEAD_PATH, UNREACHABLE_STATE, LOOP_TRAP)
- **Phase 3 — Failure Handling & Traceability** — `governance.audit.log.ts` with hash ledger snapshots, artifact integrity verification
- **Phase 4 — Context & Scale Architecture** — `multi.agent.runtime.ts` (tenant isolation, resource locking, conflict detection, message bus, session TTL)
- **Phase 5 — Ecosystem Integration** — `cvf.sdk.ts` (`cvf.evaluate()`, `cvf.processEntry()`, `cvf.runConformance()`), 3 adapters (API/CLI/MCP), extension bridge
- **Phase 6 — Validation & Benchmarking** — 602 tests ALL PASS (504 governance + 98 guard contracts)

### Changed
- `CVF_GOVERNANCE_AUDIT_LOG_2026-03-19.md` — Updated enforcement table, conclusion from Level 2.5→4.0, all 4 audit deliverables checked
- `CVF_ARCHITECTURE_REVIEW_CONSOLIDATED_2026-03-19.md` — Updated gap map (3/5 resolved, 2/5 partial), maturity scores, governance Level 2.5→4.0
- `CVF_IMPROVEMENT_PROPOSALS_2026-03-19.md` — Status from "Proposed" to "✅ Implemented", all 6 groups Done
- `CVF_EDIT_INTEGRATION_ROADMAP_2026-03-19.md` — Added Phase 1-6 verification results table

### Governance Level
- **Previous:** Level 2.5 (Framework + Partial Runtime Governance)
- **Current:** **Level 4.0** (Ecosystem Standard — Enforceable Governance with SDK integration)

---

## [2026-03-13] — CVF Enterprise Features (Task 8.6)

### Added
- **NextAuth.js Integration** — Added `src/auth.ts` with Mock Credentials, GitHub, and Google SSO providers.
- **Enterprise RBAC** — Implemented 5 enterprise roles: Owner, Admin, Developer, Reviewer, Viewer.
- **Enterprise Guard Context** — Wired WebUI `session.role` securely into `GuardRequestContext.metadata.userRole`.
- **PhaseGateGuard Update** — Evaluates Enterprise RBAC allowed phases dynamically based on NextAuth roles.
- **RiskGateGuard Update** — Evaluates Enterprise RBAC maximum risk levels based on NextAuth roles.
- **Enterprise UI Hub** — `/admin/team` dashboard to map user roles.
- **Approval Workflow** — `/approvals` inbox for Admins/Owners to process ESCALATED R3 requests.
- **Compliance Reports** — `/reports/compliance` analytics dashboard auto-generating governance metrics UI.

### Changed
- `middleware.ts` upgraded to utilize NextAuth edge compatibility without breaking legacy fallback `verifySessionCookie`.
- Upgraded `playwright.config.ts` to cleanly invoke `npm run dev` with Next.js specific server ports.
- CVF Roadmap and task history updated to fully clear out deferred tasks from Sprint 8.

---

## [2026-03-06] — CVF v3.0 Core Foundation Primitives (branch cvf-next)

### Added
- **CVF v3.0 Core — "Git for AI Development"** — `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/`
  - **Layer 0 (Foundation Primitives)** — NEW layer below all existing layers
  - **AI Commit Model**: schema (9 CommitTypes), parser (deterministic SHA-256 commit_id), validator (8 RULE checks)
  - **Artifact Staging**: 4-state machine CANDIDATE→IN_GOVERNANCE→ACCEPTED/REJECTED
  - **Artifact Ledger**: append-only, content-addressed, version tracking with lineage
  - **Process Model**: gate-required stage advance, multi-process, auto-complete
  - 49 tests (100% PASS), coverage 90/80/90/90
- **CVF Core vs CVF Full** — officially distinct scopes:
  - CVF Core = standalone (AI dev teams)  
  - CVF Full = Core + Verification + Observability (enterprise)
- **ADR-016** — Major version gate for v3.0 (DRAFT)
- **Docs new**: CVF_ARCHITECTURE_MAP.md, CVF_WHITEPAPER_GIT_FOR_AI.md, CVF_ADOPTION_STRATEGY.md, CVF_SKILL_LIFECYCLE.md

---

## [2026-03-06] — CVF v1.1.2 Phase Governance Hardening

### Added
- **GOVERNANCE_PIPELINE** — deterministic fixed 6-module execution order (De_xuat_02)
- **Trust Boundary** — SHA-256 contentHash per artifact, `verifyAllHashes()` (De_xuat_06)
- **Hash Ledger** — `getHashLedger()`, `detectTampering()`, Hash Ledger audit snapshots (De_xuat_06)
- **Capability Isolation** — `PHASE_CAPABILITIES` map, `CapabilityViolationError` (De_xuat_07)
- **Self-Debugging** — `detectAnomalies()`: DEAD_PATH, UNREACHABLE_STATE, LOOP_TRAP (De_xuat_04)
- **System Invariants** — `checkInvariants()`, 3 built-in invariants INV-01/02/03 (De_xuat_05)
- **Governance Executor** — `runtime/governance.executor.ts` pipeline orchestrator (De_xuat_01)
- **Evolution Governance Rules** — 3-layer model (CORE/VERIFICATION/OBSERVABILITY), 5 Design Invariants INV-A→E
- **ADR-015** — v1.1.2 integration decision
- Tests increased from 12 → 22 (10 new), all PASS

---

## [2026-03-06] — CVF v1.1.1 Phase Governance Protocol Integrated

### Added
- **CVF v1.1.1 Phase Governance Protocol** — `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/`
  - **Layer 1.5 (Development Governance)** — NEW layer between Core and Tools
  - 9-stage deterministic pipeline: SPEC→STATE_MACHINE→STATE_DIAGRAM→IMPLEMENTATION→STATE_VALIDATION→UNIT_TESTING→SCENARIO_SIMULATION→PHASE_GATE→COMPLETE
  - 7 sub-modules: phase_protocol, phase_gate, state_enforcement, diagram_validation, structural_diff, scenario_simulator, reports
  - 21 TypeScript files
- **ADR-014** — Phase Governance Protocol integration decision

### Fixed (during integration)
- `scenario.generator.ts` — added MAX_SCENARIOS=100, MAX_DEPTH=50, cycle-safe DFS
- `mermaid.parser.ts` — added `toStateMachine()` converter for data structure compatibility
- `gate.result.ts` — added R0–R3 canonical risk level mapping

---

## [2026-03-05] — CVF_Layer AI Stack Integrated (v1.8.1 + v1.7.3 update + tools/)

### Added
- **CVF v1.8.1 Adaptive Observability Runtime** — `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/`
  - **Adaptive Governance**: Risk-based enforcement feedback loop (normal/moderate/strict/block)
  - **Observability**: 10 modules — telemetry, satisfaction, cost, regression, health, A/B testing
  - **Storage**: metrics.store, audit.store, snapshot.store
  - **UI Dashboards**: risk, skill analytics, cost, security audit
  - **SDK**: cvf.client.ts + integration.hooks.ts
- **Edge Security** merged into v1.7.3 Runtime Adapter Hub — PII detector, secret detector, injection precheck, vault + rehydration
- **Skill Security Scanner** — `tools/skill_security_scanner/` — pre-install static security analysis (behavior chain, obfuscation, base64 decode, prompt injection)
- **ADR-013** — CVF_Layer AI Stack refactoring decision: tách compound system thành 3 đích đến

### Architecture decisions
- CVF_Layer AI Stack = compound system (3 repos + 1 layer) → refactored into 3 đích đến:
  - Adaptive + Observability (tight coupling) → v1.8.1 (sub-extension of v1.8, Layer 2.5+3)
  - Edge Security → merge vào v1.7.3 (natural extension, Layer 5)
  - Security Scanner → tools/ (Layer 2 static analysis tool)
- Không tạo v3.0 — áp dụng Decision Framework: chưa đủ scope cho MAJOR version mới
- `CVF_Layer AI Stack/` folder at root sẽ bị xóa sau khi tích hợp xong

---

## [2026-03-05] — v1.2.2 Skill Governance Engine Integrated

### Added
- **CVF v1.2.2 Skill Governance Engine** — `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/`
  - **Skill Spec Schema (CSS-1.0)**: Chuẩn hóa toàn bộ skills với R0–R3 canonical mapping, evaluation block bắt buộc, maturity lifecycle
  - **Constitution Layer**: 5 CVF Rules STRICT, `constitution.ts` — không component nào được bypass
  - **Governance Kernel**: Risk threshold evaluation (≤70 = approve), integrity check, skill verification
  - **Phase Manager** (với Governance Gate): Phase transition bị block nếu không pass GovernanceKernel
  - **Skill Fusion Intelligence**: Multi-factor ranking (semantic 35% + historical 20% + maturity 15% − risk 15% − cost 15%)
  - **Evolution Engine** (Acontext-style): Execution trace → Pattern distill → Dynamic skill → Probation → Governance approve
  - **Internal Ledger**: skill_usage, risk_decision, dynamic_promotion, execution_trace logs
  - **Policy System**: global.policy.yaml + domain.policy.yaml + risk.matrix.yaml + cost.control.policy.yaml
  - **Maturity Model**: EXPERIMENTAL → PROBATION (5+ runs, 70% success) → STABLE (20+ runs, 85% success) → DEPRECATED
- **ADR-012** — Versioning Decision Framework (3 criteria: Scope / Dependency / User Impact) + v1.2.2 integration rationale
- **Decision Framework**: Permanent rule: "MỞ VERSION MỚI khi scope hoàn toàn mới. MỞ RỘNG LAYER CŨ khi là natural extension." Prevents version sprawl.

### Fixed (During Integration)
- Risk threshold conflict: `global.policy.yaml` aligned to 70 (matches `governance.kernel.ts`)
- Phase Manager: Added `GovernanceKernel.evaluate()` gate for GOVERNANCE_DECISION / EXECUTION / LEDGER_RECORD phases
- `skill.schema.yaml`: Added mandatory `evaluation` block (success_metrics, failure_conditions, rollback_strategy)
- `skill.schema.yaml`: Added `risk_r_level` enum (R0–R3) with numeric mapping documentation
- `TREEVIEW.md`: Removed duplicate `/fusion` reference — now only exists under `/skill_system/fusion/`

### Architecture decisions
- v1.2.2 is sub-extension of v1.2 (Skill Governance) — same domain, NOT a new MAJOR/MINOR version
- Layer 2 (Tools) — technical governance tooling, not UI/UX layer
- `CVF_Skill Specification/` folder at root replaced by `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/`
- Dynamic skills never auto-approved (probation required) — consistent with CVF safety-over-speed principle

---

## [2026-03-05] — v1.8/v1.9/v2.0 Governance Specs Integrated + Extension Rules

### Added
- **CVF v1.8 Safety Hardening** spec — `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/`
  - 7-phase execution state machine (INTENT→COMMIT), strictly enforced
  - Deterministic Mutation Sandbox + Mandatory Rollback Manager
  - Governance Brain: Risk formula, Mutation Budget, Escalation Tiers (L0–L3)
  - Behavior Drift Monitor + Stability Index (self-regulating autonomy)
  - TypeScript implementation treeview (future code target)
- **CVF v1.9 Deterministic Reproducibility** spec — `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/`
  - ExecutionRecord (9-field immutable record per execution)
  - Context Freezer (hash-locks context before ANALYSIS phase)
  - Replay Engine (audit-only replay of any past execution)
  - Forensic audit trail extending v1.7.1 requestId+traceHash
- **CVF v2.0 Non-Coder Safety Runtime** spec — `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/`
  - Mode Abstraction Layer: SAFE / BALANCED / CREATIVE (authoritative definition)
  - Intent Interpreter (human language → kernel policy mapping)
  - Builds on v1.7.2 Dashboard + v1.7.3 Adapter Hub
- **ADR-010** — Kernel Integration Strategy (v1.7.1 vs v1.8) + version placement decisions
- **`governance/compat/risk_level_mapping.md`** — Canonical R0–R3 ↔ numeric score mapping
- **CVF Extension Rules (R1/R2/R3)** — Mandatory governance for all future CVF additions
  - R1: Existing structure is always standard
  - R2: Additions must be compatible and additive
  - R3: Naming must follow CVF conventions
- **Architecture Check Guard** — `governance/toolkit/05_OPERATION/CVF_ARCHITECTURE_CHECK_GUARD.md`
- **CVF_CORE_KNOWLEDGE_BASE.md** — Permanent governance reference at `docs/`

### Changed
- `docs/CVF_CORE_KNOWLEDGE_BASE.md` — Added v1.8/v1.9/v2.0 to Section II (Layer 2.5) and Section III (version table). Added Section XIV (CVF Extension Rules).
- `README.md` — Added Architecture Check Rule + CVF Extension Rules in governance section
- `docs/CVF_ARCHITECTURE_DECISIONS.md` — Added ADR-010

### Architecture decisions
- v1.8 is a refinement of v1.7.1 (not replacement) — same Layer 2.5, starts from v1.7.1 codebase
- v1.9 is purely additive on top of v1.8 (no v1.8 components changed)
- v2.0 extends v1.7.2 + v1.7.3 at Layer 4/5 (does not bypass kernel)
- All v1.8→v2.0 content at Spec level — code implementation is future scope

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
  - `risk-models.ts` + `build-risk-models.js` — Automated CI sync script generating TS from canonical JSON hub config
  - 4 new sections on Safety Dashboard: Runtime Adapters, Action Explainability, NLP Policy Editor, Risk Matrix
- **CI job** `runtime-adapter-hub-tests` for v1.7.3 (vitest + typecheck)
- **ADR-005** — Architectural decision record for Hypervisor Mode extraction
- **BUG-010 → BUG-014** — 5 new entries in `BUG_HISTORY.md`

### Fixed
- **BUG-010** — Safety page test regression: ambiguous `/send/i` selector (added `aria-label="Submit OpenClaw"`)
- **BUG-011** — CI workflow missing v1.7.3 path filter
- **BUG-012** — v1.7.3 typecheck failure (added `@types/node` + DOM lib)
- **BUG-013** — Risk model drift risk (fixed by implementing `build-risk-models.js` to auto-generate TS definitions during build)
- **BUG-014** — README quality snapshot outdated (updated to 2026-02-28)
- **BUG-015** — 24 lint errors and build typecheck crashes across Web UI (resolved `no-explicit-any`, `set-state-in-effect`, introduced `OpenClawResultData`)

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
- **CVF Positioning** (`docs/reference/CVF_POSITIONING.md`) — Clear identity definition (3-layer architecture)
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
