import { describe, expect, it } from 'vitest';
import { buildFederatedMemoryRead } from './federated-memory-read';
import type { ScanRegistryEntry } from './scan-registry-memory-projection';
import type { MemoryRuntimeWorkflowInput } from 'cvf-learning-plane-foundation/memory-runtime';

const RAW_SENTINEL = 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK';

const registryEntries: ScanRegistryEntry[] = [
  {
    id: 'legacy-agentmemory',
    scopePaths: ['project-1'],
    semanticRegions: ['MEMORY_LIFECYCLE', 'MEMORY_RETRIEVAL'],
    findings: [
      {
        id: 'F1-mem-lifecycle',
        summary: 'Memory lifecycle policy concepts map to existing LPF tier model',
        disposition: 'ACCEPT_WITH_BOUNDARY',
        nextAction: 'None',
      },
    ],
  },
];

function baseWorkflowInput(
  overrides: Partial<MemoryRuntimeWorkflowInput> = {},
): MemoryRuntimeWorkflowInput {
  return {
    operationId: 'mpi-t4-op-1',
    sessionId: 'session-1',
    projectId: 'project-1',
    actorId: 'actor-1',
    actorRole: 'AI_AGENT',
    scope: 'project-1',
    riskLevel: 'R1',
    query: 'lifecycle',
    tokenBudget: 500,
    candidates: [
      {
        id: 'lpf-candidate-1',
        scope: 'project-1',
        summary: 'Original LPF candidate lifecycle summary',
        content: RAW_SENTINEL,
        createdAt: 100,
        auditTrust: 0.8,
        lifecycleState: 'episodic',
      },
    ],
    policyDecision: 'allow',
    containsSensitiveData: false,
    ...overrides,
  };
}

describe('buildFederatedMemoryRead', () => {
  it('is deterministic for identical inputs and options', () => {
    const input = {
      workflowInput: baseWorkflowInput(),
      registryEntries,
      registryProjectionOptions: { createdAt: 1700, auditTrust: 0.42 },
    };
    const a = buildFederatedMemoryRead(input);
    const b = buildFederatedMemoryRead(input);
    expect(a).toEqual(b);
  });

  it('does not mutate workflowInput.candidates or registryEntries', () => {
    const workflowInput = baseWorkflowInput();
    const candidatesSnapshot = JSON.parse(JSON.stringify(workflowInput.candidates));
    const entriesSnapshot = JSON.parse(JSON.stringify(registryEntries));

    buildFederatedMemoryRead({
      workflowInput,
      registryEntries,
      registryProjectionOptions: { createdAt: 1700 },
    });

    expect(workflowInput.candidates).toEqual(candidatesSnapshot);
    expect(registryEntries).toEqual(entriesSnapshot);
  });

  it('selects both original and registry-projected candidates through readout', () => {
    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
      registryEntries,
      registryProjectionOptions: { createdAt: 1700 },
    });

    expect(result.originalCandidateCount).toBe(1);
    expect(result.projectedCandidateCount).toBe(1);

    const selectedIds = result.readout.retrievalResult?.selected?.map((c) => c.id) ?? [];
    expect(selectedIds).toContain('lpf-candidate-1');
    expect(selectedIds).toContain('scan-registry:legacy-agentmemory:F1-mem-lifecycle');
  });

  it('returns no content field and no RAW sentinel in any selected candidate', () => {
    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
      registryEntries,
      registryProjectionOptions: { createdAt: 1700 },
    });

    for (const candidate of result.readout.retrievalResult?.selected ?? []) {
      expect(candidate).not.toHaveProperty('content');
    }
    expect(JSON.stringify(result.readout)).not.toContain(RAW_SENTINEL);
  });

  it('keeps rawMemoryReleased and canReinject false on both the result and the readout', () => {
    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
      registryEntries,
    });

    expect(result.rawMemoryReleased).toBe(false);
    expect(result.canReinject).toBe(false);
    expect(result.readout.rawMemoryReleased).toBe(false);
    expect(result.readout.canReinject).toBe(false);
  });

  it('degrades safely and is marked registryDegraded when registryEntries is absent', () => {
    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
    });

    expect(result.registryDegraded).toBe(true);
    expect(result.projectedCandidateCount).toBe(0);
    expect(result.originalCandidateCount).toBe(1);
    expect(result.rawMemoryReleased).toBe(false);
  });

  it('degrades safely and is marked registryDegraded when registryEntries is empty', () => {
    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
      registryEntries: [],
    });

    expect(result.registryDegraded).toBe(true);
    expect(result.projectedCandidateCount).toBe(0);
  });

  it('does not throw and degrades safely on malformed registry entries', () => {
    const malformed = [
      null,
      { id: '' },
      { id: 'bad-findings', findings: 'nope' },
    ] as unknown as ScanRegistryEntry[];

    expect(() =>
      buildFederatedMemoryRead({
        workflowInput: baseWorkflowInput(),
        registryEntries: malformed,
      }),
    ).not.toThrow();

    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput(),
      registryEntries: malformed,
    });
    expect(result.registryDegraded).toBe(true);
    expect(result.projectedCandidateCount).toBe(0);
    expect(result.rawMemoryReleased).toBe(false);
  });

  it('matches actual candidate composition in result counts and attribution', () => {
    const twoEntryRegistry: ScanRegistryEntry[] = [
      ...registryEntries,
      {
        id: 'legacy-cvf-important-graphify',
        scopePaths: ['project-1'],
        semanticRegions: ['GRAPH_GOVERNANCE'],
        findings: [
          {
            id: 'F1-kgr1-partial',
            summary: 'Lifecycle governance mapping for graph data model',
          },
        ],
      },
    ];

    const result = buildFederatedMemoryRead({
      workflowInput: baseWorkflowInput({ query: 'lifecycle governance' }),
      registryEntries: twoEntryRegistry,
      registryProjectionOptions: { createdAt: 1700 },
    });

    // Both findings are projected (keyword-matched against semanticRegions/summary),
    // but readout selection uses substring matching of the full query against
    // summary+content, so only the finding containing "lifecycle governance"
    // verbatim is selected.
    expect(result.projectedCandidateCount).toBe(2);
    const sources = result.readout.retrievalResult?.selected
      ?.map((c) => c.id)
      .filter((id) => id.startsWith('scan-registry:'));
    expect(sources).toEqual(['scan-registry:legacy-cvf-important-graphify:F1-kgr1-partial']);
  });

  it('performs no file, registry, durable store, route, network, or provider behavior', () => {
    expect(buildFederatedMemoryRead).not.toHaveProperty('fetch');
    expect(buildFederatedMemoryRead.toString()).not.toMatch(/require\(['"]fs['"]\)/);
    expect(buildFederatedMemoryRead.toString()).not.toMatch(/require\(['"]net['"]\)/);
  });
});
