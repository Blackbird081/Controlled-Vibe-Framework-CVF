import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { login } from './utils';

// Text Encoding Exception: these Vietnamese selectors are exact user-facing
// fixture labels on the selected strategy form.
const BOUNDARY_LOG = process.env.CVF_NCR_ALIBABA_BOUNDARY_LOG ?? '';
const RUNTIME_JSON = process.env.CVF_NCR_JOURNEY_RUNTIME_JSON ?? '';
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? '';
const ALIBABA_KEY_NAMES = ['ALIBABA_API_KEY', 'DASHSCOPE_API_KEY', 'CVF_BENCHMARK_ALIBABA_KEY', 'CVF_ALIBABA_API_KEY'];
const OTHER_KEY_NAMES = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_AI_API_KEY', 'OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY', 'NEXT_PUBLIC_GEMINI_API_KEY'];
const OWNED_PATH_NAMES = ['CVF_CONTROL_PLANE_EVENTS_PATH', 'CVF_POLICY_SNAPSHOT_DIR', 'KNOWLEDGE_STORE_PATH', 'APPROVAL_STORE_PATH', 'CVF_DURABLE_MEMORY_STORE_PATH', 'CVF_SOT3_ACTIVATION_EVIDENCE_PATH'];

type BoundaryEvent = {
  event: string;
  processedEnv?: boolean;
  argvTail?: string[];
  wrapperActive?: boolean;
  envStates?: Record<string, string>;
  host?: string;
  pathname?: string;
  method?: string;
  attempt?: number;
};

function events(): BoundaryEvent[] {
  return readFileSync(BOUNDARY_LOG, 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line) as BoundaryEvent);
}
function providerAttempts() {
  return events().filter(entry => entry.event === 'provider_attempt');
}
function unexpectedDeniedFetches() {
  return events().filter(entry => entry.event === 'fetch_denied' && !(
    (entry.host === 'registry.npmjs.org' && entry.pathname === '/-/package/next/dist-tags' && entry.method === 'GET') ||
    (entry.host === 'telemetry.nextjs.org' && entry.pathname === '/api/v1/record' && entry.method === 'POST')
  ));
}
function safeDigest(value: string | Buffer) {
  return createHash('sha256').update(value).digest('hex');
}
function runtimeRecord(value: Record<string, unknown>) {
  if (!RUNTIME_JSON || !path.isAbsolute(RUNTIME_JSON)) throw new Error('NCR_RUNTIME_PROOF_PATH_MISSING');
  writeFileSync(RUNTIME_JSON, JSON.stringify(value, null, 2) + '\n');
}
function ownStorePaths() {
  const configuredRoot = process.env.CVF_NCR_RUNTIME_ROOT ?? '';
  if (!path.isAbsolute(configuredRoot)) throw new Error('NCR_RUNTIME_ROOT_NOT_ABSOLUTE');
  const root = path.resolve(configuredRoot);
  return Object.fromEntries(OWNED_PATH_NAMES.map(name => {
    const value = process.env[name] ?? '';
    if (!path.isAbsolute(value) || !path.resolve(value).startsWith(root + path.sep)) {
      throw new Error(`NCR_STORE_OUTSIDE_OWNED_ROOT:${name}`);
    }
    return [name, value];
  }));
}

test.describe.configure({ mode: 'serial' });

