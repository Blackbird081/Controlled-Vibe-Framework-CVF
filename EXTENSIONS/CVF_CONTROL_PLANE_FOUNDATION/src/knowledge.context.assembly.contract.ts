import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { RankedKnowledgeItem } from "./knowledge.ranking.contract";
import type { StructuralNeighbor } from "./knowledge.structural.index.contract";

// --- Types ---

/**
 * W75-T1 — KnowledgeContextAssemblyContract
 * Consumer-facing output surface of the CPF Knowledge Layer.
 * Assembles RankedKnowledgeItems with optional StructuralNeighbor enrichment
 * into a KnowledgeContextPacket ready for LLM consumption.
 * Authorization: CVF_GC018_W75_T1_KNOWLEDGE_CONTEXT_ASSEMBLY_CONTRACT_AUTHORIZATION_2026-04-14.md
 */
export interface KnowledgeContextEntry {
  entryId: string;           // time-variant: hash(entryHash + assembledAt)
  entryHash: string;         // content-bound: hash(itemId + rank + content)
  rank: number;
  itemId: string;
  title: string;
  content: string;
  compositeScore: number;
  structuralNeighbors: StructuralNeighbor[];  // [] when no enrichment present
}

export interface KnowledgeContextPacket {
  packetId: string;              // time-variant: hash(packetHash + assembledAt)
  packetHash: string;            // content-bound: hash(entry hashes)
  assembledAt: string;
  totalEntries: number;
  entries: KnowledgeContextEntry[];
  contextWindowEstimate: number; // sum of entry.content.length (character approximation)
}

export interface KnowledgeContextAssemblyRequest {
  rankedItems: RankedKnowledgeItem[];
  // optional: itemId → structural neighbors for that item
  structuralEnrichment?: Record<string, StructuralNeighbor[]>;
}

export interface KnowledgeContextAssemblyContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class KnowledgeContextAssemblyContract {
  private readonly now: () => string;

  constructor(dependencies: KnowledgeContextAssemblyContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  assemble(request: KnowledgeContextAssemblyRequest): KnowledgeContextPacket {
    const assembledAt = this.now();
    const enrichment = request.structuralEnrichment ?? {};

    const entries: KnowledgeContextEntry[] = request.rankedItems.map((item) => {
      const entryHash = computeDeterministicHash(
        "w75-t1-context-entry",
        `itemId:${item.itemId}`,
        `rank:${item.rank}`,
        `content:${item.content}`,
      );
      const entryId = computeDeterministicHash(
        "w75-t1-context-entry-id",
        entryHash,
        assembledAt,
      );
      return {
        entryId,
        entryHash,
        rank: item.rank,
        itemId: item.itemId,
        title: item.title,
        content: item.content,
        compositeScore: item.compositeScore,
        structuralNeighbors: enrichment[item.itemId] ?? [],
      };
    });

    const entryHashesSig = entries.map((e) => e.entryHash).join(",");
    const contextWindowEstimate = entries.reduce((sum, e) => sum + e.content.length, 0);

    const packetHash = computeDeterministicHash(
      "w75-t1-context-packet",
      `entries:[${entryHashesSig}]`,
      `total:${entries.length}`,
    );

    const packetId = computeDeterministicHash(
      "w75-t1-context-packet-id",
      packetHash,
      assembledAt,
    );

    return {
      packetId,
      packetHash,
      assembledAt,
      totalEntries: entries.length,
      entries,
      contextWindowEstimate,
    };
  }
}

export function createKnowledgeContextAssemblyContract(
  dependencies?: KnowledgeContextAssemblyContractDependencies,
): KnowledgeContextAssemblyContract {
  return new KnowledgeContextAssemblyContract(dependencies);
}
