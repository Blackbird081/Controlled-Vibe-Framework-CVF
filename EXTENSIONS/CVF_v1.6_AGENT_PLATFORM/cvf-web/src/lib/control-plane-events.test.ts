import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  appendAuditEvent,
  appendCostEvent,
  computeAuditCsvSignature,
  exportAuditEventsToCsv,
  getFinOpsSummary,
  readAuditEvents,
} from './control-plane-events';

describe('control-plane-events', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-admin-events-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
  });

  afterEach(async () => {
    delete process.env.CVF_AUDIT_SIGNING_KEY;
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('stores audit events and exports them to csv', async () => {
    await appendAuditEvent({
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_3',
      actorRole: 'developer',
      targetResource: '/admin/team',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'REDIRECTED',
    });

    const events = await readAuditEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('ADMIN_ACCESS_DENIED');

    const csv = await exportAuditEventsToCsv();
    expect(csv).toContain('ADMIN_ACCESS_DENIED');
    expect(csv).toContain('/admin/team');
    expect(csv).toContain('# WARNING: UNSIGNED EXPORT');
  });

  it('appends a signature trailer when CVF_AUDIT_SIGNING_KEY is configured', async () => {
    process.env.CVF_AUDIT_SIGNING_KEY = 'test-signing-key';

    await appendAuditEvent({
      timestamp: '2026-04-18T08:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_3',
      actorRole: 'developer',
      targetResource: '/admin/team',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'REDIRECTED',
    });

    const csv = await exportAuditEventsToCsv();
    const [body] = csv.split('\n# CVF-AUDIT-SIGNATURE: ');
    const signatureLine = csv.split('\n').find(line => line.startsWith('# CVF-AUDIT-SIGNATURE:'));

    expect(signatureLine).toBeDefined();
    expect(signatureLine).toContain(`hmac-sha256:${computeAuditCsvSignature(body, 'test-signing-key')}`);
    expect(csv).toContain('# CVF-AUDIT-RECORD-COUNT: 1');
  });

  it('aggregates finops breakdowns from cost events', async () => {
    await appendCostEvent({
      userId: 'usr_2',
      teamId: 'team_exec',
      orgId: 'org_cvf',
      provider: 'alibaba',
      model: 'qwen-turbo',
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUSD: 0.12,
      skillId: 'SKILL-001',
      templateId: 'strategy',
    });

    const summary = await getFinOpsSummary();
    expect(summary.totalRequests).toBe(1);
    expect(summary.topUsers[0].key).toBe('usr_2');
    expect(summary.topTeams[0].key).toBe('team_exec');
    expect(summary.topSkills[0].key).toBe('SKILL-001');
  });

  it('repairs a corrupted store by recovering the first valid top-level array', async () => {
    const storePath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH as string;
    await writeFile(storePath, '[{"kind":"audit","evidenceClass":"FULL","eventType":"A","actorId":"u","actorRole":"admin","targetResource":"r","action":"x","outcome":"SUCCESS","id":"1","timestamp":"2026-04-18T00:00:00.000Z"}]BROKEN', 'utf8');

    const events = await readAuditEvents();
    const repairedRaw = await readFile(storePath, 'utf8');

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('A');
    expect(() => JSON.parse(repairedRaw)).not.toThrow();
  });
});
