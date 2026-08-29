/**
 * End-to-End Integration Tests — M6.2
 *
 * Tests the full CVF pipeline: Vibe → Parse → Clarify → Guard → Execute → Audit
 * Simulates real user workflows from input to governed output.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGuardEngine } from 'cvf-guard-contract';
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

    // Step 4: Guard evaluation. Phase is BUILD rather than the vibe
    // parser's suggested DESIGN: the canonical authority matrix authorizes
    // HUMAN 'create' actions in BUILD, not DESIGN (DESIGN is
    // analyze/approve-only), so this exercises the real ALLOW path a
    // create request takes once guard-gated. ai_commit and buildAuthority
    // evidence are required because "create" is a canonical mandatory
    // ai_commit/build_authority modify-intent token; see the
    // canonical-guard-contract adoption regression test for the
    // fail-closed proof when either is absent.
    const context: GuardRequestContext & { buildAuthority?: unknown } = {
      requestId: 'e2e-001',
      phase: 'BUILD',
      riskLevel: vibe.suggestedRisk as any,
      role: 'HUMAN',
      action: 'create landing page',
      targetFiles: ['src/pages/landing.tsx'],
      metadata: {
        ai_commit: { commitId: 'e2e-001-commit', agentId: 'e2e-suite', timestamp: Date.now() },
      },
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/e2e-001-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/e2e-001-work-order.md',
        revoked: false,
        allowedScope: ['src/pages'],
      },
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
    // "write" is a canonical mandatory ai_commit/build_authority
    // modify-intent token, so this real-code-authoring scenario supplies
    // genuine ai_commit and buildAuthority provenance rather than relying
    // on a permissive default.
    const context: GuardRequestContext & { buildAuthority?: unknown } = {
      requestId: 'e2e-003',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'write component code',
      mutationCount: 3,
      targetFiles: ['src/components/widget.tsx'],
      metadata: {
        ai_commit: { commitId: 'e2e-003-commit', agentId: 'cascade-agent', timestamp: Date.now() },
      },
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/e2e-003-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/e2e-003-work-order.md',
        revoked: false,
        allowedScope: ['src/components'],
      },
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
    // This test proves mutation_budget specifically blocks, so the action,
    // ai_commit provenance, and buildAuthority evidence below satisfy every
    // earlier-priority canonical mandatory guard (ai_commit, phase_gate,
    // risk_gate, authority_gate, build_authority) so evaluation actually
    // reaches mutation_budget rather than being blocked earlier.
    const context: GuardRequestContext & { buildAuthority?: unknown } = {
      requestId: 'e2e-005',
      phase: 'BUILD',
      riskLevel: 'R2',
      role: 'HUMAN',
      action: 'modify: bulk edit files',
      mutationCount: 15,
      traceHash: 'abc123',
      targetFiles: ['src/feature/bulk-edit-target.ts'],
      metadata: {
        ai_commit: { commitId: 'e2e-005-commit', agentId: 'e2e-suite', timestamp: Date.now() },
      },
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/e2e-005-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/e2e-005-work-order.md',
        revoked: false,
        allowedScope: ['src/feature'],
      },
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('mutation_budget');
  });

  it('protected governance file blocks AI modification', () => {
    // This test proves a protected-path write is blocked, so ai_commit and
    // build_authority (both earlier-priority mandatory guards) are
    // satisfied with real evidence - including a buildAuthority WORK
    // ORDER that legitimately declares "governance" in its own
    // allowedScope - precisely so evaluation reaches the canonical
    // engine's independent, non-overridable protected-path rules rather
    // than being blocked earlier for an unrelated reason. The canonical
    // engine protects "governance/" via two independent guards:
    // file_scope (priority 35) blocks first here for AI_AGENT (a
    // BUILDER_CLASS_ROLE) writing into a protected path; scope_guard
    // (priority 50) is a second, later-priority protected-path guard that
    // would also block if file_scope somehow did not. Neither has an
    // authorization escape hatch: even a WORK ORDER that names this path
    // in scope is still blocked.
    const context: GuardRequestContext & { buildAuthority?: unknown } = {
      requestId: 'e2e-006',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'AI_AGENT',
      agentId: 'cascade-agent',
      action: 'modify governance rules',
      targetFiles: ['governance/guard_runtime/guard.runtime.engine.ts'],
      metadata: {
        ai_commit: { commitId: 'e2e-006-commit', agentId: 'cascade-agent', timestamp: Date.now() },
      },
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/e2e-006-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/e2e-006-work-order.md',
        revoked: false,
        allowedScope: ['governance'],
      },
    };
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('file_scope');
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
    // Non-modifying wording: the CLI's evaluate command has no flag to
    // supply ai_commit provenance, and the canonical mandatory ai_commit
    // guard fails closed on a modifying action without it (proven
    // separately by the canonical-guard-contract adoption regression
    // test). This test's purpose is general pipeline plumbing.
    const result = runCli([
      'evaluate', '--phase', 'BUILD', '--risk', 'R0', '--role', 'HUMAN', '--action', 'read code',
    ]);
    expect(result.success).toBe(true);
    expect((result.output as any).finalDecision).toBe('ALLOW');
    expect((result.output as any).guardCount).toBe(9);
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
    expect((result.output as any).guardCount).toBe(9);
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
    // "read" satisfies the canonical authority_gate allow-list match for
    // HUMAN in BUILD; this test's purpose is proving audit persistence,
    // not authority semantics.
    const engine = createGuardEngine();
    const context: GuardRequestContext = {
      requestId: 'persist-001',
      phase: 'BUILD',
      riskLevel: 'R0',
      role: 'HUMAN',
      action: 'read persistence test',
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

    // Guard evaluation uses phase: 'BUILD' and an English "create" prefix
    // rather than the raw Vietnamese goal text or vibe.suggestedPhase
    // ('DESIGN'): the canonical authority_gate allow-list matches against
    // an English action-verb vocabulary and does not recognize Vietnamese
    // text, and DESIGN does not authorize HUMAN 'create' actions at all
    // (see the 'safe create request' test above for the same reasoning).
    // ai_commit and buildAuthority evidence are supplied because "create"
    // is a canonical mandatory ai_commit/build_authority modify-intent
    // token.
    const engine = createGuardEngine();
    const result = engine.evaluate({
      requestId: 'vi-001',
      phase: 'BUILD',
      riskLevel: vibe.suggestedRisk as any,
      role: 'HUMAN',
      action: `create: ${vibe.goal}`,
      targetFiles: ['src/pages/vi-landing.tsx'],
      metadata: {
        ai_commit: { commitId: 'vi-001-commit', agentId: 'e2e-suite', timestamp: Date.now() },
      },
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/vi-001-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/vi-001-work-order.md',
        revoked: false,
        allowedScope: ['src/pages'],
      },
    } as GuardRequestContext);
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
  it('every registry guard ID is also present in the canonical engine', () => {
    // createUnifiedRegistry (MCP-local skill-to-guard mapping, out of R7A
    // scope) and createGuardEngine (now the canonical cvf-guard-contract
    // factory) are no longer sourced from the same local fork, so an exact
    // set-equality is not the right invariant any more: the canonical
    // engine additionally carries ai_commit, build_authority, and
    // file_scope, which the local registry does not track. What remains
    // true, and worth proving, is that every guard the registry maps to a
    // skill is still a real, registered guard on the live canonical
    // engine - i.e. the registry never references a stale/unknown ID.
    const registry = createUnifiedRegistry();
    const engine = createGuardEngine();

    const registryIds = registry.getAll().map((g) => g.guard.id).sort();
    const engineIds = new Set(engine.getRegisteredGuards().map((g) => g.id));

    for (const id of registryIds) {
      expect(engineIds.has(id)).toBe(true);
    }
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
