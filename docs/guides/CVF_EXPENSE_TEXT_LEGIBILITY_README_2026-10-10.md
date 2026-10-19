# CVF Expense Text Legibility - Browser Proof Guide

Memory class: FULL_RECORD

docType: guide

Status: COMPLETE_PENDING_REVIEW

Text Encoding Exception: Vietnamese labels, the synthetic notice and the synthetic row text use Vietnamese letters with diacritics; no other non-ASCII class is added.

## Purpose

How to run the text-legibility proof for the tracked `ExpenseList` component, what it proves, and which earlier proofs still apply to which source version. The verification record is in the worker return.

## Scope / Target / Owner Boundary

Scope: private synthetic browser proof of table-header readability, all-text contrast and keyboard focus in three token profiles. Not an application route, not real data, not AI-governance behavior. Owner: the Local reviewer accepts the batch; the worker does not commit.

## Target / Source

- Component: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx` (SHA-256 `a53662b79cf5...` after the change)
- Proof script: `scripts/test_cvf_expense_text_legibility_browser.cjs`
- Admitted preimage kept for the mutant: `.cvf/runtime/cvf-expense-legibility-worker-20261010/preimage/ExpenseList.preimage.tsx` (ignored; SHA-256 `447463e1c133...`)

## What Changed

Only `headerStyle.color` changed: `var(--cvf-text-muted)` became `var(--cvf-text-secondary)`. The 12px size and 600 weight, the DOM, the label wrap, the amount no-wrap, the 44px month input, the filter and the notice are unchanged.

## Command

From the repository root:

```
node scripts/test_cvf_expense_text_legibility_browser.cjs
```

Syntax check: `node --check scripts/test_cvf_expense_text_legibility_browser.cjs`.

The script:

1. Admits the source first. The tracked file must have the pinned SHA-256; otherwise the script exits 3 with `SOURCE_PIN_DRIFT` before it creates any output or launches a browser.
2. Bundles the actual tracked component with the installed Vite, React and react-dom (`configFile: false`, `envFile: false`, `write: false`, production `NODE_ENV` literal, one IIFE).
3. Opens offline `file://` pages in installed Playwright Chromium: dark 320x844 with the default accent, light 320x844 with the default accent, and light 390x844 with the teal accent. Non-file requests are aborted and counted.
4. In every profile, runs the initial, March, April (empty) and cleared states. Each state checks the contrast of header, row, title, label, notice, empty-message and month text against the effective opaque background, the exact expected role token, the 44px input, layout containment and keyboard focus.
5. Bundles the saved preimage as a mutant and expects the named `HEADER_TEXT_CONTRAST` assertion to fail while the 44px input and layout still pass. Then it reruns the corrected source.
6. Runs this same script on an ignored copy with one changed byte and checks that it refuses and that no artifact under the output folder changed.

## Findings / Position

- The preimage header measures 3.7987:1 on the dark surface (below 4.5). The corrected header uses the secondary text token and passes in all three profiles.
- Every checked text role passes 4.5:1 unrounded in all three profiles, in the March, April and cleared states.
- Tab focuses the month input with a 2px accent outline whose contrast against the surface and the page is at least 3:1.

## Risk / Corrective Action

- The browser result applies to the installed Chromium build recorded in `browser-results.json`.
- The script is pinned to the corrected source. Any later change to the component makes it refuse; a new reviewed pin is then needed.
- The script is near its 300-line cap. Any edit must recount physical lines including blank lines.

## Decision / Disposition

The Local reviewer decides acceptance, the independent 340px light probe and the material commit. The worker does not commit.

## Claim Boundary

- Earlier proofs (touch-target, narrow layout, and the browser preview) were run against earlier source versions. They apply only to the source hashes they recorded. They were not rerun here, and this guide makes no claim about how the older scripts behave on the current source.
- The light and teal values are explicit synthetic fixture overrides, not the app-wide theme contract.
- Chromium only. Targeted contrast and focus checks, not full WCAG, screen-reader or other-browser certification.
- No media, narration, provider, public export, deploy or P11 work.
