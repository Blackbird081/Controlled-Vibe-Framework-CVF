# CVF Golden Downstream Bootstrap — Specification

- Spec ID: `CVF-BSL-T1-SPEC`
- Date: 2026-07-23
- Phase: SPEC
- Status: AUTHORIZED
- Risk: R2
- Design: `CVF_GOLDEN_DOWNSTREAM_BOOTSTRAP_DESIGN_2026-07-23.md`

## Functional requirements

- FR-01: Bootstrap a new/empty downstream repository into the canonical
  seven-step `INTAKE` state.
- FR-02: Generate Artifact Registry and Module Registry machine sources with
  closed schemas and claim-safe initial values.
- FR-03: Generate Index and Module Catalog only from the registries.
- FR-04: Install an executable, standard-library catalog manager with
  deterministic `--check` and `--write` modes.
- FR-05: Self-register the catalog schemas, tool, continuity, implementation
  truth and governed artifact families without claiming runtime modules.
- FR-06: Reject missing registered paths, duplicate IDs/paths, path escape,
  Windows separators, empty required fields and invalid lifecycle vocabulary.
- FR-07: Reject invalid module status, unknown CVF controls/dependencies and
  generated view/metric drift.
- FR-08: Preserve existing project-owned files and never replace a non-CVF
  `AGENTS.md` silently.
- FR-09: Re-running bootstrap at the same core pin is idempotent except for
  explicitly documented local-only receipts.
- FR-10: Keep portable source truth free of absolute machine paths; write
  absolute binding only to ignored `.cvf/local-binding.json`.
- FR-11: Extend the doctor to validate the governed catalog when present while
  retaining a bounded legacy compatibility path.
- FR-12: Refactor `new-cvf-workspace.ps1` below 600 lines without changing its
  public parameter contract.
- FR-13: Provide a hermetic golden-downstream test that performs bootstrap,
  second-run idempotency, doctor validation and negative drift cases.
- FR-14: Validate PowerShell/JSON encoding and fresh-checkout behavior; do not
  equate one same-machine rerun with cross-platform correctness.
- FR-15: Update public bootstrap documentation and template instructions to
  reflect the actual generated surfaces and claim boundary.
- FR-16: Do not invoke a provider, read a secret, import application runtime
  source or modify a downstream repository outside disposable test fixtures.

## Acceptance criteria

- AC-01: A disposable empty Git repository receives all required manifest,
  policy, continuity, registry, schema, manager, generated-view and bootstrap
  log surfaces.
- AC-02: Active state is exactly `INTAKE`; active role is `ORCHESTRATOR`; no
  active work order or completed runtime capability is fabricated.
- AC-03: Artifact Registry passes its schema/manager checks and contains every
  mandatory generated authority surface exactly once.
- AC-04: Module Registry is empty, metrics are zero and Module Catalog makes no
  runtime claim.
- AC-05: Index and Module Catalog are byte-stable when regenerated without
  source changes.
- AC-06: Second bootstrap run preserves project-owned content and produces no
  unintended tracked diff.
- AC-07: Catalog manager negative tests cover every FR-06/FR-07 failure.
- AC-08: Doctor passes the pristine generated project and fails after
  deliberate Index drift, registry drift or missing required catalog path.
- AC-09: Fresh-clone initializer recreates ignored local binding while tracked
  files retain only portable relative core identity.
- AC-10: No generated tracked file contains the disposable workspace absolute
  path, secret value or provider transcript.
- AC-11: `new-cvf-workspace.ps1` and every new authored source/test file are at
  most 600 lines.
- AC-12: Existing bootstrap parameter behavior and existing downstream doctor
  compatibility remain covered.
- AC-13: Golden harness exits non-zero on any failed assertion and leaves no
  worktree/temp residue.
- AC-14: Public static checks and `git diff --check` pass.
- AC-15: Documentation and generated output agree on the seven-step chain and
  live-evidence claim boundary.

## Evidence contract

Evidence must include exact commands, exit codes, changed-set list, generated
fixture inventory, clean/negative doctor results, idempotency comparison,
absolute-path/secret scan and file-size results. Failures and repairs must be
retained in the build evidence.

## Non-goals

- Auto-committing or auto-pushing a downstream repository.
- Creating product roadmaps or runtime modules for a new project.
- Migrating existing downstream catalogs automatically.
- Provider/API configuration or live governance proof.
- Updating `CVF-Operations-Workspace` or its core pin in this tranche.
