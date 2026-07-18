import { buildMemoryRuntimeReadout, type MemoryRuntimeProjection } from '@/lib/memory-runtime-readout';
import type { ExecutionRequest } from '@/lib/ai';
import { evaluateReadoutEligibility, type MemoryReadoutEligibilityResult } from 'cvf-learning-plane-foundation/memory-runtime';
import type {
  MemoryGatewayRiskLevel,
  MemoryRetrievalCandidate,
  MemoryRuntimeWorkflowInput,
  RuntimeMemoryActorRole,
} from 'cvf-learning-plane-foundation/memory-runtime';

export const MEMORY_EXECUTION_ADVISORY_VERSION = 'cvf.memoryExecutionAdvisory.mkg7.t3.v1';

export interface MemoryExecutionAdvisoryReadout {
  contractVersion: typeof MEMORY_EXECUTION_ADVISORY_VERSION;
  rawMemoryReleased: false;
  canReinject: false;
  eligibility: MemoryReadoutEligibilityResult;
  runtimeProjection: MemoryRuntimeProjection;
}

export interface BuildMemoryAdvisoryParams {
  request: ExecutionRequest;
  actorRole: RuntimeMemoryActorRole | string | null | undefined;
  actorId?: string | null;
  sessionId?: string | null;
}

const RUNTIME_ACTOR_ROLES: ReadonlySet<RuntimeMemoryActorRole> = new Set([
  'OPERATOR',
  'GOVERNOR',
  'HUMAN',
  'BUILDER',
  'AI_AGENT',
  'REVIEWER',
  'SERVICE_AGENT',
  'OBSERVER',
  'ANALYST',
  'unknown',
]);

function normalizeScope(scope?: string | null): 'session' | 'project' | 'organization' {
  const trimmed = scope?.trim();
  if (!trimmed) return 'project';
  if (trimmed === 'session' || trimmed === 'organization') return trimmed;
  return 'project';
}

function normalizeRiskLevel(risk?: string | null): MemoryGatewayRiskLevel {
  if (risk === 'R0' || risk === 'R1' || risk === 'R2' || risk === 'R3') return risk;
  return 'R1';
}

function normalizeActorRole(role?: RuntimeMemoryActorRole | string | null): RuntimeMemoryActorRole {
  if (!role) return 'unknown';
  const normalized = typeof role === 'string' ? role.trim().toUpperCase() : role;
  if (RUNTIME_ACTOR_ROLES.has(normalized as RuntimeMemoryActorRole)) {
    return normalized as RuntimeMemoryActorRole;
  }
  return 'unknown';
}

function deriveAgeDays(createdAt?: number): number {
  if (!createdAt || Number.isNaN(createdAt)) return 0;
  const ageMs = Date.now() - createdAt;
  return ageMs <= 0 ? 0 : Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

function buildDefaultCandidates(): MemoryRetrievalCandidate[] {
  return [];
}

function toRuntimeInput(params: BuildMemoryAdvisoryParams): MemoryRuntimeWorkflowInput {
  const normalizedActorRole = normalizeActorRole(params.actorRole);
  const scope = normalizeScope(params.request.durableMemory?.scope ?? null);
  const normalizedRisk = normalizeRiskLevel(params.request.cvfRiskLevel ?? null);
  const query = (params.request.durableMemory?.query ?? params.request.intent ?? '').trim() || 'memory_advisory_request';
  const candidates = buildDefaultCandidates();

  return {
    operationId: params.request.templateId || 'memory-advisory-operation',
    sessionId: params.sessionId || 'unknown-session',
    projectId: params.request.templateId || 'unknown-project',
    actorId: params.actorId || 'unknown-actor',
    actorRole: normalizedActorRole,
    scope,
    memoryScope: scope,
    riskLevel: normalizedRisk,
    query,
    tokenBudget: 256,
    candidates,
    policyDecision: 'allow_summary_only',
    containsSensitiveData: false,
    maxResults: params.request.durableMemory?.maxResults,
  };
}

function evaluateEligibility(
  actorRole: RuntimeMemoryActorRole,
  scope: string,
  candidates: readonly MemoryRetrievalCandidate[],
): MemoryReadoutEligibilityResult {
  const primary = candidates[0];
  return evaluateReadoutEligibility({
    actorRole,
    scope,
    lifecycleState: primary?.lifecycleState ?? 'working',
    ageDays: deriveAgeDays(primary?.createdAt),
    stale: false,
    revoked: false,
    authoritySourcePresent: Boolean(primary),
  });
}

export function buildMemoryAdvisoryReadout(params: BuildMemoryAdvisoryParams): MemoryExecutionAdvisoryReadout {
  const runtimeInput = toRuntimeInput(params);
  const runtimeProjection = buildMemoryRuntimeReadout(runtimeInput);
  const selected = runtimeProjection.retrievalResult?.selected ?? [];
  const eligibility = evaluateEligibility(runtimeInput.actorRole, runtimeInput.scope, selected);

  return {
    contractVersion: MEMORY_EXECUTION_ADVISORY_VERSION,
    rawMemoryReleased: false,
    canReinject: false,
    eligibility,
    runtimeProjection,
  };
}
