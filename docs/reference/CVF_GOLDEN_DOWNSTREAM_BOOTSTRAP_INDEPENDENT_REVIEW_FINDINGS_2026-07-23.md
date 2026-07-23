# CVF Golden Downstream Bootstrap — Independent Review Findings

- Tranche: `CVF-BSL-T1`
- Date: 2026-07-23
- Phase: REVIEW
- Reviewer: Codex, independent from the IMPLEMENTATION_WORKER
- Disposition: `CHANGES_REQUESTED`
- Staging/commit/push: none

## Checks that passed

- Exact changed set is unstaged and inside the original ceiling.
- Golden harness exits 0 with 30/30 self-reported assertions.
- Public-surface scan and `git diff --check` pass.
- Seven authored PowerShell files parse without syntax errors.
- Both JSON schemas parse.
- File-size guard passes.
- No private-key, AWS-key or credential-URL pattern was found in the new kit.

These passes do not close the findings below.

## BSL-R1 — Existing project-owned views are overwritten

Severity: blocker.

FR-08 and the approved design require existing project-owned content to be
preserved or routed to an explicit migration/merge decision.

Independent fixture:

1. Create an existing project with sentinel content in `docs/INDEX.md` and
   `docs/catalog/MODULE_CATALOG.md`.
2. Add the legacy empty `MODULE_REGISTRY.json`.
3. Run `new-cvf-workspace.ps1`.

Observed:

```text
bootstrap exit: 0
INDEX_PRESERVED: False
CATALOG_PRESERVED: False
```

`Install-CvfDownstreamCatalogKit` preserves the old registry but always runs
the manager with `-Write`, replacing both views.

Required repair:

- classify catalog state before any catalog-kit write;
- fresh state: install the full kit;
- already-governed state: validate/preserve, with explicit write only where
  the generated-source contract already exists;
- legacy or mixed state: make no catalog/view mutation and stop with an
  explicit migration/merge-required result;
- add a sentinel regression test proving byte-for-byte preservation.

## BSL-R2 — “Closed schema” is documentation-only

Severity: blocker.

The schemas declare top-level required fields and
`additionalProperties: false`, but the standard-library manager does not
enforce that contract.

Independent fixture results:

```text
Artifact Registry with rogueTopLevel property -> manager exit 0
Artifact Registry with projectName=""         -> manager exit 0
```

The manager also lacks systematic parity checks for required top-level
properties, allowed property sets, field types and additional properties on
registry entries.

Required repair:

- enforce every schema-required top-level field and closed property set;
- enforce every entry required field, allowed property set and expected type;
- require Artifact/Module Registry project identities to agree;
- add negative tests for missing/empty top-level fields, additional top-level
  fields, additional entry fields, wrong collection types and missing
  `artifacts`/`modules`;
- keep `-Write` fail-closed before changing generated views.

## BSL-R3 — Governed-kit deletion can fall back to legacy mode

Severity: blocker.

The doctor uses presence of
`scripts/manage_cvf_downstream_catalog.ps1` as the only governed-kit marker.
If that file is removed from a newly governed project, the doctor reports
`LEGACY_PROJECT` and skips catalog validation. The new manifest does not list
the manager, Artifact Registry or schemas in `requiredDocs`, and its
`enforcementVersion` remains the old `3.0-portable-clone` value.

Required repair:

- add an explicit governed-catalog version/marker to newly generated
  manifests;
- include the governed catalog sources, schemas and manager in new-project
  `requiredDocs`;
- doctor must fail when a governed marker or any governed-kit surface is
  present but the kit is incomplete;
- legacy compatibility is allowed only when no governed marker/surface is
  present;
- add separate tests for a true legacy project (PASS with bounded warning)
  and a damaged new project (FAIL).

## BSL-R4 — Module vocabulary permits plan-only claims

Severity: high.

The Module Registry describes itself as source-verified, but accepts
`PLANNED` and `IN_PROGRESS`. A row can point at `docs/INDEX.md` and be treated
as a valid module. This recreates the roadmap-versus-source-truth ambiguity
the learning tranche is intended to remove.

Required repair:

- use a source-backed status vocabulary that cannot represent roadmap-only
  intent (align with the downstream learning: enforced, partial,
  contract-only, stub; add deprecated only if a source-backed retirement
  contract is defined);
- require evidence fields sufficient to justify the selected status;
- reject `PLANNED` and plan-only records directly in negative tests;
- keep the initial registry empty and claim-safe.

## BSL-R5 — Fresh-clone initializer success is not gated

Severity: high.

The harness records the initializer exit code but marks AC-09 PASS solely when
`.cvf/local-binding.json` appears. The build evidence explicitly acknowledges
this narrowing. A partially executed initializer may therefore satisfy AC-09
while its final doctor fails.

Required repair:

- make AC-09 require initializer exit 0 and local-binding recreation;
- use a coherent disposable remote/core arrangement so the full initializer
  contract is testable;
- if the full exit cannot be tested honestly, report AC-09 BLOCKED rather than
  PASS.

## BSL-R6 — Cleanup residue is non-blocking

Severity: high.

