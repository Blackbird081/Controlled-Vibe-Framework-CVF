# CVF Downstream Gate Profile Migration And Upgrade Contract

## Workspace Activation Profile 1.4

Upgrade deliberately. Preserve project-owned policy, history and edited CI;
reconcile owner CI pins when the existing installer reports that requirement.
Before dependent dispatch, assess the mandatory pre-dispatch control inventory
from the pinned profile and record `.cvf/workspace-activation.json`. Bind project
root identity, raw manifest/policy/lock digests, pinned Core commit, profile ID and
profile digest. Each expected control records actions, criteria, owner, authority,
reason, disposition and hashed project evidence. APPLIED also binds installed
module, configured runner invocation and reviewed invocation evidence. The check
verifies declared bytes; Local reviews their meaning and invocation truth.

Receipt JSON uses `schemaVersion: cvf.workspaceActivation@1.0.0`, the exact
`identity` object from comparison, `sourcePolicy`, `reviewer`, `authority`,
`actions`, `supplemental` and `controls`. Each action binding is exactly
`{packet, sha256, criteria}`: project-relative path, raw packet content digest,
and sorted selected criteria. Changed output, budget or packet bytes require
new review. Each control has `id`, `owner`, `authority`,
`reason`, nonempty `actions` and `criteria`, `disposition` and an `evidence`
reference and matching `actionBindings` for its selected actions. References are
objects with project-relative `path` and raw `sha256`.
APPLIED has a `configuredInvocation` reference and `invocationEvidence` array;
the configured file names the runner and pre-dispatch phase. Other dispositions
are `NOT_APPLICABLE_WITH_EVIDENCE`, `HELD` and `EXPLICIT_UPDATE_REQUIRED`. A
control held for another action needs an `independenceEvidence` array for each
selected action. Reviewed invocation/independence/assessment JSON binds the exact
`action`, `controlId`, `purpose`, nonempty `reviewer` and `authority`, and
`decision: ACCEPTED`. Purpose is `INVOCATION`, `INDEPENDENCE` or
`SUPPLEMENTAL_ASSESSMENT`. Project-owned pins do not authenticate review truth.

Policy/mode independently requires exactly one supplemental row. It binds
`id: SUPPLEMENTAL_ASSESSMENT`, `mode`, `sourceSha256`, owner, actions and disposition.
Core-only requires `mode: NOT_INSPECTED`, null source hash and `HELD` even when no
receipt row volunteers a dependency. Each unrelated admitted action needs pinned
reviewed independence using that control ID. Inspected mode uses `INSPECTED` and
the actual verified manifest raw hash. `ASSESSED` needs action-specific
`reviewEvidence`; `HELD` blocks dependent work and needs independence for other
work. Deleting the row cannot pass.

The project policy must declare `workspaceActivationSourcePolicy` as `CORE_ONLY`
or `CORE_AND_SUPPLEMENTAL` through its authorized process. CORE_ONLY never opens
a supplemental pack; permitted supplemental mode verifies metadata and file hashes.
Unknown supplemental dependencies remain held with owner and
action list; an independent Core-only action may proceed. Never automatically fetch,
repin, install or adopt a profile. A moved project needs a fresh receipt because
the project-root binding changes.

Execution source defaults to `workspaceActivationExecutableSource: PINNED_CORE`.
The actual full-pin, clean, origin-matching Core must contain the source profile
and mapped modules matching the admitted installed bundle; a marker-only Core
cannot lend its identity to another bundle. A project may explicitly choose
`OPERATOR_LOCAL_PACK` only with `CORE_AND_SUPPLEMENTAL`. This routing opt-in alone
proves neither reviewed upgrade authority nor adoption.

Policy must separately pin `workspaceActivationUpgrade` as a project-relative
file/hash reference. Its JSON schemaVersion is
`cvf.workspaceActivationUpgrade@1.0.0`, with `decision: ACCEPTED`, nonempty
`reviewer`, `authority` and pinned `reviewEvidence`. Its `expected` object contains
exactly `projectCoreCommit`, `deliveryManifestSha256`, `profileSha256`,
`runnerSha256`, `bundleSha256`. These reviewed expected pins are independent of
the receipt and must match verified delivery and installed source bytes. Receipt
identity reports `sourceRoute: AUTHORIZED_SUPPLEMENTAL` while preserving the old
Core pin separately; pack1.4 is not pinned Core1.3. CORE_ONLY cannot use this route.
No source is automatically adopted.

For read-only comparison use the trusted Core copy of
`scripts/lib/downstream_governance/cvf_workspace_activation.py --project <project>
--core-only` through Python. It returns identity, delivery fingerprint and expected
control IDs; it does not grant admission. The switch excludes supplemental reads
even if the policy otherwise permits them. With no switch, permitted supplemental
metadata and artifact hashes are compared, while Core-only still reads no pack.

Run the independently trusted Core runner with `run --trusted --phase pre-dispatch
--project-root <project> --packet <work-order>`, or supply the reviewed profile,
runner and bundle pins to the installed runner using its three `--expect-...-sha256`
options. Bootstrap doctor also reports activation. Configured admission does not
intercept out-of-band actions; project-owned pins are not independent trust roots.

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

docType: reference

Date: 2026-10-03

Batch ID: CVF-DGIP-T1

## Purpose

