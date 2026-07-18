import { describe, it, expect } from "vitest";
import { DeterministicClock, SequentialIdFactory } from "cvf-refinery";
import { runThreeLayerScenario } from "../src/orchestrator.js";
import { internalScenario, projectScenario, marketSourceScenario } from "../src/scenarios/fixtures.js";

describe("SOT3-T6 three-layer positive scenarios", () => {
  it("INTERNAL scenario traverses Refinery -> Kernel -> Flow and reaches terminal ACKNOWLEDGED", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const result = runThreeLayerScenario(internalScenario(), clock, ids);

    expect(result.succeeded).toBe(true);
    expect(result.failureStage).toBeNull();
    expect(result.evidence.refinery.status).toBe("READY_FOR_KERNEL");
    expect(result.evidence.refinery.conflict_set_count).toBe(0);
    expect(result.evidence.kernel.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(result.evidence.kernel.receipt_status).toBe("ISSUED");
    expect(result.evidence.kernel.reference_state).toBe("ACTIVE");
    expect(result.evidence.flow.delivery_succeeded).toBe(true);
    expect(result.evidence.flow.consumption_succeeded).toBe(true);
    expect(result.evidence.flow.acknowledgement_state).toBe("ACKNOWLEDGED");
    expect(result.evidence.terminal_state).toBe("ACKNOWLEDGED");
  });

  it("PROJECT scenario traverses all three real layer instances", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const result = runThreeLayerScenario(projectScenario(), clock, ids);

    expect(result.succeeded).toBe(true);
    expect(result.evidence.refinery.status).toBe("READY_FOR_KERNEL");
    expect(result.evidence.kernel.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(result.evidence.flow.package_id).not.toBeNull();
    expect(result.evidence.flow.routing_decision).toContain(result.evidence.kernel.reference_id);
  });

  it("MARKET_SOURCE scenario traverses all three real layer instances", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const result = runThreeLayerScenario(marketSourceScenario(), clock, ids);

    expect(result.succeeded).toBe(true);
    expect(result.evidence.refinery.status).toBe("READY_FOR_KERNEL");
    expect(result.evidence.kernel.decision).toBe("ACCEPT_EVIDENCE_CANDIDATE");
    expect(result.evidence.flow.dose).toBe("summary");
  });

  it("evidence preserves source, scope, conflict, receipt, reference, route, dose, and lifecycle fields", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const result = runThreeLayerScenario(internalScenario(), clock, ids);

    expect(result.evidence.source.source_id).toBeTruthy();
    expect(result.evidence.source.scope.organization).toBe("cvf");
    expect(result.evidence.refinery.conflict_sets).toEqual([]);
    expect(result.evidence.kernel.receipt_id).toBeTruthy();
    expect(result.evidence.kernel.reference_id).toBeTruthy();
    expect(result.evidence.flow.routing_decision).toBeTruthy();
    expect(result.evidence.flow.dose).toBeTruthy();
    expect(result.evidence.terminal_state).toBeTruthy();
    expect(result.evidence.flow.delivery_succeeded).toBe(true);
    expect(result.evidence.flow.consumption_succeeded).toBe(true);
  });
});
