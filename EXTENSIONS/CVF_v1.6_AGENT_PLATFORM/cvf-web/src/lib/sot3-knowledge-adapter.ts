/**
 * SOT3-ACT-A1 - Scoped Knowledge Context Product Adapter
 *
 * Focused CVF Web product adapter that evaluates already-scope-filtered
 * knowledge chunks through the real Refinery, Truth Kernel, and Truth Flow
 * public APIs before knowledge context is eligible for injection into the
 * execute route's provider prompt. This module is the sole product-side
 * owner of that lifecycle; it deliberately does not import
 * `cvf-sot-three-layer-slice` (scenario-shaped, not a product policy owner)
 * and does not implement SOT3 lifecycle logic in `route.ts`.
 *
 * Authorization: docs/work_orders/CVF_AGENT_WORK_ORDER_SOT3_ACT_A1_SCOPED_KNOWLEDGE_CONTEXT_PRODUCT_ADAPTER_2026-07-13.md
 */
import type { Clock, IdFactory, RefineryRunInput } from 'cvf-refinery';
import { RefineryEngine, computeRefineryPacketHash } from 'cvf-refinery';
import type { SourceEnvelope } from 'cvf-refinery';
import { TruthKernel } from 'cvf-truth-kernel';
import type { EvidenceRecord, RefineryPacketRef, KernelDecision, TruthReceipt, TruthReference } from 'cvf-truth-kernel';
import { DistributionEngine, KernelAuthorityBoundary } from 'cvf-truth-flow';
import type { DistributionConsumptionBinding, DistributionPackage } from 'cvf-truth-flow';
import type { Sot3KnowledgeSourceMetadata } from './knowledge-store';

export type Sot3KnowledgeActivationMode = 'OFF' | 'SHADOW' | 'ENFORCE';

export type Sot3KnowledgeFailureStage =
  | 'NO_CHUNKS'
  | 'MISSING_PROVENANCE'
  | 'REFINERY_NOT_READY'
  | 'KERNEL_NOT_ACCEPTED'
  | 'REFERENCE_NOT_ACTIVE'
  | 'FLOW_NOT_CREATED'
  | 'FLOW_DELIVERY_REJECTED'
  | 'FLOW_CONSUMPTION_REJECTED'
  | 'FLOW_ACKNOWLEDGEMENT_REJECTED'
  | 'EVIDENCE_PERSISTENCE_FAILED';

export type Sot3KnowledgeTerminalOutcome = 'APPROVED' | 'REJECTED' | 'NO_CONTEXT';

export interface Sot3KnowledgeChunkInput {
  id: string;
  content: string;
  collectionId: string;
  sot3Source: Sot3KnowledgeSourceMetadata | undefined;
}

/**
 * One complete, source-backed Source-to-Flow lifecycle trace for a single
 * evaluated chunk. Every field is copied from an actual owner output
 * (Refinery/Kernel/Flow); none are invented, defaulted, or reconstructed
 * from a parallel ID array. `null` marks a stage that was never reached
 * because an earlier stage rejected.
 */
export interface Sot3KnowledgeLifecycleTrace {
  chunkId: string;
  collectionId: string;
  sourceId: string | null;
  terminalOutcome: Sot3KnowledgeTerminalOutcome;
  failureStage: Sot3KnowledgeFailureStage | null;
  refineryPacketId: string | null;
  refineryPacketHash: string | null;
  refineryStatus: string | null;
  kernelDecision: KernelDecision | null;
  truthReceipt: TruthReceipt | null;
  truthReference: TruthReference | null;
  flowPackage: DistributionPackage | null;
}

export interface Sot3KnowledgeEvaluationInput {
  chunks: Sot3KnowledgeChunkInput[];
  organization: string;
  team: string | null;
  actorId: string;
  requestId: string;
  policyVersion: string;
  ruleVersion: string;
  clock: Clock;
  ids: IdFactory;
}

export interface Sot3KnowledgeActivationResult {
  mode: Sot3KnowledgeActivationMode;
  terminalOutcome: Sot3KnowledgeTerminalOutcome;
  injectionPermitted: boolean;
  approvedContext: string | null;
  failureStage: Sot3KnowledgeFailureStage | null;
  refineryPacketId: string | null;
  refineryPacketIds: string[];
  refineryStatus: string | null;
  kernelDecisionId: string | null;
  kernelDecisionIds: string[];
  kernelDecision: string | null;
  kernelEvidenceCount: number;
  truthReferenceId: string | null;
  truthReferenceIds: string[];
  flowPackageId: string | null;
  flowPackageIds: string[];
  flowAcknowledgementState: string | null;
  traces: Sot3KnowledgeLifecycleTrace[];
}

