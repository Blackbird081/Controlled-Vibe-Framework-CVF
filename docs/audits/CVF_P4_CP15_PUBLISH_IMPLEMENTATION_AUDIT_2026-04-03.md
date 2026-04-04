# CVF P4 CP15 Publish Implementation Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved publish implementation packet — pre-publish checklist complete, version fix delivered, TypeScript packaging gap documented for CP16.

## Scope

- run the pre-publish verification checklist defined in P4/CP14
- fix the version numbers per the P4/CP14 versioning decision
- document remaining packaging gaps before actual `npm publish`
- define the concrete publish steps that will be executed once all gaps are resolved

## Source Truth Reviewed

- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`
- `docs/baselines/CVF_P4_CP14_PUBLICATION_DECISION_DELTA_2026-04-03.md`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/package.json` (post-version-fix)
- `EXTENSIONS/CVF_GUARD_CONTRACT/package.json` (post-version-fix)
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json` (post-version-fix)

## Pre-Publish Checklist Results

### Item 1: npm package name availability

Command executed: `npm view <name> --json` for each package name.

| Package Name | Result |
|---|---|
| `cvf-core-git-for-ai` | `E404` — not found in registry. **AVAILABLE.** |
| `cvf-guard-contract` | `E404` — not found in registry. **AVAILABLE.** |
| `cvf-runtime-adapter-hub` | `E404` — not found in registry. **AVAILABLE.** |

**Checklist item 1: PASS.**

---

### Item 2: CC-BY-NC-ND 4.0 license acknowledged

`license` field in `package.json`:

| Package | `license` field |
|---|---|
| `cvf-core-git-for-ai` | `CC-BY-NC-ND-4.0` ✅ |
| `cvf-guard-contract` | `CC-BY-NC-ND-4.0` ✅ |
| `cvf-runtime-adapter-hub` | `CC-BY-NC-ND-4.0` ✅ |

All three READMEs contain a dedicated License section with the CC BY-NC-ND 4.0 URL and plain-language implications. Closed in P4/CP12.

**Checklist item 2: PASS.**

---

### Item 3: `better-sqlite3` optional install behavior

`package.json` for `cvf-guard-contract`:
- `optionalDependencies`: `{ "better-sqlite3": "^12.6.2" }` ✅
- `dependencies`: `{}` — empty ✅
- No `preinstall` or `install` scripts that force native compilation ✅

Expected consumer behavior: `npm install cvf-guard-contract` will succeed without `better-sqlite3`. Consumers who require SQLite audit persistence must install `better-sqlite3` separately, and native compilation will occur in their environment only if they opt in.

**Checklist item 3: PASS.**

---

## Version Fix

P4/CP14 decided initial public version `0.1.0` for all three candidates. Package.json versions before this packet:

| Package | Before | After |
|---|---|---|
| `cvf-core-git-for-ai` | `3.0.0` | `0.1.0` |
| `cvf-guard-contract` | `1.0.0` | `0.1.0` |
| `cvf-runtime-adapter-hub` | `1.7.3` | `0.1.0` |

The prior version numbers were internal CVF architectural version labels (module-family versioning), not npm semver releases. The public npm release starts at `0.1.0` per the pre-stability versioning policy.

**Version fix: DELIVERED.**

---

## Remaining Gap: TypeScript Source Packaging

All three packages currently ship TypeScript source as their primary export surface:

| Package | `main` | `exports['.']` |
|---|---|---|
| `cvf-core-git-for-ai` | `./index.ts` | `./index.ts` |
| `cvf-guard-contract` | `./src/index.ts` | `./src/index.ts` |
| `cvf-runtime-adapter-hub` | `./index.ts` | `./index.ts` |

None of the three packages have a `build` script that compiles TypeScript to JavaScript. The `files` arrays also reference `.ts` source files, not compiled artifacts.

**Assessment:** Two valid approaches exist for the first-wave `0.x` release:

**Option A — Ship TypeScript source (current state):**
- No build step required
- Consumers must have TypeScript and include the package in their `tsconfig` compilation
- Acceptable for the target audience (TypeScript-first CVF integrators)
- npm package will work when consumed via `ts-node`, Vitest, or TypeScript compilation pipelines
- Does not work for plain Node.js (`require`/`import` of `.ts` files without a loader)

**Option B — Add compile-to-JS step:**
- Requires adding `tsup`, `tsc` build config, or equivalent build toolchain to each package
- Produces compiled `.js` + `.d.ts` artifacts; `main`/`exports` updated to point at compiled output
- Compatible with all Node.js consumers, not just TypeScript
- Higher effort; requires a separate CP to configure and validate

This is a packaging architecture decision. It cannot be made implicitly. A dedicated decision packet (`P4/CP16`) must explicitly choose Option A or Option B and implement the result before `npm publish` is executed.

**Checklist item: OPEN — requires P4/CP16 packaging architecture decision.**

---

## Concrete Publish Steps (Authorized After CP16)

Once the TypeScript packaging gap is resolved in CP16, the following steps execute the publication:

1. Verify npm authentication: `npm whoami` — must be authenticated to the publishing account
2. For each package in order: `cvf-core-git-for-ai` → `cvf-guard-contract` → `cvf-runtime-adapter-hub`:
   a. `cd EXTENSIONS/<package-dir>`
   b. `npm publish --access public` (for unscoped public packages)
   c. Verify: `npm view <package-name>@0.1.0 --json` returns the published metadata
3. Tag the commit on the restructuring branch: `git tag v0.1.0-publish`

These steps are NOT executed by this audit. They are authorized for execution only after CP16 closes the TypeScript packaging gap.

## Audit Result

`APPROVED`

## Consequence

`P4/CP15` closes the pre-publish checklist (3/3 items pass), delivers the version fix for all three packages, and documents the TypeScript packaging gap as the sole remaining blocker before `npm publish`. P4/CP16 must resolve this gap with an explicit packaging architecture decision.
