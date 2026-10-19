import * as fs from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { fetchGovernanceReceipt } from './proof';

vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn(async () => ({ authMode: 'session',
  expiresAt: Date.now() + 60_000, userId: 'u1', orgId: 'o1', teamId: 't1', role: 'owner' })) }));
vi.mock('@/lib/middleware-auth', () => ({ verifySessionCookie: vi.fn() }));
vi.mock('./proof', () => ({ fetchGovernanceReceipt: vi.fn() }));
const body = { title: 'Review', sourcePath: 'p', sourceContent: '# source', memoryClass: 'FULL_RECORD',
  status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' };
describe('selected synthetic job export', () => {
  it('requires normal same-origin session and never reads service token or fetches receipt', async () => {
    const root = await fs.mkdtemp(path.join(process.env.CVF_NCR_R1_FIXTURE_ROOT!, 'cvf-job-export-'));
    const marker = path.join(root, '.cvf-html-draft-synthetic.json');
    const prior = { draft: process.env.CVF_NCR_DRAFT_PROFILE, job: process.env.CVF_NCR_HTML_JOB_PROFILE,
      root: process.env.CVF_NCR_DRAFT_ROOT, runId: process.env.CVF_NCR_DRAFT_RUN_ID };
    try {
      await fs.writeFile(marker, JSON.stringify({ schemaVersion: 1, kind: 'CVF_HTML_DRAFT_SYNTHETIC', syntheticOnly: true, runId: 'synthetic_run_1234' }));
      process.env.CVF_NCR_DRAFT_PROFILE = 'LOCAL_SYNTHETIC'; process.env.CVF_NCR_HTML_JOB_PROFILE = 'LOCAL_SYNTHETIC';
      process.env.CVF_NCR_DRAFT_ROOT = root; process.env.CVF_NCR_DRAFT_RUN_ID = 'synthetic_run_1234';
      const getter = vi.fn(() => 'unused');
      const realProcess = process;
      const env = new Proxy(realProcess.env, { get(target, key) { if (key === 'CVF_SERVICE_TOKEN') return getter();
        return Reflect.get(target, key); } });
      vi.stubGlobal('process', Object.assign(Object.create(realProcess), { env }));
      const request = (origin: string) => new NextRequest('http://localhost/api/artifacts/export', { method: 'POST',
        headers: { origin, 'Content-Type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body) });
      const response = await POST(request('http://localhost'));
      const payload = await response.json();
      expect(response.status).toBe(200);
      expect(payload.data.governanceReceiptStatus).toBe('NOT_CONFIGURED');
      expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(getter).not.toHaveBeenCalled();
      expect(fetchGovernanceReceipt).not.toHaveBeenCalled();
      expect((await POST(request('http://foreign'))).status).toBe(403);
    } finally {
      vi.unstubAllGlobals();
      for (const [key, value] of Object.entries({ CVF_NCR_DRAFT_PROFILE: prior.draft, CVF_NCR_HTML_JOB_PROFILE: prior.job,
        CVF_NCR_DRAFT_ROOT: prior.root, CVF_NCR_DRAFT_RUN_ID: prior.runId })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
      await fs.unlink(marker); await fs.rmdir(root);
    }
  });
});
