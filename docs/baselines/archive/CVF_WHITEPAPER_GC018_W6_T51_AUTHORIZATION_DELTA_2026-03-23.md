# CVF Whitepaper GC-018 W6-T51 Authorization Delta

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`

## Tranche

**W6-T51 — Controlled Intelligence Lessons Registry Dedicated Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 5 contract gaps in CVF_v1.7_CONTROLLED_INTELLIGENCE)

## Scope

Provide dedicated test coverage for 5 contracts in the learning/lessons_registry
module of CVF_v1.7_CONTROLLED_INTELLIGENCE:

- `learning/lessons_registry/conflict.detector.ts` — detectConflict: no conflicts,
  different-category-different-rootCause→none, same-category-exact→EXACT conflict,
  high keyword overlap→SIMILAR conflict, same rootCause across categories→ROOT-CAUSE
- `learning/lessons_registry/lesson.signing.ts` — signLesson/verifyLesson/signAndAttach/
  verifySignedLesson: 8-char hex, deterministic, different field→different sig, correct→true,
  wrong→false, unsigned→invalid, tampered→mismatch reason
- `learning/lessons_registry/rule.versioning.ts` — registerRuleVersion/getRuleHistory:
  2 versions for rule-A, 1 for rule-B, unknown→empty, previousVersion preserved, no cross-pollution
- `learning/lessons_registry/lesson.store.ts` — registerLesson/getActiveLessons/deactivateLesson:
  active lessons returned, inactive excluded, deactivate removes from active set
  (timestamp-based unique IDs used to prevent disk persistence collision)

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `learning/lessons_registry/lessons.registry.test.ts` | CVF_v1.7_CONTROLLED_INTELLIGENCE | 242 | 25 |

## GC-023 Compliance

- New test file: 242 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7_CONTROLLED_INTELLIGENCE | 364 | 389 | +25 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes 5 lessons_registry dedicated test coverage gaps.
