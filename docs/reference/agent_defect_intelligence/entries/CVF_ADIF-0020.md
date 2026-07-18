# ADIF-0020 - Checker Source Read-Ahead Skipped Before Artifact Authoring

Memory class: POINTER_RECORD

Status: ACTIVE

```text
defectId: ADIF-0020
title: Checker source read-ahead skipped before artifact authoring
defectCategory: GATE_TRIGGER_FRICTION
defectClass: RULE_GAP
defectRole: NOT_APPLICABLE_WITH_REASON: this entry records a cross-role authoring pattern, not a single finding row
severity: HIGH
lifecycleState: ACTIVE
taskClasses: Work-order authoring / dispatch; Worker execution (WORKER_MUST_NOT_COMMIT); Reviewer-return review; Closure; External knowledge absorption
roles: dispatcher; worker; reviewer; closer
lifecyclePhases: pre-dispatch; pre-implementation; pre-closure
surfaceSelectors: changed governed execution artifacts under docs/baselines, docs/work_orders, docs/reviews, and docs/roadmaps
detectionSignals: governed artifact omits Checker Source Read-Ahead Block or records no governance/compat/check_*.py path and no literal token list before gate execution
enforcementLevel: MACHINE_CHECKED
checkerBindings: governance/compat/check_governed_artifact_checker_read_ahead.py
promotionState: MACHINE_CHECK_ADDED
supersedes: NONE
lastVerifiedCommit: b6e4df1f
roadmapSeedId: NONE
```

## Purpose

Record the recurring pattern where an agent writes a governed artifact from a
reasonable prose model, runs a bundled gate, reads the first failed checker,
repairs the artifact, then repeats the loop for the next checker. The cost is
high because the artifact author discovers literal headings, enums, table
columns, and regex-sensitive tokens after the artifact already exists.

## Scope / Applies To

Applies to governed execution artifacts under `docs/baselines`,
`docs/work_orders`, `docs/reviews`, and `docs/roadmaps`. It especially applies
to worker returns, completion reviews, GC-018 baselines, work orders, and
external knowledge absorption packets.

It does not apply to runtime source files, tests, generated JSON aggregates,
provider/live proof, public-sync, or product UI behavior.

## Bad Example

An agent creates a worker return with plausible section names and natural
language table columns, runs reviewer-fast, then discovers:

- a column must be `Novelty / delta`, not `Novelty or delta`;
- `actionEvidence` must contain a literal accepted token;
- a corpus verdict must be bullet-shaped;
- memory-facing prose requires `rawMemoryReleased: false`;
- completion reviews become full closure artifacts once created.

The artifact reaches compliance only after several gate-failure iterations.

## Good Example

Before writing the first section, the author identifies the changed artifact
class, reads the directly relevant checker files and constants, and records:

```markdown
## Checker Source Read-Ahead Block

| Field | Evidence |
| --- | --- |
| applicableCheckersRead | `governance/compat/check_machine_closure_package.py`; `governance/compat/check_external_absorption_value_conversion.py` |
| literalTokensReviewed | `## Machine Closure Package`; `Source item`; `Value extracted`; `Runtime/package boundary`; `ACTION_EVIDENCE_PRESENT` |
| gateRunPurpose | confirm artifact shape after source read-ahead; not first discovery |
| claimBoundary | checker read-ahead evidence only |
```

The first gate run becomes confirmation evidence, not the discovery mechanism.

## Canonical Sources

- `docs/reference/guard_orientation/README.md`
  (task-class guard map and common failure prevention)
- `docs/reference/CVF_GOVERNED_ARTIFACT_LITERAL_FORMAT_GOTCHAS_2026-06-25.md`
  (literal-format checker traps)
- `governance/compat/check_governed_artifact_checker_read_ahead.py`
  (machine guard for changed governed execution artifacts)
- `governance/compat/run_worker_return_fast_gate.py`
  (fast gate that should confirm, not discover, checker shape)

## Remediation

Require a `## Checker Source Read-Ahead Block` in changed governed execution
artifacts. The block must cite at least one existing
`governance/compat/check_*.py` path and name the literal headings, fields,
columns, enums, or regex-sensitive tokens reviewed before authoring. Wire the
guard into reviewer-fast, pre-commit, pre-push, and autorun bundles so missing
read-ahead evidence fails early.

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | Codex reviewer/closer role |
| Provider or surface | local workspace |
| Session or invocation | KIOD-R5 closure discipline hardening, 2026-06-30 |
| Working directory | repository root |
| Command or tool surface | rg, source reads, apply_patch, governance gates |
| Target paths | this entry file; entries README; guard orientation; literal-format gotchas; checker and test files; hook catalogs; hardening review |
| Allowed scope source | operator instruction to handle closure discipline and literal machine-shape after KIOD-R5 review findings |
| Before status evidence | KIOD-R5 closure required several checker-driven repair rounds after plausible prose sections were written |
| After status evidence | ADIF-0020 records the pattern and checker read-ahead guard is available |
| Diff evidence | `git diff --name-status` before material commit |
| Approval boundary | defect record plus checker/read-ahead warning only |
| Claim boundary | defect-record and guard hardening only; no runtime/provider/live behavior, public-sync, package activation, or production claim |
| Agent type | reviewer/closer |
| Invocation ID | `kiod-r5-checker-read-ahead-hardening-2026-06-30` |
| Expected manifest | this entry; entries README; guard orientation; literal-format gotchas; checker and test files; hook catalogs; hardening review |
| Actual changed set | this entry plus checker/read-ahead hardening files |
| Manifest delta | MATCH |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance ADIF entry and guard hardening. No public-sync claim.

## Claim Boundary

This entry records and machine-checks an authoring discipline pattern. It does
not prove an agent actually read a checker before writing; it requires durable
artifact evidence that the applicable checker sources and literal tokens were
identified before acceptance.

## Epistemic Process Block

EPISTEMIC_PROCESS_NA_WITH_REASON: this defect entry records a repeated authoring
pattern and machine-check remediation, not an empirical provider/runtime claim.
