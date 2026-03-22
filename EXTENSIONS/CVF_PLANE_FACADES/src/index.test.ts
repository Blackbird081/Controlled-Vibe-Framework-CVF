import {
  createExecutionFacade,
  createGovernanceFacade,
  createKnowledgeFacade,
  createLearningFacade,
  type Guard,
  type GuardRequestContext,
} from './index';
import {
  createControlPlaneFoundationShell,
  resetDocCounter,
} from 'cvf-control-plane-foundation';

function createBlockForbiddenGuard(): Guard {
  return {
    id: 'block_forbidden',
    name: 'Block Forbidden Test Guard',
    description: 'Blocks actions containing the word forbidden for facade smoke testing.',
    priority: 999,
    enabled: true,
    evaluate(context: GuardRequestContext) {
      const blocked = context.action.toLowerCase().includes('forbidden');
      return {
        guardId: 'block_forbidden',
        decision: blocked ? 'BLOCK' : 'ALLOW',
        severity: blocked ? 'ERROR' : 'INFO',
        reason: blocked ? 'Forbidden action intercepted by smoke test guard.' : 'Allowed by smoke test guard.',
        timestamp: new Date().toISOString(),
        agentGuidance: blocked ? 'Do not continue with the forbidden action.' : 'Action is acceptable.',
        suggestedAction: blocked ? 'remove_forbidden_action' : 'continue',
      };
    },
  };
}

