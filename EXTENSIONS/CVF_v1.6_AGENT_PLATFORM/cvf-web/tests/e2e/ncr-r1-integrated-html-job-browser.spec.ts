// Text Encoding Exception: synthetic Unicode and CRLF data are byte-oracle fixtures.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { loginAs, seedStorage } from './utils';

const root = process.env.CVF_NCR_RUN_ROOT!;
const recordId = 'ncr-synthetic-audit-job-001';
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const ownerKey = (owner: Owner) => hash(JSON.stringify([owner.userId, owner.orgId, owner.teamId]));
type Owner = { userId: string; orgId: string; teamId: string };
type Job = { jobId: string; owner: Owner; sourceRecordId: string; goal: string; criteria: { criterionId: string; text: string }[]; requestSha256: string };
type Snapshot = { versionId: string; sourceRecordId: string; requestSha256: string; htmlSha256: string; html: string; filename: string;
  state: string; acceptance: string };
type Link = { jobId: string; owner: Owner; sourceRecordId: string; versionId: string; requestSha256: string; htmlSha256: string };
type Decision = Link & { decisionId: string; actor: Owner; decision: string; criteriaReview: { criterionId: string; reviewNote: string }[] };
const sameOwner = (a: Owner, b: Owner) => expect(a).toEqual(b);
const fixture = [{ id: recordId, timestamp: '2026-10-18T00:00:00.000Z', action: 'NCR café 🌿\r\nline two',
  actorId: 'ncr-synthetic-worker', actorRole: 'admin', targetResource: 'fixtures/job-café.md', outcome: 'SYNTHETIC_READY_FOR_REVIEW' }];

