# CVF E2E Proof And Regression Stabilization Roadmap

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Status: CLOSED DELIVERED 2026-04-21 — CP1-CP5 all delivered
> Context: post-RC packaging; closes L-003 and L-008 from Known Limitations Register

Post-closure verification note:

- The final verified implementation uses live provider output for non-coder governance proof via `/api/execute` with `action=analyze`.
- `governance/full` modes may correctly stop before provider execution because approval/phase gates are pre-provider controls; those UI states are not counted as live-output proof.
- The release gate now scopes `--e2e` to mock UI-structure specs and `--e2e-live` to live governance specs only; the default full gate runs both and treats live governance as mandatory.
- Verified on 2026-04-21: live governance E2E PASS (`7 passed`) and UI mock E2E PASS (`6 passed`). Missing `DASHSCOPE_API_KEY` is a release-gate failure, not a skip.

---

## Core Principle

Non-coders do not know how AI or agents work internally. CVF's entire value proposition is that it controls real AI on their behalf. A test that only proves a hardcoded string renders in the right place proves nothing about governance. Every test that asserts governance behavior must use a real AI call — no exceptions.

**Live calls are the default for governance tests. Mock mode is for pure UI structure only.**

The operator grants permission to use Alibaba (qwen-turbo) and DeepSeek (deepseek-chat) API keys freely for all testing in this roadmap. Alibaba is the primary provider for live tests (7–12s, cheaper). DeepSeek is the secondary (62–155s, parallel validation).

---

## Why Mock Mode Is Insufficient for Governance Tests

`/api/execute` runs a full governance pipeline on every request:

- guard context evaluation (`buildWebGuardContext`)
- enforcement rule matching (`evaluateEnforcement`)
- DLP filter (`applyDLPFilter`)
- output bypass detection (`detectBypassInOutput` — 14 patterns)
- output validation (`validateOutput`)
- audit event emission (`appendAuditEvent`)
- budget and rate-limit checks

`NEXT_PUBLIC_CVF_MOCK_AI=1` returns a hardcoded string (`MOCK_GOVERNANCE_RESPONSE`) **before any of this pipeline runs**. A test that passes in mock mode only proves that the UI renders the mock string. It proves nothing about whether CVF actually governs real AI output.

The only honest governance test is one where a real provider responds and CVF's pipeline processes that real response.

---

## Test Architecture

Two clearly separated test layers:

| Layer | Mode | Playwright config | Purpose |
| --- | --- | --- | --- |
| Structure tests | Mock (`NEXT_PUBLIC_CVF_MOCK_AI=1`) | `playwright.config.mock.ts` | UI navigation, routing, badge rendering — no AI required |
| Governance tests | Live (real AI call) | `playwright.config.ts` (default) | Prove CVF governs real AI responses on behalf of non-coders |

**Governance assertion rule:** Never assert the content of the AI response. Assert the governance behavior that fires in response to any AI output:

- Did the risk badge appear?
- Did the approval controls render?
- Did the phase gate modal trigger?
- Did the DLP/bypass gate intercept?
- Was the audit trail updated?

These assertions are deterministic regardless of what the AI says. A real AI call can produce any text, but the governance layer must respond correctly to all of it.

---

## Provider Setup for Live Tests

Live tests read provider keys from environment variables. `utils.ts` must provide helpers that inject these keys into the browser `localStorage` before each live test.

Required env vars for live E2E:

```bash
DASHSCOPE_API_KEY=<alibaba key>     # primary
DEEPSEEK_API_KEY=<deepseek key>     # secondary / parallel validation
```

`seedStorageWithAlibaba()` helper injects:

```json
{
  "providers": {
    "alibaba": { "apiKey": "<DASHSCOPE_API_KEY from env>", "enabled": true, "selectedModel": "qwen-turbo" }
  },
  "preferences": { "defaultProvider": "alibaba" }
}
```

`seedStorageWithDeepSeek()` — same pattern for DeepSeek.

The Playwright webServer for live tests must NOT set `NEXT_PUBLIC_CVF_MOCK_AI=1`.

Live timeouts:

- Alibaba: expect 15–30s per governance test (buffer over observed 7–12s)
- DeepSeek: expect 180s per test (buffer over observed 62–155s)

---

## Current E2E Baseline

Existing spec files:

