# Independent Tester Assessment - CVF

Date: 2026-03-06 (Asia/Saigon)
Assessor role: Independent Tester
Scope: Recent updates up to commit `b3d6eeb` (pre-Layer 1.5 review)
Canonical location: `docs/CVF_INDEPENDENT_TESTER_ASSESSMENT_2026-03-06.md`

## Forensic Trace (Pre-Fix)

- Trace batch: `REVIEW/TRACE/2026-03-06_prefix_batch_01`
- requestId: `REQ-20260306-001`
- traceHash: `43fa3215147e13f1cbb1c8e8005f8e43c39514039d8f8935589bc6c15a297ace`
- Index file: `REVIEW/TRACE/2026-03-06_prefix_batch_01/TRACE_INDEX.md`

## Findings (Ordered by Severity)

1. Critical: `v2.0` build breaks due to invalid type import path.
- File: `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME/runtime/mode/mode.mapper.ts:5`
- Detail: `../types/index.js` does not resolve from `runtime/mode`; should traverse two levels.
- Validation: `npm run check` fails with TS2307.

2. Critical: `tools/skill_security_scanner` references a non-existent export.
- File: `tools/skill_security_scanner/scanner.engine.ts:4`
- Detail: imports `decodeSuspiciousContent` from `decoder.ts`, but `decoder.ts` only exports `decodeBase64Blocks`.
- Validation: `tsc` reports TS2305.

3. Critical: `v1.8.1` SDK imports missing edge-security modules.
- File: `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/sdk/cvf.client.ts:3-5`
- Detail: imports under `../runtime/edge_security/*`, but that folder is absent in the extension.

4. High: Sensitive masking is partial and may leak repeated secrets/PII.
- Files:
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/pii.detector.ts:17`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/secret.detector.ts:17`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/edge_security/security.proxy.ts:25`
- Detail: only first regex hit per pattern and single replace call are applied.

5. High: Failure audit semantics are inconsistent in v1.2.2 execution engine.
- File: `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/runtime/execution.engine.ts:53`
- Detail: failure path still logs `approved: true`, making compliance signal ambiguous.

6. Medium: Risk score includes global incidents, not skill-scoped incidents.
- File: `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/governance/skill.risk.score.ts:45-47`
- Detail: `securityIncidents = getAuditLogs().length` without filtering by `skillId`.

7. Medium: Risk dashboard regression check is biased to first skill only.
- File: `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME/ui/dashboards/risk.dashboard.tsx:29`
- Detail: computes regression from `metrics[0].skillId` in mixed-skill datasets.

## Validation Results (Executed)

- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - `npm test`: 41/41 passed
  - `npm run typecheck`: passed

- `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION`
  - `npm test`: 29/29 passed

- `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING`
  - `npm test`: 42/42 passed

- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - `npm test`: 29/29 passed

- `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME`
  - `npm test`: 32/32 passed
  - `npm run check`: failed at TypeScript build stage (TS2307)

## Independent Verdict

- Stability level: Medium
- Strength: multiple extension-level tests pass.
- Risk: integration/build readiness issues in newest modules remain release-blocking.

---

## Follow-up: Layer 1.5 / v1.1.1 (commit `5a2414b`)

Scope date: 2026-03-06  
Commit under review: `5a2414b feat(governance): integrate CVF v1.1.1 Phase Governance Protocol (Layer 1.5)`

### Findings (Ordered by Severity)

1. High: Deadlock detector is functionally a cycle detector, not a deadlock detector.
- File: `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/state_enforcement/deadlock.detector.ts:11-13`
- Detail: flags recursion stack hits (`cycles.push(state)`), but does not detect true dead-end states (no outgoing transitions).
- Impact: risk of false positives (valid loops treated as deadlocks) and false negatives (actual stuck states not flagged).

2. Medium: Scenario generation starts from only the first state.
- File: `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/scenario_simulator/scenario.generator.ts:42-45`
- Detail: only `machine.states[0]` is used as entrypoint.
- Impact: partial exploration for machines with multiple valid start states or reordered state arrays.

3. Medium: State machine parser validates state list existence but not transition shape integrity.
- File: `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/state_enforcement/state.machine.parser.ts:12-19`
- Detail: `transitions` is accepted as-is without checking each key maps to `string[]`.
- Impact: malformed inputs can pass parser and fail later in validator/checker paths.

4. Medium: Critical-risk branch in gate scoring is currently unreachable by rule definitions.
- Files:
  - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/phase_gate/gate.result.ts:38`
  - `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/phase_gate/gate.rules.ts:19-47`
