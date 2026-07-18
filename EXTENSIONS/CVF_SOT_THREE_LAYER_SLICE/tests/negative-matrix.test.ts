import { describe, it, expect } from "vitest";
import {
  DeterministicClock,
  SequentialIdFactory,
  computeRefineryPacketHash,
  REFINERY_PACKET_HASH_PROFILE,
  RefineryEngine,
} from "cvf-refinery";
import { TruthKernel } from "cvf-truth-kernel";
import { DistributionEngine, KernelAuthorityBoundary } from "cvf-truth-flow";
import * as orchestratorModule from "../src/orchestrator.js";
import { runThreeLayerScenario } from "../src/orchestrator.js";
import { internalScenario, projectScenario, POLICY_VERSION, RULE_VERSION } from "../src/scenarios/fixtures.js";

describe("SOT3-T6 negative test matrix", () => {
  it("Refinery result is not released -> Kernel call is not made; fails closed", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const scenario = internalScenario();
    // Break schema validity: declaredOwner empty makes computeSchemaValid()
    // false, which forces BLOCKED status (never READY_FOR_KERNEL).
    scenario.refineryInput.declaredOwner = "";

    const result = runThreeLayerScenario(scenario, clock, ids);

    expect(result.succeeded).toBe(false);
    expect(result.failureStage).toBe("REFINERY_NOT_RELEASED");
    expect(result.evidence.refinery.status).not.toBe("READY_FOR_KERNEL");
    expect(result.evidence.kernel.decision).toBe("");
    expect(result.evidence.kernel.receipt_id).toBe("");
  });

  it("Kernel does not issue an active reference -> Flow package is not created", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const scenario = internalScenario();
    // Force Kernel REJECT: the request's policy version diverges from the
    // Kernel's own authorized version, so admitRequest() rejects it.
    scenario.requestedPolicyVersion = "stale-policy-version";

    const result = runThreeLayerScenario(scenario, clock, ids);

    expect(result.succeeded).toBe(false);
    expect(result.failureStage).toBe("KERNEL_NOT_ACCEPTED");
    expect(result.evidence.kernel.decision).toBe("REJECT");
    expect(result.evidence.flow.package_id).toBeNull();
  });

  it("reference becomes revoked before action -> real Flow/Kernel authority path rejects", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const kernel = new TruthKernel(clock, ids, POLICY_VERSION, RULE_VERSION);

    kernel.registerPacket({
      refinery_packet_id: "RP-EXT-1",
      content_hash: "sha256:fixed",
      declared_scope: { organization: "cvf" },
      status: "READY_FOR_KERNEL",
    });
    kernel.registerEvidence({
      evidence_id: "EV-EXT-1",
      bound_packet_id: "RP-EXT-1",
      bound_source_id: "SRC-EXT-1",
      provenance_label: "SOURCE_BACKED",
      captured_at_utc: "2026-07-13T00:00:00Z",
      valid_until_utc: null,
    });
    const { receipt } = kernel.evaluate({
      requestId: "REQ-EXT-1",
      packetHash: "sha256:fixed",
      packetReference: "RP-EXT-1",
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-EXT-1"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "revocation-negative-case",
    });
    const issuance = kernel.issueReference(
      receipt.receipt_id,
      "scope-revoke",
      "v1",
      "2026-07-13T00:00:00Z",
      "2026-08-13T00:00:00Z",
    );
    expect(issuance.issued).toBe(true);
    const referenceId = issuance.reference!.reference_id;

    kernel.revokeReference(referenceId);

    const authority = new KernelAuthorityBoundary(kernel);
    const flow = new DistributionEngine(authority, ids);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-13T00:00:00Z",
      actionTimeUtcIso: "2026-07-13T00:00:05Z",
    });

    expect(created.created).toBe(false);
    expect(created.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("integration tries to mint receipt/reference or set Flow lifecycle directly -> boundary test fails at typecheck/API surface", () => {
    // The orchestrator's public surface exposes no receipt/reference/lifecycle
    // minting function of its own; only real TruthKernel.evaluate/issueReference
    // and DistributionEngine transitions produce those values. Assert the
    // orchestrator module does not export any such minting symbol.
    const orchestratorModuleKeys = Object.keys(orchestratorModule);
    expect(orchestratorModuleKeys).not.toContain("issueReceipt");
    expect(orchestratorModuleKeys).not.toContain("issueReference");
    expect(orchestratorModuleKeys).not.toContain("setAcknowledgementState");
  });

  it("evidence serializer omits source, scope, conflict, receipt, route, or lifecycle -> schema/test fails", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const result = runThreeLayerScenario(internalScenario(), clock, ids);

    const requiredKeys = [
      "scenario_id",
      "source",
      "refinery",
      "kernel",
      "flow",
      "terminal_state",
    ] as const;
    for (const key of requiredKeys) {
      expect(result.evidence).toHaveProperty(key);
    }
    expect(result.evidence.source).toHaveProperty("scope");
    expect(result.evidence.refinery).toHaveProperty("conflict_sets");
    expect(result.evidence.kernel).toHaveProperty("receipt_id");
    expect(result.evidence.flow).toHaveProperty("routing_decision");
    expect(result.evidence.flow).toHaveProperty("delivery_succeeded");
    expect(result.evidence.flow).toHaveProperty("consumption_succeeded");
  });

  it("same injected input repeated -> byte-equivalent evidence", () => {
    const clock1 = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids1 = new SequentialIdFactory();
    const result1 = runThreeLayerScenario(internalScenario(), clock1, ids1);

    const clock2 = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids2 = new SequentialIdFactory();
    const result2 = runThreeLayerScenario(internalScenario(), clock2, ids2);

    expect(JSON.stringify(result1.evidence)).toBe(JSON.stringify(result2.evidence));
  });

  it("caller supplies a digest for a different packet -> real Kernel admission rejects with PACKET_HASH_MISMATCH", () => {
    const clock = new DeterministicClock("2026-07-13T00:00:00Z", 1000);
    const ids = new SequentialIdFactory();
    const kernel = new TruthKernel(clock, ids, POLICY_VERSION, RULE_VERSION);

    const refinery = new RefineryEngine(clock, ids);
    const { packet: packetA } = refinery.run(internalScenario().refineryInput);
    const { packet: packetB } = refinery.run(projectScenario().refineryInput);

    // Register packetA under its own real hash, but present packetB's real
    // hash as the request's claimed packetHash - a genuine cross-packet
    // digest substitution, not a fabricated string.
    kernel.registerPacket({
      refinery_packet_id: packetA.refinery_packet_id,
      content_hash: computeRefineryPacketHash(packetA),
      declared_scope: packetA.declared_scope,
      status: packetA.status,
    });
    kernel.registerEvidence({
      evidence_id: "EV-MISMATCH-1",
      bound_packet_id: packetA.refinery_packet_id,
      bound_source_id: "SRC-MISMATCH-1",
      provenance_label: "SOURCE_BACKED",
      captured_at_utc: "2026-07-13T00:00:00Z",
      valid_until_utc: null,
    });

    const { decision } = kernel.evaluate({
      requestId: "REQ-MISMATCH-1",
      packetHash: computeRefineryPacketHash(packetB),
      packetReference: packetA.refinery_packet_id,
      policyVersion: POLICY_VERSION,
      ruleVersion: RULE_VERSION,
      evidenceRefs: ["EV-MISMATCH-1"],
      obligationRefs: [],
      verificationMode: "STRICT",
      requestedDecisionContext: "packet-hash-mismatch-negative-case",
    });

    expect(decision.decision).toBe("REJECT");
    expect(decision.reasons).toContain("PACKET_HASH_MISMATCH");
  });

  it("caller attempts another packet-hash profile -> unavailable, since the owner API exposes exactly one profile and no selector parameter", () => {
    // The Refinery owner API (computeRefineryPacketHash) takes exactly one
    // parameter, the packet itself, with no profile-selection argument.
    // A caller cannot request cvf.sotThreeLayer.refineryPacketHash.v2 (or
    // any other profile) because no such parameter or branch exists; the
    // unsupported-profile path is unavailable by construction, not merely
    // rejected at runtime.
    expect(computeRefineryPacketHash.length).toBe(1);
    expect(REFINERY_PACKET_HASH_PROFILE).toBe("cvf.sotThreeLayer.refineryPacketHash.v1");
  });
});