Define how projects receive, pin, upgrade and migrate to
`cvf.downstreamGateProfile@1.3.0` without rewriting history or project-owned content.

## Scope / Applies To

Applies to fresh bootstrap, repeated bootstrap, pre-existing governed projects
and explicit profile upgrades performed through `scripts/new-cvf-workspace.ps1`
and the runner `install` subcommand.

## Bootstrap Modes

| Mode | Condition | Result |
|---|---|---|
| FRESH | no continuity surface exists | profile, lock, workflow and continuity truth generated |
| EXISTING | a lock already exists | verified; `ALREADY_INSTALLED` with no file change, or `DRIFT_PRESERVED` (no overwrite) which fails bootstrap |
| EXPLICIT | operator passes `-InstallGateProfile` | tooling is installed; project-owned content is untouched |
| SKIP | pre-existing project without a lock | `MIGRATION_REQUIRED_SKIPPED`; the doctor reports `GATE_PROFILE_NOT_INSTALLED` and claims no coverage |

## Existing-Project Migration Steps

1. Inventory: run the doctor; a legacy project shows the migration gap.
2. Install the tooling explicitly with `-InstallGateProfile` (collisions with
   project-owned files in `scripts/cvf_gates/` stop with `BLOCKED_COLLISION`).
3. Adopt the continuity contract deliberately: add `continuityContract` to the
   state file and a `## Current Truth` block to `CVF_SESSION_MEMORY.md`. Until
   then CVF-DG-CONT-01 reports `BLOCKED_MIGRATION_REQUIRED` with locators. No
   automatic or heuristic alignment is performed.
4. Work orders: a candidate with a non-conforming `Status` line is corrected by
   its owner; unchanged historical work orders are not migrated.
5. CI: an existing project-owned workflow is preserved and reported as
   `PROJECT_OWNED_PRESERVED`; the PR phase stays unverified until it carries the
   pinned runner command.

## Upgrade

Profile1.0/1.1/1.2 historical locks and proofs remain valid within their original scope.
Core1.3 verification of an old lock returns `LOCK_INVALID`; repeated bootstrap
reports `DRIFT_PRESERVED` and leaves the lock and learning content unchanged.
Upgrade explicitly through the trusted Core runner:

```powershell
python -B <Core>/scripts/lib/downstream_governance/cvf_downstream_gate_runner.py install --project-root <Project> --core-root <Core> --core-commit <CoreSHA> --upgrade
```

The upgrade creates missing `docs/reviews/learnings/README.md` and
`LEARNING_RECORD_TEMPLATE.md`, preserving nonempty project-owned versions.
Empty/conflicting content or a resolved path outside the project returns
`BLOCKED_LEARNING_HOME`; repair deliberately before retrying. If an existing
catalog is preserved, register the learning family deliberately and regenerate
its views with the project catalog manager. No bulk update or parked-project
adoption is authorized by this standard. The continuity/intake schema versions
stay1.0; new generated intake records identify profile1.3 and require parent admission.

A new profile version is a new `profileId`. `install --upgrade` replaces the
inherited files and rewrites the lock only on explicit operator action; the old
lock is never edited in place by bootstrap. The Core doctor reports a project
whose copy differs from the Core source as `TRUSTED_MISMATCH`.

## Coverage And CI Upgrade To Profile1.2

The new coverage control requires Local to admit the project criterion pointers in
`docs/milestone-coverage-authority.json` before first implementation dispatch.
The installer does not import Core product criteria or rewrite project roadmaps.
Missing authority permits only finite VERIFY with null authority; see
`CVF_MILESTONE_COVERAGE_MACHINE_CONTRACT.md` for the exact block and registry.

An unchanged previously generated workflow is regenerated with current pins on
explicit upgrade. An edited/project-owned workflow is preserved. If its three
new pins are absent, status UPGRADED_CI_RECONCILIATION_REQUIRED exits nonzero;
the new bundle/lock may already be installed. Verification refuses until the owner
reconciles the preserved workflow. This is a partial upgrade, not rollback or
hosted CI proof. Project-owned source and learning content remain untouched.

## Repair Convergence Upgrade To Profile1.3

After the first completed repair tranche fails its declared outcome, Local must
initiate the causal-chain audit before dependent work, without operator reminder.
Explicitly upgrade the bundle and preserve existing milestone authority/history.
Enroll the failure in registry1.1 `repairControls` following Repair Convergence
Admission in `CVF_MILESTONE_COVERAGE_MACHINE_CONTRACT.md`. Old registry1.0 remains
readable but carries no repair-admission coverage. No historical packet rewrite.

For workspace delivery resolve `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`, then verify
the manifest's individual source hashes. The operator-local `source/` tree is a
complete installation source. Substitute it for `<Core>` in the command above.
If `sourceWorktreeDirty=true`, retain the manifest and individual hashes as source
provenance and use `--core-commit UNKNOWN`; the HEAD anchor does not identify the
uncommitted delivered bytes. A clean, exact commit source may use its full SHA.
Project agents execute upgrades only within their authorized project scope and
verify the installed bundle, their registry enrollment and preserved custom CI.
Delivery at workspace level is not project installation or application.

## Rollout Evidence

Real adoption in a downstream project, a hosted PR run and public export are
separate external-effect admissions and remain `DEFERRED_PRIVATE_ONLY`.

## Claim Boundary

Migration rules only. They do not assert that any real project has migrated or
that any hosted CI has run.
