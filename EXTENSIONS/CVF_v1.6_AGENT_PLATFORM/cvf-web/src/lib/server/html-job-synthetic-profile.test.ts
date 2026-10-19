import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveHtmlJobSyntheticProfile } from './html-job-synthetic-profile';

describe('job writer profile', () => {
  it('is separately opted in, validates the draft fixture marker, and stays off in production', async () => {
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-profile-'));
    const marker = path.join(root, '.cvf-html-draft-synthetic.json');
    try {
      await fs.writeFile(marker, JSON.stringify({ schemaVersion: 1, kind: 'CVF_HTML_DRAFT_SYNTHETIC', syntheticOnly: true, runId: 'synthetic_run_1234' }));
      const env = { NODE_ENV: 'test', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_ROOT: root,
        CVF_NCR_DRAFT_RUN_ID: 'synthetic_run_1234' };
      expect(resolveHtmlJobSyntheticProfile(env)).toBeNull();
      expect(resolveHtmlJobSyntheticProfile({ ...env, CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC' })?.jobDecisions).toBe(true);
      expect(resolveHtmlJobSyntheticProfile({ ...env, CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC', NODE_ENV: 'production' })).toBeNull();
      await fs.writeFile(marker, '{}');
      expect(resolveHtmlJobSyntheticProfile({ ...env, CVF_NCR_HTML_JOB_PROFILE: 'LOCAL_SYNTHETIC' })).toBeNull();
    } finally { await fs.unlink(marker); await fs.rmdir(root); }
  });
});
