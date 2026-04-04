/**
 * EPF MCP Invocation & Batch — Dedicated Tests (W6-T24)
 * ======================================================
 * GC-023: dedicated file — never merge into index.test.ts.
 *
 * Coverage:
 *   MCPInvocationContract.invoke:
 *     - toolName = request.toolName
 *     - contextId = request.contextId
 *     - sourceRequestId = request.requestId
 *     - invocationStatus propagated (SUCCESS, FAILURE, TIMEOUT, REJECTED)
 *     - responsePayload propagated
 *     - invocationHash and resultId are deterministic for same inputs and timestamp
 *     - issuedAt set to injected now()
 *     - factory createMCPInvocationContract returns working instance
 *
 *   MCPInvocationBatchContract.batch:
 *     - empty → totalInvocations=0, FAILURE dominant (all counts=0, FAILURE first in priority)
 *     - single SUCCESS → successCount=1, SUCCESS dominant
 *     - single FAILURE → failureCount=1, FAILURE dominant
 *     - single TIMEOUT → timeoutCount=1, TIMEOUT dominant
 *     - single REJECTED → rejectedCount=1, REJECTED dominant
 *     - frequency-first: 2 SUCCESS + 1 FAILURE → SUCCESS dominant (count wins)
 *     - tie-breaking FAILURE > TIMEOUT: 1 FAILURE + 1 TIMEOUT → FAILURE dominant
 *     - tie-breaking FAILURE > SUCCESS: 1 FAILURE + 1 SUCCESS → FAILURE dominant
 *     - tie-breaking TIMEOUT > REJECTED: 1 TIMEOUT + 1 REJECTED → TIMEOUT dominant
 *     - counts accurate for mixed input (SUCCESS+FAILURE+TIMEOUT+REJECTED)
 *     - totalInvocations equals input length
 *     - batchHash and batchId deterministic for same inputs and timestamp
 *     - createdAt set to injected now()
 *     - factory createMCPInvocationBatchContract returns working instance
 */

import { describe, it, expect } from "vitest";

import {
  MCPInvocationContract,
  createMCPInvocationContract,
} from "../src/mcp.invocation.contract";
import type {
  MCPInvocationRequest,
  MCPInvocationResult,
  MCPInvocationStatus,
} from "../src/mcp.invocation.contract";
import {
  MCPInvocationBatchContract,
  createMCPInvocationBatchContract,
} from "../src/mcp.invocation.batch.contract";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-03-24T03:00:00.000Z";
const fixedNow = () => FIXED_NOW;

let _rSeq = 0;
function makeRequest(overrides: Partial<MCPInvocationRequest> = {}): MCPInvocationRequest {
  const n = ++_rSeq;
  return {
    toolName: `tool-${n}`,
    toolArgs: { key: `val-${n}` },
    contextId: `ctx-${n}`,
    requestId: `req-${n}`,
    ...overrides,
  };
}

function makeResult(status: MCPInvocationStatus): MCPInvocationResult {
  const n = ++_rSeq;
  return {
    resultId: `result-${n}`,
    issuedAt: FIXED_NOW,
    toolName: `tool-${n}`,
    contextId: `ctx-${n}`,
    sourceRequestId: `req-${n}`,
    invocationStatus: status,
    responsePayload: { ok: true },
    invocationHash: `ih-${n}`,
  };
}

// ─── MCPInvocationContract ────────────────────────────────────────────────────

describe("MCPInvocationContract.invoke", () => {
  const contract = new MCPInvocationContract({ now: fixedNow });

  it("toolName = request.toolName", () => {
    const req = makeRequest({ toolName: "my-tool" });
    expect(contract.invoke(req, "SUCCESS", null).toolName).toBe("my-tool");
  });

  it("contextId = request.contextId", () => {
    const req = makeRequest({ contextId: "ctx-abc" });
    expect(contract.invoke(req, "SUCCESS", null).contextId).toBe("ctx-abc");
  });

  it("sourceRequestId = request.requestId", () => {
    const req = makeRequest({ requestId: "req-xyz" });
    expect(contract.invoke(req, "SUCCESS", null).sourceRequestId).toBe("req-xyz");
  });

  describe("invocationStatus propagated", () => {
    it("SUCCESS status propagated", () => {
      expect(contract.invoke(makeRequest(), "SUCCESS", null).invocationStatus).toBe("SUCCESS");
    });

    it("FAILURE status propagated", () => {
      expect(contract.invoke(makeRequest(), "FAILURE", null).invocationStatus).toBe("FAILURE");
    });

    it("TIMEOUT status propagated", () => {
      expect(contract.invoke(makeRequest(), "TIMEOUT", null).invocationStatus).toBe("TIMEOUT");
    });

    it("REJECTED status propagated", () => {
      expect(contract.invoke(makeRequest(), "REJECTED", null).invocationStatus).toBe("REJECTED");
    });
  });

  it("responsePayload propagated", () => {
    const payload = { answer: 42 };
    expect(contract.invoke(makeRequest(), "SUCCESS", payload).responsePayload).toEqual(payload);
  });

  it("invocationHash and resultId are deterministic for same inputs and timestamp", () => {
    const req = makeRequest();
    const r1 = contract.invoke(req, "SUCCESS", { x: 1 });
    const r2 = contract.invoke(req, "SUCCESS", { x: 1 });
    expect(r1.invocationHash).toBe(r2.invocationHash);
    expect(r1.resultId).toBe(r2.resultId);
  });

  it("issuedAt set to injected now()", () => {
    expect(contract.invoke(makeRequest(), "SUCCESS", null).issuedAt).toBe(FIXED_NOW);
  });

  it("factory createMCPInvocationContract returns working instance", () => {
    const c = createMCPInvocationContract({ now: fixedNow });
    const result = c.invoke(makeRequest(), "SUCCESS", { data: "test" });
    expect(result.invocationStatus).toBe("SUCCESS");
    expect(result.issuedAt).toBe(FIXED_NOW);
  });
});

