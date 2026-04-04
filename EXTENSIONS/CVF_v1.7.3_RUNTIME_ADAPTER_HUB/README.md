# CVF v1.7.3 Runtime Adapter Hub

Universal adapter layer for multi-runtime AI safety. Provides a contract-based model for attaching AI systems to execution environments with explicit capability declarations, policy-based safety enforcement, and explainability support.

## Pre-Public Status

This package is part of the CVF pre-public packaging lane. It is not yet published to a public registry. Availability outside the CVF monorepo requires a future publication decision.

## Prerequisites

- Node.js 18 or higher
- TypeScript 5 or higher

## Installation

Within the CVF monorepo, reference this package as a local workspace dependency. Public registry publication is not yet authorized.

## Usage

Default entry through the root barrel:

```ts
import {
  OpenClawAdapter,
  NaturalPolicyParser,
  ExplainabilityLayer,
  type RuntimeAdapter,
} from "cvf-runtime-adapter-hub";
```

Additional explicit subpaths:

```ts
import { ... } from "cvf-runtime-adapter-hub/contracts";
import { ... } from "cvf-runtime-adapter-hub/adapters";
import { NaturalPolicyParser } from "cvf-runtime-adapter-hub/policy";
import { ExplainabilityLayer } from "cvf-runtime-adapter-hub/explainability";
import riskMatrix from "cvf-runtime-adapter-hub/risk-models/risk-matrix";
import destructiveRules from "cvf-runtime-adapter-hub/risk-models/destructive-rules";
import externalCommRules from "cvf-runtime-adapter-hub/risk-models/external-comm-rules";
import escalationThresholds from "cvf-runtime-adapter-hub/risk-models/escalation-thresholds";
```

## Adapter Selection Guide

Choose an adapter based on the capability level your execution environment requires:

| Adapter | Capabilities | When to Use |
|---|---|---|
| `OpenClawAdapter` | Filesystem + HTTP + Shell | Full-capability environments with controlled shell access and a safety timeout |
| `PicoClawAdapter` | Filesystem only | Self-contained tools with minimal footprint and no network or shell requirements |
| `ZeroClawAdapter` | HTTP only | External API integrations or low-latency network calls without filesystem or shell access |
| `NanoAdapter` | Sandbox-delegated | Isolated container environments that delegate execution to a sandbox |
| `ReleaseEvidenceAdapter` | Filesystem | Recording and persisting release evidence artifacts |

Adapters are not interchangeable. Select based on the specific capability boundary your environment needs — do not assume a more capable adapter is always the safer choice.

## Risk Model Assets

Four JSON risk-model assets are included and explicitly named in the export map:

| Asset | Purpose |
|---|---|
| `risk-models/risk-matrix` | Base risk scoring matrix for operation types |
| `risk-models/destructive-rules` | Rules governing destructive operation risk classification |
| `risk-models/external-comm-rules` | Rules governing external communication risk classification |
| `risk-models/escalation-thresholds` | Thresholds that trigger escalation based on risk scores |

These assets are versioned with the package. Consumers should treat the schema as internal unless explicitly stabilized in a future release declaration.

## Export Map

Explicit export surface:

| Subpath | Purpose |
|---|---|
| `.` | Root barrel — primary entry point |
| `./contracts` | Typed adapter contracts and runtime interfaces |
| `./adapters` | All adapter implementations |
| `./policy` | Natural language policy parser |
| `./explainability` | Explainability layer for decision tracing |
| `./risk-models/risk-matrix` | JSON risk matrix asset |
| `./risk-models/destructive-rules` | JSON destructive-operations ruleset |
| `./risk-models/external-comm-rules` | JSON external-communication ruleset |
| `./risk-models/escalation-thresholds` | JSON escalation-threshold definitions |

## What Is NOT Included

- wildcard subpath imports beyond the named exports above
- collapsing adapters into one undifferentiated safe-default capability posture
- additional JSON asset subpaths beyond the four named risk-model files
- readiness uplift to `READY_FOR_EXPORT`
- public package publication

## Local Validation

```bash
npm run check
npm run test
```

## Support

This package is in a pre-public state. There is no public support commitment, SLA, or issue tracking surface defined at this time. Breaking changes may occur before any publication decision.

Supported first-wave surface: root barrel, all named subpaths, and the four risk-model JSON assets listed above.

Not supported in this wave: wildcard subpaths, adapter capability conflation, additional JSON assets.

## License

[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

This package is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. You are free to use and share this work with attribution, for non-commercial purposes only, and without creating derivative works. Commercial use and redistribution of modified versions are not permitted under this license.
