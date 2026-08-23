# CVF Public Projection Pre-Push Profile Standard

Memory class: FULL_RECORD

Status: ACTIVE

docType: reference

Date: 2026-08-11

Batch ID: PUBLIC-PROJECTION-PREPUSH-T1

**Applies to:** any reviewer/closer or session-sync steward evaluating
whether a locally committed public-projection candidate may proceed to a
later, separately authorized push tranche.

## Purpose

Satisfy the T0 `BLOCKED_NO_OWNER` reopen predicate recorded in
`docs/reviews/CVF_PUBLIC_PROJECTION_PREPUSH_T0_OWNER_FEASIBILITY_AUDIT_COMPLETION_2026-08-06.md`
by naming a stable owner role, an ownership taxonomy, and a gate-versus-report
policy for public-projection-aware pre-push evaluation, and by defining the
narrow provenance-owned gate that implements that policy.

This standard does not authorize push, deployment, or any public clone
mutation. It authorizes a read-only, provenance-run evaluation of an
explicitly named public-root candidate.

## Owner Surface

**Public Projection Release Steward** (fulfilled by the reviewer/closer
role defined in `docs/reference/guard_orientation/README.md`) owns:

- this standard (classification taxonomy and gate-versus-report policy);
- `governance/compat/CVF_PUBLIC_PROJECTION_PRE_PUSH_POLICY.json` (machine-
  readable classification, pinned inherited debt, and candidate manifest);
- `governance/compat/run_public_projection_pre_push_gate.py` (deterministic
  evaluation runner);
- `governance/compat/test_run_public_projection_pre_push_gate.py` (fail-
  closed regression coverage).

The **classification owner** for whether a given check is `PUBLIC_OWNED` or
`PRIVATE_OWNED`, and for whether a given `PUBLIC_OWNED` finding is `GATE` or
`REPORT`, is the Public Projection Release Steward, recorded per-check in the
policy JSON `checks` array. No other role may add, remove, or reclassify a
check without editing the policy JSON under this standard's ownership.

This profile does not replace, edit, or weaken
`governance/compat/local_governance_hook_catalog_pre_push.py` (the generic
private-provenance pre-push catalog) or any existing checker. It is a
separate, additive, narrower evaluation that only inspects an explicitly
named public-root candidate.

## Scope

In scope: read-only evaluation of a public-projection candidate directory
(a public-sync clone worktree) named explicitly by the caller via
`--public-root`, at an explicit `--base`/`--head` commit pair on an explicit
branch, against an explicit remote.

Out of scope: any mutation of the public root; push; deploy; Netlify or any
provider/browser/store action; secret reads; network installs; edits to the
generic private pre-push catalog or any existing checker; evaluation of any
root other than the one explicitly named at invocation.

## Ownership Taxonomy

Every check the profile runs is classified in the policy JSON as exactly one
of:

- `PUBLIC_OWNED` - the check's subject (file, script, or registry target) is
  physically present in the public tree and the public projection is
  responsible for its correctness.
- `PRIVATE_OWNED` - the check's subject is a provenance-internal
  governance-control-plane concept (session state, handoff, dispatch-packet
  lifecycle, corpus/absorption registry, ADIF, or similar) with no public-tree
  ownership claim. `PRIVATE_OWNED` checks are never gated by this profile.

This taxonomy is inherited directly from the T0 audit's `ownerApplicability`
column
(`docs/audits/CVF_PUBLIC_PROJECTION_PREPUSH_T0_OWNER_FEASIBILITY_AUDIT_2026-08-06.md`,
Finding 2) and must not be re-derived from raw execution result: a check
failing inside the public root is not by itself evidence of `PUBLIC_OWNED`
status (T0 Finding 2's `PROJECTION_DEPENDENCY_FAILURE` class is the
counter-example - a public-tree registry that references an intentionally
unexported private evidence path).

## Four Confirmed Public-Relevant Defect Families

