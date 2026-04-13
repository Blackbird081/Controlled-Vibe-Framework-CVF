import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

/**
 * Directed relation types between knowledge entities.
 * Models structural relationships in the Knowledge Layer structural index.
 * W72-T1: Graphify structural-index enhancement — Knowledge Layer only.
 */
export type StructuralRelationType =
  | "depends_on"
  | "related_to"
  | "extends"
  | "supersedes";

export interface StructuralEntity {
  entityId: string; // maps to KnowledgeItem.itemId
  label: string;
}

export interface StructuralRelation {
  fromId: string;
  toId: string;
  relationType: StructuralRelationType;
}

export interface StructuralIndexRequest {
  contextId: string;
  entities: StructuralEntity[];
  relations: StructuralRelation[];
  queryEntityId: string; // entity to traverse from
  maxDepth?: number;     // BFS depth limit; default 1; 0 = query entity only
}

export interface StructuralNeighbor {
  entityId: string;
  label: string;
  relationType: StructuralRelationType;
  depth: number; // 1-based distance from queryEntityId
}

export interface StructuralIndexResult {
  resultId: string;
  indexedAt: string;
  contextId: string;
  queryEntityId: string;
  totalEntities: number;
  totalRelations: number;
  neighbors: StructuralNeighbor[];
  indexHash: string;
}

export interface StructuralIndexContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class StructuralIndexContract {
  private readonly now: () => string;

  constructor(dependencies: StructuralIndexContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  index(request: StructuralIndexRequest): StructuralIndexResult {
    const indexedAt = this.now();
    const maxDepth = request.maxDepth ?? 1;

    // Build adjacency map: entityId -> outgoing edges
    const adjacency = new Map<string, Array<{ toId: string; relationType: StructuralRelationType }>>();
    for (const entity of request.entities) {
      adjacency.set(entity.entityId, []);
    }
    for (const rel of request.relations) {
      const edges = adjacency.get(rel.fromId);
      if (edges !== undefined) {
        edges.push({ toId: rel.toId, relationType: rel.relationType });
      }
    }

    // Build entity label map
    const labelMap = new Map<string, string>();
    for (const entity of request.entities) {
      labelMap.set(entity.entityId, entity.label);
    }

    // BFS from queryEntityId up to maxDepth
    const neighbors: StructuralNeighbor[] = [];
    const visited = new Set<string>([request.queryEntityId]);
    const queue: Array<{ entityId: string; depth: number; relationType: StructuralRelationType }> = [];

    if (maxDepth > 0) {
      const startEdges = adjacency.get(request.queryEntityId) ?? [];
      for (const edge of startEdges) {
        if (!visited.has(edge.toId) && labelMap.has(edge.toId)) {
          visited.add(edge.toId);
          queue.push({ entityId: edge.toId, depth: 1, relationType: edge.relationType });
        }
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      neighbors.push({
        entityId: current.entityId,
        label: labelMap.get(current.entityId) ?? current.entityId,
        relationType: current.relationType,
        depth: current.depth,
      });

      if (current.depth < maxDepth) {
        const nextEdges = adjacency.get(current.entityId) ?? [];
        for (const edge of nextEdges) {
          if (!visited.has(edge.toId) && labelMap.has(edge.toId)) {
            visited.add(edge.toId);
            queue.push({ entityId: edge.toId, depth: current.depth + 1, relationType: edge.relationType });
          }
        }
      }
    }

    // Sort neighbors by depth asc, then entityId asc for determinism
    neighbors.sort((a, b) =>
      a.depth !== b.depth ? a.depth - b.depth : a.entityId.localeCompare(b.entityId),
    );

    const indexHash = computeDeterministicHash(
      "w72-t1-cp1-structural-index",
      `${indexedAt}:${request.contextId}`,
      `query:${request.queryEntityId}:depth:${maxDepth}`,
      `entities:${request.entities.length}:relations:${request.relations.length}`,
      `neighbors:${neighbors.length}`,
    );

    const resultId = computeDeterministicHash(
      "w72-t1-cp1-structural-index-result-id",
      indexHash,
      indexedAt,
    );

    return {
      resultId,
      indexedAt,
      contextId: request.contextId,
      queryEntityId: request.queryEntityId,
      totalEntities: request.entities.length,
      totalRelations: request.relations.length,
      neighbors,
      indexHash,
    };
  }
}

export function createStructuralIndexContract(
  dependencies?: StructuralIndexContractDependencies,
): StructuralIndexContract {
  return new StructuralIndexContract(dependencies);
}
