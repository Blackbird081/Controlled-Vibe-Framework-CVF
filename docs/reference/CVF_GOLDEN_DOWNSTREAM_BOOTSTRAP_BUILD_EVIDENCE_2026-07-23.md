# CVF Golden Downstream Bootstrap — Build Evidence

- Tranche: `CVF-BSL-T1`
- Date: 2026-07-23
- Phase: BUILD
- Role recorded: IMPLEMENTATION_WORKER (Claude), per `CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_WORK_ORDER_2026-07-23.md`
- Branch: `tranche/golden-downstream-bootstrap`
- Pre-build baseline HEAD: `2c59f6ac1317507628d9ae420c19e2dc4704d329` (verified clean, tracking `origin/tranche/golden-downstream-bootstrap`, no staged changes)
- Status: BUILD complete, unstaged. Not committed, staged, pushed, or self-approved by the implementation worker.

## Changed set (exact, unstaged)

Modified (tracked):

```text
docs/GET_STARTED.md
docs/reference/CVF_WORKSPACE_RULES.md
scripts/check_cvf_workspace_agent_enforcement.ps1
scripts/new-cvf-workspace.ps1
```

New (untracked):

```text
docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_BUILD_EVIDENCE_2026-07-23.md
governance/toolkit/05_OPERATION/downstream_catalog/CVF_DOWNSTREAM_CATALOG_GUARD.md
scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1
scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1
scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1
scripts/lib/downstream_catalog/manage_cvf_downstream_catalog.ps1
scripts/lib/downstream_catalog/schemas/ARTIFACT_REGISTRY.schema.json
scripts/lib/downstream_catalog/schemas/MODULE_REGISTRY.schema.json
scripts/test_cvf_golden_downstream_bootstrap.ps1
```

Every path is inside the work order's changed-set ceiling. No excluded path
was touched. No provider was called, no secret was read, no dependency was
installed, and `CVF-Operations-Workspace` was never referenced or modified.

## AC matrix → evidence

| AC | Result | Evidence |
|---|---|---|
| AC-01 | PASS | Harness assertions `AC-01: All required generated surfaces exist`, `AC-01: Bootstrap log exists` against a disposable `git init` empty repo bootstrapped via `new-cvf-workspace.ps1`. |
| AC-02 | PASS | Harness assertion `AC-02: Active state is INTAKE/ORCHESTRATOR; no fabricated work order/capability` — reads `CVF_SESSION/ACTIVE_SESSION_STATE.json` and `IMPLEMENTATION_STATUS.json` directly. |
| AC-03 | PASS | Harness assertions `AC-03: Catalog manager --check passes on pristine project` and `AC-03: Artifact Registry has 17 unique mandatory entries`. |
| AC-04 | PASS | Harness assertion `AC-04: Module Registry empty; Module Catalog makes no runtime claim` (checks `modules: []`, `Total modules: 0`, and the "Do not infer runtime" claim-boundary sentence). |
| AC-05 | PASS | Harness assertion `AC-05: Regenerated views are byte-stable` — `manage_cvf_downstream_catalog.ps1 -Write` run twice, `docs/INDEX.md` / `docs/catalog/MODULE_CATALOG.md` compared with case-sensitive string equality (`-ceq`). |
| AC-06 | PASS | Harness assertion `AC-06: Second bootstrap run is idempotent (no tracked diff)` — project git-committed after first bootstrap, `new-cvf-workspace.ps1` rerun, `git status --porcelain` asserted empty. |
| AC-07 | PASS | 11 named negative cases, each on a disposable copy, each asserted non-zero exit + expected message substring: `missing-registered-path`, `duplicate-artifact-id`, `path-escape`, `windows-separator`, `empty-required-field`, `invalid-lifecycle-status`, `missing-mandatory-baseline-entry`, `invalid-module-status`, `unknown-cvf-control`, `unknown-module-dependency`, `hand-edited-generated-view`. |
| AC-08 | PASS | Clean case: `AC-08: Doctor passes pristine generated project` (doctor exit 0, `-AllowOfflinePinnedCore`). Drift cases: doctor asserted non-zero on `missing-registered-path`, `missing-mandatory-baseline-entry`, `hand-edited-generated-view` disposable copies. |
| AC-09 | PASS | `AC-09: Fresh clone excludes ignored local binding` (real `git clone` of the committed project; `.cvf/local-binding.json` absent post-clone since it is git-ignored), `AC-09: Fresh-clone initializer recreates ignored local binding` (`scripts/initialize_cvf_clone.ps1` run against the fresh clone; binding file recreated), `AC-09: Tracked manifest keeps only portable relative core identity` (`cvfCoreRelativePath` / `workspaceRulesRelativePath` are not rooted paths). |
| AC-10 | PASS | `AC-10: No tracked generated file contains the disposable workspace absolute path` and `... a recognizable secret pattern` — full recursive scan of the bootstrapped project (excluding `.cvf/local-binding.json`, which is the one file explicitly allowed to hold an absolute path and is git-ignored). |
| AC-11 | PASS | `AC-11: All new/modified authored files are at most 600 lines`, measured with `[System.IO.File]::ReadAllLines(...).Count` (matches `wc -l`); see line-count table below. |
| AC-12 | PASS | `AC-12: Doctor keeps bounded legacy compatibility without the catalog kit` — disposable copy with `scripts/manage_cvf_downstream_catalog.ps1` and `scripts/lib/downstream_catalog/` removed; doctor still exits 0, catalog check reported as a bounded `WARN` (`LEGACY_PROJECT`), not a failure. |
| AC-13 | PASS | Harness itself exits non-zero on any failed assertion (verified during BUILD while bugs were still present — see Failures/Repairs). Two consecutive full runs after fixes: exit 0, `30/30 assertions passed`, `[OK] All hermetic temp directories removed.` |
| AC-14 | PASS | `git diff --check` on the real repo: exit 0 (no whitespace errors) on all tracked modifications. New files scanned for trailing whitespace: none found. |
| AC-15 | PASS | `docs/GET_STARTED.md` and `docs/reference/CVF_WORKSPACE_RULES.md` now describe the catalog kit's generated surfaces and the doctor's bounded legacy-compatibility behavior; the seven-step chain and live-evidence claim boundary text were not altered. |

