import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveHtmlDraftSyntheticProfile, SYNTHETIC_MARKER, SYNTHETIC_RECORD_PREFIX } from './html-draft-synthetic-profile';

describe('HTML draft synthetic server profile', () => {
  it('is OFF by default and in production, including caller-shaped env', () => {
    expect(resolveHtmlDraftSyntheticProfile({})).toBeNull();
    expect(resolveHtmlDraftSyntheticProfile({ NODE_ENV: 'production', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC' })).toBeNull();
  });
  it('requires an exact exclusive marker, run identity and owned absolute root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ncr-synthetic-profile-'));
    const runId = 'fixture_run_1234567890';
    const env = { NODE_ENV: 'development', CVF_NCR_DRAFT_PROFILE: 'LOCAL_SYNTHETIC', CVF_NCR_DRAFT_ROOT: root, CVF_NCR_DRAFT_RUN_ID: runId };
    expect(resolveHtmlDraftSyntheticProfile(env)).toBeNull();
    const marker = path.join(root, SYNTHETIC_MARKER);
    fs.writeFileSync(marker, JSON.stringify({ schemaVersion: 1, kind: 'CVF_HTML_DRAFT_SYNTHETIC', syntheticOnly: true, runId }), { flag: 'wx' });
    expect(resolveHtmlDraftSyntheticProfile(env)).toEqual({ profile: { kind: 'local-synthetic', root, production: false }, recordPrefix: SYNTHETIC_RECORD_PREFIX });
    expect(resolveHtmlDraftSyntheticProfile({ ...env, CVF_NCR_DRAFT_RUN_ID: 'different_run_1234567890' })).toBeNull();
    expect(resolveHtmlDraftSyntheticProfile({ ...env, CVF_NCR_DRAFT_ROOT: '.' })).toBeNull();
    fs.writeFileSync(marker, '{}');
    expect(resolveHtmlDraftSyntheticProfile(env)).toBeNull();
  });
});
