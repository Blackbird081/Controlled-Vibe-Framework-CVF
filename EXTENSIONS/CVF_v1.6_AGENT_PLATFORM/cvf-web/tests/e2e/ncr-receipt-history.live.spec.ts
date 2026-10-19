import { test, expect } from '@playwright/test';
// Text Encoding Exception: Vietnamese product selectors and synthetic fixture use native characters.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { login } from './utils';

const baseUrl = 'http://localhost:3046';
const root = path.resolve(process.cwd(), '../../..', '.cvf/runtime/ncr-receipt-history-20261014/worker-live');
const boundaryPath = path.resolve(__dirname, 'support/ncr-receipt-history-boundary.cjs');
const logPath = path.join(root, 'boundary-attempt3.jsonl');
const recordPath = path.join(root, 'runtime-proof-attempt3.json');
const priorBoundaryPath = path.join(root, 'boundary.jsonl');
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
type Event = { event: string; attempt?: number; processedEnv?: boolean; wrapperActive?: boolean; envStates?: Record<string, string>; checks?: Record<string, boolean>; destination?: string; host?: string; pathname?: string };
const events = (): Event[] => existsSync(logPath) ? readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as Event) : [];
const attempts = () => events().filter(event => event.event === 'provider_attempt');

function serverEnv() {
  const lines = readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)
    .filter(line => /^\s*(?:export\s+)?DASHSCOPE_API_KEY\s*=/.test(line));
  if (lines.length !== 1) throw new Error('NCR_RECEIPT_FILE_DASHSCOPE_ALIAS_CARDINALITY');
  const key = lines[0].split('=').slice(1).join('=').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error('NCR_RECEIPT_FILE_DASHSCOPE_ALIAS_FORMAT');
  const env: NodeJS.ProcessEnv = { ...process.env,
    DASHSCOPE_API_KEY: key, ALIBABA_API_KEY: '', CVF_BENCHMARK_ALIBABA_KEY: '', CVF_ALIBABA_API_KEY: '',
    OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '', GOOGLE_API_KEY: '', GOOGLE_AI_API_KEY: '',
    OPENROUTER_API_KEY: '', DEEPSEEK_API_KEY: '', NEXT_PUBLIC_GEMINI_API_KEY: '',
    UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '',
    NEXT_PUBLIC_CVF_MOCK_AI: '0', NEXTAUTH_URL: '', AUTH_URL: baseUrl, AUTH_TRUST_HOST: 'true',
    NEXT_DIST_DIR: '.next-cvf-ncr-receipt-history-worker-20261014', NEXT_TELEMETRY_DISABLED: '1',
    CVF_STORAGE_ADAPTER_TYPE: 'file', CVF_RATE_LIMIT_STORE: 'memory',
    CVF_NCR_RECEIPT_BOUNDARY_SERVER: '1', CVF_NCR_RECEIPT_BOUNDARY_LOG: logPath, CVF_NCR_RECEIPT_CALL_CAP: '3',
    CVF_NCR_RECEIPT_RUNTIME_ROOT: root,
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
  throw new Error(up ? 'NCR_RECEIPT_OWNED_SERVER_START_TIMEOUT' : 'NCR_RECEIPT_OWNED_SERVER_STOP_TIMEOUT');
}

function startServer(env: NodeJS.ProcessEnv, phase: string): ChildProcess {
  const nextBin = require.resolve('next/dist/bin/next');
  const logFd = openSync(path.join(root, `server-${phase}.log`), 'a');
  let server: ChildProcess;
  try {
    server = spawn(process.execPath, [nextBin, 'dev', '--webpack', '--hostname', 'localhost', '--port', '3046'], {
      cwd: process.cwd(), env, stdio: ['ignore', logFd, logFd], windowsHide: true,
    });
  } finally { closeSync(logFd); }
  if (!server.pid) throw new Error('NCR_RECEIPT_SERVER_PID_MISSING');
  return server;
}

async function stopServer(server: ChildProcess) {
  if (!server.pid) throw new Error('NCR_RECEIPT_OWNED_PID_MISSING');
  if (process.platform === 'win32') {
    const stopped = spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    if (stopped.status !== 0 && server.exitCode === null) throw new Error('NCR_RECEIPT_OWNED_SERVER_STOP_FAILED');
  } else server.kill('SIGTERM');
  await waitForServer(false, 20_000);
}

