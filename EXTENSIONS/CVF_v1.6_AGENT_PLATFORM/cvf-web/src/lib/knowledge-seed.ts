import { createHash } from 'node:crypto';
import type { KnowledgeChunk, KnowledgeCollectionDefinition, Sot3KnowledgeSourceMetadata } from './knowledge-store';

/**
 * System seed provenance. The built-in seed collections below are code-owned, reviewed repository content, so they carry a
 * declared SOT3 source (`POLICY`, owner `cvf-platform-seed`) instead of being exempted from provenance checks. The declared
 * content hash is computed over the exact record Refinery re-hashes ({ source_id, id, content }), so a stored chunk whose
 * content differs from the seed (a user or admin edit, or a lookalike id) FAILS integrity and is rejected like any other
 * unproven knowledge. User, project and admin-ingested knowledge never gets this provenance.
 */
const SYSTEM_SEED_OWNER = 'cvf-platform-seed';
const SYSTEM_SEED_CAPTURED_AT_UTC = '2026-01-01T00:00:00.000Z';

function seedContentHash(sourceId: string, id: string, content: string): string {
  const record: Record<string, unknown> = { source_id: sourceId, id, content };
  const sorted = [Object.keys(record).sort().map((key) => [key, record[key]])];
  return `sha256:${createHash('sha256').update(JSON.stringify(sorted)).digest('hex')}`;
}

function buildSystemSeedSource(id: string, content: string): Sot3KnowledgeSourceMetadata {
  const sourceId = `system-seed:${id}`;
  return {
    sourceId,
    sourceType: 'POLICY',
    owner: SYSTEM_SEED_OWNER,
    capturedAtUtc: SYSTEM_SEED_CAPTURED_AT_UTC,
    purpose: ['execute-route-context'],
    confidentiality: 'INTERNAL',
    expectedContentHash: seedContentHash(sourceId, id, content),
    rawReference: { type: 'object', location: `knowledge-seed://${id}` },
    captureStatus: 'CAPTURED',
    declaredVersion: null,
    validFromUtc: null,
    validUntilUtc: null,
  };
}

function seedChunk(chunk: Omit<KnowledgeChunk, 'sot3Source'>): KnowledgeChunk {
  return { ...chunk, sot3Source: buildSystemSeedSource(chunk.id, chunk.content) };
}

const SEED_DEFINITIONS: KnowledgeCollectionDefinition[] = [
  {
    id: 'cvf-global-governance',
    name: 'CVF Global Governance',
    description: 'Global governed guidance shared across the enterprise runtime.',
    orgId: null,
    teamId: null,
    chunks: [
      seedChunk({
        id: 'global-guardrails-001',
        keywords: ['governance', 'control-plane', 'enterprise', 'guardrails'],
        content:
          'CVF enterprise runtime prioritizes governed retrieval, append-only audit evidence, and explicit phase-based controls before execution.',
      }),
    ],
  },
  {
    id: 'cvf-exec-playbook',
    name: 'Executive Control Playbook',
    description: 'Executive control knowledge for the main admin operating team.',
    orgId: 'org_cvf',
    teamId: 'team_exec',
    chunks: [
      seedChunk({
        id: 'exec-playbook-001',
        keywords: ['finops', 'quota', 'executive', 'control'],
        content:
          'Executive Control uses codename ALPHA-ORBIT for the FinOps escalation lane and reviews hard-cap incidents before restoring quota overrides.',
      }),
    ],
  },
  {
    id: 'cvf-engineering-runbooks',
    name: 'Engineering Runbooks',
    description: 'Engineering-only guidance for implementation teams.',
    orgId: 'org_cvf',
    teamId: 'team_eng',
    chunks: [
      seedChunk({
        id: 'eng-runbook-001',
        keywords: ['engineering', 'deploy', 'runbook', 'incident'],
        content:
          'Engineering Runbooks use codename BRAVO-CIRCUIT for deployment remediation and patch verification during service incidents.',
      }),
    ],
  },
  {
    id: 'tenant-org-a-private',
    name: 'Tenant Org A Private',
    description: 'Cross-tenant leakage test fixture for org_a.',
    orgId: 'org_a',
    teamId: 'team_a',
    chunks: [
      seedChunk({
        id: 'org-a-private-001',
        keywords: ['tenant-a', 'partition', 'alpha-scope'],
        content:
          'Tenant org_a private codename is TENANT-A-SIGNAL. Only team_a is allowed to retrieve this chunk.',
      }),
    ],
  },
  {
    id: 'tenant-org-b-private',
    name: 'Tenant Org B Private',
    description: 'Cross-tenant leakage test fixture for org_b.',
    orgId: 'org_b',
    teamId: 'team_b',
    chunks: [
      seedChunk({
        id: 'org-b-private-001',
        keywords: ['tenant-b', 'partition', 'shadow-beta'],
        content:
          'Tenant org_b private codename is SHADOW-BETA. Only team_b is allowed to retrieve this chunk.',
      }),
    ],
  },
];

export const KNOWLEDGE_COLLECTIONS: KnowledgeCollectionDefinition[] = SEED_DEFINITIONS;

/**
 * Declared provenance for a code-owned seed chunk, resolved from the code (not the mutable store) so stores persisted before
 * provenance existed are covered too. Returns undefined for anything that is not a built-in seed chunk. The hash binds the
 * seed's own content, so this never vouches for edited or user-supplied content that reuses a seed id.
 */
export function resolveSystemSeedSot3Source(collectionId: string, chunkId: string): Sot3KnowledgeSourceMetadata | undefined {
  return SEED_DEFINITIONS.find((collection) => collection.id === collectionId)?.chunks.find((chunk) => chunk.id === chunkId)?.sot3Source;
}
