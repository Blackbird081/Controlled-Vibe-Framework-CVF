import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { login, seedStorage } from './utils';

// NCR HTML B2e: synthetic configured-hop transport/presentation proof.
// Run only through tests/e2e/support/b2e-loopback-receipt-harness.cjs, which binds a non-forwarding
// loopback stub, forces NEXTAUTH_URL to that exact origin, disables the Governance Engine and injects a
// synthetic service token. The export endpoint is NOT intercepted, fulfilled or mocked here; the route
// response is captured passively. The stub returns fabricated failure responses only, so this proves
// transport and panel presentation, not receipt validity, governance behavior or artifact acceptance.

const HARNESS = process.env.CVF_B2E_HARNESS === '1';
const STUB_ORIGIN = process.env.CVF_B2E_STUB_ORIGIN ?? '';
const STUB_LOG = process.env.CVF_B2E_STUB_LOG ?? '';
const PRELOAD_LOG = process.env.CVF_B2E_PRELOAD_LOG ?? '';
const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const HARNESS_PATH = path.resolve(__dirname, 'support/b2e-loopback-receipt-harness.cjs');

const SOURCE_NOTES = [
  'Record type: Complete review record',
  '',
  'Review status: Draft',
  '',
  'Review Boundary: synthetic loopback proof only.',
].join('\n');

const CASES = [
  { anchor: 'b2e-invalid-case', title: 'B2e Invalid Response', status: 'INVALID_RESPONSE', stubStatus: 200, note: /could not be verified/i },
  { anchor: 'b2e-unavailable-case', title: 'B2e Unavailable Response', status: 'UNAVAILABLE', stubStatus: 503, note: /was unavailable/i },
] as const;

interface Entry {
  ts: number;
  pid?: number;
  threadId?: number;
  event: string;
  phase?: string;
  expected?: boolean;
  method?: string;
  path?: string;
  address?: string;
  family?: string;
  origin?: string;
  caseId?: string;
  requestId?: string;
  artifactId?: string;
  excerptLength?: number;
  tokenHeaderPresent?: boolean;
  tokenHeaderIsSynthetic?: boolean;
  status?: number;
  argvTail?: string[];
  title?: string;
  processedEnv?: boolean;
  nextauthIsStub?: boolean;
  nextauthOrigin?: string;
  authUrlOrigin?: string;
  engineEnabledFlag?: string;
  serviceTokenIsSynthetic?: boolean;
  fetchIsWrapper?: boolean;
  otherFetches?: number;
  allowed?: boolean;
  destinationOrigin?: string;
}

function readLog(file: string): Entry[] {
  if (!file || !existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line) as Entry);
}

const stubEntries = () => readLog(STUB_LOG);
const preloadEntries = () => readLog(PRELOAD_LOG);
const isServerContext = (entry: Entry) => (entry.argvTail ?? []).includes('start-server.js') || /^next-server/.test(entry.title ?? '');

function latestServerStates(): Entry[] {
  const latest = new Map<string, Entry>();
  for (const entry of preloadEntries().filter(isServerContext)) latest.set(`${entry.pid}:${entry.threadId}`, entry);
  return [...latest.values()];
}

test.describe.configure({ mode: 'serial' });
test.skip(!HARNESS, 'B2e runs only through b2e-loopback-receipt-harness.cjs (no export request is issued otherwise).');

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('loopback isolation, engine-disabled inheritance and auth are proven before any export request', async ({ page, baseURL }) => {
  // This test issues no export request. Serial mode skips the export test if it fails.
  expect(STUB_ORIGIN).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  expect(process.env.NEXTAUTH_URL).toBe(STUB_ORIGIN);
  expect(process.env.GOVERNANCE_ENGINE_ENABLED).toBe('false');
  expect(new URL(baseURL ?? '').origin).not.toBe(STUB_ORIGIN);
  expect(process.env.AUTH_URL).toBe(new URL(baseURL ?? '').origin);
  for (const file of [STUB_LOG, PRELOAD_LOG]) {
    expect(path.isAbsolute(file)).toBe(true);
    expect(path.resolve(file).toLowerCase().startsWith(REPO_ROOT.toLowerCase() + path.sep)).toBe(false);
  }
  const nodeOptions = (process.env.NODE_OPTIONS ?? '').replace(/\\/g, '/').toLowerCase();
  expect(nodeOptions).toContain('--require');
  expect(nodeOptions).toContain(HARNESS_PATH.replace(/\\/g, '/').toLowerCase());

  // Stub: bound to IPv4 loopback before the server started; self-test rejected unexpected requests.
  const listening = stubEntries().filter(entry => entry.event === 'listening');
  expect(listening).toHaveLength(1);
  expect(listening[0].address).toBe('127.0.0.1');
  expect(listening[0].family).toBe('IPv4');
  expect(listening[0].origin).toBe(STUB_ORIGIN);
  const preflightRequests = stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'preflight');
  expect(preflightRequests.length).toBeGreaterThanOrEqual(3);
  expect(preflightRequests.every(entry => entry.expected === false && entry.status === 404)).toBe(true);
  expect(stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'run')).toHaveLength(0);

  // Fresh Next server context inherited the exact origin, disabled engine and synthetic token.
  await expect.poll(() => latestServerStates().filter(entry => entry.processedEnv === true).length, { timeout: 20_000 }).toBeGreaterThan(0);
  const servers = latestServerStates().filter(entry => entry.processedEnv === true);
  for (const server of servers) {
    expect(server.nextauthIsStub).toBe(true);
    expect(server.nextauthOrigin).toBe(STUB_ORIGIN);
    expect(server.authUrlOrigin).toBe(new URL(baseURL ?? '').origin);
    expect(server.engineEnabledFlag).toBe('false');
    expect(server.serviceTokenIsSynthetic).toBe(true);
  }
  expect(servers.some(entry => entry.fetchIsWrapper === true || (entry.otherFetches ?? 0) > 0)).toBe(true);
  expect(preloadEntries().filter(entry => entry.event === 'evaluate_fetch')).toHaveLength(0);
  expect(preloadEntries().filter(entry => entry.event === 'next_governance_hit')).toHaveLength(0);

  // Browser auth works under the forced NEXTAUTH_URL, still with no export request.
  await login(page);
  const session = await page.request.get('/api/auth/session');
  expect(session.ok()).toBe(true);
  expect(((await session.json()) as { user?: unknown }).user).toBeTruthy();
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();
  expect(stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'run')).toHaveLength(0);
  console.log(`B2E_PREFLIGHT ${JSON.stringify({
    stubOrigin: STUB_ORIGIN, stubBound: `${listening[0].address}/${listening[0].family}`, preflightRejected: preflightRequests.length,
    serverContexts: servers.length, nextauthIsStub: true, engineFlag: 'false', tokenSynthetic: true, authOk: true,
  })}`);
});

