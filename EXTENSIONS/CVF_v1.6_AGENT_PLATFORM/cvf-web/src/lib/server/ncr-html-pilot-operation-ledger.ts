import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** An unresolved claim is a permanent no-resend record, including a torn record. */
export interface HtmlPilotClaim {
  schema: 'cvf.ncrHtmlPilotClaim.v1';
  operationKey: string;
  runId: string;
  owner: { userId: string; orgId: string; teamId: string };
  requestSha256: string;
  parentRunId: string | null;
  rootRunId: string | null;
  createdAt: string;
  state: 'UNKNOWN';
}
export type ClaimResult = { kind: 'CLAIMED'; claim: HtmlPilotClaim } | { kind: 'EXISTING_OR_UNKNOWN' } | { kind: 'UNAVAILABLE' };
const hex64 = (v: string) => /^[a-f0-9]{64}$/.test(v);
const safe = (v: string) => /^[A-Za-z0-9_-]{1,150}$/.test(v);
const digest = (v: string) => createHash('sha256').update(v).digest('hex');

export interface ClaimInput {
  operationKey: string;
  owner: HtmlPilotClaim['owner'];
  requestSha256: string;
  parentRunId: string | null;
  rootRunId: string | null;
}
export interface HtmlPilotOutcome {
  schema: 'cvf.ncrHtmlPilotOutcome.v1';
  runId: string;
  rootRunId: string;
  parentRunId: string | null;
  owner: HtmlPilotClaim['owner'];
  requestSha256: string;
  outputSha256: string;
  evidenceSha256: string;
  createdAt: string;
}

/** The hook is solely for deterministic failure injection in an owned-file test. */
export class HtmlPilotOperationLedger {
  constructor(private readonly root: string, private readonly afterAcquireBeforeMutation?: () => void) {
    if (!path.isAbsolute(root) || path.resolve(root) !== root || root === path.parse(root).root || root.startsWith('\\')) {
      throw new Error('PILOT_LEDGER_ROOT_INVALID');
    }
  }

  claimPath(input: ClaimInput): string {
    return path.join(this.root, `claim-${digest(JSON.stringify([input.owner.userId, input.owner.orgId, input.owner.teamId, input.operationKey]))}.json`);
  }

  private async reserveCapacity(input: ClaimInput): Promise<boolean> {
    const guard = path.join(this.root, '.capacity.guard');
    try { await fs.mkdir(guard); }
    catch { return false; }
    try {
      for (let slot = 0; slot < 2; slot++) {
        const file = path.join(this.root, `slot-${slot}.json`);
        let bytes: string | null = null;
        try { bytes = await fs.readFile(file, 'utf8'); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return false; }
        if (bytes !== null) {
          try {
            const record = JSON.parse(bytes) as { requestSha256: string; parentRunId: string | null };
            if (!hex64(record.requestSha256) || record.requestSha256 === input.requestSha256
              || input.parentRunId === null || record.parentRunId !== null) return false;
          } catch { return false; }
          continue;
        }
        const value = JSON.stringify({ schema: 'cvf.ncrHtmlPilotCapacity.v1', owner: input.owner,
          operationKey: input.operationKey, requestSha256: input.requestSha256, parentRunId: input.parentRunId });
        try {
          const handle = await fs.open(file, 'wx', 0o600);
          try { await handle.writeFile(value, 'utf8'); await handle.sync(); }
          finally { await handle.close(); }
          return (await fs.readFile(file, 'utf8')) === value;
        } catch { return false; }
      }
      return false;
    } finally {
      try { await fs.rmdir(guard); }
      catch { /* A stale guard permanently denies new reservations. */ }
    }
  }

