/**
 * Guard Runtime Adapter for Web — v1.6 Enhancement Track 1.1
 *
 * Self-contained port of GuardRuntimeEngine + 6 core guards from
 * CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL into browser-compatible TypeScript.
 *
 * Included guards (relevant for non-coder web context):
 *   1. PhaseGateGuard   — enforces CVF 4-phase boundaries
 *   2. RiskGateGuard    — enforces R0-R3 risk model
 *   3. AuthorityGateGuard — role-based authority boundaries
 *   4. MutationBudgetGuard — prevents excessive changes per session
 *   5. ScopeGuard       — prevents scope creep in wizard inputs
 *   6. AuditTrailGuard  — ensures traceability
 *
 * Skipped guards (coder-only, not relevant for web UI):
 *   - AdrGuard, DepthAuditGuard, ArchitectureCheckGuard
 *   - DocumentNamingGuard, DocumentStorageGuard
 *   - WorkspaceIsolationGuard, GuardRegistryGuard
 *
 * @module lib/guard-runtime-adapter
 */

// ─── Types ────────────────────────────────────────────────────────────

export type CVFPhase = 'DISCOVERY' | 'DESIGN' | 'BUILD' | 'REVIEW';

export type CVFRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

export type CVFRole = 'HUMAN' | 'AI_AGENT' | 'REVIEWER' | 'OPERATOR';

export type GuardDecision = 'ALLOW' | 'BLOCK' | 'ESCALATE';

export type GuardSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface GuardResult {
  guardId: string;
  decision: GuardDecision;
  severity: GuardSeverity;
  reason: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface GuardRequestContext {
  requestId: string;
  phase: CVFPhase;
  riskLevel: CVFRiskLevel;
  role: CVFRole;
  agentId?: string;
  action: string;
  targetFiles?: string[];
  mutationCount?: number;
  mutationBudget?: number;
  scope?: string;
  traceHash?: string;
  metadata?: Record<string, unknown>;
}

export interface Guard {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  evaluate(context: GuardRequestContext): GuardResult;
}

export interface GuardPipelineResult {
  requestId: string;
  finalDecision: GuardDecision;
  results: GuardResult[];
  executedAt: string;
  durationMs: number;
  blockedBy?: string;
  escalatedBy?: string;
}

export interface GuardRuntimeConfig {
  enableAuditLog: boolean;
  strictMode: boolean;
  maxGuardsPerPipeline: number;
  defaultDecision: GuardDecision;
  escalationThreshold: CVFRiskLevel;
}

export interface GuardAuditEntry {
  requestId: string;
  timestamp: string;
  context: GuardRequestContext;
  pipelineResult: GuardPipelineResult;
}

export const DEFAULT_GUARD_RUNTIME_CONFIG: GuardRuntimeConfig = {
  enableAuditLog: true,
  strictMode: true,
  maxGuardsPerPipeline: 20,
  defaultDecision: 'ALLOW',
  escalationThreshold: 'R2',
};

// ─── Guard Runtime Engine ─────────────────────────────────────────────

export class WebGuardRuntimeEngine {
  private guards: Map<string, Guard> = new Map();
  private auditLog: GuardAuditEntry[] = [];
  private config: GuardRuntimeConfig;

  constructor(config?: Partial<GuardRuntimeConfig>) {
    this.config = { ...DEFAULT_GUARD_RUNTIME_CONFIG, ...config };
  }

  registerGuard(guard: Guard): void {
    if (this.guards.size >= this.config.maxGuardsPerPipeline) {
      throw new Error(
        `Guard pipeline limit reached: ${this.config.maxGuardsPerPipeline}. Cannot register guard "${guard.id}".`
      );
    }
    if (this.guards.has(guard.id)) {
      throw new Error(`Guard "${guard.id}" is already registered.`);
    }
    this.guards.set(guard.id, guard);
  }

  unregisterGuard(guardId: string): boolean {
    return this.guards.delete(guardId);
  }

  getGuard(guardId: string): Guard | undefined {
    return this.guards.get(guardId);
  }

  getRegisteredGuards(): Guard[] {
    return Array.from(this.guards.values());
  }

  getGuardCount(): number {
    return this.guards.size;
  }

  evaluate(context: GuardRequestContext): GuardPipelineResult {
    const startTime = Date.now();
    const results: GuardResult[] = [];

    const sortedGuards = this.getSortedEnabledGuards();

    let finalDecision = this.config.defaultDecision;
    let blockedBy: string | undefined;
    let escalatedBy: string | undefined;

    for (const guard of sortedGuards) {
      const result = guard.evaluate(context);
      results.push(result);

      if (result.decision === 'BLOCK') {
        finalDecision = 'BLOCK';
        blockedBy = guard.id;
        if (this.config.strictMode) {
          break;
        }
      }

      if (result.decision === 'ESCALATE' && finalDecision !== 'BLOCK') {
        finalDecision = 'ESCALATE';
        if (!escalatedBy) {
          escalatedBy = guard.id;
        }
      }
    }

    const pipelineResult: GuardPipelineResult = {
      requestId: context.requestId,
      finalDecision,
      results,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      blockedBy,
      escalatedBy,
    };

    if (this.config.enableAuditLog) {
      this.auditLog.push({
        requestId: context.requestId,
        timestamp: pipelineResult.executedAt,
        context,
        pipelineResult,
      });
    }

    return pipelineResult;
  }

  getAuditLog(): readonly GuardAuditEntry[] {
    return this.auditLog;
  }

  getAuditEntry(requestId: string): GuardAuditEntry | undefined {
    return this.auditLog.find((e) => e.requestId === requestId);
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  getConfig(): Readonly<GuardRuntimeConfig> {
    return { ...this.config };
  }

  updateConfig(updates: Partial<GuardRuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  private getSortedEnabledGuards(): Guard[] {
    return Array.from(this.guards.values())
      .filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority);
  }
}

// ─── Guard 1: Phase Gate (priority 10) ────────────────────────────────

export const PHASE_ROLE_MATRIX: Record<CVFPhase, CVFRole[]> = {
  DISCOVERY: ['HUMAN', 'OPERATOR'],
  DESIGN: ['HUMAN', 'OPERATOR'],
  BUILD: ['HUMAN', 'AI_AGENT', 'OPERATOR'],
  REVIEW: ['HUMAN', 'REVIEWER', 'OPERATOR'],
};

export const PHASE_ORDER: CVFPhase[] = ['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW'];

export class PhaseGateGuard implements Guard {
  id = 'phase_gate';
  name = 'Phase Gate Guard';
  description = 'Enforces CVF 4-Phase Process boundaries and role-phase authorization.';
  priority = 10;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const allowedRoles = PHASE_ROLE_MATRIX[context.phase];

    if (!allowedRoles) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown phase: "${context.phase}". Valid phases: ${PHASE_ORDER.join(', ')}.`,
        timestamp,
      };
    }

    if (!allowedRoles.includes(context.role)) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized for phase "${context.phase}". Allowed roles: ${allowedRoles.join(', ')}.`,
        timestamp,
        metadata: { phase: context.phase, role: context.role, allowedRoles },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" authorized for phase "${context.phase}".`,
      timestamp,
    };
  }
}

