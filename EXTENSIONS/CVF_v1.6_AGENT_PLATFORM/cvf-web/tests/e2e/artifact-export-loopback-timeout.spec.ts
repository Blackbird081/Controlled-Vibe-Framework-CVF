import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { login, seedStorage } from './utils';

// NCR HTML B2f: synthetic configured-hop TIMED_OUT transport/presentation proof.
// Run only through tests/e2e/support/b2f-loopback-timeout-harness.cjs, which binds a non-forwarding
// delayed loopback stub, forces NEXTAUTH_URL to that exact origin, disables the Governance Engine, injects a
// synthetic service token and sets CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS=1000. The export endpoint is NOT
// intercepted, fulfilled or mocked here; the route response is captured passively. The stub holds the one
// expected receipt POST beyond the timeout, so this proves transport timeout and ambiguous-outcome panel
// presentation only. The client disconnect and late reply are observations, not proof of remote
// cancellation, rollback, retry safety, receipt validity, governance behavior or artifact acceptance.

const HARNESS = process.env.CVF_B2F_HARNESS === '1';
const STUB_ORIGIN = process.env.CVF_B2F_STUB_ORIGIN ?? '';
const STUB_LOG = process.env.CVF_B2F_STUB_LOG ?? '';
const PRELOAD_LOG = process.env.CVF_B2F_PRELOAD_LOG ?? '';
const CASE_ID = process.env.CVF_B2F_TIMEOUT_CASE_ID ?? '';
const RECEIPT_TIMEOUT_MS = Number(process.env.CVF_B2F_RECEIPT_TIMEOUT_MS ?? 0);
const STUB_DELAY_MS = Number(process.env.CVF_B2F_STUB_DELAY_MS ?? 0);
const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const HARNESS_PATH = path.resolve(__dirname, 'support/b2f-loopback-timeout-harness.cjs');

const SOURCE_NOTES = [
  'Record type: Complete review record',
  '',
  'Review status: Draft',
  '',
  'Review Boundary: synthetic loopback timeout proof only.',
].join('\n');

const TIMED_OUT_NOTE = 'The review check timed out. No receipt was received, but the service may still have processed the request. Ask an operator to check the attempt ID before trying again.';

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
  receiveTs?: number;
  plannedDelayMs?: number;
  tokenHeaderPresent?: boolean;
  tokenHeaderIsSynthetic?: boolean;
  status?: number;
  msSinceReceive?: number;
  clientGoneBeforeReply?: boolean;
  replyWritten?: boolean;
  argvTail?: string[];
  title?: string;
  processedEnv?: boolean;
  nextauthIsStub?: boolean;
  nextauthOrigin?: string;
  authUrlOrigin?: string;
  engineEnabledFlag?: string;
  receiptTimeoutMs?: string;
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
const runRequests = () => stubEntries().filter(entry => entry.event === 'stub_request' && entry.phase === 'run');

function latestServerStates(): Entry[] {
  const latest = new Map<string, Entry>();
  for (const entry of preloadEntries().filter(isServerContext)) latest.set(`${entry.pid}:${entry.threadId}`, entry);
  return [...latest.values()];
}

