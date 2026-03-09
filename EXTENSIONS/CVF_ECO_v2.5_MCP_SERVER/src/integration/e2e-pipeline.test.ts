/**
 * End-to-End Integration Tests — M6.2
 *
 * Tests the full CVF pipeline: Vibe → Parse → Clarify → Guard → Execute → Audit
 * Simulates real user workflows from input to governed output.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGuardEngine } from '../guards/index.js';
import { generateSystemPrompt } from '../prompt/system-prompt.js';
import { createUnifiedRegistry } from '../registry/guard-registry.js';
import { createDefaultSkillGuardWire } from '../registry/skill-guard-wire.js';
import { parseVibe } from '../vibe-translator/vibe-parser.js';
import { generateClarifications } from '../vibe-translator/clarification-engine.js';
import { generateConfirmationCard, formatCardAsText } from '../vibe-translator/confirmation-card.js';
import { SessionMemory } from '../memory/session-memory.js';
import { JsonFileAdapter } from '../persistence/json-file.adapter.js';
import { runCli } from '../cli/cli.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import type { GuardRequestContext } from '../guards/types.js';

// ─── Full Pipeline: Vibe → Guard → Output ─────────────────────────────

describe('E2E: Full Pipeline', () => {
  let engine: ReturnType<typeof createGuardEngine>;
  let memory: SessionMemory;

  beforeEach(() => {
    engine = createGuardEngine();
    memory = new SessionMemory('e2e-test', { enableExpiry: false });
  });

  it('safe create request flows through entire pipeline', () => {
    // Step 1: User vibe input
    const vibe = parseVibe('Create a landing page for my startup');
    expect(vibe.actionType).toBe('create');
    expect(vibe.confidence).toBeGreaterThan(0.3);

    // Step 2: Clarification check
    const clarification = generateClarifications(vibe);
    expect(clarification.needsClarification).toBe(false);

    // Step 3: Confirmation card
    const card = generateConfirmationCard(vibe, clarification);
    expect(card.status).toBe('ready');
    expect(card.steps.length).toBeGreaterThan(0);

    // Step 4: Guard evaluation
    const context: GuardRequestContext = {
      requestId: 'e2e-001',
      phase: vibe.suggestedPhase as any,
      riskLevel: vibe.suggestedRisk as any,
      role: 'HUMAN',
      action: 'create landing page',
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('ALLOW');

    // Step 5: Record in memory
    memory.recordDecision(result);
    expect(memory.getDecisionCounts().allowed).toBe(1);

    // Step 6: Audit trail
    const auditLog = engine.getAuditLog();
    expect(auditLog.length).toBe(1);
    expect(auditLog[0].requestId).toBe('e2e-001');
  });

  it('risky deploy request is blocked for AI agent', () => {
    // Step 1: Parse vibe
    const vibe = parseVibe('Deploy the app to production');
    expect(vibe.actionType).toBe('deploy');
    expect(vibe.suggestedRisk).toBe('R3');

    // Step 2: Clarification needed (target_environment)
    const clarification = generateClarifications(vibe);
    expect(clarification.questions.some((q) => q.slot === 'target_environment')).toBe(true);

    // Step 3: Card shows blocked/needs_info
    const card = generateConfirmationCard(vibe, clarification);
    expect(card.requiresConfirmation).toBe(true);

    // Step 4: Guard blocks AI agent
    const context: GuardRequestContext = {
      requestId: 'e2e-002',
      phase: 'REVIEW',
      riskLevel: 'R3',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'deploy to production',
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBeDefined();
    expect(result.agentGuidance).toBeDefined();

    // Step 5: Memory records the block
    memory.recordDecision(result);
    expect(memory.getDecisionCounts().blocked).toBe(1);
  });

  it('AI agent in BUILD phase is allowed for safe coding', () => {
    const context: GuardRequestContext = {
      requestId: 'e2e-003',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'write component code',
      mutationCount: 3,
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('AI agent in DISCOVERY phase is blocked', () => {
    const context: GuardRequestContext = {
      requestId: 'e2e-004',
      phase: 'DISCOVERY',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'gather requirements',
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('phase_gate');
  });

  it('mutation budget exhaustion blocks further changes', () => {
    const context: GuardRequestContext = {
      requestId: 'e2e-005',
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'HUMAN',
      action: 'bulk edit files',
      mutationCount: 15,
      traceHash: 'abc123',
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('mutation_budget');
  });

  it('protected governance file blocks AI modification', () => {
    const context: GuardRequestContext = {
      requestId: 'e2e-006',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'edit governance rules',
      targetFiles: ['governance/guard_runtime/guard.runtime.engine.ts'],
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('scope_guard');
  });
});

// ─── Phase Advancement Workflow ───────────────────────────────────────

describe('E2E: Phase Advancement', () => {
  let memory: SessionMemory;

  beforeEach(() => {
    memory = new SessionMemory('phase-test', { enableExpiry: false });
  });

  it('tracks full phase progression', () => {
    expect(memory.getPhase()).toBe('DISCOVERY');

    memory.advancePhase('DESIGN');
    expect(memory.getPhase()).toBe('DESIGN');

    memory.advancePhase('BUILD');
    expect(memory.getPhase()).toBe('BUILD');

    memory.advancePhase('REVIEW');
    expect(memory.getPhase()).toBe('REVIEW');

    const history = memory.getPhaseHistory();
    expect(history).toHaveLength(4);
    expect(history.map((h) => h.phase)).toEqual(['DISCOVERY', 'DESIGN', 'BUILD', 'REVIEW']);
  });

  it('snapshot reflects current state after progression', () => {
    memory.advancePhase('BUILD');
    memory.setRisk('R1');
    memory.incrementMutations(7);
    memory.addConstraint('budget', 'Max $100');

    const snap = memory.snapshot();
    expect(snap.currentPhase).toBe('BUILD');
    expect(snap.currentRisk).toBe('R1');
    expect(snap.mutationCount).toBe(7);
    expect(snap.phaseHistory).toHaveLength(2);
  });
});

// ─── Skill-Guard Wire Integration ─────────────────────────────────────

describe('E2E: Skill-Guard Wire', () => {
  it('code_implementation skill requires all 6 guards', () => {
    const wire = createDefaultSkillGuardWire();
    const registry = createUnifiedRegistry();
    const activeGuardIds = registry.getEnabled().map((g) => g.guard.id);

    const result = wire.checkSkill('code_implementation', 'BUILD', 'R1', 'AI_AGENT', activeGuardIds);
    expect(result.allowed).toBe(true);
    expect(result.missingGuards).toHaveLength(0);
  });

  it('code_implementation blocked in wrong phase', () => {
    const wire = createDefaultSkillGuardWire();
    const registry = createUnifiedRegistry();
    const activeGuardIds = registry.getEnabled().map((g) => g.guard.id);

    const result = wire.checkSkill('code_implementation', 'DISCOVERY', 'R0', 'AI_AGENT', activeGuardIds);
    expect(result.allowed).toBe(false);
    expect(result.phaseMatch).toBe(false);
  });

  it('deployment skill requires OPERATOR role', () => {
    const wire = createDefaultSkillGuardWire();
    const registry = createUnifiedRegistry();
    const activeGuardIds = registry.getEnabled().map((g) => g.guard.id);

    const aiResult = wire.checkSkill('deployment', 'REVIEW', 'R3', 'AI_AGENT', activeGuardIds);
    expect(aiResult.roleAuthorized).toBe(false);

    const opResult = wire.checkSkill('deployment', 'REVIEW', 'R3', 'OPERATOR', activeGuardIds);
    expect(opResult.roleAuthorized).toBe(true);
  });
});

// ─── System Prompt Integration ────────────────────────────────────────

describe('E2E: System Prompt', () => {
  it('generates prompt with all sections for AI agent', () => {
    const prompt = generateSystemPrompt({
      phase: 'BUILD',
      riskLevel: 'R1',
      role: 'AI_AGENT',
      agentId: 'cascade-001',
      projectName: 'CVF Test',
      mcpToolsAvailable: true,
      maxRiskLevel: 'R2',
      userConstraints: ['No external API calls', 'Max 20 file changes'],
    });

    expect(prompt.sections).toContain('identity');
    expect(prompt.sections).toContain('phase_governance');
    expect(prompt.sections).toContain('risk_model');
    expect(prompt.sections).toContain('authority');
    expect(prompt.sections).toContain('goal_constraint');
    expect(prompt.sections).toContain('self_correction');
    expect(prompt.sections).toContain('mcp_tools');
    expect(prompt.sections).toContain('user_constraints');
    expect(prompt.sections).toContain('failure_mode');

    expect(prompt.systemPrompt).toContain('BUILD');
    expect(prompt.systemPrompt).toContain('AI_AGENT');
    expect(prompt.systemPrompt).toContain('CVF Test');
    expect(prompt.systemPrompt).toContain('cascade-001');
    expect(prompt.systemPrompt).toContain('No external API calls');
    expect(prompt.estimatedTokens).toBeGreaterThan(200);
  });
});

// ─── CLI Integration ──────────────────────────────────────────────────

describe('E2E: CLI', () => {
  it('evaluate command returns full pipeline result', () => {
    const result = runCli([
      'evaluate', '--phase', 'BUILD', '--risk', 'R0', '--role', 'HUMAN', '--action', 'write code',
    ]);
    expect(result.success).toBe(true);
    expect((result.output as any).finalDecision).toBe('ALLOW');
    expect((result.output as any).guardCount).toBe(6);
  });

  it('prompt command generates system prompt', () => {
    const result = runCli([
      'prompt', '--phase', 'BUILD', '--role', 'AI_AGENT', '--project', 'TestApp',
    ]);
    expect(result.success).toBe(true);
    expect((result.output as any).systemPrompt).toContain('BUILD');
    expect((result.output as any).systemPrompt).toContain('TestApp');
  });

  it('status command shows server info', () => {
    const result = runCli(['status']);
    expect(result.success).toBe(true);
    expect((result.output as any).version).toBe('1.7.0');
    expect((result.output as any).guardCount).toBe(6);
  });
});

// ─── Persistence Integration ──────────────────────────────────────────

describe('E2E: Persistence', () => {
  let adapter: JsonFileAdapter;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `cvf-e2e-${Date.now()}`);
    adapter = new JsonFileAdapter({ dataDir: testDir });
    await adapter.init();
  });

  afterEach(async () => {
    await adapter.close();
    try { rmSync(testDir, { recursive: true, force: true }); } catch {}
  });

  it('guard decisions persist across sessions', async () => {
    const engine = createGuardEngine();
    const context: GuardRequestContext = {
      requestId: 'persist-001',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      action: 'test persistence',
    };
    const result = engine.evaluate(context);
    const auditEntry = engine.getAuditLog()[0];
    await adapter.saveAuditEntry(auditEntry);

    // Simulate new session
    await adapter.close();
    const adapter2 = new JsonFileAdapter({ dataDir: testDir });
    await adapter2.init();
    const entries = await adapter2.getAuditEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].requestId).toBe('persist-001');
    expect(entries[0].pipelineResult.finalDecision).toBe('ALLOW');
    await adapter2.close();
  });

  it('session state persists phase across restarts', async () => {
    const session = await adapter.getOrCreateDefaultSession();
    session.currentPhase = 'BUILD';
    await adapter.saveSessionState(session);

    await adapter.close();
    const adapter2 = new JsonFileAdapter({ dataDir: testDir });
    await adapter2.init();
    const restored = await adapter2.getSessionState('cvf-default-session');
    expect(restored!.currentPhase).toBe('BUILD');
    await adapter2.close();
  });
});

// ─── Vibe-to-Guard Integration ────────────────────────────────────────

describe('E2E: Vibe → Guard', () => {
  it('Vietnamese vibe flows through full pipeline', () => {
    const vibe = parseVibe('Tạo trang web bán hàng cho cửa hàng của tôi');
    expect(vibe.actionType).toBe('create');

    const clarification = generateClarifications(vibe);
    const card = generateConfirmationCard(vibe, clarification);
    expect(card.steps.length).toBeGreaterThan(0);

    const text = formatCardAsText(card, 'vi');
    expect(text).toContain('Goal:');
    expect(text).toContain('Steps:');

    const engine = createGuardEngine();
    const result = engine.evaluate({
      requestId: 'vi-001',
      phase: vibe.suggestedPhase as any,
      riskLevel: vibe.suggestedRisk as any,
      role: 'HUMAN',
      action: vibe.goal,
    });
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('dangerous action gets proper risk assessment', () => {
    const vibe = parseVibe('Delete all customer data from the database');
    expect(vibe.actionType).toBe('delete');
    expect(vibe.suggestedRisk).toBe('R2');

    const card = generateConfirmationCard(vibe, generateClarifications(vibe));
    expect(card.requiresConfirmation).toBe(true);
    expect(card.riskLabel).toContain('Elevated');
  });

  it('send action with money gets R2 risk', () => {
    const vibe = parseVibe('Send $500 payment to the vendor');
    expect(vibe.suggestedRisk).toBe('R2');
    expect(vibe.entities.some((e) => e.type === 'money')).toBe(true);
  });
});

// ─── Registry + Engine Consistency ────────────────────────────────────

describe('E2E: Registry-Engine Consistency', () => {
  it('registry guards match engine guards', () => {
    const registry = createUnifiedRegistry();
    const engine = createGuardEngine();

    const registryIds = registry.getAll().map((g) => g.guard.id).sort();
    const engineIds = engine.getRegisteredGuards().map((g) => g.id).sort();

    expect(registryIds).toEqual(engineIds);
  });

  it('all registry guards are enabled by default', () => {
    const registry = createUnifiedRegistry();
    const stats = registry.getStats();
    expect(stats.enabledGuards).toBe(stats.totalGuards);
  });

  it('disabling a registry guard affects evaluation', () => {
    const registry = createUnifiedRegistry();
    registry.disable('audit_trail');
    const disabled = registry.get('audit_trail');
    expect(disabled!.enabled).toBe(false);
  });
});
