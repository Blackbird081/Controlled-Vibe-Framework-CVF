import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMORY_EXECUTION_ADVISORY_VERSION, buildMemoryAdvisoryReadout } from './route-memory-advisory';
import type { ExecutionRequest } from '@/lib/ai';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown) => ({ body }),
  },
}));

vi.mock('@/lib/control-plane-events', () => ({
  appendAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/durable-memory-route', () => ({
  evaluateDurableMemoryWrite: vi.fn().mockReturnValue({ receiptId: 'durable-write' }),
  resolveDurableMemoryActorRole: vi.fn().mockReturnValue('SERVICE_AGENT'),
}));

vi.mock('@/lib/execute-telemetry', () => ({
  emitExecutionTelemetry: vi.fn().mockResolvedValue(undefined),
  resolveTokenUsage: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/phase2c-product-brief-slice', () => ({
  buildPhase2CProductBriefSliceForRoute: vi.fn().mockReturnValue(undefined),
}));

vi.mock('@/lib/phase3e-operational-emission', () => ({
  buildPhase3EOperationalMetricsForRoute: vi.fn().mockReturnValue({ metrics: true }),
}));

vi.mock('@/lib/audit-memory-receipt', () => ({
  buildRouteAuditMemoryCapture: vi.fn().mockReturnValue({
    auditMemoryReceipt: {
      receipt: {
        receiptId: 'audit-1',
        memoryIds: [],
        decision: 'captured',
      },
    },
    auditEventPayload: { payload: {} },
  }),
}));

vi.mock('@/lib/route-request-context-readout', () => ({
  buildRouteRequestContextReadout: vi.fn().mockReturnValue({ context: true }),
}));

vi.mock('@/lib/vertical-integration-readout', () => ({
  buildVerticalIntegrationReadout: vi.fn().mockReturnValue({ vertical: true }),
}));

vi.mock('@/lib/web-governance-envelope', () => ({
  buildEvidenceReceipt: vi.fn().mockReturnValue({
    receiptId: 'gov-1',
    envelopeId: 'env-1',
    governanceTrace: [],
  }),
}));

vi.mock('@/lib/workflows/workflow-resolver', () => ({
  buildWorkflowExecutionProjection: vi.fn().mockReturnValue(undefined),
}));

vi.mock('@/lib/middleware-auth', () => ({
  withSessionAuditPayload: (_session: unknown, payload?: Record<string, unknown>) => payload,
}));

vi.mock('./route-response-readouts', () => ({
  buildExecuteResponseReadouts: vi.fn().mockReturnValue({
    responseReadout: true,
    learningPlaneReadout: {
      compositeScore: 100,
      scoreClass: 'STRONG',
    },
  }),
}));

import { buildExecuteFinalResponse } from './route-final-response';

const baseRequest: ExecutionRequest = {
  templateId: 'tmpl-1',
  templateName: 'Template Advisory',
  intent: 'Summarize advisory-only memory context',
  inputs: { prompt: 'Hello' },
  provider: 'openai',
};

type FinalResponseParams = Parameters<typeof buildExecuteFinalResponse>[0];
type TestResponseJson = {
  memoryAdvisoryReadout: {
    rawMemoryReleased: false;
    canReinject: false;
  };
  durableMemoryRead: {
    receiptId: string;
  };
};

describe('route-memory-advisory helper', () => {
  it('returns advisory projection with invariants', () => {
    const advisory = buildMemoryAdvisoryReadout({
      request: baseRequest,
      actorRole: 'HUMAN',
      actorId: 'user-1',
      sessionId: 'session-1',
    });

    expect(advisory.contractVersion).toBe(MEMORY_EXECUTION_ADVISORY_VERSION);
    expect(advisory.rawMemoryReleased).toBe(false);
    expect(advisory.canReinject).toBe(false);
    expect(advisory.runtimeProjection.rawMemoryReleased).toBe(false);
    expect(advisory.eligibility.rawMemoryReleased).toBe(false);
    expect(advisory.eligibility.canReinject).toBe(false);
  });

  it('omits raw memory content and keeps eligibility advisory-only', () => {
    const advisory = buildMemoryAdvisoryReadout({
      request: baseRequest,
      actorRole: 'unknown',
      actorId: 'user-2',
      sessionId: 'session-2',
    });

    const selected = advisory.runtimeProjection.retrievalResult?.selected ?? [];
    expect(selected.every((candidate) => (candidate as { content?: string }).content === undefined)).toBe(true);
    expect(advisory.eligibility.state).toBeDefined();
    expect(advisory.eligibility.canReinject).toBe(false);
    expect(advisory.eligibility.rawMemoryReleased).toBe(false);
  });
});

describe('execute final response memory advisory wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds advisory field to ALLOW response without altering durable memory receipt', async () => {
    const memoryAdvisoryReadout = buildMemoryAdvisoryReadout({
      request: baseRequest,
      actorRole: 'HUMAN',
      actorId: 'user-1',
      sessionId: 'session-1',
    });
    const responseParams = {
      aiResult: { success: true, output: 'ok', provider: 'openai', model: 'gpt-4o', memoryAdvisoryReadout },
      outputValidation: undefined,
      retryState: { attempt: 0, previousIssues: [] },
      request: baseRequest,
      template: undefined,
      routeStartedAtMs: Date.now(),
      session: null,
      serviceIdentity: null,
      isServiceAllowed: false,
      resolvedExecutionRole: { allowed: true, role: 'HUMAN', permissionRole: 'HUMAN', source: 'session', inputRole: 'human' },
      rolePermission: { allowed: true, role: 'HUMAN', outputClass: 'DEFAULT', profile: { name: 'default' } },
      enforcement: { status: 'ALLOW' },
      guardResult: { finalDecision: 'ALLOW' },
      routingResult: {
        decision: 'allow',
        selectedProvider: 'openai',
        rationale: 'test',
        deniedReason: null,
        fallbackChain: null,
      },
      govEnvelope: { policySnapshotId: 'snap-1' },
      knowledgeSource: 'none',
      knowledgeInjected: false,
      knowledgeContextLength: 0,
      requestedKnowledgeCollectionId: null,
      retrievalResult: { allowedChunkCount: 0, allowedCollectionIds: [], droppedCollectionIds: [] },
      approvedRequestRecord: null,
      aifMemoryReinjection: { receipt: { status: 'advisory' } },
      durableMemoryRoute: { receipt: { receiptId: 'durable-read' } },
      workflowBinding: undefined,
      executionTemplateId: 'tmpl-1',
      executionIdentity: { executionId: 'exec-1' },
      routedProvider: 'openai',
      isVisionExecution: false,
      requestedProvider: 'openai',
      filteredPrompt: 'prompt',
      actorRoleGate: { permitted: true, result: 'permitted' },
    } as unknown as FinalResponseParams;
    const response = await buildExecuteFinalResponse(responseParams);

    const json = (response as unknown as { body: TestResponseJson }).body;

    expect(json.memoryAdvisoryReadout).toBeDefined();
    expect(json.memoryAdvisoryReadout.rawMemoryReleased).toBe(false);
    expect(json.memoryAdvisoryReadout.canReinject).toBe(false);
    expect(json.durableMemoryRead).toEqual({ receiptId: 'durable-read' });
  });
});
