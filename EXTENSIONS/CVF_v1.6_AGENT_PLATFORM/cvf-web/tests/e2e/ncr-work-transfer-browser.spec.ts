import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { login, seedStorage } from './utils';

interface AuditRecordFixture {
  id: string;
  timestamp: string;
  action: string;
  actorId: string;
  actorRole: string;
  targetResource: string;
  outcome: string;
}

interface NoHopLogEntry {
  ts: number;
  pid: number;
  threadId: number;
  event: string;
  argvTail?: string[];
  title?: string;
  processedEnv?: boolean;
  nextauthUrl?: string;
  fetchIsWrapper?: boolean;
  nextOriginalIsWrapper?: boolean;
  attemptCount?: number;
  otherFetchCount?: number;
}

interface ExportResponse {
  success: boolean;
  data?: {
    html: string;
    filename: string;
    receiptAnchor: string;
    generatedAt: string;
    governanceReceiptStatus?: string;
    governanceReceipt?: unknown;
    governanceReceiptAttemptId?: string;
    governanceState?: string;
  };
}

interface ExportRequest {
  title: string;
  sourcePath: string;
  sourceContent: string;
  memoryClass: string;
  status: string;
  claimBoundary: string;
  receiptAnchor: string;
}

const PLAYWRIGHT_PORT = process.env.CVF_PLAYWRIGHT_PORT ?? '';
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? '';
const NO_HOP_LOG = process.env.CVF_B2D_NO_HOP_LOG ?? '';
const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const PRELOAD_PATH = path.resolve(__dirname, 'support/b2d-no-hop-preload.cjs');
const EVIDENCE_DIRECTORY = path.join(REPO_ROOT, '.cvf', 'runtime', 'ncr-work-transfer-browser-conditional-20261013');
const ROUTE_RESPONSE_PATH = path.join(EVIDENCE_DIRECTORY, 'route-response.json');
const DOWNLOADED_HTML_PATH = path.join(EVIDENCE_DIRECTORY, 'downloaded.html');
const EXPECTED_DIST_DIRECTORY = '.next-ncr-work-transfer-browser';
const FIXTURE_ALPHA_ID = 'ncr-synthetic-audit-001';
const FIXTURE_BETA_ID = 'ncr-synthetic-audit-002';
const FIXTURE_RECORDS: AuditRecordFixture[] = [
  {
    id: FIXTURE_ALPHA_ID,
    timestamp: '2026-10-13T08:00:00.000Z',
    action: 'NCR synthetic review alpha',
    actorId: 'ncr-synthetic-worker',
    actorRole: 'admin',
    targetResource: 'fixtures/ncr-review-alpha.md',
    outcome: 'SYNTHETIC_READY_FOR_REVIEW',
  },
  {
    id: FIXTURE_BETA_ID,
    timestamp: '2026-10-13T09:00:00.000Z',
    action: 'NCR synthetic review beta',
    actorId: 'ncr-synthetic-reviewer',
    actorRole: 'reviewer',
    targetResource: 'fixtures/ncr-review-beta.md',
    outcome: 'SYNTHETIC_PENDING_REVIEW',
  },
];
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const exportRequestMethods: string[] = [];

function readNoHopLog(): NoHopLogEntry[] {
  if (!NO_HOP_LOG || !existsSync(NO_HOP_LOG)) return [];
  return readFileSync(NO_HOP_LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as NoHopLogEntry);
}

function isNextServer(entry: NoHopLogEntry): boolean {
  return (entry.argvTail ?? []).includes('start-server.js') || /^next-server/.test(entry.title ?? '');
}

