# CVF Incremental Test Log

## 1) Purpose

This file is the single source of truth for incremental testing decisions.
Goal: avoid re-running full regression when unrelated areas did not change.

Baseline reference:
- `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`

---

## 2) Mandatory Rule (Effective from 2026-02-25)

Before running any test, you MUST read this file first.

Required pre-test gate:
1. Read latest entries in this file.
2. Run compatibility gate:
   - `python governance/compat/check_core_compat.py --base <BASE_REF> --head <HEAD_REF>`
3. Confirm changed scope (files/modules) for current task.
4. Select focused tests for impacted scope only.
5. Run full regression only if trigger conditions are met.

If step 1 is skipped, do not start test execution.

---

## 3) Full Regression Triggers

Run full `cvf-web` regression when at least one condition is true:
1. Shared safety/governance core changed (`safety-status`, governance context, shared libs).
2. Cross-cutting architecture changes (routing/layout/global providers/state).
3. Toolchain/runtime changes (major dependency upgrades, test/build config).
4. Security/auth/enforcement flow changed.
5. No clear impact boundary can be established.

If none of the above is true, run focused tests only.

---

## 4) Logging Standard

For each testing batch, log:
- Date
- Change reference (commit/range/PR)
- Impacted scope
- Tests executed
- Result
- Explicit skip scope and reason

Template:

```md
## [YYYY-MM-DD] Batch: <name>
- Change reference:
- Impacted scope:
- Tests executed:
  - `<command 1>` -> PASS/FAIL
  - `<command 2>` -> PASS/FAIL
- Skip scope:
  - `<module/file>`: skipped because unchanged from baseline/previous passing batch
- Notes/Risks:
```

---

## 5) Execution Log

## [2026-02-25] Batch: Baseline confirmed snapshot (latest standard)
- Source:
  - `docs/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md`
- Purpose:
  - Imported as the latest confirmed standard baseline.
  - All future focused testing decisions should compare against this snapshot first.
- Confirmed scope:
  - `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
  - `EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE`
  - `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME`
  - `EXTENSIONS/CVF_v1.7.2_SAFETY_DASHBOARD`
- Confirmed tests executed:
  - `npm run lint` -> PASS (0 errors, 0 warnings)
  - `npm run test:run` (`npx vitest run --reporter=json --outputFile test-results.json`) -> PASS
    - 1480 passed / 1483 total, failed 0, skipped 3
  - `npm run test:coverage` -> PASS
    - Statements 93.05%, Branches 80.46%, Functions 91.48%, Lines 94.18%
  - `npm run build` -> PASS when elevated (`Next.js 16.1.6`)
- Confirmed extension smoke tests:
  - `CVF_v1.7_CONTROLLED_INTELLIGENCE` -> PASS (138/138)
  - `CVF_v1.7.1_SAFETY_RUNTIME` -> PASS (97/97)
  - `CVF_v1.7.2_SAFETY_DASHBOARD` -> PASS (49/49)
- Cross-verification note:
  - Independent re-check confirmed total 1764 passed, 0 failed.
- Notes/Risks:
  - Windows local build may hit `.next` lock (`EPERM`) when not elevated.

## [2026-02-25] Batch: Compatibility gate bootstrap
- Change reference:
  - Added fast compatibility gate artifacts for core-impact decisioning.
- Impacted scope:
  - `governance/compat/core-manifest.json`
  - `governance/compat/check_core_compat.py`
  - `.github/workflows/cvf-web-ci.yml` (added compatibility impact report step)
  - `docs/CVF_CORE_COMPAT_BASELINE.md`
  - `docs/CVF_INCREMENTAL_TEST_LOG.md` (pre-test gate updated)
- Tests executed:
  - `python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD` -> PASS
- Skip scope:
  - Full regression: skipped (docs/process/tooling bootstrap only; no runtime logic changes in product modules).
- Notes/Risks:
  - Keep `core-manifest.json` in sync when trigger files or architecture boundaries change.

## [2026-02-25] Batch: Web UI updates (OpenClaw + useModals)
- Change reference:
  - `3424138` (hydration fix in `useModals`)
  - `f7e7404` (OpenClaw integration in Safety Dashboard)
- Impacted scope:
  - `src/lib/hooks/useModals.ts`
  - `src/lib/openclaw-config.ts`
  - `src/app/(dashboard)/safety/page.tsx`
- Tests executed:
  - `npm run test:run -- src/lib/hooks/useModals.test.ts src/lib/openclaw-config.test.ts "src/app/(dashboard)/safety/page.test.tsx"` -> PASS (11/11)
- Skip scope:
  - Full `cvf-web` regression: skipped because no full-regression trigger matched for this batch.
  - Unrelated components/libs: skipped because unchanged.
- Notes/Risks:
  - Initial run had one assertion conflict (duplicate text match), fixed by using non-ambiguous assertion.