test.describe.configure({ mode: 'serial' });
test.skip(!HARNESS, 'B2f runs only through b2f-loopback-timeout-harness.cjs (no export request is issued otherwise).');

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('loopback isolation, engine-disabled, timeout inheritance and auth are proven before any export request', async ({ page, baseURL }) => {
  // This test issues no export request. Serial mode skips the export test if it fails.
  expect(STUB_ORIGIN).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  expect(process.env.NEXTAUTH_URL).toBe(STUB_ORIGIN);
  expect(process.env.GOVERNANCE_ENGINE_ENABLED).toBe('false');
  expect(process.env.CVF_GOVERNANCE_RECEIPT_TIMEOUT_MS).toBe('1000');
  expect(RECEIPT_TIMEOUT_MS).toBe(1000);
  expect(STUB_DELAY_MS).toBeGreaterThanOrEqual(RECEIPT_TIMEOUT_MS + 1500);
  expect(CASE_ID).toBe('b2f-timeout-case');
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
  expect(preflightRequests.length).toBeGreaterThanOrEqual(4);
  expect(preflightRequests.every(entry => entry.expected === false && entry.status === 404)).toBe(true);
  expect(runRequests()).toHaveLength(0);

  // Fresh Next server context inherited the exact origin, disabled engine, 1,000 ms timeout and synthetic token.
  await expect.poll(() => latestServerStates().filter(entry => entry.processedEnv === true).length, { timeout: 20_000 }).toBeGreaterThan(0);
  const servers = latestServerStates().filter(entry => entry.processedEnv === true);
  for (const server of servers) {
    expect(server.nextauthIsStub).toBe(true);
    expect(server.nextauthOrigin).toBe(STUB_ORIGIN);
    expect(server.authUrlOrigin).toBe(new URL(baseURL ?? '').origin);
    expect(server.engineEnabledFlag).toBe('false');
    expect(server.receiptTimeoutMs).toBe('1000');
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
  expect(runRequests()).toHaveLength(0);
  console.log(`B2F_PREFLIGHT ${JSON.stringify({
    stubOrigin: STUB_ORIGIN, stubBound: `${listening[0].address}/${listening[0].family}`, preflightRejected: preflightRequests.length,
    serverContexts: servers.length, nextauthIsStub: true, engineFlag: 'false', receiptTimeoutMs: '1000', tokenSynthetic: true, authOk: true,
  })}`);
});

test('real un-intercepted export route times out against the delayed inert stub and the panel stays draft with an ambiguous-outcome warning', async ({ page, browser }) => {
  const exportRequests: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/artifacts/export')) exportRequests.push(request.method());
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();

  await page.getByLabel('Title').fill('B2f Timeout Response');
  await page.getByLabel('Source notes').fill(SOURCE_NOTES);
  await page.getByLabel('Receipt reference').fill(CASE_ID);

  // Passive capture of the real route response; the endpoint is never routed, fulfilled or mocked.
  const clickedAt = Date.now();
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/api/artifacts/export') && r.request().method() === 'POST'),
    page.getByRole('button', { name: /Build HTML/i }).click(),
  ]);
  const body = (await response.body()).toString('utf8');
  const respondedAt = Date.now();
  const payload = JSON.parse(body) as {
    success: boolean;
    data: { governanceReceiptStatus?: string; governanceReceipt?: unknown; governanceReceiptAttemptId?: string; governanceState?: string; receiptAnchor?: string };
  };
  expect(response.status()).toBe(200);
  expect(payload.success).toBe(true);
  expect(payload.data.governanceReceiptStatus).toBe('TIMED_OUT');
  expect(payload.data.governanceReceipt).toBeUndefined();
  expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
  expect(payload.data.receiptAnchor).toBe(CASE_ID);
  const attemptId = payload.data.governanceReceiptAttemptId ?? '';
  expect(attemptId).toMatch(new RegExp(`^artifact-proof-${CASE_ID}-\\d+$`));

  // The inert stub received exactly one expected receipt POST, before the route's timeout response.
  const seen = runRequests();
  expect(seen).toHaveLength(1);
  const [hit] = seen;
  expect(hit.expected).toBe(true);
  expect(hit.method).toBe('POST');
  expect(hit.path).toBe('/api/governance/evaluate');
  expect(hit.requestId).toBe(attemptId);
  expect(hit.artifactId).toBe(CASE_ID);
  expect(hit.excerptLength).toBe(SOURCE_NOTES.trim().slice(0, 500).length);
  expect(hit.tokenHeaderPresent).toBe(true);
  expect(hit.tokenHeaderIsSynthetic).toBe(true);
  expect(hit.plannedDelayMs).toBe(STUB_DELAY_MS);
  expect(typeof hit.receiveTs).toBe('number');
  const receiveTs = hit.receiveTs as number;
  expect(receiveTs).toBeGreaterThanOrEqual(clickedAt);
  expect(receiveTs).toBeLessThanOrEqual(respondedAt);

  // Route responded at about the configured timeout, well before the stub's planned reply.
  const routeWaitMs = respondedAt - receiveTs;
  expect(routeWaitMs).toBeGreaterThanOrEqual(RECEIPT_TIMEOUT_MS - 100);
  expect(routeWaitMs).toBeLessThan(STUB_DELAY_MS);
  expect(stubEntries().filter(entry => entry.event === 'late_reply')).toHaveLength(0);

  // Panel: draft state, exact ambiguous-outcome warning and matching attempt ID; no receipt/approval affordance.
  await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
  await expect(page.getByTestId('governance-receipt-absent-note')).toHaveText(TIMED_OUT_NOTE);
  await expect(page.getByTestId('governance-receipt-attempt-id')).toHaveText(attemptId);
  for (const id of ['governance-receipt-badge', 'governance-approved-checks-note', 'governance-receipt-evaluated-note', 'governance-receipt-denied-note']) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
  const noteText = (await page.getByTestId('governance-receipt-absent-note').innerText()).toLowerCase();
  expect(noteText).not.toMatch(/safe to retry|cancel|roll(ed)? ?back|stopped/);
  await expect(page.frameLocator('iframe[title="Preview"]').locator('h1')).toHaveText('B2f Timeout Response');

  // Late reply / disconnect: observation only (bounded wait, never asserted as cancellation or retry safety).
  let disconnectMs: number | null = null;
  let lateReply: { clientGoneBeforeReply?: boolean; replyWritten?: boolean; msSinceReceive?: number } | null = null;
  const deadline = Date.now() + STUB_DELAY_MS + 2500;
  while (Date.now() < deadline) {
    const entries = stubEntries();
    const gone = entries.find(entry => entry.event === 'client_disconnect');
    const late = entries.find(entry => entry.event === 'late_reply');
    if (gone) disconnectMs = gone.msSinceReceive ?? null;
    if (late) { lateReply = { clientGoneBeforeReply: late.clientGoneBeforeReply, replyWritten: late.replyWritten, msSinceReceive: late.msSinceReceive }; break; }
    await page.waitForTimeout(200);
  }

  expect(exportRequests).toEqual(['POST']);

  // Whole-run isolation: only the one expected POST, nothing unexpected, nothing outside the stub.
  expect(runRequests()).toHaveLength(1);
  expect(runRequests().filter(entry => entry.expected === false)).toHaveLength(0);
  const evaluateFetches = preloadEntries().filter(entry => entry.event === 'evaluate_fetch');
  expect(evaluateFetches).toHaveLength(1);
  expect(evaluateFetches.every(entry => entry.allowed === true && entry.destinationOrigin === STUB_ORIGIN)).toBe(true);
  expect(preloadEntries().filter(entry => entry.event === 'next_governance_hit')).toHaveLength(0);

  const receipt = {
    browserName: browser.browserType().name(),
    browserVersion: browser.version(),
    headless: true,
    exportRequests,
    routeStatus: response.status(),
    governanceReceiptStatus: payload.data.governanceReceiptStatus,
    attemptId,
    governanceState: payload.data.governanceState,
    stubRequestId: hit.requestId,
    stubExcerptLength: hit.excerptLength,
    clickToResponseMs: respondedAt - clickedAt,
    stubReceiveToRouteResponseMs: routeWaitMs,
    stubPlannedDelayMs: STUB_DELAY_MS,
    receiptTimeoutMs: RECEIPT_TIMEOUT_MS,
    observedClientDisconnectMsSinceReceive: disconnectMs,
    observedLateReply: lateReply,
    observationOnlyNote: 'disconnect/late reply are not proof of remote cancellation, rollback or retry safety',
    stubRunRequests: runRequests().length,
    stubUnexpectedRuntime: 0,
    evaluateFetchDestinationsAllStub: evaluateFetches.length > 0,
    nextGovernanceHits: 0,
  };
  console.log(`B2F_RECEIPT ${JSON.stringify(receipt)}`);
  await test.info().attach('b2f-receipt.json', { body: JSON.stringify(receipt, null, 2), contentType: 'application/json' });
});