test('processed server and browser profile are isolated before a provider call', async ({ browser }) => {
  expect(browser.browserType().name()).toBe('chromium');
  expect(process.env.CVF_NCR_ALIBABA_CALL_CAP).toBe('2');
  expect(process.env.CVF_NCR_PRIOR_PROVIDER_CALLS).toBe('4');
  expect(process.env.CVF_STORAGE_ADAPTER_TYPE).toBe('file');
  expect(process.env.CVF_RATE_LIMIT_STORE).toBe('memory');
  expect(process.env.NEXT_DIST_DIR).toBe('.next-cvf-ncr-home-worker-20261013-6');
  expect(process.env.NEXTAUTH_URL).toBe('');
  expect(process.env.AUTH_URL).toBe(BASE_URL);
  expect(process.env.NEXT_PUBLIC_CVF_MOCK_AI).not.toBe('1');
  expect(process.env.NEXT_PUBLIC_CVF_MOCK_AI).not.toBe('true');
  expect(path.isAbsolute(BOUNDARY_LOG)).toBe(true);
  ownStorePaths();
  expect(JSON.parse(readFileSync(process.env.KNOWLEDGE_STORE_PATH!, 'utf8'))).toEqual([]);
  expect(providerAttempts()).toHaveLength(0);
  expect(unexpectedDeniedFetches()).toHaveLength(0);

  await expect.poll(() => events().filter(entry => entry.processedEnv && entry.wrapperActive).length, { timeout: 20_000 }).toBeGreaterThan(0);
  const processed = events().find(entry => entry.processedEnv && entry.wrapperActive &&
    (entry.argvTail ?? []).some(arg => arg.includes('start-server') || arg.includes('next-server')));
  expect(processed).toBeDefined();
  const states = processed!.envStates!;
  expect(states.AUTH_URL).toBe('SET');
  expect(states.NEXTAUTH_URL).toBe('EMPTY');
  for (const name of OWNED_PATH_NAMES) expect(states[name]).toBe('SET');
  expect(states.CVF_RATE_LIMIT_STORE).toBe('SET');
  expect(states.UPSTASH_REDIS_REST_URL).not.toBe('SET');
  expect(states.UPSTASH_REDIS_REST_TOKEN).not.toBe('SET');
  expect(ALIBABA_KEY_NAMES.filter(name => states[name] === 'SET')).toEqual(['DASHSCOPE_API_KEY']);
  for (const name of OTHER_KEY_NAMES) expect(states[name]).not.toBe('SET');
  runtimeRecord({ profile: { browser: 'chromium', baseUrl: BASE_URL, nextDistDir: process.env.NEXT_DIST_DIR,
    ownedPathNames: OWNED_PATH_NAMES,
    processedServer: true, boundaryWrapped: true, alibabaCredentialAlias: ALIBABA_KEY_NAMES.find(name => states[name] === 'SET'),
    credentialValueRecorded: false, knowledgeCollectionCount: 0, providerAttemptsBeforeSubmit: 0,
    priorProviderAttempts: 4, freshCallCap: 2 },
    status: 'PREFLIGHT_PASS_NO_PROVIDER_CALL' });
});

