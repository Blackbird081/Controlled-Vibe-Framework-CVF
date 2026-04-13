import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifySessionCookieMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/middleware-auth', () => ({
  verifySessionCookie: verifySessionCookieMock,
}));

import { POST } from './route';

describe('/api/governance/external-assets/prepare', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CVF_SERVICE_TOKEN;
    verifySessionCookieMock.mockReset();
    verifySessionCookieMock.mockResolvedValue({
      user: 'tester',
      role: 'admin',
      expiresAt: Date.now() + 1000 * 60 * 60,
    });
  });

  it('returns 401 when no session and no service token', async () => {
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/governance/external-assets/prepare', {
      method: 'POST',
      body: JSON.stringify({
        profile: {},
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Unauthorized/);
  });

  it('returns 400 when profile is missing', async () => {
    const req = new Request('http://localhost/api/governance/external-assets/prepare', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/profile/);
  });

  it('runs the bounded external-asset governance pipeline end-to-end', async () => {
    process.env.CVF_SERVICE_TOKEN = 'svc';
    verifySessionCookieMock.mockResolvedValueOnce(null);

    const req = new Request('http://localhost/api/governance/external-assets/prepare', {
      method: 'POST',
      headers: { 'x-cvf-service-token': 'svc' },
      body: JSON.stringify({
        profile: {
          source_ref: 'Windows_Skill_Normalization/CVF_W7_Windows_Skill_Normalization.md',
          source_kind: 'document_bundle',
          source_quality: 'internal_design_draft',
          officially_verified: false,
          provenance_notes: 'Curated from Windows skill normalization packet.',
          candidate_asset_type: 'W7SkillAsset',
          description_or_trigger: 'Normalize Windows PowerShell skills for CVF',
          instruction_body:
            'Normalize PowerShell-oriented skills for governed CVF use.\\n```powershell\\nGet-ChildItem\\n```',
          tools: ['powershell'],
          execution_environment: {
            os: 'windows',
            shell: 'powershell',
            shell_version: '7.5',
            script_type: 'ps1',
            compatibility: 'native',
          },
        },
        semanticItems: [
          'CONTEXT_VALIDATION_REQUIRED',
          { semanticItem: 'COMPLETE_OUTPUT_REQUIRED', declaredClass: 'output_contract' },
        ],
        windows: {
          commandsValidated: true,
          unsupportedOperatorsRemoved: true,
          exitCodeHandlingExplicit: true,
          deterministicExecution: true,
        },
        registry: {
          governanceOwner: 'cvf-architecture',
          approvalState: 'approved',
          riskLevel: 'R1',
          registryRefs: ['cvf://registry/w7/windows-normalization'],
          evaluationEnabled: true,
        },
        diagnostic: {
          taskId: 'task-001',
          runId: 'run-001',
          runtimeIndicator: 'NOT_PROVIDED',
        },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.readyForRegistry).toBe(true);
    expect(data.data.intake.valid).toBe(true);
    expect(data.data.semanticPolicy.valid).toBe(true);
    expect(data.data.normalizedCandidate.valid).toBe(true);
    expect(data.data.registryReady.valid).toBe(true);
    expect(data.data.windowsCompatibility.classification).toBe('WINDOWS_NATIVE');
    expect(data.data.diagnosticPacket.executionEnvironmentSummary.declared).toBe(true);
    expect(data.data.registryReady.governedAsset.governance.owner).toBe('cvf-architecture');
  });

  it('surfaces invalid intake shape through the runnable diagnostic pipeline', async () => {
    const req = new Request('http://localhost/api/governance/external-assets/prepare', {
      method: 'POST',
      body: JSON.stringify({
        profile: {
          source_ref: 'CVF_ADDING_NEW/skill.md',
          source_kind: 'repo',
          source_quality: 'community_analysis',
          officially_verified: false,
          provenance_notes: '',
          candidate_asset_type: 'W7SkillAsset',
          description_or_trigger: 'Convert shell skill into governed CVF asset',
          instruction_body:
            'Use shell script directly.\\n```bash\\necho test\\n```',
        },
        windows: {
          commandsValidated: false,
          unsupportedOperatorsRemoved: false,
          exitCodeHandlingExplicit: false,
          deterministicExecution: false,
        },
      }),
    });

    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.readyForRegistry).toBe(false);
    expect(data.data.intake.valid).toBe(false);
    expect(data.data.diagnosticPacket.primaryAttribution).toBe('INTAKE_SHAPE');
    expect(data.data.windowsCompatibility.classification).toBe('REJECTED_FOR_WINDOWS_TARGET');
    expect(data.data.warnings).toContain('INTAKE_REQUIRED_PROVENANCE_NOTES');
  });
});