// ─── Guard 2: Risk Gate (priority 20) ─────────────────────────────────

export const RISK_NUMERIC: Record<CVFRiskLevel, number> = {
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
};

export class RiskGateGuard implements Guard {
  id = 'risk_gate';
  name = 'Risk Gate Guard';
  description = 'Enforces CVF R0-R3 risk model with role-based escalation.';
  priority = 20;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const riskNum = RISK_NUMERIC[context.riskLevel];

    if (riskNum === undefined) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown risk level: "${context.riskLevel}". Valid levels: R0, R1, R2, R3.`,
        timestamp,
      };
    }

    if (context.riskLevel === 'R3') {
      if (context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'CRITICAL',
          reason: 'R3 (Critical) actions are blocked for AI agents. Requires human-in-the-loop approval.',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'ERROR',
        reason: 'R3 (Critical) action requires explicit human approval and audit trail.',
        timestamp,
        metadata: { riskLevel: context.riskLevel, role: context.role },
      };
    }

    if (context.riskLevel === 'R2') {
      if (context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: 'R2 (Elevated) action by AI agent requires approval. Escalating to human review.',
          timestamp,
          metadata: { riskLevel: context.riskLevel, role: context.role },
        };
      }
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'WARN',
        reason: `R2 (Elevated) action allowed for role "${context.role}" with logging.`,
        timestamp,
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Risk level "${context.riskLevel}" is within safe bounds for role "${context.role}".`,
      timestamp,
    };
  }
}

// ─── Guard 3: Authority Gate (priority 30) ────────────────────────────

export const RESTRICTED_ACTIONS: Record<CVFRole, string[]> = {
  AI_AGENT: ['approve', 'merge', 'release', 'deploy', 'delete_governance', 'override_gate'],
  REVIEWER: ['build', 'deploy', 'delete_governance', 'override_gate'],
  HUMAN: [],
  OPERATOR: [],
};

