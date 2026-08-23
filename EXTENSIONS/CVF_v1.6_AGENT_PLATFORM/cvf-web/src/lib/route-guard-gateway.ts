/**
 * Route Guard Gateway Adapter
 * ============================
 * Evaluates a canonical GuardRequestContext through the mandatory gateway
 * exactly once, persists a secret-safe gateway audit event, links it into
 * the current governance envelope, and returns both the gateway result and
 * the underlying guard pipeline result for downstream route compatibility.
 *
 * @module lib/route-guard-gateway
 */

import { NextResponse } from 'next/server';
import type { GatewayResult, GuardPipelineResult, GuardRequestContext, MandatoryGateway } from 'cvf-guard-contract';
import { getSharedMandatoryGateway } from '@/lib/mandatory-gateway-singleton';
import { appendAuditEvent } from '@/lib/control-plane-events';
import {
  appendAuditEventToEnvelope,
  buildEvidenceReceipt,
  type WebGovernanceEnvelope,
} from '@/lib/web-governance-envelope';

export const MANDATORY_GATEWAY_EVALUATED = 'MANDATORY_GATEWAY_EVALUATED';

export interface EvaluateRouteMandatoryGatewayInput {
  context: GuardRequestContext;
  envelope: WebGovernanceEnvelope;
  actorId: string;
  actorRole: string;
  targetResource: string;
  gateway?: MandatoryGateway;
}

export interface EvaluateRouteMandatoryGatewayResult {
  gatewayResult: GatewayResult;
  guardResult: GuardPipelineResult | undefined;
}

/**
 * Evaluate the mandatory gateway exactly once for the given canonical
 * context, append one MANDATORY_GATEWAY_EVALUATED durable audit event, and
 * link its ID into the supplied envelope.
 */
export async function evaluateRouteMandatoryGateway(
  input: EvaluateRouteMandatoryGatewayInput,
): Promise<EvaluateRouteMandatoryGatewayResult> {
  const gateway = input.gateway ?? getSharedMandatoryGateway();
  const gatewayResult = gateway.checkContext(input.context);

  const auditEvent = await appendAuditEvent({
    eventType: MANDATORY_GATEWAY_EVALUATED,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetResource: input.targetResource,
    action: input.context.action,
    riskLevel: input.context.riskLevel,
    phase: input.context.phase,
    outcome: gatewayResult.decision,
    payload: {
      gatewayDecision: gatewayResult.decision,
      gatewayAllowed: gatewayResult.allowed,
      gatewayBypassed: gatewayResult.bypassed,
      gatewayControlMode: gatewayResult.controlMode,
      gatewayRequestId: gatewayResult.evidence?.requestId,
      gatewayBlockedBy: gatewayResult.evidence?.blockedBy,
      gatewayEscalatedBy: gatewayResult.evidence?.escalatedBy,
    },
  });

  appendAuditEventToEnvelope(input.envelope, auditEvent.id);

  return {
    gatewayResult,
    guardResult: gatewayResult.guardResult,
  };
}

/**
 * True when the gateway result must stop execution before any provider
 * routing: BLOCK, ESCALATE, BYPASS (forbidden for the execute route), a
 * missing pipeline result, or any other disallowed decision.
 */
export function isRouteMandatoryGatewayFailClosed(
  result: EvaluateRouteMandatoryGatewayResult,
): boolean {
  if (result.gatewayResult.decision === 'BYPASS') return true;
  if (!result.gatewayResult.allowed) return true;
  if (!result.guardResult) return true;
  return false;
}

export interface RunExecuteRouteMandatoryGatewayInput {
  context: GuardRequestContext;
  envelope: WebGovernanceEnvelope;
  actorId: string;
  actorRole: string;
  provider: string;
  enforcementRiskLevel?: string;
  gateway?: MandatoryGateway;
}

export type RunExecuteRouteMandatoryGatewayOutcome =
  | { blockedResponse: NextResponse; guardResult?: undefined }
  | { blockedResponse?: undefined; guardResult: GuardPipelineResult };

/**
 * Execute-route-specific composition: evaluate the mandatory gateway exactly
 * once and either return a fail-closed NextResponse (BLOCK, ESCALATE,
 * BYPASS, or missing pipeline result) or the pipeline result to continue
 * with provider routing.
 */
export async function runExecuteRouteMandatoryGateway(
  input: RunExecuteRouteMandatoryGatewayInput,
): Promise<RunExecuteRouteMandatoryGatewayOutcome> {
  const evaluation = await evaluateRouteMandatoryGateway({
    context: input.context,
    envelope: input.envelope,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetResource: '/api/execute',
    gateway: input.gateway,
  });

  if (isRouteMandatoryGatewayFailClosed(evaluation)) {
    const blockedResponse = NextResponse.json(
      {
        success: false,
        error: 'We need to adjust your request for better results.',
        provider: input.provider,
        model: 'guard-blocked',
        guardResult: evaluation.guardResult,
        governanceEnvelope: input.envelope,
        policySnapshotId: input.envelope.policySnapshotId,
        governanceEvidenceReceipt: buildEvidenceReceipt({
          envelope: input.envelope,
          decision: evaluation.gatewayResult.decision,
          riskLevel: input.enforcementRiskLevel,
          provider: input.provider,
          model: 'guard-blocked',
        }),
      },
      { status: 400 },
    );
    return { blockedResponse };
  }

  return { guardResult: evaluation.guardResult as GuardPipelineResult };
}
