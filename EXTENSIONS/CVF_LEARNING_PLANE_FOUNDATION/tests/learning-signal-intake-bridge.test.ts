import { describe, expect, it } from "vitest";
import {
  LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION,
  createLearningSignalIntakeBridge,
} from "../src/learning-signal-intake-bridge";

const now = () => "2026-05-29T20:00:00.000Z";

describe("LearningSignalIntakeBridge", () => {
  it("normalizes governance findings into learning feedback without autonomous mutation", () => {
    const bridge = createLearningSignalIntakeBridge({ now });

    const record = bridge.intake({
      sourceId: "finding-001",
      sourceArtifact: "docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_2026-05-29_NIGHT_SESSION.md",
      sourceSummary: "multi-provider attribution required operator reminder",
      lane: "GOVERNANCE_CONTROL_PLANE",
      defectClass: "MACHINE_GATE_GAP",
      severity: "high",
      disposition: "MACHINE_CHECK_ADDED",
      nextControlAction: "run multi-provider execution log guard",
      evidenceBasis: "GIT_VERIFIED",
    });

    expect(record.bridgeVersion).toBe(LEARNING_SIGNAL_INTAKE_BRIDGE_VERSION);
    expect(record.feedbackInput.feedbackClass).toBe("ACCEPT");
    expect(record.feedbackInput.priority).toBe("high");
    expect(record.autonomousMutationAuthorized).toBe(false);
    expect(record.requiresGovernanceWorkOrder).toBe(false);
    expect(record.recordId).toBeTruthy();
  });

  it("routes runtime/provider candidates as escalated feedback requiring a work order", () => {
    const bridge = createLearningSignalIntakeBridge({ now });

    const record = bridge.intake({
      sourceId: "pm2-empty-stream",
      sourceArtifact: "scripts/run_pm2_streaming_live_proof.py",
      sourceSummary: "streaming proof can exit success without enough stream validation",
      lane: "PROVIDER_OUTPUT_LEARNING",
      defectClass: "RUNTIME_SIGNAL_GAP",
      severity: "medium",
      disposition: "RUNTIME_LEARNING_CANDIDATE",
      nextControlAction: "create code-hardening work order for streaming proof assertions",
      evidenceBasis: "TEST_VERIFIED",
    });

    expect(record.feedbackInput.feedbackClass).toBe("ESCALATE");
    expect(record.feedbackInput.priority).toBe("medium");
    expect(record.requiresGovernanceWorkOrder).toBe(true);
    expect(record.autonomousMutationAuthorized).toBe(false);
  });

  it("keeps deterministic ids stable for the same signal input and clock", () => {
    const bridge = createLearningSignalIntakeBridge({ now });
    const input = {
      sourceId: "cost-ledger-gap",
      sourceArtifact: "docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_2026-05-29_NIGHT_SESSION.md",
      sourceSummary: "provider cost was unknown",
      lane: "COST_ECONOMICS_LEARNING" as const,
      defectClass: "RUNTIME_SIGNAL_GAP" as const,
      severity: "low" as const,
      disposition: "RUNTIME_LEARNING_CANDIDATE" as const,
      nextControlAction: "add provider economics ledger",
      evidenceBasis: "OPERATOR_REPORTED",
    };

    expect(bridge.intake(input).recordId).toBe(bridge.intake(input).recordId);
  });
});
