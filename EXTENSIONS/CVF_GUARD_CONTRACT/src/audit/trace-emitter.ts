/**
 * CVF Evidence Trace Emitter
 * ==========================
 * Generates traceHash values and persists audit entries to local JSON files.
 * Sprint 1 — file-based persistence (will migrate to DB in Sprint 4).
 *
 * @module cvf-guard-contract/audit/trace-emitter
 */

import { createHash, randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { GuardPipelineResult, GuardRequestContext } from '../types';

export interface TraceEntry {
  traceId: string;
  traceHash: string;
  requestId: string;
  channel: string;
  timestamp: string;
  context: GuardRequestContext;
  pipelineResult: GuardPipelineResult;
}

/**
 * Generates a deterministic trace hash from a pipeline result.
 */
export function generateTraceHash(
  requestId: string,
  decision: string,
  timestamp: string,
): string {
  const input = `${requestId}:${decision}:${timestamp}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

/**
 * Creates a TraceEntry from a guard pipeline evaluation.
 */
export function createTraceEntry(
  context: GuardRequestContext,
  result: GuardPipelineResult,
): TraceEntry {
  const traceId = randomUUID();
  const traceHash = generateTraceHash(
    result.requestId,
    result.finalDecision,
    result.executedAt,
  );

  return {
    traceId,
    traceHash,
    requestId: result.requestId,
    channel: context.channel ?? 'unknown',
    timestamp: result.executedAt,
    context,
    pipelineResult: result,
  };
}

/**
 * Persists a trace entry to a local JSON file.
 * Files are stored in `logs/audit/YYYY-MM-DD/` directory.
 */
export async function persistTraceEntry(
  entry: TraceEntry,
  baseDir: string = 'logs/audit',
): Promise<string> {
  const date = entry.timestamp.split('T')[0]; // YYYY-MM-DD
  const dir = join(baseDir, date);
  await mkdir(dir, { recursive: true });

  const filename = `${entry.traceId}.json`;
  const filepath = join(dir, filename);
  await writeFile(filepath, JSON.stringify(entry, null, 2), 'utf-8');

  return filepath;
}
