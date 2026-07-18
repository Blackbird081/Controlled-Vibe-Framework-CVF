import type { Clock, IdFactory, RefineryRunInput } from "cvf-refinery";
import { RefineryEngine, computeRefineryPacketHash } from "cvf-refinery";
import { TruthKernel } from "cvf-truth-kernel";
import type { EvidenceRecord, RefineryPacketRef } from "cvf-truth-kernel";
import { DistributionEngine, KernelAuthorityBoundary } from "cvf-truth-flow";
import type { CanonicalScenarioEvidence } from "./evidence/canonical-evidence.js";

export type OrchestratorFailureStage =
  | "REFINERY_NOT_RELEASED"
  | "KERNEL_NOT_ACCEPTED"
  | "REFERENCE_NOT_ACTIVE"
  | "FLOW_NOT_CREATED"
  | "FLOW_DELIVERY_REJECTED"
  | "FLOW_CONSUMPTION_REJECTED"
  | "FLOW_ACKNOWLEDGEMENT_REJECTED";

export interface OrchestratorResult {
  succeeded: boolean;
  failureStage: OrchestratorFailureStage | null;
  evidence: CanonicalScenarioEvidence;
}

export interface ScenarioInput {
  scenarioId: string;
  refineryInput: RefineryRunInput;
  evidenceProvenanceLabel: EvidenceRecord["provenance_label"];
  kernelAuthorizedPolicyVersion: string;
  kernelAuthorizedRuleVersion: string;
  requestedPolicyVersion: string;
  requestedRuleVersion: string;
  distributionRecipient: string;
  distributionRole: string;
  distributionTask: string;
  distributionPhase: string;
  distributionDose: string;
  distributionExpiryUtc: string;
  referenceScope: string;
  referenceVersion: string;
  referenceValidFromUtc: string;
  referenceValidUntilUtc: string;
  actionTimeUtcIso: string;
}

/**
 * Thin integration orchestrator: invokes the real RefineryEngine,
 * TruthKernel, and DistributionEngine instances in sequence, using each
 * layer's own public API and its own accept/reject decision. This module
 * never re-derives normalization, conflict resolution, trust evaluation,
 * receipt hashing, reference-state resolution, routing, dose, or lifecycle
 * transitions; it maps and serializes each layer's own output only.
 */
