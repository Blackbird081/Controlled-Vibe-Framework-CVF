import { describe, expect, it } from 'vitest';

import {
  PHASE_2B_PRIMARY_ROW_IDS,
  buildPhase2BRuntimeCoherenceGraph,
  validatePhase2BRuntimeCoherenceGraph,
  type Phase2BAdapterNode,
  type Phase2BPrimaryRowId,
} from './index';

import {
  DesignContract,
  OrchestrationContract,
  createAgentDefinitionBoundaryContract,
  createAgentGovernedSessionContract,
} from '../../../CVF_CONTROL_PLANE_FOUNDATION/src';
import type {
  AgentGovernedActionRequest,
  AgentPermissionProfile,
  ControlPlaneIntakeResult,
} from '../../../CVF_CONTROL_PLANE_FOUNDATION/src';
import type { Domain, ValidatedIntent } from '../../../CVF_ECO_v1.0_INTENT_VALIDATION/src/types';
import {
  GatewayReceiptBuilder,
  ProviderHealthMonitor,
  ProviderRegistry,
  QuotaLedger,
  ROUTING_POLICY_CONTRACT_VERSION,
  RoutingPolicyEngine,
  buildRoutingPolicyContractSnapshot,
} from '../../../CVF_MODEL_GATEWAY/src';
import {
  createControlledMemoryGatewayContract,
} from '../../../CVF_LEARNING_PLANE_FOUNDATION/src';

const FIXED_NOW = '2026-05-21T02:00:00.000Z';
const TRACE_ID = 'trace-phase2b-runtime-coherence';

function familyFor(rowId: Phase2BPrimaryRowId): Phase2BAdapterNode['family'] {
  if (rowId.startsWith('P-')) return 'policy';
  if (rowId.startsWith('R-')) return 'risk';
  if (rowId.startsWith('I-')) return 'identity';
  if (rowId.startsWith('E-')) return 'receipt';
  return 'memory';
}

function makeBaseInventory(): Phase2BAdapterNode[] {
  return PHASE_2B_PRIMARY_ROW_IDS.map((rowId) => ({
    rowId,
    family: familyFor(rowId),
    version: `phase2b-${rowId.toLowerCase()}-adapter-1`,
    source: `phase2b:${rowId}`,
    keys: {
      inventory: 'phase2b-46-primary-rows',
    },
  }));
}

function replaceNode(
  nodes: Phase2BAdapterNode[],
  replacement: Phase2BAdapterNode,
): Phase2BAdapterNode[] {
  return nodes.map((node) => node.rowId === replacement.rowId ? replacement : node);
}

function makeIntent(domain: Domain): ValidatedIntent {
  return {
    intent: {
      domain,
      action: 'compose',
      object: 'coherence graph',
      limits: {},
      requireApproval: false,
      confidence: 0.9,
      rawVibe: 'compose Phase 2.B coherence graph',
    },
    rules: [],
    constraints: [],
    timestamp: 0,
    pipelineVersion: '1.0',
    valid: true,
    errors: [],
  };
}

function makeIntakeResult(): ControlPlaneIntakeResult {
  const chunks = [
    {
      id: 'chunk-coherence',
      source: 'phase2b-runtime-coherence-test',
      content: 'Phase 2.B runtime coherence evidence',
      relevanceScore: 0.95,
    },
  ];

  return {
    requestId: 'intake-coherence',
    createdAt: FIXED_NOW,
    consumerId: 'consumer-coherence',
    intent: makeIntent('general'),
    retrieval: {
      query: 'phase2b coherence',
      chunkCount: chunks.length,
      totalCandidates: chunks.length,
      retrievalTimeMs: 1,
      tiersSearched: [],
      chunks,
    },
    packagedContext: {
      chunks,
      totalTokens: 64,
      tokenBudget: 512,
      truncated: false,
      snapshotHash: 'snapshot-coherence',
    },
    warnings: [],
  };
}

function makePermissionProfile(): AgentPermissionProfile {
  return {
    profileId: 'phase2b-coherence-profile',
    description: 'Phase 2.B coherence-only profile',
    fileAccess: {
      read: ['**/*'],
      write: ['docs/**'],
      deny: ['.env', 'secrets/**'],
    },
    toolAccess: {
      shell: false,
      network: false,
      testRunner: false,
      packageManager: false,
      database: false,
      deployment: false,
      secrets: false,
    },
    executionLimits: {
      maxFilesChanged: 2,
      maxCommands: 0,
      requiresApprovalAboveRisk: 'medium',
    },
    audit: {
      commandLogRequired: false,
      fileDiffRequired: true,
      receiptRequired: true,
    },
  };
}