## Line-count evidence (`wc -l`, AC-11)

```text
430  scripts/new-cvf-workspace.ps1
506  scripts/check_cvf_workspace_agent_enforcement.ps1
266  scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1
262  scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1
112  scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1
 93  scripts/lib/downstream_catalog/manage_cvf_downstream_catalog.ps1
441  scripts/test_cvf_golden_downstream_bootstrap.ps1
```

`new-cvf-workspace.ps1` dropped from 625 lines (pre-tranche, already over the
600-line guard per the learning intake) to 430 lines, with its public
parameter contract (`-WorkspaceRoot`, `-ProjectName`, `-ProjectRepo`)
unchanged. `check_cvf_workspace_agent_enforcement.ps1` grew from 594 to 610
lines after adding the governed-catalog check, which put it over budget; the
pre-existing, catalog-unrelated live-readiness helper functions
(`Normalize-EnvValue`, `Get-LocalEnvKeySource`, `Get-LiveReadiness`) were
extracted to `scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1`,
bringing it to 506 lines.

## Full harness run (final)

```text
PS> powershell -ExecutionPolicy Bypass -File scripts\test_cvf_golden_downstream_bootstrap.ps1
...
[OK] All hermetic temp directories removed.

CVF Golden Downstream Bootstrap Harness - Summary
  30/30 assertions passed
  RESULT: PASS
EXITCODE=0
```

Run twice consecutively with the same clean result to check for run-to-run
residue/flake; both runs: exit 0, 30/30, no residue.

## Failures found during BUILD and their repairs (retained, not deleted)

The harness surfaced real defects while it was being built out; each is kept
here as the finding record, per the work order's evidence contract.

1. **PowerShell empty-array-return collapses to `$null`.** `Test-CvfArtifactRegistry` / `Test-CvfArtifactRegistryBaseline` / `Test-CvfModuleRegistry` returned `$violations.ToArray()`; when the list was empty, PowerShell's pipeline unrolling made the function return `$null` instead of an empty array, and `$violations.AddRange([string[]](...))` in the manager threw `ArgumentNullException` on every clean run. Repair: `return , $violations.ToArray()` (unary comma operator) in all three functions.
2. **`-Write` required the generated views to already exist before creating them.** The generic path-existence check in `Test-CvfArtifactRegistry` ran the same "must exist" rule against `generated_view` family entries (`docs/INDEX.md`, `docs/catalog/MODULE_CATALOG.md`), which made the very first bootstrap's `-Write` call fail (the views cannot exist before the first write). Repair: skip the existence check for `family -eq "generated_view"`; drift/missing-view detection stays in the manager's dedicated check-mode comparison.
3. **Absolute disposable-workspace path leaking into a tracked file.** `docs/CVF_BOOTSTRAP_LOG_*.md` embedded the real resolved `$ProjectPath` into example doctor/manager commands (pre-existing pattern, inherited unchanged from the original script). The harness's AC-10 scan caught it. Repair: those example commands now use the literal placeholder `<this-project-path>` (matching the pre-existing `<cvf-core>` placeholder convention), and the now-unused `-ProjectPath`/`-CvfCorePath` parameters were removed from `Get-CvfBootstrapLogContent`.
4. **Disposable negative-case copies broke core/workspace-rules reachability.** `Copy-DisposableProject` originally placed each defect copy in its own unrelated temp folder, so the copy's `.cvf/manifest.json` relative core/workspace-rules paths no longer resolved, and the doctor failed on core-reachability checks unrelated to the catalog defect under test (this masked, rather than demonstrated, the intended AC-08/AC-12 signal). Repair: disposable copies are now placed as siblings inside the same hermetic workspace as the source project, alongside its core clone and `WORKSPACE_RULES.md`.
5. **`Copy-Item -LiteralPath "...\*"` silently copied nothing.** `-LiteralPath` disables wildcard expansion, so the trailing `\*` was treated as a literal (nonexistent) path segment; disposable copies ended up empty. Repair: use `-Path` (which expands wildcards) instead of `-LiteralPath` for this call.
6. **`git clone`/`Remove-Item` on the hermetic core hit Win32 `MAX_PATH`.** The full core tree includes a `governance/compat/` file with a ~145-character name; combined with a deep `%TEMP%` path this exceeds 260 characters. `git clone` needed `-c core.longpaths=true` / `git config core.longpaths true`; `Remove-Item -Recurse` still silently left the over-long file behind afterward. Repair: clone with long-path config enabled, and fall back to `cmd /c rd /s /q "\\?\<path>"` (which opts into the Win32 long-path form) when a short `Remove-Item` retry loop doesn't clear the directory.
7. **A synthetic "overlay commit" made the hermetic core look diverged from `origin/main`.** Committing this tranche's uncommitted working-tree changes on top of the cloned core moved `HEAD` away from the real public `main` commit, so the doctor's freshness (`git fetch` + hash compare) and pin-reachability (`merge-base --is-ancestor`) checks correctly, but spuriously for this test's purposes, reported divergence. Repair: `New-CvfHermeticCoreClone` now overlays this tranche's ceiling files as **uncommitted** working-tree changes (`HEAD` stays at the real `main` commit, matching `origin/main` exactly); the only visible effect is the doctor's existing, non-blocking "pending public-core overlay" warning, which accurately describes an unmerged tranche sitting in a core checkout. A second, separate helper (`New-CvfCleanPublicMainClone`, no overlay) is used for the AC-09 fresh-clone/initializer test specifically, because `initialize_cvf_project_clone.ps1` requires both a clean core and a pinned commit reachable from the real public remote — a requirement a synthetic unmerged commit can never honestly satisfy.
8. **`check_cvf_workspace_agent_enforcement.ps1` exceeded 600 lines after the new check was added** (594 → 610). See line-count evidence above; repaired by extracting the pre-existing live-readiness helpers into `scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1`.

