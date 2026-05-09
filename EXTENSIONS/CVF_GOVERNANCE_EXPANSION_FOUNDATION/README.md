# CVF Governance Expansion Foundation

Operational governance module contracts for the CVF ecosystem. Provides watchdog pulse and escalation consumer pipeline bridges with batch processing support.

## Pre-Public Status

This package is part of the CVF pre-public packaging lane (Phase B). It is not yet published to a public registry. The `exportReadiness` field in `package.json` reflects the current publication posture.

## Prerequisites

- Node.js 18 or higher
- TypeScript 5 or higher

## Installation

Within the CVF monorepo, reference this package as a local workspace dependency.

## Modules

- **WatchdogPulseConsumerPipelineContract** — contract for consuming watchdog pulse signals through a pipeline
- **WatchdogPulseConsumerPipelineBatchContract** — batch variant for processing multiple pulse signals
- **WatchdogEscalationConsumerPipelineContract** — contract for consuming watchdog escalation events
- **WatchdogEscalationConsumerPipelineBatchContract** — batch variant for processing multiple escalation events

## Export Surface

All contracts are exported from the package root:

```ts
import {
  WatchdogPulseConsumerPipelineContract,
  WatchdogEscalationConsumerPipelineContract,
} from "cvf-governance-expansion-foundation";
```

## Tests

```sh
npm test
```

625 tests, 0 failures (GEF DONE 6/6 — 2026-04-05).

## License

CC-BY-NC-ND-4.0