function noContextResult(mode: Sot3KnowledgeActivationMode): Sot3KnowledgeActivationResult {
  return {
    mode,
    terminalOutcome: 'NO_CONTEXT',
    injectionPermitted: false,
    approvedContext: null,
    failureStage: 'NO_CHUNKS',
    refineryPacketId: null,
    refineryPacketIds: [],
    refineryStatus: null,
    kernelDecisionId: null,
    kernelDecisionIds: [],
    kernelDecision: null,
    kernelEvidenceCount: 0,
    truthReferenceId: null,
    truthReferenceIds: [],
    flowPackageId: null,
    flowPackageIds: [],
    flowAcknowledgementState: null,
    traces: [],
  };
}

function rejectedResult(
  mode: Sot3KnowledgeActivationMode,
  failureStage: Sot3KnowledgeFailureStage,
  partial: Partial<Sot3KnowledgeActivationResult> = {},
): Sot3KnowledgeActivationResult {
  return {
    mode,
    terminalOutcome: 'REJECTED',
    injectionPermitted: false,
    approvedContext: null,
    failureStage,
    refineryPacketId: null,
    refineryPacketIds: [],
    refineryStatus: null,
    kernelDecisionId: null,
    kernelDecisionIds: [],
    kernelDecision: null,
    kernelEvidenceCount: 0,
    truthReferenceId: null,
    truthReferenceIds: [],
    flowPackageId: null,
    flowPackageIds: [],
    flowAcknowledgementState: null,
    traces: [],
    ...partial,
  };
}

function buildSourceEnvelope(
  chunk: Sot3KnowledgeChunkInput,
  organization: string,
  team: string | null,
): SourceEnvelope | null {
  const meta = chunk.sot3Source;
  if (!meta) return null;
  return {
    source_id: meta.sourceId,
    source_type: meta.sourceType,
    owner: meta.owner,
    captured_at_utc: meta.capturedAtUtc,
    scope: { organization, project: team ?? null },
    purpose: [...meta.purpose],
    confidentiality: meta.confidentiality,
    content_hash: meta.expectedContentHash,
    raw_reference: { ...meta.rawReference },
    status: meta.captureStatus,
    declared_version: meta.declaredVersion ?? null,
    valid_from_utc: meta.validFromUtc ?? null,
    valid_until_utc: meta.validUntilUtc ?? null,
  };
}

function formatApprovedContext(chunks: Sot3KnowledgeChunkInput[]): string {
  return chunks.map((chunk) => `- ${chunk.content}`).join('\n');
}

/**
 * Evaluates already scope-filtered knowledge chunks through Refinery,
 * Kernel, and Flow. Organization/team scope is taken only from the caller's
 * already-authorized retrieval scope; this function never widens or
 * substitutes scope. Returns an explicit terminal outcome and failure stage
 * for every non-approved path; never returns raw chunk content as a
 * recovery path when the outcome is REJECTED.
 */