No finding above was deleted or silently reworded away; each repair is the
change actually present in the current diff.

## Explicit scoping decisions (for REVIEWER attention)

- **AC-09 assertion scope.** The "fresh-clone initializer recreates ignored local binding" assertion gates only on the local-binding file actually being recreated, not on `initialize_cvf_clone.ps1`'s own overall exit code. That script's last step re-invokes the workspace doctor from the (real, unmodified) `origin/main` core, so its exit code can be affected by doctor checks unrelated to local-binding portability (e.g. live network conditions). The initializer's exit code and full output are still recorded in the assertion detail for transparency.
- **Unknown CVF control / unknown module dependency semantics.** `docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_SPEC_2026-07-23.md` (FR-07) requires rejecting "unknown CVF controls/dependencies" without naming a canonical control registry reachable inside this tranche's ceiling. The manager treats a control token as valid only if it matches `^GC-[0-9]{3}$` (format-closed, not cross-checked against the full guard corpus), and a module dependency as valid only if it names another module `id` already present in the same registry (self-referential closed set). This is documented explicitly in `CVF_DOWNSTREAM_CATALOG_GUARD.md` so the interpretation is visible, not silent.
- **Guard doc is not a numbered `GC-xxx` control.** `CVF_DOWNSTREAM_CATALOG_GUARD.md` is reference documentation only; registering a new numbered control would require editing the central guard registry, which is outside this tranche's changed-set ceiling.

## Cleanup / residue confirmation

```text
PS> Get-ChildItem $env:TEMP -Directory | Where-Object { $_.Name -like 'cvf-golden-*' }
(no results after the final harness runs)
```

No worktree, branch, or temp-directory residue remains from BUILD. The real
repository's `git status --short` shows only the changed-set files listed
above; nothing is staged.

## Non-goals honored

No provider was called; no API key or secret was read; no dependency was
installed; `CVF-Operations-Workspace` was not touched; no existing downstream
catalog was migrated; no application runtime module was created or claimed.

BUILD phase stopped at `READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_REVIEW`. The
independent reviewer returned `CHANGES_REQUESTED` with findings BSL-R1 through
BSL-R7 (`docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_INDEPENDENT_REVIEW_FINDINGS_2026-07-23.md`)
and authorized `docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_WORK_ORDER_AMENDMENT_1_2026-07-23.md`
to widen the ceiling by exactly `scripts/update_cvf_workspace_public_core.ps1`
for BSL-R7. Everything above this line is the unmodified BUILD-phase record.
Everything below is the REPAIR round.

---

# REPAIR — Independent Review Findings BSL-R1 Through BSL-R7

- Role recorded: REPAIR_WORKER (Claude), per the reviewer's re-review gate
- Pre-repair baseline: HEAD `2c59f6ac1317507628d9ae420c19e2dc4704d329`,
  branch `tranche/golden-downstream-bootstrap`, worktree matched the BUILD
  phase's final unstaged state exactly (verified before any repair edit)
- Status: repairs complete, unstaged. Not committed, staged, pushed, or
  self-approved.

## Exact changed set (current, unstaged)

Modified (tracked):

```text
docs/GET_STARTED.md
docs/reference/CVF_WORKSPACE_RULES.md
scripts/check_cvf_workspace_agent_enforcement.ps1
scripts/new-cvf-workspace.ps1
scripts/update_cvf_workspace_public_core.ps1
```

New (untracked):

```text
docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_BUILD_EVIDENCE_2026-07-23.md
docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_INDEPENDENT_REVIEW_FINDINGS_2026-07-23.md
docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_WORK_ORDER_AMENDMENT_1_2026-07-23.md
governance/toolkit/05_OPERATION/downstream_catalog/CVF_DOWNSTREAM_CATALOG_GUARD.md
scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1
scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1
scripts/lib/downstream_catalog/CvfGoldenHarnessSupport.ps1
scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1
scripts/lib/downstream_catalog/manage_cvf_downstream_catalog.ps1
scripts/lib/downstream_catalog/schemas/ARTIFACT_REGISTRY.schema.json
scripts/lib/downstream_catalog/schemas/MODULE_REGISTRY.schema.json
scripts/test_cvf_golden_downstream_bootstrap.ps1
```

The two reviewer-authored docs (`INDEPENDENT_REVIEW_FINDINGS`,
`WORK_ORDER_AMENDMENT_1`) were not authored by the repair worker; they are
listed because they are part of the current unstaged worktree and match the
`docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_*` ceiling glob.
`scripts/update_cvf_workspace_public_core.ps1` is touched only under
Amendment 1's explicit authorization, limited to its
`$requiredPublicCoreFiles` completeness list. `scripts/lib/downstream_catalog/CvfGoldenHarnessSupport.ps1`
is a new harness-support extraction (test infrastructure only; not
dot-sourced by bootstrap or the doctor, so it is intentionally absent from
every public-kit completeness list). No excluded path was touched; no
provider was called; no secret was read; no dependency was installed;
`CVF-Operations-Workspace` was not referenced.

