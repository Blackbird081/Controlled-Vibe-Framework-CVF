/**
 * POST /api/guards/evaluate
 * =========================
 * Full guard pipeline evaluation endpoint.
 * External agents call this to check if an action is ALLOWED, BLOCKED, or needs ESCALATION.
 *
 * Sprint 6 wiring:
 *  - Task 6.5: Uses shared guard engine singleton (no more per-route engine)
 *  - Task 6.4: Rate limiter enforced before evaluation
 *  - Task 6.2: Audit persistence wired (trace entries saved to SQLite)
 *
 * Request body:
 *   { requestId, phase, riskLevel, role, action, agentId?, targetFiles?, mutationCount? }
 *
 * Response:
 *   { success, data: GuardPipelineResult, traceHash, traceId }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type GuardRequestContext,
  type CVFPhase,
  type CVFRiskLevel,
  type CVFRole,
  PHASE_ORDER,
} from 'cvf-guard-contract';
import { getSharedGuardEngine } from '@/lib/guard-engine-singleton';
import { guardsRateLimiter } from '@/lib/rate-limiter';

const VALID_PHASES: CVFPhase[] = [...PHASE_ORDER, 'DISCOVERY'];
const VALID_RISK_LEVELS: CVFRiskLevel[] = ['R0', 'R1', 'R2', 'R3'];
const VALID_ROLES: CVFRole[] = ['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'AI_AGENT', 'OPERATOR'];

function normalizePhase(phase: CVFPhase): CVFPhase {
  return phase === 'DISCOVERY' ? 'INTAKE' : phase;
}

export async function POST(request: NextRequest) {
  try {
    // ── Task 6.4: Rate limiting ──
    const rateLimitErr = guardsRateLimiter.middleware(request);
    if (rateLimitErr) return rateLimitErr;

    let payload: unknown;
    try { payload = await request.json(); }
    catch { return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 }); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return NextResponse.json({ success: false, error: 'Payload must be a JSON object.' }, { status: 400 });
    }
    const body = payload as Record<string, unknown>;

    // Validate required fields
    if (typeof body.requestId !== 'string' || !body.requestId.trim() || typeof body.action !== 'string' || !body.action.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: requestId, action',
          agentGuidance: 'Every guard evaluation request must include a requestId (unique identifier) and an action (description of what you want to do).',
        },
        { status: 400 },
      );
    }

    const invalidText = ['phase', 'riskLevel', 'role', 'agentId', 'traceHash']
      .some(field => body[field] !== undefined && typeof body[field] !== 'string');
    const invalidLists = ['targetFiles', 'fileScope'].some(field => body[field] !== undefined &&
      (!Array.isArray(body[field]) || (body[field] as unknown[]).some(value => typeof value !== 'string')));
    const invalidNumbers = ['mutationCount', 'mutationBudget'].some(field => body[field] !== undefined &&
      (typeof body[field] !== 'number' || !Number.isFinite(body[field])));
    const invalidMetadata = body.metadata !== undefined &&
      (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata));
    if (invalidText || invalidLists || invalidNumbers || invalidMetadata) {
      return NextResponse.json({ success: false, error: 'Invalid guard context field types.' }, { status: 400 });
    }
    const fields = body as unknown as GuardRequestContext;

    // Validate enum values
    const phase = normalizePhase((body.phase ?? 'BUILD') as CVFPhase);
    if (!VALID_PHASES.includes(phase)) {
      return NextResponse.json(
        { success: false, error: `Invalid phase: "${body.phase}". Valid: ${VALID_PHASES.join(', ')}` },
        { status: 400 },
      );
    }

    const riskLevel = (body.riskLevel ?? 'R0') as CVFRiskLevel;
    if (!VALID_RISK_LEVELS.includes(riskLevel)) {
      return NextResponse.json(
        { success: false, error: `Invalid riskLevel: "${body.riskLevel}". Valid: ${VALID_RISK_LEVELS.join(', ')}` },
        { status: 400 },
      );
    }

    const role = (body.role ?? 'AI_AGENT') as CVFRole;
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
      agentId: fields.agentId,
      action: body.action,
      targetFiles: fields.targetFiles,
      fileScope: fields.fileScope,
      mutationCount: fields.mutationCount,
      mutationBudget: fields.mutationBudget,
      traceHash: fields.traceHash,
      channel: 'mcp',
      metadata: fields.metadata,
    };

    // ── Task 6.5: Shared guard engine ──
    const guardEngine = getSharedGuardEngine();
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
