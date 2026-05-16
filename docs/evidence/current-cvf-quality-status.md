# Current CVF Quality Status

Memory class: FULL_RECORD

Status: BOUNDED BASELINE FOR LOCAL-FIRST DEPLOYMENT

Date: 2026-05-16

This summary reflects the current evidence-backed CVF quality posture. Raw
handoffs, full live run artifacts, and internal logs remain in provenance.

## Purpose

State the current honest public quality posture for CVF so users, evaluators,
and agents do not overclaim output quality.

## Muc dich nhanh

Ket luan hien tai: CVF manh ve governance, receipt, audit, safety va structured
non-coder workflows. CVF chua chung minh output-quality parity voi direct
provider output.

## Scope

This summary covers the latest public quality boundary for local-first
deployment. It points to curated evidence and intentionally omits raw private
run artifacts.

## Claim Boundary

This file permits only the bounded baseline claim below. It blocks
output-quality parity, broad EVT-4 superiority, and claims that EVT4-03 is
fixed.

## Short Conclusion

CVF is currently strongest as a governance-first framework:

- governance receipts and auditability are strong;
- safety failures were `0` in the referenced live checks;
- non-coder deliverable structure has been hardened across five product tracks;
- output-quality parity versus direct model output has not been proven.

CVF is a reasonable local-first deployment baseline for teams that value
control, evidence, and governed non-coder workflows. It should not be marketed
as an output-quality optimizer or direct-model parity layer.

## What Was Hardened

The non-coder hardening roadmap is complete at the product-contract level:
MVP/backlog, pricing, SOP/handoff, persona, and decision-memo outputs now carry
clearer scope, next actions, acceptance checks, experiments, risk checks, and
handoff criteria.

## Evidence Snapshot

Focused QH-4/QH-5 live check:

- Completed: `5/5`
- CFG-B live receipts: `5/5`
- Safety failures: `0`
- Median normalized delta: `+0.08`
- Focused decision rule: met

Full EVT-4 roadmap-completion regression:

- Completed: `19/20`
- CFG-B live receipts: `19/20`
- Safety failures: `0`
- Median normalized delta: `-0.08`
- Registered parity decision rule: not met
- Known failure: one intermittent `EVT4-03` CFG-B `EMPTY_OUTPUT` /
  output-validation `422` in the full run

EVT4-03 diagnostic:

- Completed in isolation with a live receipt
- Safety failures: `0`
- Delta remained weak at `-0.20`
- Interpretation: the full-run failure was not consistently reproducible in
  isolation, but feature-priority reliability/output validation remains a weak
  lane.

## Allowed Public Claim

CVF adds governance, auditability, safety checks, provider/control boundaries,
and structured non-coder deliverable workflows. Current live evidence supports
CVF as a governed local-first baseline, while retaining a measurable
output-quality tax on parts of EVT-4.

## Claims Not Allowed

Do not claim:

- CVF has output-quality parity with direct provider output;
- CVF improves output quality versus direct model output across the EVT-4
  corpus;
- the full EVT-4 roadmap-completion run was a clean no-degrade result;
- focused sample checks prove broad metric superiority;
- the `EVT4-03` `422` root cause is fixed.

## Remaining Weak Lanes

Any future quality tranche should be separately authorized and narrowly scoped.
The current known weak lanes are:

- `EVT4-03` / `EVT4-14`: feature-priority reliability and output validation;
- `EVT4-06`: competitor-review specificity;
- `EVT4-08`: ops-plan consistency;
- `EVT4-13`: channel-choice activation depth.

## Practical Next Step

The recommended next product step is not more prompt tuning. Treat this as the
current honest baseline for local-first deployment. If more quality work is
needed, open a fresh narrow roadmap for one weak lane at a time.
