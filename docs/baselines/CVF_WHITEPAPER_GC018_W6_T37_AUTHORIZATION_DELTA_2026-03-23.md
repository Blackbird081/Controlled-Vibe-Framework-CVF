# CVF Whitepaper GC-018 W6-T37 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T37 — ECO Extension Dedicated Test Gaps Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 3 ECO extension dedicated test coverage gaps)

## Scope

Provide dedicated test coverage for 3 ECO contracts that had no dedicated test files:

- `CVF_ECO_v1.0_INTENT_VALIDATION / DomainRegistry` — `domain.registry.ts`
  (DOMAIN_REGISTRY: 7 domains; correct defaultRisk levels; general has empty keywords;
   findDomains: no-match→[general] fallback; keyword scoring per domain; sorted by score desc;
   multi-domain detection; case-insensitive; general excluded from scoring loop;
   findActions: action word matching; underscore→word split; deduplication via Set)
- `CVF_ECO_v2.0_AGENT_GUARD_SDK / AuditLogger` — `audit.logger.ts`
  (resetAuditCounter; ID sequencing "AUD-NNNNNN"; log→AuditEntry propagation; getAll copy;
   getBySession/getByVerdict/getByRiskLevel filters; count; clear; exportJSON→valid JSON array)
- `CVF_ECO_v2.4_GRAPH_GOVERNANCE / TrustPropagator` — `trust.propagator.ts`
  (node not found→zero propagation; no in-edges→propagatedTrust=originalTrust; non-trusts edges
   excluded; contribution=source.trust*weight*decayFactor; propagatedTrust=min((node+avg)/2,1.0);
   multiple influencer avg; cap at 1.0; propagateAll→all nodes; applyPropagation→updates store+Map)

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/domain.registry.test.ts` | CVF_ECO_v1.0_INTENT_VALIDATION | 148 | 20 |
| `tests/audit.logger.test.ts` | CVF_ECO_v2.0_AGENT_GUARD_SDK | 200 | 19 |
| `tests/trust.propagator.test.ts` | CVF_ECO_v2.4_GRAPH_GOVERNANCE | 195 | 15 |

## GC-023 Compliance

- All 3 new test files: under 1200 hard threshold ✓
- Existing test files in each extension — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_ECO_v1.0_INTENT_VALIDATION | 41 | 61 | +20 |
| CVF_ECO_v2.0_AGENT_GUARD_SDK | 43 | 62 | +19 |
| CVF_ECO_v2.4_GRAPH_GOVERNANCE | 27 | 42 | +15 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes dedicated test coverage gaps for 3 ECO extension
contracts previously without dedicated test files.
