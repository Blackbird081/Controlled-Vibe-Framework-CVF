/**
 * POST /api/guards/phase-gate
 * ===========================
 * Quick phase gate check — does the given role have permission in the given phase?
 * Lighter than /evaluate (only runs PhaseGateGuard).
 *
 * Request body:
 *   { phase, role }
 *
 * Response:
 *   { success, allowed, phase, role, agentGuidance? }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  PhaseGateGuard,
  PHASE_DESCRIPTIONS,
  PHASE_ROLE_MATRIX,
  PHASE_ORDER,
  type CVFPhase,
  type CVFRole,
} from 'cvf-guard-contract';

const guard = new PhaseGateGuard();
const VALID_PHASES: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];
const VALID_ROLES: CVFRole[] = ['HUMAN', 'AI_AGENT', 'REVIEWER', 'OPERATOR'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phase = (body.phase || 'BUILD') as CVFPhase;
    const role = (body.role || 'AI_AGENT') as CVFRole;

    if (!VALID_PHASES.includes(phase)) {
      return NextResponse.json(
        { success: false, error: `Invalid phase: "${body.phase}". Valid: ${VALID_PHASES.join(', ')}` },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: "${body.role}". Valid: ${VALID_ROLES.join(', ')}` },
        { status: 400 },
      );
    }

    const result = guard.evaluate({
      requestId: `phase-gate-${Date.now()}`,
      phase,
      riskLevel: 'R0',
      role,
      action: 'phase_gate_check',
      channel: 'mcp',
    });

    return NextResponse.json({
      success: true,
      allowed: result.decision === 'ALLOW',
      phase,
      phaseDescription: PHASE_DESCRIPTIONS[phase],
      role,
      allowedRolesInPhase: PHASE_ROLE_MATRIX[phase],
      decision: result.decision,
      agentGuidance: result.agentGuidance,
      suggestedAction: result.suggestedAction,
      phaseOrder: PHASE_ORDER,
    });
  } catch (error) {
    console.error('[API] /api/guards/phase-gate error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/guards/phase-gate
 * Returns phase matrix documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/guards/phase-gate',
    method: 'POST',
    description: 'Quick phase gate check',
    phaseOrder: PHASE_ORDER,
    phaseDescriptions: PHASE_DESCRIPTIONS,
    phaseRoleMatrix: PHASE_ROLE_MATRIX,
  });
}
