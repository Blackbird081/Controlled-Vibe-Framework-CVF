import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { createHtmlByteHandoff, verifyHtmlByteHandoff } from '../../src/lib/html-artifact-byte-handoff';
import { login, seedStorage } from './utils';

// NCR HTML B2c: synthetic real-browser saved-file byte proof. The export response is fully
// intercepted; nothing here calls the real export route, a provider, real data or a store.
// The panel is read-only for this test. Passing proves only this fixture in this browser profile.

const TITLE_A = 'Alpha Report';
const TITLE_B = 'Bravo Report';
const TITLE_FORM_CHANGE = 'Charlie Report Changed After Build';
const BOM = '\uFEFF';

// BOM first, CRLF and lone LF mixed, non-ASCII (Vietnamese, CJK, astral emoji), trailing newline.
function buildFixtureHtml(title: string): string {
  return [
    `${BOM}<!doctype html>\r\n`,
    '<html lang="vi">\r\n',
    `<head><meta charset="utf-8"><title>${title}</title></head>\n`,
    `<body><main><h1>${title}</h1>\r\n`,
    '<p>Ki\u1EC3m tra byte: Ti\u1EBFng Vi\u1EC7t \u1EC7 \u1EEF, \u65E5\u672C\u8A9E, \uD83D\uDE00 U+1F600.</p>\n',
    '</main></body></html>\n',
  ].join('');
}

const FIXTURES: Record<string, { html: string; filename: string }> = {
  [TITLE_A]: { html: buildFixtureHtml(TITLE_A), filename: 'b2c-synthetic-alpha.html' },
  [TITLE_B]: { html: buildFixtureHtml(TITLE_B), filename: 'b2c-synthetic-bravo.html' },
};

// Independent oracle: Node Buffer + node:crypto, not the panel's Blob and not the B2b helper.
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

function hasLoneLf(bytes: Uint8Array): boolean {
  return bytes.some((value, i) => value === 0x0a && (i === 0 || bytes[i - 1] !== 0x0d));
}

interface Receipt {
  fixture: string;
  filename: string;
  suggestedFilename: string;
  savedLength: number;
  savedSha256: string;
  oracleLength: number;
  oracleSha256: string;
  b2bLength: number;
  b2bSha256: string;
  equal: boolean;
}

test.beforeEach(async ({ page }) => {
  await seedStorage(page);
});

async function openArtifactsWithSyntheticExport(page: Page, exportCalls: string[]) {
  await page.route('**/api/artifacts/export', async route => {
    const requested = route.request().postDataJSON() as { title?: string };
    const title = requested.title ?? '';
    exportCalls.push(title);
    const fixture = FIXTURES[title];
    if (!fixture) {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: `unexpected synthetic title ${title}` }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          html: fixture.html,
          filename: fixture.filename,
          receiptAnchor: 'receipt-b2c-synthetic',
          generatedAt: '2026-09-30T10:00:00.000Z',
          governanceState: 'DRAFT_UNACCEPTED',
          verification: [{ label: 'Synthetic fixture', passed: true, detail: 'B2c browser download proof.' }],
        },
      }),
    });
  });

  await login(page);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  await page.goto('/artifacts');
  await expect(page.getByRole('heading', { name: 'Review Packet Export' })).toBeVisible();
}

