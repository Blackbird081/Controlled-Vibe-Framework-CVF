import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { UnifiedAuditEvent } from '@/lib/control-plane-events';
import { appendSIEMConfigEvent } from '@/lib/policy-events';
import { forwardToSIEM } from '@/lib/siem-forwarder';

describe('siem-forwarder', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  const originalFetch = global.fetch;
  let tempDir = '';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-siem-forwarder-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('forwards matching events to the configured webhook with HMAC signature', async () => {
    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: 'https://siem.example.com/ingest',
      signingSecret: 'secret',
      enabled: true,
      eventTypes: 'audit',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    const event: UnifiedAuditEvent = {
      id: 'audit-1',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_2',
      actorRole: 'admin',
      targetResource: '/admin',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'DENIED',
    };

    await forwardToSIEM(event);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://siem.example.com/ingest');
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({
      'Content-Type': 'application/json',
    });
  });

  it('skips non-matching event kinds', async () => {
    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: 'https://siem.example.com/ingest',
      signingSecret: 'secret',
      enabled: true,
      eventTypes: 'cost',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    await forwardToSIEM({
      id: 'audit-1',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_2',
      actorRole: 'admin',
      targetResource: '/admin',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'DENIED',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips forwarding when no SIEM config has been set', async () => {
    await forwardToSIEM({
      id: 'audit-2',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_2',
      actorRole: 'admin',
      targetResource: '/admin',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'DENIED',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips forwarding when SIEM config is disabled', async () => {
    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: 'https://siem.example.com/ingest',
      signingSecret: 'secret',
      enabled: false,
      eventTypes: 'all',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    await forwardToSIEM({
      id: 'audit-3',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_2',
      actorRole: 'admin',
      targetResource: '/admin',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'DENIED',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips forwarding when webhookUrl is blank', async () => {
    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: '   ',
      signingSecret: 'secret',
      enabled: true,
      eventTypes: 'all',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    await forwardToSIEM({
      id: 'audit-4',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'ADMIN_ACCESS_DENIED',
      actorId: 'usr_2',
      actorRole: 'admin',
      targetResource: '/admin',
      action: 'READ_ADMIN_ROUTE',
      outcome: 'DENIED',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when webhook returns a non-2xx status (caller appendAuditEvent catches via void+.catch)', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: 'https://siem.example.com/ingest',
      signingSecret: 'secret',
      enabled: true,
      eventTypes: 'all',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    await expect(
      forwardToSIEM({
        id: 'audit-5',
        kind: 'audit',
        evidenceClass: 'FULL',
        timestamp: '2026-04-18T01:00:00.000Z',
        eventType: 'ADMIN_ACCESS_DENIED',
        actorId: 'usr_2',
        actorRole: 'admin',
        targetResource: '/admin',
        action: 'READ_ADMIN_ROUTE',
        outcome: 'DENIED',
      }),
    ).rejects.toThrow('503');
  });

  it('sends correct HMAC-SHA256 X-CVF-Signature header', async () => {
    const { createHmac } = await import('node:crypto');

    const signingSecret = 'test-signing-secret-abc123';
    await appendSIEMConfigEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      webhookUrl: 'https://siem.example.com/ingest',
      signingSecret,
      enabled: true,
      eventTypes: 'all',
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    const event: UnifiedAuditEvent = {
      id: 'audit-6',
      kind: 'audit',
      evidenceClass: 'FULL',
      timestamp: '2026-04-18T01:00:00.000Z',
      eventType: 'BREAK_GLASS_USED',
      actorId: 'break-glass',
      actorRole: 'owner',
      targetResource: '/admin/settings',
      action: 'EMERGENCY_ACCESS',
      outcome: 'GRANTED',
    };

    await forwardToSIEM(event);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const sentBody = (fetchMock.mock.calls[0][1] as RequestInit).body as string;
    const expectedHmac = createHmac('sha256', signingSecret)
      .update(sentBody, 'utf8')
      .digest('hex');
    const sentHeaders = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(sentHeaders['X-CVF-Signature']).toBe(`hmac-sha256:${expectedHmac}`);
  });
});
