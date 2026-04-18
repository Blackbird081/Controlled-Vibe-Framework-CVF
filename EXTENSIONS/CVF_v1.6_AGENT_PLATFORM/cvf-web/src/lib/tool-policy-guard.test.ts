import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { appendToolPolicyEvent } from '@/lib/policy-events';
import { canUseTool, getDefaultToolRoles, getEffectiveToolRoles } from '@/lib/tool-policy-guard';

describe('tool-policy-guard', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-tool-policy-guard-'));
    process.env.CVF_CONTROL_PLANE_EVENTS_PATH = path.join(tempDir, 'events.json');
  });

  afterEach(async () => {
    if (originalPath) {
      process.env.CVF_CONTROL_PLANE_EVENTS_PATH = originalPath;
    } else {
      delete process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns default roles from the catalog category matrix', () => {
    expect(getDefaultToolRoles('calculator')).toEqual(['owner', 'admin', 'developer', 'reviewer', 'viewer']);
    expect(getDefaultToolRoles('code_execute')).toEqual(['owner', 'admin', 'developer']);
  });

  it('uses the latest custom policy when present', async () => {
    await appendToolPolicyEvent({
      timestamp: '2026-04-18T09:00:00.000Z',
      toolId: 'web_search',
      allowedRoles: ['owner', 'admin'],
      setBy: 'usr_2',
      setAt: '2026-04-18T09:00:00.000Z',
    });

    expect(await getEffectiveToolRoles('web_search')).toEqual(['owner', 'admin']);
    expect(await canUseTool('web_search', 'reviewer')).toBe(false);
    expect(await canUseTool('web_search', 'admin')).toBe(true);
  });
});
