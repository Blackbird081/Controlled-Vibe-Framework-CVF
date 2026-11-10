import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { jevDigest, jevPolicyDigest, type JevAuthorizedPolicy } from '@/lib/server/jev-suggestion-custody';
import { loadJevAuthorizedRuntime } from '@/lib/server/jev-authorized-runtime';
import { requireAdminApiSession } from '@/lib/admin-session';
import { POST } from './route';

vi.mock('@/lib/server/jev-authorized-runtime', () => ({ loadJevAuthorizedRuntime: vi.fn() }));
vi.mock('@/lib/admin-session', () => ({ requireAdminApiSession: vi.fn() }));

describe('actual exported Jev route binding', () => {
  it('uses the trusted snapshot and refuses an unapproved goal before custody or provider contact', async () => {
    const now = Date.now();
    const policy: JevAuthorizedPolicy = { schema: 'cvf.jevAuthorizedPolicy.v1', policyDigest: '',
      effectAuthorizationRef: 'synthetic-effect', dataBoundaryRef: 'synthetic-data',
      costEnvelopeRef: 'synthetic-cost', authorizationEvidenceDigest: jevDigest('synthetic-authority'),
      destination: 'https://api.typesafe.ai/v1/systemone', directory: 'C:\\synthetic-custody',
      writerIdentity: 'synthetic-test', resultRetentionMs: 60_000, tombstoneRetentionMs: 86_400_000,
      currency: 'USD', wideMaxMicrounits: 5, narrowMaxMicrounits: 5, totalMaxMicrounits: 10,
      pricingIdentity: 'synthetic', reportedModels: ['jev-1.14.0'], expiresAt: new Date(now + 600_000).toISOString() };
    policy.policyDigest = jevPolicyDigest(policy);
    const roster = [{ key: 's0', title: 'A', domain: 'B', domainId: 'domain', skillId: 'skill', description: 'D', detail: 'E' }];
    vi.mocked(requireAdminApiSession).mockResolvedValue({ authMode: 'session', role: 'owner', userId: 'fixture',
      orgId: 'org', teamId: 'team', expiresAt: now + 600_000 } as never);
    vi.mocked(loadJevAuthorizedRuntime).mockResolvedValue({ policy, roster, approvedGoalDigest: jevDigest('Approved goal'),
      admission: { status: 'admitted', providerId: 'typesafe', modelId: 'jev-latest', requestedMethod: 'system_one',
        normalizedMethod: 'system_one', supportedMethods: ['system_one'], conformanceStatus: 'conformant',
        liveExecutionAuthorized: false } as never,
      singleAction: { authorizationEvidenceDigest: policy.authorizationEvidenceDigest,
        effectAuthorizationRef: policy.effectAuthorizationRef, inputDigest: jevDigest('Approved goal'),
        rosterDigest: jevDigest('other roster') } });
    const request = new NextRequest('http://localhost/api/skills/suggest', { method: 'POST',
      headers: { origin: 'http://localhost', 'sec-fetch-site': 'same-origin',
        'Content-Type': 'application/json', cookie: 'authjs.session-token=synthetic-signed-cookie' },
      body: JSON.stringify({ goal: 'Unapproved goal content', nonce: 'synthetic_nonce_001' }) });
    const response = await POST(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'ACTION_REFUSED' });
    expect(loadJevAuthorizedRuntime).toHaveBeenCalledTimes(1);
  });
});


it('rejects a goal outside a v2 case manifest before custody or provider',async()=>{
 const now=Date.now();vi.mocked(requireAdminApiSession).mockResolvedValue({authMode:'session',role:'owner',userId:'fixture',orgId:'org',teamId:'team',expiresAt:now+600000} as never);
 vi.mocked(loadJevAuthorizedRuntime).mockResolvedValue({schema:'cvf.jevTrialRuntime.v2',directory:'unused',trialSpec:{manifest:{one:jevDigest('Approved goal')}},roster:[],admission:{}} as never);
 const request=new NextRequest('http://localhost/api/skills/suggest',{method:'POST',headers:{origin:'http://localhost','sec-fetch-site':'same-origin','Content-Type':'application/json',cookie:'authjs.session-token=synthetic-signed-cookie'},body:JSON.stringify({goal:'Unapproved goal content',nonce:'synthetic_nonce_001'})});
 expect((await POST(request)).status).toBe(403);
});