T0 (`docs/audits/CVF_PUBLIC_PROJECTION_PREPUSH_T0_OWNER_FEASIBILITY_AUDIT_2026-08-06.md`,
Finding 3a) confirmed exactly four `PUBLIC_OWNED` defect families whose
failing subject is physically present in the public tree. This profile
recomputes all four fresh against the current candidate rather than reusing
T0's recorded values as substitute evidence:

| Family ID | Subject | Rule |
| --- | --- | --- |
| `governed_file_size` | `docs/EXPORT_MANIFEST.md` | line count must not exceed the `active_markdown` hard threshold (1200 lines, per `governance/compat/CVF_GOVERNED_FILE_SIZE_EXCEPTION_REGISTRY.json`) |
| `governed_python_automation_size` | `scripts/score_qbs_model_assisted_reviewers.py` | line count must not exceed the `python_cli_orchestrator` hard threshold (800 lines) |
| `guard_registry_compatibility` | `README.md`, `docs/CVF_CORE_KNOWLEDGE_BASE.md` | both files must contain a guard-registration reference to `CVF_PUBLIC_PROJECTION_PRE_PUSH_GATE` once this profile ships, and must not regress any guard-registry row present at the pinned base |
| `pre_public_p3_readiness` | `CODEOWNERS`, `CONTRIBUTING.md`, `COST_AND_QUOTA.md`, `GOVERNANCE.md`, `PROVENANCE.md`, `PROVIDERS.md` | each root file must remain present and must not lose its exposure-classification reference relative to the pinned base |

## Gate-Versus-Report Policy

For each of the four families above, the runner compares the freshly
recomputed finding against the exact pinned inherited-debt value recorded in
the policy JSON at the authorized base commit
(`2103a38fda01ee827e9fc6c3be38a824fa5d54ad`):

- **REPORT (non-fatal)**: the freshly recomputed finding is byte-for-byte
  identical to the pinned inherited value (same subject, same metric, same
  magnitude). This is pre-existing debt T0 already confirmed and this profile
  does not newly gate it; it is printed in the human summary and recorded in
  the JSON receipt as `inheritedDebtReported`, but does not fail the run by
  itself.
- **GATE (fatal)**: the freshly recomputed finding is new (a family with no
  pinned inherited debt now fails), worse (the metric regressed beyond the
  pinned value - for example a larger line count, a newly missing
  classification, or a newly missing guard row), or the pinned finding
  disappeared without the corresponding explanatory evidence this standard
  requires (a `RESOLVED` disposition recorded in the policy JSON by the
  steward, not silently inferred by the runner). Any `GATE` condition fails
  the run with a nonzero exit code.

Any check outside the four named families that is classified `PUBLIC_OWNED`
in the policy JSON and fails is always `GATE` - report-only treatment is
reserved exclusively for the exact-pinned-inherited-debt case above and is
never a default.

## Fail-Closed Validation Requirements

Before evaluating any check, the runner must validate, and fail closed
(nonzero exit, no partial pass) if any of the following do not hold:

1. `--base` must equal the policy's `pinnedBaseHead` and `--head` must equal
   the policy's `authorizedCandidateHead`, both validated as well-formed
   commit SHAs, before any Git inspection of the public root runs. A caller
   who supplies a different (even otherwise valid) base or head - or who
   tampers with the policy's pinned values while supplying the correct CLI
   values - fails closed here; this profile only ever evaluates the exact
   pinned range and never a caller-chosen one.
2. `--public-root` resolves to an existing directory that is a Git worktree
   whose resolved absolute path is used for every subsequent Git command
   (no path traversal outside the declared root).
3. The public root's `origin` remote matches the exact URL recorded in the
   policy JSON (`https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git`).
4. The public root's current branch matches the policy's `expectedBranch`
   (`lpci1-ref-staging`).
5. The public root's worktree is clean (no unstaged, staged, or untracked
   changes).
6. `--base` and `--head` both resolve to valid commits inside the public
   root, and `--head` matches the public root's actual current `HEAD`.
7. The `base..head` range is non-empty (at least one changed path).
8. `git diff --name-only base..head` inside the public root matches the
   exact manifest recorded in the policy JSON with zero extra, missing,
   unclassified, deleted, or renamed paths.
