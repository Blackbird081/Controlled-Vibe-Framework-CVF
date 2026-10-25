/* Root/worker owned offline peer: compiles and calls the production ledger, never a test double. */
/* eslint-disable @typescript-eslint/no-require-imports */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function main() {
  const [source, compiledRoot, ledgerRoot, barrierRoot, key, actor, mode = 'NORMAL'] = process.argv.slice(2);
  if (![source, compiledRoot, ledgerRoot, barrierRoot].every(value => value && path.isAbsolute(value))
    || !/^[A-Za-z0-9_-]{1,150}$/.test(key) || !/^[A-Za-z0-9_-]{1,150}$/.test(actor)
    || !['NORMAL', 'FAIL_AFTER_ACQUIRE'].includes(mode)) throw new Error('INVALID_PEER_ARGS');
  for (const root of [compiledRoot, ledgerRoot, barrierRoot]) {
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('UNSAFE_PEER_ROOT');
  }
  if (path.basename(source) !== 'ncr-html-pilot-operation-ledger.ts') throw new Error('PRODUCTION_LEDGER_SOURCE_REQUIRED');
  const compiled = path.join(compiledRoot, `ledger-${process.pid}.cjs`);
  const code = ts.transpileModule(fs.readFileSync(source, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  fs.writeFileSync(compiled, code, { flag: 'wx' });
  const { HtmlPilotOperationLedger } = require(compiled);
  const barrier = name => path.join(barrierRoot, `${actor}-${name}.json`);
  const mark = (name, value = {}) => fs.writeFileSync(barrier(name), JSON.stringify({ pid: process.pid, ...value }), { flag: 'wx' });
  const wait = name => {
    const deadline = Date.now() + 10_000;
    while (!fs.existsSync(barrier(name))) {
      if (Date.now() >= deadline) throw new Error(`BARRIER_TIMEOUT_${name}`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  };
  mark('READY');
  wait('START_ATTEMPT');
  mark('ATTEMPTING');
  const ledger = new HtmlPilotOperationLedger(ledgerRoot, () => {
    mark('ENTERED');
    wait('PARENT_RELEASE');
    if (mode === 'FAIL_AFTER_ACQUIRE') throw new Error('INJECTED_AFTER_ACQUIRE_BEFORE_MUTATION');
  });
  const input = { operationKey: key, owner: { userId: 'inventedDeveloper', orgId: 'inventedOrg', teamId: 'inventedTeam' },
    requestSha256: 'a'.repeat(64), parentRunId: null, rootRunId: null };
  return ledger.claim(input).then(result => { mark('COMPLETE', { kind: result.kind, runId: result.kind === 'CLAIMED' ? result.claim.runId : null }); });
}
main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
