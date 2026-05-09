# CVF Learning Plane Foundation

Learning-plane contracts for the CVF ecosystem. Provides evaluation engine, truth scoring, pattern detection, and feedback ledger consumer pipeline bridges with batch processing support.

## Pre-Public Status

This package is part of the CVF pre-public packaging lane (Phase B). It is not yet published to a public registry. The `exportReadiness` field in `package.json` reflects the current publication posture.

## Prerequisites

- Node.js 18 or higher
- TypeScript 5 or higher

## Installation

Within the CVF monorepo, reference this package as a local workspace dependency.

## Modules

- **EvaluationEngineConsumerPipelineContract** — contract for consuming evaluation engine results
- **EvaluationEngineConsumerPipelineBatchContract** — batch variant for processing multiple evaluations
- **TruthScoreConsumerPipelineContract** — contract for consuming truth score assessments
- **TruthScoreConsumerPipelineBatchContract** — batch variant for processing multiple truth scores
- Additional learning-plane consumer pipeline contracts (pattern detection, feedback ledger, and more)

## Export Surface

All contracts are exported from the package root:

```ts
import {
  EvaluationEngineConsumerPipelineContract,
  TruthScoreConsumerPipelineContract,
} from "cvf-learning-plane-foundation";
```

## Tests

```sh
npm test
```

1465 tests, 0 failures (LPF DONE-ready 7/7 — 2026-04-07).

## License

CC-BY-NC-ND-4.0
