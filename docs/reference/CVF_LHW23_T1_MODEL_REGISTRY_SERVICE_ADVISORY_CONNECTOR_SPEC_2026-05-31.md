# CVF LHW23 T1 Model Registry Service Advisory Connector Spec

Contract ID: `cvf.modelRegistryServiceAdvisory.lhw23.t1.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW23 T1

GC-018: `docs/baselines/CVF_GC018_LHW23_ROUTING_REGISTRY_INTELLIGENCE_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Publish a documentation-only connection-point schema for Model Registry Services.
This spec establishes an advisory mapping to align legacy model indexing definitions with active model gateway registry surfaces.

No runtime codebase, database schema, or provider capability mutation is authorized.

## Scope / Applies To

Applies to private-provenance documentation for model indexing and capabilities. No runtime model selection, metadata lookup, or live routing execution is authorized.

## S2. Design

### Legacy Model Registry Service

Source: `.private_reference/legacy/CVF_Important/ADDING_MODEL_ROUTER/CVF_MODEL_REGISTRY_SERVICE.md`

1. **Decoupled Model Selection**: Models are not queried by hardcoded strings or static conditions. Selection follows the decoupling flow:

   ```text
   Task → Required Capability → Query Model Registry → Selected Model
   ```
2. **Metadata & Capabilities Indexing**: Models declare their supported capabilities (such as code, reasoning, vision, embedding, stream) so the router can resolve compatible candidates dynamically.
3. **Dynamic Availability**: Tracks whether a model is up or down, real-time latency, and real-time cost changes.
4. **Versioning & Rollback**: Enables tracking model versions and rolling back automatically to fallback models upon failure.

## S3. Contract

The publication fields for Model Registry Service advisory are:

```typescript
modelRegistryServiceAdvisoryType:
  "cvf.modelRegistryServiceAdvisory.lhw23.t1.v1"
modelRegistrySpec: {
  models: Array<{
    id: string // Model identifier (e.g. "qwen-turbo")
    version: string // Model version tag
    provider: string // Provider name (e.g. "alibaba")
    capabilities: string[] // List of supported capabilities
    dynamicStatus: {
      isAvailable: boolean
      averageLatencyMs: number
      costPerMillionTokens: { input: number; output: number }
    }
  }>
  advisoryOnly: true
  runtimeExecutionAuthorized: false
}
```

These publication fields are not added to runtime provider or capability registries.

## S4. Integration Guidance

- Future router layers should query this registry to fetch candidate models before selecting a routing decision.
- Align candidate model capabilities with `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` and `provider-registry.ts` where existing model listings live.
- Avoid introducing hardcoded model-selection rules inside agent workflows. Enforce capability-based queries exclusively.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Legacy Model Registry Model exists | `ADDING_MODEL_ROUTER/CVF_MODEL_REGISTRY_SERVICE.md` | PASS |
| Decoupled flow Task->Capability->Registry->Model defined | `CVF_MODEL_REGISTRY_SERVICE.md` Section 3 | PASS |
| Current provider registry exists | `provider-registry.ts` `ProviderRegistry` | PASS |
| Current provider capability registry exists | `provider-capability-registry.ts` `PROVIDER_CAPABILITY_REGISTRY` | PASS |
| This tranche modifies provider or capability registries | Git diff name status | N/A with reason: documentation-only wave |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance documentation. No public-sync export is authorized.

## Claim Boundary

This spec publishes a source-verified documentation schema only. It does not claim runtime model registry storage, dynamic latency checking, model fallback execution, public readiness, or production readiness.
