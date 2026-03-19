/**
 * Guard Gateway — Track IV Phase B.2
 *
 * Unified entry point that routes CLI, MCP, and API requests
 * through the GuardRuntimeEngine via the appropriate adapter.
 *
 * Usage:
 *   const gateway = new GuardGateway(engine);
 *   const response = gateway.process('CLI', rawInput);
 */

import { GuardRuntimeEngine } from '../guard.runtime.engine.js';
import type { EntryAdapter, EntryResponse, EntryPointType } from './entry.types.js';
import { CliAdapter } from './cli.adapter.js';
import { McpAdapter } from './mcp.adapter.js';
import { ApiAdapter } from './api.adapter.js';

export class GuardGateway {
  private engine: GuardRuntimeEngine;
  private adapters: Map<EntryPointType, EntryAdapter> = new Map();
  private requestLog: EntryResponse[] = [];

  constructor(engine: GuardRuntimeEngine) {
    this.engine = engine;
    this.adapters.set('CLI', new CliAdapter());
    this.adapters.set('MCP', new McpAdapter());
    this.adapters.set('API', new ApiAdapter());
  }

  process(entryPoint: EntryPointType, rawInput: Record<string, unknown>): EntryResponse {
    const adapter = this.adapters.get(entryPoint);
    if (!adapter) {
      throw new Error(`Unknown entry point: "${entryPoint}". Supported: CLI, MCP, API.`);
    }

    const normalized = adapter.normalize(rawInput);

    const guardResult = this.engine.evaluate({
      requestId: normalized.requestId,
      phase: normalized.phase,
      riskLevel: normalized.riskLevel,
      role: normalized.role,
      agentId: normalized.agentId,
      action: normalized.action,
      targetFiles: normalized.targetFiles,
      fileScope: normalized.fileScope,
      mutationCount: normalized.mutationCount,
      mutationBudget: normalized.mutationBudget,
      traceHash: normalized.traceHash,
      scope: normalized.scope,
      metadata: normalized.metadata,
    });

    const response = adapter.formatResponse(guardResult, normalized.requestId);
    this.requestLog.push(response);
    return response;
  }

  getAdapter(entryPoint: EntryPointType): EntryAdapter | undefined {
    return this.adapters.get(entryPoint);
  }

  registerAdapter(adapter: EntryAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  getRequestLog(): readonly EntryResponse[] {
    return this.requestLog;
  }

  clearRequestLog(): void {
    this.requestLog = [];
  }

  getSupportedEntryPoints(): EntryPointType[] {
    return Array.from(this.adapters.keys());
  }
}
