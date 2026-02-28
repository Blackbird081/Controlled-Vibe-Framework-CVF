# CVF Independent Assessment - 2026-02-28 (Revalidation)

## Scope
- Independent software assessment for CVF core/extensions.
- Explicitly excludes `Mini_Game`.

## Assessment Timeline
- Initial baseline head: `7b7062e` (pre-fix state).
- Revalidation head: `3570a1d` (`fix: resolve all 5 findings from independent assessment 2026-02-28`).

## Revalidation Evidence (Current)
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
  - `npm test`: PASS (41 tests)
  - `npm run typecheck`: PASS
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
  - `npm run test:run`: PASS
  - `npm run build`: PASS
  - `npm run lint`: FAIL (24 issues: 18 errors, 6 warnings)
- CI workflow review:
  - `.github/workflows/cvf-extensions-ci.yml` now includes `CVF_v1.7.3_RUNTIME_ADAPTER_HUB` path filters and a dedicated test job.

## Findings (Current, Ordered by Severity)

### 1) High - Lint gate remains red in `cvf-web`
- Current codebase still has lint errors/warnings, including:
  - `@typescript-eslint/no-explicit-any`
  - `react-hooks/set-state-in-effect`
  - unused imports/variables
- Representative evidence:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx:497`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx:1353`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.tsx:129`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/hooks/useModals.ts:21`

### 2) Medium - Risk model drift risk still exists
- `cvf-web` risk data is still manually ported constants (not directly loaded from canonical JSON in hub).
- This is improved by warning comments but still structurally prone to drift.
- Evidence:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-models.ts:7`
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/risk-models.ts:8`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/risk.matrix.json`
  - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/destructive.rules.json`

### 3) Low - README quality snapshot is not fully aligned with rerun
- README claims `Lint: 0 errors`, while current independent rerun still reports lint failures.
- Evidence:
  - `README.md:385`

## Resolved Since Baseline
- Safety page regression test issue resolved:
  - Submit control is now uniquely targetable with `aria-label="Submit OpenClaw"`.
  - Test selectors updated to `getByRole(... /Submit OpenClaw/i)`.
  - Evidence:
    - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.tsx:407`
    - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx:211`
    - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/(dashboard)/safety/page.test.tsx:422`
- CI coverage gap for `v1.7.3` resolved:
  - Evidence:
    - `.github/workflows/cvf-extensions-ci.yml:9`
    - `.github/workflows/cvf-extensions-ci.yml:15`
    - `.github/workflows/cvf-extensions-ci.yml:65`
- Runtime Adapter Hub typecheck issue resolved:
  - `tsconfig` now includes `DOM` + `node` types, and `@types/node` added.
  - Evidence:
    - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tsconfig.json:6`
    - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tsconfig.json:10`
    - `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json:12`

## Independent Conclusion (Updated)
- Major blockers from the previous assessment are fixed.
- Current quality posture is materially improved: tests/build/typecheck are green in assessed scope.
- Remaining stabilization gap is mainly lint discipline plus one design-level drift risk.
- Recommended status: **Good progress; near-production quality once lint backlog and README alignment are closed.**
