import { describe, expect, it } from "vitest";
import {
  createDeterministicClock,
  detectTimeout,
  recordHeartbeat,
  isHeartbeatStale,
  createCancelTracker,
  requestCancel,
  acceptCancel,
  mayStartNewChild,
  classifyRetry,
  createIdempotencyGuard,
  classifyOrphan,
  MaoLifecycleController,
} from "../src/mao/lifecycle.controller.contract";
import type {
  MaoDeterministicClock,
  MaoCancelTracker,
  MaoAttemptRecord,
} from "../src/mao/lifecycle.controller.contract";
import type { MaoDiagnosticClass } from "../src/mao/delegation.adapter.contract";

const T0 = "2026-07-11T00:00:00.000Z";

// ===========================================================================
// 1. Deterministic clock
// ===========================================================================

describe("createDeterministicClock", () => {
  it("starts at the given ISO time", () => {
    const clock = createDeterministicClock(T0);
    expect(clock.now()).toBe(T0);
  });

  it("elapsedMs returns 0 at start", () => {
    const clock = createDeterministicClock(T0);
    expect(clock.elapsedMs(T0)).toBe(0);
  });

  it("advance moves the clock forward", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(5000);
    expect(clock.elapsedMs(T0)).toBe(5000);
  });

  it("multiple advances accumulate", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(1000);
    clock.advance(2000);
    expect(clock.elapsedMs(T0)).toBe(3000);
  });

  it("now returns updated ISO string after advance", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(60000);
    expect(clock.now()).toBe("2026-07-11T00:01:00.000Z");
  });

  it("elapsedMs between two points in time is correct", () => {
    const clock = createDeterministicClock(T0);
    const t1 = clock.now();
    clock.advance(10000);
    expect(clock.elapsedMs(t1)).toBe(10000);
  });
});

// ===========================================================================
// 2. Timeout detection
// ===========================================================================

describe("detectTimeout", () => {
  it("does not time out when under ceiling", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(4000);
    const result = detectTimeout(T0, 5000, clock);
    expect(result.timedOut).toBe(false);
  });

  it("times out when elapsed exceeds ceiling", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(6000);
    const result = detectTimeout(T0, 5000, clock);
    expect(result.timedOut).toBe(true);
    if (result.timedOut) {
      expect(result.elapsedMs).toBe(6000);
      expect(result.ceilingMs).toBe(5000);
    }
  });

  it("never times out when ceiling is null", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(999999);
    const result = detectTimeout(T0, null, clock);
    expect(result.timedOut).toBe(false);
  });

  it("exactly at ceiling is not timed out", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(5000);
    const result = detectTimeout(T0, 5000, clock);
    expect(result.timedOut).toBe(false);
  });
});

// ===========================================================================
// 3. Heartbeat
// ===========================================================================

describe("recordHeartbeat", () => {
  it("records livenessOnly as true always", () => {
    const clock = createDeterministicClock(T0);
    const hb = recordHeartbeat("t1", clock);
    expect(hb.livenessOnly).toBe(true);
    expect(hb.taskId).toBe("t1");
  });

  it("uses the current clock time", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(1000);
    const hb = recordHeartbeat("t1", clock);
    expect(hb.lastHeartbeatAt).toBe(clock.now());
  });
});

describe("isHeartbeatStale", () => {
  it("null record is always stale", () => {
    const clock = createDeterministicClock(T0);
    expect(isHeartbeatStale(null, 5000, clock)).toBe(true);
  });

  it("recent heartbeat is not stale", () => {
    const clock = createDeterministicClock(T0);
    const hb = recordHeartbeat("t1", clock);
    clock.advance(1000);
    expect(isHeartbeatStale(hb, 5000, clock)).toBe(false);
  });

  it("stale when elapsed exceeds maxSilenceMs", () => {
    const clock = createDeterministicClock(T0);
    const hb = recordHeartbeat("t1", clock);
    clock.advance(6000);
    expect(isHeartbeatStale(hb, 5000, clock)).toBe(true);
  });

  it("exactly at silence limit is not stale", () => {
    const clock = createDeterministicClock(T0);
    const hb = recordHeartbeat("t1", clock);
    clock.advance(5000);
    expect(isHeartbeatStale(hb, 5000, clock)).toBe(false);
  });
});

// ===========================================================================
// 4. Cancel
// ===========================================================================

