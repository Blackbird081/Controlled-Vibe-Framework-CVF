# CVF v1.7.3 Runtime Adapter Hub

`CVF_v1.7.3_RUNTIME_ADAPTER_HUB` is the third shortlisted export candidate in the CVF pre-public packaging lane.

This package remains private-core only. The work here formalizes a canonical root entrypoint and explicit export map for the first-wave boundary. It does not make the package `READY_FOR_EXPORT`, and it does not authorize public publication.

## Canonical Entry

Default consumption should use the root barrel:

```ts
import {
  OpenClawAdapter,
  NaturalPolicyParser,
  ExplainabilityLayer,
  type RuntimeAdapter,
} from "cvf-runtime-adapter-hub";
```

Explicit subpaths currently supported:

- `cvf-runtime-adapter-hub/contracts`
- `cvf-runtime-adapter-hub/adapters`
- `cvf-runtime-adapter-hub/policy`
- `cvf-runtime-adapter-hub/explainability`
- `cvf-runtime-adapter-hub/risk-models/risk-matrix`
- `cvf-runtime-adapter-hub/risk-models/destructive-rules`
- `cvf-runtime-adapter-hub/risk-models/external-comm-rules`
- `cvf-runtime-adapter-hub/risk-models/escalation-thresholds`

## First-Wave Boundary

In scope:

- `contracts/`
- `adapters/`
- `policy/`
- `explainability/`
- named `risk_models/*.json` assets

Out of scope for this packet:

- widening to additional subpaths
- collapsing adapter capability levels into one generic “safe default” claim
- readiness uplift to `READY_FOR_EXPORT`
- public package publication

## Local Validation

```bash
npm run check
npm run test
```
