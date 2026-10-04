'use strict';

/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS preload loaded through NODE_OPTIONS --require */

// NCR HTML B2d test-only no-hop preload. Install with NODE_OPTIONS=--require <this file> before the
// fresh Next test server starts. It wraps global fetch, synchronously records and throws on any
// attempted governance-evaluate fetch before network dispatch, and appends startup/state/attempt
// lines to a disposable log outside the repository. It never records headers, tokens or bodies.
// Claim boundary: test harness only; it proves nothing about production governance behavior.

const fs = require('node:fs');
const path = require('node:path');
const { threadId } = require('node:worker_threads');

const LOG_PATH = process.env.CVF_B2D_NO_HOP_LOG;
const EVALUATE_PATH = '/api/governance/evaluate';

if (!LOG_PATH || !path.isAbsolute(LOG_PATH)) {
  // Fail closed: without an absolute log path the isolation cannot be evidenced.
  throw new Error('B2D_NO_HOP_PRELOAD_FAIL_CLOSED: CVF_B2D_NO_HOP_LOG must be an absolute path.');
}

function log(entry) {
  fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: Date.now(), pid: process.pid, threadId, ...entry }) + '\n');
}

let attemptCount = 0;
let otherFetchCount = 0;
const originalFetch = globalThis.fetch;

if (typeof originalFetch !== 'function') {
  throw new Error('B2D_NO_HOP_PRELOAD_FAIL_CLOSED: global fetch is not available to wrap.');
}

function urlOf(input) {
  if (typeof input === 'string') return input;
  if (input && typeof input.href === 'string') return input.href;
  if (input && typeof input.url === 'string') return input.url;
  return String(input);
}

function b2dNoHopFetch(input, init) {
  const url = urlOf(input);
  if (url.includes(EVALUATE_PATH)) {
    attemptCount += 1;
    // Path only; no origin, headers, tokens or body are logged.
    log({ event: 'attempt', blocked: true, method: String((init && init.method) || (input && input.method) || 'GET'), attemptCount });
    throw new Error('B2D_NO_HOP_BLOCKED: attempted governance evaluate fetch was blocked before network dispatch.');
  }
  otherFetchCount += 1;
  return originalFetch.apply(this, arguments);
}
Object.defineProperty(b2dNoHopFetch, '__b2dNoHop', { value: true });
globalThis.fetch = b2dNoHopFetch;

function envState(name) {
  const value = process.env[name];
  return value === undefined ? 'UNSET' : value === '' ? 'EMPTY' : 'SET';
}

function stateEntry(event) {
  return {
    event,
    argvTail: process.argv.slice(1).map(part => path.basename(String(part))),
    title: process.title,
    ppid: process.ppid,
    processedEnv: process.env.__NEXT_PROCESSED_ENV === 'true',
    nextauthUrl: envState('NEXTAUTH_URL'),
    fetchIsWrapper: globalThis.fetch === b2dNoHopFetch,
    nextOriginalIsWrapper: globalThis._nextOriginalFetch === b2dNoHopFetch,
    attemptCount,
    otherFetchCount,
  };
}

log(stateEntry('startup'));

let tick = 0;
const timer = setInterval(() => {
  tick += 1;
  log({ ...stateEntry('state'), tick });
}, 500);
timer.unref();

process.on('exit', () => {
  try {
    log(stateEntry('exit'));
  } catch {
    // The log is best effort at exit; earlier lines are the evidence.
  }
});
