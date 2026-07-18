# CVF LHW21 T3 Receipt Enrichment Advisory Connector Spec

Contract ID: `cvf.receiptEnrichmentAdvisory.lhw21.t3.v1`

Memory class: POINTER_RECORD

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-31

Wave: LHW21 T3

GC-018: `docs/baselines/CVF_GC018_LHW21_INTEGRATION_CONNECTION_POINT_ADVISORY_WAVE_2026-05-31.md`

`runtimeExecutionAuthorized=false`

---

## Purpose

Section: S1

Define a documentation-only `governanceTrace` proposal for future receipt
enrichment. The proposal records enough policy-evaluation context for forensic
review while preserving the current runtime receipt unchanged.

## Scope / Applies To

Applies to a future receipt-enrichment design discussion only. No runtime
receipt type, provider route, migration, or data-capture change is authorized.

## S2. Design

### Current Receipt Baseline

Source:
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/types.ts`

`GovernanceEvidenceReceipt` currently includes these core evidence anchors:

| Current field | Current purpose |
| --- | --- |
| `receiptId` | Receipt identifier |
| `evidenceMode` | `live`, `mock`, or `static` evidence posture |
| `routeId` | Route evidence anchor |
| `decision` | Optional governance decision |
| `policySnapshotId` | Optional policy snapshot anchor |
| `generatedAt` | Receipt generation timestamp |

The current runtime type does not include `governanceTrace`.

### Proposed Forensic Trace

`governanceTrace` is a new doc-only proposal. It is intended to preserve
ordered policy-evaluation summaries without copying raw prompts, secrets, or
framework-private context.

## S3. Contract

```typescript
receiptEnrichmentAdvisoryType:
  "cvf.receiptEnrichmentAdvisory.lhw21.t3.v1"

interface GovernanceTraceEntryAdvisory {
  policyId: string
  decision: string
  parametersChecked: string[]
  constraintsApplied: string[]
}

interface GovernanceTraceReceiptExtensionAdvisory {
  governanceTrace?: GovernanceTraceEntryAdvisory[]
  runtimeExecutionAuthorized: false
}
```

`governanceTrace` is not added to `GovernanceEvidenceReceipt` in this tranche.

## S4. Integration Guidance

- Trace entries should carry bounded evaluation summaries only.
- Trace entries must not contain raw secrets, provider keys, raw prompts, or
  framework-private memory.
- Any runtime receipt extension requires a separate GC-018, schema ownership,
  migration review, tests, and live governance proof where behavior claims are
  made.
- Receipt enrichment must preserve the existing public/provenance boundary.

## S5. Verification Matrix

| Claim | Source anchor | Result |
| --- | --- | --- |
| Current receipt type exists | `ai/types.ts` `GovernanceEvidenceReceipt` lines 82-105 | PASS |
| Core receipt anchors exist | `receiptId`, `evidenceMode`, `routeId`, `decision`, `generatedAt` | PASS |
| Current type already has `governanceTrace` | Source review | N/A with reason: field is intentionally doc-only new |
| Runtime receipt type changed | Changed-file review | N/A with reason: forbidden by this tranche |
| Raw secret capture authorized | Contract review | N/A with reason: explicitly prohibited |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY - this connector spec remains in private provenance
documentation. No public-sync export is authorized.

## Claim Boundary

This spec records a bounded forensic-trace proposal only. It does not claim a
runtime receipt extension, data migration, raw-memory capture, live-provider
proof, public readiness, or production readiness.
