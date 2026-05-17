import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  appendFalsePositiveReport,
  appendReportableDecisionObserved,
  readFalsePositiveEvents,
} from './false-positive-report';

describe('false-positive-report', () => {
  const originalPath = process.env.CVF_FALSE_POSITIVE_REPORTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-fp-report-'));
    process.env.CVF_FALSE_POSITIVE_REPORTS_PATH = path.join(tempDir, 'false-positive-events.jsonl');
  });

  afterEach(async () => {
    if (originalPath) {
      process.env.CVF_FALSE_POSITIVE_REPORTS_PATH = originalPath;
    } else {
      delete process.env.CVF_FALSE_POSITIVE_REPORTS_PATH;
    }

    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('records observed BLOCK/CLARIFY decisions and later reports as separate events', async () => {
    await appendReportableDecisionObserved({
      receiptId: 'rcpt-001',
      envelopeId: 'env-001',
      decision: 'BLOCK',
      riskLevel: 'R2',
      templateId: 'strategy',
      routeId: '/api/execute',
    });

    await appendFalsePositiveReport({
      receiptId: 'rcpt-001',
      envelopeId: 'env-001',
      decision: 'BLOCK',
      riskLevel: 'R2',
      reason: 'User says this was legitimate work.',
      templateId: 'strategy',
      routeId: '/api/execute',
      actorId: 'usr_1',
      actorRole: 'admin',
    });

    const events = await readFalsePositiveEvents();
    expect(events).toHaveLength(2);
    expect(events.map(event => event.eventType)).toEqual([
      'REPORTABLE_DECISION_OBSERVED',
      'FALSE_POSITIVE_REPORTED',
    ]);
    expect(events[0]).toMatchObject({
      receiptId: 'rcpt-001',
      decision: 'BLOCK',
    });
  });

  it('does not create denominator events for non-reportable decisions', async () => {
    const result = await appendReportableDecisionObserved({
      receiptId: 'rcpt-allow',
      decision: 'ALLOW',
    });

    expect(result).toBeNull();
    await expect(readFalsePositiveEvents()).resolves.toEqual([]);
  });

  it('rejects false-positive reports for decisions outside BLOCK/CLARIFY', async () => {
    await expect(appendFalsePositiveReport({
      receiptId: 'rcpt-approval',
      decision: 'NEEDS_APPROVAL',
    })).rejects.toThrow(/Only BLOCK and CLARIFY/);
  });
});

