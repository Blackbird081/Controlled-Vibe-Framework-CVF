# CVF Expense Touch Target - Browser Proof Guide

Memory class: FULL_RECORD

docType: guide

Status: COMPLETE_PENDING_REVIEW

Text Encoding Exception: Vietnamese labels and the synthetic notice are quoted from the component and the browser proof; no other non-ASCII class is added.

## Purpose

How to run the browser proof for the month-input touch target in the tracked `ExpenseList` component, what it proves, and why the historical preview builder now refuses the changed source. The verification record is in the worker return.

## Scope / Target / Owner Boundary

Scope: private synthetic browser proof for the month input. Not an application route, not real data, not AI-governance behavior. Owner: the Local reviewer accepts the batch; the worker does not commit.

## Target / Source

- Component: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx`
- Proof script: `scripts/test_cvf_expense_touch_target_browser.cjs`
- Work order and baseline: `docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_EXPENSE_TOUCH_TARGET_2026-10-10.md`, `docs/baselines/CVF_GC018_NCR_EXPENSE_TOUCH_TARGET_2026-10-10.md`

## What Changed

- `ExpenseList.tsx`: the month input style moved from `height: 36` to `height: 44` with `boxSizing: 'border-box'`. The outer target is now 44px tall on every profile. Filter, date rules, props, row order and the notice are unchanged.
- `scripts/test_cvf_expense_touch_target_browser.cjs`: new browser proof for the tracked component.

## Command

From the repository root:

```
node scripts/test_cvf_expense_touch_target_browser.cjs
```

Syntax check: `node --check scripts/test_cvf_expense_touch_target_browser.cjs`.

The script:

1. Bundles the actual tracked component with the installed Vite, React and react-dom (`configFile: false`, `envFile: false`, `write: false`, production `NODE_ENV` literal, one IIFE). It never edits the tracked file.
2. Writes four offline pages under `.cvf/runtime/cvf-expense-touch-worker-20261010/`: dark desktop 1280x800, dark mobile 390x844, light mobile 390x844 and light alternate-accent mobile 390x844.
3. Opens each page in installed Playwright Chromium over `file://`. Every non-file request is aborted and counted. Page and console errors fail the run.
4. Checks the touch target, focus, tokens and contrast on each profile. It also runs one March, April and clear flow on dark mobile.
5. Builds a 36px sizing mutant in an ignored copy, reruns the geometry assertion, and expects an assertion failure (`touch target<44`). Then it reruns the restored component.
6. Records the tracked source SHA-256 before and after every proof in `.cvf/runtime/cvf-expense-touch-worker-20261010/browser-results.json`.

## Why The Historical Builder Refuses Changed Source

`scripts/cvf_expense_fixture_preview.cjs` and `scripts/test_cvf_expense_fixture_preview_browser.cjs` are pinned to the previous component SHA-256 (`801f3052...`). Once `ExpenseList.tsx` changes, the old builder exits with `SOURCE_PIN_DRIFT` and writes nothing. That refusal is intended: it stops the old proof from claiming coverage of new source. The old script, its pins and its earlier HTML and receipts are unchanged. Use the new script above for the current component.

The accepted calendar and date mutants are not rerun here. Their accepted evidence still applies to the original scope.

## Findings / Position

- Four profiles pass: the month input is 44px outer height and 161.33px outer width on each.
- Keyboard focus reaches the month input with a 2px solid outline in the active accent token.
- The 36px mutant is killed by the geometry assertion.

## Risk / Corrective Action

- The browser result applies to the installed Chromium build recorded in `browser-results.json`.
- Any edit to the proof script must recheck the 300-line cap.

## Decision / Disposition

The Local reviewer decides acceptance and the material commit. The worker does not commit.

## Claim Boundary

- Synthetic rows only. The five rows are authored for this proof and are not imported from the unit fixture.
- The light and alternate-accent themes are explicit fixture overrides. They are not a production light palette.
- The contrast check covers the row text and the notice on the surface. It is not a full accessibility certification.
- Chromium only. No media, narration, provider, public export, deploy or P11 work.
