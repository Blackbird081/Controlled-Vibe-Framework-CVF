'use strict';

/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness; also loaded through NODE_OPTIONS --require */

// NCR HTML B2e test-only inert loopback receipt harness (two modes in one file).
//
// CLI mode  (node b2e-loopback-receipt-harness.cjs [--help]):
//   1. binds a non-forwarding HTTP stub to 127.0.0.1:<ephemeral> and self-tests it,
//   2. spawns the focused Playwright spec against a FRESH Next dev server whose env is forced to
//      NEXTAUTH_URL=<stub origin>, AUTH_URL=<fresh server origin>, GOVERNANCE_ENGINE_ENABLED=false,
//      a dead engine URL and a SYNTHETIC service token (the real .env.local token never reaches the stub),
//   3. installs itself as a --require preload in every child process (preload mode),
//   4. tears everything down and removes the disposable directory outside the repository.
// Preload mode (require.main !== module): wraps global fetch so any governance-evaluate fetch to a
//   destination other than the stub origin is recorded and refused before dispatch, records any request
//   that reaches an actual Next /api/governance/* route, and ticks a secret-safe env-state log.
//
// The stub never forwards: it uses no outbound client, answers only fabricated constants, and records
// only method/path, request/artifact IDs, excerpt length and token-header presence (no headers, token
// values, bodies or HTML). Claim boundary: transport/presentation harness only; a fabricated response is
// not receipt validity, governance behavior, durability or artifact acceptance.

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { threadId } = require('node:worker_threads');

const EVALUATE_PATH = '/api/governance/evaluate';
const SYNTHETIC_TOKEN = 'b2e-synthetic-service-token-not-a-credential';
const CASES = {
  'b2e-invalid-case': { status: 200, body: '{"success":true}' }, // 200, incomplete receipt JSON
  'b2e-unavailable-case': { status: 503, body: '{"success":false}' }, // fabricated outage
};
const SPEC_REL = 'tests/e2e/artifact-export-loopback-receipt.spec.ts';
const CONFIG_REL = 'playwright.config.mock.ts';
const WEB_ROOT = path.resolve(__dirname, '../../..');
const REPO_ROOT = path.resolve(WEB_ROOT, '../../..');

function appendLine(file, entry) {
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...entry }) + '\n');
}

function readLines(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
}

// ---------------------------------------------------------------------------------------------
// Preload mode
// ---------------------------------------------------------------------------------------------
function installPreload() {
  const logPath = process.env.CVF_B2E_PRELOAD_LOG;
  const stubOrigin = process.env.CVF_B2E_STUB_ORIGIN;
  if (!logPath || !path.isAbsolute(logPath) || !stubOrigin) {
    throw new Error('B2E_PRELOAD_FAIL_CLOSED: CVF_B2E_PRELOAD_LOG (absolute) and CVF_B2E_STUB_ORIGIN are required.');
  }
  const log = entry => fs.appendFileSync(logPath, JSON.stringify({ ts: Date.now(), pid: process.pid, threadId, ...entry }) + '\n');
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== 'function') throw new Error('B2E_PRELOAD_FAIL_CLOSED: global fetch is not available to wrap.');

  let evaluateFetches = 0;
  let disallowedEvaluateFetches = 0;
  let otherFetches = 0;
  let nextGovernanceHits = 0;

  function urlOf(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.href === 'string') return input.href;
    if (input && typeof input.url === 'string') return input.url;
    return String(input);
  }

  function b2eFetch(input, init) {
    const url = urlOf(input);
    if (url.includes(EVALUATE_PATH)) {
      evaluateFetches += 1;
      let origin = 'UNPARSEABLE';
      try { origin = new URL(url).origin; } catch { /* keep marker */ }
      const allowed = origin === stubOrigin;
      log({ event: 'evaluate_fetch', destinationOrigin: origin, path: EVALUATE_PATH, allowed, method: String((init && init.method) || 'GET') });
      if (!allowed) {
        disallowedEvaluateFetches += 1;
        throw new Error('B2E_PRELOAD_BLOCKED: governance evaluate fetch to a non-stub origin was refused before dispatch.');
      }
    } else {
      otherFetches += 1;
    }
    return originalFetch.apply(this, arguments);
  }
  globalThis.fetch = b2eFetch;

  const originalEmit = http.Server.prototype.emit;
  http.Server.prototype.emit = function b2eEmit(event, req) {
    if (event === 'request' && req && typeof req.url === 'string' && req.url.startsWith('/api/governance')) {
      nextGovernanceHits += 1;
      log({ event: 'next_governance_hit', method: String(req.method), path: req.url.split('?')[0].slice(0, 80) });
    }
    return originalEmit.apply(this, arguments);
  };

  const sha = value => require('node:crypto').createHash('sha256').update(String(value)).digest('hex');
  const originOf = value => { try { return new URL(String(value)).origin; } catch { return value ? 'UNPARSEABLE' : 'UNSET'; } };
  function state(event) {
    return {
      event,
      argvTail: process.argv.slice(1).map(part => path.basename(String(part))),
      title: process.title,
      processedEnv: process.env.__NEXT_PROCESSED_ENV === 'true',
      nextauthOrigin: originOf(process.env.NEXTAUTH_URL),
      nextauthIsStub: process.env.NEXTAUTH_URL === stubOrigin,
      authUrlOrigin: originOf(process.env.AUTH_URL),
      engineEnabledFlag: process.env.GOVERNANCE_ENGINE_ENABLED === undefined ? 'UNSET' : process.env.GOVERNANCE_ENGINE_ENABLED,
      engineUrlOrigin: originOf(process.env.GOVERNANCE_ENGINE_URL),
      serviceTokenIsSynthetic: sha(process.env.CVF_SERVICE_TOKEN || '') === sha(SYNTHETIC_TOKEN),
      fetchIsWrapper: globalThis.fetch === b2eFetch,
      evaluateFetches, disallowedEvaluateFetches, otherFetches, nextGovernanceHits,
    };
  }
  log(state('startup'));
  const timer = setInterval(() => log(state('state')), 500);
  timer.unref();
  process.on('exit', () => { try { log(state('exit')); } catch { /* best effort */ } });
}

