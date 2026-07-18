/**
 * CVF Phase 2.B — Runtime Coherence Graph
 * =======================================
 * Validates that migrated Phase 2.B adapter snapshots can be joined into one
 * internal evidence graph. This is an internal deterministic validator only:
 * no provider call, web route, persistent memory store, or kernel owner change
 * is introduced here.
 *
 * Authorized by:
 * docs/roadmaps/CVF_PHASE_2B_RUNTIME_COHERENCE_ROADMAP_2026-05-21.md
 */

export const PHASE_2B_RUNTIME_COHERENCE_SCHEMA_VERSION =
  'phase2b-runtime-coherence-graph-1' as const;

export const PHASE_2B_PRIMARY_ROW_IDS = [
  'P-01',
  'P-02',
  'P-03',
  'P-04',
  'P-05',
  'P-06',
  'P-07',
  'P-08',
  'R-01',
  'R-02',
  'R-03',
  'R-04',
  'R-05',
  'R-06',
  'R-07',
  'R-08',
  'R-09',
  'R-10',
  'R-11',
  'R-12',
  'R-13',
  'R-14',
  'R-15',
  'R-16',
  'I-01',
  'I-02',
  'I-03',
  'I-04',
  'I-05',
  'I-06',
  'I-07',
  'E-01',
  'E-02',
  'E-03',
  'E-04',
  'E-05',
  'E-06',
  'E-07',
  'M-01',
  'M-02',
  'M-03',
  'M-04',
  'M-05',
  'M-06',
  'M-07',
  'M-08',
] as const;

export type Phase2BPrimaryRowId = typeof PHASE_2B_PRIMARY_ROW_IDS[number];

export type Phase2BAdapterFamily =
  | 'policy'
  | 'risk'
  | 'identity'
  | 'receipt'
  | 'memory';

export type Phase2BRuntimeEvidenceMode =
  | 'internal_fixture'
  | 'live_provider';

export interface Phase2BAdapterNode {
  readonly rowId: Phase2BPrimaryRowId;
  readonly family: Phase2BAdapterFamily;
  readonly version: string;
  readonly source: string;
  readonly keys: Readonly<Record<string, string>>;
}

export interface Phase2BAdapterEdge {
  readonly from: Phase2BPrimaryRowId;
  readonly to: Phase2BPrimaryRowId;
  readonly key: string;
  readonly reason: string;
}

export interface Phase2BRuntimeCoherenceGraphInput {
  readonly evidenceMode: Phase2BRuntimeEvidenceMode;
  readonly nodes: ReadonlyArray<Phase2BAdapterNode>;
  readonly edges: ReadonlyArray<Phase2BAdapterEdge>;
  readonly forbiddenClaims?: ReadonlyArray<string>;
}

export interface Phase2BRuntimeCoherenceGraph {
  readonly schemaVersion: typeof PHASE_2B_RUNTIME_COHERENCE_SCHEMA_VERSION;
  readonly evidenceMode: Phase2BRuntimeEvidenceMode;
  readonly nodes: ReadonlyArray<Phase2BAdapterNode>;
  readonly edges: ReadonlyArray<Phase2BAdapterEdge>;
  readonly forbiddenClaims: ReadonlyArray<string>;
  readonly adapterInventoryChecksum: string;
}

export interface Phase2BRuntimeCoherenceValidation {
  readonly status: 'passed' | 'failed';
  readonly schemaVersion: typeof PHASE_2B_RUNTIME_COHERENCE_SCHEMA_VERSION;
  readonly adapterInventoryChecksum: string;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly evidenceMode: Phase2BRuntimeEvidenceMode;
  readonly runtimeCoherenceProven: boolean;
  readonly liveProofProven: false;
  readonly violations: ReadonlyArray<string>;
}

const LIVE_PROOF_FORBIDDEN_CLAIMS = new Set([
  'live_governance_proof',
  'provider_proof',
  'maika_proof',
  'public_capability_claim',
  'global_freeze_lift',
]);

