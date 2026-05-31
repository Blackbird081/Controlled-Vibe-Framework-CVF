import { describe, expect, it } from "vitest";
import {
  CONTROLLED_MEMORY_GATEWAY_PHASE2_VERSION,
  evaluateMemoryGatewayRequest,
  type MemoryGatewayRequest,
} from "../src/controlled-memory-gateway";

const baseRequest: MemoryGatewayRequest = {
  operationId: "op-1",
  operation: "remember",
  actorId: "actor-1",
  projectId: "project-1",
  sessionId: "session-1",
  memoryScope: "project",
  riskLevel: "R1",
  policyDecision: "allow",
};

describe("controlled memory gateway phase 2a", () => {
  it("allows a governed memory operation and requires an audit receipt", () => {
    expect(evaluateMemoryGatewayRequest(baseRequest)).toMatchObject({
      contractVersion: CONTROLLED_MEMORY_GATEWAY_PHASE2_VERSION,
      decision: "allow",
      allowed: true,
      auditReceiptRequired: true,
      rawMemoryReleased: false,
      canReinject: false,
    });
  });

  it("routes sensitive memory through redaction instead of raw release", () => {
    expect(evaluateMemoryGatewayRequest({
      ...baseRequest,
      containsSensitiveData: true,
    })).toMatchObject({
      decision: "allow_redacted",
      reason: "privacy_filter_required",
      rawMemoryReleased: false,
    });
  });

  it("denies direct reinjection unless summary-only reinjection is authorized", () => {
    expect(evaluateMemoryGatewayRequest({
      ...baseRequest,
      operation: "reinject",
      memoryIds: ["mem-1"],
    })).toMatchObject({
      decision: "deny",
      reason: "memory_reinjection_not_authorized",
      canReinject: false,
    });

    expect(evaluateMemoryGatewayRequest({
      ...baseRequest,
      operation: "reinject",
      memoryIds: ["mem-1"],
      canReinject: true,
    })).toMatchObject({
      decision: "allow_summary_only",
      reason: "summary_only_reinjection_authorized",
      canReinject: true,
      rawMemoryReleased: false,
    });
  });

  it("requires memory ids for targeted lifecycle operations", () => {
    expect(evaluateMemoryGatewayRequest({
      ...baseRequest,
      operation: "forget",
    })).toMatchObject({
      decision: "deny",
      reason: "memory_ids_required_for_operation",
    });
  });
});
