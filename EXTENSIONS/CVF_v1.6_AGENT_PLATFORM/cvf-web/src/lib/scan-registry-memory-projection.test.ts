import { describe, expect, it } from 'vitest';
import {
  extractQueryKeywords,
  projectScanRegistryFindings,
  type ScanRegistryEntry,
} from './scan-registry-memory-projection';
import { buildMemoryRuntimeReadout } from './memory-runtime-readout';

const RAW_SENTINEL = 'RAW_MEMORY_CONTENT_MUST_NOT_LEAK';

const graphifyEntry: ScanRegistryEntry = {
  id: 'legacy-cvf-important-graphify',
  scopePaths: ['.private_reference/legacy/CVF_Important/Knowledge Base_Graphify/'],
  semanticRegions: ['GRAPH_CLI_INTERFACE', 'GRAPH_DATA_MODEL', 'GRAPH_GOVERNANCE'],
  findings: [
    {
      id: 'F1-kgr1-partial',
      summary: 'KGR1 partial absorption confirmed for graph data model and builder patterns',
      disposition: 'ACCEPT_NO_ACTION',
      nextAction: 'None',
      defectClass: 'N/A',
      learningLane: 'N/A',
    },
    {
      id: 'F2-cli-absent',
      summary: 'cvf graph CLI command is not implemented in current source',
      disposition: 'DEFER_WITH_ROADMAP',
      nextAction: 'Track in roadmap',
    },
  ],
};

const memoryEntry: ScanRegistryEntry = {
  id: 'legacy-agentmemory',
  scopePaths: ['.private_reference/legacy/CVF 16.5/agentmemory/'],
  semanticRegions: ['MEMORY_LIFECYCLE', 'MEMORY_RETRIEVAL'],
  findings: [
    {
      id: 'F1-mem-lifecycle',
      summary: 'Memory lifecycle policy concepts map to existing LPF tier model',
      disposition: 'ACCEPT_WITH_BOUNDARY',
      nextAction: 'None',
    },
  ],
};

const entries: ScanRegistryEntry[] = [graphifyEntry, memoryEntry];

describe('extractQueryKeywords', () => {
  it('lowercases, de-duplicates, and drops short tokens', () => {
    expect(extractQueryKeywords('Graph graph CLI a of GOVERNANCE')).toEqual([
      'graph',
      'cli',
      'governance',
    ]);
  });

  it('returns empty list for empty or whitespace-only query', () => {
    expect(extractQueryKeywords('')).toEqual([]);
    expect(extractQueryKeywords('  -- !! ')).toEqual([]);
  });
});

