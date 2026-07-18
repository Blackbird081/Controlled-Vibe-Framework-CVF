# CVF Source Verification Table Shape Standard

Memory class: REFERENCE_STANDARD

Status: ACTIVE

## Purpose

Define the canonical Source Verification table shape for governed work orders,
roadmaps, baselines, and completion artifacts that cite existing runtime,
schema, interface, field, function, CLI, contract, or source-path facts.

This standard exists so dispatch-quality gates can parse source facts before a
worker begins implementation. A section named `Source Verification Block` or
`Source Verification Table` is not sufficient unless the table uses the
canonical columns.

## Scope / Target / Owner Boundary

Target surfaces:

- governed work orders;
- governed roadmaps that include source-verification tables;
- baselines, reviews, and completion artifacts that cite source facts;
- dispatch-quality checker and tests.

Owner boundary: governance/control-plane authoring discipline only.

Out of scope:

- runtime source semantics;
- provider behavior;
- legal or current-law correctness;
- public or production readiness.

## Scope / Applies-To

This standard applies when an artifact presents a table as Source Verification
evidence for existing runtime, schema, interface, field, function, CLI,
contract, or source-path facts.

## Canonical Columns

Every Source Verification table must use these columns exactly:

| Column | Required meaning |
| --- | --- |
| Claimed item | The field, function, type, schema key, route, contract, artifact, or source fact being claimed. |
| Source file | The existing source file or canonical contract that proves or rejects the claimed item. |
| Verified line/section | A line number, section, literal range, or source-backed location note. |
| Verified path or symbol | Only the verified path, field, symbol, or key; no value assignment or type annotation. |
| Owning interface/function/schema | The local owner that contains or governs the verified item. |
| Disposition | `ACCEPT`, `REJECT`, or `BLOCKED_SOURCE_NOT_FOUND`. |

Canonical header:

```text
| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|
```

## Noncanonical Tables

The following abbreviated patterns are not Source Verification tables and must
not be dispatched as verified source evidence:

- `Symbol / path | File | Verified line`
- `Field | Source | Status`
- `Path | Verified | Result`
- source-fact rows that omit `Owning interface/function/schema`
- source-fact rows that omit `Disposition`

If a table is only a planning aid, rename it so it does not present itself as a
Source Verification table. If the claimed source fact is not yet verified, keep
the work order in `DRAFT`, `HOLD_*`, or use `BLOCKED_SOURCE_NOT_FOUND` and stop
dispatch.

## Doc-Only Fields

New documentation-only fields must use a separate `New Doc-Only Fields` table.
Do not place them in Source Verification as `ACCEPT` rows unless the cited
source file or canonical contract already exists and proves the field.

## Claim Boundary

This standard proves source-evidence table shape discipline only. It does not
prove semantic correctness, runtime behavior, provider behavior, public
readiness, production readiness, current-law freshness, legal quality, or live
governance behavior.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance authoring-control standard; not public-synced.
