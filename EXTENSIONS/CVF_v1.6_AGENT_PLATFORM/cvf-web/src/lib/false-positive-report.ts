import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from './ai';

export type FalsePositiveReportableDecision = 'BLOCK' | 'CLARIFY';

export interface FalsePositiveDecisionObservedEvent {
  eventType: 'REPORTABLE_DECISION_OBSERVED';
  id: string;
  observedAt: string;
  receiptId: string;
  envelopeId?: string;
  decision: FalsePositiveReportableDecision;
  riskLevel?: string;
  templateId?: string;
  routeId?: string;
}

export interface FalsePositiveReportedEvent {
  eventType: 'FALSE_POSITIVE_REPORTED';
  id: string;
  reportedAt: string;
  receiptId: string;
  envelopeId?: string;
  decision: FalsePositiveReportableDecision;
  riskLevel?: string;
  reason?: string;
  templateId?: string;
  routeId?: string;
  actorId?: string;
  actorRole?: string;
  userComment?: string;
}

export type FalsePositiveEvent = FalsePositiveDecisionObservedEvent | FalsePositiveReportedEvent;

export interface FalsePositiveReportInput {
  receiptId: string;
  envelopeId?: string;
  decision: string;
  riskLevel?: string;
  reason?: string;
  templateId?: string;
  routeId?: string;
  actorId?: string;
  actorRole?: string;
  userComment?: string;
}

export function isReportableDecision(value: unknown): value is FalsePositiveReportableDecision {
  return value === 'BLOCK' || value === 'CLARIFY';
}

function getReportStorePath(): string {
  if (process.env.CVF_FALSE_POSITIVE_REPORTS_PATH) {
    return path.resolve(process.env.CVF_FALSE_POSITIVE_REPORTS_PATH);
  }

  return path.join(process.cwd(), '.data', 'false-positive-events.jsonl');
}

function cleanOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function cleanRequiredText(value: unknown, fieldName: string): string {
  const cleaned = cleanOptionalText(value, 240);
  if (!cleaned) {
    throw new Error(`${fieldName} is required`);
  }
  return cleaned;
}

async function appendFalsePositiveEvent(event: FalsePositiveEvent): Promise<FalsePositiveEvent> {
  const storePath = getReportStorePath();
  await mkdir(path.dirname(storePath), { recursive: true });
  await appendFile(storePath, `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

export async function appendReportableDecisionObserved(input: {
  receiptId: string;
  envelopeId?: string;
  decision: string;
  riskLevel?: string;
  templateId?: string;
  routeId?: string;
}): Promise<FalsePositiveDecisionObservedEvent | null> {
  if (!isReportableDecision(input.decision)) return null;

  return appendFalsePositiveEvent({
    eventType: 'REPORTABLE_DECISION_OBSERVED',
    id: randomUUID(),
    observedAt: new Date().toISOString(),
    receiptId: cleanRequiredText(input.receiptId, 'receiptId'),
    envelopeId: cleanOptionalText(input.envelopeId, 240),
    decision: input.decision,
    riskLevel: cleanOptionalText(input.riskLevel, 80),
    templateId: cleanOptionalText(input.templateId, 160),
    routeId: cleanOptionalText(input.routeId, 160),
  }) as Promise<FalsePositiveDecisionObservedEvent>;
}

export async function recordReportableDecisionObserved(input: {
  receipt: GovernanceEvidenceReceipt;
  templateId?: string;
}): Promise<void> {
  if (!isReportableDecision(input.receipt.decision)) return;

  try {
    await appendReportableDecisionObserved({
      receiptId: input.receipt.receiptId,
      envelopeId: input.receipt.envelopeId,
      decision: input.receipt.decision,
      riskLevel: input.receipt.riskLevel,
      templateId: input.templateId,
      routeId: input.receipt.routeId,
    });
  } catch (error) {
    console.warn('False-positive denominator logging degraded:', error);
  }
}

export async function appendFalsePositiveReport(input: FalsePositiveReportInput): Promise<FalsePositiveReportedEvent> {
  if (!isReportableDecision(input.decision)) {
    throw new Error('Only BLOCK and CLARIFY decisions can be reported as false positives');
  }

  return appendFalsePositiveEvent({
    eventType: 'FALSE_POSITIVE_REPORTED',
    id: randomUUID(),
    reportedAt: new Date().toISOString(),
    receiptId: cleanRequiredText(input.receiptId, 'receiptId'),
    envelopeId: cleanOptionalText(input.envelopeId, 240),
    decision: input.decision,
    riskLevel: cleanOptionalText(input.riskLevel, 80),
    reason: cleanOptionalText(input.reason, 500),
    templateId: cleanOptionalText(input.templateId, 160),
    routeId: cleanOptionalText(input.routeId, 160),
    actorId: cleanOptionalText(input.actorId, 160),
    actorRole: cleanOptionalText(input.actorRole, 80),
    userComment: cleanOptionalText(input.userComment, 500),
  }) as Promise<FalsePositiveReportedEvent>;
}

export async function readFalsePositiveEvents(filePath = getReportStorePath()): Promise<FalsePositiveEvent[]> {
  let raw = '';
  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    return [];
  }

  const events: FalsePositiveEvent[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as FalsePositiveEvent;
      if (
        parsed.eventType === 'REPORTABLE_DECISION_OBSERVED' ||
        parsed.eventType === 'FALSE_POSITIVE_REPORTED'
      ) {
        events.push(parsed);
      }
    } catch {
      // Skip malformed JSONL lines. The analyzer reports usable evidence only.
    }
  }

  return events;
}

export function getFalsePositiveReportStorePathForDiagnostics(): string {
  return getReportStorePath();
}
