# CVF W2-T2 Execution Dispatch Bridge — Execution Plan

Memory class: SUMMARY_RECORD

> Date: `2026-03-22`
> Tranche: `W2-T2 — Execution Dispatch Bridge`
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W2_T2_2026-03-22.md`
> Host package: `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION`

---

## Baseline

- Control Plane Foundation: 82 tests passing (post W1-T3)
- Execution Plane Foundation: 12 tests passing (post W2-T1)
- Source contracts from W1-T3: `OrchestrationContract`, `DesignConsumerContract`
- Source infrastructure from W2-T1: `GuardRuntimeEngine`, policy surface, authorization boundary

## Control Point Sequence

### CP1 — Dispatch Contract Baseline (Full Lane)

**Deliverable:** `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/dispatch.contract.ts`

**Contract:** `DispatchContract.dispatch(assignments: TaskAssignment[]): DispatchResult`

**Logic:**
1. For each `TaskAssignment`, map to `GuardRequestContext`:
   - `assignmentId` → `requestId`
   - `targetPhase` → `phase` (direct: BUILD/DESIGN/REVIEW)
   - `riskLevel` → `riskLevel` (direct: R0/R1/R2/R3)
   - `assignedRole` → `role` (orchestrator/architect/builder → AI_AGENT; reviewer → REVIEWER)
   - `title` → `action`
   - `scopeConstraints.join('; ')` → `scope`
   - `executionAuthorizationHash` → `traceHash`
2. Run each through `GuardRuntimeEngine.evaluate()`
3. Collect `DispatchEntry` per task: `guardDecision`, `pipelineResult`, `dispatchAuthorized`, `blockedBy`, `escalatedBy`
4. Compute aggregate `DispatchResult` with counts and `dispatchHash`

**Target tests:** 10 (ALLOW path, BLOCK path, ESCALATE path, empty assignments, R3 high-risk, mixed decisions, hash stability, warnings, counts, full orchestration result dispatch)

**Governance:** Full Lane — new contract baseline establishing dispatch-phase pattern

---

### CP2 — Policy Gate Contract (Fast Lane)

**Deliverable:** `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/policy.gate.contract.ts`

**Contract:** `PolicyGateContract.evaluate(dispatchResult: DispatchResult): PolicyGateResult`

**Logic:**
1. For each `DispatchEntry`, derive policy gate decision:
   - ALLOW + R0/R1 → `allow`
   - ALLOW + R2 → `review`
   - ALLOW + R3 → `sandbox`
   - BLOCK → `deny`
   - ESCALATE → `review`
2. Build `PolicyGateEntry` per task with rationale string
3. Compute aggregate `PolicyGateResult` with counts and `gateHash`

**Target tests:** 8 (allow path, deny path, review path, sandbox path, mixed, empty, hash stability, rationale strings)

**Governance:** Fast Lane — additive contract inside authorized tranche, no boundary changes

---

### CP3 — Execution Bridge Consumer Contract (Fast Lane)

**Deliverable:** `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/execution.bridge.consumer.contract.ts`

**Contract:** `ExecutionBridgeConsumerContract.bridge(receipt: DesignConsumptionReceipt): ExecutionBridgeReceipt`

**Logic:**
1. Extract `orchestrationResult.assignments` from `DesignConsumptionReceipt`
2. Run through `DispatchContract.dispatch()` → `DispatchResult`
3. Run through `PolicyGateContract.evaluate()` → `PolicyGateResult`
4. Build `ExecutionBridgePipelineStageEntry[]` for traceability
5. Compute `ExecutionBridgeReceipt` with full cross-plane evidence hash

**Proves:** INTAKE → DESIGN → ORCHESTRATION → DISPATCH → POLICY GATE

**Target tests:** 9 (full path, empty orchestration, R3 assignments blocked, all allowed, all denied, pipeline stages structure, evidence hash stability, warnings propagated, receipt ID format)

**Governance:** Fast Lane — additive consumer path inside authorized tranche

---

### CP4 — Tranche Closure Review (Full Lane)

**Deliverables:**
- `docs/audits/CVF_W2_T2_CP4_TRANCHE_CLOSURE_AUDIT_2026-03-22.md`
- `docs/reviews/CVF_GC019_W2_T2_CP4_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `docs/baselines/CVF_W2_T2_CP4_TRANCHE_CLOSURE_DELTA_2026-03-22.md`
- `docs/reviews/CVF_W2_T2_EXECUTION_DISPATCH_BRIDGE_TRANCHE_CLOSURE_REVIEW_2026-03-22.md`
- `docs/baselines/CVF_W2_T2_EXECUTION_DISPATCH_BRIDGE_TRANCHE_CLOSURE_DELTA_2026-03-22.md`

**Governance:** Full Lane — tranche state change

---

## Risk Controls

- CP1: keep `DispatchContract` to guard evaluation only — no actual task invocation
- CP2: policy gate must not re-run the guard engine — compose over CP1 result
- CP3: import `DesignConsumptionReceipt` type only — no runtime coupling to control plane
- Every CP: run full test suite before proceeding to next CP

## Target Test Delta

| Package | Before | After | Delta |
|---|---|---|---|
| CVF_CONTROL_PLANE_FOUNDATION | 82 | 82 | 0 (unchanged) |
| CVF_EXECUTION_PLANE_FOUNDATION | 12 | ~39 | +27 |
| **Total** | **94** | **~121** | **+27** |
