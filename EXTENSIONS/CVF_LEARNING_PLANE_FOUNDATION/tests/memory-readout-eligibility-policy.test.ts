import { describe, expect, it } from "vitest";
import {
  MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION,
  evaluateReadoutEligibility,
  type MemoryReadoutEligibilityInput,
} from "../src/memory-readout-eligibility-policy";

const baseInput: MemoryReadoutEligibilityInput = {
  actorRole: "OPERATOR",
  scope: "project-a",
  lifecycleState: "semantic",
  ageDays: 10,
  stale: false,
  revoked: false,
  authoritySourcePresent: true,
};

function expectInvariants(result: { rawMemoryReleased: boolean; canReinject: boolean }) {
  expect(result.rawMemoryReleased).toBe(false);
  expect(result.canReinject).toBe(false);
}

describe("MKG7-T2 memory readout eligibility policy", () => {
  it("allows readout when input passes all checks", () => {
    const result = evaluateReadoutEligibility(baseInput);

    expect(result.state).toBe("READOUT_ALLOWED");
    expect(result.reason).toBe("memory_readout_permitted");
    expect(result.contractVersion).toBe(MEMORY_READOUT_ELIGIBILITY_POLICY_VERSION);
    expectInvariants(result);
  });

  it("denies when authority source is missing", () => {
    const result = evaluateReadoutEligibility({
      ...baseInput,
      authoritySourcePresent: false,
    });

    expect(result.state).toBe("NO_AUTHORITY_SOURCE");
    expect(result.reason).toContain("authority_source_missing_for_readout");
    expectInvariants(result);
  });

  it("marks revoked candidates as REVOKED", () => {
    const result = evaluateReadoutEligibility({
      ...baseInput,
      revoked: true,
    });

    expect(result.state).toBe("REVOKED");
    expect(result.reason).toContain("access_revoked");
    expectInvariants(result);
  });

  it("returns OUT_OF_SCOPE_FOR_ACTOR when actor role is not authorized", () => {
    const result = evaluateReadoutEligibility({
      ...baseInput,
      actorRole: "unknown",
    });

    expect(result.state).toBe("OUT_OF_SCOPE_FOR_ACTOR");
    expect(result.reason).toContain("actor_role_not_authorized");
    expectInvariants(result);
  });

  it("denies when lifecycle state blocks readout", () => {
    const result = evaluateReadoutEligibility({
      ...baseInput,
      lifecycleState: "disputed",
    });

    expect(result.state).toBe("READOUT_DENIED");
    expect(result.reason).toContain("disputed");
    expectInvariants(result);
  });

  it("flags stale memory for refresh", () => {
    const result = evaluateReadoutEligibility({
      ...baseInput,
      stale: true,
    });

    expect(result.state).toBe("STALE_NEEDS_REFRESH");
    expect(result.reason).toContain("stale");
    expectInvariants(result);
  });
});