- Detail: scoring supports `critical` checks, but no gate rule marks any check as critical.
- Impact: risk model cannot express "single critical failure => R3" in the current implementation.

5. Medium: No module-level automated tests are provided for this extension.
- Detail: no `package.json`, no `tsconfig.json`, no `tests/*.test.ts` in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`.
- Impact: regressions in governance logic are likely to slip into integration.

### Validation Results (Executed for Layer 1.5)

- Import path scan in `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`: no missing relative imports detected.
- TypeScript compile (ad-hoc) across `governance/**/*.ts`: passed.
  - Command basis: local `tsc` binary with `--noEmit --target es2020`.

### Independent Verdict for v1.1.1

- Design intent is clear and modular, but verification depth is still thin.
- Recommend adding minimal executable tests for:
  - deadlock semantics,
  - multi-entry scenario generation,
  - malformed transition payload rejection,
  - critical gate rule behavior.

## Retest Matrix (Full Recent Updates)

Retest date: 2026-03-06  
Goal: verify all recent code updates from `fe7be53..HEAD` with executable checks where possible.

### Executed and Passed

- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - `npm run typecheck`: passed
  - `npm test`: 41/41 passed

- `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING`
  - `npm run check`: passed (build + 42/42 tests)

- `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - `npm run check`: passed (build + 29/29 tests)

- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - ad-hoc TypeScript compile across `governance/**/*.ts`: passed
  - note: still no native test harness in this module

### Executed and Failed (Release Blockers)

1. `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION`
- `npm run check`: failed (many TS errors)
- Representative failures:
  - wrong import path namespace: `../policy/*` vs actual `policies/*`
  - missing modules and incompatible type contracts across `skill.*` files
  - model field mismatches (`CVFSkillDraft`, `CVFSkillCertified`, `ExternalSkillRaw`)
- Status: tests pass (`29/29`) but build/type safety is currently broken.

2. `EXTENSIONS/CVF_v2.0_NONCODER_SAFETY_RUNTIME`
- `npm run check`: failed
- Error: `runtime/mode/mode.mapper.ts` imports `../types/index.js` (invalid relative path from `runtime/mode`).
- Status: tests pass (`32/32`) but build is broken.

3. `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` (ad-hoc compile)
- Fails due to missing runtime imports:
  - `../runtime/edge_security/pii.detector`
  - `../runtime/edge_security/secret.detector`
  - `../runtime/edge_security/injection.precheck`
- Additional issues:
  - `InvocationEvent.versionHash` required but omitted in `sdk/cvf.client.ts`
  - React/JSX dependencies not declared/provisioned for dashboard TSX files.

4. `tools/skill_security_scanner` (ad-hoc compile)
- Fails due to:
  - `scanner.engine.ts` imports missing export `decodeSuspiciousContent`
  - `decoder.ts` uses `Buffer` without Node typing context.

5. `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` (ad-hoc compile)
- Fails due to unresolved runtime dependencies (`fs`, `crypto`, `path`, `node-fetch`, `js-yaml`) and absent build scaffold in module.
- Risk: module lacks self-contained install/build contract (no local package/tsconfig).

## Current Readiness Verdict (One-shot Fix Perspective)

- Tested coverage is now broad for recent updates, but **not all modules are release-ready**.
- One-shot fix should prioritize:
  1. Build blockers (`v1.2.1`, `v2.0`, `v1.8.1`, `tools scanner`, `v1.2.2` scaffold/deps).
  2. Logic risks previously listed (masking completeness, deadlock semantics, risk-scope correctness).
  3. Add minimal module-level CI checks for currently scaffold-less extensions.

## Remediation Update (2026-03-06 Fix Batch 01)

