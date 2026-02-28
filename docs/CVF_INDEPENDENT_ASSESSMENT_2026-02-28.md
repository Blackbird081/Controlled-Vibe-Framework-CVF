# CVF Independent Assessment - 2026-02-28

## Scope
- Independent software assessment for CVF core/extensions.
- Explicitly excludes `Mini_Game`.

## Baseline
- Assessment date: 2026-02-28
- Repository head at assessment time: `7b7062e`

## Evidence Collected
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - `npm test`: PASS (41 tests)
  - `npm run typecheck`: FAIL
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
  - `npm run test:run`: FAIL (2 tests failing in safety page)
  - `npm run lint`: FAIL (24 issues: 18 errors, 6 warnings)
  - `npm run build`: PASS
- CI workflow review:
  - `cvf-extensions-ci.yml` does not include `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` paths.

## Findings (Ordered by Severity)

### 1) Critical - Safety page regression in web test suite
- `cvf-web` test run fails in `src/app/(dashboard)/safety/page.test.tsx`.
- Root cause observed: ambiguous selector `/send/i` matches both:
  - OpenClaw submit button (`Send`)
  - Explainability intent chip (`EMAIL SEND`)
- Evidence:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx:211`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx:422`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx:411`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx:1068`

### 2) Critical - CI gap for v1.7.3 extension
- Existing extension workflow only triggers for:
  - `CVF_v1.7_CONTROLLED_INTELLIGENCE`
  - `CVF_v1.7.1_SAFETY_RUNTIME`
  - `CVF_v1.7.2_SAFETY_DASHBOARD`
- `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` is not covered by CI path filters.
- Evidence:
  - `.github/workflows/cvf-extensions-ci.yml:6`
  - `.github/workflows/cvf-extensions-ci.yml:13`

### 3) High - Runtime Adapter Hub is not type-safe in current state
- Typecheck fails due to missing runtime/lib/type wiring:
  - Missing Node declarations (`fs`, `path`, `child_process`)
  - Missing globals (`fetch`, `AbortController`, timers)
- Evidence:
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tsconfig.json:6`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json:11`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/base.adapter.ts:5`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/openclaw.adapter.ts:5`

### 4) Medium - Risk/policy drift risk between hub and web UI
- `cvf-web` risk model is hardcoded while comments state data is from JSON configs.
- Canonical JSON in hub and UI values are not guaranteed to stay in sync.
- Evidence:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-models.ts:5`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-models.ts:33`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/risk.matrix.json:6`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/destructive.rules.json:3`

### 5) Medium - Public quality claims require refresh
- README quality snapshot advertises strong pass metrics while current independent rerun shows failures in web tests/lint and hub typecheck.
- Evidence:
  - `README.md:385`
  - `README.md:9`

## Strengths Observed
- Versioning policy and ADR discipline are clearly maintained.
  - `docs/VERSIONING.md`
  - `docs/CVF_ARCHITECTURE_DECISIONS.md`
- Runtime Adapter Hub has meaningful unit tests (41 passing) for core behaviors.
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tests/adapters.test.ts`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tests/policy-parser.test.ts`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tests/explainability.test.ts`
- `cvf-web` production build currently compiles successfully.

## Independent Conclusion
- CVF is architecturally strong and governance-mature.
- Current release hygiene is not yet at "high confidence production" for non-Mini_Game scope because:
  - Regression tests are red in `cvf-web`
  - `v1.7.3` is not covered by extension CI path filters
  - Runtime adapter hub typecheck is failing
- Recommended status: **Engineering progress is strong, but stabilization is required before asserting fully green quality posture.**

