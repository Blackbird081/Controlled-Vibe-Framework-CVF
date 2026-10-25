import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { HtmlPilotOperationLedger, sameSecurityTuple } from './ncr-html-pilot-operation-ledger';

const owner = { userId: 'developer', orgId: 'org', teamId: 'team' };
const testRoot = () => {
  const root = process.env.CVF_NCR_TEST_ROOT;
  if (!root || !path.isAbsolute(root)) throw new Error('OWNED_TEST_ROOT_REQUIRED');
  return root;
};
const input = (key: string, parentRunId: string | null = null, rootRunId: string | null = null) => ({
  operationKey: key, owner, requestSha256: key === 'create' ? 'a'.repeat(64) : 'b'.repeat(64), parentRunId, rootRunId,
});

describe('pilot physical operation ledger', () => {
  it('lets one real second process enter a same-key mutation after the first releases its guard', async () => {
    const base = await mkdtemp(path.join(testRoot(), 'peer-'));
    const ledgerRoot = path.join(base, 'ledger'); const compiled = path.join(base, 'compiled'); const barriers = path.join(base, 'barriers');
    await Promise.all([mkdir(ledgerRoot), mkdir(compiled), mkdir(barriers)]);
    const source = path.resolve('src/lib/server/ncr-html-pilot-operation-ledger.ts');
    const helper = path.resolve('tests/helpers/ncr-html-pilot-atomic-peer.cjs');
    const waitFile = async (file: string) => {
      const deadline = Date.now() + 6000;
      for (;;) {
        try { await access(file); return; } catch { if (Date.now() > deadline) throw new Error(`BARRIER_TIMEOUT:${path.basename(file)}`); }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    };
    const peer = (actor: string) => spawn(process.execPath, [helper, source, compiled, ledgerRoot, barriers, 'samekey', actor],
      { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const exit = (child: ReturnType<typeof peer>) => new Promise<number>((resolve, reject) => {
      let stderr = ''; child.stderr.on('data', bytes => { stderr += String(bytes); });
      child.once('error', reject); child.once('exit', code => code === 0 ? resolve(0) : reject(new Error(`PEER_EXIT:${code}:${stderr}`)));
    });
    const first = peer('first');
    const firstExit = exit(first);
    await waitFile(path.join(barriers, 'first-READY.json'));
    await writeFile(path.join(barriers, 'first-START_ATTEMPT.json'), '{}', { flag: 'wx' });
    await waitFile(path.join(barriers, 'first-ENTERED.json'));
    const second = peer('second');
    const secondExit = exit(second);
    await waitFile(path.join(barriers, 'second-READY.json'));
    await writeFile(path.join(barriers, 'second-START_ATTEMPT.json'), '{}', { flag: 'wx' });
    await waitFile(path.join(barriers, 'second-COMPLETE.json'));
    expect(JSON.parse(await readFile(path.join(barriers, 'second-COMPLETE.json'), 'utf8')).kind).toBe('EXISTING_OR_UNKNOWN');
    await writeFile(path.join(barriers, 'first-PARENT_RELEASE.json'), '{}', { flag: 'wx' });
    await Promise.all([firstExit, secondExit]);
    expect(JSON.parse(await readFile(path.join(barriers, 'first-COMPLETE.json'), 'utf8')).kind).toBe('CLAIMED');
  }, 15_000);
  it('releases only the ephemeral guard after a real peer throws before mutation, then permits a new peer', async () => {
    const base = await mkdtemp(path.join(testRoot(), 'peer-failure-'));
    const ledgerRoot = path.join(base, 'ledger'); const compiled = path.join(base, 'compiled'); const barriers = path.join(base, 'barriers');
    await Promise.all([mkdir(ledgerRoot), mkdir(compiled), mkdir(barriers)]);
    const source = path.resolve('src/lib/server/ncr-html-pilot-operation-ledger.ts');
    const helper = path.resolve('tests/helpers/ncr-html-pilot-atomic-peer.cjs');
    const waitFile = async (file: string) => {
      const deadline = Date.now() + 6000;
      for (;;) { try { await access(file); return; }
        catch { if (Date.now() > deadline) throw new Error(`BARRIER_TIMEOUT:${path.basename(file)}`); }
        await new Promise(resolve => setTimeout(resolve, 20)); }
    };
    const run = async (actor: string, mode: string) => {
      const child = spawn(process.execPath, [helper, source, compiled, ledgerRoot, barriers, 'samekey', actor, mode],
        { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
      const done = new Promise<void>((resolve, reject) => { let stderr = '';
        child.stderr.on('data', bytes => { stderr += String(bytes); });
        child.once('error', reject); child.once('exit', code => code === 0 ? resolve() : reject(new Error(`PEER_EXIT:${stderr}`))); });
      await waitFile(path.join(barriers, `${actor}-READY.json`));
      await writeFile(path.join(barriers, `${actor}-START_ATTEMPT.json`), '{}', { flag: 'wx' });
      await waitFile(path.join(barriers, `${actor}-ENTERED.json`));
      await writeFile(path.join(barriers, `${actor}-PARENT_RELEASE.json`), '{}', { flag: 'wx' });
      await done;
      return JSON.parse(await readFile(path.join(barriers, `${actor}-COMPLETE.json`), 'utf8')) as { kind: string };
    };
    expect((await run('failure', 'FAIL_AFTER_ACQUIRE')).kind).toBe('UNAVAILABLE');
    expect((await run('recovery', 'NORMAL')).kind).toBe('CLAIMED');
    expect((await readFile(path.join(ledgerRoot, 'slot-0.json'), 'utf8')).length).toBeGreaterThan(0);
  }, 15_000);
  it('persists one initial claim, one child and no third or replay', async () => {
    const root = await mkdtemp(path.join(testRoot(), 'ledger-'));
    const ledger = new HtmlPilotOperationLedger(root);
    const first = await ledger.claim(input('create'));
    expect(first.kind).toBe('CLAIMED');
    if (first.kind !== 'CLAIMED') return;
    expect(await ledger.claim(input('create'))).toMatchObject({ kind: 'EXISTING_OR_UNKNOWN' });
    expect(await ledger.claim(input('another-create'))).toMatchObject({ kind: 'UNAVAILABLE' });
    expect(await ledger.saveOutcome(first.claim, 'c'.repeat(64), 'd'.repeat(64))).toBe(true);
    const child = await ledger.claim(input('revision', first.claim.runId, first.claim.runId));
    expect(child.kind).toBe('CLAIMED');
    expect(await ledger.claim(input('third', first.claim.runId, first.claim.runId))).toMatchObject({ kind: 'UNAVAILABLE' });
    expect(JSON.parse(await readFile(ledger.claimPath(input('create')), 'utf8'))).toMatchObject({ state: 'UNKNOWN', runId: first.claim.runId });
  });
  it('releases only an unpublished ephemeral guard after failure before mutation', async () => {
    const root = await mkdtemp(path.join(testRoot(), 'failure-'));
    const failing = new HtmlPilotOperationLedger(root, () => { throw new Error('INJECTED_BEFORE_MUTATION'); });
    expect(await failing.claim(input('create'))).toMatchObject({ kind: 'UNAVAILABLE' });
    const normal = new HtmlPilotOperationLedger(root);
    expect((await normal.claim(input('create'))).kind).toBe('CLAIMED');
  });
  it('compares complete Windows security tuples, including extra and inherited ACEs', () => {
    const base = { ownerSid: 'S-1-5-21-invented', protectionState: true, inheritanceState: false,
      aces: [{ sid: 'S-1-5-21-invented', rights: 'FullControl', accessType: 'Allow', isInherited: false,
        inheritanceFlags: 'None', propagationFlags: 'None' }] };
    expect(sameSecurityTuple(base, structuredClone(base))).toBe(true);
    expect(sameSecurityTuple(base, { ...base, aces: [...base.aces, { ...base.aces[0], sid: 'Everyone' }] })).toBe(false);
    expect(sameSecurityTuple(base, { ...base, aces: [{ ...base.aces[0], accessType: 'Deny' }] })).toBe(false);
    expect(sameSecurityTuple(base, { ...base, aces: [{ ...base.aces[0], isInherited: true }] })).toBe(false);
    expect(sameSecurityTuple(base, { ...base, ownerSid: 'S-1-5-21-other' })).toBe(false);
  });
});
