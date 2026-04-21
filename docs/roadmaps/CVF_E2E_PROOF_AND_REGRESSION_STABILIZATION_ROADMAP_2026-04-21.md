# CVF E2E Proof And Regression Stabilization Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: OPEN — CP1-CP5 pending
> Context: post-RC packaging; closes L-003 and L-008 from Known Limitations Register

---

## Goal

CVF is release-candidate ready. The remaining credibility gap is test coverage: the non-coder value path and provider lane UI are proven by manual walkthrough and canary receipts, but not by automated regression. This roadmap converts that manual proof into repeatable, headless E2E coverage.

Motivation from Known Limitations Register:

- **L-003** — Playwright E2E has known drift after W110-T3 UI changes (Settings, ProviderSwitcher, lane badges)
- **L-008** — Non-coder golden path not covered by any automated headless test

Delivering this roadmap means:

- existing E2E tests are audited, drift is documented, broken tests are fixed or retired
- a new non-coder golden path spec exists and runs green in mock mode
- a new provider lane UI spec exists and verifies CERTIFIED badge rendering without live API calls
- the release gate bundle gains an optional `--e2e` flag for operators who want full automated smoke

No new providers. No new features. No architecture changes. Test coverage only.

---

## Current E2E Baseline

Playwright config: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/playwright.config.ts`

- Test dir: `tests/e2e/`
- Base URL: `http://localhost:3001`
- Mock mode: `NEXT_PUBLIC_CVF_MOCK_AI=1` set by webServer env
- Timeout: 60 s per test

Existing spec files:

| File | Tests | Last known state | Drift risk |
| --- | --- | --- | --- |
| `agent-flows.spec.ts` | 3 | simple / governance / full mode flows | HIGH — checks Vietnamese UI strings and modal headings that may have shifted in W110-T3 |
| `admin-rbac.spec.ts` | 2 | admin enterprise plane + developer redirect | LOW — RBAC logic is stable; page routes unchanged |

Missing coverage:

| Gap | Limitation |
| --- | --- |
| Non-coder golden path (landing → template → intake → risk output) | L-008 |
| Provider lane badge rendering in Settings / ProviderSwitcher | L-003 adjacent |
| Demo Script paths (Path A, B, C) — no automated assertion | L-008 adjacent |

---

## Non-Goals

This roadmap is not for:

- replacing manual demo or canary runs
- writing E2E tests for every UI surface in cvf-web
- running live AI provider calls in Playwright (mock mode only)
- fixing TypeScript type errors unrelated to test files
- adding new governance features
- testing legacy EXTENSIONS outside the agent platform

---

## Step 1 — E2E Inventory and Drift Classification

Purpose:

- establish ground truth about which existing tests pass, which are drifted, and which are obsolete
- prevent the next agent from silently skipping broken tests

Run existing suite against current UI:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --reporter=line 2>&1 | tee test-output.txt
```

For each spec, record:

| Spec | Test | Result | Classification |
| --- | --- | --- | --- |
| `agent-flows.spec.ts` | Simple mode | PASS / FAIL / SKIP | STABLE / DRIFT / OBSOLETE |
| `agent-flows.spec.ts` | Governance mode | — | — |
| `agent-flows.spec.ts` | Full mode | — | — |
| `admin-rbac.spec.ts` | Admin access | — | — |
| `admin-rbac.spec.ts` | Dev redirect | — | — |

Classification rules:

- **STABLE** — passes as-is, no changes needed
- **DRIFT** — fails because UI changed; test logic is still valid, selector/text needs update
- **OBSOLETE** — tests behavior that no longer exists or was intentionally removed

Drift repairs (for DRIFT tests only):

- update selectors, text, or route names to match current UI
- do not change the behavioral assertion — what the test verifies should remain the same
- if the behavior itself was removed, reclassify as OBSOLETE and retire the test

Obsolete retirements:

- remove the test case
- leave a one-line comment in the spec explaining why: `// removed: <behavior> was retired in W110-T3`

Exit:

- all surviving tests pass or are explicitly marked skip with a reason
- drift classification table is recorded in the baseline delta

---

## Step 2 — Non-Coder Golden Path Spec

Purpose:

- automate Demo Script Path A as a headless Playwright test
- close L-008 in the Known Limitations Register