  async claim(input: ClaimInput): Promise<ClaimResult> {
    if (!safe(input.operationKey) || ![input.owner.userId, input.owner.orgId, input.owner.teamId].every(safe)
      || !hex64(input.requestSha256) || (input.parentRunId !== null && !safe(input.parentRunId))
      || (input.rootRunId !== null && !safe(input.rootRunId))) return { kind: 'UNAVAILABLE' };
    try {
      const rootStat = await fs.lstat(this.root);
      if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) return { kind: 'UNAVAILABLE' };
    } catch { return { kind: 'UNAVAILABLE' }; }
    const finalPath = this.claimPath(input);
    const guard = `${finalPath}.guard`;
    try { await fs.mkdir(guard); }
    catch { return { kind: 'EXISTING_OR_UNKNOWN' }; }
    let acquired = true;
    try {
      // A competitor can never enter this key while this ephemeral guard exists.
      try { await fs.lstat(finalPath); return { kind: 'EXISTING_OR_UNKNOWN' }; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return { kind: 'UNAVAILABLE' }; }
      this.afterAcquireBeforeMutation?.();
      if (!(await this.reserveCapacity(input))) return { kind: 'UNAVAILABLE' };
      const claim: HtmlPilotClaim = {
        schema: 'cvf.ncrHtmlPilotClaim.v1', operationKey: input.operationKey,
        runId: digest(JSON.stringify([input.owner, input.operationKey])).slice(0, 32), owner: input.owner,
        requestSha256: input.requestSha256, parentRunId: input.parentRunId, rootRunId: input.rootRunId,
        createdAt: new Date().toISOString(), state: 'UNKNOWN',
      };
      // Exclusive create is the durable no-resend point. A partial file is permanently unresolved.
      const handle = await fs.open(finalPath, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(claim), 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      const readback = await fs.readFile(finalPath, 'utf8');
      return readback === JSON.stringify(claim) ? { kind: 'CLAIMED', claim } : { kind: 'UNAVAILABLE' };
    } catch {
      return { kind: 'UNAVAILABLE' };
    } finally {
      if (acquired) {
        try { await fs.rmdir(guard); }
        catch { /* Stale guard is fail-closed; it is never reclaimed automatically. */ }
        acquired = false;
      }
    }
  }

  async read(input: ClaimInput): Promise<HtmlPilotClaim | null> {
    try {
      const bytes = await fs.readFile(this.claimPath(input), 'utf8');
      const value = JSON.parse(bytes) as HtmlPilotClaim;
      if (value.schema !== 'cvf.ncrHtmlPilotClaim.v1' || value.operationKey !== input.operationKey
        || JSON.stringify(value.owner) !== JSON.stringify(input.owner) || value.requestSha256 !== input.requestSha256
        || value.parentRunId !== input.parentRunId || value.rootRunId !== input.rootRunId || value.state !== 'UNKNOWN') return null;
      return value;
    } catch { return null; }
  }

  async saveOutcome(claim: HtmlPilotClaim, outputSha256: string, evidenceSha256: string): Promise<boolean> {
    if (!hex64(outputSha256) || !hex64(evidenceSha256) || !(await this.read({ operationKey: claim.operationKey,
      owner: claim.owner, requestSha256: claim.requestSha256, parentRunId: claim.parentRunId, rootRunId: claim.rootRunId }))) return false;
    const value: HtmlPilotOutcome = { schema: 'cvf.ncrHtmlPilotOutcome.v1', runId: claim.runId,
      rootRunId: claim.rootRunId ?? claim.runId, parentRunId: claim.parentRunId, owner: claim.owner,
      requestSha256: claim.requestSha256, outputSha256, evidenceSha256, createdAt: new Date().toISOString() };
    const file = path.join(this.root, `outcome-${claim.runId}.json`);
    try {
      const handle = await fs.open(file, 'wx', 0o600);
      try { await handle.writeFile(JSON.stringify(value), 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      return (await fs.readFile(file, 'utf8')) === JSON.stringify(value);
    } catch { return false; }
  }

  async readOutcome(runId: string, owner: HtmlPilotClaim['owner']): Promise<HtmlPilotOutcome | null> {
    if (!identRun(runId) || ![owner.userId, owner.orgId, owner.teamId].every(safe)) return null;
    try {
      const value = JSON.parse(await fs.readFile(path.join(this.root, `outcome-${runId}.json`), 'utf8')) as HtmlPilotOutcome;
      return value.schema === 'cvf.ncrHtmlPilotOutcome.v1' && value.runId === runId
        && JSON.stringify(value.owner) === JSON.stringify(owner) && hex64(value.requestSha256)
        && identRun(value.rootRunId) && (value.parentRunId === null || identRun(value.parentRunId))
        && hex64(value.outputSha256) && hex64(value.evidenceSha256) ? value : null;
    } catch { return null; }
  }
}

const identRun = (value: string) => /^[a-f0-9]{32}$/.test(value);

export interface WindowsSecurityTuple {
  ownerSid: string;
  protectionState: boolean;
  inheritanceState: boolean;
  aces: Array<{ sid: string; rights: string; accessType: string; isInherited: boolean; inheritanceFlags: string; propagationFlags: string }>;
}
export function sameSecurityTuple(a: WindowsSecurityTuple, b: WindowsSecurityTuple): boolean {
  const normalized = (value: WindowsSecurityTuple) => JSON.stringify({
    ownerSid: value.ownerSid, protectionState: value.protectionState, inheritanceState: value.inheritanceState,
    aces: value.aces.map(ace => JSON.stringify(ace)).sort(),
  });
  return normalized(a) === normalized(b);
}
