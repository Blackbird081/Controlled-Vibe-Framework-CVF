# 🐛 Bug History & Troubleshooting Guide

> **Purpose**: Document all bugs encountered during development, their root causes, solutions, and prevention strategies.  
> **Last Updated**: 2026-03-06  
> **Maintained by**: CVF Development Team  
> **Governance Policy**: [`CVF_BUG_DOCUMENTATION_GUARD.md`](../governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md)  
> **Compat Check**: `python governance/compat/check_bug_doc_compat.py --enforce`

---

## 📋 Table of Contents

- [How to Use This Document](#how-to-use-this-document)
- [Bug Log](#bug-log)
  - [BUG-001: Next.js Hydration Error](#bug-001-nextjs-hydration-error)
  - [BUG-008: API Key Wizard Button Missing onClick](#bug-008-api-key-wizard-button-missing-onclick)
  - [BUG-009: Tools Page Static Cards No Interactivity](#bug-009-tools-page-static-cards-no-interactivity)
  - [BUG-010: Safety Page Test Regression — Ambiguous Send Selector](#bug-010-safety-page-test-regression--ambiguous-send-selector)
  - [BUG-011: CI Workflow Missing v1.7.3 Path Filter](#bug-011-ci-workflow-missing-v173-path-filter)
  - [BUG-012: v1.7.3 Runtime Adapter Hub Typecheck Failure](#bug-012-v173-runtime-adapter-hub-typecheck-failure)
  - [BUG-013: Risk Model Data Drift Between Hub and Web UI](#bug-013-risk-model-data-drift-between-hub-and-web-ui)
  - [BUG-014: README Quality Snapshot Outdated](#bug-014-readme-quality-snapshot-outdated)
  - [BUG-015: Extensive Lint Errors and Build Typecheck Failures](#bug-015-extensive-lint-errors-and-build-typecheck-failures)
- [Quick Reference: Common Error Patterns](#quick-reference-common-error-patterns)
- [Prevention Checklist](#prevention-checklist)

---

## How to Use This Document

### When You Encounter a Bug:
1. **Search first** — Use `Ctrl+F` to search for the error message or keyword
2. **Check Quick Reference** — Common patterns are listed at the bottom
3. **If not found** — Add a new entry following the template below

### Adding a New Bug Entry:
Copy the template below and fill in all fields:

```markdown
---

### BUG-XXX: [Short Title]

| Field | Detail |
|-------|--------|
| **Date** | YYYY-MM-DD |
| **Severity** | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| **Component** | e.g., cvf-web, kernel, governance |
| **File(s)** | Path to affected files |
| **Status** | ✅ Fixed / 🔄 Workaround / ⏳ Open |

**Error Message:**
\`\`\`
Paste the exact error message here
\`\`\`

**Root Cause:**
Explain WHY the bug happened.

**Solution:**
Step-by-step fix with code changes.

**Prevention:**
How to avoid this in the future.

**Related Commits:** `abc1234`
```

---

## Bug Log

---

### BUG-001: Next.js Hydration Error

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-26 |
| **Severity** | 🟠 High |
| **Component** | cvf-web (Agent Platform) |
| **File(s)** | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.tsx` |
| **Status** | ✅ Fixed |

**Error Message:**
```
Recoverable Error
Hydration failed because the server rendered HTML didn't match the client.
This can happen if a SSR-ed Client Component used:
- A server/client branch `if (typeof window !== 'undefined')`
- Variable input such as `Date.now()` or `Math.random()`
```

**Root Cause:**  
The `useSettings()` hook in `Settings.tsx` called `loadInitialSettings()` during the initial `useState` initialization. This function reads from `localStorage`:

- **On Server (SSR):** `typeof window === 'undefined'` → returns `defaultSettings` (no API keys)
- **On Client:** Reads from `localStorage` → may return saved settings with API keys

This caused the `hasAnyApiKey` check in `page.tsx` to evaluate differently on server vs. client, producing different HTML structures (the API key warning div was present on server but absent on client, or vice versa).

**Solution:**

```diff
// Settings.tsx - useSettings hook

- const [settings, setSettings] = useState<SettingsData>(() => loadInitialSettings());
- const [isLoaded] = useState(true);
+ const [settings, setSettings] = useState<SettingsData>(defaultSettings);
+ const [isLoaded, setIsLoaded] = useState(false);
+
+ // Load settings from localStorage AFTER hydration
+ useEffect(() => {
+     const loaded = loadInitialSettings();
+     setSettings(loaded);
+     setIsLoaded(true);
+ }, []);
```

**Key Principle:** Never read `localStorage`, `sessionStorage`, or any browser-only API during the initial render of a component that runs on the server. Always defer to `useEffect`.

**Prevention:**
- ✅ Always use `useEffect` for `localStorage`/`sessionStorage` reads
- ✅ Initialize state with static default values that match SSR output
- ✅ Use `isLoaded` flag to handle loading states gracefully
- ✅ Test with SSR disabled to catch hydration mismatches early
- ❌ Never use `useState(() => browserOnlyFunction())` in SSR components

**Related Commits:** `8c7fbb7`

---

### BUG-008: API Key Wizard Button Missing onClick

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-26 |
| **Severity** | 🟡 Medium |
| **Component** | cvf-web (Dashboard Home Page) |
| **File(s)** | `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/layout.tsx` |
| **Status** | ✅ Fixed |

**Error Message:**
```
No error thrown — button simply had no effect when clicked.
```

**Root Cause:**  
The "Mở API Key Wizard" button on the home page banner (line 237) was rendered as `<button className="...">` without any `onClick` handler. The modal system (`useModals`) lives in `layout.tsx`, but `page.tsx` had no access to it — the two components don't share state directly.

**Solution:**

```diff
// page.tsx — dispatch custom event
- <button className="px-4 py-2 rounded-lg bg-amber-600 ...">
+ <button
+     onClick={() => window.dispatchEvent(new CustomEvent('cvf:openApiKeyWizard'))}
+     className="px-4 py-2 rounded-lg bg-amber-600 ..."
+ >

// layout.tsx — listen for event
+ useEffect(() => {
+     const handler = () => modals.openModal('apiKeyWizard');
+     window.addEventListener('cvf:openApiKeyWizard', handler);
+     return () => window.removeEventListener('cvf:openApiKeyWizard', handler);
+ }, [modals]);
```

**Prevention:**
- ✅ Always add `onClick` handler when creating `<button>` elements
- ✅ Use custom events or React Context for cross-component communication between layout and pages
- ❌ Never render a button without an action — at minimum add a TODO comment

**Related Commits:** `67dc382`

---

### BUG-009: Tools Page Static Cards No Interactivity

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-26 |
| **Severity** | 🟡 Medium |
| **Component** | cvf-web (ToolsPage) |
| **File(s)** | `src/components/ToolsPage.tsx` |
| **Status** | ✅ Fixed |

**Error Message:**
```
No error thrown — tool cards displayed as static documentation with no click response.
Banner "Coming Soon" implied tools were not yet functional.
```

**Root Cause:**  
`ToolsPage.tsx` rendered all tools using `<div>` elements (not `<button>`) with no `onClick` handlers. The tools were treated as read-only documentation cards. Meanwhile, the tools' `execute()` functions in `agent-tools.tsx` were fully functional — only the UI layer was missing interactivity.

**Solution:**  
Rewrote `ToolsPage.tsx`:
1. Changed `<div>` cards to `<button>` elements with `onClick` handlers
2. Added state management: `selectedToolId`, `params`, `lastExecResult`
3. When a card is clicked, it expands to show input fields + "Execute" button
4. Execute button calls `executeTool()` and displays result inline
5. Removed the "Coming Soon" banner

**Prevention:**
- ✅ Always wire up UI to existing backend/tool logic
- ✅ Use `<button>` for clickable elements, not `<div>`
- ✅ Remove "Coming Soon" banners when features are implemented

**Related Commits:** `67dc382`

---

### BUG-010: Safety Page Test Regression — Ambiguous Send Selector

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🔴 Critical |
| **Component** | cvf-web (Safety Page) |
| **File(s)** | `src/app/(dashboard)/safety/page.tsx`, `src/app/(dashboard)/safety/page.test.tsx` |
| **Status** | ✅ Fixed |

**Error Message:**
```
TestingLibraryError: Found multiple elements with the role "button" and name /send/i
```

**Root Cause:**
Integrating v1.7.3 ExplainabilityPanel added intent chips (e.g. `EMAIL SEND`) rendered as `<button>`. The existing test selector `screen.getByRole('button', { name: /send/i })` now matched both the OpenClaw submit button ("🐾 Send") and the intent chip ("EMAIL SEND").

**Solution:**
```diff
// page.tsx — add aria-label to disambiguate
  <button
      onClick={handleSubmit}
+     aria-label="Submit OpenClaw"
  >

// page.test.tsx — use specific selector
- fireEvent.click(screen.getByRole('button', { name: /send/i }));
+ fireEvent.click(screen.getByRole('button', { name: /Submit OpenClaw/i }));
```

**Prevention:**
- ✅ Always add `aria-label` to buttons with generic text ("Send", "Submit", "OK")
- ✅ After adding new UI components, re-run existing tests to check for selector collisions

**Related Commits:** `3570a1d`

---

### BUG-011: CI Workflow Missing v1.7.3 Path Filter

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🔴 Critical |
| **Component** | CI/CD |
| **File(s)** | `.github/workflows/cvf-extensions-ci.yml` |
| **Status** | ✅ Fixed |

**Error Message:**
```
No error — v1.7.3 changes pushed without triggering CI.
```

**Root Cause:**
When `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` was added, the CI workflow path filters were not updated. Only v1.7, v1.7.1, v1.7.2 were listed.

**Solution:**
```diff
  paths:
    - 'EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE/**'
    - 'EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/**'
    - 'EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD/**'
+   - 'EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/**'
```
Also added a new `runtime-adapter-hub-tests` job with `vitest run` + `npm run typecheck`.

**Prevention:**
- ✅ When adding a new EXTENSION, always update CI path filters and add a corresponding job
- ✅ Add CI update as a checklist item in the versioning workflow

**Related Commits:** `3570a1d`

---

### BUG-012: v1.7.3 Runtime Adapter Hub Typecheck Failure

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🟠 High |
| **Component** | CVF_v1.7.3_RUNTIME_ADAPTER_HUB |
| **File(s)** | `tsconfig.json`, `package.json`, `adapters/base.adapter.ts` |
| **Status** | ✅ Fixed |

**Error Message:**
```
error TS2304: Cannot find name 'fetch'.
error TS2304: Cannot find name 'AbortController'.
error TS2307: Cannot find module 'fs' or its corresponding type declarations.
```

**Root Cause:**
`tsconfig.json` only had `"lib": ["ES2022"]` without `"DOM"` (needed for `fetch`, `AbortController`) and no `@types/node` (needed for `fs`, `path`, `child_process`).

**Solution:**
```diff
// tsconfig.json
  "lib": [
-     "ES2022"
+     "ES2022",
+     "DOM"
  ],
+ "types": ["node"],

// package.json
  "devDependencies": {
+     "@types/node": "^22.0.0",
```

**Prevention:**
- ✅ When using Node.js APIs (`fs`, `child_process`), always include `@types/node`
- ✅ When using browser APIs (`fetch`), add `"DOM"` to lib
- ✅ Run `npm run typecheck` before committing new extensions

**Related Commits:** `3570a1d`

---

### BUG-013: Risk Model Data Drift Between Hub and Web UI

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🟡 Medium |
| **Component** | cvf-web, CVF_v1.7.3_RUNTIME_ADAPTER_HUB |
| **File(s)** | `cvf-web/src/lib/risk-models.ts`, `CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/*.json` |
| **Status** | ✅ Fixed |

**Error Message:**
```
No error — silent data inconsistency risk.
```

**Root Cause:**
Risk model data was manually ported (hardcoded) into `cvf-web/src/lib/risk-models.ts` from canonical JSON files in v1.7.3. Changes to the JSON files would not propagate to the Web UI.

**Solution:**
Implemented an automated `build-risk-models.js` script to parse the source JSON files directly and output a TypeScript file (`risk-models.generated.ts`). Tied this script into `package.json` lifecycle hooks (`predev`, `prebuild`) so that the UI always consumes fresh configuration logic. The initial mitigation (adding a warning comment) was replaced entirely by this CI-safe process.

**Prevention:**
- ✅ Use code-generation (`fs` → template string) during build-steps for strictly shared JSON data.
- ✅ Never rely on developers manually copy-pasting configurations between disconnected repo packages.

**Related Commits:** `e882ec8` (user sync automation commit)

---

### BUG-014: README Quality Snapshot Outdated

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🟡 Medium |
| **Component** | Root documentation |
| **File(s)** | `README.md` |
| **Status** | ✅ Fixed |

**Error Message:**
```
No error — misleading quality claims.
```

**Root Cause:**
README quality snapshot was dated 2026-02-26 and did not include v1.7.3 Hub Tests count. After adding v1.7.3 and Web UI integration, the snapshot should reflect the new test counts.

**Solution:**
```diff
- | **Quality Snapshot (2026-02-26)** | ... Kernel Tests: 51 passing |
+ | **Quality Snapshot (2026-02-28)** | ... Kernel Tests: 51 passing · Hub Tests: 41 passing |
```

**Prevention:**
- ✅ Update README quality snapshot whenever tests are added or removed
- ✅ Include new extension test counts in the snapshot

**Related Commits:** `3570a1d`

---

### BUG-015: Extensive Lint Errors and Build Typecheck Failures

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-28 |
| **Severity** | 🔴 Critical |
| **Component** | cvf-web (Safety Page / Config) |
| **File(s)** | `page.tsx`, `Settings.tsx`, `openclaw-engine.ts`, `openclaw-config.ts` |
| **Status** | ✅ Fixed |

**Error Message:**
\`\`\`
24 problems (18 errors, 6 warnings)
- @typescript-eslint/no-explicit-any
- react-hooks/set-state-in-effect
- @typescript-eslint/no-unused-vars
\`\`\`
Along with a Next.js build crash:
\`\`\`
Type error: Property 'status' does not exist on type '{}'.
\`\`\`

**Root Cause:**
While porting logic from v1.7.3 into Web UI, many types were lazily cast to `any` or `Record<string, any>`, triggering strict linting rules. Simultaneously, `refresh()` hooks were written in `useEffect` and triggered synchronous state updates, causing `cascading renders` warnings. Lastly, fixing the `any` types by replacing them with `Record<string, unknown>` broke the Next.js production build because `unknown` prevents deep property access (e.g., `result.decision?.status`).

**Solution:**
1. **Linting:** Removed unused imports. Replaced `any` arrays with proper generic structures.
2. **React Hooks:** Wrapped `setState`-triggering functions inside `useEffect` with `queueMicrotask(() => void refresh())` to safely schedule state updates outside the render phase.
3. **Typing & Build:** Introduced an explicit `OpenClawResultData` interface in `page.tsx` mapping the expected return signatures, rather than using `Record<string, unknown>`.

**Prevention:**
- ✅ Never use `any`. Define granular interfaces upfront.
- ✅ Use `queueMicrotask` or restructure `useEffect` when state modifications are strictly required post-mount.
- ✅ Always test full `npm run build` after fixing typechecker complaints.

**Related Commits:** `bc42782`

---

### BUG-016: v2.0 Non-Coder Runtime Build Break (Wrong Type Import Path)

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🔴 Critical |
| **Component** | `CVF_v2.0_NONCODER_SAFETY_RUNTIME` |
| **File(s)** | `runtime/mode/mode.mapper.ts` |
| **Status** | ✅ Fixed |

**Error Message:**
```
TS2307: Cannot find module '../types/index.js'
```

**Root Cause:**  
`mode.mapper.ts` lives under `runtime/mode` but imported type definitions using `../types/index.js` (one level up). Correct relative path is two levels up.

**Solution:**
```diff
- import type { SafetyMode, KernelPolicy } from '../types/index.js'
+ import type { SafetyMode, KernelPolicy } from '../../types/index.js'
```

**Prevention:**
- ✅ Run module-level `npm run check` (build + tests), not only tests.
- ✅ Add path integrity check for relative imports in release checklist.

**Related Commits:** pending local (trace: `REQ-20260306-002`)

---

### BUG-017: External Integration Pipeline Model Drift Broke Typecheck

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🔴 Critical |
| **Component** | `CVF_v1.2.1_EXTERNAL_INTEGRATION` |
| **File(s)** | `skill.adapter.ts`, `skill.validator.ts`, `skill.certifier.ts`, `skill.intake.ts`, `skill.publisher.ts`, `governance_hooks/*` |
| **Status** | ✅ Fixed |

**Error Message:**
```
Multiple TS errors:
- Cannot find module '../policy/...'
- Property does not exist on type ...
- Type 'X' is not assignable to type 'Y'
```

**Root Cause:**  
Pipeline orchestration files were out of sync with normalized v1.2.1 models/policies (`models/*`, `policies/*`) and still used legacy field names/import paths.

**Solution:**  
Aligned pipeline with canonical model contracts:
1. Fixed hook imports from `../policy/*` -> `../policies/*`.
2. Rebuilt adapter/validator/certifier/intake/publisher to use normalized structures.
3. Added compatibility shim in `external_skill.audit.log.ts` for legacy audit calls.
4. Revalidated full contract via `npm run check`.

**Prevention:**
- ✅ Keep pipeline files schema-locked to `models/*` via type-based CI.
- ✅ Require `npm run check` as release gate for each extension.

**Related Commits:** pending local (trace: `REQ-20260306-002`)

---

### BUG-018: Governance Compat Scripts Crash on Windows Console Encoding

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟡 Medium |
| **Component** | `governance/compat` |
| **File(s)** | `check_bug_doc_compat.py`, `check_test_doc_compat.py` |
| **Status** | ✅ Fixed |

**Error Message:**
```
UnicodeEncodeError: 'charmap' codec can't encode character '\u2705'
```

**Root Cause:**  
Scripts print Unicode symbols to stdout; on Windows cp1252 consoles, emoji output crashes despite underlying compliance result being valid.

**Solution:**  
Configured stdout/stderr to tolerate unsupported characters:
```python
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(errors="replace")
```

**Prevention:**
- ✅ Treat CLI output encoding as part of compat tooling portability tests.
- ✅ Prefer ASCII-safe output or graceful fallback in governance scripts.

**Related Commits:** pending local (trace: `REQ-20260306-002`)

---

### BUG-019: Governance Audit Ledger Integrity False-Negative

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟠 High |
| **Component** | `EXTENSIONS/CVF_v1.2.1_EXTERNAL_INTEGRATION` |
| **File(s)** | `governance.audit.ledger.ts` |
| **Status** | ✅ Fixed |

**Error Pattern:**
`GovernanceAuditLedger.verifyIntegrity()` may return `false` even when ledger was not tampered.

**Root Cause:**  
`append()` built hash payload with property order different from `verifyIntegrity()` recomputation payload. Because hash input was raw JSON serialization, key-order mismatch produced different hashes.

**Solution:**  
Normalized payload field order in `append()` to match `verifyIntegrity()` recomputation shape.

**Prevention:**
- ✅ Keep hash payload construction centralized/reused to avoid duplicate shape drift.
- ✅ Add regression tests that validate integrity before and after intentional tampering.

**Related Commits:** pending local (trace: `REQ-20260306-003`)

---

### BUG-020: v1.7.3 Edge Masking/Rehydration Only Applied First Occurrence

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟠 High |
| **Component** | `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` |
| **File(s)** | `edge_security/pii.detector.ts`, `edge_security/secret.detector.ts`, `edge_security/security.proxy.ts`, `edge_security/rehydrator.ts` |
| **Status** | ✅ Fixed |

**Error Pattern:**
Repeated secrets/PII inside a payload were only partially masked or rehydrated, creating leakage risk.

**Root Cause:**  
Detector and proxy flow depended on single `match` and one-shot replacement behavior.

**Solution:**  
1. Switched detectors to collect all matches (`matchAll`).
2. Normalized to unique sensitive values before masking.
3. Replaced single replacement with all-occurrence replace in masking and rehydration paths.
4. Added regression tests in `tests/edge-security.test.ts`.

**Prevention:**
- ✅ Add repeated-occurrence payloads as mandatory security regression cases.
- ✅ Keep masking and rehydration strategies symmetric for all matches.

**Related Commits:** pending local (trace: `REQ-20260306-004`)

---

### BUG-021: v1.8.1 Risk Score Counted Global Incidents (Unscoped)

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟡 Medium |
| **Component** | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` |
| **File(s)** | `storage/audit.store.ts`, `governance/skill.risk.score.ts` |
| **Status** | ✅ Fixed |

**Error Pattern:**
`securityIncidents` for one skill was inflated by incidents from other skills.

**Root Cause:**  
Risk scoring used unfiltered `getAuditLogs()` length instead of skill-scoped logs.

**Solution:**  
1. Added `skillId` filtering support in `audit.store`.
2. Updated risk score computation to query `getAuditLogs(skillId)`.

**Prevention:**
- ✅ Enforce scope parameter for per-entity scoring functions.
- ✅ Add mixed-skill audit fixtures in regression tests.

**Related Commits:** pending local (trace: `REQ-20260306-004`)

---

### BUG-022: v1.8.1 Dashboard Regression Detection Biased to First Metric Skill

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟡 Medium |
| **Component** | `CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` |
| **File(s)** | `ui/dashboards/risk.dashboard.tsx` |
| **Status** | ✅ Fixed |

**Error Pattern:**
Regression flag could miss issues when dataset contains multiple skills because only `metrics[0].skillId` was checked.

**Root Cause:**  
Dashboard logic assumed first metric skill is representative for full dataset.

**Solution:**  
1. Added helper to evaluate regression across all unique skill IDs.
2. Removed first-item bias in dashboard risk evaluation.

**Prevention:**
- ✅ Require multi-skill datasets in dashboard unit tests.
- ✅ Avoid first-item heuristics for aggregated governance metrics.

**Related Commits:** pending local (trace: `REQ-20260306-004`)

---

### BUG-023: v1.2.2 Failure Audit Logged `approved: true`

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟠 High |
| **Component** | `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` |
| **File(s)** | `runtime/execution.engine.ts` |
| **Status** | ✅ Fixed |

**Error Pattern:**
Failure execution path wrote approval status as true, causing semantic inconsistency in governance audit.

**Root Cause:**  
Shared logging path reused success approval flag in failure branch.

**Solution:**  
Set `approved: false` explicitly for failure path log entry and verified via module test harness.

**Prevention:**
- ✅ Add assertion for success/failure semantic parity in audit logs.
- ✅ Treat audit fields as policy contract and test explicitly.

**Related Commits:** pending local (trace: `REQ-20260306-004`)

---

### BUG-024: v1.1.1 Governance Protocol Had Semantic Gaps and No Native Test Harness

| Field | Detail |
|-------|--------|
| **Date** | 2026-03-06 |
| **Severity** | 🟠 High |
| **Component** | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` |
| **File(s)** | `state.machine.parser.ts`, `scenario.generator.ts`, `deadlock.detector.ts`, `phase_gate/gate.rules.ts` |
| **Status** | ✅ Fixed |

**Error Pattern:**
1) transition payload shape not strictly validated, 2) scenario generation explored only first state, 3) deadlock detector missed dead-end non-terminal states, 4) no native module tests.

**Root Cause:**  
Initial integration prioritized structure completeness over executable governance validation depth.

**Solution:**  
1. Added strict transition shape validation.
2. Expanded scenario entrypoint exploration.
3. Enhanced deadlock detection for cycle + dead-end states.
4. Added native test harness (`package.json`, `tsconfig.json`, `vitest.config.ts`, `tests/v1.1.1.test.ts`).

**Prevention:**
- ✅ Gate governance modules with mandatory local `check` + `test:coverage`.
- ✅ Include malformed-input and multi-entry topology tests by default.

**Related Commits:** pending local (trace: `REQ-20260306-004`)

---

## Quick Reference: Common Error Patterns

### Next.js / React

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `Hydration failed` | Server/client HTML mismatch | Defer browser APIs to `useEffect` |
| `Text content mismatch` | Dynamic text (dates, random) on SSR | Use `suppressHydrationWarning` or `useEffect` |
| `Invalid hook call` | Hook called outside component or conditionally | Check hook rules |
| `Module not found` | Wrong import path or missing dependency | Check `tsconfig.json` paths, run `npm install` |
| `ChunkLoadError` | Stale cached chunks after deployment | Clear `.next` cache, hard refresh |
| Button has no effect | Missing `onClick` handler | Check JSX for `onClick` prop |
| Card/div not clickable | Using `<div>` instead of `<button>` | Replace with `<button>` and add handler |

### TypeScript

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `Type 'X' is not assignable to 'Y'` | Type mismatch | Check interface definitions |
| `Property 'X' does not exist` | Missing field in type | Update interface or add optional `?` |
| `Cannot find module '@/...'` | Path alias issue | Check `tsconfig.json` `paths` config |

### Build & Deploy

| Error Pattern | Likely Cause | Quick Fix |
|--------------|-------------|-----------|
| `ENOSPC` | Disk full or too many file watchers | Increase `fs.inotify.max_user_watches` |
| `Port already in use` | Another process on same port | Kill process or change port |
| `CORS error` | API domain mismatch | Check API route config and middleware |

---

## Prevention Checklist

Use this checklist before submitting code:

### SSR Safety
- [ ] No `localStorage`/`sessionStorage` reads during initial render
- [ ] No `window`/`document` access outside `useEffect`
- [ ] No `Date.now()` or `Math.random()` in SSR render paths
- [ ] Dynamic imports with `{ ssr: false }` for browser-only components

### Type Safety
- [ ] No `any` types without justification
- [ ] All API responses properly typed
- [ ] Null checks on optional fields

### Performance
- [ ] No unnecessary re-renders (check `useMemo`/`useCallback`)
- [ ] Images optimized with `next/image`
- [ ] No memory leaks in `useEffect` cleanup

### Testing
- [ ] Unit tests for new utility functions
- [ ] Manual test in both light/dark mode
- [ ] Test with empty `localStorage` (incognito mode)

---

> 💡 **Tip:** When you fix a bug, always add it here BEFORE pushing the commit. This builds our knowledge base over time and saves hours of debugging for the team.
