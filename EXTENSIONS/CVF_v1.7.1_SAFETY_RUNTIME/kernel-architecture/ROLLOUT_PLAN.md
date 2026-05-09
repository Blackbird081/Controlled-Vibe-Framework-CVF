# Kernel Architecture Rollout Plan (Safety Runtime Submodule)

## Objective
- Activate kernel enforcement in controlled stages without disrupting current CVF runtime behavior.

## Precondition Gates
1. `npm run test:run` must pass.
2. `npm run test:golden` must pass.
3. `npm run test:coverage` must pass with:
   - global minimum `>= 80%` (statements/branches/functions/lines)
   - core branch minimum `>= 90%` (statements/branches/functions/lines)
4. `npm run test:e2e` must pass (runtime end-to-end + cvf-web integration parity).
5. `npm run bench:orchestrator` must pass (latency baseline check).

## Stage 1: Shadow Mode
1. Route runtime requests through both paths:
   - current production path
   - kernel path (`KernelRuntimeEntrypoint`)
2. Do not enforce kernel output on users yet.
3. Log decision diffs (`decisionCode`, `risk`, `policyVersion`, `traceHash`).

Exit criteria:
- No high-severity divergence in decision outcomes for 3 consecutive validation windows.

## Stage 2: Canary Enforcement
1. Enable kernel as authoritative path for a small traffic slice (for example 5%).
2. Monitor:
   - refusal rate drift
   - latency impact
   - contract violation false positives
3. Expand gradually (5% -> 20% -> 50%) if metrics remain within threshold.

Exit criteria:
- Stable metrics and no blocker incidents across all canary steps.

## Stage 3: Full Activation
1. Promote kernel path to default for all runtime requests.
2. Keep rollback switch to previous path for one release cycle.
3. Freeze policy version for the release branch and archive golden-test report.

Exit criteria:
- Full traffic served by kernel path with rollback not required.
