import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  GOVERNED_EXECUTION_RECEIPT_CONTRACT,
  JsonGovernedExecutionStore,
  type GovernedExecutionReceipt,
} from './json-governed-execution.store.js';

const tempDirs: string[] = [];

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'cvf-delta-t3-store-'));
  tempDirs.push(dir);
  return dir;
}

function intent(): GovernedExecutionReceipt {
  return {
    contractVersion: GOVERNED_EXECUTION_RECEIPT_CONTRACT,
    consumptionId: 'delta-consumption-1000-abcd',
    receiptId: 'delta-preflight-1000-abcd',
    profileId: 'git-status',
    bindingHash: 'a'.repeat(64),
    status: 'ADMITTED',
    admittedAt: '2026-06-19T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: null,
    signal: null,
    diagnosticCode: null,
    executionStarted: false,
    executionCompleted: false,
    externalInterceptionProved: false,
  };
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('JsonGovernedExecutionStore', () => {
  it('creates one restrictive intent and rejects a duplicate', async () => {
    const store = new JsonGovernedExecutionStore(await tempDir());
    expect(await store.beginExecution(intent())).toBe(true);
    expect(await store.beginExecution(intent())).toBe(false);
  });

  it('finalizes only an admitted receipt and preserves secret-safe fields', async () => {
    const store = new JsonGovernedExecutionStore(await tempDir());
    await store.beginExecution(intent());
    const finalized = await store.finalizeExecution(intent().consumptionId, {
      status: 'COMPLETED',
      startedAt: '2026-06-19T00:00:01.000Z',
      completedAt: '2026-06-19T00:00:02.000Z',
      exitCode: 0,
      signal: null,
      diagnosticCode: null,
      executionStarted: true,
      executionCompleted: true,
    });

    expect(finalized.status).toBe('COMPLETED');
    expect(finalized.externalInterceptionProved).toBe(false);
    const raw = await readFile(store.receiptPath(intent().consumptionId), 'utf-8');
    expect(raw).not.toContain('stdout');
    expect(raw).not.toContain('stderr');
    expect(raw).not.toContain('executable');
    await expect(
      store.finalizeExecution(intent().consumptionId, {
        status: 'FAILED',
        startedAt: null,
        completedAt: '2026-06-19T00:00:03.000Z',
        exitCode: null,
        signal: null,
        diagnosticCode: 'REPLAY',
        executionStarted: false,
        executionCompleted: true,
      })
    ).rejects.toThrow('not finalizable');
  });

  it('rejects unsafe consumption ids before path construction', async () => {
    const store = new JsonGovernedExecutionStore(await tempDir());
    expect(() => store.receiptPath('../escape')).toThrow('Invalid Delta consumption id');
  });
});
