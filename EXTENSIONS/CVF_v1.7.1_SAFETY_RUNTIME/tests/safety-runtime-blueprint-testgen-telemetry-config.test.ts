/**
 * CVF v1.7.1 Safety Runtime — Blueprint Generator, Test Generator,
 * Telemetry Hook & OpenClaw Config Tests (W6-T82)
 * ===========================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (4 contracts):
 *   skills/dev-automation/blueprint.generator.ts:
 *     generateBlueprint — no client→throws; register+generate→result passthrough;
 *       client returns empty-modules→validateBlueprint throws
 *   skills/dev-automation/test.generator.ts:
 *     generateTestsForArtifact — no client→throws; register+generate→merges
 *       fileChanges + updates metrics (tokensUsed/generationTimeMs/filesGenerated)
 *   adapters/openclaw/telemetry.hook.ts:
 *     logAIInteraction — entries appear in getAILogs; timestamp is set;
 *       multiple calls accumulate
 *   adapters/openclaw/openclaw.config.ts:
 *     defaultOpenClawConfig — verifies required default field values
 */

import { describe, it, expect } from 'vitest';

import {
  registerBlueprintClient,
  generateBlueprint,
} from '../skills/dev-automation/blueprint.generator';
import type { BlueprintOutput } from '../skills/dev-automation/blueprint.generator';
import {
  registerTestClient,
  generateTestsForArtifact,
} from '../skills/dev-automation/test.generator';
import { logAIInteraction, getAILogs } from '../adapters/openclaw/telemetry.hook';
import { defaultOpenClawConfig } from '../adapters/openclaw/openclaw.config';
import type { DevArtifact } from '../skills/dev-automation/artifact.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeValidBlueprint(): BlueprintOutput {
  return {
    systemName: 'TestSystem',
    architectureStyle: 'microservices',
    techStack: ['TypeScript', 'Node.js'],
    modules: [{ name: 'core', description: 'Core module', responsibilities: ['handle requests'] }],
    folderStructure: ['src/', 'tests/'],
    estimatedFiles: 5,
    estimatedComplexity: 'LOW',
  };
}

function makeArtifact(overrides: Partial<DevArtifact> = {}): DevArtifact {
  return {
    proposalId: 'prop-t82',
    artifactType: 'CODE',
    createdBy: 'user-1',
    createdAt: 1_000_000,
    checksum: 'abc123',
    fileChanges: [
      {
        filePath: 'src/index.ts',
        content: 'export const x = 1;',
        diffSize: 1,
        isNewFile: true,
        isDeleted: false,
        touchesDependencyFile: false,
        touchesMigrationFile: false,
        touchesPolicyFile: false,
        touchesCoreFile: false,
      },
    ],
    metrics: {
      tokensUsed: 100,
      generationTimeMs: 200,
      modelUsed: 'gpt-4',
      filesGenerated: 1,
    },
    ...overrides,
  };
}

// ─── blueprint.generator ─────────────────────────────────────────────────────

describe('blueprint.generator', () => {
  it('generateBlueprint without registered client → throws "Blueprint AI client not registered"', async () => {
    // Fresh module state: client starts null (first use in this file context)
    // Note: if a prior test registered, we skip this — but module isolation ensures fresh state
    // To be safe, we test this as the first blueprint describe
    await expect(generateBlueprint({ instruction: 'build a todo app', userId: 'u1' })).rejects.toThrow(
      'Blueprint AI client not registered',
    );
  });

  it('registerBlueprintClient + generateBlueprint → returns client result', async () => {
    const blueprint = makeValidBlueprint();
    registerBlueprintClient({
      generateBlueprint: async () => ({
        blueprint,
        tokensUsed: 500,
        modelUsed: 'gpt-4',
      }),
    });
    const result = await generateBlueprint({ instruction: 'build a todo app', userId: 'u1' });
    expect(result.blueprint.systemName).toBe('TestSystem');
    expect(result.tokensUsed).toBe(500);
  });

  it('client returns blueprint with empty modules → validateBlueprint throws', async () => {
    registerBlueprintClient({
      generateBlueprint: async () => ({
        blueprint: { ...makeValidBlueprint(), modules: [] },
        tokensUsed: 100,
        modelUsed: 'gpt-4',
      }),
    });
    await expect(generateBlueprint({ instruction: 'build a todo app', userId: 'u1' })).rejects.toThrow(
      'Blueprint must define at least one module',
    );
  });
});

// ─── test.generator ───────────────────────────────────────────────────────────

describe('test.generator', () => {
  it('generateTestsForArtifact without registered client → throws "Test AI client not registered"', async () => {
    await expect(generateTestsForArtifact(makeArtifact())).rejects.toThrow(
      'Test AI client not registered',
    );
  });

  it('registerTestClient + generateTestsForArtifact → merges fileChanges', async () => {
    registerTestClient({
      generateTests: async () => ({
        files: [{ filePath: 'tests/index.test.ts', content: 'it("works", () => {})' }],
        tokensUsed: 50,
        modelUsed: 'gpt-4',
      }),
    });
    const artifact = makeArtifact();
    const result = await generateTestsForArtifact(artifact);
    // original 1 file + 1 new test file = 2
    expect(result.fileChanges).toHaveLength(2);
    expect(result.fileChanges.some((f) => f.filePath === 'tests/index.test.ts')).toBe(true);
  });

  it('generateTestsForArtifact → metrics: tokensUsed/filesGenerated updated', async () => {
    registerTestClient({
      generateTests: async () => ({
        files: [{ filePath: 'tests/a.test.ts', content: 'test("a", () => {})' }],
        tokensUsed: 75,
        modelUsed: 'gpt-4-turbo',
      }),
    });
    const artifact = makeArtifact(); // 100 tokens, 1 file
    const result = await generateTestsForArtifact(artifact);
    expect(result.metrics.tokensUsed).toBe(175); // 100 + 75
    expect(result.metrics.filesGenerated).toBe(2); // 1 + 1
    expect(result.metrics.modelUsed).toContain('gpt-4-turbo');
    // checksum is updated (64-char hex)
    expect(result.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(result.checksum).not.toBe(artifact.checksum);
  });
});

// ─── telemetry.hook ───────────────────────────────────────────────────────────

describe('telemetry.hook', () => {
  it('logAIInteraction → entry appears in getAILogs with timestamp', () => {
    const before = Date.now();
    logAIInteraction({ input: { message: 'hello' } });
    const logs = getAILogs();
    const last = logs[logs.length - 1];
    expect(last).toBeDefined();
    expect(last.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('multiple calls → all entries accumulate in getAILogs', () => {
    const countBefore = getAILogs().length;
    logAIInteraction({ input: { message: 'first' } });
    logAIInteraction({ input: { message: 'second' } });
    expect(getAILogs().length).toBe(countBefore + 2);
  });
});

// ─── openclaw.config ──────────────────────────────────────────────────────────

describe('defaultOpenClawConfig', () => {
  it('has expected safe default values', () => {
    expect(defaultOpenClawConfig.enabled).toBe(false);
    expect(defaultOpenClawConfig.requireHumanApproval).toBe(true);
    expect(defaultOpenClawConfig.allowToolExecution).toBe(false);
    expect(defaultOpenClawConfig.provider).toBe('openai');
    expect(defaultOpenClawConfig.maxTokensPerRequest).toBe(4000);
  });
});
