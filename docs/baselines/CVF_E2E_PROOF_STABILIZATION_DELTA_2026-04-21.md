# CVF E2E Proof Stabilization — Implementation Delta

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Roadmap: `docs/roadmaps/CVF_E2E_PROOF_AND_REGRESSION_STABILIZATION_ROADMAP_2026-04-21.md`
> Status: CP1–CP5 DELIVERED — live verification repaired and rerun
> Commit: see closure commit for this delta

---

## Scope

Closes CP3, CP4, and CP5 of the E2E Proof & Regression Stabilization roadmap. CP1 and CP2 were
delivered in the prior session (commit 7a99e383).

---

## Files Delivered

### CP3 — Provider Lane UI Spec (Mock)

| File | Action |
| --- | --- |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/provider-lane-ui.spec.ts` | NEW — 4 tests |

Tests (run under `playwright.config.mock.ts`):
1. Settings shows Certified badge for Alibaba + `3/3 PASS` note; no parity language
2. Settings shows Certified badge for DeepSeek (≥2 Certified badges total)
3. At least one lane badge visible in ProviderSwitcher area
4. Full settings page contains no parity/quality-comparison language; evidence language present

Closes: **L-003**

---

### CP4 — Governance Gate Live Proof

| File | Action |
| --- | --- |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/tests/e2e/governance-gate-live.spec.ts` | NEW — 3 tests |

Tests (run with live Alibaba `qwen-turbo`; use `playwright.config.ts`):
1. Normal governed `/api/execute` request completes against a real provider response
2. Output validation and guard runtime metadata are present for the real provider response
3. Governance audit trail endpoint responds after the real call

Post-verification repair:

- The first E2E closure claimed live `governance/full` UI behavior, but those modes can be stopped before provider execution by approval/phase gates.
- The repaired proof uses a non-coder `analyze` action so the request reaches Alibaba and still asserts CVF governance metadata (`guardResult`, `outputValidation`, `providerRouting`).
- `/api/execute` now passes `rawBody.action` into `buildWebGuardContext`; before this repair the guard incorrectly treated the whole natural-language intent as the action and blocked safe analysis requests before provider execution.

---

### CP5a — Release Gate v2

| File | Action |
| --- | --- |
| `scripts/run_cvf_release_gate_bundle.py` | UPDATED — `--e2e` and `--e2e-live` flags added |

- `--e2e`: runs mock-mode UI structure specs only (`admin-rbac`, `provider-lane-ui`)
- `--e2e-live`: runs live governance specs only (`noncoder-governance-live`, `governance-gate-live`; fails if `DASHSCOPE_API_KEY` is not set)
- Default (no flag): runs both UI-only mock specs and mandatory live governance specs
- New `check_e2e()` helper added; timeout 600s to cover Playwright startup + live call latency

---

### CP5b — Demo Preconditions Script

| File | Action |
| --- | --- |
| `scripts/check_cvf_demo_preconditions.py` | NEW |

Checks:
1. `node_modules` installed (WARN if missing)
2. `DASHSCOPE_API_KEY` set (FAIL if missing)
3. Provider evaluator returns CERTIFIED for Alibaba (WARN/FAIL)
4. Demo script file exists (FAIL if missing)
5. RC docs present (FAIL if missing)

Output: `DEMO READY` / `DEMO READY (WARNINGS)` / `DEMO NOT READY`

---

### CP5c — Known Limitations Register

| File | Action |
| --- | --- |
| `docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md` | UPDATED |

- L-003 (Playwright drift): **CLOSED** — `provider-lane-ui.spec.ts` + config split + drift audit
- L-008 (non-coder path not automated): **CLOSED** — `noncoder-governance-live.spec.ts` (CP2)
- Header date updated
- "For demo preparation" guidance updated (L-003/L-008 no longer cited as open gaps)

---

## Test Delta

| Suite | Before | After | Delta |
| --- | --- | --- | --- |
| Playwright mock specs | 2 files / 5 tests | 2 active gate files / 6 tests | provider UI + admin structure |
| Playwright live specs | 1 file / 5 tests | 2 active live files / 7 pass + 1 skipped phase-gate placeholder | real Alibaba output proof |
| Vitest (cvf-web) | unchanged | unchanged | 0 |

---

## Known Limitations Closure Summary

| ID | Statement | Status |
| --- | --- | --- |
| L-003 | Playwright E2E Coverage Has Known Drift | **CLOSED 2026-04-21** |
| L-008 | Full E2E Non-Coder Path Not Automated End-to-End | **CLOSED 2026-04-21** |

---

## Verification Commands

```bash
# CP3 — mock-mode provider lane UI spec
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npx playwright test --config playwright.config.mock.ts tests/e2e/provider-lane-ui.spec.ts --reporter=line

# CP4 — live governance gate spec (requires DASHSCOPE_API_KEY)
DASHSCOPE_API_KEY=<key> npx playwright test tests/e2e/noncoder-governance-live.spec.ts tests/e2e/governance-gate-live.spec.ts --workers=1 --reporter=line

# CP5a — release gate dry-run (shows UI mock + mandatory live governance E2E commands)
python scripts/run_cvf_release_gate_bundle.py --dry-run

# CP5a — targeted UI-only mock E2E
python scripts/run_cvf_release_gate_bundle.py --e2e

# CP5a — targeted live governance E2E
DASHSCOPE_API_KEY=<key> python scripts/run_cvf_release_gate_bundle.py --e2e-live

# CP5a — full release gate; required for release-quality proof
DASHSCOPE_API_KEY=<key> python scripts/run_cvf_release_gate_bundle.py --json

# CP5b — demo preconditions
python scripts/check_cvf_demo_preconditions.py
```

---

*Filed: 2026-04-21 — E2E Proof & Regression Stabilization CP3–CP5 delta*