- Trace batch: `REVIEW/TRACE/2026-03-06_fix_batch_01`
- requestId: `REQ-20260306-002`
- traceHash: `85d8d210e3627b381a00529d5394ed88acfe4bce8665f605f1d34f564a5aad90`
- Index file: `REVIEW/TRACE/2026-03-06_fix_batch_01/TRACE_INDEX.md`

### Closed blockers
- `BUG-PREFIX-001` (`v1.2.1`): check/build contract repaired.
- `BUG-PREFIX-002` (`v2.0`): broken type import path fixed.
- `BUG-PREFIX-003` (`v1.8.1`): missing edge security modules + build scaffold fixed.
- `BUG-PREFIX-004` (scanner): missing decoder export and Buffer typing issue fixed.
- `BUG-PREFIX-005` (`v1.2.2`): module scaffold/dependency contract established and build passing.
- `BUG-PREFIX-006` (compat scripts): Windows Unicode console crash fixed.

### Validation snapshot after fixes
- `v1.2.1`: `npm run check` PASS
- `v1.7.3`: `typecheck + test` PASS
- `v1.8`: `npm run check` PASS
- `v1.8.1`: `npm run build` PASS
- `v1.9`: `npm run check` PASS
- `v2.0`: `npm run check` PASS
- `v1.2.2`: `npm run build` PASS
- scanner compile: PASS
- `v1.1.1` ad-hoc compile: PASS
- compat gates: PASS

### Remaining non-blocking risks
- LR-001: masking completeness in `v1.7.3`.
- LR-002: deadlock semantics in `v1.1.1`.
- LR-003: risk-scope bias in `v1.8.1` analytics.

## Coverage Closeout Update (REQ-20260306-003)

Trace batch: `REVIEW/TRACE/2026-03-06_coverage_batch_01`

### Final coverage status for recent updates
- `v1.2.1`: PASS threshold
  - Statements `97.92%`, Branches `92.09%`, Functions `100%`, Lines `97.92%`
- `v1.8`: PASS threshold
  - Statements `99.7%`, Branches `91.85%`, Functions `100%`, Lines `99.7%`
- `v1.9`: PASS threshold
  - Statements `100%`, Branches `96%`, Functions `100%`, Lines `100%`
- `v2.0`: PASS threshold
  - Statements `99.1%`, Branches `92.59%`, Functions `100%`, Lines `99.1%`
- `v1.7.3`: coverage harness now operational (`npm run test:coverage`)
  - Snapshot: Statements `42.49%`, Branches `74.35%`, Functions `72.5%`, Lines `42.49%`
  - Note: module currently has no threshold gate and includes many interface-only files.

### Fixes done during coverage hardening
- Added targeted test suites for pipeline and branch coverage:
  - `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/tests/v1.2.1.pipeline.test.ts`
  - extended test suites in `v1.8`, `v1.9`, `v2.0`.
- Added `@vitest/coverage-v8` + `test:coverage` script for `v1.7.3`.
- Fixed integrity defect in:
  - `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/governance.audit.ledger.ts`
- Removed unreachable branch block in:
  - `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION/certification/certification.state.machine.ts`
- Scoped `v1.2.1` coverage to exclude runtime-empty type-only model files in `vitest.config.ts`.

## Coverage & Gap Closure Addendum (REQ-20260306-004)

Trace batch: `REVIEW/TRACE/2026-03-06_coverage_batch_02`  
requestId: `REQ-20260306-004`

### Closure status for previously open risks

- `LR-001` (v1.7.3 masking partial): CLOSED
  - Multi-occurrence detection/masking/rehydration implemented.
  - Covered by `tests/edge-security.test.ts`.
- `LR-002` (v1.1.1 deadlock semantics + testability gaps): CLOSED in current scope
  - `deadlock.detector.ts` now detects cycles and dead-end non-terminal states.
  - `state.machine.parser.ts` transition-shape validation added.
  - `scenario.generator.ts` explores inferred entry states.
  - Native module test harness added.
- `LR-003` (v1.8.1 risk scope/bias): CLOSED
  - `skill.risk.score.ts` now uses skill-scoped audit logs.
  - risk dashboard no longer anchored to `metrics[0].skillId`.

