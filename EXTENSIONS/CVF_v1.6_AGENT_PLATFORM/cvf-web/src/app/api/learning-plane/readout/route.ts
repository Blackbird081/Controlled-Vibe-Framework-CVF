import { NextRequest, NextResponse } from 'next/server';
import {
  buildFindingToLearningRecord,
  FINDING_TO_LEARNING_BRIDGE_VERSION,
  type FindingToLearningInput,
} from '@/lib/finding-to-learning-bridge';
import { verifyServiceTokenRequest } from '@/lib/service-token-auth';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { LEARNING_PLANE_READOUT_ROUTE_VERSION } from './route-constants';

const LEARNING_SIGNAL_LANES = [
  'GOVERNANCE_CONTROL_PLANE',
  'RUNTIME_BEHAVIOR_LEARNING',
  'PROVIDER_OUTPUT_LEARNING',
  'COST_ECONOMICS_LEARNING',
  'DOCUMENTATION_ONLY_LEARNING',
] as const;

const LEARNING_SIGNAL_DEFECT_CLASSES = [
  'WORKER_EXECUTION_ERROR',
  'ORCHESTRATOR_PACKET_GAP',
  'RULE_GAP',
  'MACHINE_GATE_GAP',
  'PHASE_GATE_PLACEMENT_GAP',
  'OPERATOR_SCOPE_CLARITY_GAP',
  'RUNTIME_SIGNAL_GAP',
] as const;

const LEARNING_SIGNAL_SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;

const LEARNING_SIGNAL_DISPOSITIONS = [
  'RULE_EXISTS',
  'RULE_ADDED',
  'MACHINE_CHECK_ADDED',
  'MACHINE_CHECK_CANDIDATE',
  'PHASE_GATE_PLACEMENT_GAP',
  'DESIGN_REVIEW_REQUIRED',
  'RUNTIME_LEARNING_CANDIDATE',
  'N/A_WITH_REASON',
] as const;

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function extractBody(raw: unknown): FindingToLearningInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  if (
    typeof b.sourceId !== 'string' ||
    typeof b.sourceArtifact !== 'string' ||
    typeof b.sourceSummary !== 'string' ||
    !isOneOf(b.lane, LEARNING_SIGNAL_LANES) ||
    !isOneOf(b.defectClass, LEARNING_SIGNAL_DEFECT_CLASSES) ||
    !isOneOf(b.severity, LEARNING_SIGNAL_SEVERITIES) ||
    !isOneOf(b.disposition, LEARNING_SIGNAL_DISPOSITIONS) ||
    typeof b.nextControlAction !== 'string' ||
    typeof b.evidenceBasis !== 'string'
  ) return null;
  return {
    sourceId: b.sourceId,
    sourceArtifact: b.sourceArtifact,
    sourceSummary: b.sourceSummary,
    lane: b.lane,
    defectClass: b.defectClass,
    severity: b.severity,
    disposition: b.disposition,
    nextControlAction: b.nextControlAction,
    evidenceBasis: b.evidenceBasis,
  };
}

export async function POST(request: NextRequest) {
  // Auth: service token or session
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

  const input = extractBody(raw);
  if (!input) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing or invalid fields: sourceId, sourceArtifact, sourceSummary, lane, defectClass, severity, disposition, nextControlAction, evidenceBasis.',
      },
      { status: 400 },
    );
  }

  const record = buildFindingToLearningRecord(input);

  return NextResponse.json({
    success: true,
    routeVersion: LEARNING_PLANE_READOUT_ROUTE_VERSION,
    bridgeVersion: FINDING_TO_LEARNING_BRIDGE_VERSION,
    findingToLearningReadout: record,
  });
}
