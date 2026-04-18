import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHmac, randomUUID } from 'node:crypto';

import type { AIProvider } from '@/lib/ai';
import { MOCK_TEAMS, MOCK_USERS } from '@/lib/mock-enterprise-db';
import type { PolicyControlPlaneEvent, PolicyEventKind } from '@/lib/policy-events';
import { forwardToSIEM } from '@/lib/siem-forwarder';

export type EvidenceClass = 'FULL' | 'SUMMARY' | 'POINTER';

interface ControlPlaneEventBase {
  id: string;
  kind: 'audit' | 'cost' | PolicyEventKind;
  evidenceClass: EvidenceClass;
  timestamp: string;
}

export interface UnifiedAuditEvent extends ControlPlaneEventBase {
  kind: 'audit';
  eventType: string;
  actorId: string;
  actorRole: string;
  targetResource: string;
  action: string;
  riskLevel?: string;
  phase?: string;
  outcome: string;
  payload?: Record<string, unknown>;
}

export interface CostEvent extends ControlPlaneEventBase {
  kind: 'cost';
  userId: string;
  teamId: string;
  orgId: string;
  skillId?: string;
  templateId?: string;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
}

export type ControlPlaneEvent = UnifiedAuditEvent | CostEvent | PolicyControlPlaneEvent;

let appendQueue = Promise.resolve();

function buildAuditCsvBody(auditEvents: UnifiedAuditEvent[]): string {
  const headers = [
    'timestamp',
    'eventType',
    'actorId',
    'actorRole',
    'targetResource',
    'action',
    'riskLevel',
    'phase',
    'outcome',
    'payload',
  ];

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = auditEvents.map(event => [
    event.timestamp,
    event.eventType,
    event.actorId,
    event.actorRole,
    event.targetResource,
    event.action,
    event.riskLevel ?? '',
    event.phase ?? '',
    event.outcome,
    JSON.stringify(event.payload ?? {}),
  ]);

  return [headers.join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
}

export function computeAuditCsvSignature(body: string, signingKey: string): string {
  return createHmac('sha256', signingKey).update(body, 'utf8').digest('hex');
}

function getStorePath() {
  return process.env.CVF_CONTROL_PLANE_EVENTS_PATH
    ? path.resolve(process.env.CVF_CONTROL_PLANE_EVENTS_PATH)
    : path.join(process.cwd(), '.data', 'control-plane-events.json');
}

async function ensureStore(): Promise<void> {
  const storePath = getStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  try {
    await readFile(storePath, 'utf8');
  } catch {
    await writeFile(storePath, '[]', 'utf8');
  }
}

async function writeEvents(events: ControlPlaneEvent[]): Promise<void> {
  const storePath = getStorePath();
  await ensureStore();
  await writeFile(storePath, JSON.stringify(events, null, 2), 'utf8');
}

function findTopLevelArrayEnd(raw: string): number | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
}

async function repairCorruptedStore(raw: string, storePath: string): Promise<ControlPlaneEvent[]> {
  const arrayEnd = findTopLevelArrayEnd(raw);
  if (arrayEnd === null) {
    await writeFile(storePath, '[]', 'utf8');
    return [];
  }

  const recoveredRaw = raw.slice(0, arrayEnd + 1);

  try {
    const recovered = JSON.parse(recoveredRaw) as ControlPlaneEvent[];
    const backupPath = `${storePath}.corrupt-${Date.now()}.json`;
    await writeFile(backupPath, raw, 'utf8');
    await writeFile(storePath, JSON.stringify(recovered, null, 2), 'utf8');
    return recovered;
  } catch {
    await writeFile(storePath, '[]', 'utf8');
    return [];
  }
}

