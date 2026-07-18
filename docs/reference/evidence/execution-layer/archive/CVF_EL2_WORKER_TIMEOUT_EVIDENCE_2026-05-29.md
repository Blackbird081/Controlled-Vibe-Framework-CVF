# CVF EL-2 WorkerTimeout Handler — Evidence Packet

Memory class: FULL_RECORD

Status: EVIDENCE

docType: evidence

Date: 2026-05-29

Evidence mode: bounded_test_proof

---

## Purpose

Evidence packet for EL-2 WorkerTimeout Handler. Documents handler behavior:
timeout detection → sandbox cleanup → re-dispatch → escalation after max retries.

## Handler Contract

- **Contract version:** `cvf.pipelineChainOrchestrator.el2.v1`
- **Source:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/pipeline-chain-orchestrator.ts` — `handleWorkerTimeout()`
- **Diagnostic classes:** `worker_timeout`, `worker_timeout_recovered`

## Handler Behavior

### Recovery Path (retry 1–2)

```
Worker Execute timeout at T+300s
  → handleWorkerTimeout(state)
    → retryCount = 1
    → canRetry = true (1 <= 2)
  → diagnostic: worker_timeout_recovered
  → nextAction: retry
  → Sandbox cleared, worker re-dispatched
```

### Recovery Path (retry 2)

```
Worker Execute timeout again
  → handleWorkerTimeout(state with workerRetryCount=1)
    → retryCount = 2
    → canRetry = true (2 <= 2)
  → diagnostic: worker_timeout_recovered
  → nextAction: retry
  → Sandbox cleared, worker re-dispatched (final retry)
```

### Escalation Path (retry 3 — MAX_EXCEEDED)

```
Worker Execute timeout third time
  → handleWorkerTimeout(state with workerRetryCount=2)
    → retryCount = 3
    → canRetry = false (3 > 2)
  → diagnostic: worker_timeout
  → nextAction: escalate
  → escalateToOrchestrator: true
  → HumanInterventionRequired signal emitted
```

## Test Evidence

4 handler tests verified:

| Test | Result |
| --- | --- |
| Recovery on retry 1 | PASS — recovered=true, retryCount=1, class=worker_timeout_recovered |
| Recovery on retry 2 (max) | PASS — recovered=true, retryCount=2 |
| Escalation on retry 3 | PASS — recovered=false, retryCount=3, class=worker_timeout, escalateToOrchestrator=true |
| MAX_RETRIES constant = 2 | PASS |

## Boundary

This evidence packet documents the EL-2 handler contract and bounded test
behavior. It does not claim:
- Live provider timeout (full pipeline not yet wired at EL-1 contract stage)
- All-provider timeout handling
- Production timeout resilience
- Real sandbox cleanup execution

The EL-2 handler is ready for pipeline integration when EL-1 pipeline runtime
wiring proceeds.

## Receipt

- **Diagnostic class:** `worker_timeout` / `worker_timeout_recovered`
- **Retry max:** 2 (`WORKER_TIMEOUT_MAX_RETRIES`)
- **Timeout threshold:** 300,000ms (`WORKER_TIMEOUT_DEFAULT_MS`)
- **rawSecretPrinted:** false
