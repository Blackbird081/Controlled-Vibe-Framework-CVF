/**
 * CVF v1.7.1 Safety Runtime — RefusalRouter, LLMAdapter, Deploy & PR Gateway Tests (W6-T78)
 * ===========================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 contracts):
 *   kernel/04_refusal_router/refusal.router.ts:
 *     RefusalRouter.evaluate — R0→not blocked; R4→blocked+block; R3→blocked+needs_approval;
 *       R2+driftDetected→blocked+clarify
 *   kernel-architecture/runtime/llm_adapter.ts:
 *     LLMAdapter.generate — wrong token→throws; correct token+provider→delegates;
 *       correct token+no provider+message→"CVF response: <msg>"; no message→"CVF response generated."
 *   skills/dev-automation/deploy.gateway.ts:
 *     deployArtifact — no client→throws; registerDeployClient+deploy→success
 *   skills/dev-automation/pr.gateway.ts:
 *     createPRFromArtifact — no client→throws; registerPRClient+create→branchName+title+files
 */

import { describe, it, expect } from 'vitest';

import { RefusalRouter } from '../kernel-architecture/kernel/04_refusal_router/refusal.router';
import { LLMAdapter } from '../kernel-architecture/runtime/llm_adapter';
import {
  registerDeployClient,
  deployArtifact,
} from '../skills/dev-automation/deploy.gateway';
import {
  registerPRClient,
  createPRFromArtifact,
} from '../skills/dev-automation/pr.gateway';
import type { RiskAssessment } from '../kernel-architecture/kernel/03_contamination_guard/risk.types';
import type { DevArtifact } from '../skills/dev-automation/artifact.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeAssessment(overrides: Partial<RiskAssessment> = {}): RiskAssessment {
  return {
    level: 'low',
    cvfRiskLevel: 'R0',
    score: 0,
    reasons: [],
    ...overrides,
  };
}

function makeArtifact(overrides: Partial<DevArtifact> = {}): DevArtifact {
  return {
    proposalId: 'prop-abc',
    artifactType: 'CODE',
    createdBy: 'user-1',
    createdAt: 1_000_000,
    checksum: 'abc123',
    fileChanges: [
      {
        filePath: 'src/main.ts',
        content: 'const x = 1;',
        diffSize: 10,
        isNewFile: true,
        isDeleted: false,
        touchesDependencyFile: false,
        touchesMigrationFile: false,
        touchesPolicyFile: false,
        touchesCoreFile: false,
      },
    ],
    metrics: {
      tokensUsed: 100,
      generationTimeMs: 200,
      modelUsed: 'gpt-4',
      filesGenerated: 1,
    },
    ...overrides,
  };
}

// ─── RefusalRouter ───────────────────────────────────────────────────────────

describe('RefusalRouter.evaluate', () => {
  const router = new RefusalRouter();

  it('R0 risk → blocked=false, action="allow"', () => {
    const decision = router.evaluate(makeAssessment({ cvfRiskLevel: 'R0' }));
    expect(decision.blocked).toBe(false);
    expect(decision.action).toBe('allow');
    expect(typeof decision.policyVersion).toBe('string');
  });

  it('R4 risk → blocked=true, action="block", response includes blocked message', () => {
    const decision = router.evaluate(makeAssessment({ cvfRiskLevel: 'R4', level: 'critical', score: 95 }));
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('block');
    expect(decision.response?.message).toContain('blocked');
  });

  it('R3 risk → blocked=true, action="needs_approval"', () => {
    const decision = router.evaluate(makeAssessment({ cvfRiskLevel: 'R3', level: 'high', score: 75 }));
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('needs_approval');
  });

  it('R2 + driftDetected=true → blocked=true, action="clarify"', () => {
    const decision = router.evaluate(
      makeAssessment({ cvfRiskLevel: 'R2', level: 'medium', score: 50, driftDetected: true }),
    );
    expect(decision.blocked).toBe(true);
    expect(decision.action).toBe('clarify');
    expect(decision.response?.message).toBeDefined();
  });
});

// ─── LLMAdapter ──────────────────────────────────────────────────────────────

describe('LLMAdapter.generate', () => {
  it('wrong token → throws "Direct LLM access blocked"', async () => {
    const adapter = new LLMAdapter();
    const wrongToken = Symbol('wrong');
    await expect(adapter.generate({ message: 'hello' }, wrongToken)).rejects.toThrow(
      'Direct LLM access blocked',
    );
  });

  it('no token passed → throws "Direct LLM access blocked"', async () => {
    const adapter = new LLMAdapter();
    await expect(adapter.generate({ message: 'hello' })).rejects.toThrow('Direct LLM access blocked');
  });

  it('correct token + custom provider → delegates to provider', async () => {
    const token = Symbol('exec-token');
    const adapter = new LLMAdapter(async () => 'provider-result', token);
    const result = await adapter.generate({ message: 'anything' }, token);
    expect(result).toBe('provider-result');
  });

  it('correct token + no provider + message → "CVF response: <message>"', async () => {
    const token = Symbol('exec-token');
    const adapter = new LLMAdapter(undefined, token);
    const result = await adapter.generate({ message: 'analyze this' }, token);
    expect(result).toBe('CVF response: analyze this');
  });
});

// ─── deploy.gateway ──────────────────────────────────────────────────────────

describe('deploy.gateway', () => {
  it('deployArtifact without registered client → throws "Deploy client not registered"', async () => {
    // module state: deployClient starts null (first access in this test file)
    await expect(deployArtifact(makeArtifact(), 'DEV')).rejects.toThrow(
      'Deploy client not registered',
    );
  });

  it('registerDeployClient + deployArtifact → calls client.deploy and returns result', async () => {
    const mockResult = {
      deploymentId: 'dep-001',
      environment: 'STAGING' as const,
      status: 'SUCCESS' as const,
      timestamp: Date.now(),
    };
    registerDeployClient({
      deploy: async ({ environment }) => ({ ...mockResult, environment }),
    });
    const result = await deployArtifact(makeArtifact(), 'STAGING');
    expect(result.status).toBe('SUCCESS');
    expect(result.environment).toBe('STAGING');
    expect(result.deploymentId).toBe('dep-001');
  });
});

// ─── pr.gateway ──────────────────────────────────────────────────────────────

describe('pr.gateway', () => {
  it('createPRFromArtifact without registered client → throws "PR client not registered"', async () => {
    // module state: prClient starts null (first access in this test file)
    await expect(createPRFromArtifact(makeArtifact())).rejects.toThrow('PR client not registered');
  });

  it('registerPRClient + createPRFromArtifact → branchName follows cvf/<proposalId> convention', async () => {
    let capturedParams: any;
    registerPRClient({
      createPullRequest: async (params) => {
        capturedParams = params;
        return { prId: 'pr-001', prUrl: 'https://github.com/pr/1', branchName: params.branchName };
      },
    });
    const artifact = makeArtifact({ proposalId: 'prop-xyz' });
    const result = await createPRFromArtifact(artifact);
    expect(capturedParams.branchName).toBe('cvf/prop-xyz');
    expect(capturedParams.title).toContain('prop-xyz');
    expect(capturedParams.files.length).toBe(1);
    expect(result.prId).toBe('pr-001');
  });
});
