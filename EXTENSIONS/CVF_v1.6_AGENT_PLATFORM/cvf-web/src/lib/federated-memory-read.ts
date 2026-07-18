/**
 * MPI-T4 Federated Memory Read Helper
 *
 * Deterministic, read-only orchestration that federates caller-supplied
 * Learning Plane Foundation memory candidates with caller-supplied parsed
 * GC-051 scan-registry entries into one summary-only Memory readout.
 *
 * This helper performs no filesystem, network, registry, route, provider, or
 * durable-store I/O. It composes two existing source-verified functions:
 * `projectScanRegistryFindings` (MPI-T2 registry-derived view) and
 * `buildMemoryRuntimeReadout` (existing summary-only sanitizer). It is
 * advisory only and must never block closure when registry input is absent
 * or malformed.
 */

import {
  projectScanRegistryFindings,
  type ScanRegistryEntry,
  type ScanRegistryMemoryCandidate,
  type ScanRegistryProjectionOptions,
} from './scan-registry-memory-projection';
import {
  buildMemoryRuntimeReadout,
  type MemoryRuntimeProjection,
} from './memory-runtime-readout';
import type { MemoryRuntimeWorkflowInput } from 'cvf-learning-plane-foundation/memory-runtime';

export interface FederatedMemoryReadInput {
  /** Base runtime workflow input; `candidates` are the caller-supplied LPF candidates. */
  workflowInput: MemoryRuntimeWorkflowInput;
  /** Optional parsed GC-051 scan-registry entries to federate alongside workflowInput.candidates. */
  registryEntries?: readonly ScanRegistryEntry[];
  /** Optional deterministic projection options forwarded to `projectScanRegistryFindings`. */
  registryProjectionOptions?: ScanRegistryProjectionOptions;
}

export interface FederatedMemoryReadResult {
  /** Sanitized, summary-only readout (no raw `content`, false safety flags preserved). */
  readout: MemoryRuntimeProjection;
  /** Count of caller-supplied LPF candidates considered before readout selection. */
  originalCandidateCount: number;
  /** Count of registry-projected candidates considered before readout selection. */
  projectedCandidateCount: number;
  /** `true` when registry input was absent, empty, or malformed (advisory degradation). */
  registryDegraded: boolean;
  rawMemoryReleased: false;
  canReinject: false;
}

function isUsableRegistryInput(
  entries: readonly ScanRegistryEntry[] | undefined,
): entries is readonly ScanRegistryEntry[] {
  return Array.isArray(entries) && entries.length > 0;
}

function hasMalformedRegistryEntry(entries: readonly ScanRegistryEntry[] | undefined): boolean {
  if (!isUsableRegistryInput(entries)) return false;

  return entries.some((entry) => {
    if (!entry || typeof entry.id !== 'string' || entry.id.length === 0) return true;
    if (entry.scopePaths !== undefined && !Array.isArray(entry.scopePaths)) return true;
    if (entry.semanticRegions !== undefined && !Array.isArray(entry.semanticRegions)) return true;
    if (entry.findings !== undefined && !Array.isArray(entry.findings)) return true;
    return entry.findings?.some((finding) => {
      if (!finding || typeof finding.id !== 'string' || finding.id.length === 0) return true;
      return typeof finding.summary !== 'string' || finding.summary.length === 0;
    }) ?? false;
  });
}

function safeProjectScanRegistryFindings(
  entries: readonly ScanRegistryEntry[] | undefined,
  query: string,
  options: ScanRegistryProjectionOptions | undefined,
): { projectedCandidates: ScanRegistryMemoryCandidate[]; projectionFailed: boolean } {
  try {
    return {
      projectedCandidates: projectScanRegistryFindings(entries, query, options ?? {}),
      projectionFailed: false,
    };
  } catch {
    return { projectedCandidates: [], projectionFailed: true };
  }
}

/**
 * Build a federated advisory Memory readout that combines caller-supplied LPF
 * candidates with registry-projected candidates, without mutating either
 * input collection.
 */
export function buildFederatedMemoryRead(
  input: FederatedMemoryReadInput,
): FederatedMemoryReadResult {
  const { workflowInput, registryEntries, registryProjectionOptions } = input;
  const originalCandidates = Array.isArray(workflowInput.candidates)
    ? workflowInput.candidates
    : [];

  const inputAbsentOrEmpty = !isUsableRegistryInput(registryEntries);
  const malformedRegistryInput = hasMalformedRegistryEntry(registryEntries);
  const { projectedCandidates, projectionFailed } = safeProjectScanRegistryFindings(
    registryEntries,
    workflowInput.query,
    registryProjectionOptions,
  );
  const registryDegraded = inputAbsentOrEmpty || malformedRegistryInput || projectionFailed;

  const combinedCandidates = [...originalCandidates, ...projectedCandidates];

  const readout = buildMemoryRuntimeReadout(
    {
      ...workflowInput,
      candidates: combinedCandidates,
    },
  );

  return {
    readout,
    originalCandidateCount: originalCandidates.length,
    projectedCandidateCount: projectedCandidates.length,
    registryDegraded,
    rawMemoryReleased: false,
    canReinject: false,
  };
}