function buildRuntimeCoherenceNodes(): Phase2BAdapterNode[] {
  let nodes = makeBaseInventory();
  const fixedNow = () => FIXED_NOW;

  const agent = createAgentDefinitionBoundaryContract({ now: fixedNow }).registerDefinition({
    name: 'phase2b-coherence-agent',
    role: 'executor',
    declaredCapabilities: ['write:handoff'],
    declaredDomains: ['governance'],
  });
  const sessionContract = createAgentGovernedSessionContract({ now: fixedNow });
  const request: AgentGovernedActionRequest = {
    sessionId: 'session-phase2b-coherence',
    taskId: 'task-phase2b-coherence',
    phase: 'runtime-coherence',
    requestedCapability: 'write:handoff',
    requestedAction: 'prepare Phase 2.B coherence evidence',
    actionType: 'documentation',
    riskLevel: 'low',
    agent,
    permissionProfile: makePermissionProfile(),
    filesRead: ['docs/reference/CVF_PHASE_2B_MIGRATION_PLAN_2026-05-20.md'],
    filesChanged: ['docs/reviews/CVF_PHASE_2B_RUNTIME_COHERENCE_COMPLETION_2026-05-21.md'],
    toolsRequested: [],
    commandCount: 0,
  };
  const decision = sessionContract.evaluateAction(request);
  const receiptInput = {
    decision,
    outputType: 'handoff' as const,
    outputSummary: 'Prepared Phase 2.B runtime coherence evidence.',
    validationRequired: false,
    validationResult: 'skipped' as const,
  };
  const agentReceipt = sessionContract.createReceipt(request, receiptInput);
  const workingMemory = sessionContract.createWorkingMemoryAdapterSnapshot(request, receiptInput);

  nodes = replaceNode(nodes, {
    rowId: 'E-01',
    family: 'receipt',
    version: 'phase2b-agent-governed-session-receipt-envelope-1',
    source: 'control-plane:agent-governed-session-contract',
    keys: {
      traceId: agentReceipt.traceId,
      receiptId: agentReceipt.receiptId,
      sessionId: agentReceipt.sessionId,
      taskId: agentReceipt.taskId,
    },
  });
  nodes = replaceNode(nodes, {
    rowId: 'M-01',
    family: 'memory',
    version: workingMemory.version,
    source: workingMemory.source,
    keys: {
      traceId: workingMemory.traceId,
      receiptId: workingMemory.receiptId,
      sessionId: workingMemory.sessionId,
      taskId: workingMemory.taskId,
    },
  });

  const design = new DesignContract({ now: fixedNow });
  const orchestration = new OrchestrationContract({ now: fixedNow });
  const { plan, adapter: designAdapter } = design.designWithAdapter(makeIntakeResult());
  const { adapter: orchestrationAdapter } = orchestration.orchestrateWithAdapter(plan);

  nodes = replaceNode(nodes, {
    rowId: 'I-02',
    family: 'identity',
    version: designAdapter.version,
    source: designAdapter.source,
    keys: {
      planId: designAdapter.planId,
    },
  });
  nodes = replaceNode(nodes, {
    rowId: 'I-03',
    family: 'identity',
    version: orchestrationAdapter.version,
    source: orchestrationAdapter.source,
    keys: {
      planId: orchestrationAdapter.planId,
      orchestrationId: orchestrationAdapter.orchestrationId,
    },
  });

  const routingParts = {
    registry: new ProviderRegistry([
      {
        id: 'dashscope',
        displayName: 'DashScope',
        status: 'enabled' as const,
        riskClass: 'medium' as const,
        models: [{ id: 'qwen-turbo', riskClass: 'medium' as const }],
      },
    ]),
    health: new ProviderHealthMonitor(() => new Date(FIXED_NOW)),
    quota: new QuotaLedger(() => new Date(FIXED_NOW)),
  };
  const routing = new RoutingPolicyEngine(
    routingParts.registry,
    routingParts.health,
    routingParts.quota,
  );
  const routingRequest = {
    traceId: TRACE_ID,
    requestedModelId: 'qwen-turbo',
    policy: { traceId: TRACE_ID, policyResult: 'allow' as const },
  };
  const routingDecision = routing.decide(routingRequest);
  const routingSnapshot = buildRoutingPolicyContractSnapshot(routingRequest, routingDecision);

  nodes = replaceNode(nodes, {
    rowId: 'P-06',
    family: 'policy',
    version: ROUTING_POLICY_CONTRACT_VERSION,
    source: routingSnapshot.source,
    keys: {
      traceId: routingSnapshot.traceId,
      policyDecision: routingSnapshot.policyResult,
    },
  });

  const gatewayReceipt = new GatewayReceiptBuilder(
    () => new Date(FIXED_NOW),
    () => 'phase2b',
  ).buildEnvelope({
    traceId: TRACE_ID,
    providerId: 'dashscope',
    selectedModelId: 'qwen-turbo',
    decision: 'selected',
    reason: 'policy_health_quota_selected',
    validationState: 'passed',
  });

  nodes = replaceNode(nodes, {
    rowId: 'E-04',
    family: 'receipt',
    version: gatewayReceipt.schemaVersion,
    source: gatewayReceipt.source,
    keys: {
      traceId: gatewayReceipt.payload.traceId,
      receiptId: gatewayReceipt.id,
    },
  });

  const memory = createControlledMemoryGatewayContract({
    now: fixedNow,
    estimateTokens: () => 4,
  });
  const memoryAdapter = memory.captureWithAdapter({
    sourceEvent: 'runtime_event:phase2b-coherence',
    content: 'Phase 2.B coherence memory with email test@example.com',
    kind: 'working',
    scope: 'session',
    sensitivity: 'internal',
    sessionId: 'session-phase2b-coherence',
    policy: {
      traceId: TRACE_ID,
      policyResult: 'allow',
      actorId: 'actor-phase2b-coherence',
      actorRole: 'reviewer',
      allowedScopes: ['session'],
      canWrite: true,
      canReinject: false,
    },
    provenance: {
      sourceClass: 'runtime_event',
      summary: 'Phase 2.B runtime coherence capture',
    },
  }).adapter;

  nodes = replaceNode(nodes, {
    rowId: 'M-04',
    family: 'memory',
    version: memoryAdapter.version,
    source: memoryAdapter.source,
    keys: {
      traceId: memoryAdapter.traceId,
      actorId: memoryAdapter.actorId,
      memoryId: memoryAdapter.memoryIds[0] ?? 'no-memory',
    },
  });

  return nodes;
}