async function buildAndDownload(page: Page, title: string, dir: string, formTitleAtDownload?: string): Promise<Receipt> {
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: /Build HTML/i }).click();
  await expect(page.getByTitle('Preview')).toBeVisible();
  await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
  // Directly observe the displayed version: the Preview iframe renders this build's <h1>.
  const previewHeading = page.frameLocator('iframe[title="Preview"]').locator('h1');
  await expect(previewHeading).toHaveText(title);

  if (formTitleAtDownload) {
    // Edit the form without rebuilding: the displayed (earlier) result must still be what downloads.
    await page.getByLabel('Title').fill(formTitleAtDownload);
    await expect(page.getByTestId('artifact-version-notice')).toHaveAttribute('data-version-state', /^(?!current$).+/);
    await expect(previewHeading).toHaveText(title);
    await expect(previewHeading).not.toHaveText(formTitleAtDownload);
  }

  const fixture = FIXTURES[title];
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Download HTML/i }).click(),
  ]);
  const savedPath = path.join(dir, `${title.replace(/\s+/g, '-').toLowerCase()}-${download.suggestedFilename()}`);
  await download.saveAs(savedPath);
  const saved = new Uint8Array(await readFile(savedPath));

  const oracle = oracleOf(fixture.html);
  const handoff = createHtmlByteHandoff(fixture.html);
  const savedSha256 = createHash('sha256').update(saved).digest('hex');

  // Byte-level assertions, never text-only readback.
  expect(saved.length).toBe(oracle.length);
  expect(savedSha256).toBe(oracle.sha256);
  expect(Buffer.from(saved).equals(oracle.bytes)).toBe(true);
  expect(handoff.identity.byteLength).toBe(saved.length);
  expect(handoff.identity.htmlSha256).toBe(savedSha256);
  expect(verifyHtmlByteHandoff(handoff, saved)).toEqual({ ok: true });
  expect(Array.from(saved.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]); // BOM kept as data
  expect(containsSequence(saved, [0x0d, 0x0a])).toBe(true); // CRLF preserved
  expect(hasLoneLf(saved)).toBe(true); // lone LF preserved, not normalized
  expect(containsSequence(saved, [0xe1, 0xbb, 0x87])).toBe(true); // U+1EC7 e-dot-circumflex
  expect(containsSequence(saved, [0xe6, 0x97, 0xa5])).toBe(true); // U+65E5 CJK
  expect(containsSequence(saved, [0xf0, 0x9f, 0x98, 0x80])).toBe(true); // U+1F600 astral
  expect(download.suggestedFilename()).toBe(fixture.filename);

  return {
    fixture: title,
    filename: fixture.filename,
    suggestedFilename: download.suggestedFilename(),
    savedLength: saved.length,
    savedSha256,
    oracleLength: oracle.length,
    oracleSha256: oracle.sha256,
    b2bLength: handoff.identity.byteLength,
    b2bSha256: handoff.identity.htmlSha256,
    equal: savedSha256 === oracle.sha256 && saved.length === oracle.length,
  };
}

test('Artifacts panel saves the exact displayed HTML bytes for synthetic exports', async ({ page, browser }) => {
  expect(TITLE_A.length).toBe(TITLE_B.length);
  const oracleA = oracleOf(FIXTURES[TITLE_A].html);
  const oracleB = oracleOf(FIXTURES[TITLE_B].html);
  expect(oracleA.length).toBe(oracleB.length); // same-length version substitution
  expect(oracleA.sha256).not.toBe(oracleB.sha256);

  const exportCalls: string[] = [];
  const dir = await mkdtemp(path.join(tmpdir(), 'cvf-b2c-download-'));
  let cleanup = 'NOT_RUN';
  const receipts: Receipt[] = [];
  try {
    await openArtifactsWithSyntheticExport(page, exportCalls);

    // Displayed version A, form changed afterwards without rebuild.
    receipts.push(await buildAndDownload(page, TITLE_A, dir, TITLE_FORM_CHANGE));

    // Displayed version B, same byte length as A: the saved file must be B, not A.
    receipts.push(await buildAndDownload(page, TITLE_B, dir));

    const [a, b] = receipts;
    expect(a.savedLength).toBe(b.savedLength);
    expect(a.savedSha256).not.toBe(b.savedSha256);
    expect(b.savedSha256).toBe(oracleB.sha256);
    expect(b.savedSha256).not.toBe(oracleA.sha256);

    // Only the two synthetic builds reached the intercepted endpoint; the changed form never rebuilt.
    expect(exportCalls).toEqual([TITLE_A, TITLE_B]);
    expect(exportCalls).not.toContain(TITLE_FORM_CHANGE);
  } finally {
    await rm(dir, { recursive: true, force: true });
    cleanup = await stat(dir).then(() => 'FAILED_STILL_PRESENT', () => 'REMOVED');
    const version = browser.version();
    const receipt = { browserName: browser.browserType().name(), browserVersion: version, headless: true, cleanup, exportCalls, receipts };
    console.log(`B2C_RECEIPT ${JSON.stringify(receipt)}`);
    await test.info().attach('b2c-receipt.json', { body: JSON.stringify(receipt, null, 2), contentType: 'application/json' });
  }
  expect(cleanup).toBe('REMOVED');
});
