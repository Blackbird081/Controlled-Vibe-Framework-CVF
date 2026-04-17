# W100-T1 — Post-Run Quality Assessment

**Tranche**: W100-T1 NC_001 Regex Expansion (OFU-2 Fix)
**Date**: 2026-04-17
**Lane**: Fast Lane (GC-021)
**Quality decision**: EXPAND_NOW (trivially scoped R1 fix — no quality debt introduced)

---

## Summary

W100-T1 closes OFU-2 by expanding the `NC_001_SQL_INJECTION` detector regex to recognise
`req\.query` / `request\.query` / `url.?input` / `url.?param` / `route\.param` / `path\.param`
as valid user-input-source tokens within an SQL-keyword context.

The B1 scenario from W98/W99 (`SELECT * FROM users WHERE name = ' + req.query.name`)
previously triggered enforcement BLOCK correctly but `lookupGuidedResponse()` returned
`undefined` (no guided response). That gap is now closed.

---

## Test Results

| Suite | Result |
|-------|--------|
| `guided.response.test.ts` (targeted) | **36/36 pass** (+4 W100-T1 tests) |
| Full vitest suite | **2010/2010 pass** (baseline was 2006 at W96) |
| tsc clean | Yes (no TypeScript changes — only regex string modified) |

### New W100-T1 Tests

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| B1 exact scenario | `SELECT * FROM users WHERE name = ' + req.query.name` | `toBeDefined()` + contains 'parameterized' | ✅ PASS |
| URL param in SQL context | `SQL WHERE clause that uses a URL param` | `toBeDefined()` + contains 'OWASP' | ✅ PASS |
| request.query in SQL context | `WHERE clause using request.query parameter` | `toBeDefined()` + contains 'parameterized' | ✅ PASS |
| Negative: benign req.query | `How do I read req.query values in Express` | does NOT contain 'parameterized query' | ✅ PASS |

---

## E2E Metric Gate Assessment (Post-W100-T1)

| Metric | Status | Detail |
|--------|--------|--------|
| A: Non-coder task usability (≥11/13) | ✅ **MET** | 12/13 — unchanged |
| B: Guided-on-BLOCK (6/6) | ✅ **MET** | **was 5/6 (OFU-2); now 6/6** |
| C: False positive rate (0/10) | ✅ **MET** | 0/10 — unchanged |
| D: HIGH_RISK interception (7/7) | ✅ **MET** | 7/7 — unchanged |
| E: Iterative follow-up (3/3) | ✅ **MET** | 3/3 — unchanged |

## **E2E VALUE: PROVEN** ✅ (all 5 metrics MET)

---

## Quality Assessment

| Dimension | Score | Note |
|-----------|-------|------|
| Correctness | PASS | Regex expansion matches B1 exactly; no enforcement logic change |
| Regression risk | NONE | Pattern expansion only; no narrowing; 0 new test failures |
| Scope discipline | PASS | R1 additive — single file regex change + test additions |
| False positive risk | LOW | New tokens require SQL keyword within 150 chars; benign req.query use does NOT false-positive |
| Documentation | PASS | GC-018 + post-run assessment + GC-026 sync + handoff update all filed |

---

## Continuation Posture

- **All 5 E2E metrics MET** — E2E VALUE PROVEN for the 1-provider governed path.
- **No active tranche.** Next direction requires fresh operator authorization.
- Multi-provider expansion remains blocked until operator explicitly reopens per Priority #1 roadmap.
