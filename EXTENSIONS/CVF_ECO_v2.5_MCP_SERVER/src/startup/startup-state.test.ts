import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildStartupAcknowledgment,
  checkGovernanceAction,
  getActiveHandoff,
  getGovernanceRules,
  getSessionMemory,
  getSessionState,
  redactSensitiveText,
  resolveCvfRepo,
} from './startup-state.js';

function createFixtureRepo(): string {
  const repo = mkdtempSync(path.join(tmpdir(), 'cvf-mcp-startup-'));
  mkdirSync(path.join(repo, 'CVF_SESSION'), { recursive: true });
  mkdirSync(path.join(repo, 'docs', 'reference'), { recursive: true });
  mkdirSync(path.join(repo, 'docs', 'reviews'), { recursive: true });
  writeFileSync(path.join(repo, 'CVF_SESSION_MEMORY.md'), 'Mode marker: `demo_mode`\nAPI_KEY=super-secret\n');
  writeFileSync(path.join(repo, 'AGENT_HANDOFF_V13_2026-05-25.md'), '# Handoff\nStatus: ACTIVE\n');
  writeFileSync(
    path.join(repo, 'CVF_SESSION', 'ACTIVE_SESSION_STATE.json'),
    JSON.stringify({
      currentMode: 'demo_mode',
      activeHandoff: 'AGENT_HANDOFF_V13_2026-05-25.md',
      nextAllowedMove: 'Continue. Parked checkpoint remains sample checkpoint.',
    }),
  );
  writeFileSync(
    path.join(repo, 'docs', 'reference', 'CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md'),
    '# Live\nMemory class: REFERENCE_RECORD\nStatus: TEST\n## Purpose\nDemo\n## Scope\nDemo\n## Claim Boundary\nDemo\n',
  );
  writeFileSync(
    path.join(repo, 'docs', 'reference', 'CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md'),
    '# Blindspot\nMemory class: REFERENCE_RECORD\nStatus: TEST\n## Purpose\nDemo\n## Scope\nDemo\n## Claim Boundary\nDemo\n',
  );
  writeFileSync(
    path.join(repo, 'docs', 'reviews', 'CVF_F1_DIMINISHING_RETURNS_STOP_RULE_2026-05-15.md'),
    '# F1\nMemory class: FULL_RECORD\nStatus: TEST\n## Purpose\nDemo\n## Scope\nDemo\n## Claim Boundary\nDemo\n',
  );
  return repo;
}

describe('startup-state', () => {
  it('resolves the CVF repo and reads redacted session memory', () => {
    const repo = createFixtureRepo();
    const nested = path.join(repo, 'a', 'b');
    mkdirSync(nested, { recursive: true });

    expect(resolveCvfRepo(nested).repoRoot).toBe(repo);

    const memory = getSessionMemory(1000, nested);
    expect(memory.exists).toBe(true);
    expect(memory.content).toContain('demo_mode');
    expect(memory.content).toContain('API_KEY=<redacted>');
    expect(memory.content).not.toContain('super-secret');
  });

  it('builds startup acknowledgment from active state', () => {
    const repo = createFixtureRepo();

    const ack = buildStartupAcknowledgment(repo);
    expect(ack.currentMode).toBe('demo_mode');
    expect(ack.activeHandoff).toBe('AGENT_HANDOFF_V13_2026-05-25.md');
    expect(ack.parkedCheckpoint).toBe('sample checkpoint.');
    expect(ack.acknowledgment).toContain('Startup acknowledged: current mode=demo_mode');
  });

  it('reads active handoff and state', () => {
    const repo = createFixtureRepo();

    expect(getActiveHandoff(1000, repo).content).toContain('Status: ACTIVE');
    expect(getSessionState(1000, repo).content).toContain('demo_mode');
  });

  it('does not fall back to a stale handoff when active state is missing activeHandoff', () => {
    const repo = createFixtureRepo();
    writeFileSync(
      path.join(repo, 'CVF_SESSION', 'ACTIVE_SESSION_STATE.json'),
      JSON.stringify({
        currentMode: 'demo_mode',
        nextAllowedMove: 'Continue.',
      }),
    );

    const handoff = getActiveHandoff(1000, repo);
    expect(handoff.exists).toBe(false);
    expect(handoff.path).toBe('<unresolved-active-handoff>');
    expect(handoff.content).toContain('does not define a valid activeHandoff');
  });

  it('returns governance rules by topic', () => {
    const repo = createFixtureRepo();

    const rules = getGovernanceRules('live', 1000, repo);
    expect(rules.topic).toBe('live_run');
    expect(rules.files.some((file) => file.path.includes('LIVE_RUN'))).toBe(true);
  });

  it('classifies governance actions', () => {
    expect(checkGovernanceAction('run live provider proof').requiredRules).toContain('mandatory_live_run_diagnostics');
    expect(checkGovernanceAction('absorb MCP memory work').requiredRules).toContain('knowledge_absorption_blindspot_control_block');
    expect(checkGovernanceAction('continue F-1 prompt tuning').decision).toBe('BLOCK');
  });

  it('redacts common secret patterns', () => {
    const redacted = redactSensitiveText('DEEPSEEK_API_KEY=abc123\nopenai sk-1234567890abcdef');
    expect(redacted).toContain('DEEPSEEK_API_KEY=<redacted>');
    expect(redacted).not.toContain('abc123');
    expect(redacted).not.toContain('sk-1234567890abcdef');
  });
});
