# CVF P4 CP16 Packaging Architecture Decision Delta — 2026-04-03

Memory class: SUMMARY_RECORD
Status: summary delta for P4/CP16 packaging architecture decision and publication authorization.

## Packet

- `P4/CP16` — packaging architecture decision for the first-wave shortlist
- Governing audit: `docs/audits/CVF_P4_CP16_PACKAGING_ARCHITECTURE_DECISION_AUDIT_2026-04-03.md`
- Governing review: `docs/reviews/CVF_GC019_P4_CP16_PACKAGING_ARCHITECTURE_DECISION_REVIEW_2026-04-03.md`

## Changes

- No source file, export map, or package.json changes.

New docs only:
- `docs/audits/CVF_P4_CP16_PACKAGING_ARCHITECTURE_DECISION_AUDIT_2026-04-03.md`
- `docs/reviews/CVF_GC019_P4_CP16_PACKAGING_ARCHITECTURE_DECISION_REVIEW_2026-04-03.md`
- `docs/baselines/CVF_P4_CP16_PACKAGING_ARCHITECTURE_DECISION_DELTA_2026-04-03.md` (this file)

## Decision

**Packaging posture for `0.1.0`: Option A — TypeScript source shipping**

- all three packages ship `.ts` source files directly
- no build step required for `0.1.0`
- consumer requirement: TypeScript compilation pipeline (Vite, Next.js, ts-node, Vitest, etc.)
- Option B (compile-to-JS) deferred to `0.2.0` pending build toolchain standardization

## Pre-Publish Gate Status — All Cleared

| Gate | Status | Resolved in |
|---|---|---|
| npm name availability | PASS | CP15 |
| CC-BY-NC-ND-4.0 license | PASS | CP12, CP15 |
| `better-sqlite3` optional | PASS | CP12, CP15 |
| Version `0.1.0` | PASS | CP15 |
| Packaging architecture | PASS | this packet |

## Publication Authorization

`npm publish` is **AUTHORIZED** for all three packages.

Execution requires: npm authentication + human trigger.

Commands (from restructuring worktree):
```bash
npm whoami
cd EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI && npm publish --access public
cd ../CVF_GUARD_CONTRACT && npm publish --access public
cd ../CVF_v1.7.3_RUNTIME_ADAPTER_HUB && npm publish --access public
npm view cvf-core-git-for-ai@0.1.0 --json
npm view cvf-guard-contract@0.1.0 --json
npm view cvf-runtime-adapter-hub@0.1.0 --json
git tag v0.1.0-publish
```

## Repo Truth After P4/CP16

| Package | Version | Packaging | npm publish status |
|---|---|---|---|
| `cvf-core-git-for-ai` | `0.1.0` | TypeScript source (Option A) | **AUTHORIZED** |
| `cvf-guard-contract` | `0.1.0` | TypeScript source (Option A) | **AUTHORIZED** |
| `cvf-runtime-adapter-hub` | `0.1.0` | TypeScript source (Option A) | **AUTHORIZED** |

## Future Path

- `0.2.0` — Option B implementation:
  - standardize all three packages on `moduleResolution: "NodeNext"` or introduce `tsup`
  - update internal imports to use `.js` extensions
  - add `build` scripts, update `main`/`types`/`exports` to reference `dist/`
  - validate compiled output before publishing

## Related Artifacts

- `docs/baselines/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_DELTA_2026-04-03.md`
- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`