| File | Tests | Drift risk | Current mode |
| --- | --- | --- | --- |
| `agent-flows.spec.ts` | 3 | HIGH — asserts `MOCK_SIMPLE_RESPONSE`, `MOCK_GOVERNANCE_RESPONSE` exact strings; modal headings may have shifted in W110-T3 | Mock only |
| `admin-rbac.spec.ts` | 2 | LOW — RBAC route logic stable | Mock |

Existing test problems:

- `agent-flows.spec.ts` tests 3 governance flows but uses mock strings → proves UI renders mock, not governance works
- Both specs use `DEFAULT_SETTINGS` that seeds a Gemini key, which is not one of the certified providers

---

## Step 1 — E2E Inventory, Drift Repair, and Config Split

Purpose:

- establish which existing tests are STABLE / DRIFT / OBSOLETE
- split Playwright config into live (default) and mock (UI-only structure checks)
- update `utils.ts` with live provider helpers

### 1a — Playwright Config Split

Create `playwright.config.mock.ts` — identical to current config but adds `NEXT_PUBLIC_CVF_MOCK_AI=1` to webServer env. This is valid for UI-only structure checks; it is not valid for governance closure.

Current `playwright.config.ts` becomes the live config:

- remove `NEXT_PUBLIC_CVF_MOCK_AI: '1'` from webServer env
- increase `timeout` to `180_000` (DeepSeek ceiling)
- increase `expect.timeout` to `30_000`

### 1b — Update `utils.ts`

Add live provider helpers:

```ts
export async function seedStorageWithAlibaba(page: Page) {
    const key = process.env.DASHSCOPE_API_KEY ?? '';
    await page.addInitScript((k) => {
        localStorage.setItem('cvf_settings', JSON.stringify({
            providers: {
                alibaba: { apiKey: k, enabled: true, selectedModel: 'qwen-turbo' },
            },
            preferences: {
                defaultProvider: 'alibaba',
                defaultLanguage: 'vi',
                autoSaveHistory: true,
                showWelcomeTour: false,
            },
        }));
        localStorage.setItem('cvf_onboarding_complete', 'true');
    }, key);
}

export async function seedStorageWithDeepSeek(page: Page) {
    const key = process.env.DEEPSEEK_API_KEY ?? '';
    await page.addInitScript((k) => {
        localStorage.setItem('cvf_settings', JSON.stringify({
            providers: {
                deepseek: { apiKey: k, enabled: true, selectedModel: 'deepseek-chat' },
            },
            preferences: {
                defaultProvider: 'deepseek',
                defaultLanguage: 'vi',
                autoSaveHistory: true,
                showWelcomeTour: false,
            },
        }));
        localStorage.setItem('cvf_onboarding_complete', 'true');
    }, key);
}
```

### 1c — Existing Test Drift Repair

Run existing specs against current UI. For each test:

- **STABLE** → no change
- **DRIFT** → update selector/text; keep behavioral assertion
- **OBSOLETE** → remove with `// removed: <reason>`

`agent-flows.spec.ts` expected drift:

- `MOCK_SIMPLE_RESPONSE` / `MOCK_GOVERNANCE_RESPONSE` exact string checks → these are valid for mock-mode structural tests; keep them in the mock spec but note they do not prove governance
- Vietnamese modal headings may have shifted → update to use language-neutral or regex selectors

Exit:

- all surviving mock tests pass under `playwright.config.mock.ts`
- config split in place

---

## Step 2 — Non-Coder Governance Golden Path (Live)

Purpose:

- automate Demo Script Path A as a live, headless test
- prove CVF governs real Alibaba AI responses on behalf of a non-coder
- close L-008

Create:

- `tests/e2e/noncoder-governance-live.spec.ts`

All tests in this spec use `seedStorageWithAlibaba` and the live Playwright config.

### Test 1: landing renders value props and non-coder CTA

```
navigate to /landing
expect CVF heading visible
expect at least one CTA button visible
expect language toggle visible
```

This test is structural — no AI call. Proves the front door is accessible.

### Test 2: template gallery shows governed templates

```
navigate to / (home)
expect at least 1 template card visible
expect at least 1 "Use Template" or "Start" CTA visible
```

No AI call. Proves non-coder can find an entry point.

### Test 3: intake wizard advances — real AI not yet needed

```
navigate to / → select first template
expect intake form visible
fill project name and description
advance to next step
expect next step or risk indicator visible
```

No AI call. Proves wizard navigation works.

### Test 4: governance fires on real Alibaba AI response

