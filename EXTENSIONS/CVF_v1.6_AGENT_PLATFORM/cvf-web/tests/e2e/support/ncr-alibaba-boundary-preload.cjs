'use strict';

// Test-only server fetch boundary. It records names/states and destination paths,
// never keys, headers or bodies. It does not claim OS-level network isolation.
const fs = require('node:fs');
const path = require('node:path');

const logPath = process.env.CVF_NCR_ALIBABA_BOUNDARY_LOG;
const maxCalls = Number(process.env.CVF_NCR_ALIBABA_CALL_CAP);
const priorCalls = Number(process.env.CVF_NCR_PRIOR_PROVIDER_CALLS);
if (!logPath || !path.isAbsolute(logPath) || maxCalls !== 2 || priorCalls !== 4) {
  throw new Error('NCR_ALIBABA_PRELOAD_PROFILE_INVALID');
}
const countPath = `${logPath}.count`;
const lockPath = `${logPath}.lock`;
const originalFetch = globalThis.fetch;
if (typeof originalFetch !== 'function') throw new Error('NCR_ALIBABA_PRELOAD_FETCH_UNAVAILABLE');

function append(entry) {
  fs.appendFileSync(logPath, JSON.stringify({ at: Date.now(), pid: process.pid, ...entry }) + '\n');
}
function state(name) {
  const value = process.env[name];
  return value === undefined ? 'UNSET' : value === '' ? 'EMPTY' : 'SET';
}
function snapshot() {
  const names = [
    'AUTH_URL', 'NEXTAUTH_URL', 'NEXT_DIST_DIR', 'CVF_STORAGE_ADAPTER_TYPE',
    'CVF_CONTROL_PLANE_EVENTS_PATH', 'CVF_POLICY_SNAPSHOT_DIR',
    'KNOWLEDGE_STORE_PATH', 'APPROVAL_STORE_PATH', 'CVF_DURABLE_MEMORY_STORE_PATH',
    'CVF_SOT3_ACTIVATION_EVIDENCE_PATH', 'CVF_RATE_LIMIT_STORE',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
    'ALIBABA_API_KEY', 'DASHSCOPE_API_KEY', 'CVF_BENCHMARK_ALIBABA_KEY',
    'CVF_ALIBABA_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY',
    'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY',
    'NEXT_PUBLIC_GEMINI_API_KEY',
  ];
  return Object.fromEntries(names.map(name => [name, state(name)]));
}
function inspect(event) {
  append({ event, processedEnv: process.env.__NEXT_PROCESSED_ENV === 'true',
    argvTail: process.argv.slice(1).map(value => path.basename(String(value))),
    wrapperActive: globalThis.fetch === boundaryFetch,
    nextOriginalIsWrapper: globalThis._nextOriginalFetch === boundaryFetch,
    envStates: snapshot() });
}
function urlOf(input) {
  return typeof input === 'string' ? input : input && typeof input.url === 'string' ? input.url : String(input);
}
function reserveCall() {
  const waitArray = new Int32Array(new SharedArrayBuffer(4));
  const until = Date.now() + 2000;
  while (true) {
    try { fs.mkdirSync(lockPath); break; }
    catch (error) {
      if (error.code !== 'EEXIST' || Date.now() >= until) throw new Error('NCR_ALIBABA_COUNTER_LOCK_FAILED');
      Atomics.wait(waitArray, 0, 0, 20);
    }
  }
  try {
    const used = fs.existsSync(countPath) ? Number(fs.readFileSync(countPath, 'utf8')) : 0;
    if (!Number.isInteger(used) || used < 0 || used >= maxCalls) {
      append({ event: 'provider_attempt_denied', used, freshCap: maxCalls, priorCalls, cumulativeCap: priorCalls + maxCalls });
      throw new Error('NCR_ALIBABA_CALL_CAP_EXCEEDED');
    }
    fs.writeFileSync(countPath, String(used + 1));
    return used + 1;
  } finally {
    fs.rmdirSync(lockPath);
  }
}
function boundaryFetch(input, init) {
  const raw = urlOf(input);
  let url;
  try { url = new URL(raw); }
  catch { append({ event: 'fetch_denied', destination: 'invalid_url' }); throw new Error('NCR_FETCH_DESTINATION_DENIED'); }
  const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
  if (url.pathname === '/api/governance/evaluate') {
    append({ event: 'fetch_denied', destination: 'governance_evaluate', method });
    throw new Error('NCR_GOVERNANCE_EVALUATE_HOP_DENIED');
  }
  if (url.hostname === 'dashscope-intl.aliyuncs.com'
      && url.protocol === 'https:'
      && url.pathname === '/compatible-mode/v1/chat/completions'
      && method === 'POST') {
    const attempt = reserveCall();
    append({ event: 'provider_attempt', provider: 'alibaba', method, host: url.hostname, pathname: url.pathname, freshAttempt: attempt, priorCalls, cumulativeAttempt: priorCalls + attempt, cumulativeCap: priorCalls + maxCalls });
    return originalFetch.apply(this, arguments);
  }
  if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && (url.protocol === 'http:' || url.protocol === 'https:')) {
    return originalFetch.apply(this, arguments);
  }
  append({ event: 'fetch_denied', destination: 'unexpected', method, host: url.hostname, pathname: url.pathname });
  throw new Error('NCR_FETCH_DESTINATION_DENIED');
}
Object.defineProperty(boundaryFetch, '__ncrAlibabaBoundary', { value: true });
globalThis.fetch = boundaryFetch;
inspect('startup');
const timer = setInterval(() => inspect('state'), 500);
timer.unref();
