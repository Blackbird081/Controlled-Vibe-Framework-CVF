# CVF Fast Lane Audit — W73-T2: KnowledgeMaintenanceContract

Memory class: SUMMARY_RECORD

> Decision type: `Fast Lane` additive implementation wave
> Date: 2026-04-14
> Tranche: W73-T2
> Authority: operator authorization `CVF_GC018_W73_T2_KNOWLEDGE_MAINTENANCE_CONTRACT_AUTHORIZATION_2026-04-14.md`
> Intake: `CVF_KNOWLEDGE_COMPILATION_LIFECYCLE_POLICY_2026-04-14.md` §3 Step 5, `CVF_KNOWLEDGE_MAINTENANCE_AND_REFACTOR_OWNER_MAP_2026-04-14.md`

---

## 1. Change Summary

Implement `KnowledgeMaintenanceContract` + `KnowledgeMaintenanceBatchContract` in the CPF
Knowledge Layer. This is Step 5 (`Maintain`) of the 6-step knowledge compilation lifecycle.

**New contracts:**

| Contract | Method | Description |
|---|---|---|
| `KnowledgeMaintenanceContract` | `evaluate(request)` | Evaluates a governed artifact and emits quality signal events |
| `KnowledgeMaintenanceBatchContract` | `batch(requests[])` | Batch wrapper |

**New types:**

| Type | Role |
|---|---|
| `KnowledgeMaintenanceSignalType` | `"lint" \| "contradiction" \| "drift" \| "orphan" \| "staleness"` |
| `KnowledgeMaintenanceSignal` | One quality signal with deterministic `signalHash` and time-variant `signalId` |
| `KnowledgeMaintenanceCheck` (discriminated union) | Per-check input: lint/contradiction/drift/orphan/staleness |
| `KnowledgeMaintenanceRequest` | artifact (must be approved) + checks[] |
| `KnowledgeMaintenanceResult` | artifactId, evaluatedAt, signals[], totalSignals, hasIssues, resultHash |
| `KnowledgeMaintenanceBatch` | batchId, batchHash, createdAt, totalEvaluated, results[] |

**Check semantics:**
- `lint`: scans artifact `content` for declared required keywords; emits signal for each missing keyword
- `contradiction`: emits a signal for each declared conflicting artifact ID (externally supplied)
- `drift`: emits signal if raw source `sourceLastModifiedAt` > artifact `compiledAt`
- `orphan`: emits signal for each artifact `sourceId` not found in `activeSourceIds`
- `staleness`: emits signal if artifact `compiledAt` is older than `maxAgeDays` relative to evaluation time

**Validation:** `evaluate()` throws if `artifact.governanceStatus !== "approved"`.

**Hash design:**
- `signalHash` = content-bound (no time)
- `signalId` = `signalHash + detectedAt` (time-variant)
- `resultHash` = bound to `artifactId + evaluatedAt + signalHashes`

---

## 2. Risk Classification

**Risk Level: R0 (Safe)**
- Purely additive — 2 new source files, 2 new test files, 2 barrel lines
- No existing contract modified
- No guard touched
- GC-023: both source files < 200 lines; both test files < 300 lines

---

## 3. Fast Lane Eligibility

| Criterion | Status |
|---|---|
| Pure additive | PASS |
| No guard touched | PASS |
| No breaking type change | PASS |
| GC-023 within limits | PASS |
| Lifecycle policy Step 5 on file | PASS |
| Owner map routing (Learning Plane) explicit | PASS — owner map says signals feed `FeedbackLedger → PatternInsight → TruthModel`; this contract only emits signals, does not modify the ledger |

**Fast Lane Approved.**

---

**Audit Status: APPROVED**
