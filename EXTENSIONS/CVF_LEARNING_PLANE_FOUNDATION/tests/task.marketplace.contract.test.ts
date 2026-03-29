import { describe, it, expect } from "vitest";
import {
  TaskMarketplaceContract,
  createTaskMarketplaceContract,
} from "../src/task.marketplace.contract";
import type {
  TaskAllocationRequest,
  TaskAllocationRecord,
  AllocationDecision,
  PriorityCeiling,
} from "../src/task.marketplace.contract";
import type { ReputationSignal, ReputationClass } from "../src/reputation.signal.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-29T12:00:00.000Z";

function makeSignal(
  reputationClass: ReputationClass,
  compositeReputationScore: number,
  agentId = "agent-001",
): ReputationSignal {
  return {
    signalId: `sig-${reputationClass.toLowerCase()}`,
    computedAt: FIXED_NOW,
    agentId,
    compositeReputationScore,
    reputationClass,
    dimensions: {
      truthContribution: 0,
      feedbackContribution: 0,
      evaluationContribution: 0,
      governanceContribution: 0,
    },
    rationale: `test-signal for ${reputationClass}`,
    reputationHash: `hash-${reputationClass.toLowerCase()}`,
  };
}

function makeRequest(
  overrides: Partial<TaskAllocationRequest> = {},
): TaskAllocationRequest {
  return {
    requestId: "req-001",
    agentId: "agent-001",
    reputationSignal: makeSignal("TRUSTED", 90),
    taskPriority: "high",
    declaredCapacity: 1.0,
    ...overrides,
  };
}

function makeContract(fixedNow = FIXED_NOW): TaskMarketplaceContract {
  return new TaskMarketplaceContract({ now: () => fixedNow });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TaskMarketplaceContract — TRUSTED allocation", () => {
  it("TRUSTED + full capacity → ASSIGN", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 90), declaredCapacity: 1.0 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("TRUSTED + zero capacity → ASSIGN (any capacity rule)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 80), declaredCapacity: 0.0 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("TRUSTED + fractional capacity → ASSIGN", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 95), declaredCapacity: 0.1 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });
});

describe("TaskMarketplaceContract — RELIABLE allocation", () => {
  it("RELIABLE + capacity 0.3 → ASSIGN (threshold boundary)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 70), declaredCapacity: 0.3 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("RELIABLE + capacity 0.5 → ASSIGN", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.5 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("RELIABLE + capacity 1.0 → ASSIGN", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 65), declaredCapacity: 1.0 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("RELIABLE + capacity 0.29 → DEFER (below threshold)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 58), declaredCapacity: 0.29 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });

  it("RELIABLE + zero capacity → DEFER", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 55), declaredCapacity: 0.0 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });
});

describe("TaskMarketplaceContract — PROVISIONAL allocation", () => {
  it("PROVISIONAL + capacity 0.5 → DEFER (threshold boundary)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 50), declaredCapacity: 0.5 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });

  it("PROVISIONAL + capacity 0.7 → DEFER", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 40), declaredCapacity: 0.7 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });

  it("PROVISIONAL + capacity 0.49 → REJECT (below threshold)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 35), declaredCapacity: 0.49 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });

  it("PROVISIONAL + zero capacity → REJECT", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 30), declaredCapacity: 0.0 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });
});

describe("TaskMarketplaceContract — UNTRUSTED allocation", () => {
  it("UNTRUSTED + full capacity → REJECT", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("UNTRUSTED", 10), declaredCapacity: 1.0 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });

  it("UNTRUSTED + zero capacity → REJECT", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("UNTRUSTED", 0), declaredCapacity: 0.0 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });
});

describe("TaskMarketplaceContract — priority ceiling", () => {
  it("TRUSTED → ceiling critical", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 90) }),
    );
    expect(record.assignedPriorityCeiling).toBe("critical");
  });

  it("RELIABLE → ceiling high", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.5 }),
    );
    expect(record.assignedPriorityCeiling).toBe("high");
  });

  it("PROVISIONAL → ceiling medium", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 40), declaredCapacity: 0.5 }),
    );
    expect(record.assignedPriorityCeiling).toBe("medium");
  });

  it("UNTRUSTED → ceiling none", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("UNTRUSTED", 10) }),
    );
    expect(record.assignedPriorityCeiling).toBe("none");
  });
});

describe("TaskMarketplaceContract — determinism", () => {
  it("same input → same allocationHash", () => {
    const request = makeRequest();
    const r1 = makeContract().allocate(request);
    const r2 = makeContract().allocate(request);
    expect(r1.allocationHash).toBe(r2.allocationHash);
  });

  it("different allocatedAt → different allocationHash", () => {
    const request = makeRequest();
    const r1 = new TaskMarketplaceContract({ now: () => "2026-03-29T10:00:00.000Z" }).allocate(request);
    const r2 = new TaskMarketplaceContract({ now: () => "2026-03-29T11:00:00.000Z" }).allocate(request);
    expect(r1.allocationHash).not.toBe(r2.allocationHash);
  });

  it("different requestId → different allocationHash", () => {
    const r1 = makeContract().allocate(makeRequest({ requestId: "req-A" }));
    const r2 = makeContract().allocate(makeRequest({ requestId: "req-B" }));
    expect(r1.allocationHash).not.toBe(r2.allocationHash);
  });

  it("different reputation class → different allocationHash", () => {
    const r1 = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 90) }),
    );
    const r2 = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.5 }),
    );
    expect(r1.allocationHash).not.toBe(r2.allocationHash);
  });
});