function summarizeIsolation() {
  const entries = readNoHopLog();
  const server = entries.filter(isNextServer);
  const processed = server.filter(entry => entry.processedEnv === true);
  const newest = server.reduce((latest, entry) => Math.max(latest, entry.ts), 0);
  return {
    serverContexts: new Set(server.map(entry => `${entry.pid}:${entry.threadId}`)).size,
    processedServerContexts: new Set(processed.map(entry => `${entry.pid}:${entry.threadId}`)).size,
    nextauthUrlStates: [...new Set(processed.map(entry => entry.nextauthUrl ?? 'MISSING'))],
    wrapperReached: server.some(entry => entry.fetchIsWrapper === true || (entry.otherFetchCount ?? 0) > 0),
    attemptEvents: entries.filter(entry => entry.event === 'attempt').length,
    maxAttemptCount: entries.reduce((max, entry) => Math.max(max, entry.attemptCount ?? 0), 0),
    newestServerTickAgeMs: newest ? Date.now() - newest : Number.POSITIVE_INFINITY,
  };
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function isCredentialAliasName(name: string): boolean {
  return /(?:^|_)(?:API[_-]?KEY|APIKEY|ACCESS[_-]?KEY(?:_ID)?|SECRET(?:_ACCESS_KEY|_KEY)?|CLIENT[_-]?SECRET|PRIVATE[_-]?KEY|AUTH[_-]?TOKEN|ACCESS[_-]?TOKEN|SESSION[_-]?TOKEN|TOKEN|BEARER|CREDENTIALS?)(?:_|$)/i.test(name);
}

test.describe.configure({ mode: 'serial' });

test('preflight proves processed server no-hop isolation before export', async ({ browser }) => {
  expect(browser.browserType().name()).toBe('chromium');
  expect(exportRequestMethods).toEqual([]);
  expect(process.env.NEXTAUTH_URL, 'parent NEXTAUTH_URL must be explicitly empty').toBe('');
  expect(process.env.AUTH_URL).toBe('http://localhost:3021');
  expect(PLAYWRIGHT_PORT).toBe('3021');
  expect(PLAYWRIGHT_BASE_URL).toBe('http://localhost:3021');
  expect(process.env.NEXT_DIST_DIR).toBe(EXPECTED_DIST_DIRECTORY);
  expect(process.env.CVF_STORAGE_ADAPTER_TYPE).toBe('file');
  expect(path.isAbsolute(process.env.CVF_CONTROL_PLANE_EVENTS_PATH ?? '')).toBe(true);
  expect(path.isAbsolute(process.env.CVF_POLICY_SNAPSHOT_DIR ?? '')).toBe(true);
  expect(process.env.CVF_CONTROL_PLANE_EVENTS_PATH).toContain('ncr-work-transfer-browser-conditional-20261013');
  expect(process.env.CVF_POLICY_SNAPSHOT_DIR).toContain('ncr-work-transfer-browser-conditional-20261013');

  expect(path.isAbsolute(NO_HOP_LOG)).toBe(true);
  const resolvedLog = path.resolve(NO_HOP_LOG).toLowerCase();
  const repoPrefix = `${REPO_ROOT.toLowerCase()}${path.sep}`;
  expect(resolvedLog.startsWith(repoPrefix)).toBe(false);
  const nodeOptions = (process.env.NODE_OPTIONS ?? '').replace(/\\/g, '/').toLowerCase();
  expect(nodeOptions).toContain('--require');
  expect(nodeOptions).toContain(PRELOAD_PATH.replace(/\\/g, '/').toLowerCase());

  const remainingCredentialNames = Object.keys(process.env).filter(isCredentialAliasName);
  expect(remainingCredentialNames).toEqual([]);
  const clearedCredentialNames = (process.env.CVF_NCR_CLEARED_ALIAS_NAMES ?? '')
    .split(',')
    .filter(Boolean)
    .sort();

  await expect.poll(() => summarizeIsolation().newestServerTickAgeMs, { timeout: 15_000 }).toBeLessThan(3000);
  const isolation = summarizeIsolation();
  expect(isolation.processedServerContexts).toBeGreaterThan(0);
  expect(isolation.nextauthUrlStates).toEqual(['EMPTY']);
  expect(isolation.wrapperReached).toBe(true);
  expect(isolation.attemptEvents).toBe(0);
  expect(isolation.maxAttemptCount).toBe(0);

  console.log(`NCR_WORK_TRANSFER_PREFLIGHT ${JSON.stringify({
    browserName: browser.browserType().name(),
    port: PLAYWRIGHT_PORT,
    baseUrl: PLAYWRIGHT_BASE_URL,
    nextDistDir: process.env.NEXT_DIST_DIR,
    authUrl: process.env.AUTH_URL,
    parentNextAuthUrlState: process.env.NEXTAUTH_URL === '' ? 'EMPTY' : 'NOT_EMPTY',
    noHopLogPath: NO_HOP_LOG,
    preloadPath: PRELOAD_PATH,
    storageAdapter: process.env.CVF_STORAGE_ADAPTER_TYPE,
    isolatedAuditPath: process.env.CVF_CONTROL_PLANE_EVENTS_PATH,
    isolatedSnapshotPath: process.env.CVF_POLICY_SNAPSHOT_DIR,
    clearedCredentialNames,
    remainingCredentialNames,
    isolation,
    exportRequestMethods,
  })}`);
});

test('Work Transfer selection builds, previews, and downloads one real draft version', async ({ page, browser }) => {
  expect(browser.browserType().name()).toBe('chromium');
  await mkdir(EVIDENCE_DIRECTORY, { recursive: true });
  await seedStorage(page);
  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));

  const interceptedAuditMethods: string[] = [];
  const auditRequestMethods: string[] = [];
  const externalRequests: Array<{ method: string; origin: string; pathname: string }> = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname === '/api/admin/audit') auditRequestMethods.push(request.method());
    if (url.pathname === '/api/artifacts/export') exportRequestMethods.push(request.method());
    if (!LOCAL_HOSTS.has(url.hostname)) externalRequests.push({
      method: request.method(), origin: url.origin, pathname: url.pathname,
    });
  });
  await page.route('**/api/admin/audit', async route => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    interceptedAuditMethods.push(route.request().method());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: FIXTURE_RECORDS }),
    });
  });

  await page.goto('/work-transfer');
  await expect(page.getByRole('heading', { name: 'Recent audit events' })).toBeVisible();
  await expect(page.getByRole('main').getByText('Work Transfer', { exact: true })).toBeVisible();
  await expect(page.getByTestId('history-list')).toBeVisible();
  await expect(page.getByTestId('history-note')).toContainText('These are audit events, not proof that a work transfer occurred.');
  await expect(page.getByTestId(`export-record-${FIXTURE_ALPHA_ID}`)).toBeVisible();
  await expect(page.getByTestId(`export-record-${FIXTURE_BETA_ID}`)).toBeVisible();

  const alphaButton = page.getByTestId(`export-record-${FIXTURE_ALPHA_ID}`);
  const betaButton = page.getByTestId(`export-record-${FIXTURE_BETA_ID}`);
  await alphaButton.click();
  const panel = page.getByTestId('inline-export-panel');
  await expect(panel).toBeVisible();
  const titleInput = page.getByLabel('Title');
  const sourceReferenceInput = page.getByLabel('Source reference');
  const sourceNotesInput = page.getByLabel('Source notes');
  const initialSourceNotes = await sourceNotesInput.inputValue();
  expect(await titleInput.inputValue()).toBe('Audit Record - NCR synthetic review alpha');
  expect(await sourceReferenceInput.inputValue()).toBe('fixtures/ncr-review-alpha.md');
  expect(initialSourceNotes).toContain('NCR synthetic review alpha');

  const builtTitle = 'NCR Browser Draft Alpha';
  const builtSourcePath = 'fixtures/ncr-browser-edited-source.md';
  const builtSourceNotes = `${initialSourceNotes}\n\nWorker browser marker: build version alpha.`;
  await titleInput.fill(builtTitle);
  await sourceReferenceInput.fill(builtSourcePath);
  await sourceNotesInput.fill(builtSourceNotes);

  const [response] = await Promise.all([
    page.waitForResponse(candidate => candidate.url().endsWith('/api/artifacts/export') && candidate.request().method() === 'POST'),
    page.getByRole('button', { name: /Build HTML/i }).click(),
  ]);
  const responseBytes = await response.body();
  await writeFile(ROUTE_RESPONSE_PATH, responseBytes);
  const envelope = JSON.parse(responseBytes.toString('utf8')) as ExportResponse;
  const submitted = response.request().postDataJSON() as ExportRequest;
  expect(response.request().method()).toBe('POST');
  expect(response.status()).toBe(200);
  expect(envelope.success).toBe(true);
  expect(envelope.data).toBeDefined();
  const data = envelope.data!;
  expect(submitted).toMatchObject({
    title: builtTitle,
    sourcePath: builtSourcePath,
    sourceContent: builtSourceNotes,
    memoryClass: 'FULL_RECORD',
    status: 'SYNTHETIC_READY_FOR_REVIEW',
    receiptAnchor: `transfer-${FIXTURE_ALPHA_ID}`,
  });
  expect(submitted.claimBoundary).toContain('Editable draft derived from an audit event.');
  expect(data.receiptAnchor).toBe(`transfer-${FIXTURE_ALPHA_ID}`);
  expect(data.filename).toBe('ncr-browser-draft-alpha.html');
  expect(data.governanceReceiptStatus).toBe('NOT_CONFIGURED');
  expect(data.governanceReceipt).toBeUndefined();
  expect(data.governanceReceiptAttemptId).toBeUndefined();
  expect(data.governanceState).toBe('DRAFT_UNACCEPTED');

  const normalizedSourceHash = sha256(Buffer.from(submitted.sourceContent.trim(), 'utf8'));
  const responseWireSha256 = sha256(responseBytes);
  const htmlBytes = Buffer.from(data.html, 'utf8');
  const htmlSha256 = sha256(htmlBytes);
  expect(data.html).toContain(normalizedSourceHash);
  expect(htmlSha256).not.toBe(normalizedSourceHash);
  expect(responseWireSha256).not.toBe(normalizedSourceHash);
  expect(responseWireSha256).not.toBe(htmlSha256);
  expect((await readFile(ROUTE_RESPONSE_PATH)).equals(responseBytes)).toBe(true);

  await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
  await expect(page.getByTestId('governance-receipt-absent-note')).toContainText('No review receipt was requested.');
  await expect(page.getByTestId('governance-receipt-attempt-id')).toHaveCount(0);
  await expect(page.getByTestId('artifact-version-notice')).toHaveAttribute('data-version-state', 'current');
  const preview = page.frameLocator('iframe[title="Preview"]');
  const previewHeading = preview.locator('header > h1');
  await expect(previewHeading).toHaveCount(1);
  await expect(previewHeading).toHaveText(builtTitle);
  await expect(preview.getByText('Worker browser marker: build version alpha.')).toBeVisible();

  const editedAfterBuildTitle = 'NCR Browser Draft Alpha Edited After Build';
  await titleInput.fill(editedAfterBuildTitle);
  await sourceReferenceInput.fill('fixtures/ncr-browser-unsent-source.md');
  await sourceNotesInput.fill(`${builtSourceNotes}\n\nWorker browser marker: unsent post-build edit.`);
  await expect(page.getByTestId('artifact-version-notice')).toHaveAttribute('data-version-state', 'stale');
  await expect(page.getByTestId('artifact-version-tag')).toContainText(/previous|earlier|stale/i);
  await expect(previewHeading).toHaveText(builtTitle);
  await expect(previewHeading).not.toHaveText(editedAfterBuildTitle);
  await expect(preview.getByText('Worker browser marker: build version alpha.')).toBeVisible();
  await expect(preview.getByText('Worker browser marker: unsent post-build edit.')).toHaveCount(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download HTML/i }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(data.filename);
  await download.saveAs(DOWNLOADED_HTML_PATH);
  const downloadedBytes = await readFile(DOWNLOADED_HTML_PATH);
  const downloadedSha256 = sha256(downloadedBytes);
  expect(downloadedBytes.length).toBe(htmlBytes.length);
  expect(downloadedSha256).toBe(htmlSha256);
  expect(downloadedBytes.equals(htmlBytes)).toBe(true);

  await alphaButton.click();
  await expect(panel).toHaveCount(0);
  expect(exportRequestMethods).toEqual(['POST']);
  await alphaButton.click();
  await expect(panel).toBeVisible();
  await expect(titleInput).toHaveValue('Audit Record - NCR synthetic review alpha');
  await expect(page.getByTestId('artifact-draft-state')).toHaveCount(0);
  await expect(page.locator('iframe[title="Preview"]')).toHaveCount(0);

  await betaButton.click();
  await expect(panel).toBeVisible();
  await expect(titleInput).toHaveValue('Audit Record - NCR synthetic review beta');
  await expect(sourceReferenceInput).toHaveValue('fixtures/ncr-review-beta.md');
  await expect(page.getByTestId('artifact-draft-state')).toHaveCount(0);
  await expect(page.locator('iframe[title="Preview"]')).toHaveCount(0);
  await expect(betaButton).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('history-list')).toBeVisible();
  await expect(panel).toHaveCount(0);
  await page.getByTestId(`export-record-${FIXTURE_ALPHA_ID}`).click();
  await expect(panel).toBeVisible();
  await expect(titleInput).toHaveValue('Audit Record - NCR synthetic review alpha');
  await expect(sourceReferenceInput).toHaveValue('fixtures/ncr-review-alpha.md');
  await expect(page.getByTestId('artifact-draft-state')).toHaveCount(0);
  await expect(page.locator('iframe[title="Preview"]')).toHaveCount(0);

  expect(interceptedAuditMethods.length).toBeGreaterThan(0);
  expect(interceptedAuditMethods.every(method => method === 'GET')).toBe(true);
  expect(auditRequestMethods).toEqual(interceptedAuditMethods);
  expect(auditRequestMethods.filter(method => method === 'GET').length).toBeGreaterThanOrEqual(2);
  expect(exportRequestMethods).toEqual(['POST']);
  const unexpectedExternalRequests = externalRequests.filter(request => !(
    request.method === 'GET' && (
      (request.origin === 'https://fonts.googleapis.com' && request.pathname === '/css2') ||
      (request.origin === 'https://fonts.gstatic.com' && request.pathname.startsWith('/s/'))
    )
  ));
  expect(unexpectedExternalRequests).toEqual([]);

  const isolationAfterRun = summarizeIsolation();
  expect(isolationAfterRun.nextauthUrlStates).toEqual(['EMPTY']);
  expect(isolationAfterRun.attemptEvents).toBe(0);
  expect(isolationAfterRun.maxAttemptCount).toBe(0);

  console.log(`NCR_WORK_TRANSFER_RESULT ${JSON.stringify({
    browserName: browser.browserType().name(),
    browserVersion: browser.version(),
    fixtureRecordIds: [FIXTURE_ALPHA_ID, FIXTURE_BETA_ID],
    auditRequestMethods,
    interceptedAuditMethods,
    exportRequestMethods,
    responseStatus: response.status(),
    responseFilename: data.filename,
    routeResponsePath: ROUTE_RESPONSE_PATH,
    routeResponseByteLength: responseBytes.length,
    routeResponseJsonWireSha256: responseWireSha256,
    sourceContentSha256: normalizedSourceHash,
    routeHtmlByteLength: htmlBytes.length,
    routeHtmlSha256: htmlSha256,
    downloadedHtmlPath: DOWNLOADED_HTML_PATH,
    downloadedHtmlByteLength: downloadedBytes.length,
    downloadedHtmlSha256: downloadedSha256,
    rawBytesEqual: downloadedBytes.equals(htmlBytes),
    receiptStatus: data.governanceReceiptStatus,
    receiptPresent: data.governanceReceipt !== undefined,
    receiptAttemptIdPresent: data.governanceReceiptAttemptId !== undefined,
    governanceState: data.governanceState,
    postBuildVersionState: 'stale',
    selectionAndReload: 'fresh editable draft with no prior result',
    externalRequests,
    unexpectedExternalRequests,
    isolationAfterRun,
  })}`);
});