## BSL-R1 → BSL-R7 evidence

| Finding | Repair | Evidence |
|---|---|---|
| **BSL-R1** — legacy/mixed views overwritten | `Get-CvfCatalogState` classifies `FRESH` / `ALREADY_GOVERNED` / `DAMAGED_GOVERNED` / `LEGACY_OR_MIXED` before any catalog write; `Install-CvfDownstreamCatalogKit` makes zero catalog/view mutations for `LEGACY_OR_MIXED` and zero view mutations for `DAMAGED_GOVERNED`. | Harness: `BSL-R1: Legacy docs/INDEX.md is byte-identical...`, `BSL-R1: Legacy docs/catalog/MODULE_CATALOG.md is byte-identical...`, `BSL-R1: Legacy/mixed project never receives a governed ARTIFACT_REGISTRY.json`, `BSL-R1: Legacy/mixed project manifest never receives the governed-catalog marker`, `BSL-R1: Bootstrap output reports MIGRATION_REQUIRED...`, plus the damaged-source trio (`A damaged governed ARTIFACT_REGISTRY.json is preserved as-is...`, `Generated views are not regenerated from a damaged governed source`, `Bootstrap reports the damaged governed kit...`). All PASS. |
| **BSL-R2** — closed schema was documentation-only | `Test-CvfObjectShape` enforces required fields and `additionalProperties: false` for both top-level documents and entries; `Test-CvfStringField`/`Test-CvfArrayField` enforce per-field types; `Test-CvfRegistryProjectIdentity` cross-checks `projectName`. | Harness: 6 named adversarial cases — `rogue-top-level-property`, `empty-top-level-project-name`, `missing-artifacts-collection`, `additional-entry-property`, `wrong-type-controls-not-array`, `registry-project-identity-mismatch` — each on a disposable copy, each asserted non-zero exit + exact expected message. All PASS. `-Write` still validates before writing (unchanged fail-closed contract). |
| **BSL-R3** — governed-kit deletion fell back to legacy | `.cvf/manifest.json` gains `catalogKitVersion` (never on a `LEGACY_OR_MIXED` project) and expanded `requiredDocs`; the doctor treats a project as governed if the marker **or any** of 5 governed surfaces exist, and fails closed (`DAMAGED_GOVERNED_KIT`) when present-but-incomplete; the bounded `LEGACY_PROJECT` warning fires only when **none** are present. | Harness: `BSL-R3: Freshly bootstrapped manifest carries catalogKitVersion marker and expanded requiredDocs`, `BSL-R3: Doctor PASSes a true legacy project (no marker, no surface) with a bounded warning`, `BSL-R3: Doctor FAILs a damaged governed kit (marker/surfaces present, manager deleted) instead of falling back to legacy`. All PASS — the true-legacy and damaged-governed fixtures are two separate disposable copies of the same pristine project, diverged only by which surfaces/marker are removed. |
| **BSL-R4** — module vocabulary permitted plan-only claims | Module `status` vocabulary replaced with source-backed-only values (`ENFORCED`, `PARTIAL`, `CONTRACT_ONLY`, `STUB`, `DEPRECATED`); every module entry now requires a non-empty `evidence` field; `PLANNED` and any other token are rejected. | Harness: `BSL-R4: Negative case rejected: plan-only-module-status-rejected` (status `PLANNED`, otherwise valid+evidenced entry, rejected with a message naming `PLANNED`). PASS. Initial registry stays empty (`AC-04` unchanged). |
| **BSL-R5** — fresh-clone success ungated | `AC-09`'s initializer assertion now requires **both** `initResult.ExitCode -eq 0` **and** local-binding recreation; the fresh-clone core is anchored at the real `origin/main` commit (no synthetic overlay) so the initializer's own doctor call can genuinely pass end-to-end. | Harness: `AC-09: Fresh-clone initializer completes with exit 0 AND recreates ignored local binding (BSL-R5: exit code is required, not just the binding file)`. PASS with real exit 0 (network to the public remote is reachable in this environment; see scoping note below). |
| **BSL-R6** — cleanup residue non-blocking | `Test-CvfSafeCleanupTarget` requires a path to resolve under the OS temp directory **and** be a tracked hermetic root (or nested under one, or carry the `cvf-golden-` prefix) before any recursive delete; `Remove-CvfHermeticDirectory` throws `REFUSING_UNSAFE_CLEANUP_TARGET` otherwise; leftover residue is now `Add-Result "AC-13" ... $false` (a failing assertion, not a console warning). | Harness: `BSL-R6: Cleanup safety guard rejects paths outside tracked hermetic roots...`, `BSL-R6: Remove-CvfHermeticDirectory refuses an untracked target and leaves it untouched`, `BSL-R6: Cleanup safety guard accepts a tracked hermetic root...`, `AC-13: No hermetic temp directory residue remains after cleanup`. All PASS. |
| **BSL-R7** — public-kit completeness omitted new dependencies | All 7 new catalog/helper/schema/guard files added to the `$requiredPublicCoreFiles` list in `new-cvf-workspace.ps1`, `check_cvf_workspace_agent_enforcement.ps1`, and (Amendment 1) `update_cvf_workspace_public_core.ps1`. | Harness: `BSL-R7: Bootstrap refuses to run against a public core missing a new helper file` (bootstrap-side negative), `BSL-R7: Doctor fails 'Public workspace kit is complete'...` (doctor-side negative), `BSL-R7: Public-core reconciler completeness list includes every new catalog/helper/schema/guard surface` (static content check on `update_cvf_workspace_public_core.ps1` — see scoping note), `BSL-R7: Bootstrap's own... / Doctor's own... completeness list includes every new surface`. All PASS. |

