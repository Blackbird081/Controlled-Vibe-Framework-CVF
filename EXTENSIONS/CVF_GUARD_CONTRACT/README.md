# CVF Guard Contract

`CVF_GUARD_CONTRACT` is the current guarded-runtime shortlist candidate in the CVF pre-public export lane.

This package remains private-core only. The work here formalizes a narrower package boundary. It does not make the package `READY_FOR_EXPORT`, and it does not authorize public publication.

## Canonical Entry

Default consumption should use the root barrel:

```ts
import {
  GuardRuntimeEngine,
  createGuardEngine,
  type GuardRequestContext,
} from "cvf-guard-contract";
```

Explicit subpaths currently supported:

- `cvf-guard-contract/types`
- `cvf-guard-contract/engine`
- `cvf-guard-contract/guards/*`
- `cvf-guard-contract/runtime/agent-handoff`
- `cvf-guard-contract/runtime/agent-coordination`

## First-Wave Boundary

In scope:

- root barrel
- typed contracts
- runtime engine
- explicit guard modules
- selected runtime helpers:
  - agent handoff
  - agent coordination

Out of scope for this packet:

- provider-specific runtime integrations
- enterprise subpath promises
- SQLite-backed audit persistence as a default package contract
- release/publication automation

## Local Validation

```bash
npm run check
npm run test
```
