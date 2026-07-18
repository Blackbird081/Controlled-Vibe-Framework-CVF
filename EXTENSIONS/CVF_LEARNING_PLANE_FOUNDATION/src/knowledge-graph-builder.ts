import {
  buildKgrStore,
  createKgrEdge,
  createKgrNode,
  KGR_DETERMINISTIC_TIMESTAMP,
  type KgrEdge,
  type KgrNode,
  type KgrNodeKindAll,
  type KgrStore,
} from "./knowledge-graph-store";

export const KGR_BUILDER_CONTRACT_VERSION =
  "cvf.knowledgeGraphRetrieval.kgr1.t3.v1" as const;

export interface KgrSourceFile {
  readonly filePath: string;
  readonly content: string;
}

export interface KgrBuildResult {
  readonly contractVersion: typeof KGR_BUILDER_CONTRACT_VERSION;
  readonly store: KgrStore;
  readonly fileCount: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly warnings: readonly string[];
  readonly builtAt: string;
}

function classifyFileKind(filePath: string): KgrNodeKindAll {
  const lower = filePath.toLowerCase();
  if (
    lower.includes("guard") ||
    lower.includes("policy") ||
    lower.includes("governance") ||
    lower.endsWith("_policy.ts") ||
    lower.endsWith("_guard.md")
  ) {
    return "policy";
  }
  if (lower.includes("skill") || lower.includes("pack")) return "skill";
  if (lower.includes("workflow") || lower.includes("roadmap")) return "workflow";
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".drawio") ||
    lower.endsWith(".mermaid")
  ) {
    return "diagram";
  }
  if (lower.endsWith(".ts") || lower.endsWith(".js") || lower.endsWith(".py")) return "file";
  return "document";
}

function sourceName(filePath: string): string {
  return filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, "") ?? filePath;
}

function detectRelationshipKind(
  fromPath: string,
  fromContent: string,
  toPath: string,
): "relates_to" | "documented_by" | "governed_by" | null {
  const toBase = sourceName(toPath);
  if (!toBase) return null;

  const contentLower = fromContent.toLowerCase();
  if (!contentLower.includes(toBase.toLowerCase())) return null;

  const fromLower = fromPath.toLowerCase();
  if (fromLower.includes("guard") || fromLower.includes("policy")) return "governed_by";
  if (fromLower.endsWith(".md") && !toPath.toLowerCase().endsWith(".md")) return "documented_by";
  return "relates_to";
}

export function buildKnowledgeGraph(sources: readonly KgrSourceFile[]): KgrBuildResult {
  const warnings: string[] = [];
  const nodes: KgrNode[] = [];
  const edges: KgrEdge[] = [];

  if (sources.length === 0) {
    return {
      contractVersion: KGR_BUILDER_CONTRACT_VERSION,
      store: buildKgrStore([], []),
      fileCount: 0,
      nodeCount: 0,
      edgeCount: 0,
      warnings: ["no_source_files_provided"],
      builtAt: KGR_DETERMINISTIC_TIMESTAMP,
    };
  }

  for (const source of sources) {
    if (!source.filePath.trim()) {
      warnings.push("skipped_empty_path");
      continue;
    }
    const kind = classifyFileKind(source.filePath);
    const name = sourceName(source.filePath);
    nodes.push(
      createKgrNode({
        kind,
        name,
        sourcePath: source.filePath,
        description: `KGR node for ${name} (${kind})`,
        confidence: 0.8,
        governanceTag: "CVF_COMPLIANT",
      }),
    );
  }

  const nodeByPath = new Map(nodes.map((node) => [node.sourcePath, node]));
  for (const fromSource of sources) {
    const fromNode = nodeByPath.get(fromSource.filePath);
    if (!fromNode) continue;

    for (const toSource of sources) {
      if (toSource.filePath === fromSource.filePath) continue;
      const toNode = nodeByPath.get(toSource.filePath);
      if (!toNode) continue;

      const kind = detectRelationshipKind(fromSource.filePath, fromSource.content, toSource.filePath);
      if (!kind) continue;

      edges.push(
        createKgrEdge({
          kind,
          fromId: fromNode.id,
          toId: toNode.id,
          confidence: 0.7,
        }),
      );
    }
  }

  const store = buildKgrStore(nodes, edges);
  return {
    contractVersion: KGR_BUILDER_CONTRACT_VERSION,
    store,
    fileCount: sources.length,
    nodeCount: store.nodeCount,
    edgeCount: store.edgeCount,
    warnings,
    builtAt: KGR_DETERMINISTIC_TIMESTAMP,
  };
}

export function buildKnowledgeGraphFromPaths(filePaths: readonly string[]): KgrBuildResult {
  return buildKnowledgeGraph(filePaths.map((filePath) => ({ filePath, content: "" })));
}
