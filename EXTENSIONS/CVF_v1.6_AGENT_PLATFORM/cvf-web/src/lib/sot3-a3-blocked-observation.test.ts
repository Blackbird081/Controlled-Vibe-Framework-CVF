import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  BLOCKED_DIAGNOSTIC,
  buildBlockedObservation,
  projectSot3A3ProviderDiagnostic,
  runSot3A3FailureBoundary,
  writeObservationAtomic,
  type Sot3A3LiveObservation,
} from './sot3-a3-blocked-observation';

// Zero network/provider calls anywhere in this file. `buildBlockedObservation`
// and `writeObservationAtomic` are plain functions with no permit gate, no
// fetch, and no process spawn -- this is a direct, non-live unit test of the
// SOT3-ACT-A3/A4 failure-path persistence logic, run through the normal
// vitest collection (no --mode live needed, since this file is not itself a
// `.live.test.ts` file and is never gated by the runner permit).

describe('buildBlockedObservation', () => {
  it('marks overall BLOCKED and success false', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: 'DASHSCOPE_API_KEY',
      httpStatus: null,
      latencyMs: null,
      observedCallCount: 0,
    });
    expect(observation.overall).toBe('BLOCKED');
    expect(observation.success).toBe(false);
  });

  it('preserves provider, model, and observedCallCount exactly', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: 'DASHSCOPE_API_KEY',
      httpStatus: 500,
      latencyMs: 3200,
      observedCallCount: 1,
    });
    expect(observation.provider).toBe('alibaba');
    expect(observation.model).toBe('qwen-flash');
    expect(observation.observedCallCount).toBe(1);
    expect(observation.httpStatus).toBe(500);
    expect(observation.latencyMs).toBe(3200);
  });

  it('preserves observedCallCount of exactly 0 (not coerced to falsy-missing)', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: null,
      httpStatus: null,
      latencyMs: null,
      observedCallCount: 0,
    });
    expect(observation.observedCallCount).toBe(0);
    expect(observation.providerRequestObserved).toBe(false);
  });

  it('preserves observedCallCount of exactly 1 and sets providerRequestObserved true', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: null,
      httpStatus: null,
      latencyMs: null,
      observedCallCount: 1,
    });
    expect(observation.observedCallCount).toBe(1);
    expect(observation.providerRequestObserved).toBe(true);
  });

  it('uses the fixed BLOCKED_DIAGNOSTIC stage/class/retryable/userAction/safeMessage', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: null,
      httpStatus: null,
      latencyMs: null,
      observedCallCount: 0,
    });
    expect(observation.diagnostic?.stage).toBe(BLOCKED_DIAGNOSTIC.stage);
    expect(observation.diagnostic?.class).toBe(BLOCKED_DIAGNOSTIC.class);
    expect(observation.diagnostic?.retryable).toBe(BLOCKED_DIAGNOSTIC.retryable);
    expect(observation.diagnostic?.userAction).toBe(BLOCKED_DIAGNOSTIC.userAction);
    expect(observation.diagnostic?.safeMessage).toBe(BLOCKED_DIAGNOSTIC.safeMessage);
  });

  it('includes optional httpStatus/latencyMs on the diagnostic sub-object only when non-null', () => {
    const withValues = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: 503, latencyMs: 4200, observedCallCount: 1,
    });
    expect(withValues.diagnostic?.httpStatus).toBe(503);
    expect(withValues.diagnostic?.latencyMs).toBe(4200);

    const withoutValues = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 0,
    });
    expect(withoutValues.diagnostic).not.toHaveProperty('httpStatus');
    expect(withoutValues.diagnostic).not.toHaveProperty('latencyMs');
  });

  it('never includes a raw response body, prompt, key, header, or bearer value regardless of input', () => {
    // Even if a caller somehow passed attacker-controlled strings through
    // provider/model/keyAliasUsed, the function only copies those exact
    // fields through -- it has no code path that reads or forwards a
    // response body, prompt, header object, or bearer token, because it
    // never receives one as a parameter at all.
    const observation = buildBlockedObservation({
      provider: 'alibaba',
      model: 'qwen-flash',
      keyAliasUsed: 'DASHSCOPE_API_KEY',
      httpStatus: 401,
      latencyMs: 100,
      observedCallCount: 1,
    });
    const serialized = JSON.stringify(observation);
    expect(serialized).not.toContain('Bearer');
    expect(serialized).not.toContain('Authorization');
    expect(observation.rawKeyPersisted).toBe(false);
    expect(observation.rawProviderBodyPersisted).toBe(false);
    expect(observation.rawOutputPersisted).toBe(false);
    expect(observation.fullPromptPersisted).toBe(false);
  });

  it('always sets the four secret-safety flags to false', () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 0,
    });
    expect(observation.rawKeyPersisted).toBe(false);
    expect(observation.rawProviderBodyPersisted).toBe(false);
    expect(observation.rawOutputPersisted).toBe(false);
    expect(observation.fullPromptPersisted).toBe(false);
  });
});

