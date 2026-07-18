import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createFileBackedDurableMemoryStore,
  DURABLE_MEMORY_STORE_VERSION,
  type DurableMemoryLifecycleState,
  type DurableMemoryReceipt,
  type DurableMemoryTier,
  type RuntimeMemoryActorRole,
  type RuntimeMemorySensitivity,
} from 'cvf-learning-plane-foundation/web-runtime';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { MEMORY_DURABLE_WRITE_ROUTE_VERSION } from './route-constants';

interface MemoryDurableWriteBody {
  id: string;
  actorId: string;
  actorRole: RuntimeMemoryActorRole;
  scope: string;
  tier: DurableMemoryTier;
  summary: string;
  provenanceScore?: number;
  policyDecision: 'allow' | 'deny' | 'require_human_approval';
  actorAuthorized: boolean;
  lifecycleState?: DurableMemoryLifecycleState;
  containsSecret?: boolean;
  sensitivity?: RuntimeMemorySensitivity;
}

const ROUTE_DURABLE_MEMORY_STORE_ENV = 'CVF_DURABLE_MEMORY_STORE_PATH';
const RAW_FIELD_REJECTION_REASON = 'raw_memory_payload_rejected';

const allowedActorRoles = new Set<RuntimeMemoryActorRole>([
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
const allowedTiers = new Set<DurableMemoryTier>(['skill', 'long-term']);
const allowedPolicies = new Set<MemoryDurableWriteBody['policyDecision']>([
  'allow',
  'deny',
  'require_human_approval',
]);
const allowedLifecycleStates = new Set<DurableMemoryLifecycleState>([
  'semantic',
  'procedural',
  'expired',
  'disputed',
  'forgotten',
]);
const allowedSensitivities = new Set<RuntimeMemorySensitivity>([
  'public',
  'internal',
  'confidential',
  'restricted',
]);

function emptyReceipt(input: {
  reason: string;
  scope: string;
  tier?: DurableMemoryTier;
  id?: string;
}): DurableMemoryReceipt {
  const id = input.id?.trim() || 'unknown-memory';
  return {
    contractVersion: DURABLE_MEMORY_STORE_VERSION,
    operation: 'write',
    decision: 'denied',
    reason: input.reason,
    tier: input.tier,
    scope: input.scope,
    memoryIds: [],
    excluded: [{ id, reason: input.reason }],
    durablePersistence: false,
    crossSession: false,
    summaryOnly: true,
    canReinject: false,
    rawMemoryReleased: false,
    receiptId: `mke1-write-${randomUUID()}`,
  };
}

function hasRawPayloadField(raw: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(raw, 'content') ||
    Object.prototype.hasOwnProperty.call(raw, 'rawContent') ||
    Object.prototype.hasOwnProperty.call(raw, 'value');
}

function validateBody(raw: unknown): MemoryDurableWriteBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (
    typeof b.id !== 'string' ||
    typeof b.actorId !== 'string' ||
    typeof b.actorRole !== 'string' ||
    typeof b.scope !== 'string' ||
    typeof b.tier !== 'string' ||
    typeof b.summary !== 'string' ||
    typeof b.policyDecision !== 'string' ||
    typeof b.actorAuthorized !== 'boolean'
  ) return null;
  if (!allowedActorRoles.has(b.actorRole as RuntimeMemoryActorRole)) return null;
  if (!allowedTiers.has(b.tier as DurableMemoryTier)) return null;
  if (!allowedPolicies.has(b.policyDecision as MemoryDurableWriteBody['policyDecision'])) return null;
  if (b.provenanceScore !== undefined && typeof b.provenanceScore !== 'number') return null;
  if (typeof b.provenanceScore === 'number' && !Number.isFinite(b.provenanceScore)) return null;
  if (b.lifecycleState !== undefined) {
    if (typeof b.lifecycleState !== 'string') return null;
    if (!allowedLifecycleStates.has(b.lifecycleState as DurableMemoryLifecycleState)) return null;
  }
  if (b.sensitivity !== undefined) {
    if (typeof b.sensitivity !== 'string') return null;
    if (!allowedSensitivities.has(b.sensitivity as RuntimeMemorySensitivity)) return null;
  }

  return {
    id: b.id,
    actorId: b.actorId,
    actorRole: b.actorRole as RuntimeMemoryActorRole,
    scope: b.scope,
    tier: b.tier as DurableMemoryTier,
    summary: b.summary,
    provenanceScore: typeof b.provenanceScore === 'number' ? b.provenanceScore : undefined,
    policyDecision: b.policyDecision as MemoryDurableWriteBody['policyDecision'],
    actorAuthorized: b.actorAuthorized,
    lifecycleState: b.lifecycleState as DurableMemoryLifecycleState | undefined,
    containsSecret: b.containsSecret === true,
    sensitivity: b.sensitivity as RuntimeMemorySensitivity | undefined,
  };
}

function writeResponse(receipt: DurableMemoryReceipt, status = 200) {
  return NextResponse.json({
    success: status < 400,
    routeVersion: MEMORY_DURABLE_WRITE_ROUTE_VERSION,
    durableMemoryWriteReceipt: receipt,
    rawMemoryReleased: false,
    canReinject: false,
  }, { status });
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

  if (raw && typeof raw === 'object' && hasRawPayloadField(raw as Record<string, unknown>)) {
    const b = raw as Record<string, unknown>;
    return writeResponse(emptyReceipt({
      reason: RAW_FIELD_REJECTION_REASON,
      scope: typeof b.scope === 'string' ? b.scope : 'unknown-scope',
      tier: allowedTiers.has(b.tier as DurableMemoryTier) ? b.tier as DurableMemoryTier : undefined,
      id: typeof b.id === 'string' ? b.id : undefined,
    }), 400);
  }

  const body = validateBody(raw);
  if (!body) {
    return NextResponse.json({ success: false, error: 'Missing or invalid fields.' }, { status: 400 });
  }

  if (!body.actorAuthorized || body.policyDecision !== 'allow') {
    return writeResponse(emptyReceipt({
      reason: 'durable_memory_policy_denied',
      scope: body.scope,
      tier: body.tier,
      id: body.id,
    }));
  }

  const storePath = process.env[ROUTE_DURABLE_MEMORY_STORE_ENV];
  if (!storePath?.trim()) {
    return writeResponse(emptyReceipt({
      reason: 'durable_memory_write_store_not_configured',
      scope: body.scope,
      tier: body.tier,
      id: body.id,
    }));
  }

  const store = createFileBackedDurableMemoryStore(storePath);
  const write = store.write({
    id: body.id,
    tier: body.tier,
    scope: body.scope,
    actorId: body.actorId,
    actorRole: body.actorRole,
    summary: body.summary,
    lifecycleState: body.lifecycleState ?? 'semantic',
    provenanceScore: body.provenanceScore,
    containsSecret: body.containsSecret,
    policyDecision: body.policyDecision,
    actorAuthorized: body.actorAuthorized,
    sensitivity: body.sensitivity ?? 'internal',
  });

  return writeResponse(write.receipt);
}
