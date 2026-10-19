import { test, expect } from '@playwright/test';
// Text Encoding Exception: Vietnamese product selectors and synthetic fixture use native characters.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { login } from './utils';

const baseUrl = 'http://localhost:3048';
const root = path.resolve(process.cwd(), '../../..', '.cvf/runtime/ncr-request-cancellation-20261014/worker-live');
const boundaryPath = path.resolve(__dirname, 'support/ncr-request-cancellation-boundary.cjs');
const logPath = path.join(root, 'boundary-attempt1.jsonl');
const recordPath = path.join(root, 'runtime-proof-attempt1.json');
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
type Event = { event: string; attempt?: number; processedEnv?: boolean; wrapperActive?: boolean; envStates?: Record<string, string>; checks?: Record<string, boolean>; destination?: string; host?: string; pathname?: string };
const events = (): Event[] => existsSync(logPath) ? readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as Event) : [];
const attempts = () => events().filter(event => event.event === 'provider_attempt');

function serverEnv() {
  const lines = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)
    .filter(line => /^\s*(?:export\s+)?DASHSCOPE_API_KEY\s*=/.test(line));
  if (lines.length !== 1) throw new Error('NCR_CANCEL_FILE_DASHSCOPE_ALIAS_CARDINALITY');
  const key = lines[0].split('=').slice(1).join('=').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error('NCR_CANCEL_FILE_DASHSCOPE_ALIAS_FORMAT');
  const env: NodeJS.ProcessEnv = { ...process.env,
    DASHSCOPE_API_KEY: key, ALIBABA_API_KEY: '', CVF_BENCHMARK_ALIBABA_KEY: '', CVF_ALIBABA_API_KEY: '',
    OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '', GOOGLE_API_KEY: '', GOOGLE_AI_API_KEY: '',
    OPENROUTER_API_KEY: '', DEEPSEEK_API_KEY: '', NEXT_PUBLIC_GEMINI_API_KEY: '',
    UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '',
    NEXT_PUBLIC_CVF_MOCK_AI: '0', NEXTAUTH_URL: '', AUTH_URL: baseUrl, AUTH_TRUST_HOST: 'true',
    NEXT_DIST_DIR: '.next-cvf-ncr-request-cancellation-worker-20261014', NEXT_TELEMETRY_DISABLED: '1',
    CVF_STORAGE_ADAPTER_TYPE: 'file', CVF_RATE_LIMIT_STORE: 'memory',
    CVF_NCR_CANCEL_BOUNDARY_SERVER: '1', CVF_NCR_CANCEL_BOUNDARY_LOG: logPath, CVF_NCR_CANCEL_CALL_CAP: '2',
    CVF_NCR_CANCEL_RUNTIME_ROOT: root,
    CVF_NCR_CANCEL_EXECUTION_HEAD: 'c3ac310aeb53d51a7fe1212639429a3bcf2d19ad',
    NODE_OPTIONS: `--require "${boundaryPath.replace(/\\/g, '/')}"`,
  };
  const stores: Record<string, string> = {
    CVF_CONTROL_PLANE_EVENTS_PATH: 'events.json', CVF_POLICY_SNAPSHOT_DIR: 'policy-snapshots',
    KNOWLEDGE_STORE_PATH: 'knowledge.json', APPROVAL_STORE_PATH: 'approvals.json',
    CVF_DURABLE_MEMORY_STORE_PATH: 'memory.json', CVF_SOT3_ACTIVATION_EVIDENCE_PATH: 'sot3.json',
  };
  for (const [name, filename] of Object.entries(stores)) env[name] = path.join(root, filename);
  return { env, stores };
}

async function waitForServer(up: boolean, timeoutMs: number) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    let reachable = false;
    try { const response = await fetch(baseUrl + '/login', { signal: AbortSignal.timeout(3000) }); reachable = response.status > 0; }
    catch { /* server is starting or stopped */ }
    if (reachable === up) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(up ? 'NCR_CANCEL_OWNED_SERVER_START_TIMEOUT' : 'NCR_CANCEL_OWNED_SERVER_STOP_TIMEOUT');
}

