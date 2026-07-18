import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import { createDependencyGraph, type GraphEdge, type GraphNode } from "../schema/graph-schema";
import {
  buildSymbolIndexFromGraph,
  type SymbolIndex,
  type SymbolIndexPersistenceStore,
} from "../index/symbol-index";

interface StoredNodeMetadata {
  confidence?: GraphNode["confidence"];
  line?: number;
}

interface StoredEdgeMetadata {
  confidence?: GraphEdge["confidence"];
}

type DatabaseHandle = Database.Database;

function readMetadata<T>(value: unknown): T {
  if (typeof value !== "string" || value.trim().length === 0) {
    return {} as T;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

function openDatabase(dbPath: string): DatabaseHandle {
  return new Database(dbPath);
}

export class GraphSQLiteStore implements SymbolIndexPersistenceStore {
  save(index: SymbolIndex, dbPath: string): void {
    const db = openDatabase(dbPath);
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS symbol_nodes (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          name TEXT NOT NULL,
          filePath TEXT NOT NULL,
          startLine INTEGER,
          endLine INTEGER,
          metadata TEXT
        );
        CREATE TABLE IF NOT EXISTS symbol_edges (
          fromId TEXT NOT NULL,
          toId TEXT NOT NULL,
          edgeKind TEXT NOT NULL,
          metadata TEXT,
          PRIMARY KEY (fromId, toId, edgeKind)
        );
        CREATE TABLE IF NOT EXISTS index_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      const insert = db.transaction(() => {
        db.prepare("DELETE FROM symbol_edges").run();
        db.prepare("DELETE FROM symbol_nodes").run();
        db.prepare("DELETE FROM index_metadata").run();

        const insertNode = db.prepare(`
          INSERT INTO symbol_nodes (id, kind, name, filePath, startLine, endLine, metadata)
          VALUES (@id, @kind, @name, @filePath, @startLine, @endLine, @metadata)
        `);
        const insertEdge = db.prepare(`
          INSERT INTO symbol_edges (fromId, toId, edgeKind, metadata)
          VALUES (@fromId, @toId, @edgeKind, @metadata)
        `);
        const insertMetadata = db.prepare(`
          INSERT INTO index_metadata (key, value)
          VALUES (@key, @value)
        `);

        for (const node of index.graph.nodes) {
          insertNode.run({
            id: node.id,
            kind: node.kind,
            name: node.name,
            filePath: node.filePath,
            startLine: node.line ?? null,
            endLine: null,
            metadata: JSON.stringify({
              confidence: node.confidence,
              line: node.line,
            } satisfies StoredNodeMetadata),
          });
        }

        for (const edge of index.graph.edges) {
          insertEdge.run({
            fromId: edge.from,
            toId: edge.to,
            edgeKind: edge.kind,
            metadata: JSON.stringify({
              confidence: edge.confidence,
            } satisfies StoredEdgeMetadata),
          });
        }

        insertMetadata.run({ key: "builtAt", value: new Date().toISOString() });
        insertMetadata.run({ key: "fileCount", value: String(index.byFile.size) });
      });

      insert();
    } finally {
      db.close();
    }
  }

  load(dbPath: string): SymbolIndex | null {
    if (!existsSync(dbPath)) {
      return null;
    }

    let db: DatabaseHandle | null = null;
    try {
      db = openDatabase(dbPath);
      const nodeRows = db.prepare(`
        SELECT id, kind, name, filePath, startLine, metadata
        FROM symbol_nodes
        ORDER BY id
      `).all() as Array<{
        id: string;
        kind: GraphNode["kind"];
        name: string;
        filePath: string;
        startLine: number | null;
        metadata: string | null;
      }>;
      const edgeRows = db.prepare(`
        SELECT fromId, toId, edgeKind, metadata
        FROM symbol_edges
        ORDER BY fromId, toId, edgeKind
      `).all() as Array<{
        fromId: string;
        toId: string;
        edgeKind: GraphEdge["kind"];
        metadata: string | null;
      }>;

      if (nodeRows.length === 0) {
        return null;
      }

      const nodes: GraphNode[] = nodeRows.map((row) => {
        const metadata = readMetadata<StoredNodeMetadata>(row.metadata);
        return {
          id: row.id,
          kind: row.kind,
          name: row.name,
          filePath: row.filePath,
          line: metadata.line ?? row.startLine ?? undefined,
          confidence: metadata.confidence ?? "medium",
        };
      });
      const edges: GraphEdge[] = edgeRows.map((row) => {
        const metadata = readMetadata<StoredEdgeMetadata>(row.metadata);
        return {
          id: `${row.edgeKind}:${row.fromId}->${row.toId}`,
          kind: row.edgeKind,
          from: row.fromId,
          to: row.toId,
          confidence: metadata.confidence ?? "medium",
        };
      });

      return buildSymbolIndexFromGraph(createDependencyGraph(nodes, edges));
    } catch {
      return null;
    } finally {
      db?.close();
    }
  }
}
