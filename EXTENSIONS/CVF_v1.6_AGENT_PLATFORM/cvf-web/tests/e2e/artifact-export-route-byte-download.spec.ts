import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { createHtmlByteHandoff, verifyHtmlByteHandoff } from '../../src/lib/html-artifact-byte-handoff';
import { login, seedStorage } from './utils';

// NCR HTML B2d: synthetic real-route browser saved-file byte proof under a fail-closed no-hop harness.
// The export endpoint is NOT intercepted, fulfilled or mocked here; the response is captured passively.
// The optional server-side governance-evaluate hop is blocked by tests/e2e/support/b2d-no-hop-preload.cjs,
// installed through NODE_OPTIONS before the fresh Next server starts, with NEXTAUTH_URL set to empty.
// The panel, route and B2b helper are read-only. A pass covers this synthetic input in this browser profile.

const TITLE_A = 'Alpha Report';
const TITLE_B = 'Bravo Report';
const TITLE_FORM_CHANGE = 'Charlie Report Changed After Build';
const NO_HOP_LOG = process.env.CVF_B2D_NO_HOP_LOG ?? '';
const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const PRELOAD_PATH = path.resolve(__dirname, 'support/b2d-no-hop-preload.cjs');

// Non-ASCII (2- to 4-byte UTF-8) and a mid-text BOM; the route trims only the ends of each field.
const SOURCE_NOTES = [
  'Record type: Complete review record',
  '',
  'Review status: Draft',
  '',
  'Review Boundary: synthetic browser proof only.',
  '',
  'Byte cases: Ti\u1EBFng Vi\u1EC7t \u1EC7 \u1EEF, \u65E5\u672C\u8A9E, \uD83D\uDE00 U+1F600, mid BOM x\uFEFFy.',
].join('\n');

interface LogEntry {
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

function readNoHopLog(): LogEntry[] {
  if (!NO_HOP_LOG || !existsSync(NO_HOP_LOG)) return [];
  return readFileSync(NO_HOP_LOG, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line) as LogEntry);
}

function isServerContext(entry: LogEntry): boolean {
  return (entry.argvTail ?? []).includes('start-server.js') || /^next-server/.test(entry.title ?? '');
}

interface Isolation {
  serverContexts: number;
  serverContextsWithProcessedEnv: number;
  nextauthUrlStates: string[];
  wrapperReached: boolean;
  attemptEvents: number;
  maxAttemptCount: number;
  newestServerTickAgeMs: number;
}

function summarizeIsolation(): Isolation {
  const entries = readNoHopLog();
  const server = entries.filter(isServerContext);
  const processed = server.filter(entry => entry.processedEnv === true);
  const newest = server.reduce((max, entry) => Math.max(max, entry.ts), 0);
  return {
    serverContexts: new Set(server.map(entry => `${entry.pid}:${entry.threadId}`)).size,
    serverContextsWithProcessedEnv: new Set(processed.map(entry => `${entry.pid}:${entry.threadId}`)).size,
    nextauthUrlStates: [...new Set(processed.map(entry => entry.nextauthUrl ?? 'MISSING'))],
    wrapperReached: server.some(entry => entry.fetchIsWrapper === true || (entry.otherFetchCount ?? 0) > 0),
    attemptEvents: entries.filter(entry => entry.event === 'attempt').length,
    maxAttemptCount: entries.reduce((max, entry) => Math.max(max, entry.attemptCount ?? 0), 0),
    newestServerTickAgeMs: newest ? Date.now() - newest : Number.POSITIVE_INFINITY,
  };
}

