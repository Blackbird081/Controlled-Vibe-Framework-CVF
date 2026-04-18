import { getKnowledgeCollectionScopes } from '@/lib/policy-reader';

export interface KnowledgeChunk {
  id: string;
  content: string;
  keywords: string[];
}

export interface KnowledgeCollectionDefinition {
  id: string;
  name: string;
  description: string;
  orgId: string | null;
  teamId: string | null;
  chunks: KnowledgeChunk[];
}

export interface EffectiveKnowledgeCollection extends KnowledgeCollectionDefinition {
  chunkCount: number;
}

export interface KnowledgeQueryResult {
  chunks: Array<KnowledgeChunk & { collectionId: string; collectionName: string; score: number }>;
  matchedChunkCount: number;
  allowedChunkCount: number;
  droppedChunkCount: number;
  allowedCollectionIds: string[];
  droppedCollectionIds: string[];
}

const KNOWLEDGE_COLLECTIONS: KnowledgeCollectionDefinition[] = [
  {
    id: 'cvf-global-governance',
    name: 'CVF Global Governance',
    description: 'Global governed guidance shared across the enterprise runtime.',
    orgId: null,
    teamId: null,
    chunks: [
      {
        id: 'global-guardrails-001',
        keywords: ['governance', 'control-plane', 'enterprise', 'guardrails'],
        content:
          'CVF enterprise runtime prioritizes governed retrieval, append-only audit evidence, and explicit phase-based controls before execution.',
      },
    ],
  },
  {
    id: 'cvf-exec-playbook',
    name: 'Executive Control Playbook',
    description: 'Executive control knowledge for the main admin operating team.',
    orgId: 'org_cvf',
    teamId: 'team_exec',
    chunks: [
      {
        id: 'exec-playbook-001',
        keywords: ['finops', 'quota', 'executive', 'control'],
        content:
          'Executive Control uses codename ALPHA-ORBIT for the FinOps escalation lane and reviews hard-cap incidents before restoring quota overrides.',
      },
    ],
  },
  {
    id: 'cvf-engineering-runbooks',
    name: 'Engineering Runbooks',
    description: 'Engineering-only guidance for implementation teams.',
    orgId: 'org_cvf',
    teamId: 'team_eng',
    chunks: [
      {
        id: 'eng-runbook-001',
        keywords: ['engineering', 'deploy', 'runbook', 'incident'],
        content:
          'Engineering Runbooks use codename BRAVO-CIRCUIT for deployment remediation and patch verification during service incidents.',
      },
    ],
  },
  {
    id: 'tenant-org-a-private',
    name: 'Tenant Org A Private',
    description: 'Cross-tenant leakage test fixture for org_a.',
    orgId: 'org_a',
    teamId: 'team_a',
    chunks: [
      {
        id: 'org-a-private-001',
        keywords: ['tenant-a', 'partition', 'alpha-scope'],
        content:
          'Tenant org_a private codename is TENANT-A-SIGNAL. Only team_a is allowed to retrieve this chunk.',
      },
    ],
  },
  {
    id: 'tenant-org-b-private',
    name: 'Tenant Org B Private',
    description: 'Cross-tenant leakage test fixture for org_b.',
    orgId: 'org_b',
    teamId: 'team_b',
    chunks: [
      {
        id: 'org-b-private-001',
        keywords: ['tenant-b', 'partition', 'shadow-beta'],
        content:
          'Tenant org_b private codename is SHADOW-BETA. Only team_b is allowed to retrieve this chunk.',
      },
    ],
  },
];

function tokenize(input: string): string[] {
  return [...new Set(
    input
      .toLowerCase()
      .match(/[a-z0-9_-]{3,}/g)
      ?.filter(token => token.length >= 3) ?? [],
  )];
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk, collection: KnowledgeCollectionDefinition): number {
  const haystack = [
    collection.name,
    collection.description,
    chunk.content,
    chunk.keywords.join(' '),
  ].join(' ').toLowerCase();

  return queryTokens.reduce((score, token) => (
    haystack.includes(token) ? score + 1 : score
  ), 0);
}

function scopeAllowsCollection(
  collection: KnowledgeCollectionDefinition,
  scope?: { orgId?: string; teamId?: string },
): boolean {
  const orgAllowed = collection.orgId === null || collection.orgId === scope?.orgId;
  const teamAllowed = collection.teamId === null || collection.teamId === scope?.teamId;
  return orgAllowed && teamAllowed;
}

async function getEffectiveCollections(): Promise<KnowledgeCollectionDefinition[]> {
  const scopeOverrides = await getKnowledgeCollectionScopes();

  return KNOWLEDGE_COLLECTIONS.map(collection => {
    const override = scopeOverrides.get(collection.id);
    if (!override) return collection;

    return {
      ...collection,
      orgId: override.orgId,
      teamId: override.teamId,
    };
  });
}

export async function listKnowledgeCollections(): Promise<EffectiveKnowledgeCollection[]> {
  const collections = await getEffectiveCollections();

  return collections.map(collection => ({
    ...collection,
    chunkCount: collection.chunks.length,
  }));
}

export async function queryKnowledgeChunks(input: {
  intent: string;
  orgId?: string;
  teamId?: string;
  limit?: number;
}): Promise<KnowledgeQueryResult> {
  const queryTokens = tokenize(input.intent);
  if (queryTokens.length === 0) {
    return {
      chunks: [],
      matchedChunkCount: 0,
      allowedChunkCount: 0,
      droppedChunkCount: 0,
      allowedCollectionIds: [],
      droppedCollectionIds: [],
    };
  }

  const collections = await getEffectiveCollections();
  const scored = collections.flatMap(collection => (
    collection.chunks
      .map(chunk => ({
        ...chunk,
        collectionId: collection.id,
        collectionName: collection.name,
        orgId: collection.orgId,
        teamId: collection.teamId,
        score: scoreChunk(queryTokens, chunk, collection),
      }))
      .filter(chunk => chunk.score >= 2)
  ));

  const allowed = scored
    .filter(chunk => scopeAllowsCollection({
      id: chunk.collectionId,
      name: chunk.collectionName,
      description: '',
      orgId: chunk.orgId,
      teamId: chunk.teamId,
      chunks: [],
    }, input))
    .sort((left, right) => right.score - left.score)
    .slice(0, input.limit ?? 4)
    .map(({ id, content, keywords, collectionId, collectionName, score }) => ({ id, content, keywords, collectionId, collectionName, score }));

  const dropped = scored.filter(chunk => !scopeAllowsCollection({
    id: chunk.collectionId,
    name: chunk.collectionName,
    description: '',
    orgId: chunk.orgId,
    teamId: chunk.teamId,
    chunks: [],
  }, input));

  return {
    chunks: allowed,
    matchedChunkCount: scored.length,
    allowedChunkCount: allowed.length,
    droppedChunkCount: dropped.length,
    allowedCollectionIds: [...new Set(allowed.map(chunk => chunk.collectionId))],
    droppedCollectionIds: [...new Set(dropped.map(chunk => chunk.collectionId))],
  };
}

export function formatKnowledgeChunks(
  chunks: Array<KnowledgeChunk & { collectionId: string; collectionName: string; score?: number }>,
): string | null {
  if (chunks.length === 0) return null;

  return chunks.map(chunk => (
    `### ${chunk.collectionName}\n- Collection: ${chunk.collectionId}\n- Evidence: ${chunk.content}`
  )).join('\n\n');
}
