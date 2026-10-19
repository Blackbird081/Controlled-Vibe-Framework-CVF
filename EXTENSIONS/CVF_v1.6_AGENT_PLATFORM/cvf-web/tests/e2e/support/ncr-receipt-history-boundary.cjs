'use strict';
/* eslint-disable @typescript-eslint/no-require-imports */

// This owned file is the Playwright config and, only in the spawned Next server,
// a test-only fetch observer. It never records keys, headers or request bodies.
const path = require('node:path');
const fs = require('node:fs');

function fileDashscopeKey() {
  const file = path.resolve(__dirname, '../../..', '.env.local');
  const matches = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    .filter(line => /^\s*(?:export\s+)?DASHSCOPE_API_KEY\s*=/.test(line));
  if (matches.length !== 1) throw new Error('NCR_RECEIPT_FILE_KEY_CARDINALITY');
  const value = matches[0].split('=').slice(1).join('=').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('NCR_RECEIPT_FILE_KEY_FORMAT');
  return value;
}

if (process.env.CVF_NCR_RECEIPT_BOUNDARY_SERVER === '1') {
  const logPath = process.env.CVF_NCR_RECEIPT_BOUNDARY_LOG;
  const cap = Number(process.env.CVF_NCR_RECEIPT_CALL_CAP);
  if (!logPath || !path.isAbsolute(logPath) || cap !== 3) throw new Error('NCR_RECEIPT_BOUNDARY_PROFILE_INVALID');
  const countPath = logPath + '.count';
  const lockPath = logPath + '.lock';
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== 'function') throw new Error('NCR_RECEIPT_FETCH_MISSING');
  const names = ['DASHSCOPE_API_KEY','ALIBABA_API_KEY','CVF_BENCHMARK_ALIBABA_KEY','CVF_ALIBABA_API_KEY',
    'OPENAI_API_KEY','ANTHROPIC_API_KEY','GEMINI_API_KEY','GOOGLE_API_KEY','GOOGLE_AI_API_KEY',
    'OPENROUTER_API_KEY','DEEPSEEK_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_CVF_MOCK_AI','AUTH_URL','NEXTAUTH_URL','NEXT_DIST_DIR','CVF_CONTROL_PLANE_EVENTS_PATH',
    'CVF_POLICY_SNAPSHOT_DIR','KNOWLEDGE_STORE_PATH','APPROVAL_STORE_PATH',
    'CVF_DURABLE_MEMORY_STORE_PATH','CVF_SOT3_ACTIVATION_EVIDENCE_PATH'];
  const state = name => process.env[name] === undefined ? 'UNSET' : process.env[name] === '' ? 'EMPTY' : 'SET';
  const append = event => fs.appendFileSync(logPath, JSON.stringify({ at: Date.now(), pid: process.pid, ...event }) + '\n');
  let profileVerified = false;
  function verifyProcessedProfile(force = false) {
    if (profileVerified && !force) return;
    if (process.env.__NEXT_PROCESSED_ENV !== 'true') {
      if (force) throw new Error('NCR_RECEIPT_PAID_FETCH_UNPROCESSED_ENV');
      return;
    }
    const ownedRoot = path.resolve(process.env.CVF_NCR_RECEIPT_RUNTIME_ROOT || '');
    const paths = ['CVF_CONTROL_PLANE_EVENTS_PATH','CVF_POLICY_SNAPSHOT_DIR',
      'KNOWLEDGE_STORE_PATH','APPROVAL_STORE_PATH','CVF_DURABLE_MEMORY_STORE_PATH',
      'CVF_SOT3_ACTIVATION_EVIDENCE_PATH'];
    const aliases = ['ALIBABA_API_KEY','CVF_BENCHMARK_ALIBABA_KEY','CVF_ALIBABA_API_KEY',
      'OPENAI_API_KEY','ANTHROPIC_API_KEY','GEMINI_API_KEY','GOOGLE_API_KEY','GOOGLE_AI_API_KEY',
      'OPENROUTER_API_KEY','DEEPSEEK_API_KEY','NEXT_PUBLIC_GEMINI_API_KEY',
      'UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN'];
    const checks = {
      fileDashscopeOnly: process.env.DASHSCOPE_API_KEY === fileDashscopeKey() && aliases.every(name => process.env[name] === ''),
      exactAuth: process.env.AUTH_URL === 'http://localhost:3046' && process.env.NEXTAUTH_URL === '',
      exactDist: process.env.NEXT_DIST_DIR === '.next-cvf-ncr-receipt-history-worker-20261014',
      mockZero: process.env.NEXT_PUBLIC_CVF_MOCK_AI === '0',
      fileAndMemory: process.env.CVF_STORAGE_ADAPTER_TYPE === 'file' && process.env.CVF_RATE_LIMIT_STORE === 'memory',
      ownedPaths: paths.every(name => path.isAbsolute(process.env[name] || '') && path.resolve(process.env[name]).startsWith(ownedRoot + path.sep)),
      emptyKnowledgeApproval: ['KNOWLEDGE_STORE_PATH','APPROVAL_STORE_PATH'].every(name => {
        try { return JSON.stringify(JSON.parse(fs.readFileSync(process.env[name], 'utf8'))) === '[]'; }
        catch { return false; }
      }),
    };
    append({ event: 'profile_verified', checks });
    if (Object.values(checks).some(value => !value)) throw new Error('NCR_RECEIPT_PROCESSED_PROFILE_INVALID');
    profileVerified = true;
  }
  const reserve = () => {
    const wait = new Int32Array(new SharedArrayBuffer(4));
    const until = Date.now() + 2000;
    while (true) {
      try { fs.mkdirSync(lockPath); break; }
      catch (error) {
        if (error.code !== 'EEXIST' || Date.now() >= until) throw new Error('NCR_RECEIPT_LOCK_FAILED');
        Atomics.wait(wait, 0, 0, 20);
      }
    }
    try {
      const used = fs.existsSync(countPath) ? Number(fs.readFileSync(countPath, 'utf8')) : 0;
      if (!Number.isInteger(used) || used < 0 || used >= cap) {
        append({ event: 'provider_attempt_denied', used, cap });
        throw new Error('NCR_RECEIPT_CALL_CAP_EXCEEDED');
      }
      fs.writeFileSync(countPath, String(used + 1));
      return used + 1;
    } finally { fs.rmdirSync(lockPath); }
  };
  function boundaryFetch(input, init) {
    let url;
    try { url = new URL(typeof input === 'string' ? input : input.url); }
    catch { append({ event: 'fetch_denied', destination: 'invalid_url' }); throw new Error('NCR_RECEIPT_FETCH_DENIED'); }
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    if (url.protocol === 'https:' && url.hostname === 'dashscope-intl.aliyuncs.com' &&
        url.pathname === '/compatible-mode/v1/chat/completions' && method === 'POST') {
      verifyProcessedProfile(true);
      const attempt = reserve();
      append({ event: 'provider_attempt', attempt, host: url.hostname, pathname: url.pathname, method });
      return originalFetch.apply(this, arguments);
    }
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        (url.protocol === 'http:' || url.protocol === 'https:')) return originalFetch.apply(this, arguments);
    append({ event: 'fetch_denied', destination: 'unexpected', host: url.hostname, pathname: url.pathname, method });
    throw new Error('NCR_RECEIPT_FETCH_DENIED');
  }
  globalThis.fetch = boundaryFetch;
  verifyProcessedProfile();
  append({ event: 'startup', processedEnv: process.env.__NEXT_PROCESSED_ENV === 'true',
    wrapperActive: globalThis.fetch === boundaryFetch,
    envStates: Object.fromEntries(names.map(name => [name, state(name)])) });
  const timer = setInterval(() => {
    verifyProcessedProfile();
    append({ event: 'state', processedEnv: process.env.__NEXT_PROCESSED_ENV === 'true',
      wrapperActive: globalThis.fetch === boundaryFetch,
      envStates: Object.fromEntries(names.map(name => [name, state(name)])) });
  }, 500);
  timer.unref();
} else {
  const { defineConfig } = require('@playwright/test');
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(path.resolve(__dirname, '../../..'), true, { info: () => {}, error: () => { throw new Error('NCR_RECEIPT_ENV_LOAD_FAILED'); } });
  module.exports = defineConfig({
    testDir: path.resolve(__dirname, '..'),
    testMatch: 'ncr-receipt-history.live.spec.ts',
    workers: 1,
    retries: 0,
    timeout: 360_000,
    expect: { timeout: 30_000 },
    use: { baseURL: 'http://localhost:3046', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  });
}
