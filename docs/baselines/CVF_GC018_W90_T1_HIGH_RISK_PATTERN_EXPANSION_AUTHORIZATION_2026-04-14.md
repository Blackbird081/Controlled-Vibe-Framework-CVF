# GC-018 Authorization — W90-T1 HIGH_RISK Pattern Expansion

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Control: GC-018 (Continuation Governance)
> Tranche: W90-T1
> Class: PRODUCT / NON_CODER_VALUE / SAFETY_COVERAGE
> Status: AUTHORIZED

---

## Authorization Statement

W90-T1 HIGH_RISK Pattern Expansion is **authorized** as the first gate of the Priority #1
non-coder value lane. This tranche expands `guided.response.registry.ts` from 3 patterns
to 8 patterns, closing the most critical safety coverage gaps for non-coders.

---

## Scope

| Item | In scope | Out of scope |
|---|---|---|
| Add NC_001_SQL_INJECTION to registry | YES | |
| Add NC_002_XSS_OR_UNVALIDATED_INPUT to registry | YES | |
| Add NC_004_INSECURE_AUTH to registry | YES | |
| Add NC_005_PII_LOGGING to registry | YES | |
| Add NC_008_HARDCODED_SECRETS to registry | YES | |
| Extend guided.response.test.ts with new pattern tests | YES | |
| Update registry structure test (length 3 → 8) | YES | |
| Any guard logic change | | NO |
| Any policy weakening | | NO |
| Any route change | | NO |
| Any UI change | | NO |
| NC_009, NC_010 or patterns beyond 8 | | NO — deferred |
| Multi-provider work | | NO |

---

## Exit Criterion (per CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD §5)

- All 8 mandatory patterns present in registry
- Each pattern has deterministic detector + pre-authored guidance text
- NORMAL benchmark tasks still return `undefined` from `lookupGuidedResponse()`
- BLOCK/NEEDS_APPROVAL paths may carry `guidedResponse`; ALLOW must not
- 100% targeted test pass, zero regressions

---

## Roadmap Reference

`docs/roadmaps/CVF_NON_CODER_VALUE_REALIZATION_ROADMAP_2026-04-14.md` — TIER 1, W90-T1

---

*Authorization issued: 2026-04-14 — W90-T1 GC-018*
