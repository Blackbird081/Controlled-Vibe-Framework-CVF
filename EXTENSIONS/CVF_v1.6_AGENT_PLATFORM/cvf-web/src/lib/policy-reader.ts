import type {
  QuotaOverrideEvent,
  QuotaPolicyEvent,
  ToolPolicyEvent,
} from '@/lib/policy-events';
import { readPolicyEvents } from '@/lib/policy-events';

function sortNewestFirst<T extends { timestamp: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
}

function isOverrideExpired(event: QuotaOverrideEvent, referenceTimestamp: string): boolean {
  return event.expiresAt.localeCompare(referenceTimestamp) <= 0;
}

export async function getActiveQuotaPolicy(teamId: string): Promise<QuotaPolicyEvent | null> {
  const events = await readPolicyEvents();
  return sortNewestFirst(
    events.filter(
      (event): event is QuotaPolicyEvent =>
        event.kind === 'quota-policy' && event.teamId === teamId,
    ),
  )[0] ?? null;
}

export async function getAllActiveQuotaPolicies(): Promise<QuotaPolicyEvent[]> {
  const events = await readPolicyEvents();
  const latestByTeam = new Map<string, QuotaPolicyEvent>();

  for (const event of sortNewestFirst(
    events.filter((candidate): candidate is QuotaPolicyEvent => candidate.kind === 'quota-policy'),
  )) {
    if (!latestByTeam.has(event.teamId)) {
      latestByTeam.set(event.teamId, event);
    }
  }

  return [...latestByTeam.values()].sort((left, right) => left.teamId.localeCompare(right.teamId));
}

export async function getActiveQuotaOverride(
  teamId: string,
  referenceTimestamp = new Date().toISOString(),
): Promise<QuotaOverrideEvent | null> {
  const events = await readPolicyEvents();
  const teamEvents = sortNewestFirst(
    events.filter(
      (event): event is QuotaOverrideEvent =>
        event.kind === 'quota-override' && event.teamId === teamId,
    ),
  );

  for (const event of teamEvents) {
    if (event.status === 'revoked') {
      return null;
    }
    if (!isOverrideExpired(event, referenceTimestamp)) {
      return event;
    }
  }

  return null;
}

export async function getAllActiveQuotaOverrides(
  referenceTimestamp = new Date().toISOString(),
): Promise<QuotaOverrideEvent[]> {
  const events = await readPolicyEvents();
  const teams = new Set(
    events
      .filter((candidate): candidate is QuotaOverrideEvent => candidate.kind === 'quota-override')
      .map(candidate => candidate.teamId),
  );

  const activeOverrides = await Promise.all(
    [...teams].map(teamId => getActiveQuotaOverride(teamId, referenceTimestamp)),
  );

  return activeOverrides
    .filter((event): event is QuotaOverrideEvent => event !== null)
    .sort((left, right) => left.teamId.localeCompare(right.teamId));
}

export async function getActiveToolPolicy(toolId: string): Promise<ToolPolicyEvent | null> {
  const events = await readPolicyEvents();
  return sortNewestFirst(
    events.filter(
      (event): event is ToolPolicyEvent => event.kind === 'tool-policy' && event.toolId === toolId,
    ),
  )[0] ?? null;
}

export async function getAllToolPolicies(): Promise<Map<string, ToolPolicyEvent>> {
  const events = await readPolicyEvents();
  const policies = new Map<string, ToolPolicyEvent>();

  for (const event of sortNewestFirst(
    events.filter((candidate): candidate is ToolPolicyEvent => candidate.kind === 'tool-policy'),
  )) {
    if (!policies.has(event.toolId)) {
      policies.set(event.toolId, event);
    }
  }

  return policies;
}