function startServer(env: NodeJS.ProcessEnv, phase: string): ChildProcess {
  const nextBin = require.resolve('next/dist/bin/next');
  const logFd = openSync(path.join(root, `server-${phase}.log`), 'a');
  let server: ChildProcess;
  try {
    server = spawn(process.execPath, [nextBin, 'dev', '--webpack', '--hostname', 'localhost', '--port', '3048'], {
      cwd: process.cwd(), env, stdio: ['ignore', logFd, logFd], windowsHide: true,
    });
  } finally { closeSync(logFd); }
  if (!server.pid) throw new Error('NCR_CANCEL_SERVER_PID_MISSING');
  return server;
}

async function stopServer(server: ChildProcess) {
  if (!server.pid) throw new Error('NCR_CANCEL_OWNED_PID_MISSING');
  if (process.platform === 'win32') {
    const stopped = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    if (stopped.status !== 0 && server.exitCode === null) throw new Error('NCR_CANCEL_OWNED_SERVER_STOP_FAILED');
  } else server.kill('SIGTERM');
  await waitForServer(false, 20_000);
}

test('one real positive root then browser Stop aborts a paid pending Alibaba call', async ({ page, browser }) => {
  test.setTimeout(360_000);
  expect(browser.browserType().name()).toBe('chromium');
  if (Date.now() >= Date.parse('2026-10-14T03:30:00Z')) throw new Error('NCR_CANCEL_GRANT_EXPIRED');
  if (existsSync(logPath) || existsSync(recordPath) || existsSync(logPath + '.count')) throw new Error('NCR_CANCEL_LIVE_ALREADY_ATTEMPTED');
  mkdirSync(root, { recursive: true });
  mkdirSync(path.join(root, 'policy-snapshots'), { recursive: true });
  writeFileSync(path.join(root, 'knowledge.json'), '[]');
  writeFileSync(path.join(root, 'approvals.json'), '[]');
  writeFileSync(path.join(root, 'memory.json'), '[]');
  writeFileSync(path.join(root, 'sot3.json'), '[]');
  writeFileSync(path.join(root, 'events.json'), '[]');
  const armFile = path.join(root, 'arm-cancel.flag');
  const { env, stores } = serverEnv();
  env.CVF_NCR_CANCEL_ARM_FILE = armFile;
  const server = startServer(env, 'only');
  let executePosts = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/execute' && request.method() === 'POST') executePosts++;
  });
  try {
    await waitForServer(true, 110_000);
    await expect.poll(() => events().some(event => event.event === 'profile_verified' && Object.values(event.checks ?? {}).every(Boolean)), { timeout: 20_000 }).toBe(true);
    const profile = events().find(event => event.processedEnv && event.wrapperActive)?.envStates;
    expect(profile?.DASHSCOPE_API_KEY).toBe('SET');
    for (const name of ['ALIBABA_API_KEY', 'OPENAI_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) expect(profile?.[name]).not.toBe('SET');
    for (const name of Object.keys(stores)) expect(profile?.[name]).toBe('SET');
    expect(attempts()).toHaveLength(0);
    await page.addInitScript(() => {
      localStorage.setItem('cvf_settings', JSON.stringify({
        providers: { alibaba: { apiKey: '', enabled: true, selectedModel: 'qwen-flash' } },
        preferences: { defaultProvider: 'alibaba', defaultExportMode: 'governance', defaultLanguage: 'vi',
          autoSaveHistory: true, showWelcomeTour: false, analyticsEnabled: false },
      }));
      localStorage.setItem('cvf_language', 'vi');
      localStorage.setItem('cvf_onboarding_complete', 'true');
      localStorage.setItem('cvf_onboarding_seen', '1');
      localStorage.setItem('cvf_setup_banner_dismissed', 'true');
    });
    await login(page);
    const fillStrategy = async () => {
      await page.getByRole('button', { name: /Strategy Analysis|Phân tích Chiến lược/i }).first().click();
      await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Kế hoạch hội sách cộng đồng giả định');
      await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill('Thư viện hư cấu có một phòng, bốn tình nguyện viên, hội sách hai ngày cuối tuần. Trả lời tiếng Việt tối đa 180 từ; mỗi mục bắt buộc một câu ngắn, SWOT và lựa chọn dạng bảng ngắn, một rủi ro, một khuyến nghị, tiêu chí và bước tiếp theo. Chỉ dùng dữ kiện giả định này.');
    };
    await fillStrategy();
    const positiveResponsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/execute' && response.request().method() === 'POST', { timeout: 210_000 });
    await page.getByRole('button', { name: 'Tạo kết quả' }).click();
    const positiveResponse = await positiveResponsePromise;
    const positive = await positiveResponse.json() as Record<string, unknown>;
    const receipt = positive.governanceEvidenceReceipt as Record<string, unknown> | undefined;
    expect(positiveResponse.status()).toBe(200);
    expect(positive.success).toBe(true);
    expect(receipt).toMatchObject({ decision: 'ALLOW', provider: 'alibaba', model: 'qwen-flash', evidenceMode: 'live', knowledgeInjected: false, knowledgeChunkCount: 0 });
    expect(attempts()).toHaveLength(1);
    expect(executePosts).toBe(1);
    await page.goto('/home');
    writeFileSync(armFile, 'armed');
    await fillStrategy();
    await page.getByRole('button', { name: 'Tạo kết quả' }).click();
    await expect.poll(() => events().some(event => event.event === 'cancel_fetch_held'), { timeout: 110_000 }).toBe(true);
    expect(attempts()).toHaveLength(2);
    await page.getByRole('button', { name: 'Hủy' }).click();
    await expect.poll(() => events().some(event => event.event === 'cancel_fetch_signal_aborted'), { timeout: 30_000 }).toBe(true);
    await expect(page.getByTestId('w119-evidence-receipt')).toHaveCount(0);
    expect(executePosts).toBe(2);
    expect(attempts()).toHaveLength(2);
    expect(events().filter(event => event.event === 'provider_attempt_denied')).toHaveLength(0);
    const unexpectedDenials = events().filter(event => event.event === 'fetch_denied' && !(
      (event.host === 'registry.npmjs.org' && event.pathname === '/-/package/next/dist-tags') ||
      (event.host === 'telemetry.nextjs.org' && event.pathname === '/api/v1/record')));
    expect(unexpectedDenials).toHaveLength(0);
    writeFileSync(recordPath, JSON.stringify({ status: 'LOCAL_REQUEST_CANCELLATION_PASS',
      sourceHead: process.env.CVF_NCR_CANCEL_EXECUTION_HEAD,
      positive: { status: positiveResponse.status(), success: true, decision: receipt!.decision,
        provider: receipt!.provider, model: receipt!.model, evidenceMode: receipt!.evidenceMode,
        receiptId: receipt!.receiptId, outputSha256: digest(String(positive.output)) },
      cancelled: { paidFetchPendingBeforeStop: true, composedSignalAbortedAfterStop: true,
        noSuccessReceiptOrOutputPublished: true, remoteProviderStopOrBilling: 'UNKNOWN' },
      profile: { port: 3048, browser: 'chromium', fileDashscopeOnly: true, browserKeyEmpty: true,
        mockValue: '0', ownedStores: Object.keys(stores), processedChecks: true },
      counts: { uiSubmissions: 2, executePosts, providerFetchStarts: attempts().length, cap: 2,
        unexpectedDenials: unexpectedDenials.length, retries: 0 },
    }, null, 2) + '\n');
  } finally { await stopServer(server); }
});