describe("cancel tracker", () => {
  it("starts in NONE state", () => {
    const t = createCancelTracker("t1");
    expect(t.state).toBe("NONE");
    expect(t.blocksNewChildren).toBe(false);
  });

  it("requestCancel transitions NONE -> REQUESTED", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const r = requestCancel(t, clock);
    expect(r.state).toBe("REQUESTED");
    expect(r.blocksNewChildren).toBe(true);
    expect(r.requestedAt).toBe(T0);
  });

  it("requestCancel is idempotent after first request", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const r1 = requestCancel(t, clock);
    clock.advance(1000);
    const r2 = requestCancel(r1, clock);
    expect(r2.state).toBe("REQUESTED");
    expect(r2.requestedAt).toBe(T0); // unchanged
  });

  it("acceptCancel transitions REQUESTED -> ACCEPTED", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const r = requestCancel(t, clock);
    const a = acceptCancel(r, clock);
    expect(a.state).toBe("ACCEPTED");
    expect(a.blocksNewChildren).toBe(true);
    expect(a.acceptedAt).toBe(T0);
  });

  it("acceptCancel on NONE does nothing", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const a = acceptCancel(t, clock);
    expect(a.state).toBe("NONE");
  });

  it("acceptCancel on already ACCEPTED does nothing", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const r = requestCancel(t, clock);
    const a1 = acceptCancel(r, clock);
    clock.advance(1000);
    const a2 = acceptCancel(a1, clock);
    expect(a2.state).toBe("ACCEPTED");
    expect(a2.acceptedAt).toBe(T0); // unchanged
  });

  it("mayStartNewChild returns false after cancel request", () => {
    const clock = createDeterministicClock(T0);
    const t = createCancelTracker("t1");
    const r = requestCancel(t, clock);
    expect(mayStartNewChild(r)).toBe(false);
  });

  it("mayStartNewChild returns true before cancel", () => {
    const t = createCancelTracker("t1");
    expect(mayStartNewChild(t)).toBe(true);
  });
});

// ===========================================================================
// 5. Retry classification
// ===========================================================================

describe("classifyRetry", () => {
  it("RETRYABLE_TRANSPORT_INTERRUPTION is retryable", () => {
    expect(classifyRetry("RETRYABLE_TRANSPORT_INTERRUPTION")).toBe("RETRYABLE");
  });

  it("RETRYABLE_PROVIDER_TRANSIENT is retryable", () => {
    expect(classifyRetry("RETRYABLE_PROVIDER_TRANSIENT")).toBe("RETRYABLE");
  });

  it("RETRYABLE_SAFE_TIMEOUT is retryable", () => {
    expect(classifyRetry("RETRYABLE_SAFE_TIMEOUT")).toBe("RETRYABLE");
  });

  it("NON_RETRYABLE_AUTHORITY_REJECTION is non-retryable", () => {
    expect(classifyRetry("NON_RETRYABLE_AUTHORITY_REJECTION")).toBe("NON_RETRYABLE");
  });

  it("NON_RETRYABLE_APPROVAL_DENIAL is non-retryable", () => {
    expect(classifyRetry("NON_RETRYABLE_APPROVAL_DENIAL")).toBe("NON_RETRYABLE");
  });

  it("NON_RETRYABLE_INVALID_OUTPUT is non-retryable", () => {
    expect(classifyRetry("NON_RETRYABLE_INVALID_OUTPUT")).toBe("NON_RETRYABLE");
  });

  it("NON_RETRYABLE_SCOPE_BREACH is non-retryable", () => {
    expect(classifyRetry("NON_RETRYABLE_SCOPE_BREACH")).toBe("NON_RETRYABLE");
  });

  it("NON_RETRYABLE_AMBIGUOUS_SIDE_EFFECT is non-retryable", () => {
    expect(classifyRetry("NON_RETRYABLE_AMBIGUOUS_SIDE_EFFECT")).toBe("NON_RETRYABLE");
  });
});

// ===========================================================================
// 6. Duplicate protection
// ===========================================================================

describe("createIdempotencyGuard", () => {
  it("initially nothing is seen", () => {
    const guard = createIdempotencyGuard();
    expect(guard.seen("key-1")).toBe(false);
  });

  it("records and detects a seen key", () => {
    const guard = createIdempotencyGuard();
    guard.record("key-1");
    expect(guard.seen("key-1")).toBe(true);
  });

  it("different keys are independent", () => {
    const guard = createIdempotencyGuard();
    guard.record("key-1");
    expect(guard.seen("key-2")).toBe(false);
  });

  it("recording twice does not fail", () => {
    const guard = createIdempotencyGuard();
    guard.record("key-1");
    guard.record("key-1");
    expect(guard.seen("key-1")).toBe(true);
  });

  it("atomically allows only the first claim", () => {
    const guard = createIdempotencyGuard();
    expect(guard.claim("key-1")).toBe(true);
    expect(guard.claim("key-1")).toBe(false);
  });

  it("rejects an empty atomic claim", () => {
    const guard = createIdempotencyGuard();
    expect(guard.claim("   ")).toBe(false);
  });
});

