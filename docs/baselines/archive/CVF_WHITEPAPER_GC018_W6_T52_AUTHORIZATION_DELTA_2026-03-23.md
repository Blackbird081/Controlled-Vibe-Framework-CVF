# CVF Whitepaper GC-018 W6-T52 Authorization Delta

Memory class: SUMMARY_RECORD
> Date: `2026-03-23`

## Tranche

**W6-T52 — Controlled Intelligence Governance Mapping + Entropy + Prompt Sanitizer Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 5 pure-logic contract gaps in CVF_v1.7_CONTROLLED_INTELLIGENCE)

## Scope

Provide dedicated test coverage for 5 pure-logic contracts in CVF_v1.7_CONTROLLED_INTELLIGENCE:

- `core/governance/risk.labels.ts` — getRiskLabel/formatRiskDisplay/getAllRiskLabels:
  R0-R3 emoji/label/description in vi/en, "🔴 Dangerous" format, all 4 levels in map
- `core/governance/risk.mapping.ts` — scoreToRiskLevel: ≥0.9→R3, ≥0.7→R2, ≥0.35→R1, <0.35→R0;
  riskLevelToScore: R0/R1/R2/R3 values; CVF_RISK_SCORE_MAP consistent with function
- `core/governance/role.mapping.ts` — getPrimaryRoleForPhase: A→RESEARCH, B→DESIGN, C→BUILD, D→REVIEW;
  isRoleAllowedInPhase: in/out-of-phase validation; getPhaseForRole: RESEARCH→A, BUILD→C
- `intelligence/determinism_control/entropy.guard.ts` — assessEntropy: calculated source,
  caller-provided fallback, no data→stable, variance>threshold→unstable+reason, custom threshold
- `intelligence/input_boundary/prompt.sanitizer.ts` — sanitizePrompt: clean→blocked=false,
  CRITICAL patterns→blocked, STRIP→[REDACTED], MEDIUM→LOG not blocked; isInputDangerous: CRITICAL/HIGH→true

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `core/governance/governance.mapping.test.ts` | CVF_v1.7_CONTROLLED_INTELLIGENCE | 244 | 47 |

## GC-023 Compliance

- New test file: 244 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7_CONTROLLED_INTELLIGENCE | 389 | 436 | +47 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes 5 governance mapping + entropy + prompt sanitizer coverage gaps.
