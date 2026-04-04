# CVF Test Depth Classification Guard

**Guard Class:** `QUALITY_AND_CONFORMANCE_GUARD`
**Status:** Active reporting rule for test-depth truth whenever CVF publishes test metrics.
**Applies to:** Any human or AI-generated baseline review, assessment, release gate, or conformance report that includes test-count claims.
**Enforced by:** `governance/compat/check_foundational_guard_surfaces.py`, `docs/CVF_CORE_KNOWLEDGE_BASE.md`

## Purpose

- keep test-count reporting truthful instead of inflated by shallow structural checks
- help reviewers distinguish raw test volume from meaningful control coverage
- make baseline and release-readiness reports more comparable across waves and modules

## Rule

Any report that claims CVF test counts must classify those tests by depth and expose the meaningful-assertion posture of the suite.

### Test Tiers

| Tier | Name | Meaning | Example |
|---|---|---|---|
| `T1` | Structural | schema, import, type, or barrel-export checks | `index.test.ts`, type-shape check, import resolve |
| `T2` | Behavioral | main business logic, happy path, or state transition checks | `advanceStage()` success, policy pass, state `A -> B` |
| `T3` | Boundary | edge case, rejection, error path, or guard-clause checks | null input, invalid state, overflow, revoked skill blocked |
| `T4` | Integration | cross-module, cross-extension, or pipeline-wide checks | governance executor pipeline, remediation chain, cross-extension conformance |

Quick rule of thumb:

- import or existence only -> `T1`
- concrete output correctness -> `T2`
- rejection, throw, or boundary handling -> `T3`
- two or more modules or extensions working together -> `T4`

### Reporting Rules

Every test-count report must include a tier breakdown.

Correct example:

```text
Tests: 341/341 PASS
  T1 (Structural):   42  (12%)
  T2 (Behavioral):  148  (43%)
  T3 (Boundary):     98  (29%)
  T4 (Integration):  53  (16%)
  Meaningful (T2+T3+T4): 299/341 (88%)
```

Incomplete example:

```text
Tests: 341 PASS
```

### Meaningful Assertion Rate

Use this metric:

```text
Meaningful Assertion Rate = (T2 + T3 + T4) / Total Tests * 100%
```

Interpretation:

- `>= 70%` healthy
- `50-69%` acceptable but should improve `T3` or `T4`
- `< 50%` needs review because structural tests dominate

`T1` should not exceed `30%` of total test count without explanation.

### Application Rules

Classification is mandatory for:

- baseline reviews
- independent assessments
- release gate reports
- conformance reports

Classification is recommended, but not mandatory, for:

- PR or commit messages
- incremental test log entries when the tier is known

Every conformance scenario in `CVF_CONFORMANCE_SCENARIOS.json` is treated as `T4`.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_foundational_guard_surfaces.py`
- reporting truth remains anchored in `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- before publishing a test-count report, reviewers should confirm the tier breakdown, the meaningful assertion rate, and whether `T1` exceeds `30%`
- the guard does not require rerunning tests; it requires honest classification when reporting them

## Related Artifacts

- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_BASELINE_UPDATE_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md`

## Final Clause

If a report says only that CVF has "many tests" without showing what those tests actually prove, the number is not governance evidence yet.
