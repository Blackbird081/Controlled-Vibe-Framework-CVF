# CVF Expense Narrow Layout - Browser Proof Guide

Memory class: FULL_RECORD

docType: guide

Status: COMPLETE_PENDING_REVIEW

Text Encoding Exception: Vietnamese labels, the synthetic notice and the synthetic row text use Vietnamese letters with diacritics; no other non-ASCII class is added.

## Purpose

How to run the layout proof for long table content in the tracked `ExpenseList` component at 320px, 390px and 1280px, what it proves, and which earlier proofs still apply to which source version. The verification record is in the worker return.

## Scope / Target / Owner Boundary

Scope: private synthetic browser proof of table and cell presentation only. Not an application route, not real data, not AI-governance behavior. Owner: the Local reviewer accepts the batch; the worker does not commit.

## Target / Source

- Component: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx`
- Layout proof: `scripts/test_cvf_expense_narrow_layout_browser.cjs`
- Admitted preimage kept for the mutant: `.cvf/runtime/cvf-expense-layout-worker-20261010/preimage/ExpenseList.preimage.tsx` (ignored; SHA-256 `628862816a8d...`)

## What Changed

- The label cell (`td` in the second column) gets `overflowWrap: 'anywhere'`, so an unbroken label wraps instead of widening the table.
- The amount cell gets `whiteSpace: 'nowrap'`, so a six-digit amount stays on one line.
- The month input (`height: 44`, `boxSizing: 'border-box'`), filter, date rules, props, row order, labels and notice are unchanged.

## Command

From the repository root:

```
node scripts/test_cvf_expense_narrow_layout_browser.cjs
```

Syntax check: `node --check scripts/test_cvf_expense_narrow_layout_browser.cjs`.

The script:

1. Bundles the actual tracked component with the installed Vite, React and react-dom (`configFile: false`, `envFile: false`, `write: false`, production `NODE_ENV` literal, one IIFE). It never edits the tracked file.
2. Opens one offline page in installed Playwright Chromium over `file://` at 320x844, 390x844 and 1280x800, dark theme.
3. Checks the March state: the table, every cell, every text line, the notice and the input must sit inside the section content box, with a 1px tolerance. Each cell's text must equal the literal oracle.
4. Runs one March, April and clear flow at 320px. The clear state is checked again after the filter is cleared.
5. Bundles the admitted preimage as a mutant and expects a containment assertion to fail. Then it reruns the corrected source.
6. Records the tracked source SHA-256 before and after the run in `.cvf/runtime/cvf-expense-layout-worker-20261010/browser-results.json`.

## Findings / Position

- At 320px the admitted preimage's table is about 874px wide inside a 254px content box. The corrected component keeps the table inside the content box at all three widths.
- Dates wrap at the hyphen. Amounts stay on one line. The unbroken 80-character label wraps and keeps every character.
- The 44px month input and the dark tokens still pass.

## Risk / Corrective Action

- Earlier proofs (the touch-target proof and its mutant) were run against the admitted preimage. They remain valid for that source version only. The old touch script refuses the corrected source, which is intended. Its pins, HTML and receipts are unchanged.
- The unit suite was rerun because the component changed. The date and calendar mutants were not rerun.
- The script is at its 300-line cap. Any edit must recount physical lines.

## Decision / Disposition

The Local reviewer decides acceptance, the 320px independent probe and the material commit. The worker does not commit.

## Claim Boundary

- Private synthetic table layout only, in the dark theme at the three widths listed above.
- Not a full 320px accessibility or WCAG certification, not a light or accent theme claim for this source version, and not a production layout.
- Chromium only. No media, narration, provider, public export, deploy or P11 work.