The harness warns when a temp root remains but does not add a failed result,
so it can still print `RESULT: PASS` and exit 0 with residue. Its long-path
fallback also invokes recursive `cmd rd` without a final explicit
temp-root/prefix assertion immediately before deletion.

Required repair:

- validate every cleanup target resolves under the OS temp directory and has
  the harness-owned prefix before recursive deletion;
- turn any residue into a failed AC-13 assertion and non-zero exit;
- add a cleanup-path guard test or directly test the helper with an unsafe
  target.

## BSL-R7 — Public-kit completeness omits new dependencies

Severity: high.

The bootstrap and doctor now dot-source new library files, but the public-kit
completeness lists do not include them. The workspace reconciler also does not
verify these new required files after a fresh public clone.

Required repair:

- add all required catalog/helper/schema/guard surfaces to the bootstrap,
  doctor and public-core reconciler completeness lists;
- add a negative completeness test for a missing new helper;
- Amendment 1 authorizes the reconciler path needed for this repair.

## Re-review gate

Claude must leave all repairs unstaged and uncommitted and provide:

- exact changed set;
- updated AC matrix;
- named tests closing BSL-R1 through BSL-R7;
- full initializer exit evidence;
- true-legacy versus damaged-governed doctor evidence;
- closed-schema adversarial results;
- cleanup residue result;
- public-surface, diff, syntax, size and secret scans.

Stop at:

```text
READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_RE_REVIEW
```

## Re-review 2 disposition

Date: 2026-07-23

Disposition: `CHANGES_REQUESTED`

Independent checks completed:

- PowerShell parser: PASS.
- JSON schema parse: PASS.
- `python scripts/check_public_surface.py`: PASS.
- `git diff --check`: PASS.
- golden downstream harness: PASS, 57/57 assertions, exit 0.
- BSL-R1 through BSL-R7: closed by source inspection and the named negative
  tests in the repair-round harness.

The passing harness does not cover the two findings below. They must be
repaired before `REVIEW_PASS`.

## BSL-R8 — Bootstrap false-passes a damaged catalog installation

Severity: high.

`Install-CvfDownstreamCatalogKit` returns
`DAMAGED_GOVERNED_SKIPPED` when the governed source is damaged or when the
catalog manager still exits non-zero after all retries. The caller records
that string in the bootstrap log, but `scripts/new-cvf-workspace.ps1` then
unconditionally prints `Workspace bootstrap complete.` and reaches normal
exit 0.

This permits a failed fresh catalog installation to look like a successful
bootstrap. It conflicts with the work-order stop condition
`catalog/doctor false pass` and with the requirement that the executable
catalog manager be an enforced part of a fresh governed bootstrap.

Required repair:

- a fresh or already-governed bootstrap must exit non-zero when catalog
  validation/rendering returns `DAMAGED_GOVERNED_SKIPPED`;
- do not print the unconditional success claim on that path;
- retain the bounded `MIGRATION_REQUIRED_SKIPPED` behavior for pre-existing
  legacy/mixed projects, but make its non-success/migration-required outcome
  explicit and stable;
- add a hermetic negative test that forces the installed catalog manager to
  fail and proves bootstrap exits non-zero without printing a success claim.

## BSL-R9 — Public documentation and generated log disagree with behavior

Severity: medium.

Two consistency defects remain:

1. `Get-CvfBootstrapLogContent` emits the
   `.cvf/manifest.json: PRESENT (knowledgePath: knowledge/)` line twice.
2. `docs/reference/CVF_WORKSPACE_RULES.md` says the doctor uses legacy
   compatibility when the catalog manager is absent. The implementation
   correctly uses the stricter rule: any manifest marker or governed surface
   makes the project governed, and an incomplete kit is
   `DAMAGED_GOVERNED_KIT`.

Required repair:

- remove the duplicate bootstrap-log line;
- document the actual marker-or-any-governed-surface classifier and the
  blocking incomplete-kit behavior;
- extend AC-15 assertions so both regressions are executable checks rather
  than prose-only review.

## Re-review 2 gate

Claude remains `REPAIR_WORKER`, must not stage/commit/push, and must preserve
all prior BUILD and REPAIR history. Return with named evidence closing
BSL-R8 and BSL-R9 and stop at:

```text
READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_RE_REVIEW_2
```

## Final re-review disposition

Date: 2026-07-23

Disposition: `REVIEW_PASS`

Independent reviewer verification:

- BSL-R1 through BSL-R9: CLOSED.
- PowerShell parse and JSON parse: PASS.
- public-surface scan: PASS.
- `git diff --check`: PASS.
- golden downstream harness: PASS, 68/68 assertions, exit 0.
- damaged-registry and manager-exit-nonzero bootstrap paths: both reject with
  non-zero exit and no success claim.
- bounded legacy/mixed path: exit 0 with explicit
  `NOT a governed-catalog success` and `MIGRATION_REQUIRED`.
- no temp residue, provider call, secret read or downstream-project mutation.

The duplicate bootstrap-log observation in BSL-R9 item 1 was not reproducible
in the source or generated output. It is closed by an executable AC-15
regression assertion requiring exactly one manifest-presence line.

Authorized next role transition:

`REVIEWER -> COMMIT_STEWARD -> CLOSER`