describe('CVF Plane Facades', () => {
  it('validates governance phase transitions and helper metadata', () => {
    const governance = createGovernanceFacade({ enableAuditLog: false });

    expect(governance.validatePhaseTransition('INTAKE', 'DESIGN')).toMatchObject({
      valid: true,
      currentPhase: 'INTAKE',
      targetPhase: 'DESIGN',
    });
    expect(governance.validatePhaseTransition('BUILD', 'FREEZE')).toMatchObject({
      valid: false,
      currentPhase: 'BUILD',
      targetPhase: 'FREEZE',
    });
    expect(governance.getRiskNumeric('R3')).toBe(3);
    expect(governance.isMandatoryGuard('ai_commit')).toBe(true);
    expect(governance.isMandatoryGuard('nonexistent_guard')).toBe(false);
  });

  it('records governance decisions and honors additional blocking guards', () => {
    const governance = createGovernanceFacade({ enableAuditLog: true });
    governance.registerAdditionalGuard(createBlockForbiddenGuard());

    const allowed = governance.checkAction({
      action: 'read docs/README.md',
      phase: 'REVIEW',
      riskLevel: 'R0',
      role: 'REVIEWER',
      channel: 'api',
    });

    const blocked = governance.checkAction({
      action: 'forbidden read report',
      phase: 'REVIEW',
      riskLevel: 'R0',
      role: 'REVIEWER',
      channel: 'api',
    });

    expect(allowed.allowed).toBe(true);
    expect(allowed.decision).toBe('ALLOW');
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockedBy).toBe('block_forbidden');
    expect(governance.getAuditLog()).toHaveLength(2);
    expect(governance.getRawAuditLog()).toHaveLength(2);
  });

  it('enforces governance before execution and routes models by risk', async () => {
    const governance = createGovernanceFacade({ enableAuditLog: false });
    governance.registerAdditionalGuard(createBlockForbiddenGuard());

    const permissiveGovernance = {
      evaluateGuards: () => ({
        requestId: 'exec-allow',
        finalDecision: 'ALLOW' as const,
        results: [],
        executedAt: new Date().toISOString(),
        durationMs: 1,
      }),
    } as unknown as Parameters<typeof createExecutionFacade>[0];

    const execution = createExecutionFacade(permissiveGovernance);
    const guardedExecution = createExecutionFacade(governance);

    const success = await execution.execute({
      executionId: 'exec-allow',
      action: 'read docs/README.md',
      agentId: 'agent-1',
      riskLevel: 'R0',
      channel: 'api',
    });

    const blocked = await guardedExecution.execute({
      executionId: 'exec-block',
      action: 'forbidden read docs',
      agentId: 'agent-2',
      riskLevel: 'R0',
      channel: 'api',
    });

    expect(success.status).toBe('SUCCESS');
    expect(success.guardResult.finalDecision).toBe('ALLOW');
    expect(blocked.status).toBe('BLOCKED');
    expect(blocked.error).toContain('Blocked by governance');
    expect(guardedExecution.routeModel({ prompt: 'hi', riskLevel: 'R0' })).toEqual({
      tier: 'CHEAP',
      strategy: 'SINGLE_SHOT',
    });
    expect(guardedExecution.routeModel({ prompt: 'hard task', riskLevel: 'R3' })).toEqual({
      tier: 'REASONING',
      strategy: 'ITERATIVE',
    });
    expect(execution.getExecutionLog()).toHaveLength(1);
    expect(guardedExecution.getExecutionLog()).toHaveLength(1);
  });

  it('packages context deterministically within a token budget', () => {
    const knowledge = createKnowledgeFacade();
    const chunks = [
      { id: 'c1', source: 'doc-1', content: 'A'.repeat(20), relevanceScore: 0.9 },
      { id: 'c2', source: 'doc-2', content: 'B'.repeat(20), relevanceScore: 0.8 },
      { id: 'c3', source: 'doc-3', content: 'C'.repeat(20), relevanceScore: 0.7 },
    ];

    const packaged = knowledge.packageContext(chunks, 10);
    const packagedAgain = knowledge.packageContext(chunks, 10);

    expect(packaged.chunks).toHaveLength(2);
    expect(packaged.truncated).toBe(true);
    expect(packaged.totalTokens).toBe(10);
    expect(packaged.snapshotHash).toBe(packagedAgain.snapshotHash);
    expect(packaged.snapshotHash).toHaveLength(32);
  });

  it('prepares one usable intake result through the shared control-plane contract', () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: 'Finance Approval Policy',
      content: 'Finance spend over 500 requires manager review and explicit evidence.',
      tier: 'T2_POLICY',
      documentType: 'policy',
      domain: 'finance',
      tags: ['finance', 'approval'],
      metadata: {
        source: 'finance-policy',
        owner: 'control-plane',
      },
    });

    const knowledge = createKnowledgeFacade({
      shell,
      now: () => '2026-03-22T11:00:00.000Z',
    });
    const prepared = knowledge.prepareIntake({
      vibe: 'Approve finance spend after manager review and keep the amount below 500 dollars.',
      tokenBudget: 40,
      consumerId: 'facade-intake-test',
      retrieval: {
        maxChunks: 3,
        sources: ['finance-policy'],
        filters: {
          owner: 'control-plane',
        },
      },
    });

    expect(prepared.requestId).toHaveLength(32);
    expect(prepared.intent.valid).toBe(true);
    expect(prepared.intent.intent.domain).toBe('finance');
    expect(prepared.retrieval.chunkCount).toBe(1);
    expect(prepared.packagedContext.snapshotHash).toHaveLength(32);
    expect(prepared.packagedContext.chunks[0]?.source).toBe('finance-policy');
    expect(prepared.warnings).toEqual([]);
    expect(knowledge.getRetrievalLog()).toHaveLength(1);
  });

  it('filters PII and records retrieval activity through the CP1 shell', () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    shell.knowledge.getStore().add({
      title: 'CVF Governance Guide',
      content: 'CVF governance requires explicit evidence and control-plane alignment.',
      tier: 'T2_POLICY',
      documentType: 'policy',
      domain: 'governance',
      tags: ['cvf', 'governance'],
      metadata: {
        source: 'governance-doc',
        owner: 'control-plane',
      },
    });

    const knowledge = createKnowledgeFacade({ shell });

    const filtered = knowledge.filterPII(
      'Contact me at alice@example.com with api_key_sk-12345678901234567890 and -----BEGIN PRIVATE KEY-----',
    );
    const retrieved = knowledge.retrieveContext('cvf governance', {
      maxChunks: 3,
      sources: ['governance-doc'],
      filters: {
        owner: 'control-plane',
      },
    });

    expect(filtered.piiDetected).toBe(true);
    expect(filtered.filteredCount).toBeGreaterThanOrEqual(2);
    expect(filtered.content).toContain('[REDACTED:email]');
    expect(filtered.content).toContain('[REDACTED:private_key]');
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0]).toMatchObject({
      source: 'governance-doc',
    });
    expect(retrieved[0]?.metadata?.title).toBe('CVF Governance Guide');
    expect(knowledge.getRetrievalLog()).toHaveLength(1);
  });

  it('gracefully degrades when learning is disabled', () => {
    const learning = createLearningFacade();

    learning.recordTaskOutcome({
      taskId: 'task-1',
      agentId: 'agent-1',
      executionId: 'exec-1',
      status: 'SUCCESS',
      phase: 'FREEZE',
      durationMs: 100,
    });

    expect(learning.isEnabled()).toBe(false);
    expect(learning.getAgentReputation('agent-1')).toMatchObject({
      agentId: 'agent-1',
      score: 0.5,
      trend: 'STABLE',
      taskCount: 0,
      successRate: 0,
    });
    expect(learning.processBatch()).toEqual({ processed: 0, updated: 0 });
  });

  it('updates reputation in bounded batches and flushes metrics when enabled', () => {
    const learning = createLearningFacade({
      enabled: true,
      maxReputationDeltaPerCycle: 0.1,
      batchIntervalMs: 1_000,
    });

    learning.recordTaskOutcome({
      taskId: 'task-1',
      agentId: 'agent-9',
      executionId: 'exec-9',
      status: 'SUCCESS',
      phase: 'FREEZE',
      durationMs: 50,
    });
    learning.recordTaskOutcome({
      taskId: 'task-2',
      agentId: 'agent-9',
      executionId: 'exec-10',
      status: 'SUCCESS',
      phase: 'FREEZE',
      durationMs: 60,
    });
    learning.emitMetric('guard_latency_ms', 42, { plane: 'learning' });

    const batch = learning.processBatch();
    const reputation = learning.getAgentReputation('agent-9');
    const flushed = learning.flushMetrics();

    expect(batch).toEqual({ processed: 2, updated: 1 });
    expect(reputation.score).toBeCloseTo(0.6, 5);
    expect(reputation.successRate).toBe(1);
    expect(reputation.trend).toBe('IMPROVING');
    expect(flushed).toHaveLength(1);
    expect(learning.getMetricsBuffer()).toHaveLength(0);
  });
});