export class AuthorityGateGuard implements Guard {
  id = 'authority_gate';
  name = 'Authority Gate Guard';
  description = 'Enforces role-based authority boundaries for CVF actions.';
  priority = 30;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const restricted = RESTRICTED_ACTIONS[context.role];

    if (!restricted) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: `Unknown role: "${context.role}".`,
        timestamp,
      };
    }

    const normalizedAction = context.action.toLowerCase().trim();
    const violation = restricted.find((r) => normalizedAction.includes(r));

    if (violation) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Role "${context.role}" is not authorized to perform "${context.action}" (restricted action: "${violation}").`,
        timestamp,
        metadata: { role: context.role, action: context.action, violation },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Role "${context.role}" is authorized for action "${context.action}".`,
      timestamp,
    };
  }
}

// ─── Guard 4: Mutation Budget (priority 40) ───────────────────────────

export const DEFAULT_MUTATION_BUDGETS: Record<CVFRiskLevel, number> = {
  R0: 50,
  R1: 20,
  R2: 10,
  R3: 3,
};

export const ESCALATION_THRESHOLD = 0.8;

export class MutationBudgetGuard implements Guard {
  id = 'mutation_budget';
  name = 'Mutation Budget Guard';
  description = 'Enforces mutation budget limits to prevent excessive changes.';
  priority = 40;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const budget = context.mutationBudget ?? DEFAULT_MUTATION_BUDGETS[context.riskLevel] ?? 20;
    const count = context.mutationCount ?? 0;

    if (count > budget) {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'ERROR',
        reason: `Mutation count (${count}) exceeds budget (${budget}) for risk level "${context.riskLevel}".`,
        timestamp,
        metadata: { mutationCount: count, mutationBudget: budget, riskLevel: context.riskLevel },
      };
    }

    if (count > budget * ESCALATION_THRESHOLD) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Mutation count (${count}) is at ${Math.round((count / budget) * 100)}% of budget (${budget}). Approaching limit.`,
        timestamp,
        metadata: { mutationCount: count, mutationBudget: budget, usage: count / budget },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `Mutation count (${count}) within budget (${budget}).`,
      timestamp,
    };
  }
}

// ─── Guard 5: Scope Guard (priority 50) ──────────────────────────────

export const PROTECTED_PATHS = [
  'governance/',
  'docs/CVF_',
  'v1.0/',
  'v1.1/',
  'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/',
];

export const CVF_ROOT_INDICATORS = [
  'README.md',
  'CHANGELOG.md',
  'package.json',
  'CVF_LITE.md',
];

export class ScopeGuard implements Guard {
  id = 'scope_guard';
  name = 'Scope Guard';
  description = 'Enforces workspace isolation and protected path boundaries.';
  priority = 50;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const targetFiles = context.targetFiles ?? [];

    if (targetFiles.length === 0) {
      return {
        guardId: this.id,
        decision: 'ALLOW',
        severity: 'INFO',
        reason: 'No target files specified. Scope check skipped.',
        timestamp,
      };
    }

    for (const file of targetFiles) {
      const normalizedFile = file.replace(/\\/g, '/');

      const protectedViolation = PROTECTED_PATHS.find((p) =>
        normalizedFile.includes(p)
      );

      if (protectedViolation && context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'BLOCK',
          severity: 'ERROR',
          reason: `AI agent cannot modify protected path "${protectedViolation}" (file: "${file}"). Requires HUMAN or OPERATOR role.`,
          timestamp,
          metadata: { file, protectedPath: protectedViolation, role: context.role },
        };
      }

      const isRootFile = CVF_ROOT_INDICATORS.some((r) =>
        normalizedFile.endsWith(r)
      );

      if (isRootFile && context.role === 'AI_AGENT') {
        return {
          guardId: this.id,
          decision: 'ESCALATE',
          severity: 'WARN',
          reason: `AI agent modifying CVF root file "${file}" requires escalation.`,
          timestamp,
          metadata: { file, role: context.role },
        };
      }
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: `All ${targetFiles.length} target file(s) within allowed scope.`,
      timestamp,
    };
  }
}

// ─── Guard 6: Audit Trail (priority 60) ──────────────────────────────

export class AuditTrailGuard implements Guard {
  id = 'audit_trail';
  name = 'Audit Trail Guard';
  description = 'Enforces mandatory audit trail and tracing requirements.';
  priority = 60;
  enabled = true;

  evaluate(context: GuardRequestContext): GuardResult {
    const timestamp = new Date().toISOString();
    const missingFields: string[] = [];

    if (!context.requestId || context.requestId.trim() === '') {
      return {
        guardId: this.id,
        decision: 'BLOCK',
        severity: 'CRITICAL',
        reason: 'Missing required field: requestId. Every action must be traceable.',
        timestamp,
      };
    }

    if (context.role === 'AI_AGENT' && (!context.agentId || context.agentId.trim() === '')) {
      missingFields.push('agentId');
    }

    if ((context.riskLevel === 'R2' || context.riskLevel === 'R3') && !context.traceHash) {
      missingFields.push('traceHash');
    }

    if (missingFields.length > 0) {
      return {
        guardId: this.id,
        decision: 'ESCALATE',
        severity: 'WARN',
        reason: `Missing audit trail fields: ${missingFields.join(', ')}. Action requires escalation for trace completion.`,
        timestamp,
        metadata: { missingFields, riskLevel: context.riskLevel, role: context.role },
      };
    }

    return {
      guardId: this.id,
      decision: 'ALLOW',
      severity: 'INFO',
      reason: 'All audit trail requirements satisfied.',
      timestamp,
    };
  }
}

// ─── Factory: Create pre-configured engine ───────────────────────────

/**
 * Creates a WebGuardRuntimeEngine pre-loaded with all 6 non-coder guards.
 * Ready to use — just call engine.evaluate(context).
 */
export function createWebGuardEngine(
  config?: Partial<GuardRuntimeConfig>,
): WebGuardRuntimeEngine {
  const engine = new WebGuardRuntimeEngine(config);
  engine.registerGuard(new PhaseGateGuard());
  engine.registerGuard(new RiskGateGuard());
  engine.registerGuard(new AuthorityGateGuard());
  engine.registerGuard(new MutationBudgetGuard());
  engine.registerGuard(new ScopeGuard());
  engine.registerGuard(new AuditTrailGuard());
  return engine;
}

// ─── Helper: Build context from v1.6 execute request ─────────────────

export interface WebGuardInput {
  requestId?: string;
  phase?: string;
  riskLevel?: string;
  role?: string;
  agentId?: string;
  action?: string;
  templateCategory?: string;
  intent?: string;
  mutationCount?: number;
}

/**
 * Converts loose v1.6 web request fields into a typed GuardRequestContext.
 * Provides sensible defaults for non-coder usage:
 *   - Default phase: BUILD (non-coders are always "building" via templates)
 *   - Default risk: R0 (safe by default)
 *   - Default role: HUMAN (non-coder = human user)
 */
export function buildWebGuardContext(input: WebGuardInput): GuardRequestContext {
  return {
    requestId: input.requestId || `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: normalizePhase(input.phase),
    riskLevel: normalizeRiskLevel(input.riskLevel),
    role: normalizeRole(input.role),
    agentId: input.agentId,
    action: input.action || input.intent || 'execute_template',
    mutationCount: input.mutationCount,
  };
}

