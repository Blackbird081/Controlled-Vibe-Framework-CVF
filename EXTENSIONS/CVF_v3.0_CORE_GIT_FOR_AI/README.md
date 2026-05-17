# CVF v3.0 Core Git For AI

Foundation primitives for AI-assisted software development workflows. Provides typed contracts for commit lifecycle management, artifact staging and ledger tracking, development process modeling, and skill lifecycle management.

## Pre-Public Status

This package is part of the CVF pre-public packaging lane. It is not yet published to a public registry. Availability outside the CVF monorepo requires a future publication decision.

## Prerequisites

- Node.js 18 or higher
- TypeScript 5 or higher

## Installation

Within the CVF monorepo, reference this package as a local workspace dependency. Public registry publication is not yet authorized.

## Usage

Import through the root barrel only:

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

Direct subpath imports are not part of the first-wave supported surface.

## What This Package Provides

Five primitive families are available through the root barrel:

| Family | Purpose |
|---|---|
| `ai_commit/` | Commit lifecycle contracts — parsing, validation, staging |
| `artifact_staging/` | Staged artifact management before ledger commit |
| `artifact_ledger/` | Immutable artifact record and retrieval |
| `process_model/` | Development process state and transition modeling |
| `skill_lifecycle/` | Skill registration, discovery, and lifecycle tracking |

## Export Map

Explicit export surface:

- `.` → `index.ts` (root barrel — only supported entry point)

No direct subpath imports are promised for this wave.

## What Is NOT Included

- direct subpath imports (`ai_commit/`, `artifact_staging/`, etc.)
- broad repo-workflow automation beyond the five primitive families
- release automation or release-channel claims

## Local Validation

```bash
npm run check
npm run test
```

## Support

This package is in a pre-public state. There is no public support commitment, SLA, or issue tracking surface defined at this time. Breaking changes may occur before any publication decision.

Supported first-wave surface: root barrel and the five primitive families it exposes.

Not supported in this wave: direct subpath imports, workflow-level orchestration beyond these primitives.

## License

[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This package is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. You are free to use and share this work with attribution, for non-commercial purposes only, and without creating derivative works. Commercial use and redistribution of modified versions are not permitted under this license.