// ===========================================================================
// 7. Orphan recovery
// ===========================================================================

function makeAttempt(overrides: Partial<MaoAttemptRecord> = {}): MaoAttemptRecord {
  return {
    attemptId: "att-1",
    taskId: "t1",
    startedAt: T0,
    completedAt: null,
    diagnosticClass: null,
    lastHeartbeatAt: null,
    ...overrides,
  };
}

describe("classifyOrphan", () => {
  it("completed attempt is ESCALATE (should not be scanned)", () => {
    const clock = createDeterministicClock(T0);
    const attempt = makeAttempt({ completedAt: "2026-07-11T00:00:01.000Z" });
    expect(classifyOrphan(attempt, 5000, clock)).toBe("ESCALATE");
  });

  it("recent attempt without heartbeat is RESUMABLE", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(1000);
    const attempt = makeAttempt();
    expect(classifyOrphan(attempt, 5000, clock)).toBe("RESUMABLE");
  });

  it("stale attempt with retryable diagnostic is SAFE_RETRY", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(6000);
    const attempt = makeAttempt({
      diagnosticClass: "RETRYABLE_TRANSPORT_INTERRUPTION",
    });
    expect(classifyOrphan(attempt, 5000, clock)).toBe("SAFE_RETRY");
  });

  it("stale attempt with non-retryable diagnostic is ESCALATE", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(6000);
    const attempt = makeAttempt({
      diagnosticClass: "NON_RETRYABLE_AUTHORITY_REJECTION",
    });
    expect(classifyOrphan(attempt, 5000, clock)).toBe("ESCALATE");
  });

  it("stale attempt without diagnostic is ESCALATE", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(6000);
    const attempt = makeAttempt({ diagnosticClass: null });
    expect(classifyOrphan(attempt, 5000, clock)).toBe("ESCALATE");
  });

  it("uses heartbeat as signal when available", () => {
    const clock = createDeterministicClock(T0);
    const attempt = makeAttempt({
      lastHeartbeatAt: "2026-07-11T00:00:01.000Z",
      diagnosticClass: "RETRYABLE_SAFE_TIMEOUT",
    });
    // startedAt is T0 but heartbeat is 1s later; advance 6s from T0 = 5s from heartbeat
    clock.advance(6000);
    // 6000ms elapsed from T0, but only 5000ms elapsed from heartbeat at 1s
    // exactly at limit: not stale
    expect(classifyOrphan(attempt, 5000, clock)).toBe("RESUMABLE");

    // advance past the silence window from heartbeat
    clock.advance(100);
    expect(classifyOrphan(attempt, 5000, clock)).toBe("SAFE_RETRY");
  });

  it("recent heartbeat keeps attempt RESUMABLE", () => {
    const clock = createDeterministicClock(T0);
    clock.advance(2000);
    const attempt = makeAttempt({
      lastHeartbeatAt: clock.now(),
      diagnosticClass: "RETRYABLE_SAFE_TIMEOUT",
    });
    clock.advance(1000);
    expect(classifyOrphan(attempt, 5000, clock)).toBe("RESUMABLE");
  });
});

// ===========================================================================
// 8. Lifecycle controller (aggregate)
// ===========================================================================

