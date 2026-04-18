import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { applyDLPFilter } from '@/lib/dlp-filter';
import { appendDLPPolicyEvent } from '@/lib/policy-events';

describe('dlp-filter', () => {
  const originalPath = process.env.CVF_CONTROL_PLANE_EVENTS_PATH;
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'cvf-dlp-filter-'));
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

  it('redacts preset credit-card and email patterns', async () => {
    const result = await applyDLPFilter('Reach me at alice@example.com and use 4111 1111 1111 1111.');

    expect(result.wasRedacted).toBe(true);
    expect(result.redacted).toContain('[REDACTED:Email]');
    expect(result.redacted).toContain('[REDACTED:Credit Card]');
    expect(result.matches.map(match => match.label)).toEqual(expect.arrayContaining(['Email', 'Credit Card']));
  });

  it('applies custom patterns from the append-only policy store', async () => {
    await appendDLPPolicyEvent({
      timestamp: '2026-04-18T00:00:00.000Z',
      patterns: [
        {
          id: 'custom-project-code',
          label: 'Project Code',
          regex: String.raw`CVF-\d{4}`,
          enabled: true,
        },
      ],
      setBy: 'usr_2',
      setAt: '2026-04-18T00:00:00.000Z',
    });

    const result = await applyDLPFilter('Internal launch code: CVF-2026');

    expect(result.redacted).toContain('[REDACTED:Project Code]');
    expect(result.matches).toContainEqual({
      patternId: 'custom-project-code',
      label: 'Project Code',
      matchCount: 1,
    });
  });

  it('does not redact allowlisted model names or internal env tokens', async () => {
    const result = await applyDLPFilter('Allowed references: qwen-max, gpt-4o, CVF_BREAK_GLASS_TOKEN');

    expect(result.wasRedacted).toBe(false);
    expect(result.redacted).toContain('qwen-max');
    expect(result.redacted).toContain('CVF_BREAK_GLASS_TOKEN');
  });
});