describe('projectSot3A3ProviderDiagnostic', () => {
  it('rebuilds an allowed provider class with canonical secret-safe fields', () => {
    const projected = projectSot3A3ProviderDiagnostic({
      class: 'provider_timeout',
      safeMessage: 'Bearer marker-must-not-survive',
      userAction: 'attacker-action',
      latencyMs: 60_001,
    });
    expect(projected).toEqual({
      stage: 'provider',
      class: 'provider_timeout',
      retryable: true,
      userAction: 'wait_and_retry',
      safeMessage: 'The provider call exceeded the configured timeout.',
      provider: 'alibaba',
      model: 'qwen-flash',
      latencyMs: 60_001,
    });
    expect(JSON.stringify(projected)).not.toContain('marker-must-not-survive');
    expect(JSON.stringify(projected)).not.toContain('attacker-action');
  });

  it('rejects an unrecognized diagnostic class', () => {
    expect(projectSot3A3ProviderDiagnostic({ class: 'arbitrary-secret-class' })).toBeNull();
  });

  it('lets buildBlockedObservation persist the canonical projected class', () => {
    const diagnostic = projectSot3A3ProviderDiagnostic({ class: 'network_error' });
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 1, diagnostic,
    });
    expect(observation.diagnostic?.class).toBe('network_error');
    expect(observation.diagnostic?.safeMessage).toBe('A network error interrupted execution.');
  });

  it('adds direct fetch status and latency when the route diagnostic omits them', () => {
    const diagnostic = projectSot3A3ProviderDiagnostic({
      class: 'provider_http_error',
      safeMessage: 'untrusted provider body must not survive',
    });
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: 'DASHSCOPE_API_KEY',
      httpStatus: 403, latencyMs: 17, observedCallCount: 1, diagnostic,
    });

    expect(observation.diagnostic).toMatchObject({
      class: 'provider_http_error',
      httpStatus: 403,
      latencyMs: 17,
    });
    expect(JSON.stringify(observation)).not.toContain('untrusted provider body');
  });
});

describe('writeObservationAtomic', () => {
  let tempDir: string;
  let observationPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cvf-sot3-a3-blocked-obs-'));
    observationPath = join(tempDir, 'observation.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes valid JSON readable back with the exact observation shape', async () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: 'DASHSCOPE_API_KEY',
      httpStatus: 500, latencyMs: 1000, observedCallCount: 1,
    });
    await writeObservationAtomic(observationPath, observation);
    const reloaded = JSON.parse(readFileSync(observationPath, 'utf8')) as Sot3A3LiveObservation;
    expect(reloaded).toEqual(observation);
  });

  it('leaves no leftover .tmp file after a successful write', async () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 0,
    });
    await writeObservationAtomic(observationPath, observation);
    const entries = readdirSync(tempDir);
    expect(entries).toEqual(['observation.json']);
  });

  it('replaces an existing observation file atomically (later write wins, no partial content)', async () => {
    const first = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 0,
    });
    const second = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 1,
    });
    await writeObservationAtomic(observationPath, first);
    await writeObservationAtomic(observationPath, second);
    const reloaded = JSON.parse(readFileSync(observationPath, 'utf8')) as Sot3A3LiveObservation;
    expect(reloaded.observedCallCount).toBe(1);
  });

  it('does not throw when the target directory does not exist (swallows the error rather than masking the original test failure)', async () => {
    const observation = buildBlockedObservation({
      provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
      httpStatus: null, latencyMs: null, observedCallCount: 0,
    });
    const missingDirPath = join(tempDir, 'does', 'not', 'exist', 'observation.json');
    await expect(writeObservationAtomic(missingDirPath, observation)).resolves.toBeUndefined();
    expect(existsSync(missingDirPath)).toBe(false);
  });
});

