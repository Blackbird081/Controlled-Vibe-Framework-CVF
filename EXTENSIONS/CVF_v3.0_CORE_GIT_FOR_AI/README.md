# CVF v3.0 Core Git For AI

`CVF_v3.0_CORE_GIT_FOR_AI` is the current first-wave packaging implementation candidate for the CVF pre-public export lane.

This package remains inside the private core. The boundary work here formalizes a smaller, root-barrel-first package surface. It does not mean the module is `READY_FOR_EXPORT`, and it does not authorize package publication.

## Canonical Public Entry

Use the root barrel only:

```ts
import {
  parseCommit,
  validateCommit,
  ArtifactStagingArea,
  ArtifactLedger,
  ProcessModel,
  SkillRegistry,
} from "cvf-core-git-for-ai";
```

Current explicit package export map:

- `.` -> `index.ts`

## Primitive Families Included Behind The Root Barrel

- `ai_commit/`
- `artifact_staging/`
- `artifact_ledger/`
- `process_model/`
- `skill_lifecycle/`

These families are intentionally shipped as package contents because the root barrel depends on them, but they are not yet promised as stable direct subpath imports.

## Non-Goals For This Packet

- no `READY_FOR_EXPORT` uplift
- no public package publication
- no extra subpath exports
- no broad repo-workflow promises outside the five primitive families

## Local Validation

```bash
npm run check
npm run test
```