function evaluateSingleSot3KnowledgeChunk(
  input: Sot3KnowledgeEvaluationInput,
  mode: Sot3KnowledgeActivationMode,
): Sot3KnowledgeActivationResult {
  if (input.chunks.length === 0) {
    return noContextResult(mode);
  }

  const chunk = input.chunks[0];
  const traceBase: Pick<Sot3KnowledgeLifecycleTrace, 'chunkId' | 'collectionId'> = {
    chunkId: chunk.id,
    collectionId: chunk.collectionId,
  };

  const envelopes: SourceEnvelope[] = [];
  for (const item of input.chunks) {
    const envelope = buildSourceEnvelope(item, input.organization, input.team);
    if (!envelope) {
      return rejectedResult(mode, 'MISSING_PROVENANCE', {
        traces: [{
          ...traceBase,
          sourceId: null,
          terminalOutcome: 'REJECTED',
          failureStage: 'MISSING_PROVENANCE',
          refineryPacketId: null,
          refineryPacketHash: null,
          refineryStatus: null,
          kernelDecision: null,
          truthReceipt: null,
          truthReference: null,
          flowPackage: null,
        }],
      });
    }
    envelopes.push(envelope);
  }

  const sourceId = envelopes[0]?.source_id ?? null;

  const refineryInput: RefineryRunInput = {
    sourceEnvelopes: envelopes,
    rawRecords: input.chunks.map((item) => ({ source_id: item.sot3Source!.sourceId, id: item.id, content: item.content })),
    ruleManifest: { manifest_id: 'cvf-web-knowledge-context', version: input.ruleVersion },
    declaredScope: { organization: input.organization, project: input.team ?? null },
    declaredOwner: envelopes[0]?.owner ?? '',
  };

  const refinery = new RefineryEngine(input.clock, input.ids);
  const refineryResult = refinery.run(refineryInput);
  const packet = refineryResult.packet;

  const packetHash = computeRefineryPacketHash(packet);

  if (packet.status !== 'READY_FOR_KERNEL') {
    return rejectedResult(mode, 'REFINERY_NOT_READY', {
      refineryPacketId: packet.refinery_packet_id,
      refineryPacketIds: [packet.refinery_packet_id],
      refineryStatus: packet.status,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'REFINERY_NOT_READY',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: null,
        truthReceipt: null,
        truthReference: null,
        flowPackage: null,
      }],
    });
  }

  const kernel = new TruthKernel(input.clock, input.ids, input.policyVersion, input.ruleVersion);

  const packetRef: RefineryPacketRef = {
    refinery_packet_id: packet.refinery_packet_id,
    content_hash: packetHash,
    declared_scope: packet.declared_scope,
    status: packet.status,
  };
  kernel.registerPacket(packetRef);

  const evidenceRefs = envelopes.map((source) => {
    const evidenceId = input.ids.nextId('EV');
    const evidenceRecord: EvidenceRecord = {
      evidence_id: evidenceId,
      bound_packet_id: packet.refinery_packet_id,
      bound_source_id: source.source_id,
      provenance_label: source.status === 'REJECTED_AT_INTAKE' ? 'MISSING_EVIDENCE' : 'SOURCE_BACKED',
      captured_at_utc: source.captured_at_utc,
      valid_until_utc: source.valid_until_utc ?? null,
    };
    kernel.registerEvidence(evidenceRecord);
    return evidenceId;
  });

  const { decision, receipt } = kernel.evaluate({
    requestId: input.requestId,
    packetHash,
    packetReference: packet.refinery_packet_id,
    policyVersion: input.policyVersion,
    ruleVersion: input.ruleVersion,
    evidenceRefs,
    obligationRefs: [],
    verificationMode: 'STRICT',
    requestedDecisionContext: input.requestId,
  });

  const decisionTrace: Sot3KnowledgeLifecycleTrace['kernelDecision'] = {
    ...decision,
    reasons: [...decision.reasons],
    failed_obligations: [...decision.failed_obligations],
    verification_result_refs: [...decision.verification_result_refs],
  };
  const receiptTrace: Sot3KnowledgeLifecycleTrace['truthReceipt'] = {
    ...receipt,
    evidence_refs: [...receipt.evidence_refs],
    obligation_refs: [...receipt.obligation_refs],
    verification_result_refs: [...receipt.verification_result_refs],
  };

  const kernelBase = {
    refineryPacketId: packet.refinery_packet_id,
    refineryPacketIds: [packet.refinery_packet_id],
    refineryStatus: packet.status,
    kernelDecisionId: decision.decision_id,
    kernelDecisionIds: [decision.decision_id],
    kernelDecision: decision.decision,
    kernelEvidenceCount: evidenceRefs.length,
  };

  if (decision.decision !== 'ACCEPT_EVIDENCE_CANDIDATE') {
    return rejectedResult(mode, 'KERNEL_NOT_ACCEPTED', {
      ...kernelBase,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'KERNEL_NOT_ACCEPTED',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: null,
        flowPackage: null,
      }],
    });
  }

  const validFromUtc = input.clock.nowUtcIso();
  const validUntilMs = Date.parse(validFromUtc) + 5 * 60 * 1000;
  const validUntilUtc = new Date(validUntilMs).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const issuance = kernel.issueReference(
    receipt.receipt_id,
    input.organization,
    input.ruleVersion,
    validFromUtc,
    validUntilUtc,
  );

  if (!issuance.issued || !issuance.reference) {
    return rejectedResult(mode, 'REFERENCE_NOT_ACTIVE', {
      ...kernelBase,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'REFERENCE_NOT_ACTIVE',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: null,
        flowPackage: null,
      }],
    });
  }

  const referenceTrace: Sot3KnowledgeLifecycleTrace['truthReference'] = { ...issuance.reference };

  const withReference = {
    ...kernelBase,
    truthReferenceId: issuance.reference.reference_id,
    truthReferenceIds: [issuance.reference.reference_id],
  };

  const authority = new KernelAuthorityBoundary(kernel);
  const flow = new DistributionEngine(authority, input.ids);
  const actionTimeUtcIso = input.clock.nowUtcIso();

  // A4: the product adapter is always its own sole intended consumer, so its
  // creation-time routing fields ARE the strict consumption binding it will
  // assert back at delivery/consumption time. This is not a caller-supplied
  // approval boolean; every field here is the same literal value passed to
  // `flow.create` below, and `consumeFor` re-derives its own comparison
  // against the immutable stored package, never trusting this local copy.
  const consumptionBinding: DistributionConsumptionBinding = {
    recipient: input.actorId,
    role: 'execute-route-consumer',
    task: 'knowledge-context-injection',
    phase: 'PHASE_D_EXECUTE',
    dose: 'single-use-context',
  };

  const created = flow.create({
    recipient: consumptionBinding.recipient,
    role: consumptionBinding.role,
    task: consumptionBinding.task,
    phase: consumptionBinding.phase,
    truthReferences: [issuance.reference.reference_id],
    dose: consumptionBinding.dose,
    restrictions: [],
    expiryUtc: validUntilUtc,
    actionTimeUtcIso,
  });

  if (!created.created || !created.distributionPackage) {
    return rejectedResult(mode, 'FLOW_NOT_CREATED', {
      ...withReference,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'FLOW_NOT_CREATED',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: referenceTrace,
        flowPackage: null,
      }],
    });
  }

  const packageId = created.distributionPackage.package_id;
  const withPackage = { ...withReference, flowPackageId: packageId, flowPackageIds: [packageId] };
  const flowPackageTraceBase: Omit<NonNullable<Sot3KnowledgeLifecycleTrace['flowPackage']>, 'acknowledgement_state'> = {
    package_id: created.distributionPackage.package_id,
    recipient: created.distributionPackage.recipient,
    role: created.distributionPackage.role,
    task: created.distributionPackage.task,
    phase: created.distributionPackage.phase,
    truth_references: [...created.distributionPackage.truth_references],
    dose: created.distributionPackage.dose,
    restrictions: [...created.distributionPackage.restrictions],
    routing_decision: created.distributionPackage.routing_decision,
    expiry_utc: created.distributionPackage.expiry_utc,
  };

  const delivered = flow.consumeFor(packageId, consumptionBinding, actionTimeUtcIso);
  if (!delivered.succeeded) {
    return rejectedResult(mode, 'FLOW_DELIVERY_REJECTED', {
      ...withPackage,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'FLOW_DELIVERY_REJECTED',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: referenceTrace,
        flowPackage: { ...flowPackageTraceBase, acknowledgement_state: created.distributionPackage.acknowledgement_state },
      }],
    });
  }

  const consumed = flow.consumeFor(packageId, consumptionBinding, actionTimeUtcIso);
  if (!consumed.succeeded) {
    return rejectedResult(mode, 'FLOW_CONSUMPTION_REJECTED', {
      ...withPackage,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'FLOW_CONSUMPTION_REJECTED',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: referenceTrace,
        flowPackage: { ...flowPackageTraceBase, acknowledgement_state: delivered.distributionPackage?.acknowledgement_state ?? created.distributionPackage.acknowledgement_state },
      }],
    });
  }

  const acknowledged = flow.acknowledge(packageId, actionTimeUtcIso);
  if (!acknowledged.succeeded || !acknowledged.distributionPackage) {
    return rejectedResult(mode, 'FLOW_ACKNOWLEDGEMENT_REJECTED', {
      ...withPackage,
      traces: [{
        ...traceBase,
        sourceId,
        terminalOutcome: 'REJECTED',
        failureStage: 'FLOW_ACKNOWLEDGEMENT_REJECTED',
        refineryPacketId: packet.refinery_packet_id,
        refineryPacketHash: packetHash,
        refineryStatus: packet.status,
        kernelDecision: decisionTrace,
        truthReceipt: receiptTrace,
        truthReference: referenceTrace,
        flowPackage: { ...flowPackageTraceBase, acknowledgement_state: consumed.distributionPackage?.acknowledgement_state ?? created.distributionPackage.acknowledgement_state },
      }],
    });
  }

  return {
    mode,
    terminalOutcome: 'APPROVED',
    injectionPermitted: mode === 'ENFORCE',
    approvedContext: formatApprovedContext(input.chunks),
    failureStage: null,
    refineryPacketId: packet.refinery_packet_id,
    refineryPacketIds: [packet.refinery_packet_id],
    refineryStatus: packet.status,
    kernelDecisionId: decision.decision_id,
    kernelDecisionIds: [decision.decision_id],
    kernelDecision: decision.decision,
    kernelEvidenceCount: evidenceRefs.length,
    truthReferenceId: issuance.reference.reference_id,
    truthReferenceIds: [issuance.reference.reference_id],
    flowPackageId: packageId,
    flowPackageIds: [packageId],
    flowAcknowledgementState: acknowledged.distributionPackage.acknowledgement_state,
    traces: [{
      ...traceBase,
      sourceId,
      terminalOutcome: 'APPROVED',
      failureStage: null,
      refineryPacketId: packet.refinery_packet_id,
      refineryPacketHash: packetHash,
      refineryStatus: packet.status,
      kernelDecision: decisionTrace,
      truthReceipt: receiptTrace,
      truthReference: referenceTrace,
      flowPackage: { ...flowPackageTraceBase, acknowledgement_state: acknowledged.distributionPackage.acknowledgement_state },
    }],
  };
}