export async function readControlPlaneEvents(): Promise<ControlPlaneEvent[]> {
  const storePath = getStorePath();
  await ensureStore();
  const raw = await readFile(storePath, 'utf8');
  let parsed: ControlPlaneEvent[];

  try {
    parsed = JSON.parse(raw) as ControlPlaneEvent[];
  } catch {
    parsed = await repairCorruptedStore(raw, storePath);
  }

  return parsed.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

async function appendEvent<T extends ControlPlaneEvent>(
  event: Omit<T, 'id' | 'timestamp'> & Partial<Pick<T, 'id' | 'timestamp'>>,
): Promise<T> {
  const run = async () => {
    const events = await readControlPlaneEvents();
    const record = {
      ...event,
      id: event.id ?? randomUUID(),
      timestamp: event.timestamp ?? new Date().toISOString(),
    } as T;
    events.push(record);
    await writeEvents(events);
    return record;
  };

  const result = appendQueue.then(run, run);
  appendQueue = result.then(() => undefined, () => undefined);
  return result;
}

export async function appendControlPlaneEvent<T extends ControlPlaneEvent>(
  event: Omit<T, 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<T, 'id' | 'timestamp'>>,
): Promise<T> {
  return appendEvent<T>({
    evidenceClass: 'FULL',
    ...event,
  } as Omit<T, 'id' | 'timestamp'> & Partial<Pick<T, 'id' | 'timestamp'>>);
}

export async function appendAuditEvent(
  event: Omit<UnifiedAuditEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<UnifiedAuditEvent, 'id' | 'timestamp'>>,
): Promise<UnifiedAuditEvent> {
  const record = await appendControlPlaneEvent<UnifiedAuditEvent>({
    kind: 'audit',
    ...event,
  });

  void forwardToSIEM(record).catch(error => {
    console.error('SIEM forward failed:', error);
  });

  return record;
}

export async function appendCostEvent(
  event: Omit<CostEvent, 'kind' | 'id' | 'timestamp' | 'evidenceClass'> & Partial<Pick<CostEvent, 'id' | 'timestamp'>>,
): Promise<CostEvent> {
  return appendControlPlaneEvent<CostEvent>({
    kind: 'cost',
    ...event,
  });
}

export async function readAuditEvents(): Promise<UnifiedAuditEvent[]> {
  const events = await readControlPlaneEvents();
  return events.filter((event): event is UnifiedAuditEvent => event.kind === 'audit');
}

export async function readCostEvents(): Promise<CostEvent[]> {
  const events = await readControlPlaneEvents();
  return events.filter((event): event is CostEvent => event.kind === 'cost');
}

function buildBreakdown(
  costEvents: CostEvent[],
  pickKey: (event: CostEvent) => string | undefined,
  pickLabel: (key: string) => string,
) {
  const map = new Map<string, { cost: number; tokens: number; requests: number; label: string }>();

  for (const event of costEvents) {
    const key = pickKey(event) ?? 'unknown';
    const current = map.get(key) ?? {
      cost: 0,
      tokens: 0,
      requests: 0,
      label: pickLabel(key),
    };
    current.cost += event.estimatedCostUSD;
    current.tokens += event.inputTokens + event.outputTokens;
    current.requests += 1;
    map.set(key, current);
  }

  return [...map.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.cost - a.cost);
}

function startOfDayKey(timestamp: string): string {
  return timestamp.slice(0, 10);
}

export async function getFinOpsSummary() {
  const costEvents = await readCostEvents();
  const timeSeriesMap = new Map<string, { date: string; cost: number; tokens: number; requests: number }>();

  for (const event of costEvents) {
    const date = startOfDayKey(event.timestamp);
    const current = timeSeriesMap.get(date) ?? { date, cost: 0, tokens: 0, requests: 0 };
    current.cost += event.estimatedCostUSD;
    current.tokens += event.inputTokens + event.outputTokens;
    current.requests += 1;
    timeSeriesMap.set(date, current);
  }

  const usersById = new Map(MOCK_USERS.map(user => [user.id, user]));
  const teamsById = new Map(MOCK_TEAMS.map(team => [team.id, team]));

  return {
    totalCostUSD: costEvents.reduce((sum, event) => sum + event.estimatedCostUSD, 0),
    totalTokens: costEvents.reduce((sum, event) => sum + event.inputTokens + event.outputTokens, 0),
    totalRequests: costEvents.length,
    timeSeries: [...timeSeriesMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    topUsers: buildBreakdown(
      costEvents,
      event => event.userId,
      key => usersById.get(key)?.name ?? key,
    ).slice(0, 10),
    topTeams: buildBreakdown(
      costEvents,
      event => event.teamId,
      key => teamsById.get(key)?.name ?? key,
    ).slice(0, 10),
    topSkills: buildBreakdown(
      costEvents,
      event => event.skillId,
      key => key === 'unknown' ? 'No declared skill' : key,
    ).slice(0, 10),
  };
}

export async function exportAuditEventsToCsv(): Promise<string> {
  const auditEvents = await readAuditEvents();
  const body = buildAuditCsvBody(auditEvents);
  const signingKey = process.env.CVF_AUDIT_SIGNING_KEY;

  if (!signingKey) {
    return ['# WARNING: UNSIGNED EXPORT', body].join('\n');
  }

  const signedAt = new Date().toISOString();
  const signature = computeAuditCsvSignature(body, signingKey);

  return [
    body,
    `# CVF-AUDIT-SIGNATURE: hmac-sha256:${signature}`,
    `# CVF-AUDIT-SIGNED-AT: ${signedAt}`,
    `# CVF-AUDIT-RECORD-COUNT: ${auditEvents.length}`,
  ].join('\n');
}