describe('Phase 2.B runtime coherence graph', () => {
  it('passes the internal adapter graph with all 46 primary rows and joined runtime keys', () => {
    const graph = buildPhase2BRuntimeCoherenceGraph({
      evidenceMode: 'internal_fixture',
      nodes: buildRuntimeCoherenceNodes(),
      edges: [
        { from: 'E-01', to: 'M-01', key: 'traceId', reason: 'working memory cites agent execution trace' },
        { from: 'E-01', to: 'M-01', key: 'receiptId', reason: 'working memory cites agent receipt' },
        { from: 'I-02', to: 'I-03', key: 'planId', reason: 'orchestration consumes design plan' },
        { from: 'P-06', to: 'E-04', key: 'traceId', reason: 'gateway receipt cites routing trace' },
        { from: 'P-06', to: 'M-04', key: 'traceId', reason: 'memory gateway cites policy trace' },
      ],
    });

    const validation = validatePhase2BRuntimeCoherenceGraph(graph);

    expect(validation.status).toBe('passed');
    expect(validation.nodeCount).toBe(46);
    expect(validation.edgeCount).toBe(5);
    expect(validation.runtimeCoherenceProven).toBe(true);
    expect(validation.liveProofProven).toBe(false);
    expect(validation.adapterInventoryChecksum).toBe('fnv1a32:5d3d2dac');
  });

  it('fails when a primary Phase 2.B row is missing', () => {
    const graph = buildPhase2BRuntimeCoherenceGraph({
      evidenceMode: 'internal_fixture',
      nodes: buildRuntimeCoherenceNodes().filter((node) => node.rowId !== 'M-08'),
      edges: [],
    });

    const validation = validatePhase2BRuntimeCoherenceGraph(graph);

    expect(validation.status).toBe('failed');
    expect(validation.violations).toContain('missing_primary_row:M-08');
  });

  it('fails when joined trace ids diverge', () => {
    const nodes = buildRuntimeCoherenceNodes().map((node) => node.rowId === 'E-04'
      ? { ...node, keys: { ...node.keys, traceId: 'trace-mismatch' } }
      : node);
    const graph = buildPhase2BRuntimeCoherenceGraph({
      evidenceMode: 'internal_fixture',
      nodes,
      edges: [
        { from: 'P-06', to: 'E-04', key: 'traceId', reason: 'gateway receipt cites routing trace' },
      ],
    });

    const validation = validatePhase2BRuntimeCoherenceGraph(graph);

    expect(validation.status).toBe('failed');
    expect(validation.violations).toContain('edge_key_mismatch:P-06->E-04:traceId');
  });

  it('fails when runtime coherence tries to claim live provider evidence', () => {
    const graph = buildPhase2BRuntimeCoherenceGraph({
      evidenceMode: 'live_provider',
      nodes: buildRuntimeCoherenceNodes(),
      edges: [],
    });

    const validation = validatePhase2BRuntimeCoherenceGraph(graph);

    expect(validation.status).toBe('failed');
    expect(validation.violations).toContain('runtime_coherence_must_not_claim_live_provider_evidence');
  });

  it('fails when forbidden public/live claims are bundled into coherence', () => {
    const graph = buildPhase2BRuntimeCoherenceGraph({
      evidenceMode: 'internal_fixture',
      nodes: buildRuntimeCoherenceNodes(),
      edges: [],
      forbiddenClaims: ['live_governance_proof', 'global_freeze_lift'],
    });

    const validation = validatePhase2BRuntimeCoherenceGraph(graph);

    expect(validation.status).toBe('failed');
    expect(validation.violations).toContain('forbidden_claim:live_governance_proof');
    expect(validation.violations).toContain('forbidden_claim:global_freeze_lift');
  });
});