Create:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/noncoder-golden-path.spec.ts`

Required test cases:

### Test: landing page renders value props

```
navigate to /landing
expect heading "CVF" or "Controlled Vibe" to be visible
expect at least one CTA button to be visible
expect language toggle (EN/VI) to be present
```

### Test: template gallery loads and shows templates

```
navigate to / (home/dashboard)
expect template cards to be visible (at least 1)
expect at least one "Use Template" or "Start" button to be visible
```

### Test: intake wizard advances through steps

```
navigate to / → click first template
expect intake form to be visible
fill in: project name, description
advance to next step
expect risk classification or governance step to be shown
```

### Test: risk classification output is shown

```
complete intake wizard with minimal data
expect risk level indicator to be visible (R0 / R1 / R2 / R3 or any risk badge)
```

Mock mode requirements:

- all tests must run with `NEXT_PUBLIC_CVF_MOCK_AI=1` (already set by playwright.config.ts webServer)
- no live AI API call is acceptable
- if the UI requires an auth session, use the same `seedStorage` + `login` helper from `utils.ts`

Exit:

- spec file created
- all 4 tests pass in mock mode
- L-008 marked `Closed` in Known Limitations Register with date and spec path

---

## Step 3 — Provider Lane UI Spec

Purpose:

- automate verification that CERTIFIED lane badges render correctly in Settings and ProviderSwitcher
- ensure UI copy does not accidentally claim parity (language assertions)
- closes L-003 (drift) partially and covers the W110-T3 UI surface

Create:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/provider-lane-ui.spec.ts`

Required test cases:

### Test: Settings shows Certified badge for Alibaba

```
navigate to /settings
expect element with text "Certified" (case-insensitive) to be visible near Alibaba provider card
expect element with text "3/3" or "PASS" to be visible
expect NO element with text "parity", "fastest", "cheapest", "best" to exist in provider section
```

### Test: Settings shows Certified badge for DeepSeek

```
same pattern as Alibaba
```

### Test: ProviderSwitcher compact dropdown shows lane badge

```
open ProviderSwitcher dropdown
expect at least one provider item with a lane badge to be visible
expect badge text to be one of: "Certified", "Canary Pass", "Experimental", "Unconfigured"
```

### Test: Unconfigured provider shows Unconfigured badge (if applicable)

```
if a provider without key is shown in the UI:
expect badge text "Unconfigured" or "Add API key" to be visible
```

Mock mode requirements:

- provider badge data comes from static `PROVIDER_LANE_EVIDENCE` map in `provider-lane-metadata.ts`
- no live API call is needed; mock mode is sufficient
- if Settings requires auth, use `seedStorage` + `login` helper

Claim boundary assertion:

- at least one test must assert that prohibited parity language does NOT appear in the provider section
- prohibited text: "parity", "fastest", "cheapest", "best provider", "equal quality"

Exit:

- spec file created
- all tests pass in mock mode
- L-003 classification updated in Known Limitations Register from Open to Closed or Reduced

---

## Step 4 — Demo Script Executable Check

Purpose:

- turn the manual demo script (Path A, B, C) into a verifiable checklist
- not a full E2E replacement — a smoke check that confirms pre-conditions are met

Create:

- `scripts/check_cvf_demo_preconditions.py`

Required checks:

| Check | Command | Exit |
| --- | --- | --- |
| Dev server dependency: node_modules installed | check `cvf-web/node_modules` exists | WARN if missing |
| Provider matrix readable | `python scripts/evaluate_cvf_provider_lane_certification.py --json` | FAIL if error |
| Alibaba CERTIFIED | evaluator output | WARN if not CERTIFIED |
| DeepSeek CERTIFIED | evaluator output | WARN if not CERTIFIED |
| Demo script file exists | check `docs/guides/CVF_DEMO_SCRIPT_2026-04-21.md` | FAIL if missing |
| Release gate docs present | check truth packet + limitations register | FAIL if missing |

Output format:

```
CVF DEMO PRECONDITION CHECK — 2026-04-21
[PASS] node_modules installed
[PASS] Provider matrix readable
[PASS] Alibaba: CERTIFIED
[PASS] DeepSeek: CERTIFIED
[PASS] Demo script present
[PASS] RC docs present
---
RESULT: DEMO READY
```

Exit:

- script exists and runs clean
- output maps directly to Demo Script Path A / B / C prerequisites

---

## Step 5 — Release Gate v2 (Optional E2E Flag)

Purpose:

