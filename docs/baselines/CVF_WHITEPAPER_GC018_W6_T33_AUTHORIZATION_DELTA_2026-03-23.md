# CVF Whitepaper GC-018 W6-T33 Authorization Delta

Memory class: SUMMARY_RECORD

> Date: `2026-03-23`

## Tranche

**W6-T33 — CPF Gateway PII Detection & PII Detection Log Tests Slice**
Branch: `cvf-next`
Risk: R0 (test-only, no source changes)
Lane: Full Lane (closes CPF dedicated test coverage gap for PII detection contracts)

## Scope

Provide dedicated test coverage for the CPF Gateway PII Detection pipeline — two contracts
that previously had coverage only via `index.test.ts`:

- `GatewayPIIDetectionContract` — GatewayPIIDetectionRequest → GatewayPIIDetectionResult
  (clean→piiDetected=false/piiTypes=[]/matches=[]; EMAIL→[PII_EMAIL]; PHONE→[PII_PHONE];
   SSN→[PII_SSN]; CREDIT_CARD→[PII_CC]; multiple PII types together; enabledTypes restricts
   which patterns are checked; CUSTOM pattern with customPatterns; invalid regex silently skipped;
   tenantId propagated; detectedAt=now(); detectionHash deterministic; resultId truthy; factory works)
- `GatewayPIIDetectionLogContract` — GatewayPIIDetectionResult[] → GatewayPIIDetectionLog
  (empty→dominantPIIType=null; all-clean→null; frequency-first by matchCount sum;
   tiebreak: SSN>CREDIT_CARD>EMAIL>PHONE>CUSTOM; piiDetectedCount/cleanCount/totalScanned;
   logHash deterministic; createdAt=now(); factory works)

Key behavioral notes tested:
- GatewayPIIDetectionLogContract: dominantPIIType=null when maxCount stays at 0 (strict > threshold, not >=)
- Frequency uses sum of matchCount across all results per piiType (not per-result count)

## Artifacts Delivered

| File | Change | Lines |
|---|---|---|
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/gateway.pii.detection.log.test.ts` | New — dedicated test file (GC-023 compliant) | 325 |

## GC-023 Compliance

- `gateway.pii.detection.log.test.ts`: 325 lines — under 1200 hard threshold ✓
- `tests/index.test.ts` (CPF, frozen at approved max) — untouched ✓
- `src/index.ts` (CPF) — untouched ✓

## Test Counts (Post-Delivery)

| Plane | Tests |
|---|---|
| LPF | 377 |
| GEF | 185 |
| EPF | 416 |
| CPF | 547 (+38) |
| GC  | 172 |

## Authorization

Authorized under GC-018 (Continuation Governance). Test-only — no risk to
existing contracts. Closes dedicated test coverage gap for GatewayPIIDetectionContract
and GatewayPIIDetectionLogContract (CPF contracts previously covered only via index.test.ts).