describe("MaoLifecycleController", () => {
  it("constructs with a deterministic clock at the given time", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.clock.now()).toBe(T0);
  });

  it("checkTimeout delegates to detectTimeout", () => {
    const ctrl = new MaoLifecycleController(T0);
    ctrl.advanceClock(6000);
    const result = ctrl.checkTimeout(T0, 5000);
    expect(result.timedOut).toBe(true);
  });

  it("heartbeat records and can be checked for staleness", () => {
    const ctrl = new MaoLifecycleController(T0);
    ctrl.heartbeat("t1");
    expect(ctrl.isHeartbeatStale("t1", 5000)).toBe(false);

    ctrl.advanceClock(6000);
    expect(ctrl.isHeartbeatStale("t1", 5000)).toBe(true);
  });

  it("task without heartbeat is always stale", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.isHeartbeatStale("never-beat", 5000)).toBe(true);
  });

  it("full cancel lifecycle: request -> accept -> blocks children", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.mayStartNewChild("t1")).toBe(true);

    ctrl.requestCancel("t1");
    expect(ctrl.mayStartNewChild("t1")).toBe(false);
    expect(ctrl.getCancelTracker("t1").state).toBe("REQUESTED");

    ctrl.acceptCancel("t1");
    expect(ctrl.getCancelTracker("t1").state).toBe("ACCEPTED");
  });

  it("duplicate detection works through controller", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.isDuplicate("key-1")).toBe(false);
    ctrl.recordInvocation("key-1");
    expect(ctrl.isDuplicate("key-1")).toBe(true);
  });

  it("atomic duplicate claim works through controller", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.claimInvocation("key-atomic")).toBe(true);
    expect(ctrl.claimInvocation("key-atomic")).toBe(false);
  });

  it("retry classification works through controller", () => {
    const ctrl = new MaoLifecycleController(T0);
    expect(ctrl.classifyRetry("RETRYABLE_SAFE_TIMEOUT")).toBe("RETRYABLE");
    expect(ctrl.classifyRetry("NON_RETRYABLE_INVALID_OUTPUT")).toBe("NON_RETRYABLE");
  });

  it("orphan classification works through controller", () => {
    const ctrl = new MaoLifecycleController(T0);
    ctrl.advanceClock(6000);
    const attempt = makeAttempt({ diagnosticClass: "RETRYABLE_TRANSPORT_INTERRUPTION" });
    expect(ctrl.classifyOrphan(attempt, 5000)).toBe("SAFE_RETRY");
  });
});

// ===========================================================================
// 9. End-to-end lifecycle scenario
// ===========================================================================

describe("end-to-end lifecycle", () => {
  it("task starts, heartbeats, times out, is classified for retry", () => {
    const ctrl = new MaoLifecycleController(T0);

    // Task starts
    const startedAt = ctrl.clock.now();

    // Heartbeat after 1s
    ctrl.advanceClock(1000);
    ctrl.heartbeat("t1");
    expect(ctrl.isHeartbeatStale("t1", 10000)).toBe(false);

    // Time passes beyond ceiling
    ctrl.advanceClock(6000);
    const timeout = ctrl.checkTimeout(startedAt, 5000);
    expect(timeout.timedOut).toBe(true);

    // Safe timeout is retryable
    expect(ctrl.classifyRetry("RETRYABLE_SAFE_TIMEOUT")).toBe("RETRYABLE");
  });

  it("cancel prevents new children", () => {
    const ctrl = new MaoLifecycleController(T0);

    expect(ctrl.mayStartNewChild("parent")).toBe(true);

    ctrl.requestCancel("parent");
    expect(ctrl.mayStartNewChild("parent")).toBe(false);

    // Accepting cancel keeps children blocked
    ctrl.acceptCancel("parent");
    expect(ctrl.mayStartNewChild("parent")).toBe(false);
    expect(ctrl.getCancelTracker("parent").state).toBe("ACCEPTED");
  });

  it("duplicate invocation is detected", () => {
    const ctrl = new MaoLifecycleController(T0);

    ctrl.recordInvocation("idem-001");
    expect(ctrl.isDuplicate("idem-001")).toBe(true);
    expect(ctrl.isDuplicate("idem-002")).toBe(false);
  });

  it("orphan with heartbeat: recent -> RESUMABLE, stale + retryable -> SAFE_RETRY, stale + non-retryable -> ESCALATE", () => {
    const ctrl = new MaoLifecycleController(T0);

    // Recent attempt with heartbeat
    ctrl.advanceClock(1000);
    const hbTime = ctrl.clock.now();
    ctrl.advanceClock(2000);
    const recent = makeAttempt({ lastHeartbeatAt: hbTime, diagnosticClass: "RETRYABLE_SAFE_TIMEOUT" });
    expect(ctrl.classifyOrphan(recent, 5000)).toBe("RESUMABLE");

    // Past silence window -> SAFE_RETRY (retryable diagnostic)
    ctrl.advanceClock(4000);
    expect(ctrl.classifyOrphan(recent, 5000)).toBe("SAFE_RETRY");

    // Non-retryable diagnostic -> ESCALATE
    const nonRetryable = makeAttempt({
      lastHeartbeatAt: hbTime,
      diagnosticClass: "NON_RETRYABLE_SCOPE_BREACH",
    });
    expect(ctrl.classifyOrphan(nonRetryable, 5000)).toBe("ESCALATE");
  });
});