- add `--e2e` flag to `run_cvf_release_gate_bundle.py`
- when passed, runs Playwright E2E suite as an additional check after the existing 5 checks
- default behavior is unchanged — no live calls, no Playwright by default

Extend:

- `scripts/run_cvf_release_gate_bundle.py`

New flag: `--e2e`

Behavior when `--e2e` is set:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --reporter=line
```

- exit code 0 → E2E check PASS
- exit code non-0 → E2E check FAIL with output excerpt

New output row in gate report:

```
[PASS] E2E suite (Playwright)
       5/5 tests passed
```

or:

```
[FAIL] E2E suite (Playwright)
       2/5 tests failed — see test-output.txt
```

When `--e2e` is not set:

```
[SKIP] E2E suite (Playwright)
       pass --e2e to include headless browser checks
```

Exit:

- `--e2e` flag works and integrates with existing PASS/FAIL/WARN gate output
- default `--dry-run` and `--mock` behavior unchanged

---

## Recommended Control Points

### CP1 — E2E Inventory and Drift Repair

Deliver:

- drift classification table (per test: STABLE / DRIFT / OBSOLETE)
- all DRIFT tests repaired
- all OBSOLETE tests retired with comment
- all surviving tests pass

Suggested verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --reporter=line
```

Expected: all tests PASS or explicitly skipped.

### CP2 — Non-Coder Golden Path Spec

Deliver:

- `tests/e2e/noncoder-golden-path.spec.ts`
- 4 tests, all PASS in mock mode
- L-008 closed in Known Limitations Register

Suggested verification:

```bash
npx playwright test tests/e2e/noncoder-golden-path.spec.ts --reporter=line
```

### CP3 — Provider Lane UI Spec

Deliver:

- `tests/e2e/provider-lane-ui.spec.ts`
- CERTIFIED badge assertions for Alibaba + DeepSeek
- claim boundary negative assertion (no parity language)
- L-003 updated in Known Limitations Register

Suggested verification:

```bash
npx playwright test tests/e2e/provider-lane-ui.spec.ts --reporter=line
```

### CP4 — Demo Script Executable Check

Deliver:

- `scripts/check_cvf_demo_preconditions.py`
- clean output (PASS or WARN only) from a cold repo with configured providers

Suggested verification:

```bash
python scripts/check_cvf_demo_preconditions.py
```

### CP5 — Release Gate v2 (--e2e flag)

Deliver:

- `--e2e` flag in `run_cvf_release_gate_bundle.py`
- E2E check row in gate output
- default behavior unchanged

Suggested verification:

```bash
python scripts/run_cvf_release_gate_bundle.py --dry-run
# E2E row should show SKIP with instruction
python scripts/run_cvf_release_gate_bundle.py --e2e --mock
# E2E row should show PASS or FAIL based on actual Playwright run
```

---

## Evidence Requirements

Each completed control point should leave:

- a baseline delta under `docs/baselines/` recording what changed
- test output or screenshot path if E2E tests newly pass
- Known Limitations Register updated with L-003 and L-008 closure state

---

## Risk Notes

- `agent-flows.spec.ts` checks Vietnamese UI strings — if the app language defaulted to English in W110-T3, those strings will fail; fix by matching the actual rendered language or using language-neutral selectors.
- Playwright requires a running dev server; the `webServer` block in `playwright.config.ts` handles this automatically, but the first cold run will take ~2 minutes to start.
- Provider lane UI spec must not rely on live API state — all badge data comes from `PROVIDER_LANE_EVIDENCE` static map, which is always present regardless of API key.
- Adding new E2E tests increases total test runtime; keep each spec focused and avoid testing the same surface twice.
- The `--e2e` flag in the gate bundle should always be opt-in; never add it to CI by default without the operator's decision.

---

## Success Definition

This roadmap is complete when:

1. All existing Playwright tests are classified and either pass or are explicitly retired.
2. A non-coder golden path spec exists with 4 passing tests (L-008 closed).
3. A provider lane UI spec exists with CERTIFIED badge assertions and no-parity-language assertions (L-003 updated).
4. A demo precondition check script exists and runs clean.
5. The release gate bundle has a working `--e2e` flag that integrates E2E results into the gate report.
6. Known Limitations Register L-003 and L-008 are updated to reflect closed or reduced state.

---

*Filed: 2026-04-21 — next wave after RC packaging; focus on regression proof for non-coder path and provider lane UI*