## Updated AC matrix (57/57 assertions, full harness run)

All AC-01 through AC-15 results from the BUILD phase table above still hold
and were re-verified in the same harness run that produced the BSL-R1–R7
evidence; the additions/changes are:

- **AC-06** now also proves idempotency through a full `FRESH_INSTALLED` →
  `ALREADY_GOVERNED_REGENERATED` transition (see repair item 6 below).
- **AC-07** grew from 11 to 17 named negative cases (6 new BSL-R2 cases; one
  existing case's expected substring updated from `missing a required field`
  to `must be non-empty` to match the new field-level type/emptiness
  checker).
- **AC-08** unchanged in intent; still exercises clean-pass and drift-fail.
- **AC-09** tightened per BSL-R5 (see table above).
- **AC-12** replaced: the single "legacy compatibility" case is now the two
  BSL-R3 cases (true legacy PASS-with-warning, damaged governed FAIL).
- **AC-13** now fails the run on residue instead of warning.

## Full harness run (final, repair round)

```text
PS> powershell -ExecutionPolicy Bypass -File scripts\test_cvf_golden_downstream_bootstrap.ps1
...
CVF Golden Downstream Bootstrap Harness - Summary
  57/57 assertions passed
  RESULT: PASS
EXIT=0
```

Run twice consecutively with the same clean result (57/57, exit 0, no
residue reported) to guard against the run-to-run flake this exact area
turned out to have during repair (see items 6–7 below).

## Failures found during REPAIR and their repairs (retained, not deleted)

1. **`Install-CvfDownstreamCatalogKit`'s new `return $status` was corrupted by a leaked nested-process stdout.** The pre-existing `& powershell -File $managerPath -Write ...` call was never assigned to a variable; once the function started `return`ing a status string, that unassigned native call's entire console output became part of the function's own return value (PowerShell captures an unredirected native command's stdout as pipeline output), making `-CatalogKitStatus $catalogKitStatus` fail parameter binding with "Cannot convert value to type System.String." Repair: capture the manager's output into `$managerWriteOutput` and `Write-Host` it explicitly instead of letting it leak.
2. **`@($Registry.artifacts)` / `@($Registry.modules)` crashed when the field was entirely absent.** `@($null)` produces a **one**-element array containing `$null` (distinct from `@(a real empty array)`, which stays empty) — so a registry with `artifacts` removed via `.PSObject.Properties.Remove('artifacts')` made the validator's `foreach` loop run once with a null entry and crash inside `Test-CvfObjectShape` ("Cannot bind argument to parameter 'Obj' because it is null"). Repair: added `ConvertTo-CvfSafeCollection`, which explicitly returns a true empty array for `$null` input, and routed both collection iterations through it.
3. **`@(Test-CvfObjectShape ...)` inside `Get-CvfCatalogState` silently produced a false "damaged" verdict on every valid registry.** `Test-CvfObjectShape` returns via `return , $violations.ToArray()` (the unary-comma fix from the BUILD phase) so that a genuinely empty violation list survives plain/cast capture as a real 0-length array. Wrapping that same call in `@(...)` at the call site does something different: since the comma operator makes the function emit exactly one pipeline object (the empty array itself), `@()` treats that single emitted object as **one array element**, yielding a 1-element array containing an empty string instead of a 0-length array. `$shapeViolations.Count` read `1` for a perfectly valid `ARTIFACT_REGISTRY.json`, so every second-and-later bootstrap run misclassified a healthy `ALREADY_GOVERNED` project as `DAMAGED_GOVERNED` — this is what broke AC-06 idempotency after the BSL-R1 classifier was introduced. Repair: use the same `[string[]](...)` cast pattern already used correctly everywhere else in this file, not `@(...)`, at this one call site. Verified interactively: `[string[]](Test-CvfObjectShape ...)` → `Count = 0`; `@(Test-CvfObjectShape ...)` → `Count = 1` (bogus), against the byte-identical input.
4. **Bootstrap log embedded the raw `CatalogKitStatus` enum value, breaking AC-06 idempotency by design.** `FRESH_INSTALLED` (run 1) and `ALREADY_GOVERNED_REGENERATED` (run 2+) are both healthy steady states but render as different text, and the bootstrap log is fully regenerated every run — so a committed run-1 log always differed from a regenerated run-2 log. Repair: map both healthy states to the same stable label (`PRESENT`) in `Get-CvfBootstrapLogContent`; only the two exceptional states (`DAMAGED_GOVERNED_SKIPPED`, `MIGRATION_REQUIRED_SKIPPED`) get distinct, still run-to-run-stable labels.
5. **Three new-test fixtures had their own bugs, independent of production code.** `wrong-type-controls-not-array` used `$hashtable.Remove('controls')` + `Add-Member` (Add-Member note properties do not reliably round-trip through `ConvertTo-Json` on a hashtable) instead of a plain key reassignment. The true-legacy BSL-R3 fixture stripped the manifest's `catalogKitVersion` and deleted the catalog files but left the now-dangling catalog paths in `requiredDocs`, so the doctor correctly (but unintentionally, for this fixture's purpose) failed "Required docs referenced by manifest exist." The damaged-registry BSL-R1 fixture compared file content against a hand-typed literal that didn't account for `Set-Content`'s own newline handling. All three repaired to match what a real instance of each state would actually look like.
6. **A freshly `Copy-Item`'d catalog manager occasionally failed to load on its very first invocation.** Observed intermittently (not on every run) as `DAMAGED_GOVERNED_SKIPPED` on what should have been a clean `FRESH_INSTALLED`/`ALREADY_GOVERNED_REGENERATED` result, consistent with a transient Windows file lock (AV/indexing) on a just-written `.ps1`. Repair: `Install-CvfDownstreamCatalogKit` retries the manager `-Write` invocation up to 5 times with a 1-second backoff before concluding the kit is actually damaged. (Finding 3 above turned out to be the dominant cause of the AC-06 flake actually observed during this repair round; this retry is a defensive hardening for the real, separately-reproduced transient-lock case and is kept because it protects real users' first bootstrap, not just this harness.)

