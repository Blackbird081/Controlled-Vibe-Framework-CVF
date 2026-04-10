# CVF Guard Contract

Unified guard contracts, a hardened default runtime engine, and governed helpers for cross-channel governance enforcement in AI systems. Provides typed request context evaluation, pluggable guard modules, and runtime coordination helpers for agent-based workflows.

## Export Readiness

**Status**: CANDIDATE (Phase A)  
**Target Date**: 2026-05-01  
**Blockers**: None  
**Documentation**: [Export Surface Definition](../../docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md)

This package is part of the CVF pre-public packaging lane. It is not yet published to a public registry. Availability outside the CVF monorepo requires a future publication decision.

### Installation (Future)

Once published to npm:

```bash
npm install cvf-guard-contract
```

For now, reference as a local workspace dependency within the CVF monorepo.

## Prerequisites

- Node.js 18 or higher
- TypeScript 5 or higher
- Optional: `better-sqlite3` native module — only required if using SQLite-backed audit persistence (not part of the first-wave supported surface; see below)

## Installation

Within the CVF monorepo, reference this package as a local workspace dependency. Public registry publication is not yet authorized.

## Usage

Default entry through the root barrel:

```ts
import {
  GuardRuntimeEngine,
  createGuardEngine,
  type GuardRequestContext,
} from "cvf-guard-contract";
```

Additional explicit subpaths:

```ts
import type { GuardTypes } from "cvf-guard-contract/types";
import { GuardEngine } from "cvf-guard-contract/engine";
import { MyGuard } from "cvf-guard-contract/guards/my-guard";
import { agentHandoff } from "cvf-guard-contract/runtime/agent-handoff";
import { coordinateAgents } from "cvf-guard-contract/runtime/agent-coordination";
```

## Export Map

Explicit export surface:

| Subpath | Purpose |
|---|---|
| `.` | Root barrel — primary entry point |
| `./types` | Shared typed contracts and interfaces |
| `./engine` | Runtime evaluation engine |
| `./enterprise` | Team roles, approval workflow, and compliance report helpers |
| `./guards/*` | Individual guard modules |
| `./runtime/agent-handoff` | Agent handoff coordination helper |
| `./runtime/agent-coordination` | Multi-agent coordination helper |

## What Is NOT Included

- provider-specific runtime integrations (`src/runtime/providers/`)
- SQLite-backed audit persistence as a default package contract surface
- release/publication automation

## Note on `better-sqlite3`

The package includes an optional audit persistence module backed by SQLite. This capability is outside the first-wave supported surface. The `better-sqlite3` native module is declared as an optional dependency — installation will succeed without it, but SQLite audit persistence will not be available unless it is installed and the native module compiles successfully on your platform.

## Local Validation

```bash
npm run check
npm run test
```

## Support

This package is in a pre-public state. There is no public support commitment, SLA, or issue tracking surface defined at this time. Breaking changes may occur before any publication decision.

Supported first-wave surface: root barrel, typed contracts, runtime engine, enterprise helpers, explicit guard modules, agent-handoff and agent-coordination helpers.

Not supported in this wave: provider-specific runtime adapters, SQLite audit persistence.

## License

[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This package is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. You are free to use and share this work with attribution, for non-commercial purposes only, and without creating derivative works. Commercial use and redistribution of modified versions are not permitted under this license.