describe("TaskMarketplaceContract — record identity", () => {
  it("recordId differs from allocationHash", () => {
    const record = makeContract().allocate(makeRequest());
    expect(record.recordId).not.toBe(record.allocationHash);
  });

  it("same input → same recordId", () => {
    const request = makeRequest();
    const r1 = makeContract().allocate(request);
    const r2 = makeContract().allocate(request);
    expect(r1.recordId).toBe(r2.recordId);
  });
});

describe("TaskMarketplaceContract — output field propagation", () => {
  it("requestId is propagated to record", () => {
    const record = makeContract().allocate(makeRequest({ requestId: "req-xyz" }));
    expect(record.requestId).toBe("req-xyz");
  });

  it("agentId is propagated to record", () => {
    const record = makeContract().allocate(makeRequest({ agentId: "agent-xyz" }));
    expect(record.agentId).toBe("agent-xyz");
  });

  it("allocatedAt is set to injected now()", () => {
    const record = makeContract(FIXED_NOW).allocate(makeRequest());
    expect(record.allocatedAt).toBe(FIXED_NOW);
  });

  it("composite score from reputationSignal is present in rationale", () => {
    const signal = makeSignal("TRUSTED", 92);
    const record = makeContract().allocate(makeRequest({ reputationSignal: signal }));
    expect(record.rationale).toContain("92/100");
  });
});

describe("TaskMarketplaceContract — rationale content", () => {
  it("rationale contains agentId", () => {
    const record = makeContract().allocate(makeRequest({ agentId: "agent-rationale-check" }));
    expect(record.rationale).toContain("agent-rationale-check");
  });

  it("rationale contains reputationClass", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 62), declaredCapacity: 0.5 }),
    );
    expect(record.rationale).toContain("RELIABLE");
  });

  it("rationale contains allocation decision", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("UNTRUSTED", 10) }),
    );
    expect(record.rationale).toContain("REJECT");
  });

  it("rationale contains assignedPriorityCeiling", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 40), declaredCapacity: 0.6 }),
    );
    expect(record.rationale).toContain("medium");
  });

  it("rationale contains declaredCapacity", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.42 }),
    );
    expect(record.rationale).toContain("0.42");
  });
});

describe("TaskMarketplaceContract — boundary conditions", () => {
  it("RELIABLE capacity exactly 0.3 → ASSIGN (inclusive lower bound)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.3 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("RELIABLE capacity 0.2999 → DEFER (exclusive upper bound below threshold)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("RELIABLE", 60), declaredCapacity: 0.2999 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });

  it("PROVISIONAL capacity exactly 0.5 → DEFER (inclusive lower bound)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 40), declaredCapacity: 0.5 }),
    );
    expect(record.allocationDecision).toBe("DEFER");
  });

  it("PROVISIONAL capacity 0.4999 → REJECT (exclusive upper bound below threshold)", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("PROVISIONAL", 40), declaredCapacity: 0.4999 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });

  it("TRUSTED score exactly 80 → ASSIGN", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("TRUSTED", 80), declaredCapacity: 0.0 }),
    );
    expect(record.allocationDecision).toBe("ASSIGN");
  });

  it("UNTRUSTED score 29 → REJECT regardless of capacity 1.0", () => {
    const record = makeContract().allocate(
      makeRequest({ reputationSignal: makeSignal("UNTRUSTED", 29), declaredCapacity: 1.0 }),
    );
    expect(record.allocationDecision).toBe("REJECT");
  });
});

describe("TaskMarketplaceContract — taskPriority does not affect allocation decision", () => {
  it("RELIABLE + 0.5 capacity → ASSIGN for any taskPriority", () => {
    const base = makeRequest({ reputationSignal: makeSignal("RELIABLE", 65), declaredCapacity: 0.5 });
    const decisions: AllocationDecision[] = (["critical", "high", "medium", "low"] as const).map(
      (p) => makeContract().allocate({ ...base, taskPriority: p }).allocationDecision,
    );
    expect(decisions.every((d) => d === "ASSIGN")).toBe(true);
  });

  it("taskPriority is reflected in rationale string", () => {
    const record = makeContract().allocate(
      makeRequest({ taskPriority: "critical", reputationSignal: makeSignal("TRUSTED", 90) }),
    );
    expect(record.rationale).toContain("critical");
  });
});

describe("TaskMarketplaceContract — factory function", () => {
  it("createTaskMarketplaceContract returns functional contract instance", () => {
    const contract = createTaskMarketplaceContract({ now: () => FIXED_NOW });
    const record = contract.allocate(makeRequest());
    expect(record.allocationDecision).toBe("ASSIGN");
    expect(record.allocatedAt).toBe(FIXED_NOW);
  });
});