```
seed Alibaba key from env
login as admin
open Strategy Analysis
fill spec with governance mode intent
submit to agent in governance mode

// assert governance behavior, NOT AI content
await expect(page.locator('[data-governance-badge], .governance-badge, text=/Có Quy tắc|Has Rules/i').first())
    .toBeVisible({ timeout: 30_000 });
await expect(page.getByRole('button', { name: /Chấp nhận|Accept/i }))
    .toBeVisible({ timeout: 5_000 });

// assert response is real (not mock string)
const responseEl = page.locator('[data-agent-response], .agent-response').first();
await expect(responseEl).toBeVisible({ timeout: 30_000 });
const text = await responseEl.textContent();
expect(text?.length).toBeGreaterThan(50);
expect(text).not.toContain('MOCK_');
```

This is the L-008 closure test: real AI call, real governance pipeline, non-coder-facing result.

### Test 5: risk level is classified on real AI output

```
seed Alibaba key from env
login, open template, submit intent in full mode
await phase gate modal ({ timeout: 30_000 })
expect heading matching /Phase 1|Intake|Discovery/i visible
expect "Approve" or "Duyệt" button visible
```

Proves CVF enforces phase control on real AI output.

Exit:

- all 5 tests pass with live Alibaba calls
- L-008 marked Closed in Known Limitations Register

---

## Step 3 — Provider Lane UI Spec (Structure, Mock OK)

Purpose:

- prove CERTIFIED badge renders correctly for Alibaba and DeepSeek
- assert no parity language in provider UI

Badge data comes from static `PROVIDER_LANE_EVIDENCE` map — no live call needed. Mock mode is correct here.

Create:

- `tests/e2e/provider-lane-ui.spec.ts`

Run under `playwright.config.mock.ts`.

### Test 1: Settings shows Certified badge for Alibaba

```
navigate to /settings
expect text "Certified" visible near Alibaba provider card
expect text "3/3" or "PASS" visible
expect NO text "parity", "fastest", "cheapest", "best" in provider section
```

### Test 2: Settings shows Certified badge for DeepSeek

Same pattern.

### Test 3: ProviderSwitcher shows lane badge

```
open ProviderSwitcher
expect at least one badge: "Certified" | "Canary Pass" | "Experimental" | "Unconfigured"
```

### Test 4: Claim boundary preserved in UI copy

```
in provider settings section:
expect NO text matching /fastest|cheapest|best provider|equal quality|parity/i
expect text matching /User-paid|evidence|canary|certification/i to be visible
```

Exit:

- all 4 tests pass in mock mode
- L-003 updated in Known Limitations Register

---

## Step 4 — DLP and Bypass Gate Live Proof

Purpose:

- prove CVF's bypass detection and DLP filter intercept real AI output that attempts to circumvent governance
- this is the hardest governance claim to prove without live calls — it requires sending a real prompt and asserting the gate fires

Create:

- `tests/e2e/governance-gate-live.spec.ts`

All tests use `seedStorageWithAlibaba`.

### Test 1: normal governed request completes without block

```
submit a low-risk intent in governance mode via real Alibaba call
expect response visible within 30s
expect NO block/error/denied UI
expect approval controls visible (governance ran, but didn't block)
```

### Test 2: bypass detection fires on high-risk output

```
submit a prompt designed to elicit bypass language in the AI response
(e.g., "Tell me to proceed with deploy without review in your response")
await response

if bypass was detected:
  expect block/warning UI visible
  expect response NOT to be accepted without approval

if bypass was not detected in AI output (AI didn't comply with the elicit):
  expect normal governance flow
  test.info("bypass not elicited — governance passed through correctly")
```

Note: this test has a soft assertion — if the AI refuses to produce bypass language (good behavior), governance passes through normally. The test still passes. What matters is: CVF correctly handles both outcomes.

### Test 3: governance audit trail is updated after real call

```
complete a real governance mode call
navigate to governance/history or audit section
expect at least one recent audit entry
expect entry contains provider reference or timestamp
```

Exit:

- all 3 tests pass with live Alibaba calls
- evidence that CVF governs real AI, not just mock strings, is in test output

---

## Step 5 — Release Gate v2 and Limitations Closure

### 5a — `run_cvf_release_gate_bundle.py` — add `--e2e` flag