No finding above, or from the BUILD phase, was deleted or silently reworded
away; each repair is the change actually present in the current diff.

## Explicit scoping decisions (for REVIEWER attention, repair round)

- **BSL-R5 network dependency.** The strict `AC-09` assertion requires the fresh-clone initializer's own internal doctor call (against the real, unmodified `origin/main` core) to exit 0, which requires this environment to reach `https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`. That reachability was confirmed (`git ls-remote` succeeds) before relying on it. If a future run of this harness executes in a fully offline environment, this specific assertion would need to degrade to a reported `BLOCKED` rather than a hard `FAIL`; that branch is not implemented because it is not the environment this repair was verified in, and adding untested handling for an unobserved condition was judged worse than being explicit about the dependency here.
- **BSL-R7 reconciler check is static, not a live run.** `update_cvf_workspace_public_core.ps1` performs a real `git clone` from the public remote plus destructive backup/move of an existing hidden core; actually executing it would either require the tranche to already be merged to public `main` (it is not) or would misrepresent what is being tested. The harness instead asserts, by reading the script's own source text, that its `$requiredPublicCoreFiles` list textually contains all 7 new surfaces — a safe, precise substitute for the one script whose full reconciliation flow cannot be exercised hermetically. The two OTHER completeness lists (bootstrap, doctor) ARE exercised with real negative-case executions (a core missing one helper causes a real bootstrap failure / a real doctor failure).
- **Module vocabulary evidence field is a free-text string, not independently verified.** BSL-R4 requires "evidence fields sufficient to justify the selected status"; the manager enforces that `evidence` is present and non-empty, but cannot programmatically verify that the referenced file/line or test/gate actually substantiates the claimed status — that remains a human/reviewer judgment at the point a real module entry is added, documented explicitly in `CVF_DOWNSTREAM_CATALOG_GUARD.md`'s claim boundary.
- Carried over unchanged from BUILD: the "unknown CVF control" format-only interpretation, and the guard doc's non-numbered status.

## Cleanup / residue confirmation (repair round)

```text
PS> Get-ChildItem $env:TEMP -Directory | Where-Object { $_.Name -like 'cvf-golden-*' }
(no results after either of the two final harness runs)
```

Ad hoc debug reproductions created during root-causing (under names like
`cvf-debug-*`) were manually removed after use and are not part of the
harness's own tracked temp roots; none remain.

## Final verification (repair round)

```text
git rev-parse HEAD           -> 2c59f6ac1317507628d9ae420c19e2dc4704d329 (unchanged)
git branch --show-current    -> tranche/golden-downstream-bootstrap (unchanged)
git diff --cached --stat     -> (empty; nothing staged)
git diff --check             -> exit 0 (no whitespace errors)
trailing-whitespace scan of all new files -> no matches
secret-pattern scan (DASHSCOPE/sk-/AKIA) across new + modified files -> no matches
```

## Non-goals honored (repair round)

No provider was called; no API key or secret was read; no dependency was
installed; `CVF-Operations-Workspace` was not touched; no existing downstream
catalog was migrated; no application runtime module was created or claimed;
no reconciliation algorithm, backup behavior, or manifest-update behavior in
`update_cvf_workspace_public_core.ps1` was changed (Amendment 1's scope
limit honored — only `$requiredPublicCoreFiles` was touched).

REPAIR round 1 stopped at `READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_RE_REVIEW`.
Re-review 2 returned `CHANGES_REQUESTED` with two remaining findings,
BSL-R8 and BSL-R9 (appended to
`docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_INDEPENDENT_REVIEW_FINDINGS_2026-07-23.md`),
after confirming BSL-R1 through BSL-R7 closed by source inspection, the
named negative tests, and independent PowerShell-parser / JSON-schema /
`check_public_surface.py` / `git diff --check` / harness (57/57) runs.
Everything above this line is the unmodified REPAIR-round-1 record.
Everything below is REPAIR round 2.

---

# REPAIR ROUND 2 — Independent Review Findings BSL-R8 and BSL-R9

- Role recorded: REPAIR_WORKER (Claude), per the reviewer's re-review-2 gate
- Pre-repair baseline: HEAD `2c59f6ac1317507628d9ae420c19e2dc4704d329`,
  branch `tranche/golden-downstream-bootstrap`, worktree matched REPAIR
  round 1's final unstaged state exactly (verified before any edit)
- Status: repairs complete, unstaged. Not committed, staged, pushed, or
  self-approved. No changed-set ceiling expansion was needed or used.

## Exact changed set (current, unstaged — unchanged file list from REPAIR round 1)