export function buildPhase2BRuntimeCoherenceGraph(
  input: Phase2BRuntimeCoherenceGraphInput,
): Phase2BRuntimeCoherenceGraph {
  return {
    schemaVersion: PHASE_2B_RUNTIME_COHERENCE_SCHEMA_VERSION,
    evidenceMode: input.evidenceMode,
    nodes: [...input.nodes],
    edges: [...input.edges],
    forbiddenClaims: input.forbiddenClaims ?? [],
    adapterInventoryChecksum: buildPhase2BAdapterInventoryChecksum(input.nodes),
  };
}

export function validatePhase2BRuntimeCoherenceGraph(
  graph: Phase2BRuntimeCoherenceGraph,
): Phase2BRuntimeCoherenceValidation {
  const violations: string[] = [];
  const nodesByRow = new Map<Phase2BPrimaryRowId, Phase2BAdapterNode>();

  if (graph.schemaVersion !== PHASE_2B_RUNTIME_COHERENCE_SCHEMA_VERSION) {
    violations.push('unsupported_schema_version');
  }

  if (graph.evidenceMode !== 'internal_fixture') {
    violations.push('runtime_coherence_must_not_claim_live_provider_evidence');
  }

  for (const node of graph.nodes) {
    if (nodesByRow.has(node.rowId)) {
      violations.push(`duplicate_node:${node.rowId}`);
      continue;
    }
    nodesByRow.set(node.rowId, node);
    if (!node.version.trim()) {
      violations.push(`missing_adapter_version:${node.rowId}`);
    }
    if (!node.source.trim()) {
      violations.push(`missing_adapter_source:${node.rowId}`);
    }
  }

  for (const rowId of PHASE_2B_PRIMARY_ROW_IDS) {
    if (!nodesByRow.has(rowId)) {
      violations.push(`missing_primary_row:${rowId}`);
    }
  }

  for (const node of graph.nodes) {
    if (!PHASE_2B_PRIMARY_ROW_IDS.includes(node.rowId)) {
      violations.push(`unknown_primary_row:${node.rowId}`);
    }
  }

  for (const edge of graph.edges) {
    const from = nodesByRow.get(edge.from);
    const to = nodesByRow.get(edge.to);
    if (!from) {
      violations.push(`edge_missing_from:${edge.from}->${edge.to}`);
      continue;
    }
    if (!to) {
      violations.push(`edge_missing_to:${edge.from}->${edge.to}`);
      continue;
    }
    const fromValue = from.keys[edge.key];
    const toValue = to.keys[edge.key];
    if (!fromValue || !toValue) {
      violations.push(`edge_missing_key:${edge.from}->${edge.to}:${edge.key}`);
      continue;
    }
    if (fromValue !== toValue) {
      violations.push(`edge_key_mismatch:${edge.from}->${edge.to}:${edge.key}`);
    }
  }

  for (const claim of graph.forbiddenClaims) {
    if (LIVE_PROOF_FORBIDDEN_CLAIMS.has(claim)) {
      violations.push(`forbidden_claim:${claim}`);
    }
  }

  return {
    status: violations.length === 0 ? 'passed' : 'failed',
    schemaVersion: graph.schemaVersion,
    adapterInventoryChecksum: graph.adapterInventoryChecksum,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    evidenceMode: graph.evidenceMode,
    runtimeCoherenceProven: violations.length === 0,
    liveProofProven: false,
    violations,
  };
}

export function buildPhase2BAdapterInventoryChecksum(
  nodes: ReadonlyArray<Phase2BAdapterNode>,
): string {
  const payload = [...nodes]
    .sort((a, b) => a.rowId.localeCompare(b.rowId))
    .map((node) => `${node.rowId}|${node.family}|${node.version}|${node.source}`)
    .join('\n');

  return `fnv1a32:${fnv1a32(payload)}`;
}

function fnv1a32(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