/**
 * Runs one complete SOT3 lifecycle per retrieved chunk. Refinery packets are
 * deliberately not shared across chunks: packet-level conflict and duplicate
 * semantics must not allow one chunk's evidence/reference to authorize a
 * different chunk. Context is approved only when every chunk reaches an
 * acknowledged Flow package.
 */
export function evaluateSot3KnowledgeActivation(
  input: Sot3KnowledgeEvaluationInput,
  mode: Sot3KnowledgeActivationMode,
): Sot3KnowledgeActivationResult {
  if (input.chunks.length === 0) {
    return noContextResult(mode);
  }

  const approved: Sot3KnowledgeActivationResult[] = [];
  for (const chunk of input.chunks) {
    const result = evaluateSingleSot3KnowledgeChunk({ ...input, chunks: [chunk] }, mode);
    if (result.terminalOutcome !== 'APPROVED') {
      return {
        ...result,
        refineryPacketIds: [...approved.flatMap((item) => item.refineryPacketIds), ...result.refineryPacketIds],
        kernelDecisionIds: [...approved.flatMap((item) => item.kernelDecisionIds), ...result.kernelDecisionIds],
        kernelEvidenceCount: approved.reduce((count, item) => count + item.kernelEvidenceCount, 0) + result.kernelEvidenceCount,
        truthReferenceIds: [...approved.flatMap((item) => item.truthReferenceIds), ...result.truthReferenceIds],
        flowPackageIds: [...approved.flatMap((item) => item.flowPackageIds), ...result.flowPackageIds],
        traces: [...approved.flatMap((item) => item.traces), ...result.traces],
      };
    }
    approved.push(result);
  }

  const terminal = approved[approved.length - 1];
  return {
    ...terminal,
    approvedContext: formatApprovedContext(input.chunks),
    refineryPacketIds: approved.flatMap((item) => item.refineryPacketIds),
    kernelDecisionIds: approved.flatMap((item) => item.kernelDecisionIds),
    kernelEvidenceCount: approved.reduce((count, item) => count + item.kernelEvidenceCount, 0),
    truthReferenceIds: approved.flatMap((item) => item.truthReferenceIds),
    flowPackageIds: approved.flatMap((item) => item.flowPackageIds),
    traces: approved.flatMap((item) => item.traces),
  };
}

/**
 * Resolves `CVF_SOT3_KNOWLEDGE_ACTIVATION_MODE` from the environment.
 * Missing, empty, or invalid values resolve to `OFF`.
 */
export function resolveSot3KnowledgeActivationMode(rawValue: string | undefined): Sot3KnowledgeActivationMode {
  if (rawValue === 'SHADOW' || rawValue === 'ENFORCE') return rawValue;
  return 'OFF';
}
