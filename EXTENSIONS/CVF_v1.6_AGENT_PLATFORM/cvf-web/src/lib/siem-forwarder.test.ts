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
});