test('one real synthetic job, ambiguous Save, GET reconciliation, link and local person decision', async ({ page, browser }) => {
  expect(browser.browserType().name()).toBe('chromium');
  expect(process.env.CVF_NCR_HTML_JOB_PROFILE).toBe('LOCAL_SYNTHETIC');
  expect(process.env.CVF_NCR_DRAFT_PROFILE).toBe('LOCAL_SYNTHETIC');
  const traffic: { method: string; path: string; status?: number; action?: string }[] = [];
  const externalBlocked: string[] = [];
  const externalSucceeded: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.hostname === 'localhost') {
      let action: string | undefined;
      if (request.method() === 'POST' && url.pathname === '/api/artifacts/jobs') {
        try { action = (request.postDataJSON() as { action?: string }).action; } catch { /* malformed traffic is reported by counts */ }
      }
      traffic.push({ method: request.method(), path: url.pathname, action });
    }
  });
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.hostname !== 'localhost') { externalSucceeded.push(url.hostname); return; }
    const row = [...traffic].reverse().find(item => item.path === url.pathname && item.method === response.request().method() && item.status === undefined);
    if (row) row.status = response.status();
  });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) { externalBlocked.push(url.hostname); return route.abort(); }
    return route.continue();
  });
  await page.route('**/api/admin/audit', route => route.request().method() === 'GET'
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: fixture }) })
    : route.continue());

  await seedStorage(page);
  await loginAs(page, process.env.CVF_ADMIN_USER!, process.env.CVF_ADMIN_PASS!);
  await page.evaluate(() => localStorage.setItem('cvf_language', 'en'));
  const session = await (await page.request.get('/api/auth/session')).json() as { user?: unknown; expires?: string };
  expect(session.user).toBeTruthy(); expect(Date.parse(session.expires ?? '')).toBeGreaterThan(Date.now());
  await page.goto('/work-transfer');
  await page.getByTestId(`export-record-${recordId}`).click();
  await expect(page.getByTestId('html-job-controls')).toBeVisible();
  await page.getByLabel('Goal').fill('Inspect exact Unicode HTML byte identity');
  await page.getByLabel('Criterion 1').fill('Heading and café 🌿 content match the saved version');
  await page.getByLabel('Title').fill('NCR job café 🌿');
  await page.getByLabel('Source reference').fill('fixtures/job-café.md');
  await page.getByLabel('Source notes').fill('Line one\r\nDòng thứ hai: café 🌿\r\nEnd.');

  const jobPost = page.waitForResponse(response => new URL(response.url()).pathname === '/api/artifacts/jobs'
    && response.request().method() === 'POST' && (response.request().postDataJSON() as { action: string }).action === 'CREATE_JOB');
  const exportPost = page.waitForResponse(response => new URL(response.url()).pathname === '/api/artifacts/export'
    && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Build HTML' }).click();
  const createdResponse = await jobPost; const exportResponse = await exportPost;
  expect(createdResponse.status()).toBe(201); expect(exportResponse.status()).toBe(200);
  const createdRaw = await createdResponse.body(); const exportRaw = await exportResponse.body();
  const created = (JSON.parse(createdRaw.toString('utf8')) as { success: boolean; data: Job }).data;
  const exported = (JSON.parse(exportRaw.toString('utf8')) as { success: boolean; data: { html: string; filename: string; governanceState: string } }).data;
  expect(created.sourceRecordId).toBe(recordId);
  expect(created.goal).toBe('Inspect exact Unicode HTML byte identity');
  expect(created.criteria).toEqual([{ criterionId: 'c1', text: 'Heading and café 🌿 content match the saved version' }]);
  expect(exported.governanceState).toBe('DRAFT_UNACCEPTED');
  const html = Buffer.from(exported.html, 'utf8');
  expect(exported.html).toContain('café');
  await fs.writeFile(path.join(root, 'export-response.json'), exportRaw);
  await fs.writeFile(path.join(root, 'exported.html'), html);
  await expect(page.getByTestId('artifact-draft-state')).toContainText('DRAFT / UNACCEPTED');

  let saveServer: { status: number; body: Buffer; versionId: string; submittedBytes: number; submittedSha256: string } | null = null;
  let finishSave!: () => void;
  const saveObserved = new Promise<void>(resolve => { finishSave = resolve; });
  await page.route('**/api/artifacts/drafts', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    const submitted = route.request().postDataBuffer()!;
    const submittedId = (route.request().postDataJSON() as { versionId: string }).versionId;
    const actual = await route.fetch();
    const body = await actual.body();
    const reply = JSON.parse(body.toString('utf8')) as { success: boolean; state: string; versionId: string };
    expect(actual.status()).toBe(201);
    expect(reply).toEqual({ success: true, state: 'SAVED', versionId: submittedId });
    saveServer = { status: actual.status(), body, versionId: reply.versionId, submittedBytes: submitted.length, submittedSha256: hash(submitted) };
    await fs.writeFile(path.join(root, 'save-server-response.json'), body);
    await page.unroute('**/api/artifacts/drafts');
    await route.abort('failed');
    finishSave();
  });
  await page.getByTestId('save-displayed-draft').click();
  await saveObserved;
  expect(saveServer).not.toBeNull();
  const savedId = saveServer!.versionId;
  await expect(page.getByTestId('draft-recovery-notice')).toContainText(/unavailable|unconfirmed/i);
  await expect(page.getByTestId('save-displayed-draft')).toBeDisabled();
  const journalBefore = await page.evaluate(() => sessionStorage.getItem('cvf-html-job-pending-v1'));
  expect(journalBefore).toContain(savedId);
  expect((JSON.parse(journalBefore!) as { operation: string; jobId: string }).operation).toBe('SAVE_DRAFT');
  expect((JSON.parse(journalBefore!) as { jobId: string }).jobId).toBe(created.jobId);

  await page.reload();
  await page.getByTestId(`export-record-${recordId}`).click();
  await expect(page.getByTestId('html-job-controls')).toBeVisible();
  await expect(page.getByTestId('reconcile-job-operation')).toContainText(savedId);
  await expect(page.getByTestId('reconcile-draft')).toContainText(savedId);
  const postsBeforeGet = traffic.filter(row => row.method === 'POST').length;
  await page.getByTestId('reconcile-draft').click();
  await expect(page.getByTestId('restored-draft')).toHaveAttribute('data-version-id', savedId);
  await page.getByTestId('reconcile-job-operation').click();
  await expect(page.getByTestId('link-confirmed-version')).toBeVisible();
  expect(traffic.filter(row => row.method === 'POST')).toHaveLength(postsBeforeGet);
  const missingLink = await page.request.get(`/api/artifacts/jobs?kind=version&jobId=${created.jobId}&sourceRecordId=${recordId}&versionId=${savedId}`);
  expect(missingLink.status()).toBe(404);

  const draftRead = await page.request.get(`/api/artifacts/drafts?sourceRecordId=${recordId}&id=${savedId}`);
  expect(draftRead.status()).toBe(200);
  const draftRaw = await draftRead.body();
  await fs.writeFile(path.join(root, 'draft-read-response.json'), draftRaw);
  const snapshot = (JSON.parse(draftRaw.toString('utf8')) as { success: boolean; data: Snapshot }).data;
  expect(snapshot.versionId).toBe(savedId); expect(snapshot.sourceRecordId).toBe(recordId);
  expect(snapshot.state).toBe('CLIENT_SUBMITTED_UNVERIFIED'); expect(snapshot.acceptance).toBe('DRAFT_UNACCEPTED');
  expect(snapshot.requestSha256).toBe(created.requestSha256);
  expect(snapshot.htmlSha256).toBe(hash(html));
  expect(Buffer.from(snapshot.html, 'utf8').equals(html)).toBe(true);
  const savedFile = path.join(root, 'drafts', ownerKey(created.owner), `${savedId}.json`);
  const savedBytes = await fs.readFile(savedFile);
  const onDisk = JSON.parse(savedBytes.toString('utf8')) as Snapshot;
  expect(Buffer.from(onDisk.html, 'utf8').equals(html)).toBe(true);
  expect(onDisk.htmlSha256).toBe(hash(html));
  const [download] = await Promise.all([page.waitForEvent('download'),
    page.getByTestId('restored-draft').getByRole('button', { name: 'Download saved HTML' }).click()]);
  await download.saveAs(path.join(root, 'downloaded.html'));
  const downloaded = await fs.readFile(path.join(root, 'downloaded.html'));
  expect(downloaded.equals(html)).toBe(true);

  const linkPost = page.waitForResponse(response => new URL(response.url()).pathname === '/api/artifacts/jobs'
    && response.request().method() === 'POST' && (response.request().postDataJSON() as { action: string }).action === 'LINK_VERSION');
  await page.getByTestId('link-confirmed-version').click();
  const linkResponse = await linkPost; expect(linkResponse.status()).toBe(201);
  const link = (await linkResponse.json() as { success: boolean; data: Link }).data;
  expect(link.jobId).toBe(created.jobId); expect(link.versionId).toBe(savedId);
  expect(link.sourceRecordId).toBe(recordId); sameOwner(link.owner, created.owner);
  expect(link.requestSha256).toBe(created.requestSha256); expect(link.htmlSha256).toBe(hash(html));
  await expect(page.getByTestId('accept-synthetic-version')).toBeVisible();
  await page.getByLabel('Review note c1').fill('Inspected heading and exact saved bytes.');
  await page.getByLabel(/I reviewed this exact saved version/).check();
  const decisionPost = page.waitForResponse(response => new URL(response.url()).pathname === '/api/artifacts/jobs'
    && response.request().method() === 'POST' && (response.request().postDataJSON() as { action: string }).action === 'ACCEPT_VERSION');
  await page.getByTestId('accept-synthetic-version').click();
  const decisionResponse = await decisionPost; expect(decisionResponse.status()).toBe(201);
  const decision = (await decisionResponse.json() as { success: boolean; data: Decision }).data;
  sameOwner(decision.owner, created.owner); sameOwner(decision.actor, created.owner);
  expect(decision.jobId).toBe(created.jobId); expect(decision.versionId).toBe(savedId);
  expect(decision.sourceRecordId).toBe(recordId); expect(decision.requestSha256).toBe(created.requestSha256);
  expect(decision.htmlSha256).toBe(hash(html));
  expect(decision.criteriaReview).toEqual([{ criterionId: 'c1', passed: true, reviewNote: 'Inspected heading and exact saved bytes.' }]);
  expect(decision.decision).toBe('ACCEPT_FOR_LOCAL_SYNTHETIC_REVIEW');
  await expect(page.getByTestId('synthetic-review-decision')).toContainText(decision.decisionId);
  const afterDecision = (await (await page.request.get(`/api/artifacts/drafts?sourceRecordId=${recordId}&id=${savedId}`)).json() as { data: Snapshot }).data;
  expect(afterDecision.state).toBe('CLIENT_SUBMITTED_UNVERIFIED');
  expect(afterDecision.acceptance).toBe('DRAFT_UNACCEPTED');
  expect(Buffer.from(afterDecision.html, 'utf8').equals(html)).toBe(true);

  const postCounts = { create: traffic.filter(x => x.action === 'CREATE_JOB').length,
    export: traffic.filter(x => x.path === '/api/artifacts/export' && x.method === 'POST').length,
    save: traffic.filter(x => x.path === '/api/artifacts/drafts' && x.method === 'POST').length,
    link: traffic.filter(x => x.action === 'LINK_VERSION').length,
    accept: traffic.filter(x => x.action === 'ACCEPT_VERSION').length };
  expect(postCounts).toEqual({ create: 1, export: 1, save: 1, link: 1, accept: 1 });
  expect(traffic.filter(x => ['/api/governance/evaluate', '/api/execute'].includes(x.path))).toHaveLength(0);
  expect(externalSucceeded).toHaveLength(0);
  const report = { browser: browser.version(), recordId, jobId: created.jobId, versionId: savedId,
    owner: created.owner, requestSha256: created.requestSha256, htmlBytes: html.length, htmlSha256: hash(html),
    exportResponse: { bytes: exportRaw.length, sha256: hash(exportRaw), status: exportResponse.status() },
    createdResponse: { bytes: createdRaw.length, sha256: hash(createdRaw), status: createdResponse.status() },
    saveResponse: { bytes: saveServer!.body.length, sha256: hash(saveServer!.body), status: saveServer!.status,
      submittedBytes: saveServer!.submittedBytes, submittedSha256: saveServer!.submittedSha256, acknowledgmentDropped: true },
    draftRead: { bytes: draftRaw.length, sha256: hash(draftRaw), status: draftRead.status(), state: snapshot.state, acceptance: snapshot.acceptance },
    savedFile: { bytes: savedBytes.length, sha256: hash(savedBytes) }, downloaded: { bytes: downloaded.length, sha256: hash(downloaded) },
    link: { jobId: link.jobId, versionId: link.versionId, requestSha256: link.requestSha256, htmlSha256: link.htmlSha256 },
    decision: { decisionId: decision.decisionId, jobId: decision.jobId, versionId: decision.versionId,
      requestSha256: decision.requestSha256, htmlSha256: decision.htmlSha256, actor: decision.actor },
    exactBytes: downloaded.equals(html) && Buffer.from(snapshot.html, 'utf8').equals(html) && Buffer.from(onDisk.html, 'utf8').equals(html),
    missingLinkStatus: missingLink.status(), postCounts, traffic, externalBlocked, externalSucceeded,
    evalExecuteRequests: 0, draftStateAfterDecision: afterDecision.state, draftAcceptanceAfterDecision: afterDecision.acceptance };
  await fs.writeFile(path.join(root, 'journey.json'), JSON.stringify(report, null, 2));
  console.log('NCR_R1_JOB_BROWSER_RESULT ' + JSON.stringify({ jobId: created.jobId, versionId: savedId,
    htmlBytes: html.length, htmlSha256: hash(html), postCounts, exactBytes: report.exactBytes }));
});
