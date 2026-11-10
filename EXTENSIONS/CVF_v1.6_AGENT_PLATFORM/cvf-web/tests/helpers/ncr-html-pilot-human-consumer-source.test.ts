/** Source/UI software regression only. No browser, server, native-store or AI governance proof is claimed. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { assertDeniedEffectDelta, assertRestoreSeconds } from './ncr-html-pilot-proof-assertions';

const consumerPath = path.resolve('tests/e2e/ncr-html-pilot-live-consumer.spec.ts');
const reviewPath = path.resolve('tests/e2e/ncr-html-pilot-root-review.spec.ts');
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const source = (file: string) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
function functions(file: string, names: string[], bindings: Record<string, unknown>) {
  const parsed = source(file);
  const selected = names.map(name => {
    const declaration = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
    if (!declaration) throw new Error(`SOURCE_FUNCTION_MISSING:${name}`);
    return declaration.getText(parsed);
  }).join('\n');
  const code = ts.transpileModule(selected, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  const context = vm.createContext({ ...bindings, URLSearchParams, performance, Date });
  new vm.Script(code, { filename: file }).runInContext(context, { timeout: 1000 });
  return context as Record<string, (...args: unknown[]) => Promise<unknown>>;
}
type Ui = { testId: string; attributes: Record<string, string>; count: number };
function uiExpect(value: unknown) {
  if (typeof value === 'object' && value !== null && 'testId' in value) {
    const locator = value as Ui;
    return {
      async toBeVisible() { expect(locator.testId.length).toBeGreaterThan(0); },
      async toHaveCount(count: number) { expect(locator.count).toBe(count); },
      async toHaveAttribute(name: string, expected: string) { expect(locator.attributes[name]).toBe(expected); },
    };
  }
  return expect(value);
}
const exact = { jobId: 'job-current', rootRunId: 'root-current', v1Id: 'version-one', v2Id: 'version-two',
  v1HtmlSha256: hash('<h1>One</h1>'), v2HtmlSha256: hash('<h1>Two</h1>'), profileDigest: 'a'.repeat(64),
  decisionState: 'PENDING_OPERATOR_ACCEPTANCE', paidStarts: 2 };
const owner = { userId: 'usr_3', orgId: 'org_cvf', teamId: 'team_eng' };
const counters = { operations: 2, claims: 2, outcomes: 2, browserExecuteStarts: 2, artifactWrites: 4,
  guardCallsUsed: 30, guardAttempts: 30 };
const ackRows: Record<string, Record<string, unknown>> = {
  'restart.done.json': { schema: 'cvf.htmlPilotRestartAck.v1', jobId: exact.jobId, checkpointTreeSha256: 'b'.repeat(64) },
  'restore.done.json': { schema: 'cvf.htmlPilotRestoreAck.v1', jobId: exact.jobId, fullRtoSeconds: 2,
    restore: { exactBytesMatch: true, newDirectoryAtSameAbsolutePath: true, checkpointRpoLostFiles: 0 } },
  'revoke.done.json': { schema: 'cvf.htmlPilotRevokeAck.v1', jobId: exact.jobId, profileDigest: exact.profileDigest, state: 'REVOKED' },
};
function fixture(mutation?: { ack: string; field: string; value: unknown }, foreignOwner = false) {
  const events: string[] = [];
  const writes = new Map<string, Record<string, unknown>>();
  const attributes = { 'data-version-id': exact.v2Id, 'data-html-sha256': exact.v2HtmlSha256,
    'data-job-id': exact.jobId, 'data-decision': exact.decisionState };
  const locator = (testId: string): Ui => ({ testId, attributes, count: 0 });
  const page = {
    getByTestId: locator, locator,
    async reload() { events.push('reload'); },
    request: {
      async get(url: string) {
        const q = new URL(url, 'http://localhost').searchParams;
        events.push(`get:${q.get('kind') ?? 'draft'}:${q.get('versionId') ?? q.get('id') ?? ''}`);
        const readOwner = foreignOwner ? { ...owner, teamId: 'foreign' } : owner;
        const versionId = q.get('versionId') ?? q.get('id');
        const html = versionId === exact.v1Id ? '<h1>One</h1>' : '<h1>Two</h1>';
        const data = q.get('kind') === 'job' ? { owner: readOwner, jobId: exact.jobId,
          sourceRecordId: exact.rootRunId, pilotProfileDigest: exact.profileDigest }
          : { owner: readOwner, jobId: exact.jobId, sourceRecordId: exact.rootRunId, versionId, html, htmlSha256: hash(html) };
        return { status: () => q.get('kind') === 'product-decision' ? 404 : 200, json: async () => ({ data }) };
      },
      async post(url: string, options: { data: Record<string, unknown> }) {
        events.push(`post:${url}`);
        expect(writes.has('revoke.request.json')).toBe(true);
        expect(options.data.htmlPilotIntent).toMatchObject({ operationKey: 'human-post-revocation-new-operation' });
        return { status: () => 403, json: async () => ({ error: 'PILOT_GRANT_UNAVAILABLE' }) };
      },
    },
  };
  const compiled = functions(consumerPath, ['assertStart', 'observeHumanRecoveredVersion', 'completeHumanRecovery'], {
    expect: uiExpect, hash, assertDeniedEffectDelta, assertRestoreSeconds,
    async writeControl(name: string, value: Record<string, unknown>) {
      if (writes.has(name)) throw new Error('DUPLICATE_WRITE');
      writes.set(name, value); events.push(`write:${name}`);
    },
    async readControl(name: string) {
      events.push(`read:${name}`);
      const row = { ...ackRows[name] };
      if (mutation?.ack === name) row[mutation.field] = mutation.value;
      return row;
    },
  });
  return { events, writes, run: () => compiled.completeHumanRecovery(page, exact, owner,
    { htmlPilotIntent: { operationKey: 'previous-start' } }, async () => ({ ...counters })) };
}

describe('actual HUMAN source recovery binding', () => {
  it('keeps the HUMAN entrypoint connected to the complete observer without scripting operator controls', () => {
    const parsed = source(consumerPath);
    const observer = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'observeHumanConsumer')!;
    const calls: string[] = [];
    const visit = (node: ts.Node) => {
      // Ignore callback-local returns (route filters/storage projection), but reject any observer early return.
      if (node !== observer && ts.isFunctionLike(node)) return;
      expect(ts.isReturnStatement(node)).toBe(false);
      if (ts.isCallExpression(node)) {
        calls.push(node.expression.getText(parsed));
        if (ts.isPropertyAccessExpression(node.expression)) expect(node.expression.name.text).not.toMatch(/^(fill|click|press|check|uncheck|selectOption)$/);
      }
      ts.forEachChild(node, visit);
    };
    visit(observer);
    expect(calls).toContain('completeHumanRecovery');
    expect(calls).not.toContain('activate');
    expect(parsed.text).toContain('await observeHumanConsumer(page, browser, testInfo)');
    expect(parsed.text).toContain("if (mode === 'HUMAN')");
  });

  it('executes the source checkpoint/restart/restore/revoke/finality sequence with exact immutable identities', async () => {
    const f = fixture();
    await f.run();
    expect(f.events.filter(event => !event.startsWith('get:'))).toEqual([
      'write:checkpoint.json', 'read:restart.done.json', 'reload', 'write:restore.request.json',
      'read:restore.done.json', 'reload', 'write:revoke.request.json', 'read:revoke.done.json',
      'post:/api/execute', 'write:restore.consumer-finality.json',
    ]);
    expect(f.events.filter(event => event === 'get:job:')).toHaveLength(3);
    expect(f.events.filter(event => event === `get:version:${exact.v1Id}`)).toHaveLength(3);
    expect(f.writes.get('checkpoint.json')).toEqual({ schema: 'cvf.htmlPilotCheckpointRequest.v1', ...exact });
    expect(f.writes.get('restore.request.json')).toEqual({ schema: 'cvf.htmlPilotRestoreRequest.v1', ...exact });
    expect(f.writes.get('restore.consumer-finality.json')).toMatchObject({
      schema: 'cvf.htmlPilotConsumerRestoreFinality.v1', ...exact, rootServerReadySeconds: 2,
    });
  });

  it.each([
    ['restart.done.json', 'schema', 'wrong'], ['restart.done.json', 'jobId', 'foreign'],
    ['restart.done.json', 'checkpointTreeSha256', 'invalid'], ['restore.done.json', 'jobId', 'foreign'],
    ['restore.done.json', 'restore', { exactBytesMatch: true, newDirectoryAtSameAbsolutePath: false, checkpointRpoLostFiles: 0 }],
    ['restore.done.json', 'fullRtoSeconds', 601], ['restore.done.json', 'fullRtoSeconds', '2'],
    ['revoke.done.json', 'profileDigest', 'foreign'],
    ['revoke.done.json', 'state', 'ACTIVE'],
  ])('refuses a bad %s/%s and never writes successful finality', async (ack, field, value) => {
    const f = fixture({ ack: String(ack), field: String(field), value });
    await expect(f.run()).rejects.toThrow();
    expect(f.writes.has('restore.consumer-finality.json')).toBe(false);
  });

  it('refuses a foreign native owner readback before requesting restore', async () => {
    const f = fixture(undefined, true);
    await expect(f.run()).rejects.toThrow();
    expect(f.writes.has('restore.request.json')).toBe(false);
  });
});

describe('actual parent review observer source', () => {
  it.each(['PENDING_OPERATOR_ACCEPTANCE', 'ACCEPTED', 'REJECTED'])('observes the parameterized %s state without choosing a version', async decision => {
    const calls: string[] = [];
    const attributes = { 'data-version-id': exact.v2Id, 'data-html-sha256': exact.v2HtmlSha256, 'data-decision': decision };
    const locator = (testId: string): Ui => { calls.push(testId); return { testId, attributes, count: 0 }; };
    const compiled = functions(reviewPath, ['waitForOperatorToRestoreExactVersion'], { expect: uiExpect, waitMs: 100 });
    await compiled.waitForOperatorToRestoreExactVersion({ getByTestId: locator, locator }, exact, decision);
    expect(calls.some(value => value.includes(exact.v2Id))).toBe(true);
    const review = fs.readFileSync(reviewPath, 'utf8');
    expect(review).toContain("waitForOperatorToRestoreExactVersion(page, context, 'PENDING_OPERATOR_ACCEPTANCE')");
    expect(review).toContain('waitForOperatorToRestoreExactVersion(page, context, decision)');
  });

  it('serializes the supplied signed execution into a fresh browser context on every reload', async () => {
    const execution = { id: 'exec-v2', output: '# Signed output', savedReceiptArchive: { receipt: { signature: 'fixture-signature' } },
      htmlPilot: { jobId: exact.jobId, rootRunId: exact.rootRunId } };
    const contexts: Map<string, string>[] = [];
    const compiled = functions(reviewPath, ['bindReviewExecution'], {});
    const page = { async addInitScript(fn: (value: unknown) => void, argument: unknown) {
      for (let reload = 0; reload < 2; reload += 1) {
        const storage = new Map<string, string>();
        const isolated = vm.createContext({ supplied: JSON.parse(JSON.stringify(argument)),
          localStorage: { setItem: (key: string, value: string) => storage.set(key, value) } });
        new vm.Script(`(${fn.toString()})(supplied)`).runInContext(isolated, { timeout: 1000 });
        contexts.push(storage);
      }
    } };
    await compiled.bindReviewExecution(page, { execution });
    for (const storage of contexts) {
      expect(storage.get('cvf_language')).toBe('vi');
      expect(JSON.parse(storage.get('cvf-executions-storage')!)).toEqual({
        state: { executions: [execution], currentExecution: execution }, version: 0,
      });
    }
    expect(contexts).toHaveLength(2);
  });
});
