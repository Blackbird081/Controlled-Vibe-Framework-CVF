import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GatewayResult, GuardRequestContext, MandatoryGateway } from 'cvf-guard-contract';
import type { WebGovernanceEnvelope } from '@/lib/web-governance-envelope';

const appendAuditEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/control-plane-events', async () => {
  const actual = await vi.importActual<typeof import('@/lib/control-plane-events')>('@/lib/control-plane-events');
  return {
    ...actual,
    appendAuditEvent: appendAuditEventMock,
  };
});

import {
  evaluateRouteMandatoryGateway,
  isRouteMandatoryGatewayFailClosed,
  MANDATORY_GATEWAY_EVALUATED,
  runExecuteRouteMandatoryGateway,
} from './route-guard-gateway';

function makeContext(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'req-route-1',
    phase: 'BUILD',
    riskLevel: 'R1',
    role: 'AI_AGENT',
    action: 'execute:template',
    channel: 'web',
    metadata: { userRole: 'admin' },
    ...overrides,
  };
}

function makeEnvelope(): WebGovernanceEnvelope {
  return {
    envelopeId: 'env-1',
    routeId: 'execute',
    surfaceClass: 'governance-execution',
    evidenceMode: 'live',
    actorId: 'user-1',
    actorRole: 'admin',
    phase: 'BUILD',
    riskLevel: 'R1',
    policySnapshotId: 'policy-1',
    providerLane: null,
    auditEventIds: [],
    requestTimestamp: new Date().toISOString(),
    trancheRef: 'W112-T1',
  };
}

function makeFakeGateway(result: GatewayResult): MandatoryGateway {
  return {
    checkContext: vi.fn().mockReturnValue(result),
  } as unknown as MandatoryGateway;
}

function makeGatewayResult(overrides: Partial<GatewayResult> = {}): GatewayResult {
  return {
    allowed: true,
    decision: 'ALLOW',
    reason: 'Guard decision: ALLOW',
    bypassed: false,
    controlMode: 'governed',
    evidence: { requestId: 'req-route-1' },
    guardResult: {
      requestId: 'req-route-1',
      finalDecision: 'ALLOW',
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 1,
    },
    ...overrides,
  };
}

describe('evaluateRouteMandatoryGateway', () => {
  beforeEach(() => {
    appendAuditEventMock.mockReset();
    appendAuditEventMock.mockResolvedValue({ id: 'default-audit-id' });
  });

  it('calls the gateway exactly once with the exact context object', async () => {
    const context = makeContext();
    const gateway = makeFakeGateway(makeGatewayResult());
    await evaluateRouteMandatoryGateway({
      context,
      envelope: makeEnvelope(),
      actorId: 'user-1',
      actorRole: 'admin',
      targetResource: 'execute-route',
      gateway,
    });

    expect(gateway.checkContext).toHaveBeenCalledTimes(1);
    expect(gateway.checkContext).toHaveBeenCalledWith(context);
  });

  it('returns both gateway and pipeline results', async () => {
    const gatewayResult = makeGatewayResult();
    const gateway = makeFakeGateway(gatewayResult);
    appendAuditEventMock.mockResolvedValueOnce({ id: 'audit-1' });

    const result = await evaluateRouteMandatoryGateway({
      context: makeContext(),
      envelope: makeEnvelope(),
      actorId: 'user-1',
      actorRole: 'admin',
      targetResource: 'execute-route',
      gateway,
    });

    expect(result.gatewayResult).toBe(gatewayResult);
    expect(result.guardResult).toBe(gatewayResult.guardResult);
  });

  it.each([
    ['ALLOW', true, undefined, undefined],
    ['BLOCK', false, 'guard-x', undefined],
    ['ESCALATE', false, undefined, 'guard-y'],
  ] as const)(
    'appends one event with all seven projected fields for %s',
    async (decision, allowed, blockedBy, escalatedBy) => {
      const gatewayResult = makeGatewayResult({
        decision,
        allowed,
        evidence: { requestId: 'req-route-1', blockedBy, escalatedBy },
      });
      const gateway = makeFakeGateway(gatewayResult);

      await evaluateRouteMandatoryGateway({
        context: makeContext(),
        envelope: makeEnvelope(),
        actorId: 'user-1',
        actorRole: 'admin',
        targetResource: 'execute-route',
        gateway,
      });

      expect(appendAuditEventMock).toHaveBeenCalledTimes(1);
      const [callArg] = appendAuditEventMock.mock.calls[0];
      expect(callArg.eventType).toBe(MANDATORY_GATEWAY_EVALUATED);
      expect(callArg.payload).toEqual({
        gatewayDecision: decision,
        gatewayAllowed: allowed,
        gatewayBypassed: false,
        gatewayControlMode: 'governed',
        gatewayRequestId: 'req-route-1',
        gatewayBlockedBy: blockedBy,
        gatewayEscalatedBy: escalatedBy,
      });
    },
  );

  it('links the returned audit event ID into the envelope', async () => {
    const gateway = makeFakeGateway(makeGatewayResult());
    appendAuditEventMock.mockResolvedValueOnce({ id: 'linked-audit-id' });
    const envelope = makeEnvelope();

    await evaluateRouteMandatoryGateway({
      context: makeContext(),
      envelope,
      actorId: 'user-1',
      actorRole: 'admin',
      targetResource: 'execute-route',
      gateway,
    });

    expect(envelope.auditEventIds).toContain('linked-audit-id');
  });
});

