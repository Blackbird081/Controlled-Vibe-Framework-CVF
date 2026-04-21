# CVF E2E Proof Stabilization — Implementation Delta

Memory class: SUMMARY_RECORD

> Date: 2026-04-21
> Roadmap: `docs/roadmaps/CVF_E2E_PROOF_AND_REGRESSION_STABILIZATION_ROADMAP_2026-04-21.md`
> Status: CP1–CP5 DELIVERED
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
1. Normal governed request completes without block — response visible, no denied UI, approval controls rendered
2. Bypass detection handles high-risk output correctly — soft assertion; documents which outcome occurred
3. Governance audit trail updated after real call — navigates to audit section or checks `/api/audit/events`

---

### CP5a — Release Gate v2

| File | Action |
| --- | --- |
| `scripts/run_cvf_release_gate_bundle.py` | UPDATED — `--e2e` and `--e2e-live` flags added |

- `--e2e`: runs `npx playwright test --config playwright.config.mock.ts --reporter=line`
- `--e2e-live`: runs `npx playwright test --config playwright.config.ts --reporter=line` (skips if `DASHSCOPE_API_KEY` not set)
- Default (no flag): E2E row shows SKIP with two-flag instruction
- New `check_e2e()` helper added; timeout 600s to cover Playwright startup + live call latency

---

### CP5b — Demo Preconditions Script

| File | Action |
| --- | --- |
| `scripts/check_cvf_demo_preconditions.py` | NEW |

Checks:
1. `node_modules` installed (WARN if missing)
2. `DASHSCOPE_API_KEY` set (WARN if missing)
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
| Playwright mock specs | 2 files / 5 tests | 3 files / 9 tests | +1 file / +4 tests |
| Playwright live specs | 1 file / 5 tests | 2 files / 8 tests | +1 file / +3 tests |
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
DASHSCOPE_API_KEY=<key> npx playwright test tests/e2e/governance-gate-live.spec.ts --reporter=line

# CP5a — release gate dry-run (shows E2E SKIP with instruction)
python scripts/run_cvf_release_gate_bundle.py --dry-run

# CP5a — release gate with mock E2E
python scripts/run_cvf_release_gate_bundle.py --e2e

# CP5b — demo preconditions
python scripts/check_cvf_demo_preconditions.py
```

---

*Filed: 2026-04-21 — E2E Proof & Regression Stabilization CP3–CP5 delta*