```text
Modified:
  docs/GET_STARTED.md
  docs/reference/CVF_WORKSPACE_RULES.md
  scripts/check_cvf_workspace_agent_enforcement.ps1
  scripts/new-cvf-workspace.ps1
  scripts/update_cvf_workspace_public_core.ps1

New:
  docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_BUILD_EVIDENCE_2026-07-23.md
  docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_INDEPENDENT_REVIEW_FINDINGS_2026-07-23.md
  docs/reference/CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_WORK_ORDER_AMENDMENT_1_2026-07-23.md
  governance/toolkit/05_OPERATION/downstream_catalog/CVF_DOWNSTREAM_CATALOG_GUARD.md
  scripts/lib/downstream_catalog/CvfDownstreamBootstrapContent.ps1
  scripts/lib/downstream_catalog/CvfDownstreamCatalogLib.ps1
  scripts/lib/downstream_catalog/CvfGoldenHarnessSupport.ps1
  scripts/lib/downstream_catalog/CvfWorkspaceDoctorLiveReadiness.ps1
  scripts/lib/downstream_catalog/manage_cvf_downstream_catalog.ps1
  scripts/lib/downstream_catalog/schemas/ARTIFACT_REGISTRY.schema.json
  scripts/lib/downstream_catalog/schemas/MODULE_REGISTRY.schema.json
  scripts/test_cvf_golden_downstream_bootstrap.ps1
```

Round 2 only edited files already inside this exact set:
`scripts/new-cvf-workspace.ps1` (BSL-R8 exit/messaging logic),
`scripts/test_cvf_golden_downstream_bootstrap.ps1` (BSL-R8 hermetic negative
tests, AC-15/BSL-R9 executable assertions, one added dot-source line),
`docs/reference/CVF_WORKSPACE_RULES.md` (BSL-R9 classifier wording), and
this evidence file. No path outside the existing ceiling was touched; the
ceiling was not widened.

## BSL-R8 — evidence

**Repair:**

- `new-cvf-workspace.ps1` now inspects `$catalogKitStatus` immediately after
  writing the bootstrap log:
  - `DAMAGED_GOVERNED_SKIPPED` → `throw` with a message naming the failure
    and pointing at the bootstrap log and `manage_cvf_downstream_catalog.ps1
    -Check`. A `throw` under this script's `$ErrorActionPreference = "Stop"`
    is an uncaught terminating error: the process exits non-zero and
    execution never reaches the `Write-Ok "Workspace bootstrap complete."`
    line below it.
  - `MIGRATION_REQUIRED_SKIPPED` → still exits 0 (bounded, per BSL-R1's
    original design), but prints `Write-Warn "Workspace bootstrap complete
    WITH NOTE - this is NOT a governed-catalog success."` plus a
    `MIGRATION_REQUIRED` explanation, instead of the plain
    `Write-Ok "Workspace bootstrap complete."` a real success prints.
  - `FRESH_INSTALLED` / `ALREADY_GOVERNED_REGENERATED` → unchanged: plain
    `Write-Ok "Workspace bootstrap complete."`.

**Named hermetic negative tests (both force `DAMAGED_GOVERNED_SKIPPED` through a different one of the two code paths named in the finding):**

| Test | Forces | Assertions |
|---|---|---|
| `BSL-R8: Bootstrap exits non-zero when catalog installation is damaged (shape-invalid registry, from the very first bootstrap)` / `... does not print the success claim ...` | `Get-CvfCatalogState`'s early shape check (registry replaced with `{ "not": "a valid registry" }`, reusing the existing BSL-R1 damaged-source fixture) | non-zero exit; output does not contain `Workspace bootstrap complete` |
| `BSL-R8: Fixture reaches the manager-exit-nonzero path ...` / `... Bootstrap exits non-zero when the catalog manager itself rejects the registries` / `... does not print the success claim ...` / `... explicitly identifies the damaged-governed failure ...` | The catalog **manager itself** (registry passes `Get-CvfCatalogState`'s top-level shape check — a duplicated `artifacts[1].id` keeps all 5 top-level fields intact — but fails `Test-CvfArtifactRegistry`'s duplicate-id content check, so `manage_cvf_downstream_catalog.ps1 -Write` itself exits non-zero after all retries) | pre-classification is confirmed `ALREADY_GOVERNED` (proving this is the OTHER path than the fixture above); non-zero exit; no success claim; output names `DAMAGED_GOVERNED` |
| `BSL-R8: MIGRATION_REQUIRED_SKIPPED stays bounded (exit 0) but never prints the unqualified success claim` / `... completion message explicitly states it is not a governed-catalog success` | The existing BSL-R1 legacy/mixed sentinel fixture | exit 0 (bounded, not a failure); output does not contain the literal `Workspace bootstrap complete.` claim; output contains `NOT a governed-catalog success` |

All 8 assertions above: PASS (see full harness run below).

## BSL-R9 — evidence

**Item 2 (documentation) — repaired.** `docs/reference/CVF_WORKSPACE_RULES.md`
previously said: "When the catalog manager is present, the doctor also runs
it in check mode ...; a project bootstrapped before this kit existed (no
`scripts/manage_cvf_downstream_catalog.ps1`) keeps the pre-existing checks
only." This described a manager-presence-only classifier, which is not what
the doctor implements. It now reads (excerpt): "A project is **governed**
if its `.cvf/manifest.json` carries the `catalogKitVersion` marker **or**
any governed-catalog surface exists on disk ... not only when the manager
script specifically is present. A governed project must be complete ...
and if the marker or any surface is present while another required surface
is missing, that is `DAMAGED_GOVERNED_KIT` - also a blocking failure, never
a silent fallback to legacy compatibility. Only a project with **no**
governed marker and **no** governed surface at all ... keeps the
pre-existing checks only."

