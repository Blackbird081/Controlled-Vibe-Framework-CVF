# CVF LHW21 T2 Hard Gate Mode Advisory Connector Spec

Contract ID: `cvf.hardGateModeAdvisory.lhw21.t2.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW21 T2

GC-018: `docs/baselines/CVF_GC018_LHW21_INTEGRATION_CONNECTION_POINT_ADVISORY_WAVE_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Define a documentation-only mode distinction for future CVF connection
points. The distinction makes the current advisory behavior explicit and gives
a bounded name to a possible future enforcement posture.

## Scope / Applies To

Applies to documentation for current advisory and future proposed enforce
connection-point modes. No runtime config, MCP argument, or blocking behavior
is authorized.

## S2. Design

### Current Owner Boundary

Source: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts`

INT1 `cvf_validate_plan` evaluates plan steps and required tools against
forbidden-action patterns and a bounded plan-risk score. It returns one of:

- `ALLOW_ADVISORY`
- `REVIEW_RECOMMENDED`
- `REJECT_ADVISORY`

The current source explicitly states that this result does not block
execution and returns `runtimeExecutionAuthorized=false`.

### Doc-Only Mode Vocabulary

| `connectionPointMode` | Meaning | Runtime status in this tranche |
| --- | --- | --- |
| `advisory` | Return a governance readout to the caller; caller owns next action. | Matches current INT1 boundary |
| `enforce` | Future mode in which a connection point refuses progression for a blocking outcome. | Proposed documentation only |

## S3. Contract

```typescript
hardGateModeAdvisoryType: "cvf.hardGateModeAdvisory.lhw21.t2.v1"
hardGateModeAdvisory: {
  connectionPointMode: "advisory" | "enforce"
  currentRuntimeMode: "advisory"
  sourceTool: "cvf_validate_plan"
  runtimeExecutionAuthorized: false
  advisoryNote: string
}
```

`connectionPointMode` is a new doc-only field. It is not a runtime config key,
MCP argument, route field, or receipt field in this tranche.

## S4. Integration Guidance

- External frameworks may call `cvf_validate_plan` as an advisory connection
  point before progression.
- Consumers must not describe current INT1 behavior as a runtime hard gate.
- A future `enforce` implementation requires a separate GC-018, explicit
  operator authorization, code ownership, risk review, and live governance
  proof.
- Framework-specific adapters remain out of scope.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| INT1 plan validator exists | `index.ts` `cvf_validate_plan` lines 776-804 | PASS |
| Current plan result is advisory | `index.ts` tool description and `advisoryDecision` | PASS |
| Literal runtime false invariant exists | `index.ts` `runtimeExecutionAuthorized` line 804 | PASS |
| `connectionPointMode` exists in runtime | Changed-source review | N/A with reason: new doc-only field |
| Runtime enforcement added | Changed-file review | N/A with reason: forbidden by this tranche |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance
documentation. No public-sync export is authorized.

## Claim Boundary

This spec distinguishes advisory and proposed enforce modes for documentation
purposes only. It does not claim current runtime enforcement, blocking
behavior, route integration, framework-adapter delivery, public readiness, or
production readiness.
