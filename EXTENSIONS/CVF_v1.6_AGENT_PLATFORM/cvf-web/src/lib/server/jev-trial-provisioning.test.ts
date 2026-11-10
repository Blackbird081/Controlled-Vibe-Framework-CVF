import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'rolldown';
import { jevDigest } from './jev-suggestion-custody';
import { loadVisibleSkills, visibleRosterDigest } from './jev-capability-suggestion';
import { SQLiteAtomicRecordAdapter } from '../storage-adapter';

const goal = '25dc2f717cd30923ce8d6e14cc8241287e6a86d28049036928d0d7f07e2e24bc';
const eval02Goal = 'eb14093f8cbacc6e5653ece41d9146a657f8c632198d0546fc359cfab127328b';
const roster = '2f8fcce9e5c4865c8530535422332f3345e3713206f8deaea542a2c0b631e03c';
const canonical = (o: object) => JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)));
const digest = (o: object) => jevDigest(canonical(o));

describe('trusted Jev provisioning executable', () => {
  it('creates once, refuses replay and rejects invalid bindings before writing', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'cvf-jev-bootstrap-test-'));
    const webRoot = process.cwd();
    const bundle = path.join(root, 'provision.cjs');
    try {
      expect(visibleRosterDigest(await loadVisibleSkills())).toBe(roster);
      await build({ input: 'scripts/provision-jev-trial.ts', platform: 'node', external: [/^node:/, 'better-sqlite3'], output: { file: bundle, format: 'cjs' } });
      const src = jevDigest('synthetic source');
      const env = { NODE_ENV: 'test' as const, SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_PATH: path.join(webRoot, 'node_modules'), CVF_JEV_SOURCE_DIGEST: src };
      const now = Date.now();
      const priceBase = { schema: 'cvf.jevPricePin.v1', identity: 'synthetic', evidenceType: 'VERIFIED', evidenceDigest: jevDigest('synthetic evidence'), validUntil: new Date(now + 3600000).toISOString(), currency: 'USD', inputMicrounitsPerMillion: 42000, outputMicrounitsPerMillion: 0, wideInputLimit: 262144, wideOutputLimit: 235929, narrowInputLimit: 262144, narrowOutputLimit: 235929 };
      const pricing = { ...priceBase, digest: digest(priceBase) };
      const manifest = { EVAL01: goal };
      const base = { schema: 'cvf.jevTrialSpec.v2', trialId: 'fixture', authorizationDigest: jevDigest('synthetic authority'), sourceRevision: 'JEV-S1-OPENROUTER-TRIAL-20261104', sourceDigest: src, transport: 'openrouter-systemone', provider: 'openrouter', requestedModel: 'typesafe/jev-1.14', method: 'system_one', destination: 'https://openrouter.ai/api/v1/systemone', credentialEnv: 'OPENROUTER_API_KEY', reportedModels: ['typesafe/jev-1.14-20261014'], rosterDigest: roster, manifest, manifestDigest: digest(manifest), expiresAt: new Date(now + 3600000).toISOString(), maxCases: 1, maxHttp: 2, maxMicrounits: 30000, currency: 'USD', effectAuthorizationRef: 'fixture-effect', dataBoundaryRef: 'fixture-data', costEnvelopeRef: 'fixture-cost', pricing, wideMaxMicrounits: 15000, narrowMaxMicrounits: 15000, resultRetentionMs: 86400000 };
      const run = (directory: string, changes: Record<string, unknown> = {}, overrides: Record<string, string> = {}) => {
        mkdirSync(directory, { recursive: true });
        const policyPath = path.join(directory, 'policy.json');
        const selectedManifest = changes.manifest ?? base.manifest;
        const body = { ...base, manifestDigest: digest(selectedManifest as object), ...changes };
        const trialSpec = { ...body, policyDigest: digest(body) };
        writeFileSync(policyPath, JSON.stringify({ schema: 'cvf.jevTrialRuntime.v2', directory, trialSpec }));
        const proc = spawnSync(process.execPath, [bundle, '--policy', policyPath], { cwd: webRoot, env: { ...env, CVF_JEV_CUSTODY_DIRECTORY: directory, ...overrides }, encoding: 'utf8' });
        return { proc, policyPath, trialSpec };
      };
      const dir = path.join(root, 'valid');
      const first = run(dir);
      expect(first.proc.status, first.proc.stderr).toBe(0);
      expect(JSON.parse(first.proc.stdout)).toEqual({ status: 'PROVISIONED', trialId: 'fixture', policyDigest: first.trialSpec.policyDigest });
      const adapter = new SQLiteAtomicRecordAdapter(dir, 'jev-suggestion-v1');
      const before = adapter.readAll();
      expect(before).toHaveLength(1);
      expect(before[0].value).toMatchObject({ status: 'ACTIVE', reservedCases: 0, reservedHttp: 0, reservedMicrounits: 0, inFlight: null });
      const replay = run(dir);
      expect(replay.proc.status).not.toBe(0);
      expect(replay.proc.stderr).toBe('JEV_TRIAL_PROVISIONING_REFUSED\n');
      expect(adapter.readAll()).toEqual(before);
      const eval02Manifest = { EVAL02: eval02Goal };
      expect(digest(manifest)).toBe('32e14c85f61d737507e43d0213a7a5f7db250e6048c55fc3d0a1417dc423231d');
      expect(digest(eval02Manifest)).toBe('2dcf6b46ed18b75e9dec57822d7285131ac0a5b2b361163b617de9ce15c05fdc');
      const eval02Dir = path.join(root, 'valid-eval02');
      const eval02 = run(eval02Dir, { manifest: eval02Manifest });
      expect(eval02.proc.status, eval02.proc.stderr).toBe(0);
      expect(JSON.parse(eval02.proc.stdout)).toEqual({ status: 'PROVISIONED', trialId: 'fixture', policyDigest: eval02.trialSpec.policyDigest });
      const eval02Adapter = new SQLiteAtomicRecordAdapter(eval02Dir, 'jev-suggestion-v1');
      const eval02Before = eval02Adapter.readAll();
      expect(eval02Before).toHaveLength(1);
      expect(eval02Before[0].value).toMatchObject({ status: 'ACTIVE', reservedCases: 0, reservedHttp: 0, reservedMicrounits: 0, inFlight: null });
      const eval02Replay = run(eval02Dir, { manifest: eval02Manifest });
      expect(eval02Replay.proc.status).not.toBe(0);
      expect(eval02Replay.proc.stderr).toBe('JEV_TRIAL_PROVISIONING_REFUSED\n');
      expect(eval02Adapter.readAll()).toEqual(eval02Before);
      const badCases: [string, Record<string, unknown>, Record<string, string>][] = [
        ['unknown-id', { manifest: { EVAL03: goal } }, {}],
        ['empty', { manifest: {} }, {}],
        ['goal01', { manifest: { EVAL01: jevDigest('changed goal') } }, {}],
        ['goal02', { manifest: { EVAL02: jevDigest('changed goal') } }, {}],
        ['digest01', { manifestDigest: jevDigest('changed manifest') }, {}],
        ['digest02', { manifest: eval02Manifest, manifestDigest: jevDigest('changed manifest') }, {}],
        ['cross-goal01', { manifest: { EVAL01: eval02Goal } }, {}],
        ['cross-goal02', { manifest: { EVAL02: goal } }, {}],
        ['cross-digest01', { manifestDigest: digest(eval02Manifest) }, {}],
        ['cross-digest02', { manifest: eval02Manifest, manifestDigest: digest(manifest) }, {}],
        ['both', { manifest: { ...manifest, ...eval02Manifest } }, {}],
        ['extra01', { manifest: { ...manifest, EVAL03: goal } }, {}],
        ['extra02', { manifest: { ...eval02Manifest, EVAL03: eval02Goal } }, {}],
        ['wide', { maxHttp: 3 }, {}], ['cost', { maxMicrounits: 30001 }, {}],
        ['case', { manifest: { EVAL01: goal, EVAL02: goal } }, {}],
        ['roster', { rosterDigest: jevDigest('other roster') }, {}],
        ['expiry', { expiresAt: new Date(now - 1000).toISOString() }, {}],
        ['long', { expiresAt: new Date(now + 90000000).toISOString() }, {}],
        ['price', { pricing: { ...pricing, digest: jevDigest('invalid') } }, {}],
        ['price-expired', { pricing: (() => { const p = { ...priceBase, validUntil: new Date(now - 1000).toISOString() }; return { ...p, digest: digest(p) }; })() }, {}],
        ['source', {}, { CVF_JEV_SOURCE_DIGEST: jevDigest('other') }],
        ['directory', {}, { CVF_JEV_CUSTODY_DIRECTORY: path.join(root, 'other') }],
      ];
      for (const [name, changes, overrides] of badCases) {
        const d = path.join(root, name); const result = run(d, changes, overrides);
        expect(result.proc.status, name).not.toBe(0);
        expect(result.proc.stderr, name).toBe('JEV_TRIAL_PROVISIONING_REFUSED\n');
        expect(existsSync(path.join(d, 'cvf-keyvalue-store.sqlite')), name).toBe(false);
      }
      const missing = spawnSync(process.execPath, [bundle, '--unknown'], { cwd: webRoot, env, encoding: 'utf8' });
      expect(missing.status).not.toBe(0);
      const relative = spawnSync(process.execPath, [bundle, '--policy', 'relative.json'], { cwd: webRoot, env, encoding: 'utf8' });
      expect(relative.status).not.toBe(0);
      const invalidDir = path.join(root, 'invalid'); mkdirSync(invalidDir);
      const invalidPath = path.join(invalidDir, 'policy.json');
      for (const text of ['{', JSON.stringify({ schema: 'cvf.jevSingleActionRuntime.v1' })]) {
        writeFileSync(invalidPath, text);
        const invalid = spawnSync(process.execPath, [bundle, '--policy', invalidPath], { cwd: webRoot, env: { ...env, CVF_JEV_CUSTODY_DIRECTORY: invalidDir }, encoding: 'utf8' });
        expect(invalid.status).not.toBe(0);
        expect(existsSync(path.join(invalidDir, 'cvf-keyvalue-store.sqlite'))).toBe(false);
      }
      const imported = spawnSync(process.execPath, ['-e', `require(${JSON.stringify(bundle)})`], { cwd: webRoot, env, encoding: 'utf8' });
      expect(imported.status).toBe(0); expect(imported.stdout).toBe(''); expect(imported.stderr).toBe('');
      console.log(`fixture executable=${process.execPath} bundle=${bundle} policy=${first.policyPath}`);
    } finally {
      const resolvedRoot = path.resolve(root);
      expect(path.dirname(resolvedRoot)).toBe(path.resolve(tmpdir()));
      expect(path.basename(resolvedRoot)).toMatch(/^cvf-jev-bootstrap-test-/);
      rmSync(resolvedRoot, { recursive: true, force: true });
      expect(existsSync(resolvedRoot)).toBe(false);
    }
  }, 120000);
});
