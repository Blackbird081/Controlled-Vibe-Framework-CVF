/**
 * CPF Trust/Isolation Boundary Contract — Dedicated Tests (W8-T1 CP1)
 * =====================================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 * GC-024: partition entry added to CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json.
 *
 * Coverage:
 *   TrustIsolationBoundaryContract.declareTrustDomain:
 *     - requiresPolicySimulation=true → FULL_RUNTIME
 *     - requiresRiskEvaluation=true → FULL_RUNTIME
 *     - riskLevel=R2 → FULL_RUNTIME
 *     - riskLevel=R3 → FULL_RUNTIME
 *     - all false, R0 → LIGHTWEIGHT_SDK
 *     - all false, R1 → LIGHTWEIGHT_SDK
 *     - rationale contains reason for FULL_RUNTIME
 *     - rationale set for LIGHTWEIGHT_SDK
 *     - declarationHash deterministic for same inputs and timestamp
 *     - declarationId is truthy
 *     - evaluatedAt set to injected now()
 *     - criteria propagated unchanged
 *
 *   TrustIsolationBoundaryContract.evaluateIsolationScope:
 *     - WORKSPACE + write → HARD_BLOCK + BOUNDARY_BREACH
 *     - WORKSPACE + modify → HARD_BLOCK + BOUNDARY_BREACH
 *     - WORKSPACE + delete → HARD_BLOCK + BOUNDARY_BREACH
 *     - WORKSPACE + read → PASS + WITHIN_BOUNDARY
 *     - AGENT + R3 → HARD_BLOCK + BOUNDARY_BREACH
 *     - AGENT + R2 → ESCALATE + GOVERNANCE_GATE_REQUIRED
 *     - AGENT + R1 → PASS + WITHIN_BOUNDARY
 *     - AGENT + R0 → PASS + WITHIN_BOUNDARY
 *     - CAPABILITY + R3 → HARD_BLOCK + BOUNDARY_BREACH
 *     - CAPABILITY + R2 → ESCALATE + GOVERNANCE_GATE_REQUIRED
 *     - CAPABILITY + R1 → PASS + WITHIN_BOUNDARY
 *     - riskLevel defaults to R1 when absent
 *     - resultHash deterministic for same inputs
 *     - resultId is truthy
 *
 *   TrustIsolationBoundaryContract.decideTrustPropagation:
 *     - requiresGovernanceApproval=true → GRAPH_GATED
 *     - cross-plane context → GRAPH_GATED
 *     - consumer-pipeline context → DIRECT
 *     - agent-to-agent context → DIRECT
 *     - unknown context → BLOCKED
 *     - decisionHash deterministic for same inputs
 *     - decisionId is truthy
 *     - sourceId/targetId propagated
 *
 *   Factory:
 *     - createTrustIsolationBoundaryContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  TrustIsolationBoundaryContract,
  createTrustIsolationBoundaryContract,
} from "../src/trust.isolation.boundary.contract";
import type {
  TrustDomainCriteria,
  IsolationScopeRequest,
  TrustPropagationRequest,
} from "../src/trust.isolation.boundary.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-29T08:00:00.000Z";
const fixedNow = () => FIXED_NOW;

const contract = new TrustIsolationBoundaryContract({ now: fixedNow });

function makeCriteria(overrides: Partial<TrustDomainCriteria> = {}): TrustDomainCriteria {
  return {
    requiresPolicySimulation: false,
    requiresRiskEvaluation: false,
    isEmbeddedConsumer: true,
    riskLevel: "R0",
    ...overrides,
  };
}

function makeIsolationRequest(overrides: Partial<IsolationScopeRequest> = {}): IsolationScopeRequest {
  return {
    scopeClass: "AGENT",
    subjectId: "agent-01",
    requestedOperation: "read-context",
    riskLevel: "R1",
    ...overrides,
  };
}

function makePropagationRequest(overrides: Partial<TrustPropagationRequest> = {}): TrustPropagationRequest {
  return {
    sourceId: "source-01",
    targetId: "target-01",
    propagationContext: "consumer-pipeline",
    ...overrides,
  };
}

// ─── declareTrustDomain ───────────────────────────────────────────────────────

describe("TrustIsolationBoundaryContract.declareTrustDomain", () => {
  describe("FULL_RUNTIME triggers", () => {
    it("requiresPolicySimulation=true → FULL_RUNTIME", () => {
      const result = contract.declareTrustDomain(makeCriteria({ requiresPolicySimulation: true }));
      expect(result.resolvedDomain).toBe("FULL_RUNTIME");
    });

    it("requiresRiskEvaluation=true → FULL_RUNTIME", () => {
      const result = contract.declareTrustDomain(makeCriteria({ requiresRiskEvaluation: true }));
      expect(result.resolvedDomain).toBe("FULL_RUNTIME");
    });

    it("riskLevel=R2 → FULL_RUNTIME", () => {
      const result = contract.declareTrustDomain(makeCriteria({ riskLevel: "R2" }));
      expect(result.resolvedDomain).toBe("FULL_RUNTIME");
    });

    it("riskLevel=R3 → FULL_RUNTIME", () => {
      const result = contract.declareTrustDomain(makeCriteria({ riskLevel: "R3" }));
      expect(result.resolvedDomain).toBe("FULL_RUNTIME");
    });

    it("FULL_RUNTIME rationale mentions the triggering reason (policy simulation)", () => {
      const result = contract.declareTrustDomain(makeCriteria({ requiresPolicySimulation: true }));
      expect(result.rationale).toContain("policy simulation");
    });

    it("FULL_RUNTIME rationale mentions the triggering reason (R3 risk level)", () => {
      const result = contract.declareTrustDomain(makeCriteria({ riskLevel: "R3" }));
      expect(result.rationale).toContain("R3");
    });
  });

  describe("LIGHTWEIGHT_SDK eligibility", () => {
    it("all false + R0 → LIGHTWEIGHT_SDK", () => {
      const result = contract.declareTrustDomain(makeCriteria({ riskLevel: "R0" }));
      expect(result.resolvedDomain).toBe("LIGHTWEIGHT_SDK");
    });

    it("all false + R1 → LIGHTWEIGHT_SDK", () => {
      const result = contract.declareTrustDomain(makeCriteria({ riskLevel: "R1" }));
      expect(result.resolvedDomain).toBe("LIGHTWEIGHT_SDK");
    });

    it("LIGHTWEIGHT_SDK rationale is set", () => {
      const result = contract.declareTrustDomain(makeCriteria());
      expect(result.rationale.length).toBeGreaterThan(0);
      expect(result.rationale).toContain("Lightweight SDK");
    });
  });

  describe("declaration fields", () => {
    it("evaluatedAt set to injected now()", () => {
      const result = contract.declareTrustDomain(makeCriteria());
      expect(result.evaluatedAt).toBe(FIXED_NOW);
    });

    it("criteria propagated unchanged", () => {
      const criteria = makeCriteria({ riskLevel: "R1", isEmbeddedConsumer: false });
      const result = contract.declareTrustDomain(criteria);
      expect(result.criteria).toEqual(criteria);
    });

    it("declarationHash deterministic for same inputs and timestamp", () => {
      const criteria = makeCriteria({ riskLevel: "R1" });
      const r1 = contract.declareTrustDomain(criteria);
      const r2 = contract.declareTrustDomain(criteria);
      expect(r1.declarationHash).toBe(r2.declarationHash);
    });

    it("declarationId is truthy", () => {
      const result = contract.declareTrustDomain(makeCriteria());
      expect(result.declarationId.length).toBeGreaterThan(0);
    });
  });
});

// ─── evaluateIsolationScope ───────────────────────────────────────────────────

describe("TrustIsolationBoundaryContract.evaluateIsolationScope", () => {
  describe("WORKSPACE isolation", () => {
    it("write operation → HARD_BLOCK + BOUNDARY_BREACH", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "WORKSPACE", requestedOperation: "write-file" }),
      );
      expect(result.enforcementMode).toBe("HARD_BLOCK");
      expect(result.boundaryStatus).toBe("BOUNDARY_BREACH");
    });

    it("modify operation → HARD_BLOCK + BOUNDARY_BREACH", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "WORKSPACE", requestedOperation: "modify-config" }),
      );
      expect(result.enforcementMode).toBe("HARD_BLOCK");
      expect(result.boundaryStatus).toBe("BOUNDARY_BREACH");
    });

    it("delete operation → HARD_BLOCK + BOUNDARY_BREACH", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "WORKSPACE", requestedOperation: "delete-artifact" }),
      );
      expect(result.enforcementMode).toBe("HARD_BLOCK");
      expect(result.boundaryStatus).toBe("BOUNDARY_BREACH");
    });

    it("read operation → PASS + WITHIN_BOUNDARY", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "WORKSPACE", requestedOperation: "read-config" }),
      );
      expect(result.enforcementMode).toBe("PASS");
      expect(result.boundaryStatus).toBe("WITHIN_BOUNDARY");
    });
  });

  describe("AGENT isolation", () => {
    it("R3 → HARD_BLOCK + BOUNDARY_BREACH", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "AGENT", riskLevel: "R3" }),
      );
      expect(result.enforcementMode).toBe("HARD_BLOCK");
      expect(result.boundaryStatus).toBe("BOUNDARY_BREACH");
    });

    it("R2 → ESCALATE + GOVERNANCE_GATE_REQUIRED", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "AGENT", riskLevel: "R2" }),
      );
      expect(result.enforcementMode).toBe("ESCALATE");
      expect(result.boundaryStatus).toBe("GOVERNANCE_GATE_REQUIRED");
    });

    it("R1 → PASS + WITHIN_BOUNDARY", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "AGENT", riskLevel: "R1" }),
      );
      expect(result.enforcementMode).toBe("PASS");
      expect(result.boundaryStatus).toBe("WITHIN_BOUNDARY");
    });

    it("R0 → PASS + WITHIN_BOUNDARY", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "AGENT", riskLevel: "R0" }),
      );
      expect(result.enforcementMode).toBe("PASS");
      expect(result.boundaryStatus).toBe("WITHIN_BOUNDARY");
    });
  });

  describe("CAPABILITY isolation", () => {
    it("R3 → HARD_BLOCK + BOUNDARY_BREACH", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "CAPABILITY", riskLevel: "R3" }),
      );
      expect(result.enforcementMode).toBe("HARD_BLOCK");
      expect(result.boundaryStatus).toBe("BOUNDARY_BREACH");
    });

    it("R2 → ESCALATE + GOVERNANCE_GATE_REQUIRED", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "CAPABILITY", riskLevel: "R2" }),
      );
      expect(result.enforcementMode).toBe("ESCALATE");
      expect(result.boundaryStatus).toBe("GOVERNANCE_GATE_REQUIRED");
    });

    it("R1 → PASS + WITHIN_BOUNDARY", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ scopeClass: "CAPABILITY", riskLevel: "R1" }),
      );
      expect(result.enforcementMode).toBe("PASS");
      expect(result.boundaryStatus).toBe("WITHIN_BOUNDARY");
    });
  });

  describe("isolation result fields", () => {
    it("riskLevel defaults to R1 when absent → PASS for AGENT", () => {
      const result = contract.evaluateIsolationScope({
        scopeClass: "AGENT",
        subjectId: "agent-no-risk",
        requestedOperation: "read",
      });
      expect(result.enforcementMode).toBe("PASS");
    });

    it("subjectId and requestedOperation propagated", () => {
      const result = contract.evaluateIsolationScope(
        makeIsolationRequest({ subjectId: "agent-42", requestedOperation: "deploy" }),
      );
      expect(result.subjectId).toBe("agent-42");
      expect(result.requestedOperation).toBe("deploy");
    });

    it("resultHash deterministic for same inputs and timestamp", () => {
      const req = makeIsolationRequest({ subjectId: "agent-01", riskLevel: "R1" });
      const r1 = contract.evaluateIsolationScope(req);
      const r2 = contract.evaluateIsolationScope(req);
      expect(r1.resultHash).toBe(r2.resultHash);
    });

    it("resultId is truthy", () => {
      const result = contract.evaluateIsolationScope(makeIsolationRequest());
      expect(result.resultId.length).toBeGreaterThan(0);
    });

    it("evaluatedAt set to injected now()", () => {
      const result = contract.evaluateIsolationScope(makeIsolationRequest());
      expect(result.evaluatedAt).toBe(FIXED_NOW);
    });
  });
});

// ─── decideTrustPropagation ───────────────────────────────────────────────────

describe("TrustIsolationBoundaryContract.decideTrustPropagation", () => {
  describe("GRAPH_GATED triggers", () => {
    it("requiresGovernanceApproval=true → GRAPH_GATED", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ requiresGovernanceApproval: true }),
      );
      expect(result.mode).toBe("GRAPH_GATED");
    });

    it("cross-plane context → GRAPH_GATED", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ propagationContext: "cross-plane" }),
      );
      expect(result.mode).toBe("GRAPH_GATED");
    });
  });

  describe("DIRECT propagation", () => {
    it("consumer-pipeline context → DIRECT", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ propagationContext: "consumer-pipeline" }),
      );
      expect(result.mode).toBe("DIRECT");
    });

    it("agent-to-agent context → DIRECT", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ propagationContext: "agent-to-agent" }),
      );
      expect(result.mode).toBe("DIRECT");
    });
  });

  describe("BLOCKED propagation", () => {
    it("unknown context → BLOCKED", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ propagationContext: "unknown-context" }),
      );
      expect(result.mode).toBe("BLOCKED");
    });

    it("BLOCKED reason mentions the unknown context", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ propagationContext: "external-system" }),
      );
      expect(result.reason).toContain("external-system");
    });
  });

  describe("decision fields", () => {
    it("sourceId and targetId propagated", () => {
      const result = contract.decideTrustPropagation(
        makePropagationRequest({ sourceId: "src-A", targetId: "tgt-B" }),
      );
      expect(result.sourceId).toBe("src-A");
      expect(result.targetId).toBe("tgt-B");
    });

    it("evaluatedAt set to injected now()", () => {
      const result = contract.decideTrustPropagation(makePropagationRequest());
      expect(result.evaluatedAt).toBe(FIXED_NOW);
    });

    it("decisionHash deterministic for same inputs and timestamp", () => {
      const req = makePropagationRequest({ sourceId: "s1", targetId: "t1" });
      const r1 = contract.decideTrustPropagation(req);
      const r2 = contract.decideTrustPropagation(req);
      expect(r1.decisionHash).toBe(r2.decisionHash);
    });

    it("decisionId is truthy", () => {
      const result = contract.decideTrustPropagation(makePropagationRequest());
      expect(result.decisionId.length).toBeGreaterThan(0);
    });
  });
});

// ─── Factory ─────────────────────────────────────────────────────────────────

describe("createTrustIsolationBoundaryContract", () => {
  it("returns a working instance", () => {
    const c = createTrustIsolationBoundaryContract({ now: fixedNow });
    const result = c.declareTrustDomain(makeCriteria());
    expect(result.evaluatedAt).toBe(FIXED_NOW);
    expect(result.resolvedDomain).toBe("LIGHTWEIGHT_SDK");
  });
});