**Item 1 (duplicate bootstrap-log line) — investigated, not reproduced; a
permanent regression guard was added regardless.** The finding names
`Get-CvfBootstrapLogContent` as emitting
`.cvf/manifest.json: PRESENT (knowledgePath: knowledge/)` twice. Before
writing any fix, this was checked four independent ways against the current
unstaged source:

1. Static read of the full `Get-CvfBootstrapLogContent` heredoc: exactly one
   occurrence of the line.
2. Direct invocation of `Get-CvfBootstrapLogContent` for all four possible
   `-CatalogKitStatus` values (`FRESH_INSTALLED`, `ALREADY_GOVERNED_REGENERATED`,
   `DAMAGED_GOVERNED_SKIPPED`, `MIGRATION_REQUIRED_SKIPPED`): regex count of
   `manifest\.json` in the rendered output was `1` in every case.
3. `grep -c` inside the function's own body block: `1`.
4. A full real hermetic bootstrap run (fresh workspace, hermetic core
   overlay, `new-cvf-workspace.ps1` invoked end-to-end) followed by
   `Select-String -Path <real generated log> -Pattern "manifest.json"`
   against the actual file written to disk: `1` match.

No duplicate was found in the current unstaged code by any of these methods.
Rather than declare the finding closed on the basis of non-reproduction,
`AC-15` gained a permanent, automatic regression guard (below) that asserts
the count is exactly `1` on every future harness run — if this ever
regresses (including for a cause not yet identified), the harness will fail
immediately and name the count. This is reported transparently rather than
claiming a "fix" for a defect that could not be located.

**AC-15 executable assertions (BSL-R9's "extend AC-15" requirement), both new:**

- `AC-15: Bootstrap log states .cvf/manifest.json presence exactly once, not
  duplicated (BSL-R9)` — counts `Select-String` matches of
  `.cvf/manifest.json: PRESENT` in the real bootstrap log generated for the
  harness's own pristine project; asserts the count is exactly `1`.
- `AC-15: CVF_WORKSPACE_RULES.md documents the real marker-or-any-surface
  governed classifier and blocking DAMAGED_GOVERNED_KIT behavior (BSL-R9)`
  plus `AC-15: CVF_WORKSPACE_RULES.md no longer claims governed status
  depends only on the manager script's presence (BSL-R9)` — read the real
  doc file and assert it contains `catalogKitVersion`, `DAMAGED_GOVERNED_KIT`,
  and `any governed-catalog surface exists`, and no longer contains the
  stale `When the catalog manager is present, the doctor also runs it`
  phrase.

All 3 assertions: PASS.

## Failure found while adding the BSL-R9 assertion, and its repair

**A markdown bold marker broke a substring match.** The first version of the
`documents the real marker-or-any-surface governed classifier` assertion
searched for the literal substring `or any governed-catalog surface exists`,
but the actual prose reads `**or** any governed-catalog surface exists`
(the word "or" is bolded in the rendered markdown, so the literal three-letter
sequence `"or "` immediately preceded by `**` does not match a search string
that assumes plain `"or "`). The assertion failed on the first harness run
after this addition. Repair: search for `any governed-catalog surface
exists` instead (a substring present regardless of the surrounding markdown
emphasis), re-verified against the actual file content before re-running.

## Updated harness assertion count

REPAIR round 1 ended at 57/57. Round 2 adds 11 new named assertions (8 for
BSL-R8, 3 for BSL-R9/AC-15):

```text
PS> powershell -ExecutionPolicy Bypass -File scripts\test_cvf_golden_downstream_bootstrap.ps1
...
CVF Golden Downstream Bootstrap Harness - Summary
  68/68 assertions passed
  RESULT: PASS
EXIT=0
```

Run twice consecutively with the same clean result (68/68, exit 0) after the
bold-marker fix above.

## Independent-check re-run (repair round 2)

```text
PowerShell parser (all 9 touched .ps1 files) -> PASS, 0 syntax errors
JSON schema parse (both schemas)             -> PASS
python scripts/check_public_surface.py       -> "CVF public-surface scan: PASS", exit 0
git diff --check                             -> exit 0 (no whitespace errors)
file-size guard (AC-11, all 9 files)         -> PASS, largest is 569 lines (harness), all < 600
golden downstream harness                    -> PASS, 68/68 assertions, exit 0 (2 consecutive runs)
trailing-whitespace scan of new + modified files -> no matches in this round's edits
                                                 (2 pre-existing hits in docs/GET_STARTED.md,
                                                 both outside this round's diff hunks and
                                                 outside REPAIR round 1's diff hunks - Vietnamese
                                                 markdown hard-line-break convention, unrelated)
secret-pattern scan (DASHSCOPE/sk-/AKIA)     -> no matches
git rev-parse HEAD                           -> 2c59f6ac1317507628d9ae420c19e2dc4704d329 (unchanged)
git branch --show-current                    -> tranche/golden-downstream-bootstrap (unchanged)
git diff --cached --stat                     -> (empty; nothing staged)
```

## Non-goals honored (repair round 2)

No provider was called; no API key or secret was read; no dependency was
installed; `CVF-Operations-Workspace` was not touched; the changed-set
ceiling was not widened (round 2 only edited files already in round 1's
list); no reconciliation algorithm, backup behavior, or manifest-update
behavior in `update_cvf_workspace_public_core.ps1` was touched in this
round (it was not part of round 2's edits at all).

READY_FOR_INDEPENDENT_BOOTSTRAP_LEARNING_RE_REVIEW_2