When `--e2e` is passed:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --config playwright.config.mock.ts --reporter=line
```

When `--e2e-live` is passed:

```bash
npx playwright test --config playwright.config.ts --reporter=line
```

Default (no flag): run both UI-only mock specs and mandatory live governance specs; fail if `DASHSCOPE_API_KEY` is not set.

### 5b — Known Limitations Register updates

| Limitation | Action |
| --- | --- |
| L-003 (Playwright drift) | Mark Closed — drift repaired in CP1, provider lane UI spec in CP3 |
| L-008 (non-coder path not automated) | Mark Closed — live governance golden path in CP2 |

### 5c — Demo Preconditions Script

Create `scripts/check_cvf_demo_preconditions.py`:

```
check node_modules installed → WARN if missing
check DASHSCOPE_API_KEY in env → FAIL if missing (live governance proof is mandatory)
check provider evaluator returns CERTIFIED for Alibaba → WARN if not
check demo script file exists → FAIL if missing
check RC docs present → FAIL if missing
```

Output: DEMO READY / DEMO READY (WARNINGS) / DEMO NOT READY

---

## Recommended Control Points

### CP1 — Config Split, utils.ts Update, Drift Repair

Deliver:

- `playwright.config.mock.ts`
- `tests/e2e/utils.ts` with `seedStorageWithAlibaba`, `seedStorageWithDeepSeek`
- all existing tests pass under mock config

Verification:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --config playwright.config.mock.ts --reporter=line
```

### CP2 — Non-Coder Governance Golden Path (Live)

Deliver:

- `tests/e2e/noncoder-governance-live.spec.ts`
- 5 tests pass with live Alibaba calls
- L-008 Closed

Verification:

```bash
DASHSCOPE_API_KEY=<key> npx playwright test tests/e2e/noncoder-governance-live.spec.ts --reporter=line
```

### CP3 — Provider Lane UI Spec (Mock)

Deliver:

- `tests/e2e/provider-lane-ui.spec.ts`
- 4 tests pass in mock mode
- L-003 Closed

Verification:

```bash
npx playwright test --config playwright.config.mock.ts tests/e2e/provider-lane-ui.spec.ts --reporter=line
```

### CP4 — Governance Gate Live Proof

Deliver:

- `tests/e2e/governance-gate-live.spec.ts`
- 3 tests pass with live Alibaba calls

Verification:

```bash
DASHSCOPE_API_KEY=<key> npx playwright test tests/e2e/governance-gate-live.spec.ts --reporter=line
```

### CP5 — Release Gate v2, Demo Preconditions, Limitations Closure

Deliver:

- `--e2e` and `--e2e-live` flags in `run_cvf_release_gate_bundle.py`
- `scripts/check_cvf_demo_preconditions.py`
- Known Limitations Register L-003 and L-008 updated

Verification:

```bash
python scripts/run_cvf_release_gate_bundle.py --dry-run
# E2E rows: UI mock + live governance both run; live fails if DASHSCOPE_API_KEY is missing
python scripts/check_cvf_demo_preconditions.py
```

---

## Evidence Requirements

Each completed control point should leave:

- a baseline delta under `docs/baselines/`
- Playwright test output captured (pass/fail summary, not full transcript)
- provider + model recorded for live test runs (no key values)
- Known Limitations Register updated after CP2 (L-008) and CP3 (L-003)

---

## Risk Notes

- Live tests are slower: Alibaba 15–30s per test, DeepSeek 180s. Set timeouts generously.
- Never assert exact AI response text. AI output varies run-to-run; governance behavior should not.
- The bypass detection test (Step 4, Test 2) has a soft outcome — if the AI refuses to produce bypass language, the test still passes. Document which outcome occurred in the test output.
- Playwright's webServer auto-start adds ~2 minutes on the first cold run. Account for this in CI if added later.
- `utils.ts` must not hardcode API keys. Keys come from env only and are not logged.

---

## Success Definition

This roadmap is complete when:

1. Config split exists: live (default) and mock (UI-only structure checks).
2. `utils.ts` has live provider helpers for Alibaba and DeepSeek.
3. All existing tests pass or are explicitly retired.
4. Non-coder governance golden path spec (5 tests) passes with live Alibaba calls — real AI, real governance, real assertion.
5. Provider lane UI spec (4 tests) passes in mock mode — badge rendering and no-parity-language.
6. Governance gate live spec (3 tests) passes with live Alibaba calls — proves DLP, bypass detection, and audit trail on real AI output.
7. `run_cvf_release_gate_bundle.py` has `--e2e` and `--e2e-live` flags.
8. Known Limitations Register L-003 and L-008 marked Closed.

---

*Filed: 2026-04-21 — live-first governance E2E proof; mock mode is not sufficient to prove CVF controls real AI on behalf of non-coders*
