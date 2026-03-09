/**
 * Doc→Code Guard Migration Tests — Track IV Phase A.2
 *
 * Tests for all 8 document-only guards converted to runtime code:
 * AdrGuard, DepthAuditGuard, ArchitectureCheckGuard, DocumentNamingGuard,
 * DocumentStorageGuard, WorkspaceIsolationGuard, GuardRegistryGuard,
 * and DiagramValidationGuard (enhanced).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AdrGuard } from '../governance/guard_runtime/guards/adr.guard.js';
import { DepthAuditGuard } from '../governance/guard_runtime/guards/depth.audit.guard.js';
import type { DepthAuditScores } from '../governance/guard_runtime/guards/depth.audit.guard.js';
import { ArchitectureCheckGuard } from '../governance/guard_runtime/guards/architecture.check.guard.js';
import type { ArchitectureChecklist } from '../governance/guard_runtime/guards/architecture.check.guard.js';
import { DocumentNamingGuard, CVF_PREFIX_PATTERN } from '../governance/guard_runtime/guards/document.naming.guard.js';
import { DocumentStorageGuard, APPROVED_TAXONOMY_FOLDERS } from '../governance/guard_runtime/guards/document.storage.guard.js';
import { WorkspaceIsolationGuard, DOWNSTREAM_INDICATORS } from '../governance/guard_runtime/guards/workspace.isolation.guard.js';
import { GuardRegistryGuard } from '../governance/guard_runtime/guards/guard.registry.guard.js';
import { GuardRuntimeEngine } from '../governance/guard_runtime/guard.runtime.engine.js';
import { PhaseGateGuard } from '../governance/guard_runtime/guards/phase.gate.guard.js';
import { RiskGateGuard } from '../governance/guard_runtime/guards/risk.gate.guard.js';
import { AuthorityGateGuard } from '../governance/guard_runtime/guards/authority.gate.guard.js';
import { MutationBudgetGuard } from '../governance/guard_runtime/guards/mutation.budget.guard.js';
import { ScopeGuard } from '../governance/guard_runtime/guards/scope.guard.js';
import { AuditTrailGuard } from '../governance/guard_runtime/guards/audit.trail.guard.js';
import type { GuardRequestContext } from '../governance/guard_runtime/guard.runtime.types.js';

function makeContext(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: 'req-a2-001',
    phase: 'BUILD',
    riskLevel: 'R1',
    role: 'HUMAN',
    action: 'write_code',
    ...overrides,
  };
}

// --- AdrGuard ---

describe('AdrGuard', () => {
  let guard: AdrGuard;

  beforeEach(() => {
    guard = new AdrGuard();
  });

  it('allows non-architectural commits', () => {
    const result = guard.evaluate(makeContext({ action: 'write_code' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows exempt commit patterns (fix)', () => {
    const result = guard.evaluate(makeContext({ action: 'fix: button alignment' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows exempt commit patterns (test)', () => {
    const result = guard.evaluate(makeContext({ action: 'test: add unit tests' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks feat(governance) without ADR', () => {
    const result = guard.evaluate(makeContext({ action: 'feat(governance): new policy' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks feat(core-value) without ADR', () => {
    const result = guard.evaluate(makeContext({ action: 'feat(core-value): update mission' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks refactor(arch) without ADR', () => {
    const result = guard.evaluate(makeContext({ action: 'refactor(arch): restructure layers' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows feat(governance) with ADR reference', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(governance): new policy',
      metadata: { adrId: 'ADR-001' },
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks when ADR not in registry', () => {
    guard.registerAdrEntry('ADR-001');
    const result = guard.evaluate(makeContext({
      action: 'feat(governance): new policy',
      metadata: { adrId: 'ADR-999' },
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows when ADR is in registry', () => {
    guard.registerAdrEntry('ADR-001');
    const result = guard.evaluate(makeContext({
      action: 'feat(governance): new policy',
      metadata: { adrId: 'ADR-001' },
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('manages ADR entries correctly', () => {
    guard.registerAdrEntry('ADR-001');
    guard.registerAdrEntry('ADR-002');
    expect(guard.getAdrCount()).toBe(2);
    expect(guard.hasAdrEntry('adr-001')).toBe(true);
    expect(guard.hasAdrEntry('ADR-003')).toBe(false);
  });
});

// --- DepthAuditGuard ---

describe('DepthAuditGuard', () => {
  const guard = new DepthAuditGuard();

  const highScores: DepthAuditScores = {
    riskReduction: 2, decisionValue: 2, machineEnforceability: 2,
    operationalEfficiency: 1, portfolioPriority: 2,
  };

  const midScores: DepthAuditScores = {
    riskReduction: 1, decisionValue: 2, machineEnforceability: 1,
    operationalEfficiency: 1, portfolioPriority: 2,
  };

  const lowScores: DepthAuditScores = {
    riskReduction: 1, decisionValue: 1, machineEnforceability: 1,
    operationalEfficiency: 1, portfolioPriority: 1,
  };

  const zeroScores: DepthAuditScores = {
    riskReduction: 0, decisionValue: 2, machineEnforceability: 2,
    operationalEfficiency: 2, portfolioPriority: 2,
  };

  it('allows non-deepening actions', () => {
    const result = guard.evaluate(makeContext({ action: 'write_code' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks deepening without scores', () => {
    const result = guard.evaluate(makeContext({ action: 'feat(layer): add semantic layer' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows deepening with high scores (8+)', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(layer): add safety layer',
      metadata: { depthAuditScores: highScores },
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('escalates deepening with mid scores (6-7)', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(layer): add semantic layer',
      metadata: { depthAuditScores: midScores },
    }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('blocks deepening with low scores (0-5)', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(layer): add unnecessary layer',
      metadata: { depthAuditScores: lowScores },
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('hard-stops when critical criterion is 0', () => {
    const result = guard.evaluate(makeContext({
      action: 'deepen: add new phase',
      metadata: { depthAuditScores: zeroScores },
    }));
    expect(result.decision).toBe('BLOCK');
    expect(result.severity).toBe('CRITICAL');
    expect(result.reason).toContain('riskReduction');
  });

  it('detects deepen keyword in action', () => {
    const result = guard.evaluate(makeContext({ action: 'deepen roadmap phase 7' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('detects new_layer keyword', () => {
    const result = guard.evaluate(makeContext({ action: 'new_layer for safety' }));
    expect(result.decision).toBe('BLOCK');
  });
});

// --- ArchitectureCheckGuard ---

describe('ArchitectureCheckGuard', () => {
  const guard = new ArchitectureCheckGuard();

  const validChecklist: ArchitectureChecklist = {
    layerPlacement: 3,
    principleCompliance: true,
    overlapCheck: true,
    backwardCompat: true,
    kbRead: true,
  };

  it('allows non-architectural actions', () => {
    const result = guard.evaluate(makeContext({ action: 'write_code' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows exempt patterns (fix)', () => {
    const result = guard.evaluate(makeContext({ action: 'fix: bug in parser' }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks new extension without checklist', () => {
    const result = guard.evaluate(makeContext({ action: 'feat(extension): new CVF extension' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks new version without checklist', () => {
    const result = guard.evaluate(makeContext({ action: 'new_extension for safety' }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows with valid checklist', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(extension): new CVF extension',
      metadata: { architectureChecklist: validChecklist },
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks when KB not read', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(extension): new module',
      metadata: { architectureChecklist: { ...validChecklist, kbRead: false } },
    }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('kbRead');
  });

  it('blocks when layer placement invalid', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(layer): new layer',
      metadata: { architectureChecklist: { ...validChecklist, layerPlacement: 0 } },
    }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('layerPlacement');
  });

  it('blocks when backward compat not confirmed', () => {
    const result = guard.evaluate(makeContext({
      action: 'feat(module): new module',
      metadata: { architectureChecklist: { ...validChecklist, backwardCompat: false } },
    }));
    expect(result.decision).toBe('BLOCK');
    expect(result.reason).toContain('backwardCompat');
  });
});

// --- DocumentNamingGuard ---

describe('DocumentNamingGuard', () => {
  const guard = new DocumentNamingGuard();

  it('allows when no target files', () => {
    const result = guard.evaluate(makeContext({ targetFiles: [] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows files not in governed paths', () => {
    const result = guard.evaluate(makeContext({ targetFiles: ['src/app.ts'] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows CVF_ prefixed files in docs/', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/assessments/CVF_REVIEW_2026-03-09.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks non-CVF_ prefixed files in docs/', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/assessments/my_review.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows exempt files (README.md)', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/README.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows exempt files (INDEX.md)', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/INDEX.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks non-CVF_ in governance/', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance/toolkit/random_doc.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows non-md files in docs/', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/reference/data.json'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('CVF_PREFIX_PATTERN validates correctly', () => {
    expect(CVF_PREFIX_PATTERN.test('CVF_REVIEW_2026-03-09.md')).toBe(true);
    expect(CVF_PREFIX_PATTERN.test('CVF_ARCHITECTURE_DECISIONS.md')).toBe(true);
    expect(CVF_PREFIX_PATTERN.test('my_review.md')).toBe(false);
    expect(CVF_PREFIX_PATTERN.test('cvf_lowercase.md')).toBe(false);
  });
});

// --- DocumentStorageGuard ---

describe('DocumentStorageGuard', () => {
  const guard = new DocumentStorageGuard();

  it('allows when no target files', () => {
    const result = guard.evaluate(makeContext({ targetFiles: [] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows files in approved taxonomy', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/assessments/CVF_REVIEW.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows root-level exceptions', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/CVF_CORE_KNOWLEDGE_BASE.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks new md directly in docs/ root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/random_new_doc.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows non-docs files', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['src/app.ts'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows non-md files in docs/', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/diagram.png'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows files in reviews/ subfolder', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docs/reviews/cvf_phase/CVF_REVIEW.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('exports APPROVED_TAXONOMY_FOLDERS', () => {
    expect(APPROVED_TAXONOMY_FOLDERS).toContain('docs/assessments/');
    expect(APPROVED_TAXONOMY_FOLDERS).toContain('docs/reference/');
    expect(APPROVED_TAXONOMY_FOLDERS.length).toBeGreaterThanOrEqual(10);
  });
});

// --- WorkspaceIsolationGuard ---

describe('WorkspaceIsolationGuard', () => {
  const guard = new WorkspaceIsolationGuard();

  it('allows when no target files', () => {
    const result = guard.evaluate(makeContext({ targetFiles: [] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('allows normal CVF files', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance/toolkit/guard.md', 'EXTENSIONS/CVF_v1.1.1/test.ts'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks .env in CVF root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['.env'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks .env.local in CVF root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['.env.local'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks Dockerfile in CVF root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['Dockerfile'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('blocks docker-compose.yml in CVF root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['docker-compose.yml'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows Dockerfile inside EXTENSIONS', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['EXTENSIONS/CVF_v2.0/Dockerfile'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('blocks next.config.js in CVF root', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['next.config.js'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('exports DOWNSTREAM_INDICATORS', () => {
    expect(DOWNSTREAM_INDICATORS).toContain('.env');
    expect(DOWNSTREAM_INDICATORS).toContain('Dockerfile');
  });
});

// --- GuardRegistryGuard ---

describe('GuardRegistryGuard', () => {
  let guard: GuardRegistryGuard;

  beforeEach(() => {
    guard = new GuardRegistryGuard();
  });

  it('allows when no guard files targeted', () => {
    const result = guard.evaluate(makeContext({ targetFiles: ['src/app.ts'] }));
    expect(result.decision).toBe('ALLOW');
  });

  it('escalates when guard files targeted but no registry loaded', () => {
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance/toolkit/05_OPERATION/CVF_NEW_GUARD.md'],
    }));
    expect(result.decision).toBe('ESCALATE');
  });

  it('blocks when guard not fully registered', () => {
    guard.registerGuardEntry('CVF_NEW_GUARD', { readme: true, knowledgeBase: false });
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance/toolkit/05_OPERATION/CVF_NEW_GUARD.md'],
    }));
    expect(result.decision).toBe('BLOCK');
  });

  it('allows when guard fully registered', () => {
    guard.registerGuardEntry('CVF_NEW_GUARD', { readme: true, knowledgeBase: true });
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance/toolkit/05_OPERATION/CVF_NEW_GUARD.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });

  it('detects orphaned guards', () => {
    guard.registerGuardEntry('CVF_A_GUARD', { readme: true, knowledgeBase: false });
    guard.registerGuardEntry('CVF_B_GUARD', { readme: true, knowledgeBase: true });
    expect(guard.getOrphanedGuards()).toEqual(['CVF_A_GUARD']);
  });

  it('tracks registry size', () => {
    guard.registerGuardEntry('CVF_A_GUARD', { readme: true, knowledgeBase: true });
    guard.registerGuardEntry('CVF_B_GUARD', { readme: false, knowledgeBase: true });
    expect(guard.getRegistrySize()).toBe(2);
  });

  it('isFullyRegistered returns correct status', () => {
    guard.registerGuardEntry('CVF_A_GUARD', { readme: true, knowledgeBase: true });
    guard.registerGuardEntry('CVF_B_GUARD', { readme: true, knowledgeBase: false });
    expect(guard.isFullyRegistered('CVF_A_GUARD')).toBe(true);
    expect(guard.isFullyRegistered('CVF_B_GUARD')).toBe(false);
    expect(guard.isFullyRegistered('CVF_C_GUARD')).toBe(false);
  });

  it('handles Windows backslash paths', () => {
    guard.registerGuardEntry('CVF_TEST_GUARD', { readme: true, knowledgeBase: true });
    const result = guard.evaluate(makeContext({
      targetFiles: ['governance\\toolkit\\05_OPERATION\\CVF_TEST_GUARD.md'],
    }));
    expect(result.decision).toBe('ALLOW');
  });
});

// --- Full Integration: All 13 Guards ---

describe('Phase A.2 Full Guard Pipeline (13 guards)', () => {
  let engine: GuardRuntimeEngine;

  beforeEach(() => {
    engine = new GuardRuntimeEngine();

    // Phase A.1 guards
    engine.registerGuard(new PhaseGateGuard());
    engine.registerGuard(new RiskGateGuard());
    engine.registerGuard(new AuthorityGateGuard());
    engine.registerGuard(new MutationBudgetGuard());
    engine.registerGuard(new ScopeGuard());
    engine.registerGuard(new AuditTrailGuard());

    // Phase A.2 guards
    engine.registerGuard(new AdrGuard());
    engine.registerGuard(new DepthAuditGuard());
    engine.registerGuard(new ArchitectureCheckGuard());
    engine.registerGuard(new DocumentNamingGuard());
    engine.registerGuard(new DocumentStorageGuard());
    engine.registerGuard(new WorkspaceIsolationGuard());
    engine.registerGuard(new GuardRegistryGuard());
  });

  it('has all 13 guards registered', () => {
    expect(engine.getGuardCount()).toBe(13);
  });

  it('allows simple BUILD action with all guards', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      role: 'AI_AGENT',
      agentId: 'claude',
      action: 'write_code',
      riskLevel: 'R1',
      mutationCount: 3,
      targetFiles: ['src/components/Button.tsx'],
    }));
    expect(result.finalDecision).toBe('ALLOW');
    expect(result.results.length).toBe(13);
  });

  it('blocks architectural action without ADR', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      role: 'HUMAN',
      action: 'feat(governance): new guard policy',
      targetFiles: ['governance/toolkit/05_OPERATION/CVF_NEW_GUARD.md'],
    }));
    expect(result.finalDecision).toBe('BLOCK');
  });

  it('blocks downstream project files in CVF root', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      role: 'HUMAN',
      action: 'write_code',
      targetFiles: ['.env.local'],
    }));
    expect(result.finalDecision).toBe('BLOCK');
  });

  it('blocks bad document naming', () => {
    const result = engine.evaluate(makeContext({
      phase: 'BUILD',
      role: 'HUMAN',
      action: 'write_code',
      targetFiles: ['docs/assessments/bad_name.md'],
    }));
    expect(result.finalDecision).toBe('BLOCK');
  });
});
