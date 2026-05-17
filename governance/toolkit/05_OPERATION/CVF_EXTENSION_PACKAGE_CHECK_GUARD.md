# CVF Extension Package Check Guard

**Control ID:** `GC-029`
**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active extension-level package verification rule for touched `EXTENSIONS/*` packages.
**Applies to:** Humans and AI agents making governed source, test, or package-config changes inside extension packages under `EXTENSIONS/`.
**Enforced by:** `governance/compat/check_extension_package_check.py`

Control ID: `GC-029`

## Purpose

- prevent extension-level technical debt from slipping through when focused tests are green but package-level verification is stale
- make `npm run check` a mandatory gate for touched extension packages instead of an optional habit
- stop small compile, type, config, or build drift from accumulating into later cross-tranche friction

## Rule

Whenever governed work changes substantive files inside an extension package under `EXTENSIONS/`, the package MUST pass its package-level `check` script before push.

For this control, a touched extension package means:

- the package has a `package.json`
- the package defines `scripts.check`
- governed changes touched source, test, or package-level config files inside that package

If those conditions are true, `npm run check` is mandatory.

### Scope

`GC-029` applies to extension-local package verification for touched packages, including:

- `src/`
- `tests/`
- `package.json`
- `tsconfig*.json`
- `vitest.config.*`
- other package-level runtime, build, or test config files

This control is about extension package verification. It does not replace:

- focused test selection and test-log requirements
- tranche-local governance or roadmap authorization
- higher-level release readiness checks

### Required Enforcement Behavior

The package-check guard must:

1. detect touched extension packages from the active git range and worktree
2. inspect each touched package for a `check` script
3. fail if a touched package lacks `scripts.check`
4. run `npm run check` for every touched package with the script
5. fail the push if any touched package fails package-level verification

### Why This Exists

CVF has already seen the failure mode where:

- focused runtime tests passed
- repo governance checks passed
- but package-level `TypeScript` or build/test verification was not re-run on the touched extension

That gap is no longer acceptable once the cause is known.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_extension_package_check.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`
- session routing and discoverability remain aligned through `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md` and `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Related Artifacts

- `governance/compat/check_extension_package_check.py`
- `governance/compat/run_local_governance_hook_chain.py`
- `.github/workflows/documentation-testing.yml`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`

## Final Clause

If a touched extension package cannot pass its own declared `check` contract, it is not ready to rely on the rest of the governance chain for cover.