### Official v1.7.3 coverage policy

- Defined in `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/vitest.config.ts`
- Include scope: adapters/explainability/policy/edge_security executable surfaces
- Thresholds (official):
  - Statements `90`
  - Branches `80`
  - Functions `90`
  - Lines `90`

### New coverage harnesses (implemented)

- `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME`
- `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE`
- `tools/skill_security_scanner`
- `EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`

Each module now has local:
- `package.json` scripts (`test`, `test:coverage`, `check`)
- `vitest.config.ts` with explicit include scope + thresholds
- executable tests under `tests/`

### Final coverage snapshot (trace-confirmed)

- `v1.7.3` -> PASS threshold
  - Statements `95.13%`, Branches `88.28%`, Functions `93.47%`, Lines `95.13%`
- `v1.8.1` -> PASS threshold
  - Statements `95.42%`, Branches `81.69%`, Functions `94.73%`, Lines `95.42%`
- `v1.2.2` -> PASS threshold
  - Statements `84.71%`, Branches `71.42%`, Functions `75%`, Lines `84.71%`
- `scanner` -> PASS threshold
  - Statements `93.3%`, Branches `69.81%`, Functions `100%`, Lines `93.3%`
- `v1.1.1` -> PASS threshold
  - Statements `95.35%`, Branches `82.95%`, Functions `100%`, Lines `95.35%`

### Updated verdict

- For scope covered by `REQ-20260306-004`, critical/high gaps from the independent review are now closed.
- Current status: **GO for one-shot fix closure in this batch**.

## Baseline Freeze Snapshot (Upgrade Anchor)

Snapshot date: 2026-03-06  
Anchor intent: lock a single trusted baseline before next upgrade wave.

### 1) Authoritative evidence chain

- `REQ-20260306-002`: prefix/build blocker remediation
- `REQ-20260306-003`: coverage hardening closeout
- `REQ-20260306-004`: gap closure + harness expansion + official `v1.7.3` threshold
- Trace roots:
  - `REVIEW/TRACE/2026-03-06_fix_batch_01`
  - `REVIEW/TRACE/2026-03-06_coverage_batch_01`
  - `REVIEW/TRACE/2026-03-06_coverage_batch_02`

### 2) Module readiness matrix (frozen)

| Module | Build/Check | Coverage Gate | Frozen Status |
|---|---|---|---|
| `v1.2.1` | PASS | PASS (`97.92/92.09/100/97.92`) | READY |
| `v1.7.3` | PASS | PASS (`95.13/88.28/93.47/95.13`) | READY |
| `v1.8` | PASS | PASS (`99.7/91.85/100/99.7`) | READY |
| `v1.8.1` | PASS | PASS (`95.42/81.69/94.73/95.42`) | READY |
| `v1.9` | PASS | PASS (`100/96/100/100`) | READY |
| `v2.0` | PASS | PASS (`99.1/92.59/100/99.1`) | READY |
| `v1.2.2` | PASS | PASS (`84.71/71.42/75/84.71`) | READY |
| `scanner` | PASS | PASS (`93.3/69.81/100/93.3`) | READY |
| `v1.1.1` | PASS | PASS (`95.35/82.95/100/95.35`) | READY |

### 3) Governance/risk closure state

- Prior `LR-001`, `LR-002`, `LR-003` are considered **closed in current assessed scope** (supersedes older interim risk notes above).
- No release-blocking findings remain in this baseline snapshot.

### 4) Operational caveat (environment)

- In restricted sandbox runs, Vitest may fail with `spawn EPERM`.
- For this baseline, authoritative execution evidence is the trace-final logs in `coverage_batch_02`.

### 5) Required gate for next upgrade cycle

Before accepting a new upgrade wave, require:
1. New requestId + new trace batch.
2. Keep current thresholds unchanged unless a documented exception is approved.
3. Re-run:
   - module `check`
   - module `test:coverage`
   - `python governance/compat/check_bug_doc_compat.py --enforce`
   - `python governance/compat/check_test_doc_compat.py --enforce`
