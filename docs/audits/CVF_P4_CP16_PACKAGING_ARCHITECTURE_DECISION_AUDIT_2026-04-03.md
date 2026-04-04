# CVF P4 CP16 Packaging Architecture Decision Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved packaging architecture decision — Option A (TypeScript source shipping) for 0.1.0; npm publish authorization granted.

## Scope

- choose Option A (TypeScript source) or Option B (compile-to-JS) for the `0.1.0` release
- document consumer requirements for the chosen option
- grant publication authorization for `npm publish`

## Source Truth Reviewed

- `docs/baselines/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_DELTA_2026-04-03.md`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/tsconfig.json`
- `EXTENSIONS/CVF_GUARD_CONTRACT/tsconfig.json`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/tsconfig.json`

## Option Evaluation

### Option A — Ship TypeScript source (current state)

All three packages export `.ts` source files directly. `main` and `types` fields point to TypeScript source. No build step required.

Consumer environment requirement: the consumer must use a build pipeline or runtime that can process `.ts` imports. This includes:
- Vite, Next.js, Astro, or any Webpack-based bundler with TypeScript loader
- `ts-node`, `tsx`, or `bun` for Node.js scripting
- Vitest or ts-jest for test environments
- `tsup`, `esbuild`, or `rollup` with TypeScript plugin for library builds

TypeScript module resolution `"bundler"` in the consumer `tsconfig` is compatible with this approach.

For TypeScript type-checking: the `types` field in each `package.json` points to a `.ts` source file. TypeScript follows this correctly — the source IS valid as a types entry point.

**Assessment:** correct for the initial `0.x` pre-stability release targeting TypeScript integrators in bundler environments. Not suitable for plain Node.js consumers without a TypeScript loader.

### Option B — Compile to JavaScript

All three tsconfigs declare `outDir: "dist"` and `declaration: true`, which would produce compiled `.js` + `.d.ts` output. However, two of the three packages (`cvf-core-git-for-ai` and `cvf-guard-contract`) use `moduleResolution: "bundler"`, which is designed for bundler environments and does not produce ESM-compatible import paths for standalone `tsc` output. In ESM, `import { foo } from './foo'` fails in Node.js — imports require explicit `.js` extensions. Fixing this requires either:
- Migrating all three packages to `moduleResolution: "NodeNext"` and updating all internal imports to use `.js` extensions
- Or introducing a bundler toolchain (`tsup`, `esbuild`) that handles extension resolution

Neither change can be completed safely in a single bounded CP without running builds and verifying output across all three packages. `cvf-runtime-adapter-hub` already uses `moduleResolution: "NodeNext"` but the other two do not.

**Assessment:** requires non-trivial build toolchain standardization. Deferred to `0.2.0`.

## Decision

**Selected: Option A — Ship TypeScript source for `0.1.0`.**

Rationale:
1. `moduleResolution: "bundler"` across two of three packages signals intentional design for bundler environments, not standalone Node.js
2. Target consumer profile (TypeScript integrators using Vite, Next.js, Vitest, or similar) is fully compatible with TypeScript source shipping
3. Option B requires cross-package build toolchain migration that cannot be safely validated in a single bounded packet
4. `0.x` pre-stability versioning explicitly permits consumer setup requirements
5. `CC-BY-NC-ND-4.0` license and pre-public positioning targets sophisticated technical integrators, not casual npm consumers

Future `0.2.0` path to Option B:
- standardize all three packages on `moduleResolution: "NodeNext"` or introduce `tsup`
- update internal imports to use explicit `.js` extensions
- update `package.json` fields to reference `dist/` output
- add `build` scripts and validate compiled output

## Consumer Requirements for Option A

Consumers of the three packages must have:

- TypeScript 5 or higher
- A build pipeline or runtime that processes `.ts` imports natively:
  - **Bundler environments**: Vite, Next.js, Astro, Webpack with `ts-loader` or `babel-loader`
  - **Node.js runtimes**: `ts-node`, `tsx`, `bun`
  - **Test environments**: Vitest, ts-jest
  - **Library bundlers**: `tsup`, `esbuild`, `rollup` with TypeScript plugin
- `"moduleResolution": "bundler"` or equivalent in consumer `tsconfig` is recommended

Not suitable for:
- Plain Node.js without a TypeScript loader
- CommonJS environments without a TypeScript compilation step

These requirements are already implied by the `Prerequisites` sections in all three READMEs ("TypeScript 5 or higher"). No README changes required.

## Publication Authorization

All pre-publish gates are now cleared:

| Gate | Status |
|---|---|
| npm name availability | PASS (CP15) |
| CC-BY-NC-ND-4.0 license | PASS (CP12, CP15) |
| `better-sqlite3` optional | PASS (CP12, CP15) |
| Version set to `0.1.0` | PASS (CP15) |
| Packaging architecture decision | PASS (this packet — Option A) |

**`npm publish` is authorized for all three packages.**

Execution steps (from the restructuring worktree):

```bash
# Authenticate
npm whoami  # must show the publishing account

# Publish each package
cd EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI && npm publish --access public
cd ../CVF_GUARD_CONTRACT && npm publish --access public
cd ../CVF_v1.7.3_RUNTIME_ADAPTER_HUB && npm publish --access public

# Verify
npm view cvf-core-git-for-ai@0.1.0 --json
npm view cvf-guard-contract@0.1.0 --json
npm view cvf-runtime-adapter-hub@0.1.0 --json

# Tag
git tag v0.1.0-publish
```

These steps are ready for execution. **The agent does not execute `npm publish` — this requires explicit human authorization and npm authentication credentials.**

## Audit Result

`APPROVED`

## Consequence

`P4/CP16` closes the packaging architecture decision lane. Option A is the `0.1.0` packaging posture. `npm publish` is authorized. Execution requires human authentication and explicit triggering. Option B is the documented path for `0.2.0`.