describe('projectScanRegistryFindings', () => {
  it('matches keywords against findings[].summary', () => {
    const result = projectScanRegistryFindings(entries, 'lifecycle');
    expect(result).toHaveLength(1);
    expect(result[0].source.entryId).toBe('legacy-agentmemory');
    expect(result[0].source.findingId).toBe('F1-mem-lifecycle');
    expect(result[0].source.matchedOn).toBe('findingSummary');
  });

  it('matches keywords against semanticRegions (projects all findings of the entry)', () => {
    const result = projectScanRegistryFindings(entries, 'governance');
    // GRAPH_GOVERNANCE region matches -> both graphify findings projected.
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.source.entryId === 'legacy-cvf-important-graphify')).toBe(true);
    expect(result.some((c) => c.source.matchedOn === 'semanticRegion')).toBe(true);
  });

  it('returns an empty list when there is no match', () => {
    expect(projectScanRegistryFindings(entries, 'nonexistentdomain')).toEqual([]);
  });

  it('returns an empty list for empty query, empty entries, or undefined entries', () => {
    expect(projectScanRegistryFindings(entries, '')).toEqual([]);
    expect(projectScanRegistryFindings([], 'graph')).toEqual([]);
    expect(projectScanRegistryFindings(undefined, 'graph')).toEqual([]);
  });

  it('projects candidates with source attribution to entry id and finding id', () => {
    // 'implemented' only appears in F2's summary, not in any semanticRegion,
    // so exactly the summary-matched finding is projected.
    const result = projectScanRegistryFindings(entries, 'implemented');
    expect(result).toHaveLength(1);
    const [candidate] = result;
    expect(candidate.id).toBe('scan-registry:legacy-cvf-important-graphify:F2-cli-absent');
    expect(candidate.source).toEqual({
      kind: 'scan-registry-finding',
      entryId: 'legacy-cvf-important-graphify',
      findingId: 'F2-cli-absent',
      matchedOn: 'findingSummary',
    });
  });

  it('projects candidates without any raw content field', () => {
    const result = projectScanRegistryFindings(entries, 'graph');
    for (const candidate of result) {
      expect(candidate).not.toHaveProperty('content');
    }
  });

  it('does not mutate the input registry entries', () => {
    const snapshot = JSON.parse(JSON.stringify(entries));
    projectScanRegistryFindings(entries, 'graph governance lifecycle');
    expect(entries).toEqual(snapshot);
  });

  it('does not create unstable duplicate candidates for repeated keyword matches', () => {
    // 'graph' appears in both a semanticRegion and finding summaries; each
    // finding must still produce exactly one candidate.
    const result = projectScanRegistryFindings([graphifyEntry], 'graph graph data');
    const keys = result.map((c) => `${c.source.entryId}:${c.source.findingId}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual([
      'legacy-cvf-important-graphify:F1-kgr1-partial',
      'legacy-cvf-important-graphify:F2-cli-absent',
    ]);
  });

  it('is deterministic across repeated calls', () => {
    const a = projectScanRegistryFindings(entries, 'graph lifecycle', { createdAt: 1700, auditTrust: 0.42 });
    const b = projectScanRegistryFindings(entries, 'graph lifecycle', { createdAt: 1700, auditTrust: 0.42 });
    expect(a).toEqual(b);
    expect(a[0].createdAt).toBe(1700);
    expect(a[0].auditTrust).toBe(0.42);
  });

  it('honors maxResults', () => {
    const result = projectScanRegistryFindings(entries, 'graph governance lifecycle', { maxResults: 1 });
    expect(result).toHaveLength(1);
  });

  it('degrades safely on invalid or incomplete registry entries', () => {
    const malformed = [
      null,
      { id: '' },
      { id: 'no-findings' },
      { id: 'bad-findings', findings: 'nope' },
      { id: 'partial', findings: [null, { id: '' }, { id: 'ok-id' }, { id: 'x', summary: '' }] },
    ] as unknown as ScanRegistryEntry[];
    expect(() => projectScanRegistryFindings(malformed, 'graph')).not.toThrow();
    expect(projectScanRegistryFindings(malformed, 'graph')).toEqual([]);
  });
});

describe('projection through buildMemoryRuntimeReadout', () => {
  it('passes projected candidates through readout preserving false flags and no sentinel leak', () => {
    const projected = projectScanRegistryFindings(entries, 'graph governance lifecycle', {
      createdAt: Date.now(),
    });
    expect(projected.length).toBeGreaterThan(0);

    const readout = buildMemoryRuntimeReadout({
      operationId: 'mpi-t2-op-1',
      sessionId: 'session-1',
      projectId: 'project-1',
      actorId: 'actor-1',
      actorRole: 'AI_AGENT',
      scope: 'project-1',
      riskLevel: 'R1',
      query: 'graph governance lifecycle',
      tokenBudget: 500,
      candidates: projected.map((c) => ({
        id: c.id,
        scope: c.scope,
        summary: c.summary,
        createdAt: c.createdAt,
        auditTrust: c.auditTrust,
        lifecycleState: c.lifecycleState,
      })),
      policyDecision: 'allow',
      containsSensitiveData: false,
    });

    expect(readout.rawMemoryReleased).toBe(false);
    expect(readout.canReinject).toBe(false);
    expect(readout.retrievalResult?.selected?.[0]?.content).toBeUndefined();

    const serialized = JSON.stringify(readout);
    expect(serialized).not.toContain(RAW_SENTINEL);
  });
});
