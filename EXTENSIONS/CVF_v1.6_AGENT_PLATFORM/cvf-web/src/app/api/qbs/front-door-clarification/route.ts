import { NextRequest, NextResponse } from 'next/server';
import { buildGovernanceEnvelope } from '@/lib/web-governance-envelope';
import { routeIntent } from '@/lib/intent-router';
import { isClarificationEligible, startClarification } from '@/lib/intent-router-clarification';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';

function buildClarificationOutput(input: { question?: string; options?: string[] }): string {
  const optionLines = (input.options || []).map(value => value.trim()).filter(Boolean).map(value => `- ${value}`).join('\n');
  return [
    '## CVF Clarification Needed',
    '',
    'I should not guess the route for this request because the intent is still ambiguous.',
    '',
    `Question: ${input.question || 'What best describes what you are trying to do right now?'}`,
    '',
    'Choose the closest option or answer in your own words:',
    optionLines || '- Describe whether you want research, planning, building, or review.',
    '',
    'After that, CVF can route the work through the appropriate governed path.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  const rawBodyText = await request.text();
  const serviceToken = request.headers.get('x-cvf-service-token');
  const isServiceAllowed = verifyServiceTokenRequest({
    configuredToken: process.env.CVF_SERVICE_TOKEN,
    presentedToken: serviceToken,
    signature: request.headers.get('x-cvf-service-signature'),
    timestamp: request.headers.get('x-cvf-service-timestamp'),
    body: rawBodyText,
  });
  if (!isServiceAllowed) return NextResponse.json({ success: false, error: 'Unauthorized: invalid service token or signature.' }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });
  }
  if (!rawBody || typeof rawBody !== 'object') return NextResponse.json({ success: false, error: 'Invalid input payload.' }, { status: 400 });

  const body = rawBody as { userPrompt?: string; taskId?: string; expectedDecision?: string; repeat?: number };
  const userPrompt = String(body.userPrompt || '').trim();
  const taskId = String(body.taskId || '').trim();
  if (!userPrompt || !taskId) return NextResponse.json({ success: false, error: 'Missing required fields: userPrompt, taskId' }, { status: 400 });

  const routeResult = routeIntent(userPrompt);
  const eligible = !!routeResult?.fallback && isClarificationEligible(routeResult.fallback);
  const clarification = routeResult ? startClarification(routeResult) : null;
  const decision = routeResult?.confidence === 'weak' && eligible && clarification?.recoveryMode === 'clarify' ? 'CLARIFY' : 'ALLOW';
  const envelope = buildGovernanceEnvelope({
    routeId: '/api/qbs/front-door-clarification',
    surfaceClass: 'governance-execution',
    evidenceMode: 'live',
    actorId: serviceToken ? deriveServiceTokenIdentity(serviceToken) : null,
    actorRole: 'service',
    phase: routeResult?.phase ?? 'INTAKE',
    riskLevel: routeResult?.riskLevel ?? 'R1',
  });

  return NextResponse.json({
    success: decision === 'CLARIFY',
    output: decision === 'CLARIFY' ? buildClarificationOutput({ question: clarification?.clarificationQuestion, options: clarification?.clarificationOptions }) : routeResult?.rationale || '',
    governanceEvidenceReceipt: {
      receiptId: `rcpt-${envelope.envelopeId}`,
      evidenceMode: 'live',
      routeId: envelope.routeId,
      decision,
      riskLevel: routeResult?.riskLevel ?? envelope.riskLevel,
      routingDecision: routeResult?.confidence,
      policySnapshotId: envelope.policySnapshotId,
      envelopeId: envelope.envelopeId,
      generatedAt: envelope.requestTimestamp,
    },
    frontDoorEvidence: { taskId, expectedDecision: body.expectedDecision || null, repeat: body.repeat ?? null, routeResult, clarification, clarificationEligible: eligible },
  });
}