function oracleOf(html: string) {
  const bytes = Buffer.from(html, 'utf8');
  return { bytes, length: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

function containsSequence(haystack: Uint8Array, needle: number[]): boolean {
  for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    if (needle.every((value, offset) => haystack[i + offset] === value)) return true;
  }
  return false;
}

interface Receipt {
  title: string;
  status: number;
  governanceReceiptStatus: string;
  filename: string;
  suggestedFilename: string;
  savedLength: number;
  savedSha256: string;
  oracleLength: number;
  oracleSha256: string;
  b2bLength: number;
  b2bSha256: string;
  jsonWireSha256: string;
  equal: boolean;
}

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

test('no-hop isolation is proven before any export request', async () => {
  // This test issues no export request. Serial mode skips the browser test if it fails.
  expect(process.env.NEXTAUTH_URL, 'NEXTAUTH_URL must be the empty string in the parent process').toBe('');
  expect(path.isAbsolute(NO_HOP_LOG)).toBe(true);
  expect(path.resolve(NO_HOP_LOG).toLowerCase().startsWith(REPO_ROOT.toLowerCase() + path.sep)).toBe(false);
  const nodeOptions = (process.env.NODE_OPTIONS ?? '').replace(/\\/g, '/').toLowerCase();
  expect(nodeOptions).toContain('--require');
  expect(nodeOptions).toContain(PRELOAD_PATH.replace(/\\/g, '/').toLowerCase());

  await expect.poll(() => summarizeIsolation().newestServerTickAgeMs, { timeout: 15_000 }).toBeLessThan(3000);
  const isolation = summarizeIsolation();
  expect(isolation.serverContextsWithProcessedEnv).toBeGreaterThan(0);
  expect(isolation.nextauthUrlStates).toEqual(['EMPTY']); // blank value survived Next env loading
  expect(isolation.wrapperReached).toBe(true); // wrapper is fetch itself or is reached through Next's patch
  expect(isolation.attemptEvents).toBe(0);
  expect(isolation.maxAttemptCount).toBe(0);
  console.log(`B2D_PREFLIGHT ${JSON.stringify(isolation)}`);
});

test('real un-intercepted export route bytes equal the file the panel saves', async ({ page, browser }) => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cvf-b2d-download-'));
  const receipts: Receipt[] = [];
  const htmlByTitle = new Map<string, { html: string; generatedAt: string }>();
  const exportRequests: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/api/artifacts/export')) exportRequests.push(request.method());
  });
  let cleanup = 'NOT_RUN';

  async function buildAndDownload(title: string, formTitleAtDownload?: string): Promise<Receipt> {
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Source notes').fill(SOURCE_NOTES);
    // Passive capture of the real route response; the endpoint is never routed, fulfilled or mocked.
    const [response] = await Promise.all([
      page.waitForResponse(r => r.url().endsWith('/api/artifacts/export') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /Build HTML/i }).click(),
    ]);
    const wire = await response.body();
    const payload = JSON.parse(wire.toString('utf8')) as {
      success: boolean;
      data: { html: string; filename: string; generatedAt: string; governanceReceiptStatus?: string; governanceReceipt?: unknown; governanceReceiptAttemptId?: string; governanceState?: string };
    };
    expect(response.status()).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.governanceReceiptStatus).toBe('NOT_CONFIGURED');
    expect(payload.data.governanceReceipt).toBeUndefined();
    expect(payload.data.governanceReceiptAttemptId).toBeUndefined();
    expect(payload.data.governanceState).toBe('DRAFT_UNACCEPTED');
    htmlByTitle.set(title, { html: payload.data.html, generatedAt: payload.data.generatedAt });

    await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
    const previewHeading = page.frameLocator('iframe[title="Preview"]').locator('h1');
    await expect(previewHeading).toHaveText(title);

    if (formTitleAtDownload) {
      // Edit the form without rebuilding: the displayed earlier result must still be what downloads.
      await page.getByLabel('Title').fill(formTitleAtDownload);
      await expect(page.getByTestId('artifact-version-notice')).toHaveAttribute('data-version-state', /^(?!current$).+/);
      await expect(previewHeading).toHaveText(title);
      await expect(previewHeading).not.toHaveText(formTitleAtDownload);
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Download HTML/i }).click(),
    ]);
    const savedPath = path.join(dir, `${title.replace(/\s+/g, '-').toLowerCase()}-${download.suggestedFilename()}`);
    await download.saveAs(savedPath);
    const saved = new Uint8Array(await readFile(savedPath));

    // Oracle is over the route's decoded data.html, independent of the panel and of B2b.
    const oracle = oracleOf(payload.data.html);
    const handoff = createHtmlByteHandoff(payload.data.html);
    const savedSha256 = createHash('sha256').update(saved).digest('hex');
    const jsonWireSha256 = createHash('sha256').update(wire).digest('hex');

    expect(saved.length).toBe(oracle.length);
    expect(savedSha256).toBe(oracle.sha256);
    expect(Buffer.from(saved).equals(oracle.bytes)).toBe(true);
    expect(handoff.identity.byteLength).toBe(saved.length);
    expect(handoff.identity.htmlSha256).toBe(savedSha256);
    expect(verifyHtmlByteHandoff(handoff, saved)).toEqual({ ok: true });
    // Neither the JSON envelope nor the source text hash is the artifact identity.
    expect(savedSha256).not.toBe(jsonWireSha256);
    expect(saved.length).not.toBe(wire.length);
    expect(savedSha256).not.toBe(createHash('sha256').update(SOURCE_NOTES.trim()).digest('hex'));
    expect(Array.from(saved.slice(0, 9))).toEqual(Array.from(Buffer.from('<!doctype', 'utf8'))); // no leading BOM
    expect(containsSequence(saved, [0xef, 0xbb, 0xbf])).toBe(true); // mid-text BOM kept as data
    expect(containsSequence(saved, [0xe1, 0xbb, 0x87])).toBe(true); // U+1EC7
    expect(containsSequence(saved, [0xe6, 0x97, 0xa5])).toBe(true); // U+65E5
    expect(containsSequence(saved, [0xf0, 0x9f, 0x98, 0x80])).toBe(true); // U+1F600
    expect(containsSequence(saved, [0x0a])).toBe(true); // LF present
    expect(download.suggestedFilename()).toBe(payload.data.filename);

    return {
      title,
      status: response.status(),
      governanceReceiptStatus: payload.data.governanceReceiptStatus ?? 'MISSING',
      filename: payload.data.filename,
      suggestedFilename: download.suggestedFilename(),
      savedLength: saved.length,
      savedSha256,
      oracleLength: oracle.length,
      oracleSha256: oracle.sha256,
      b2bLength: handoff.identity.byteLength,
      b2bSha256: handoff.identity.htmlSha256,
      jsonWireSha256,
      equal: savedSha256 === oracle.sha256 && saved.length === oracle.length,
    };
  }

  try {
    await login(page);
    await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
    await page.goto('/artifacts');
    await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();

    expect(TITLE_A.length).toBe(TITLE_B.length);
    receipts.push(await buildAndDownload(TITLE_A, TITLE_FORM_CHANGE));
    receipts.push(await buildAndDownload(TITLE_B));

    const [a, b] = receipts;
    expect(a.savedLength).toBe(b.savedLength); // same-length version substitution
    expect(a.savedSha256).not.toBe(b.savedSha256);
    // The two builds differ only in the title and generation time, so the digest gap is the version.
    const htmlA = htmlByTitle.get(TITLE_A)!;
    const htmlB = htmlByTitle.get(TITLE_B)!;
    const normalize = (item: { html: string; generatedAt: string }, title: string) =>
      item.html.split(item.generatedAt).join('@TIME').split(title).join('@TITLE');
    expect(normalize(htmlA, TITLE_A)).toBe(normalize(htmlB, TITLE_B));
    expect(htmlA.html).not.toBe(htmlB.html);
    expect(exportRequests).toEqual(['POST', 'POST']); // form change without rebuild sent no request
  } finally {
    await rm(dir, { recursive: true, force: true });
    cleanup = await stat(dir).then(() => 'FAILED_STILL_PRESENT', () => 'REMOVED');
    const isolation = summarizeIsolation();
    const receipt = {
      browserName: browser.browserType().name(),
      browserVersion: browser.version(),
      headless: true,
      cleanup,
      exportRequests,
      isolationAfterRun: isolation,
      receipts,
    };
    console.log(`B2D_RECEIPT ${JSON.stringify(receipt)}`);
    await test.info().attach('b2d-receipt.json', { body: JSON.stringify(receipt, null, 2), contentType: 'application/json' });
  }
  expect(cleanup).toBe('REMOVED');
  const after = summarizeIsolation();
  expect(after.attemptEvents).toBe(0);
  expect(after.maxAttemptCount).toBe(0);
  expect(after.nextauthUrlStates).toEqual(['EMPTY']);
});
