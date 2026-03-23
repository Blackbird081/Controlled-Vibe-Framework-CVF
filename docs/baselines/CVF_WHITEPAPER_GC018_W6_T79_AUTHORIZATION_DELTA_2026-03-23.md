# CVF Whitepaper GC-018 W6-T79 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T79 — Validation Schemas & RefusalPolicyRegistry Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes 2 contract gaps in CVF_v1.7.1_SAFETY_RUNTIME)

## Scope

Provide dedicated test coverage for 2 contracts in CVF_v1.7.1_SAFETY_RUNTIME:

- `validation/schemas.ts` — `validate<T>()` helper:
  valid data→success=true+data; invalid→success=false+errors[];
  errors use "path: message" format; null input→errors array
  `ProposalEnvelopeSchema`: valid/non-uuid/bad-source/confidence>1/empty-action
  `LoginRequestSchema`: valid/username-too-short/password-too-short
  `RegisterPolicySchema`: valid/version-without-v/empty-rules/short-v1
  `LifecycleInputSchema`: simulateOnly omitted→defaults false; simulateOnly=true preserved
  `AISettingsSchema`: valid/temperature>2/maxTokens>128000
- `kernel/04_refusal_router/refusal_policy_registry.ts` — RefusalPolicyRegistry:
  latestVersion()→"v1"; get("v1")→R0=allow/R3=needs_approval/R4=block;
  get("v1")→clarifyOnSignalsAtR2=true; get(unknown)→throws

## Artifacts Delivered

| File | Extension | Lines | Tests |
|---|---|---|---|
| `tests/safety-runtime-validation-schemas-refusal-policy-registry.test.ts` | CVF_v1.7.1_SAFETY_RUNTIME | 205 | 25 |

## GC-023 Compliance

- New test file: 205 lines — under 1200 hard threshold ✓
- Existing test files — untouched ✓
- Source contracts — untouched ✓

## Test Counts (Post-Delivery)

| Extension | Before | After | Delta |
|---|---|---|---|
| CVF_v1.7.1_SAFETY_RUNTIME | 591 | 616 | +25 |

All CVF planes (LPF 377 / GEF 185 / EPF 416 / CPF 644 / GC 172) unaffected — green.

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes validation schemas (validate helper + 5 key schemas)
and RefusalPolicyRegistry dedicated test coverage gaps in CVF_v1.7.1_SAFETY_RUNTIME.