export function runThreeLayerScenario(
  input: ScenarioInput,
  clock: Clock,
  ids: IdFactory,
): OrchestratorResult {
  const refinery = new RefineryEngine(clock, ids);
  const refineryResult = refinery.run(input.refineryInput);
  const packet = refineryResult.packet;

  const firstSource = input.refineryInput.sourceEnvelopes[0];

  const baseEvidence: CanonicalScenarioEvidence = {
    scenario_id: input.scenarioId,
    source: {
      source_id: firstSource?.source_id ?? "",
      source_type: firstSource?.source_type ?? "",
      scope: {
        organization: packet.declared_scope.organization,
        country: packet.declared_scope.country ?? null,
        project: packet.declared_scope.project ?? null,
        customer: packet.declared_scope.customer ?? null,
      },
    },
    refinery: {
      refinery_packet_id: packet.refinery_packet_id,
      status: packet.status,
      failure_tokens: [...packet.failure_tokens],
      conflict_set_count: packet.conflict_sets.length,
      conflict_sets: packet.conflict_sets.map((item) => structuredClone(item)),
    },
    kernel: {
      decision_id: "",
      decision: "",
      receipt_id: "",
      receipt_status: "",
      reference_id: null,
      reference_state: null,
    },
    flow: {
      package_id: null,
      routing_decision: null,
      dose: null,
      acknowledgement_state: null,
      delivery_succeeded: false,
      consumption_succeeded: false,
    },
    terminal_state: "",
  };

  if (packet.status !== "READY_FOR_KERNEL") {
    return {
      succeeded: false,
      failureStage: "REFINERY_NOT_RELEASED",
      evidence: { ...baseEvidence, terminal_state: "REFINERY_NOT_RELEASED" },
    };
  }

  const kernel = new TruthKernel(
    clock,
    ids,
    input.kernelAuthorizedPolicyVersion,
    input.kernelAuthorizedRuleVersion,
  );

  const packetRef: RefineryPacketRef = {
    refinery_packet_id: packet.refinery_packet_id,
    content_hash: computeRefineryPacketHash(packet),
    declared_scope: packet.declared_scope,
    status: packet.status,
  };
  kernel.registerPacket(packetRef);

  const evidenceId = ids.nextId("EV");
  const evidenceRecord: EvidenceRecord = {
    evidence_id: evidenceId,
    bound_packet_id: packet.refinery_packet_id,
    bound_source_id: firstSource?.source_id ?? "",
    provenance_label: input.evidenceProvenanceLabel,
    captured_at_utc: firstSource?.captured_at_utc ?? clock.nowUtcIso(),
    valid_until_utc: null,
  };
  kernel.registerEvidence(evidenceRecord);

  const requestId = ids.nextId("REQ");
  const { decision, receipt } = kernel.evaluate({
    requestId,
    packetHash: packetRef.content_hash,
    packetReference: packetRef.refinery_packet_id,
    policyVersion: input.requestedPolicyVersion,
    ruleVersion: input.requestedRuleVersion,
    evidenceRefs: [evidenceId],
    obligationRefs: [],
    verificationMode: "STRICT",
    requestedDecisionContext: input.scenarioId,
  });

  const withKernel: CanonicalScenarioEvidence = {
    ...baseEvidence,
    kernel: {
      decision_id: decision.decision_id,
      decision: decision.decision,
      receipt_id: receipt.receipt_id,
      receipt_status: receipt.status,
      reference_id: null,
      reference_state: null,
    },
  };

  if (decision.decision !== "ACCEPT_EVIDENCE_CANDIDATE") {
    return {
      succeeded: false,
      failureStage: "KERNEL_NOT_ACCEPTED",
      evidence: { ...withKernel, terminal_state: "KERNEL_NOT_ACCEPTED" },
    };
  }

  const issuance = kernel.issueReference(
    receipt.receipt_id,
    input.referenceScope,
    input.referenceVersion,
    input.referenceValidFromUtc,
    input.referenceValidUntilUtc,
  );

  if (!issuance.issued || !issuance.reference) {
    return {
      succeeded: false,
      failureStage: "REFERENCE_NOT_ACTIVE",
      evidence: { ...withKernel, terminal_state: "REFERENCE_NOT_ACTIVE" },
    };
  }

  const withReference: CanonicalScenarioEvidence = {
    ...withKernel,
    kernel: {
      ...withKernel.kernel,
      reference_id: issuance.reference.reference_id,
      reference_state: issuance.reference.reference_state,
    },
  };

  const authority = new KernelAuthorityBoundary(kernel);
  const flow = new DistributionEngine(authority, ids);

  const created = flow.create({
    recipient: input.distributionRecipient,
    role: input.distributionRole,
    task: input.distributionTask,
    phase: input.distributionPhase,
    truthReferences: [issuance.reference.reference_id],
    dose: input.distributionDose,
    restrictions: [],
    expiryUtc: input.distributionExpiryUtc,
    actionTimeUtcIso: input.actionTimeUtcIso,
  });

  if (!created.created || !created.distributionPackage) {
    return {
      succeeded: false,
      failureStage: "FLOW_NOT_CREATED",
      evidence: { ...withReference, terminal_state: "FLOW_NOT_CREATED" },
    };
  }

  const packageId = created.distributionPackage.package_id;
  const delivered = flow.deliverOrConsume(packageId, input.actionTimeUtcIso);
  if (!delivered.succeeded) {
    return {
      succeeded: false,
      failureStage: "FLOW_DELIVERY_REJECTED",
      evidence: { ...withReference, terminal_state: "FLOW_DELIVERY_REJECTED" },
    };
  }

  const consumed = flow.deliverOrConsume(packageId, input.actionTimeUtcIso);
  if (!consumed.succeeded) {
    return {
      succeeded: false,
      failureStage: "FLOW_CONSUMPTION_REJECTED",
      evidence: { ...withReference, terminal_state: "FLOW_CONSUMPTION_REJECTED" },
    };
  }

  const acknowledged = flow.acknowledge(packageId, input.actionTimeUtcIso);
  if (!acknowledged.succeeded || !acknowledged.distributionPackage) {
    return {
      succeeded: false,
      failureStage: "FLOW_ACKNOWLEDGEMENT_REJECTED",
      evidence: { ...withReference, terminal_state: "FLOW_ACKNOWLEDGEMENT_REJECTED" },
    };
  }

  const finalEvidence: CanonicalScenarioEvidence = {
    ...withReference,
    flow: {
      package_id: created.distributionPackage.package_id,
      routing_decision: created.distributionPackage.routing_decision,
      dose: created.distributionPackage.dose,
      acknowledgement_state: acknowledged.distributionPackage.acknowledgement_state,
      delivery_succeeded: true,
      consumption_succeeded: true,
    },
    terminal_state: acknowledged.distributionPackage.acknowledgement_state,
  };

  return { succeeded: true, failureStage: null, evidence: finalEvidence };
}