describe('isRouteMandatoryGatewayFailClosed', () => {
  it('is false for ALLOW with a pipeline result', () => {
    const result = { gatewayResult: makeGatewayResult(), guardResult: makeGatewayResult().guardResult };
    expect(isRouteMandatoryGatewayFailClosed(result)).toBe(false);
  });

  it('is true for BLOCK', () => {
    const gatewayResult = makeGatewayResult({ decision: 'BLOCK', allowed: false });
    expect(isRouteMandatoryGatewayFailClosed({ gatewayResult, guardResult: gatewayResult.guardResult })).toBe(true);
  });

  it('is true for ESCALATE', () => {
    const gatewayResult = makeGatewayResult({ decision: 'ESCALATE', allowed: false });
    expect(isRouteMandatoryGatewayFailClosed({ gatewayResult, guardResult: gatewayResult.guardResult })).toBe(true);
  });

  it('is true for BYPASS even if allowed', () => {
    const gatewayResult = makeGatewayResult({ decision: 'BYPASS', allowed: true, bypassed: true, guardResult: undefined });
    expect(isRouteMandatoryGatewayFailClosed({ gatewayResult, guardResult: undefined })).toBe(true);
  });

  it('is true when the pipeline result is missing even if allowed', () => {
    const gatewayResult = makeGatewayResult({ guardResult: undefined });
    expect(isRouteMandatoryGatewayFailClosed({ gatewayResult, guardResult: undefined })).toBe(true);
  });

  it.each([
    ['BLOCK', false, makeGatewayResult().guardResult],
    ['ESCALATE', false, makeGatewayResult().guardResult],
    ['BYPASS', true, undefined],
    ['ALLOW', true, undefined],
  ] as const)(
    'stops %s before the caller invokes its provider seam',
    async (decision, allowed, guardResult) => {
      const provider = vi.fn();
      const alignedGuardResult = guardResult === undefined
        ? undefined
        : { ...guardResult, finalDecision: decision };
      const gatewayResult = makeGatewayResult({
        decision,
        allowed,
        bypassed: decision === 'BYPASS',
        guardResult: alignedGuardResult,
      });

      const outcome = await runExecuteRouteMandatoryGateway({
        context: makeContext(),
        envelope: makeEnvelope(),
        actorId: 'user-1',
        actorRole: 'admin',
        provider: 'openai',
        gateway: makeFakeGateway(gatewayResult),
      });
      if (!outcome.blockedResponse) {
        await provider();
      }

      expect(outcome.blockedResponse?.status).toBe(400);
      const responseBody = await outcome.blockedResponse?.json();
      expect(responseBody.governanceEvidenceReceipt.decision).toBe(decision);
      expect(provider).not.toHaveBeenCalled();
    },
  );
});