function normalizePhase(raw?: string): CVFPhase {
  if (!raw) return 'BUILD';
  const upper = raw.trim().toUpperCase();
  if (upper === 'DISCOVERY' || upper === 'PHASE A' || upper === 'A') return 'DISCOVERY';
  if (upper === 'DESIGN' || upper === 'PHASE B' || upper === 'B') return 'DESIGN';
  if (upper === 'BUILD' || upper === 'PHASE C' || upper === 'C') return 'BUILD';
  if (upper === 'REVIEW' || upper === 'PHASE D' || upper === 'D') return 'REVIEW';
  return 'BUILD';
}

function normalizeRiskLevel(raw?: string): CVFRiskLevel {
  if (!raw) return 'R0';
  const upper = raw.trim().toUpperCase();
  if (upper === 'R0' || upper === 'LOW' || upper === 'SAFE') return 'R0';
  if (upper === 'R1' || upper === 'MEDIUM' || upper === 'ATTENTION') return 'R1';
  if (upper === 'R2' || upper === 'HIGH' || upper === 'ELEVATED') return 'R2';
  if (upper === 'R3' || upper === 'CRITICAL' || upper === 'DANGEROUS') return 'R3';
  return 'R0';
}

function normalizeRole(raw?: string): CVFRole {
  if (!raw) return 'HUMAN';
  const upper = raw.trim().toUpperCase();
  if (upper === 'AI_AGENT' || upper === 'AI' || upper === 'AGENT') return 'AI_AGENT';
  if (upper === 'REVIEWER') return 'REVIEWER';
  if (upper === 'OPERATOR') return 'OPERATOR';
  return 'HUMAN';
}