// ─── MCPInvocationBatchContract ───────────────────────────────────────────────

describe("MCPInvocationBatchContract.batch", () => {
  const contract = new MCPInvocationBatchContract({ now: fixedNow });

  it("empty → totalInvocations=0, FAILURE dominant, all counts zero", () => {
    const result = contract.batch([]);
    expect(result.totalInvocations).toBe(0);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(0);
    expect(result.timeoutCount).toBe(0);
    expect(result.rejectedCount).toBe(0);
    expect(result.dominantStatus).toBe("FAILURE");
  });

  describe("single-status dominant derivation", () => {
    it("single SUCCESS → successCount=1, SUCCESS dominant", () => {
      const result = contract.batch([makeResult("SUCCESS")]);
      expect(result.successCount).toBe(1);
      expect(result.dominantStatus).toBe("SUCCESS");
    });

    it("single FAILURE → failureCount=1, FAILURE dominant", () => {
      const result = contract.batch([makeResult("FAILURE")]);
      expect(result.failureCount).toBe(1);
      expect(result.dominantStatus).toBe("FAILURE");
    });

    it("single TIMEOUT → timeoutCount=1, TIMEOUT dominant", () => {
      const result = contract.batch([makeResult("TIMEOUT")]);
      expect(result.timeoutCount).toBe(1);
      expect(result.dominantStatus).toBe("TIMEOUT");
    });

    it("single REJECTED → rejectedCount=1, REJECTED dominant", () => {
      const result = contract.batch([makeResult("REJECTED")]);
      expect(result.rejectedCount).toBe(1);
      expect(result.dominantStatus).toBe("REJECTED");
    });
  });

  describe("dominant — frequency-first, ties broken by FAILURE>TIMEOUT>REJECTED>SUCCESS", () => {
    it("frequency wins: 2 SUCCESS + 1 FAILURE → SUCCESS dominant", () => {
      const results = [makeResult("SUCCESS"), makeResult("SUCCESS"), makeResult("FAILURE")];
      expect(contract.batch(results).dominantStatus).toBe("SUCCESS");
    });

    it("tie: 1 FAILURE + 1 SUCCESS → FAILURE dominant (FAILURE higher priority)", () => {
      const results = [makeResult("FAILURE"), makeResult("SUCCESS")];
      expect(contract.batch(results).dominantStatus).toBe("FAILURE");
    });

    it("tie: 1 FAILURE + 1 TIMEOUT → FAILURE dominant (FAILURE higher priority)", () => {
      const results = [makeResult("FAILURE"), makeResult("TIMEOUT")];
      expect(contract.batch(results).dominantStatus).toBe("FAILURE");
    });

    it("tie: 1 TIMEOUT + 1 REJECTED → TIMEOUT dominant (TIMEOUT higher than REJECTED)", () => {
      const results = [makeResult("TIMEOUT"), makeResult("REJECTED")];
      expect(contract.batch(results).dominantStatus).toBe("TIMEOUT");
    });

    it("frequency wins: 2 FAILURE + 1 SUCCESS → FAILURE dominant", () => {
      const results = [makeResult("FAILURE"), makeResult("FAILURE"), makeResult("SUCCESS")];
      expect(contract.batch(results).dominantStatus).toBe("FAILURE");
    });
  });

  it("counts accurate for mixed input", () => {
    const results = [
      makeResult("SUCCESS"),
      makeResult("SUCCESS"),
      makeResult("FAILURE"),
      makeResult("TIMEOUT"),
      makeResult("TIMEOUT"),
      makeResult("REJECTED"),
    ];
    const batch = contract.batch(results);
    expect(batch.successCount).toBe(2);
    expect(batch.failureCount).toBe(1);
    expect(batch.timeoutCount).toBe(2);
    expect(batch.rejectedCount).toBe(1);
  });

  it("totalInvocations equals input length", () => {
    const results = [makeResult("SUCCESS"), makeResult("FAILURE"), makeResult("TIMEOUT")];
    expect(contract.batch(results).totalInvocations).toBe(3);
  });

  it("batchHash and batchId are deterministic for same inputs and timestamp", () => {
    const results = [makeResult("SUCCESS"), makeResult("FAILURE")];
    const b1 = contract.batch(results);
    const b2 = contract.batch(results);
    expect(b1.batchHash).toBe(b2.batchHash);
    expect(b1.batchId).toBe(b2.batchId);
  });

  it("createdAt set to injected now()", () => {
    expect(contract.batch([]).createdAt).toBe(FIXED_NOW);
  });

  it("factory createMCPInvocationBatchContract returns working instance", () => {
    const c = createMCPInvocationBatchContract({ now: fixedNow });
    const result = c.batch([]);
    expect(result.dominantStatus).toBe("FAILURE");
    expect(result.createdAt).toBe(FIXED_NOW);
  });
});