test('one real Home root retains its saved receipt through reload, owned restart and Markdown', async ({ page, browser }) => {
  test.setTimeout(360_000);
  expect(browser.browserType().name()).toBe('chromium');
  if (existsSync(priorBoundaryPath)) {
    const prior = readFileSync(priorBoundaryPath, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as Event);
    if (prior.some(event => event.event === 'provider_attempt')) throw new Error('NCR_RECEIPT_PRIOR_PROVIDER_EFFECT_NONZERO');
  }
  if (existsSync(priorBoundaryPath + '.count')) throw new Error('NCR_RECEIPT_PRIOR_COUNTER_PRESENT');
  if (existsSync(logPath) || existsSync(recordPath) || existsSync(logPath + '.count')) throw new Error('NCR_RECEIPT_LIVE_ALREADY_ATTEMPTED_NO_BLIND_RERUN');
  mkdirSync(root, { recursive: true });
  mkdirSync(path.join(root, 'policy-snapshots'), { recursive: true });
  writeFileSync(path.join(root, 'knowledge.json'), '[]');
  writeFileSync(path.join(root, 'approvals.json'), '[]');
  const { env, stores } = serverEnv();
  let server = startServer(env, 'first');
  let serverRunning = true;
  let executePosts = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/execute' && request.method() === 'POST') executePosts++;
  });
  try {
    await waitForServer(true, 110_000);
    await expect.poll(() => events().some(event => event.processedEnv && event.wrapperActive), { timeout: 20_000 }).toBe(true);
    await expect.poll(() => events().some(event => event.event === 'profile_verified' && Object.values(event.checks ?? {}).every(Boolean)), { timeout: 20_000 }).toBe(true);
    const profile = events().find(event => event.processedEnv && event.wrapperActive)?.envStates;
    expect(profile?.DASHSCOPE_API_KEY).toBe('SET');
    for (const name of ['ALIBABA_API_KEY','OPENAI_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN']) expect(profile?.[name]).not.toBe('SET');
    for (const name of Object.keys(stores)) expect(profile?.[name]).toBe('SET');
    expect(readFileSync(path.join(root, 'knowledge.json'), 'utf8')).toBe('[]');
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
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cvf_settings') ?? '{}').providers.alibaba.apiKey)).toBe('');
    await page.getByRole('button', { name: /Strategy Analysis|Phân tích Chiến lược/i }).first().click();
    await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Kế hoạch hội sách cộng đồng giả định');
    await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill('Thư viện hư cấu có một phòng, bốn tình nguyện viên, hội sách hai ngày cuối tuần. Trả lời tiếng Việt tối đa 180 từ; mỗi mục bắt buộc một câu ngắn, SWOT và lựa chọn dạng bảng ngắn, một rủi ro, một khuyến nghị, tiêu chí và bước tiếp theo. Chỉ dùng dữ kiện giả định này.');
    const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/api/execute' && response.request().method() === 'POST', { timeout: 210_000 });
    await page.getByRole('button', { name: 'Tạo kết quả' }).click();
    const response = await responsePromise;
    const body = await response.json() as Record<string, unknown>;
    const receipt = body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.output).toBe('string');
    const output = body.output as string;
    expect(output.trim().length).toBeGreaterThan(0);
    expect(receipt?.receiptId).toBeTruthy();
    expect(receipt?.evidenceMode).toBe('live');
    expect(receipt?.provider).toBe('alibaba');
    expect(receipt?.model).toBe('qwen-flash');
    expect(receipt?.decision).toBe('ALLOW');
    expect(receipt?.knowledgeInjected).toBe(false);
    expect(receipt?.knowledgeChunkCount).toBe(0);
    expect((body.knowledgeInjection as Record<string, unknown> | undefined)?.chunkCount).toBe(0);
    await expect(page.getByTestId('w119-evidence-receipt')).toBeVisible();
    expect(executePosts).toBe(1);
    await expect.poll(() => attempts().length).toBeGreaterThanOrEqual(1);
    expect(attempts().length).toBeLessThanOrEqual(3);

    const runId = await page.evaluate((expected: string) => {
      const records = JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}').state?.executions ?? [];
      return records.find((entry: { output?: string }) => entry.output === expected)?.id as string | undefined;
    }, output);
    expect(runId).toBeTruthy();
    await expect.poll(async () => page.evaluate((id: string) => {
      const records = JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}').state?.executions ?? [];
      return records.find((entry: { id: string }) => entry.id === id)?.savedReceiptArchive?.receipt?.receiptId;
    }, runId!)).toBe(receipt!.receiptId);
    const stored = await page.evaluate((id: string) => {
      const records = JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}').state?.executions ?? [];
      return records.find((entry: { id: string }) => entry.id === id);
    }, runId!);
    expect(stored.output).toBe(output);
    expect(stored.savedReceiptArchive.executionId).toBe(runId);
    expect(stored.savedReceiptArchive.outputSha256).toBe(digest(output));
    expect(stored.evidenceReceiptSnapshot.receiptId).toBe(receipt!.receiptId);
    await page.goto(`/home?result=${encodeURIComponent(runId!)}`);
    await expect(page.getByTestId('saved-receipt-origin')).toBeVisible();
    await expect(page.getByTestId('w119-evidence-receipt')).toContainText(String(receipt!.receiptId));
    expect(executePosts).toBe(1);
    expect(attempts().length).toBeLessThanOrEqual(3);

    await stopServer(server);
    serverRunning = false;
    server = startServer(env, 'restart');
    serverRunning = true;
    await waitForServer(true, 110_000);
    await page.goto(`/home?result=${encodeURIComponent(runId!)}`);
    await expect(page.getByTestId('saved-receipt-origin')).toBeVisible();
    await expect(page.getByTestId('w119-evidence-receipt')).toContainText(String(receipt!.receiptId));
    await page.getByRole('button', { name: /Export$/ }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download \.md|Tải xuống \.md/i }).click()]);
    const raw = readFileSync((await download.path())!);
    const markdown = raw.toString('utf8');
    const cleanOutput = output.replace(/\n---\n\*Generated by CVF.*\*/g, '').trim();
    expect(markdown).toContain(cleanOutput);
    expect(markdown).toContain(String(receipt!.receiptId));
    expect(markdown).toMatch(/Saved local history/i);
    expect(markdown).toContain('Original evidence mode: live');

    const originalStorage = await page.evaluate(() => localStorage.getItem('cvf-executions-storage')!);
    for (const mutation of ['output', 'id', 'malformed'] as const) {
      await page.evaluate(({ original, id, kind }) => {
        const store = JSON.parse(original);
        const entry = store.state.executions.find((item: { id: string }) => item.id === id);
        if (kind === 'output') entry.output += ' altered';
        if (kind === 'id') entry.savedReceiptArchive.executionId = 'wrong-run';
        if (kind === 'malformed') entry.savedReceiptArchive.receipt.evidenceMode = 'upgraded';
        localStorage.setItem('cvf-executions-storage', JSON.stringify(store));
      }, { original: originalStorage, id: runId!, kind: mutation });
      await page.reload();
      await expect(page.getByTestId('saved-receipt-origin')).toHaveCount(0);
      await expect(page.getByTestId('w119-evidence-receipt')).toHaveCount(0);
      expect(executePosts).toBe(1);
      expect(attempts().length).toBeLessThanOrEqual(3);
    }
    const providerCount = attempts().length;
    expect(providerCount).toBeGreaterThanOrEqual(1);
    expect(providerCount).toBeLessThanOrEqual(3);
    expect(events().filter(event => event.event === 'provider_attempt_denied')).toHaveLength(0);
    const unexpectedDenials = events().filter(event => event.event === 'fetch_denied' && !(
      (event.host === 'registry.npmjs.org' && event.pathname === '/-/package/next/dist-tags') ||
      (event.host === 'telemetry.nextjs.org' && event.pathname === '/api/v1/record')));
    expect(unexpectedDenials).toHaveLength(0);
    writeFileSync(recordPath, JSON.stringify({
      status: 'STRICT_RECEIPT_HISTORY_PASS', sourceHead: process.env.CVF_NCR_RECEIPT_EXECUTION_HEAD,
      profile: { port: 3046, browser: 'chromium', credentialAlias: 'DASHSCOPE_API_KEY', browserKeyEmpty: true,
        ownedStoreNames: Object.keys(stores), processedServer: true, mockValue: '0', knowledgeChunks: 0,
        fileAliasMatched: true, otherProviderAndRedisAliasesBlank: true },
      root: { httpStatus: response.status(), success: true, decision: receipt!.decision, provider: receipt!.provider,
        model: receipt!.model, evidenceMode: receipt!.evidenceMode, receiptId: receipt!.receiptId,
        runId, outputSha256: digest(output), outputLength: output.length },
      archive: { schemaVersion: stored.savedReceiptArchive.schemaVersion, executionId: runId,
        outputSha256: stored.savedReceiptArchive.outputSha256, reloadVisible: true, restartVisible: true },
      markdown: { filename: download.suggestedFilename(), byteCount: raw.length, sha256: digest(raw),
        exactCleanOutputContained: true, receiptContained: true, savedOriginContained: true },
      negatives: { output: 'receipt_omitted', id: 'receipt_omitted', malformed: 'receipt_omitted' },
      counts: { executePosts, providerFetchStarts: providerCount, additionalCeiling: 3,
        classifiedFrameworkDenials: events().filter(event => event.event === 'fetch_denied').length,
        unexpectedDenials: unexpectedDenials.length },
    }, null, 2) + '\n');
  } finally {
    if (serverRunning) await stopServer(server);
  }
});