test('real un-intercepted export route reaches only the inert stub and the panel shows draft failure states', async ({ page, browser }) => {
  const exportRequests: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/artifacts/export')) exportRequests.push(request.method());
  });
  const observed: Array<Record<string, unknown>> = [];

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();

  for (const testCase of CASES) {
    await page.getByLabel('Title').fill(testCase.title);
    await page.getByLabel('Source notes').fill(SOURCE_NOTES);
    await page.getByLabel('Receipt reference').fill(testCase.anchor);
    // Passive capture of the real route response; the endpoint is never routed, fulfilled or mocked.
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/api/artifacts/export') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /Build HTML/i }).click(),
    ]);
    const payload = JSON.parse((await response.body()).toString('utf8')) as {
      success: boolean;
      data: { governanceReceiptStatus?: string; governanceReceipt?: unknown; governanceReceiptAttemptId?: string; governanceState?: string; receiptAnchor?: string };
    };
    expect(response.status()).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.governanceReceiptStatus).toBe(testCase.status);
    expect(payload.data.governanceReceipt).toBeUndefined();
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    expect(payload.data.receiptAnchor).toBe(testCase.anchor);
    const attemptId = payload.data.governanceReceiptAttemptId ?? '';
    expect(attemptId).toMatch(new RegExp(`^artifact-proof-${testCase.anchor}-\\d+$`));

    // The inert stub saw exactly one expected receipt POST for this case, tied to the attempt ID.
    const seen = stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'run' && entry.caseId === testCase.anchor);
    expect(seen).toHaveLength(1);
    const [hit] = seen;
    expect(hit.expected).toBe(true);
    expect(hit.method).toBe('POST');
    expect(hit.path).toBe('/api/governance/evaluate');
    expect(hit.requestId).toBe(attemptId);
    expect(hit.artifactId).toBe(testCase.anchor);
    expect(hit.excerptLength).toBe(SOURCE_NOTES.trim().slice(0, 500).length);
    expect(hit.tokenHeaderPresent).toBe(true);
    expect(hit.tokenHeaderIsSynthetic).toBe(true);
    expect(hit.status).toBe(testCase.stubStatus);

    // Panel: draft state, matching failure note and attempt ID; no receipt/approval affordance.
    await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
    await expect(page.getByTestId('governance-receipt-absent-note')).toContainText(testCase.note);
    await expect(page.getByTestId('governance-receipt-attempt-id')).toHaveText(attemptId);
    for (const id of ['governance-receipt-badge', 'governance-approved-checks-note', 'governance-receipt-evaluated-note', 'governance-receipt-denied-note']) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }
    await expect(page.frameLocator('iframe[title="Preview"]').locator('h1')).toHaveText(testCase.title);
    observed.push({ anchor: testCase.anchor, routeStatus: response.status(), governanceReceiptStatus: payload.data.governanceReceiptStatus, attemptId, governanceState: payload.data.governanceState, stubRequestId: hit.requestId, stubExcerptLength: hit.excerptLength, stubStatus: hit.status });
  }

  expect(exportRequests).toEqual(['POST', 'POST']);
  expect(new Set(observed.map(item => item.attemptId)).size).toBe(CASES.length);

  // Whole-run isolation: only the two expected POSTs, nothing unexpected, nothing outside the stub.
  const runRequests = stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'run');
  expect(runRequests).toHaveLength(2);
  expect(runRequests.filter(entry => entry.expected === false)).toHaveLength(0);
  const evaluateFetches = preloadEntries().filter(entry => entry.event === 'evaluate_fetch');
  expect(evaluateFetches.every(entry => entry.allowed === true && entry.destinationOrigin === STUB_ORIGIN)).toBe(true);
  expect(preloadEntries().filter(entry => entry.event === 'next_governance_hit')).toHaveLength(0);

  const receipt = {
    browserName: browser.browserType().name(),
    browserVersion: browser.version(),
    headless: true,
    exportRequests,
    observed,
    stubRunRequests: runRequests.length,
    stubUnexpectedRuntime: 0,
    evaluateFetchDestinationsAllStub: evaluateFetches.length > 0,
    nextGovernanceHits: 0,
  };
  console.log(`B2E_RECEIPT ${JSON.stringify(receipt)}`);
  await test.info().attach('b2e-receipt.json', { body: JSON.stringify(receipt, null, 2), contentType: 'application/json' });
});