9. Every check named in the policy JSON has a recognized classification
   (`PUBLIC_OWNED` or `PRIVATE_OWNED`) and, if `PUBLIC_OWNED`, a recognized
   family or `AD_HOC_GATE` disposition; an unknown classification fails
   closed rather than defaulting to pass. The declared check registry and
   the set of checks actually executed (including every configured external
   command) must reconcile exactly: any declared-but-unexecuted id, or any
   executed-but-undeclared id, fails closed.
10. Every configured external command is resolved only relative to its own
    `workingDirectory` (never an absolute path baked into the policy); a
    missing executable fails closed rather than silently skipping the
    command. PATH resolution is forbidden by default, with exactly one
    narrow, explicit exception: a command may set
    `"resolveViaSystemPath": true` only for a system-level build tool that
    is not part of the candidate's own pinned `node_modules/.bin`
    dependencies (currently the `node` interpreter itself, used by the
    pinned build sequence); every other command continues to resolve
    strictly relative to its `workingDirectory`.
11. Every external command actually runs via `subprocess.run` with explicit
    argv (never `shell=True`), an explicit contained working directory, and
    an explicit per-command timeout. A launch error, timeout, or nonzero
    exit is a `GATE` failure with deterministic, secret-safe evidence
    (command id, exit status, timeout disposition, and a length-bounded
    output tail); a Git subprocess failure or timeout is never accepted as
    substitute coverage for an external command's own failure or timeout.
12. No `--public-root` invocation may write to, stage, or commit inside the
    public root, for the complete duration of a run, including sandbox
    materialization and teardown. The runner opens files read-only and
    shells only read-only Git subcommands (`status`, `diff`, `rev-parse`,
    `cat-file`, `branch`, `remote`, `archive`, `ls-tree`, `show`) against
    the public root. Every configured mutating package command executes
    only inside a disposable sandbox (see Sandbox Execution Contract
    below), never against the public root directly.

## Sandbox Execution Contract

Amendment 1 resolves the read-only-vs-mandatory-build conflict by
relocating every mutating package command (test/type/lint/build) to a
disposable, hash-verified sandbox, rather than by weakening or omitting
any required command category. This section is normative for any
`externalCommands` entry configured with `"sandboxed": true`.

1. **Materialization**: before any sandboxed command runs, the runner
   creates a fresh temporary directory outside both the private Core root
   and the public-sync root (for example under the OS temp root), then
   populates it by running `git archive <authorizedCandidateHead>` against
   the public root's own Git object store (read-only) and extracting that
   archive into the temporary directory. The public root's working-tree
   files are never copied directly, and no file is ever copied from an
   uncommitted Core worktree.
2. **Hash verification**: before any package command runs, the runner
   compares the sandbox's materialized path set and, for a defined
   verification subset, per-path content hashes against
   `git ls-tree -r <authorizedCandidateHead>` / `git show
   <authorizedCandidateHead>:<path>` read from the public root. Any
   missing, extra, or content-mismatched path fails closed as
   `SANDBOX_MATERIALIZATION_MISMATCH` before any command executes.