// ---------------------------------------------------------------------------------------------
// CLI mode
// ---------------------------------------------------------------------------------------------
function usage() {
  return [
    'NCR HTML B2e inert loopback receipt harness (test-only).',
    '',
    'Usage: node tests/e2e/support/b2e-loopback-receipt-harness.cjs [--help]',
    '  run from the cvf-web directory; no other arguments are accepted.',
    '',
    'Binds a non-forwarding stub on 127.0.0.1:<ephemeral>, self-tests it, then runs',
    `${SPEC_REL} with ${CONFIG_REL} against a fresh Next dev server whose env is forced to`,
    'NEXTAUTH_URL=<stub origin>, GOVERNANCE_ENGINE_ENABLED=false and a synthetic service token.',
    'Exit code is the Playwright exit code unless isolation or cleanup checks fail (then non-zero).',
    'Writes disposable logs outside the repository and removes them before exit.',
  ].join('\n');
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = http.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

function portOpen(port) {
  return new Promise(resolve => {
    const socket = require('node:net').connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}

function startStub(ledger) {
  const state = { phase: 'preflight' };
  const server = http.createServer((req, res) => {
    const method = String(req.method);
    const reqPath = String(req.url || '').split('?')[0].slice(0, 80);
    const chunks = [];
    let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size <= 65536) chunks.push(chunk); });
    req.on('end', () => {
      const phase = state.phase;
      const tokenHeaderPresent = typeof req.headers['x-cvf-service-token'] === 'string';
      const tokenHeaderIsSynthetic = req.headers['x-cvf-service-token'] === SYNTHETIC_TOKEN;
      let meta = null;
      if (method === 'POST' && reqPath === EVALUATE_PATH) {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          meta = {
            requestId: String(parsed.request_id),
            artifactId: String(parsed.artifact_id),
            excerptLength: parsed.payload && typeof parsed.payload.content === 'string' ? parsed.payload.content.length : -1,
            phaseField: parsed.cvf_phase,
            riskField: parsed.cvf_risk_level,
          };
        } catch { meta = null; }
      }
      const fabricated = meta && CASES[meta.artifactId];
      if (!fabricated) {
        appendLine(ledger, { event: 'stub_request', phase, expected: false, method, path: reqPath, status: 404 });
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end('{"success":false,"error":"b2e stub: unexpected request"}');
        return;
      }
      appendLine(ledger, {
        event: 'stub_request', phase, expected: true, method, path: reqPath, caseId: meta.artifactId, ...meta,
        tokenHeaderPresent, tokenHeaderIsSynthetic, status: fabricated.status,
      });
      res.writeHead(fabricated.status, { 'content-type': 'application/json' });
      res.end(fabricated.body);
    });
  });
  return { server, state };
}

function requestOnce(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers: { 'content-type': 'application/json' } }, res => {
      res.resume();
      res.on('end', () => resolve(res.statusCode));
    });
    req.on('error', reject);
    req.end(body);
  });
}

function scrubbedEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/(API_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)/i.test(key)) env[key] = value;
  }
  return env;
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) { console.log(usage()); return 0; }
  if (process.argv.length > 2) { console.error(usage()); return 2; }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf-b2e-loopback-'));
  const realTmp = fs.realpathSync(tmp);
  if (realTmp.toLowerCase().startsWith(REPO_ROOT.toLowerCase() + path.sep)) throw new Error('B2E_BLOCKED: disposable directory is inside the repository.');
  const stubLog = path.join(realTmp, 'stub.jsonl');
  const preloadLog = path.join(realTmp, 'preload.jsonl');
  const { server, state } = startStub(stubLog);
  let exitCode = 1;
  const summary = { blocked: null };

  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const address = server.address();
    if (address.address !== '127.0.0.1' || address.family !== 'IPv4') throw new Error('B2E_BLOCKED: stub is not bound to 127.0.0.1.');
    const origin = `http://127.0.0.1:${address.port}`;
    appendLine(stubLog, { event: 'listening', address: address.address, family: address.family, port: address.port, origin });

    // Stub self-test (phase "preflight"): unexpected requests must be rejected and recorded.
    const codes = [
      await requestOnce(address.port, 'GET', '/selftest'),
      await requestOnce(address.port, 'POST', EVALUATE_PATH, JSON.stringify({ request_id: 'selftest', artifact_id: 'b2e-selftest', payload: { content: 'x' } })),
      await requestOnce(address.port, 'POST', '/api/governance/other', '{}'),
    ];
    if (!codes.every(code => code === 404)) throw new Error(`B2E_BLOCKED: stub did not reject unexpected requests (${codes.join(',')}).`);
    state.phase = 'run';

    const nextPort = await freePort();
    if (await portOpen(nextPort)) throw new Error('B2E_BLOCKED: fresh server port is already in use.');
    const baseOrigin = `http://localhost:${nextPort}`;
    const nodeOptions = `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + ' ' : ''}--require "${__filename.replace(/\\/g, '/')}"`;
    const env = {
      ...scrubbedEnv(),
      NODE_OPTIONS: nodeOptions,
      NEXTAUTH_URL: origin,
      AUTH_URL: baseOrigin,
      GOVERNANCE_ENGINE_ENABLED: 'false',
      GOVERNANCE_ENGINE_URL: 'http://127.0.0.1:1',
      CVF_SERVICE_TOKEN: SYNTHETIC_TOKEN,
      CVF_PLAYWRIGHT_PORT: String(nextPort),
      CVF_B2E_HARNESS: '1',
      CVF_B2E_STUB_ORIGIN: origin,
      CVF_B2E_STUB_LOG: stubLog,
      CVF_B2E_PRELOAD_LOG: preloadLog,
      CVF_B2E_SYNTHETIC_TOKEN: SYNTHETIC_TOKEN,
    };
    console.log(`B2E_HARNESS_START ${JSON.stringify({ stubOrigin: origin, baseOrigin, selftestCodes: codes })}`);

    const cli = require.resolve('@playwright/test/cli', { paths: [WEB_ROOT] });
    const child = spawn(process.execPath, [cli, 'test', '-c', CONFIG_REL, SPEC_REL, '--reporter=line', '--output', path.join(realTmp, 'pw-output')], {
      cwd: WEB_ROOT, env, stdio: 'inherit',
    });
    const playwrightExit = await new Promise(resolve => child.on('exit', code => resolve(code === null ? 1 : code)));

    const stubEntries = readLines(stubLog).filter(entry => entry.event === 'stub_request');
    const pre = readLines(preloadLog);
    const last = new Map();
    for (const entry of pre) if (entry.argvTail && (entry.argvTail.includes('start-server.js') || /^next-server/.test(entry.title || ''))) last.set(`${entry.pid}:${entry.threadId}`, entry);
    Object.assign(summary, {
      playwrightExit,
      stub: {
        preflightRequests: stubEntries.filter(e => e.phase === 'preflight').length,
        runExpected: stubEntries.filter(e => e.phase === 'run' && e.expected).length,
        runUnexpected: stubEntries.filter(e => e.phase === 'run' && !e.expected).length,
        runRequests: stubEntries.filter(e => e.phase === 'run').map(e => ({ caseId: e.caseId, requestId: e.requestId, artifactId: e.artifactId, excerptLength: e.excerptLength, tokenHeaderPresent: e.tokenHeaderPresent, tokenHeaderIsSynthetic: e.tokenHeaderIsSynthetic, status: e.status })),
      },
      preload: {
        serverContexts: last.size,
        evaluateFetches: pre.filter(e => e.event === 'evaluate_fetch').length,
        disallowedEvaluateFetches: pre.filter(e => e.event === 'evaluate_fetch' && !e.allowed).length,
        nextGovernanceHits: pre.filter(e => e.event === 'next_governance_hit').length,
      },
    });
    exitCode = playwrightExit;
    if (summary.stub.runUnexpected !== 0 || summary.preload.disallowedEvaluateFetches !== 0 || summary.preload.nextGovernanceHits !== 0) exitCode = exitCode || 3;
  } catch (error) {
    summary.blocked = String(error && error.message ? error.message : error);
    console.error(`B2E_HARNESS_BLOCKED ${summary.blocked}`);
    exitCode = 4;
  } finally {
    await new Promise(resolve => server.close(() => resolve()));
    fs.rmSync(realTmp, { recursive: true, force: true });
    summary.cleanup = { disposableDirRemoved: !fs.existsSync(realTmp), stubClosed: !server.listening };
    if (!summary.cleanup.disposableDirRemoved) exitCode = exitCode || 5;
    console.log(`B2E_HARNESS_SUMMARY ${JSON.stringify(summary)}`);
  }
  return exitCode;
}

if (require.main === module) {
  main().then(code => { process.exitCode = code; }, error => { console.error(error); process.exitCode = 1; });
} else {
  installPreload();
}
