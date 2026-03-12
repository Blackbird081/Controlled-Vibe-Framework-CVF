/**
 * POST /api/guards/evaluate
 * =========================
 * Full guard pipeline evaluation endpoint.
 * External agents call this to check if an action is ALLOWED, BLOCKED, or needs ESCALATION.
 *
 * Request body:
 *   { requestId, phase, riskLevel, role, action, agentId?, targetFiles?, mutationCount? }
 *
 * Response:
 *   { success, data: GuardPipelineResult, traceHash, traceId }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createGuardEngine,
  type GuardRequestContext,
  type CVFPhase,
  type CVFRiskLevel,
  type CVFRole,
} from 'cvf-guard-contract';
import { guardsRateLimiter } from '@/lib/rate-limiter';

const VALID_PHASES: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
const VALID_RISK_LEVELS: CVFRiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
const VALID_ROLES: CVFRole[] = ['HUMAN', 'AI_AGENT', 'REVIEWER', 'OPERATOR'];

// Singleton engine — reused across requests
let engine: ReturnType<typeof createGuardEngine> | null = null;
function getEngine() {
  if (!engine) {
    engine = createGuardEngine();
  }
  return engine;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.requestId || !body.action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: requestId, action',
          agentGuidance: 'Every guard evaluation request must include a requestId (unique identifier) and an action (description of what you want to do).',
        },
        { status: 400 },
      );
    }

    // Validate enum values
    const phase = (body.phase || 'BUILD') as CVFPhase;
    if (!VALID_PHASES.includes(phase)) {
      return NextResponse.json(
        { success: false, error: `Invalid phase: "${body.phase}". Valid: ${VALID_PHASES.join(', ')}` },
        { status: 400 },
      );
    }

    const riskLevel = (body.riskLevel || 'R0') as CVFRiskLevel;
    if (!VALID_RISK_LEVELS.includes(riskLevel)) {
      return NextResponse.json(
        { success: false, error: `Invalid riskLevel: "${body.riskLevel}". Valid: ${VALID_RISK_LEVELS.join(', ')}` },
        { status: 400 },
      );
    }

    const role = (body.role || 'AI_AGENT') as CVFRole;
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: "${body.role}". Valid: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      );
    }

    const context: GuardRequestContext = {
      requestId: body.requestId,
      phase,
      riskLevel,
      role,
      agentId: body.agentId,
      action: body.action,
      targetFiles: body.targetFiles,
      mutationCount: body.mutationCount,
      mutationBudget: body.mutationBudget,
      traceHash: body.traceHash,
      channel: 'mcp',
    };

    const guardEngine = getEngine();
    const result = guardEngine.evaluate(context);

    return NextResponse.json({
      success: true,
      data: {
        requestId: result.requestId,
        finalDecision: result.finalDecision,
        blockedBy: result.blockedBy,
        escalatedBy: result.escalatedBy,
        agentGuidance: result.agentGuidance,
        durationMs: result.durationMs,
        guardsEvaluated: result.results.length,
        results: result.results,
      },
    });
  } catch (error) {
    console.error('[API] /api/guards/evaluate error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/guards/evaluate
 * Returns API documentation / health check
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/guards/evaluate',
    method: 'POST',
    description: 'Full CVF guard pipeline evaluation',
    requiredFields: ['requestId', 'action'],
    optionalFields: ['phase', 'riskLevel', 'role', 'agentId', 'targetFiles', 'mutationCount'],
    defaults: { phase: 'BUILD', riskLevel: 'R0', role: 'AI_AGENT' },
    responses: {
      ALLOW: 'Action is permitted within current governance boundaries',
      BLOCK: 'Action is blocked by one or more guards',
      ESCALATE: 'Action requires human approval before proceeding',
    },
  });
}