3. **Dependency isolation**: sandboxed packages that require
   `node_modules` obtain it via a real (non-junctioned) `node_modules`
   directory created fresh inside the sandbox, populated entry-by-entry. A
   real repository (public root or Core) is a read-only copy source only
   and is never a live link target: every third-party dependency entry is
   first physically copied from the corresponding package's already-
   installed `node_modules` in the public root into a dedicated
   dependency-store subtree of the sandbox's own disposable temporary
   support directory (never into the public root or Core, and never
   referenced by a link whose resolved target remains inside either real
   repository), and only then linked into the sandbox from that support-
   owned copy - a directory junction (Windows `New-Item -ItemType
   Junction`, created without elevated privilege) for a directory entry, or
   a hard link (falling back to a copy if the sandbox and support directory
   are ever on different drives) for a file entry (junctions cannot target
   files). The runner never writes through these entry-level links, and the
   sandbox's `node_modules` directory itself is never a junction (which
   would make every path reached through it transparently resolve back
   into the public root). One dependency-store entry is a documented
   exception to the copy-then-link pattern: `next` is physically copied
   directly into the sandbox's own `node_modules` with no junction anywhere
   in its path, because Webpack's default `resolve.symlinks: true` realpaths
   through any junction encountered during module resolution - including
   one that targets a support-owned copy, not only one targeting the real
   repository - so only a dependency with zero junctions in its path
   resolves entirely inside the sandbox from Webpack's point of view. Any
   `cvf-*` sibling package entry named as requiring redirect that would
   otherwise resolve to a real, non-symlinked package copy (rather than a
   link to a sibling `EXTENSIONS/` directory) is instead linked, inside the
   sandbox only, to the sandbox's own extracted `EXTENSIONS/<package>`
   directory (never copied from the real store, since the sandbox's own
   git-archive extraction already carries the pinned code), so that the
   package's relative (`../../`) imports resolve inside the sandbox and
   never back into the public root. No `npm install`, no network access,
   and no dependency-store entry created by this step may itself be located
   outside the sandbox-or-support boundary, and none may resolve into the
   public root or Core specifically; every link's resolved target is
   independently verified against that boundary before the corresponding
   command runs. Creation or verification failure is
   `SANDBOX_DEPENDENCY_ISOLATION_FAILURE`.
4. **Execution**: each sandboxed command runs via `subprocess.run` with
   explicit argv, `cwd` set inside the sandbox, `shell=False`, and an
   explicit timeout, identically to a non-sandboxed external command.
   Generated output (`.cvf`, `.next`, generated `src` files, caches,
   reports, test artifacts) is expected and permitted inside the sandbox,
   because the entire sandbox is disposable.
5. **Public-root invariant capture**: the runner captures the public
   root's `HEAD`, current branch, and full `git status --short` (including
   untracked files) plus staged and unstaged diff immediately before the
   first sandbox is materialized and again immediately after the last
   sandboxed command's teardown completes. Any difference between the two
   captures is `GATE` as `PUBLIC_ROOT_INVARIANT_VIOLATION`, even if the
   runner could technically repair the difference; the runner never
   cleans, restores, or repairs the public root under any circumstance.
6. **Teardown**: every sandbox and its dedicated temporary support
   directory are deleted completely after the full command set for that
   sandbox finishes, regardless of outcome. A cleanup failure that leaves
   temporary governed state behind is `GATE` as `SANDBOX_CLEANUP_FAILURE`.

## Receipt And Output Contract

The runner emits:

- a deterministic JSON receipt (stable key order, no wall-clock-dependent
  values beyond an explicit `generatedAtUtc` field) containing the resolved
  root, remote, branch, base, head, manifest delta, per-check classification
  and disposition, `inheritedDebtReported`, `gateFailures`, and `compliant`;
- a human-readable summary printed to stdout mirroring the same facts;
- exit code `0` only when `compliant` is `true`; any `GATE` failure, fail-
  closed validation failure, or unhandled error returns a nonzero exit code.

## Claim Boundary

This standard authorizes a local, provenance-run, read-only public-projection
pre-push evaluation profile only. It does not authorize push, deployment,
Netlify or any provider/browser/store action, public clone mutation, secret
access, network installs, or any change to the generic private pre-push
catalog. A passing run under this profile is a precondition for a later,
separately authorized push-readiness tranche; it is not itself a push
authorization.

When a mandatory command category (test/type/lint/build) genuinely cannot be
executed against the pinned candidate without modifying the public root
directly, the Sandbox Execution Contract above resolves that conflict by
location rather than by omission: the command still runs, unweakened,
against a disposable extraction of the same pinned candidate. This standard
still requires the profile's authoring or evaluation work to terminate
`BLOCKED_CONTRACT_CONTRADICTION` with exact command/package evidence in the
narrower case where sandboxing itself cannot resolve the conflict (for
example, a command whose defining behavior requires mutating the real
public root specifically, not merely mutating a copy of it) rather than
silently omitting, weakening, or deferring that category. This is not a
failure state for the profile's implementation; it is the correct, honest
outcome when the read-only-public-root requirement and a command's
mandatory behavior are irreconcilable even inside a sandbox.
