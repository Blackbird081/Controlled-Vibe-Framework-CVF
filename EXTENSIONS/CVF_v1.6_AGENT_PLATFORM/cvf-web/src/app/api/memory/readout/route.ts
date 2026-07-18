import { NextRequest, NextResponse } from 'next/server';
import { buildMemoryRuntimeReadout } from '@/lib/memory-runtime-readout';
import { verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { MEMORY_RUNTIME_READOUT_ROUTE_VERSION } from './route-constants';

const RAW_SENTINEL = 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK';

interface MemoryRuntimeReadoutBody {
  operationId: string;
  sessionId: string;
  projectId: string;
  actorId: string;
  actorRole: 'OPERATOR' | 'GOVERNOR' | 'HUMAN' | 'BUILDER' | 'AI_AGENT' | 'REVIEWER' | 'SERVICE_AGENT' | 'OBSERVER' | 'ANALYST' | 'unknown';
  scope: string;
  riskLevel: 'R0' | 'R1' | 'R2' | 'R3';
  query: string;
  tokenBudget: number;
  candidates: Array<{
    id: string;
    scope: string;
    summary: string;
    content?: string;
    createdAt: number;
    auditTrust: number;
    lifecycleState: 'working' | 'episodic' | 'semantic' | 'procedural' | 'expired' | 'disputed';
    containsSecret?: boolean;
  }>;
  policyDecision?: 'allow' | 'allow_limited' | 'allow_redacted' | 'allow_summary_only' | 'deny' | 'require_human_approval';
  containsSensitiveData?: boolean;
  maxResults?: number;
}

const allowedActorRoles = new Set<MemoryRuntimeReadoutBody['actorRole']>([
  'OPERATOR',
  'GOVERNOR',
  'HUMAN',
  'BUILDER',
  'AI_AGENT',
  'REVIEWER',
  'SERVICE_AGENT',
  'OBSERVER',
  'ANALYST',
  'unknown',
]);
const allowedRiskLevels = new Set<MemoryRuntimeReadoutBody['riskLevel']>(['R0', 'R1', 'R2', 'R3']);
const allowedLifecycleStates = new Set<MemoryRuntimeReadoutBody['candidates'][number]['lifecycleState']>([
  'working',
  'episodic',
  'semantic',
  'procedural',
  'expired',
  'disputed',
]);
const allowedPolicies = new Set<MemoryRuntimeReadoutBody['policyDecision']>([
  'allow',
  'allow_limited',
  'allow_redacted',
  'allow_summary_only',
  'deny',
  'require_human_approval',
]);

function validateBody(raw: unknown): MemoryRuntimeReadoutBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (
    typeof b.operationId !== 'string' ||
    typeof b.sessionId !== 'string' ||
    typeof b.projectId !== 'string' ||
    typeof b.actorId !== 'string' ||
    typeof b.actorRole !== 'string' ||
    typeof b.scope !== 'string' ||
    typeof b.riskLevel !== 'string' ||
    typeof b.query !== 'string' ||
    typeof b.tokenBudget !== 'number' ||
    !Array.isArray(b.candidates)
  ) return null;
  if (!allowedActorRoles.has(b.actorRole as MemoryRuntimeReadoutBody['actorRole'])) return null;
  if (!allowedRiskLevels.has(b.riskLevel as MemoryRuntimeReadoutBody['riskLevel'])) return null;

  const candidates = b.candidates.map((c) => {
    if (!c || typeof c !== 'object') return null;
    const cand = c as Record<string, unknown>;
    if (
      typeof cand.id !== 'string' ||
      typeof cand.scope !== 'string' ||
      typeof cand.summary !== 'string' ||
      typeof cand.createdAt !== 'number' ||
      typeof cand.auditTrust !== 'number' ||
      typeof cand.lifecycleState !== 'string' ||
      !allowedLifecycleStates.has(cand.lifecycleState as MemoryRuntimeReadoutBody['candidates'][number]['lifecycleState'])
    ) return null;
    return {
      id: cand.id,
      scope: cand.scope,
      summary: cand.summary,
      content: typeof cand.content === 'string' ? cand.content : undefined,
      createdAt: cand.createdAt,
      auditTrust: cand.auditTrust,
      lifecycleState: cand.lifecycleState as MemoryRuntimeReadoutBody['candidates'][number]['lifecycleState'],
      containsSecret: cand.containsSecret === true,
    } as const;
  });

  if (candidates.some((c) => c === null)) return null;

  type PolicyDecision = MemoryRuntimeReadoutBody['policyDecision'];
  const policyDecisionRaw = typeof b.policyDecision === 'string' ? b.policyDecision : undefined;
  if (policyDecisionRaw && !allowedPolicies.has(policyDecisionRaw as PolicyDecision)) return null;
  const policyDecision = policyDecisionRaw as PolicyDecision | undefined;

  const riskLevel = b.riskLevel as MemoryRuntimeReadoutBody['riskLevel'];
  const actorRole = b.actorRole as MemoryRuntimeReadoutBody['actorRole'];
  const containsSensitiveData = b.containsSensitiveData === true;
  const maxResults = typeof b.maxResults === 'number' ? b.maxResults : undefined;

  return {
    operationId: b.operationId,
    sessionId: b.sessionId,
    projectId: b.projectId,
    actorId: b.actorId,
    actorRole,
    scope: b.scope,
    riskLevel,
    query: b.query,
    tokenBudget: b.tokenBudget,
    candidates: candidates as MemoryRuntimeReadoutBody['candidates'],
    policyDecision,
    containsSensitiveData,
    maxResults,
  };
}

export async function POST(request: NextRequest) {
  const serviceToken = request.headers.get('x-cvf-service-token');
  const signature = request.headers.get('x-cvf-service-signature');
  const timestamp = request.headers.get('x-cvf-service-timestamp');

  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const configuredToken = process.env.CVF_SERVICE_TOKEN;
  const isServiceAllowed = verifyServiceTokenRequest({
    configuredToken,
    presentedToken: serviceToken,
    signature,
    timestamp,
    body: bodyText,
  });

  const session = await verifySessionCookie(request);

  if (!session && !isServiceAllowed) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: please login or provide a valid service token.' },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const body = validateBody(raw);
  if (!body) {
    return NextResponse.json({ success: false, error: 'Missing or invalid fields.' }, { status: 400 });
  }

  const projection = buildMemoryRuntimeReadout({
    operationId: body.operationId,
    sessionId: body.sessionId,
    projectId: body.projectId,
    actorId: body.actorId,
    actorRole: body.actorRole,
    scope: body.scope,
    riskLevel: body.riskLevel,
    query: body.query,
    tokenBudget: body.tokenBudget,
    candidates: body.candidates,
    policyDecision: body.policyDecision,
    containsSensitiveData: body.containsSensitiveData,
    maxResults: body.maxResults,
  });

  const serialized = JSON.stringify(projection);
  if (serialized.includes(RAW_SENTINEL)) {
    return NextResponse.json({ success: false, error: 'raw_memory_content_detected' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    routeVersion: MEMORY_RUNTIME_READOUT_ROUTE_VERSION,
    memoryRuntimeReadout: projection,
    rawMemoryReleased: false,
    canReinject: false,
  });
}