describe('runSot3A3FailureBoundary (the exact production executor)', () => {
  /**
   * These tests call `runSot3A3FailureBoundary` directly -- the SAME
   * function `route.sot3-activation.alibaba.live.test.ts` calls in
   * production, not a parallel simulation of its logic. This is the
   * production-bound regression guard the rework requires: if a future
   * edit removes the catch-side persistence from `runSot3A3FailureBoundary`
   * itself, or the live test file stops calling it, these tests fail --
   * a duplicated try/catch elsewhere in a test file could never catch
   * either kind of regression.
   */
  let tempDir: string;
  let observationPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cvf-sot3-a3-failure-boundary-'));
    observationPath = join(tempDir, 'observation.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('re-throws the original error from a throwing post-call operation', async () => {
    const thrown = new Error('simulated post-call assertion failure');
    await expect(
      runSot3A3FailureBoundary(
        async () => {
          throw thrown;
        },
        observationPath,
        () => ({
          provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
          httpStatus: null, latencyMs: null, observedCallCount: 1,
        }),
      ),
    ).rejects.toBe(thrown);
  });

  it('persists a BLOCKED observation when the operation throws after a provider call (observedCallCount=1)', async () => {
    await expect(
      runSot3A3FailureBoundary(
        async () => {
          throw new Error('post-call contract check failed');
        },
        observationPath,
        () => ({
          provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: 'DASHSCOPE_API_KEY',
          httpStatus: 200, latencyMs: 1500, observedCallCount: 1,
        }),
      ),
    ).rejects.toThrow('post-call contract check failed');

    expect(existsSync(observationPath)).toBe(true);
    const persisted = JSON.parse(readFileSync(observationPath, 'utf8')) as Sot3A3LiveObservation;
    expect(persisted.overall).toBe('BLOCKED');
    expect(persisted.observedCallCount).toBe(1);
    expect(persisted.diagnostic?.class).toBe(BLOCKED_DIAGNOSTIC.class);
  });

  it('does NOT persist an observation on the success path (PASS behavior unchanged)', async () => {
    const result = await runSot3A3FailureBoundary(
      async () => 'ok',
      observationPath,
      () => ({
        provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
        httpStatus: null, latencyMs: null, observedCallCount: 1,
      }),
    );
    expect(result).toBe('ok');
    expect(existsSync(observationPath)).toBe(false);
  });

  it('returns the operation result unchanged on success', async () => {
    const result = await runSot3A3FailureBoundary(
      async () => ({ some: 'value', n: 42 }),
      observationPath,
      () => ({
        provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
        httpStatus: null, latencyMs: null, observedCallCount: 1,
      }),
    );
    expect(result).toEqual({ some: 'value', n: 42 });
  });

  it('reads getBlockedObservationParams only at throw-time, reflecting counters mutated during the operation', async () => {
    let observedCallCount = 0;
    await expect(
      runSot3A3FailureBoundary(
        async () => {
          observedCallCount = 1; // simulates the fetch observer incrementing after the real call
          throw new Error('failed after the call was counted');
        },
        observationPath,
        () => ({
          provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
          httpStatus: null, latencyMs: null, observedCallCount,
        }),
      ),
    ).rejects.toThrow();

    const persisted = JSON.parse(readFileSync(observationPath, 'utf8')) as Sot3A3LiveObservation;
    expect(persisted.observedCallCount).toBe(1);
  });

  it('does nothing when observationPath is undefined (still re-throws)', async () => {
    await expect(
      runSot3A3FailureBoundary(
        async () => {
          throw new Error('no observation path configured');
        },
        undefined,
        () => ({
          provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
          httpStatus: null, latencyMs: null, observedCallCount: 0,
        }),
      ),
    ).rejects.toThrow('no observation path configured');
  });

  it('never calls a network/provider function itself: getBlockedObservationParams is invoked exactly once and only reads passed-in state', async () => {
    let paramsCallCount = 0;
    await expect(
      runSot3A3FailureBoundary(
        async () => {
          throw new Error('boom');
        },
        observationPath,
        () => {
          paramsCallCount += 1;
          return {
            provider: 'alibaba', model: 'qwen-flash', keyAliasUsed: null,
            httpStatus: null, latencyMs: null, observedCallCount: 0,
          };
        },
      ),
    ).rejects.toThrow();
    expect(paramsCallCount).toBe(1);
  });
});

describe('call-site guard: the real live test file uses runSot3A3FailureBoundary', () => {
  /**
   * Source-level guard proving production actually calls the shared
   * executor tested above -- not a divergent local implementation. Combined
   * with the behavioral tests above (which exercise the executor itself),
   * this closes the loop the rework requires: if a future edit either (a)
   * changes `runSot3A3FailureBoundary`'s behavior, or (b) stops the live
   * test file from calling it, one of these two test groups fails.
   */
  it('route.sot3-activation.alibaba.live.test.ts imports and calls runSot3A3FailureBoundary', () => {
    const liveTestPath = join(
      process.cwd(),
      'src/app/api/execute/route.sot3-activation.alibaba.live.test.ts',
    );
    const source = readFileSync(liveTestPath, 'utf8');
    expect(source).toContain('runSot3A3FailureBoundary,');
    expect(source).toContain("} from '@/lib/sot3-a3-blocked-observation';");
    expect(source).toContain('await runSot3A3FailureBoundary(');
    // The live test file must NOT define its own local try/catch-based
    // BLOCKED-persistence logic (buildBlockedObservation call sites) --
    // that responsibility belongs entirely to the shared executor now.
    expect(source).not.toContain('function buildBlockedObservation(');
    expect(source).not.toContain('async function writeObservationAtomic(');
  });
});
