# CVF Expense Browser Preview - Usage and Limits

Memory class: governed-guide
Date: 2026-10-10
Batch ID: CVF-NCR-EXPENSE-BROWSER-20261010
Text Encoding Exception: Vietnamese synthetic labels and notices use Vietnamese letters with diacritics.

Status: COMPLETE_PENDING_REVIEW

## Purpose

Usage and limits for the private browser preview of the accepted `ExpenseList` component. Verification record is in the worker return.

## Scope / Target / Owner Boundary

Target: the two scripts and the evidence and return files of batch CVF-NCR-EXPENSE-BROWSER-20261010. Owner: Local reviewer for acceptance; the worker does not commit.

## What it is

A private, offline, self-contained HTML preview that renders the accepted read-only
`ExpenseList` component (`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx`)
with five synthetic rows, plus a headless Chromium test that drives it.

It is a UI preview only. It is not an application route, not an AI-governance feature,
not a storyboard change and not a use of real expense data.

## Commands (repository root)

- Build the primary preview (pinned source, synthetic rows):
  `node scripts/cvf_expense_fixture_preview.cjs --output .cvf/runtime/cvf-expense-browser-worker-20261010/expense-preview.html`
- Build the calendar negative variant: add `--variant calendar` and a different `--output`.
- Syntax checks: `node --check scripts/cvf_expense_fixture_preview.cjs` and `node --check scripts/test_cvf_expense_fixture_preview_browser.cjs`.
- Browser proof: `node scripts/test_cvf_expense_fixture_preview_browser.cjs`. It writes
  `browser-results.json`, two PNG screenshots and mutant HTML files under `.cvf/runtime/cvf-expense-browser-worker-20261010/`.

## Build rules

- The builder refuses (exit 1, `REFUSED: SOURCE_PIN_DRIFT`) when the on-disk component's SHA-256
  differs from `rawSha256` in `docs/reviews/evidence/cvf-expense-browser-dispatch-inputs-2026-10-10.json`.
  The output file is replaced only after a successful build (write to temp file, then rename).
- Vite runs with `configFile: false`, `envFile: false`, `write: false` and `NODE_ENV` set to `"production"`.
  No environment variables or ambient config are read or serialized.
- The output is one HTML file with all JavaScript and CSS inline. It has no stylesheet links,
  no fonts, no images and no source maps. `</script` is escaped inside the bundle.
- The helper `writePreview({ output, variant, sourcePath, sourceTextOverride })` is for test-only runtime
  negatives. `sourceTextOverride` compiles a mutated copy and never changes the accepted file.

## Browser proof scope

- Launches only the installed Playwright Chromium (no install, no HTTP listener).
- Desktop 1280x800 and mobile 390x844. Explicit DOM waits; no timing sleeps as readiness.
- Any non-`file:` request is aborted and counted as a failure. Page errors and console errors are failures.
- Checks March 2026 (two exact rows), April (empty message, no table), cleared filter (four valid rows),
  malformed row absent, Vietnamese accessible label, exact synthetic notice, no page-level horizontal scroll,
  no clipped section, input/note/table inside the viewport and single-line date cells.
- Calendar negatives: impossible `2026-03-32` and wrong-year `2025-03-15` must not appear in March 2026;
  `2025-03` shows only the wrong-year row as a positive control.
- Two mutants from the pinned source (month predicate; calendar-day validity). Each must fail on an assertion,
  not on the harness. The unmutated calendar preview must pass again afterwards.

## Limits (do not read past these)

- Synthetic data only. Five fixed rows; no real ledger, provider, API, storage or authentication.
- Dark theme tokens only, taken from `DESIGN.md` section 2. Light and non-default accent themes are not verified.
- The native month input is 36px tall (accepted component style). It is below the 44px touch target in `DESIGN.md` section 7; the accepted component is read-only here.
- No narration, audio, video, recording or media. No public, deploy or P11 claim.
- The accepted unit suite (12/12 and mutant 2/2) is not rerun; this proof is supplementary browser evidence only.
- Chromium version is recorded in `browser-results.json`; results are for that installed build only.

## Claim Boundary

Private synthetic UI proof only. Verification is the browser run and the two mutant kills recorded in the evidence file. No application, AI-governance, media, public or deploy claim.

## Target / Source

Source: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx`, pinned by `docs/reviews/evidence/cvf-expense-browser-dispatch-inputs-2026-10-10.json`.

## Scope / Methodology

Build with installed Vite and React, then drive installed Chromium through desktop and mobile profiles. Mutants are compiled from in-memory copies of the pinned source.

## Findings / Position

Browser proof passes; both mutants are killed by assertion; the mobile date layout was repaired after screenshot review. Details are in the worker return.

## Risk / Corrective Action

Synthetic data and dark tokens only. The 36px input touch target is a known residual for a later accepted-component lane.

## Decision / Recommendation / Disposition

Local reviewer decides acceptance and the material commit. This guide does not change any accepted surface.
