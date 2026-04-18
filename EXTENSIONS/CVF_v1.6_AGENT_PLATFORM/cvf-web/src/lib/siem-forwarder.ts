import { createHmac } from 'node:crypto';

import type { ControlPlaneEvent } from '@/lib/control-plane-events';
import { getActiveSIEMConfig } from '@/lib/policy-reader';

function matchesEventFilter(event: ControlPlaneEvent, filter: 'audit' | 'cost' | 'all'): boolean {
  if (filter === 'all') return true;
  return event.kind === filter;
}

function buildSIEMPayload(event: ControlPlaneEvent): string {
  return JSON.stringify({
    '@timestamp': event.timestamp,
    event,
  });
}

export async function forwardToSIEM(event: ControlPlaneEvent): Promise<void> {
  const config = await getActiveSIEMConfig();
  if (!config?.enabled || !config.webhookUrl.trim()) {
    return;
  }

  if (!matchesEventFilter(event, config.eventTypes)) {
    return;
  }

  const payload = buildSIEMPayload(event);
  const signature = createHmac('sha256', config.signingSecret).update(payload, 'utf8').digest('hex');

  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CVF-Signature': `hmac-sha256:${signature}`,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`SIEM webhook rejected event with status ${response.status}`);
  }
}
