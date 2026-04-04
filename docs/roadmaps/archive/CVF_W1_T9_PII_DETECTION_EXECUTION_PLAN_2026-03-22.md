# CVF W1-T9 Execution Plan — AI Gateway NLP-PII Detection Slice

Memory class: SUMMARY_RECORD
> Date: `2026-03-22`
> Tranche: `W1-T9 — AI Gateway NLP-PII Detection Slice`
> Authorization: GC-018 (13/15 — AUTHORIZED)

---

## Objective

Deliver the first governed NLP-based PII detection contract. Closes W1-T4 explicit defer: "NLP-based PII detection deferred." All 3 W1-T4 defers resolved. AI Gateway → SUBSTANTIALLY DELIVERED.

---

## Consumer Path

```
GatewayPIIDetectionRequest { signal, tenantId, config? }
    ↓ GatewayPIIDetectionContract (W1-T9 CP1)
GatewayPIIDetectionResult { piiDetected, piiTypes, redactedSignal, detectionHash }
    ↓ GatewayPIIDetectionLogContract (W1-T9 CP2, Fast Lane)
GatewayPIIDetectionLog { logId, totalScanned, piiDetectedCount, cleanCount, dominantPIIType, logHash }
```

---

## Control Points

| CP | Lane | Contract | Deliverable |
|---|---|---|---|
| CP1 | Full Lane | `GatewayPIIDetectionContract` | First NLP-PII detection surface in CVF |
| CP2 | Fast Lane (GC-021) | `GatewayPIIDetectionLogContract` | Aggregation of detection results |
| CP3 | Full Lane | Tranche Closure | Governance artifact chain + AI Gateway capstone |

---

## PII Type Model

`PIIType`: `"EMAIL" | "PHONE" | "SSN" | "CREDIT_CARD" | "CUSTOM"`

Detection: pattern-based NLP scanning across all PIIType categories. `redactedSignal` replaces detected PII with `[PII_TYPE]` tokens.

---

## Package

`EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` (CPF)
Tests: +16; CPF: 164 → 180
