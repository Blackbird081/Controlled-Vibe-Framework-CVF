// Text Encoding Exception: the synthetic Unicode and CRLF fixture checks exact UTF-8 recovery.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAs, seedStorage } from './utils';

const root = process.env.CVF_NCR_RUN_ROOT!;
const recordA = 'ncr-synthetic-audit-001';
const recordB = 'ncr-synthetic-audit-002';
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const fixture = [
  { id: recordA, timestamp: '2026-10-18T00:00:00.000Z', action: 'NCR synthetic review alpha', actorId: 'ncr-synthetic-worker', actorRole: 'admin', targetResource: 'fixtures/ncr-review-alpha.md', outcome: 'SYNTHETIC_READY_FOR_REVIEW' },
  { id: recordB, timestamp: '2026-10-18T00:01:00.000Z', action: 'NCR synthetic review beta', actorId: 'ncr-synthetic-worker', actorRole: 'admin', targetResource: 'fixtures/ncr-review-beta.md', outcome: 'SYNTHETIC_PENDING_REVIEW' },
];

test('actual Work Transfer preserves saved HTML and does not replay export on recovery', async ({ page, browser }) => {
  expect(browser.browserType().name()).toBe('chromium');
  expect(process.env.CVF_NCR_RUNNER_PROFILE).toBe('LOCAL_SYNTHETIC');
  expect(process.env.NODE_ENV).toBe('development');
  const methods: Record<string, string[]> = { export: [], drafts: [], evaluate: [] };
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/artifacts/export') methods.export.push(request.method());
    if (pathname === '/api/artifacts/drafts') methods.drafts.push(request.method());
    if (pathname === '/api/governance/evaluate' || pathname === '/api/execute') methods.evaluate.push(request.method());
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  await page.route('**/api/admin/audit', route => route.request().method() === 'GET'
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: fixture }) })
    : route.continue());
  await seedStorage(page);
  await loginAs(page, process.env.CVF_ADMIN_USER!, process.env.CVF_ADMIN_PASS!);
  await page.evaluate(() => localStorage.setItem('cvf_language','en'));
  const session = await (await page.request.get('/api/auth/session')).json() as { user?: unknown; expires?: string };
  expect(session.user).toBeTruthy(); expect(Date.parse(session.expires || '')).toBeGreaterThan(Date.now());
  await page.goto('/work-transfer');
  await expect(page.getByTestId(`export-record-${recordA}`)).toBeVisible();
  await page.getByTestId(`export-record-${recordA}`).click();
  const panel = page.getByTestId('inline-export-panel');
  await expect(panel).toBeVisible();
  await page.getByLabel('Title').fill('NCR Recovery Unicode Version');
  await page.getByLabel('Source reference').fill('fixtures/recovery-unicode.md');
  await page.getByLabel('Source notes').fill('Synthetic line one\r\nDòng thứ hai: café 🌿\r\nEnd.');
  const [exportResponse] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/artifacts/export' && r.request().method() === 'POST'),
    page.getByRole('button',{name:/Build HTML/i}).click(),
  ]);
  expect(exportResponse.status()).toBe(200);
  const exportRaw = await exportResponse.body();
  await fs.writeFile(path.join(root,'export-response.json'),exportRaw);
  const exported = JSON.parse(exportRaw.toString('utf8')) as { success:boolean; data:{ html:string; filename:string; governanceState:string } };
  expect(exported.success).toBe(true);
  expect(exported.data.governanceState).toBe('DRAFT_UNACCEPTED');
  const html = Buffer.from(exported.data.html,'utf8');
  await fs.writeFile(path.join(root,'exported.html'),html);
  await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');
  const [saveResponse] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/artifacts/drafts' && r.request().method() === 'POST'),
    page.getByTestId('save-displayed-draft').click(),
  ]);
  expect(saveResponse.status()).toBe(201);
  const saveBody = await saveResponse.json() as { versionId:string; state:string };
  expect(saveBody.state).toBe('SAVED');
  const firstId = saveBody.versionId;
  expect(firstId).toMatch(/^[a-f\d-]{36}$/i);
  await page.reload();
  await page.getByTestId(`export-record-${recordA}`).click();
  await expect(page.getByTestId('inline-export-panel')).toBeVisible();
  await expect(page.getByTestId('artifact-draft-state')).toHaveCount(0);
  await page.getByTestId('list-saved-drafts').click();
  const restoredButton = page.getByTestId(`restore-${firstId}`);
  await expect(restoredButton).toBeVisible();
  await restoredButton.click();
  const restored = page.getByTestId('restored-draft');
  await expect(restored).toHaveAttribute('data-version-id',firstId);
  await expect(restored).toContainText(/unverified.*unaccepted/i);
  const readResponse = await page.request.get(`/api/artifacts/drafts?sourceRecordId=${recordA}&id=${firstId}`);
  expect(readResponse.status()).toBe(200);
  const readRaw = await readResponse.body();
  await fs.writeFile(path.join(root,'saved-read-response.json'),readRaw);
  const readData = (JSON.parse(readRaw.toString('utf8')) as {data:{html:string;state:string;acceptance:string}}).data;
  expect(readData.state).toBe('CLIENT_SUBMITTED_UNVERIFIED');
  expect(readData.acceptance).toBe('DRAFT_UNACCEPTED');
  expect(Buffer.from(readData.html,'utf8').equals(html)).toBe(true);
  const [download] = await Promise.all([page.waitForEvent('download'),restored.getByRole('button',{name:/Download saved HTML/i}).click()]);
  await download.saveAs(path.join(root,'restored.html'));
  const downloaded = await fs.readFile(path.join(root,'restored.html'));
  expect(downloaded.equals(html)).toBe(true);
  expect((await page.request.get(`/api/artifacts/drafts?sourceRecordId=${recordB}&id=${firstId}`)).status()).toBe(404);

  // One failed GET leaves the accepted snapshot available; it never triggers export.
  await page.route('**/api/artifacts/drafts?*', async route => {
    if (route.request().url().includes(`id=${firstId}`)) { await page.unroute('**/api/artifacts/drafts?*'); await route.abort(); }
    else await route.continue();
  });
  await restoredButton.click();
  await expect(page.getByTestId('draft-recovery-notice')).toContainText(/unavailable|unconfirmed/i);
  expect(methods.export).toEqual(['POST']);
  await restoredButton.click();
  await expect(restored).toHaveAttribute('data-version-id',firstId);

  // Delay an old-record read, then switch records; the stale answer must not display.
  await page.route('**/api/artifacts/drafts?*', async route => {
    if (route.request().url().includes(`id=${firstId}`)) { await page.unroute('**/api/artifacts/drafts?*'); await new Promise(resolve=>setTimeout(resolve,800)); await route.continue(); }
    else await route.continue();
  });
  const oldClick = restoredButton.click();
  await page.getByTestId(`export-record-${recordB}`).click();
  await oldClick.catch(()=>undefined);
  await expect(page.getByTestId('restored-draft')).toHaveCount(0);
  await page.getByTestId(`export-record-${recordA}`).click();

  // Ambiguous client response after the real POST reached the server: retain its ID, reconcile by real GET, no retry.
  await page.getByLabel('Title').fill('NCR Ambiguous Save Version');
  const [secondExport] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === '/api/artifacts/export' && r.request().method() === 'POST'),
    page.getByRole('button',{name:/Build HTML/i}).click(),
  ]);
  expect(secondExport.status()).toBe(200);
  let ambiguousId = '';
  await page.route('**/api/artifacts/drafts', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    ambiguousId = (route.request().postDataJSON() as {versionId:string}).versionId;
    const actual = await route.fetch();
    expect(actual.status()).toBe(201);
    await page.unroute('**/api/artifacts/drafts');
    await route.abort();
  });
  await page.getByTestId('save-displayed-draft').click();
  await expect(page.getByTestId('draft-recovery-notice')).toContainText(/unavailable|unconfirmed/i);
  expect(ambiguousId).toMatch(/^[a-f\d-]{36}$/i);
  await expect(page.getByTestId('save-displayed-draft')).toBeDisabled();
  await page.getByTestId('reconcile-draft').click();
  await expect(page.getByTestId('restored-draft')).toHaveAttribute('data-version-id',ambiguousId);
  expect(methods.drafts.filter(method=>method==='POST')).toHaveLength(2);
  expect(methods.export).toEqual(['POST','POST']);
  expect(methods.evaluate).toEqual([]);

  await page.context().clearCookies();
  expect((await page.request.get(`/api/artifacts/drafts?sourceRecordId=${recordA}&id=${firstId}`)).status()).toBe(401);
  await page.reload();
  await expect(page.getByTestId('restored-draft')).toHaveCount(0);
  await loginAs(page, process.env.CVF_ADMIN_USER!, process.env.CVF_ADMIN_PASS!);
  await page.goto('/work-transfer');
  await page.getByTestId(`export-record-${recordA}`).click();
  await page.getByTestId('list-saved-drafts').click();
  await expect(page.getByTestId(`restore-${firstId}`)).toBeVisible();
  expect(methods.export).toEqual(['POST','POST']);
  expect(methods.evaluate).toEqual([]);
  const report = { browser:browser.version(), recordA, firstId, ambiguousId, exportMethods:methods.export,
    draftMethods:methods.drafts, evaluateMethods:methods.evaluate, htmlBytes:html.length, htmlSha256:hash(html),
    downloadedSha256:hash(downloaded), exactBytes:downloaded.equals(html), wrongRecordStatus:404, loggedOutStatus:401 };
  await fs.writeFile(path.join(root,'journey.json'),JSON.stringify(report,null,2));
  console.log('NCR_DRAFT_RECOVERY_RESULT '+JSON.stringify(report));
});
