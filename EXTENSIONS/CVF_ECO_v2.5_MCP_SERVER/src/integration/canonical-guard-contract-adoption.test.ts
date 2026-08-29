/**
 * RFR-R7A Canonical MCP Guard Engine Adoption - regression proof.
 *
 * Proves two things about the live MCP production composition roots:
 *
 *  1. Static: none of the seven production (non-test) composition files
 *     import `createGuardEngine` / `GuardRuntimeEngine` from the stale
 *     package-local `src/guards/**` fork. The fork itself, and test files
 *     that intentionally exercise it directly, are out of scope for this
 *     assertion (the fork stays read-only in R7A).
 *
 *  2. Dynamic: the canonical `cvf-guard-contract` engine actually used by
 *     the live roots carries the immutable R1/R2 mandatory core -
 *     `ai_commit`, `authority_gate`, `phase_gate`, `build_authority` are
 *     registered; unregister/disable of any of them fails closed; a value
 *     returned by `getGuard`/`getRegisteredGuards` cannot be mutated to
 *     change engine identity, order, priority, enabled-state, or
 *     evaluation behavior; and a mutating BUILD action without complete
 *     `buildAuthority` evidence is still blocked (no permissive default).
 *
 * @module integration/canonical-guard-contract-adoption
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createGuardEngine, MANDATORY_GUARD_IDS } from 'cvf-guard-contract';
import type { GuardRequestContext } from 'cvf-guard-contract';

// Static: production composition roots must not import the local fork

const PRODUCTION_COMPOSITION_FILES = [
  '../index.ts',
  '../sdk.ts',
  '../cli/cli.ts',
  '../cli/governed-exec.ts',
  '../cli/governed-command-launcher.ts',
  '../tools/governance-action-preflight.ts',
  '../tools/model-gateway-execute.ts',
] as const;

// Matches an import/export statement whose module specifier is a local
// guards path (`./guards/...` or `../guards/...`) and whose named-binding
// list contains `createGuardEngine` or `GuardRuntimeEngine`. This is
// deliberately narrower than "any import from guards/*" so it does not
// flag the MCP-local UX constants (PHASE_ORDER, PHASE_DESCRIPTIONS, the
// non-mandatory local guard classes) that legitimately keep flowing from
// the package-local guards module - only the engine/factory identifiers
// crossing that boundary are forbidden in production composition roots.
const LOCAL_FORK_ENGINE_IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]\.{1,2}\/guards\/(?:index|engine)(?:\.js)?['"]/g;

function readProductionSource(relativePath: string): string {
  const sourcePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(sourcePath, 'utf-8');
}

function findLocalForkEngineBindings(source: string): string[] {
  const hits: string[] = [];
  for (const match of source.matchAll(LOCAL_FORK_ENGINE_IMPORT_PATTERN)) {
    const bindings = match[1];
    if (/\bcreateGuardEngine\b/.test(bindings) || /\bGuardRuntimeEngine\b/.test(bindings)) {
      hits.push(match[0]);
    }
  }
  return hits;
}

describe('canonical MCP guard engine adoption - static production import guard', () => {
  it.each(PRODUCTION_COMPOSITION_FILES)(
    '%s does not import createGuardEngine/GuardRuntimeEngine from the local guards fork',
    (relativePath) => {
      const source = readProductionSource(relativePath);
      expect(findLocalForkEngineBindings(source)).toEqual([]);
    }
  );

  it('src/index.ts imports the guard engine/factory from cvf-guard-contract', () => {
    const source = readProductionSource('../index.ts');
    expect(source).toContain("from 'cvf-guard-contract'");
    expect(source).toMatch(/import\s*\{[^}]*createGuardEngine[^}]*\}\s*from\s*'cvf-guard-contract'/);
  });

  it('src/sdk.ts re-exports the guard engine/factory from cvf-guard-contract', () => {
    const source = readProductionSource('../sdk.ts');
    expect(source).toMatch(/export\s*\{[^}]*GuardRuntimeEngine[^}]*createGuardEngine[^}]*\}\s*from\s*'cvf-guard-contract'/s);
  });

  it('src/cli/cli.ts and src/cli/governed-exec.ts import createGuardEngine from cvf-guard-contract', () => {
    for (const relativePath of ['../cli/cli.ts', '../cli/governed-exec.ts'] as const) {
      const source = readProductionSource(relativePath);
      expect(source).toContain("from 'cvf-guard-contract'");
      expect(source).toMatch(/import\s*\{[^}]*createGuardEngine[^}]*\}\s*from\s*'cvf-guard-contract'/);
    }
  });

  it('governed-command-launcher, governance-action-preflight, and model-gateway-execute type-import GuardRuntimeEngine from cvf-guard-contract', () => {
    for (const relativePath of [
      '../cli/governed-command-launcher.ts',
      '../tools/governance-action-preflight.ts',
      '../tools/model-gateway-execute.ts',
    ] as const) {
      const source = readProductionSource(relativePath);
      expect(source).toMatch(/import\s+type\s*\{[^}]*GuardRuntimeEngine[^}]*\}\s*from\s*'cvf-guard-contract'/);
    }
  });

  it('MCP/CLI session-phase compatibility remains owner-local state, not an engine method call', () => {
    const indexSource = readProductionSource('../index.ts');
    const cliSource = readProductionSource('../cli/cli.ts');
    for (const source of [indexSource, cliSource]) {
      expect(source).not.toContain('engine.getSessionPhase');
      expect(source).not.toContain('engine.setSessionPhase');
    }
    expect(indexSource).toContain('getMcpSessionPhase');
    expect(indexSource).toContain('setMcpSessionPhase');
    expect(cliSource).toContain('getCliSessionPhase');
    expect(cliSource).toContain('setCliSessionPhase');
  });
});

// Dynamic: canonical mandatory core proof at the live composition root

function makeContext(overrides: Partial<GuardRequestContext> = {}): GuardRequestContext {
  return {
    requestId: `r7a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    phase: 'BUILD',
    riskLevel: 'R0',
    role: 'HUMAN',
    action: 'read status',
    ...overrides,
  };
}

describe('canonical MCP guard engine adoption - mandatory core admission proof', () => {
  it('MANDATORY_GUARD_IDS includes the R1/R2 mandatory core', () => {
    expect(Array.from(MANDATORY_GUARD_IDS)).toEqual(
      expect.arrayContaining(['ai_commit', 'authority_gate', 'phase_gate', 'build_authority'])
    );
  });

  it('the live composition-root engine registers all four mandatory guard IDs', () => {
    const engine = createGuardEngine();
    const ids = engine.getRegisteredGuards().map((g) => g.id);
    for (const mandatoryId of MANDATORY_GUARD_IDS) {
      expect(ids).toContain(mandatoryId);
    }
  });

  it.each(Array.from(MANDATORY_GUARD_IDS))(
    'unregisterGuard("%s") throws and the guard remains registered',
    (guardId) => {
      const engine = createGuardEngine();
      expect(() => engine.unregisterGuard(guardId)).toThrow();
      expect(engine.getGuard(guardId)).toBeDefined();
    }
  );

  it.each(Array.from(MANDATORY_GUARD_IDS))(
    'disableGuard("%s") throws and the guard remains enabled',
    (guardId) => {
      const engine = createGuardEngine();
      expect(() => engine.disableGuard(guardId)).toThrow();
      expect(engine.getGuard(guardId)?.enabled).toBe(true);
    }
  );

  it('mutating the object returned by getGuard cannot affect engine identity, priority, or enabled-state', () => {
    const engine = createGuardEngine();
    const before = engine.getGuard('phase_gate');
    expect(before).toBeDefined();
    const originalPriority = before!.priority;
    const originalName = before!.name;

    expect(() => {
      (before as unknown as { priority: number }).priority = -9999;
    }).toThrow();
    expect(() => {
      (before as unknown as { name: string }).name = 'tampered';
    }).toThrow();
    expect(() => {
      (before as unknown as { enabled: boolean }).enabled = false;
    }).toThrow();

    const after = engine.getGuard('phase_gate');
    expect(after!.priority).toBe(originalPriority);
    expect(after!.name).toBe(originalName);
    expect(after!.enabled).toBe(true);

    // Even if the returned view were mutable, engine evaluation order/behavior
    // must not be affected because the engine holds its own snapshot.
    const result = engine.evaluate(makeContext({ role: 'AI_AGENT', phase: 'DISCOVERY', action: 'read' }));
    const phaseResult = result.results.find((r) => r.guardId === 'phase_gate');
    expect(phaseResult).toBeDefined();
  });

  it('mutating the array or entries returned by getRegisteredGuards cannot affect engine order or count', () => {
    const engine = createGuardEngine();
    const before = engine.getRegisteredGuards();
    const originalCount = before.length;
    const originalOrder = before.map((g) => g.id);

    // Attempt to corrupt the returned array and its frozen entries.
    before.push(before[0]);
    before.reverse();
    for (const guard of before) {
      try {
        (guard as unknown as { enabled: boolean }).enabled = false;
      } catch {
        // Frozen views may throw in strict mode; either way, no effect below.
      }
    }

    const after = engine.getRegisteredGuards();
    expect(after.length).toBe(originalCount);
    expect(after.map((g) => g.id)).toEqual(originalOrder);
    expect(after.every((g) => g.enabled)).toBe(true);
  });

  it('mutating a guard\'s evaluate function reference on a returned view cannot change evaluation behavior', () => {
    const engine = createGuardEngine();
    const view = engine.getGuard('ai_commit');
    expect(view).toBeDefined();

    try {
      (view as unknown as { evaluate: unknown }).evaluate = () => {
        throw new Error('tampered evaluate should never run');
      };
    } catch {
      // Frozen views may throw; either outcome is acceptable as long as the
      // engine's own evaluation is unaffected, checked below.
    }

    const result = engine.evaluate(makeContext({ action: 'read status' }));
    const aiCommitResult = result.results.find((r) => r.guardId === 'ai_commit');
    expect(aiCommitResult).toBeDefined();
    expect(aiCommitResult!.decision).toBe('ALLOW');
  });

  it('a mutating BUILD action without buildAuthority evidence is blocked, with no permissive default', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(
      makeContext({
        phase: 'BUILD',
        role: 'HUMAN',
        action: 'modify the configuration file',
        metadata: {
          ai_commit: { commitId: 'r7a-proof-1', agentId: 'r7a-proof-agent', timestamp: Date.now() },
        },
        targetFiles: ['src/feature/widget.ts'],
      })
    );
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('build_authority');
  });

  it('a mutating BUILD action with complete buildAuthority evidence in scope is allowed', () => {
    const engine = createGuardEngine();
    const context: GuardRequestContext = {
      ...makeContext({
        phase: 'BUILD',
        role: 'HUMAN',
        action: 'modify the configuration file',
        targetFiles: ['src/feature/widget.ts'],
        metadata: {
          ai_commit: { commitId: 'r7a-proof-2', agentId: 'r7a-proof-agent', timestamp: Date.now() },
        },
      }),
      buildAuthority: {
        specStatus: 'ACCEPTED',
        acceptedSpecRef: 'docs/specs/r7a-proof-spec.md',
        workOrderStatus: 'VALID',
        workOrderRef: 'docs/work_orders/r7a-proof-work-order.md',
        revoked: false,
        allowedScope: ['src/feature'],
      },
    } as GuardRequestContext;
    const result = engine.evaluate(context);
    expect(result.finalDecision).toBe('ALLOW');
  });

  it('a modifying action without ai_commit metadata is blocked by the mandatory ai_commit guard', () => {
    const engine = createGuardEngine();
    const result = engine.evaluate(
      makeContext({ phase: 'BUILD', role: 'HUMAN', action: 'modify the configuration file' })
    );
    expect(result.finalDecision).toBe('BLOCK');
    expect(result.blockedBy).toBe('ai_commit');
  });
});