test('Home visibly submits an Alibaba root, refines a linked child and downloads child Markdown', async ({ page, browser }) => {
  test.setTimeout(300_000);
  expect(browser.browserType().name()).toBe('chromium');
  const before = JSON.parse(readFileSync(RUNTIME_JSON, 'utf8')) as Record<string, unknown>;
  expect(before.status).toBe('PREFLIGHT_PASS_NO_PROVIDER_CALL');
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
  const executeResponses: Array<{ status: number; body: Record<string, unknown>; request: Record<string, unknown> }> = [];
  page.on('response', async response => {
    if (new URL(response.url()).pathname !== '/api/execute' || response.request().method() !== 'POST') return;
    try { executeResponses.push({ status: response.status(), body: await response.json() as Record<string, unknown>, request: response.request().postDataJSON() as Record<string, unknown> }); }
    catch { executeResponses.push({ status: response.status(), body: {}, request: {} }); }
  });
  await login(page);
  const browserSettings = await page.evaluate(() => JSON.parse(localStorage.getItem('cvf_settings') ?? '{}')) as { providers?: { alibaba?: { apiKey?: string } } };
  expect(browserSettings.providers?.alibaba?.apiKey).toBe('');
  await page.getByRole('button', { name: /Strategy Analysis|Phân tích Chiến lược/i }).first().click();
  await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Synthetic neighborhood library workshop planning');
  await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill('Fictional library: one room, four volunteers, Saturday and Sunday workshops. Compare schedules. Entire answer must be 180 words or fewer: one brief line per required section; compact SWOT and options tables; concise risks, recommendation, criteria and next actions. Use only these facts.');
  await page.getByRole('button', { name: 'Tạo kết quả' }).click();
  await expect.poll(() => executeResponses.length, { timeout: 210_000 }).toBe(1);
  const root = executeResponses[0];
  const rootReceipt = root.body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
  expect(root.status).toBe(200);
  expect(root.body.success).toBe(true);
  expect(typeof root.body.output).toBe('string');
  expect((root.body.output as string).trim().length).toBeGreaterThan(0);
  expect(rootReceipt?.receiptId).toBeTruthy();
  expect(rootReceipt?.provider).toBe('alibaba');
  expect(rootReceipt?.model).toBe('qwen-flash');
  expect(rootReceipt?.evidenceMode).toBe('live');
  expect(root.body.provider).toBe('alibaba');
  expect(root.body.model).toBe('qwen-flash');
  expect(root.request.provider).toBe('alibaba');
  expect(root.request.model).toBe('qwen-flash');
  expect((root.body.knowledgeInjection as Record<string, unknown> | undefined)?.injected).toBe(false);
  expect((root.body.knowledgeInjection as Record<string, unknown> | undefined)?.chunkCount).toBe(0);
  expect(rootReceipt?.knowledgeInjected).toBe(false);
  expect(rootReceipt?.knowledgeChunkCount).toBe(0);
  const rootAttempts = providerAttempts().length;
  expect(rootAttempts).toBeGreaterThanOrEqual(1);
  expect(rootAttempts).toBeLessThanOrEqual(3);
  expect((root.body.providerAttemptReconciliation as Record<string, unknown>)?.providerCallCount).toBe(rootAttempts);
  await expect(page.getByTestId('followup-section')).toBeVisible({ timeout: 30_000 });
  const rootOutput = root.body.output as string;
  const rootId = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}');
    return data.state?.executions?.find((item: { output?: string }) => item.output)?.id as string | undefined;
  });
  expect(rootId).toBeTruthy();
  const refinement = 'Refine this fictional library plan. Entire answer must be 180 words or fewer; preserve each required section with one brief line and compact tables. Give the better weekend schedule, one assumption, one risk, and next action.';
  await page.getByTestId('followup-input').fill(refinement);
  await page.getByTestId('followup-submit-btn').click();
  await expect.poll(() => executeResponses.length, { timeout: 210_000 }).toBe(2);
  const child = executeResponses[1];
  const childReceipt = child.body.governanceEvidenceReceipt as Record<string, unknown> | undefined;
  expect(child.status).toBe(200);
  expect(child.body.success).toBe(true);
  expect(typeof child.body.output).toBe('string');
  expect((child.body.output as string).trim().length).toBeGreaterThan(0);
  expect(childReceipt?.receiptId).toBeTruthy();
  expect(childReceipt?.receiptId).not.toBe(rootReceipt?.receiptId);
  expect(childReceipt?.provider).toBe('alibaba');
  expect(childReceipt?.model).toBe('qwen-flash');
  expect(childReceipt?.evidenceMode).toBe('live');
  expect(child.body.provider).toBe('alibaba');
  expect(child.body.model).toBe('qwen-flash');
  expect(child.request.provider).toBe('alibaba');
  expect(child.request.model).toBe('qwen-flash');
  expect(child.body.output).not.toBe(rootOutput);
  expect((child.body.knowledgeInjection as Record<string, unknown> | undefined)?.injected).toBe(false);
  expect((child.body.knowledgeInjection as Record<string, unknown> | undefined)?.chunkCount).toBe(0);
  expect(childReceipt?.knowledgeInjected).toBe(false);
  expect(childReceipt?.knowledgeChunkCount).toBe(0);
  const childAttempts = providerAttempts().length - rootAttempts;
  expect(childAttempts).toBeGreaterThanOrEqual(1);
  expect(childAttempts).toBeLessThanOrEqual(3);
  expect((child.body.providerAttemptReconciliation as Record<string, unknown>)?.providerCallCount).toBe(childAttempts);
  const previousOutput = (child.request.inputs as Record<string, unknown> | undefined)?._previousOutput;
  const expectedPrevious = rootOutput.length > 600 ? rootOutput.slice(0, 600) + '…' : rootOutput;
  expect(previousOutput).toBe(expectedPrevious);
  await expect(page.getByTestId('followup-section')).toBeVisible({ timeout: 30_000 });

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cvf-executions-storage') ?? '{}').state?.executions ?? []) as Array<Record<string, unknown>>;
  const parentRecord = stored.find(item => item.id === rootId);
  const childRecord = stored.find(item => item.parentExecutionId === rootId);
  expect(parentRecord?.output).toBe(rootOutput);
  expect((parentRecord?.evidenceReceiptSnapshot as Record<string, unknown>)?.receiptId).toBe(rootReceipt?.receiptId);
  expect(childRecord?.output).toBe(child.body.output);
  expect((childRecord?.evidenceReceiptSnapshot as Record<string, unknown>)?.receiptId).toBe(childReceipt?.receiptId);
  expect(childRecord?.id).not.toBe(rootId);
  expect((childRecord?.input as Record<string, unknown>)?._previousOutput).toBe(expectedPrevious);

  await page.getByRole('button', { name: /Export$/ }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download \.md|Tải xuống \.md/i }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const raw = readFileSync(downloadPath!);
  const markdown = raw.toString('utf8');
  const cleanChildOutput = (child.body.output as string).replace(/\n---\n\*Generated by CVF.*\*/g, '').trim();
  expect(markdown).toContain(cleanChildOutput);
  expect(markdown).toContain(`- **Receipt:** ${childReceipt!.receiptId}`);
  expect(markdown).not.toContain(`- **Receipt:** ${rootReceipt!.receiptId}`);
  expect(raw.length).toBeGreaterThan(100);

  const callsBeforeEdit = providerAttempts().length;
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').waitFor();
  await page.waitForTimeout(1500);
  expect(await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').inputValue()).toBe('Synthetic neighborhood library workshop planning');
  expect(await page.getByTestId('followup-section').count()).toBe(0);
  expect(await page.getByText(String(childReceipt!.receiptId)).count()).toBe(0);
  expect(executeResponses).toHaveLength(2);
  expect(providerAttempts()).toHaveLength(callsBeforeEdit);
  expect(unexpectedDeniedFetches()).toHaveLength(0);
  expect(callsBeforeEdit).toBeGreaterThanOrEqual(2);
  expect(callsBeforeEdit).toBeLessThanOrEqual(2);
  expect(4 + callsBeforeEdit).toBeLessThanOrEqual(6);
  runtimeRecord({ ...before,
    status: 'STRICT_JOURNEY_PASS',
    root: { httpStatus: root.status, success: true, outputSha256: safeDigest(rootOutput), outputLength: rootOutput.length,
      receiptId: rootReceipt!.receiptId, provider: rootReceipt!.provider, model: rootReceipt!.model, runId: rootId,
      providerCallCount: (root.body.providerAttemptReconciliation as Record<string, unknown>)?.providerCallCount },
    child: { httpStatus: child.status, success: true, outputSha256: safeDigest(child.body.output as string),
      outputLength: (child.body.output as string).length, receiptId: childReceipt!.receiptId,
      provider: childReceipt!.provider, model: childReceipt!.model, runId: childRecord!.id, parentExecutionId: rootId,
      previousOutputSha256: safeDigest(String(previousOutput)), previousOutputMatches: true,
      providerCallCount: (child.body.providerAttemptReconciliation as Record<string, unknown>)?.providerCallCount },
    markdown: { filename: download.suggestedFilename(), byteCount: raw.length, sha256: safeDigest(raw),
      exactCleanChildOutputContained: true, exactChildReceiptContained: true, rootReceiptExcluded: true },
    counts: { priorExecutePosts: 4, freshExecutePosts: executeResponses.length, cumulativeExecutePosts: 4 + executeResponses.length,
      priorProviderAttempts: 4, freshProviderAttempts: callsBeforeEdit, cumulativeProviderAttempts: 4 + callsBeforeEdit,
      rootProviderAttempts: rootAttempts, childProviderAttempts: childAttempts,
      afterRetryExecutePosts: executeResponses.length, afterRetryProviderAttempts: providerAttempts().length,
      classifiedFrameworkFetchDenials: events().filter(entry => entry.event === 'fetch_denied').length,
      unexpectedDeniedFetches: unexpectedDeniedFetches().length },
  });
});
