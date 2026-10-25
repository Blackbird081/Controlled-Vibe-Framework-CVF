// Text Encoding Exception: Vietnamese fixture labels and localized UI text are intentional.
/**
 * Root-only consumer. Two authorized paid claims maximum; denials use the real route and never invoke the provider.
 * Runs the whole path in Vietnamese with native keyboard activation: desktop for the first version and the denial
 * drills, a 390px viewport for the revision. The ordinary first preview is timed before any fault drill. The v1 account
 * review is an ACCEPTED automated fixture whose stored decision is read back and re-read after restart and restore; final
 * v2 is never decided here. Provider accounting comes from Root's guard state, never from page events. Source authored
 * by the pilot worker and not executed by it.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { loginAs, seedStorageWithAlibaba } from './utils';
import { pilotCopy } from '../../src/components/html-pilot-copy';
import {
  CLEAN_PREVIEW_PHASES, PILOT_LIMITS, assertCleanPreviewTiming, assertDecisionAttribution, assertDecisionBinding, assertDecisionPersisted,
  assertDeniedEffectDelta, assertDownloadedBytes, assertFixtureGoals, assertGuardAdvance, assertGuardDelta, assertIdentities, assertLateOutcomeFenced,
  assertPinnedPrincipal, assertPreviewStructure, assertRedacted, assertRestoreSeconds, assertSerializedGoal, assertTimings, bindFixtureAttribution,
  guardManifestCandidates, parseGuardBinding, parseGuardReading, type EffectCounters, type FaultInterval, type GuardReading,
  type ProductDecisionReadback, type TimingPhase,
} from '../helpers/ncr-html-pilot-proof-assertions';

const control = process.env.CVF_NCR_HTML_PILOT_CONTROL_DIR!;
const goal = process.env.CVF_NCR_HTML_PILOT_INITIAL_GOAL!;
const revision = process.env.CVF_NCR_HTML_PILOT_REVISION_GOAL!;
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
const readControl = async (name: string, schema: string) => {
  const file = path.join(control, name);
  const deadline = Date.now() + 420_000;
  for (;;) {
    try {
      const value = JSON.parse(await fs.readFile(file, 'utf8')) as Record<string, unknown>;
      expect(value.schema).toBe(schema);
      return value;
    } catch (error) { if (Date.now() >= deadline) throw new Error(`ROOT_CONTROL_TIMEOUT:${name}:${String(error)}`); }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};
const writeControl = async (name: string, value: Record<string, unknown>) => fs.writeFile(path.join(control, name),
  `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

const copy = pilotCopy('vi');
const text = copy.controls;
const expectedV1 = { heading: 'Không gian đọc Ánh Sao', sections: ['Giới thiệu', 'Hoạt động', 'Liên hệ'], ctaText: 'Đăng ký tham gia' };
const expectedV2 = { ...expectedV1, heading: 'Ngày hội đọc Ánh Sao' };
const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

/** Only a canonical upper-case code from the route is ever recorded; anything else is reported as unsafe. */
async function assertStart(stage: string, response: { status(): number; text(): Promise<string> }, expectedStatus = 200) {
  if (response.status() === expectedStatus) return;
  let code = 'UNSAFE_OR_ABSENT';
  try {
    const value = JSON.parse(await response.text()) as { error?: unknown };
    if (typeof value.error === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(value.error)) code = value.error;
  } catch { /* A body that is not JSON is never echoed. */ }
  throw new Error(`PILOT_CONSUMER_REJECTED:${stage}:${response.status()}:${code}`);
}

/** Native keyboard activation: the control must be reachable, focused and visible inside the viewport. */
async function activate(page: Page, locator: Locator, key: 'Enter' | 'Space' = 'Enter') {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  await expect(locator).toBeFocused();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  if (!box || box.width <= 0 || box.x < 0 || box.x + box.width > viewport.width + 1) throw new Error('PILOT_CONSUMER_CONTROL_OUTSIDE_VIEWPORT');
  await page.keyboard.press(key);
}

const listFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(full)); else files.push(full);
  }
  return files;
};

const readJsonFile = async (file: string, code: string): Promise<unknown> => {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { throw new Error(code); }
};

/**
 * Root-authoritative provider accounting. The existing Root global manifest names run, grant, head and the guard state;
 * a missing, ambiguous, malformed, foreign or reset source fails closed and there is no browser-count fallback.
 */
async function openGuardReader(): Promise<(label: string) => Promise<GuardReading>> {
  const runRoot = process.env.CVF_NCR_HTML_PILOT_RUN_ROOT;
  const found: Buffer[] = [];
  for (const file of guardManifestCandidates(runRoot, control)) {
    try { found.push(await fs.readFile(file)); } catch { /* Only a candidate that exists counts. */ }
  }
  if (found.length === 0) throw new Error('PILOT_PROOF_GUARD_MANIFEST_MISSING');
  if (found.some(raw => !raw.equals(found[0]))) throw new Error('PILOT_PROOF_GUARD_MANIFEST_AMBIGUOUS');
  let manifest: unknown;
  try { manifest = JSON.parse(found[0].toString('utf8')); } catch { throw new Error('PILOT_PROOF_GUARD_MANIFEST_INVALID'); }
  const binding = parseGuardBinding(manifest, createHash('sha256').update(found[0]).digest('hex'),
    { sourceHead: process.env.CVF_NCR_HTML_PILOT_SOURCE_HEAD, ownedRoot: runRoot });
  let previous: GuardReading | null = null;
  return async label => {
    const reading = parseGuardReading(await readJsonFile(binding.guardStatePath, 'PILOT_PROOF_GUARD_STATE_INVALID'), binding);
    assertGuardAdvance(previous, reading, label);
    previous = reading;
    return reading;
  };
}

test('one real Home create and one same-job revision with exact saved-version recovery', async ({ page, browser }, testInfo) => {
  expect(browser.browserType().name()).toBe('chromium');
  const fixtureHashes = assertFixtureGoals(goal, revision);
  const starts: string[] = [];
  const executionRequests: { first?: Record<string, unknown>; second?: Record<string, unknown> } = {};
  page.on('request', request => {
    const selected = new URL(request.url());
    if (selected.pathname === '/api/execute' && request.method() === 'POST') {
      starts.push(request.url());
      if (!executionRequests.first) executionRequests.first = request.postDataJSON() as Record<string, unknown>;
      if (starts.length === 2) executionRequests.second = request.postDataJSON() as Record<string, unknown>;
    }
  });
  await page.route('**/*', route => {
    const selected = new URL(route.request().url());
    return ['localhost', '127.0.0.1', '[::1]'].includes(selected.hostname) ? route.continue() : route.abort();
  });
  await seedStorageWithAlibaba(page, 'qwen-flash');
  await page.addInitScript(() => { localStorage.setItem('cvf_language', 'vi'); });
  await loginAs(page, process.env.CVF_NCR_HTML_PILOT_USER!, process.env.CVF_NCR_HTML_PILOT_PASS!);
  const session = await (await page.request.get('/api/auth/session')).json() as { user?: { role?: string; userId?: string } };
  expect(session.user?.role).toBe('developer');
  expect(session.user?.userId).toBe('usr_3');

  // Owned operation/claim/outcome and artifact counters come from the Root-owned manifest's directories; provider
  // accounting comes from the Root guard. Browser execute starts are page events only and are named as such.
  const owned = JSON.parse(await fs.readFile(process.env.CVF_NCR_HTML_PILOT_MANIFEST_PATH!, 'utf8')) as { operationRoot: string; storeRoot: string; owner: unknown };
  const pinnedOwner = assertPinnedPrincipal(owned.owner, 'effect-profile-owner');
  expect(session.user?.userId).toBe(pinnedOwner.userId);
  const readGuard = await openGuardReader();
  const guardAtStart = await readGuard('run-start');
  const readCounters = async (label: string): Promise<EffectCounters> => {
    const entries = await fs.readdir(owned.operationRoot);
    const guard = await readGuard(label);
    return { operations: entries.filter(name => /^claim-[a-f0-9]{64}\.json$/.test(name)).length,
      claims: entries.filter(name => /^slot-\d+\.json$/.test(name)).length,
      outcomes: entries.filter(name => /^outcome-[a-f0-9]{32}\.json$/.test(name)).length,
      browserExecuteStarts: starts.length, artifactWrites: (await listFiles(owned.storeRoot)).length,
      guardCallsUsed: guard.callsUsed, guardAttempts: guard.attempts };
  };
  const faults: FaultInterval[] = [];
  const drills: Array<{ label: string; status: number; code: string | null; guardBefore: GuardReading; guardAfter: GuardReading }> = [];
  const denied = async (label: string, status: number, code: string | null, run: () => Promise<{ status(): number; json(): Promise<{ error?: string }> }>) => {
    const startMs = performance.now();
    const before = await readCounters(`${label}:before`);
    const response = await run();
    expect(response.status(), label).toBe(status);
    if (code !== null) expect((await response.json()).error, label).toBe(code);
    const after = await readCounters(`${label}:after`);
    assertDeniedEffectDelta(before, after, label);
    faults.push({ label, startMs, endMs: performance.now() });
    drills.push({ label, status, code, guardBefore: { callsUsed: before.guardCallsUsed, attempts: before.guardAttempts },
      guardAfter: { callsUsed: after.guardCallsUsed, attempts: after.guardAttempts } });
  };
  const phasesFrom = (marks: number[]): TimingPhase[] => CLEAN_PREVIEW_PHASES.map((name, i) => ({ name, startMs: marks[i], endMs: marks[i + 1] }));

  // Decline drill: an effective decline reaches the form again with zero starts and a locked, explained submit.
  await page.goto('/home?template=web_build_handoff&htmlPilot=1');
  await expect(page.getByRole('heading', { name: copy.home.heading })).toBeVisible();
  await page.locator('input[name="websiteGoal"]').fill(goal);
  expect((await page.locator('input[name="websiteGoal"]').inputValue()).length).toBe(PILOT_LIMITS.initialGoalLength);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: copy.home.continueLabel })).toBeFocused();
  const declineStart = performance.now();
  const beforeDecline = await readCounters('decline-before-consent:before');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('html-pilot-effect-disclosure')).toBeVisible();
  expect(starts).toHaveLength(0);
  await activate(page, page.getByRole('button', { name: /^(Hủy|Cancel)$/ }), 'Space');
  await expect(page.getByTestId('html-pilot-goal-blocked')).toBeVisible();
  await expect(page.getByRole('button', { name: copy.home.continueLabel })).toBeDisabled();
  expect(starts).toHaveLength(0);
  assertDeniedEffectDelta(beforeDecline, await readCounters('decline-before-consent:after'), 'decline-before-consent');
  faults.push({ label: 'decline-before-consent', startMs: declineStart, endMs: performance.now() });

  // First paid start and the ordinary path to the first visible preview. No fault drill has run yet or runs inside it.
  await page.goto('/home?template=web_build_handoff&htmlPilot=1');
  await page.locator('input[name="websiteGoal"]').fill(goal);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('html-pilot-effect-disclosure')).toBeVisible();
  expect(starts).toHaveLength(0);
  const guardBeforeFirstStart = await readGuard('first-start:before');
  const firstSubmitStart = performance.now();
  const firstResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/execute'
    && response.request().method() === 'POST');
  await activate(page, page.getByTestId('html-pilot-confirm-effect'));
  const first = await firstResponse;
  await assertStart('first-start', first);
  const firstBody = await first.json() as { success: boolean; output: string; governanceEvidenceReceipt?: {
    provider: string; model: string; receiptIntegrity?: { signatureStatus: string };
    htmlPilotTiming?: { providerAwaitMs: number; localGovernanceMs: number; routeElapsedMs: number };
    htmlPilotEvidence?: { runId: string; rootRunId: string; outputSha256: string; receiptId: string; profileDigest: string } } };
  const firstResponseEnd = performance.now();
  expect(firstBody.success).toBe(true);
  expect(firstBody.governanceEvidenceReceipt?.provider).toBe('alibaba');
  expect(firstBody.governanceEvidenceReceipt?.model).toBe('qwen-flash');
  expect(firstBody.governanceEvidenceReceipt?.htmlPilotEvidence?.outputSha256).toBe(hash(firstBody.output));
  expect(firstBody.governanceEvidenceReceipt?.receiptIntegrity?.signatureStatus).toBe('SIGNED');
  expect(starts).toHaveLength(1);
  assertSerializedGoal(executionRequests.first, goal);
  const firstEvidence = firstBody.governanceEvidenceReceipt!.htmlPilotEvidence!;
  const firstLink = page.getByTestId('html-pilot-transfer-exact-run');
  await expect(firstLink).toBeVisible();
  const firstHref = await firstLink.getAttribute('href');
  expect(firstHref).toMatch(/^\/work-transfer\?source=/);
  const firstExecutionId = new URL(`http://localhost${firstHref}`).searchParams.get('source')!;
  await activate(page, firstLink);
  const controls = page.getByTestId('html-pilot-job-controls');
  await expect(controls).toBeVisible();
  await expect(controls.getByRole('heading', { name: text.heading })).toBeVisible();
  await activate(page, page.getByTestId('pilot-create-draft'));
  await expect(page.getByTestId('pilot-job-id')).toBeVisible();
  const firstJobCreated = performance.now();
  const jobId = await page.getByTestId('pilot-job-id').getAttribute('data-job-id');
  expect(jobId).toMatch(/^[0-9a-f-]{36}$/);
  await activate(page, page.getByTestId('pilot-build-preview'));
  await activate(page, page.getByTestId('pilot-save-version'));
  await expect(page.getByTestId('html-pilot-saved-version')).toBeVisible();
  const firstSavedVisible = performance.now();
  const v1 = (await page.getByTestId('html-pilot-saved-version').getAttribute('data-version-id'))!;
  expect(v1).toMatch(/^[0-9a-f-]{36}$/);
  const firstPreview = page.frameLocator(`iframe[title="${text.previewTitle}"]`);
  await expect(firstPreview.locator('h1')).toHaveText(expectedV1.heading);
  const firstPreviewVisible = performance.now();
  const v1Phases = phasesFrom([firstSubmitStart, firstResponseEnd, firstJobCreated, firstSavedVisible, firstPreviewVisible]);
  const v1PreviewSeconds = (firstPreviewVisible - firstSubmitStart) / 1000;
  const firstTiming = firstBody.governanceEvidenceReceipt?.htmlPilotTiming;
  const v1Timings = assertTimings({ providerAwaitSeconds: (firstTiming?.providerAwaitMs ?? 0) / 1000,
    localGovernanceSeconds: (firstTiming?.localGovernanceMs ?? Number.NaN) / 1000, previewSeconds: v1PreviewSeconds }, 'v1');
  assertGuardDelta(guardBeforeFirstStart, await readGuard('first-start:after'), { calls: 1, attempts: 1 }, 'first-start');
  await expect(firstPreview.locator('h2')).toHaveText(expectedV1.sections);
  await expect(firstPreview.locator('a[href="#lien-he"]')).toHaveText(expectedV1.ctaText);
  const firstSaved: { data: { html: string; htmlSha256: string; pilotSource: { receipt: { htmlPilotEvidence: { runId: string } } } } } =
    await (await page.request.get(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: firstEvidence.rootRunId, id: v1 })}`)).json();
  expect(firstSaved.data.htmlSha256).toBe(hash(firstSaved.data.html));
  expect(firstSaved.data.pilotSource.receipt.htmlPilotEvidence.runId).toBe(firstEvidence.runId);
  assertPreviewStructure(firstSaved.data.html, expectedV1);
  expect(firstSaved.data.html).not.toMatch(/api[_-]?key|bearer|sk-[A-Za-z0-9]/i);

  // Link the saved version, then the original downloaded bytes must hash to it and to the link's digest.
  const [linkResponse] = await Promise.all([
    page.waitForResponse(response => response.url().includes('/api/artifacts/jobs') && response.request().method() === 'POST'
      && response.request().postDataJSON()?.action === 'LINK_VERSION'),
    activate(page, page.getByTestId('pilot-use-version')),
  ]);
  await assertStart('first-version-link', linkResponse, 201);
  await expect(page.getByTestId('pilot-status')).toHaveAttribute('data-status-code', 'LINKED');
  await expect(page.getByTestId('pilot-reviewed-version')).toBeVisible();
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', 'PENDING_OPERATOR_ACCEPTANCE');
  const versionQuery = (versionId: string) => `/api/artifacts/jobs?${new URLSearchParams({ kind: 'version', jobId: jobId!,
    sourceRecordId: firstEvidence.rootRunId, versionId })}`;
  const versionResponse = await page.request.get(versionQuery(v1));
  await assertStart('first-version-read', versionResponse);
  const versionLink = await versionResponse.json() as { data?: { htmlSha256?: string; pilotEvidenceSha256?: string }; error?: unknown };
  if (!versionLink.data || typeof versionLink.data.htmlSha256 !== 'string' ||
      typeof versionLink.data.pilotEvidenceSha256 !== 'string') {
    const code = typeof versionLink.error === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(versionLink.error)
      ? versionLink.error : 'MISSING_VERSION_DATA';
    throw new Error(`PILOT_CONSUMER_REJECTED:first-version-read:${versionResponse.status()}:${code}`);
  }
  const [firstDownload] = await Promise.all([page.waitForEvent('download'),
    activate(page, page.getByRole('link', { name: text.download }))]);
  const firstDownloadPath = await firstDownload.path();
  assertDownloadedBytes(firstDownloadPath ? await fs.readFile(firstDownloadPath) : null, { sha256: firstSaved.data.htmlSha256,
    byteLength: Buffer.byteLength(firstSaved.data.html, 'utf8'), boundSha256: versionLink.data.htmlSha256 });

  // Attributed automated account review of v1 only: ACCEPTED, read back from the product route and never constructed.
  const decisionQuery = (versionId: string) => `/api/artifacts/jobs?${new URLSearchParams({ kind: 'product-decision', jobId: jobId!,
    sourceRecordId: firstEvidence.rootRunId, versionId })}`;
  const readDecision = async (versionId: string) => {
    const response = await page.request.get(decisionQuery(versionId));
    return { status: response.status(), data: response.status() === 200 ? ((await response.json()) as { data?: unknown }).data ?? null : null };
  };
  await activate(page, page.getByTestId('pilot-reviewed-version'), 'Space');
  await activate(page, page.getByTestId('pilot-accept-version'));
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', 'ACCEPTED');
  const v1Stored = await readDecision(v1);
  expect(v1Stored.status).toBe(200);
  const v1Decision: ProductDecisionReadback = assertDecisionBinding(v1Stored.data, { jobId: jobId!, sourceRecordId: firstEvidence.rootRunId,
    versionId: v1, htmlSha256: firstSaved.data.htmlSha256, sourceEvidenceSha256: versionLink.data.pilotEvidenceSha256,
    decision: 'ACCEPTED', owner: pinnedOwner });
  const v1Fixture = bindFixtureAttribution(v1Decision);

  // Local Stop on a separate, unsaved render after the ordinary path. The held real render may finish late, but it
  // cannot publish, save, start a request or touch the accepted v1.
  const stopStart = performance.now();
  const beforeStop = await readCounters('local-stop:before');
  const draftList = async () => ((await (await page.request.get(`/api/artifacts/drafts?${new URLSearchParams({
    sourceRecordId: firstEvidence.rootRunId, list: '1' })}`)).json()) as { data?: unknown[] }).data ?? [];
  const savedBadge = page.getByTestId('html-pilot-saved-version');
  const draftsBeforeStop = (await draftList()).length;
  const savedVersionBeforeStop = await savedBadge.getAttribute('data-version-id');
  let releaseLateRender!: () => void;
  let signalRenderHeld!: () => void;
  let signalLateDelivered!: () => void;
  const renderHeld = new Promise<void>(resolve => { signalRenderHeld = resolve; });
  const releaseRender = new Promise<void>(resolve => { releaseLateRender = resolve; });
  const lateDelivered = new Promise<void>(resolve => { signalLateDelivered = resolve; });
  const holdRealRender = async (route: import('@playwright/test').Route) => {
    const realResponse = await route.fetch();
    signalRenderHeld();
    await releaseRender;
    await route.fulfill({ response: realResponse });
    signalLateDelivered();
  };
  await page.route('**/api/artifacts/export', holdRealRender);
  await activate(page, page.getByTestId('pilot-build-preview'));
  await renderHeld;
  const startsAtStop = starts.length;
  await activate(page, page.getByTestId('pilot-stop-render'));
  releaseLateRender();
  await lateDelivered;
  await expect(page.getByTestId('pilot-status')).toHaveAttribute('data-status-code', 'RENDER_STOPPED');
  await expect(page.getByTestId('pilot-status')).toHaveText(copy.status.RENDER_STOPPED);
  assertLateOutcomeFenced({ draftsBefore: draftsBeforeStop, draftsAfter: (await draftList()).length,
    enabledSaveControlCount: await page.locator('[data-testid="pilot-save-version"]:not([disabled])').count(),
    startsBefore: startsAtStop, startsAfter: starts.length, savedVersionBefore: savedVersionBeforeStop,
    savedVersionAfter: await savedBadge.getAttribute('data-version-id'),
    decisionAfter: await page.getByTestId('pilot-decision-state').getAttribute('data-decision') });
  await page.unroute('**/api/artifacts/export', holdRealRender);
  assertDecisionPersisted(v1Decision, (await readDecision(v1)).data, 'after-local-stop');
  assertDeniedEffectDelta(beforeStop, await readCounters('local-stop:after'), 'local-stop');
  faults.push({ label: 'local-stop', startMs: stopStart, endMs: performance.now() });

  // Negative drills run only now, after the first preview time was taken. Each leaves every owned counter unchanged,
  // including the Root guard's calls and attempts, which API-request traffic would otherwise hide from the page.
  const firstExecutionRequest = executionRequests.first;
  if (!firstExecutionRequest) throw new Error('FIRST_EXECUTION_REQUEST_MISSING');
  const hint = firstExecutionRequest.htmlPilotIntent as Record<string, unknown>;
  await denied('invalid-context-selector', 400, 'PILOT_CONTEXT_SELECTOR_REFUSED', () => page.request.post('/api/execute', { data: {
    ...firstExecutionRequest, htmlPilotIntent: { ...hint, operationKey: 'invalid-context-attempt' },
    knowledgeContext: 'private-context-must-never-reach-provider' } }));
  await denied('wrong-model-pin', 403, 'PILOT_PROVIDER_PIN_REFUSED', () => page.request.post('/api/execute', { data: {
    ...firstExecutionRequest, model: 'unapproved-model', htmlPilotIntent: { ...hint, operationKey: 'wrong-model-attempt' } } }));
  await denied('wrong-goal-pin', 403, 'PILOT_GOAL_PIN_REFUSED', () => page.request.post('/api/execute', { data: {
    ...firstExecutionRequest, intent: 'Unpinned and therefore refused', htmlPilotIntent: { ...hint, operationKey: 'wrong-goal-attempt' } } }));
  const foreignContext = await browser.newContext();
  try {
    await denied('missing-owner', 401, null, () => foreignContext.request.post('/api/execute', { data: firstExecutionRequest }));
  } finally { await foreignContext.close(); }
  await denied('duplicate-no-resend', 409, 'PILOT_OPERATION_UNKNOWN_NO_RESEND', () => page.request.post('/api/execute', { data: firstExecutionRequest }));
  expect(starts).toHaveLength(1);

  await page.screenshot({ path: path.join(control, 'pilot-v1-desktop.png'), fullPage: true });
  await page.locator(`iframe[title="${text.previewTitle}"]`).focus();
  await page.keyboard.press('Tab');
  await expect(firstPreview.locator('a[href="#lien-he"]')).toBeFocused();
  await page.screenshot({ path: path.join(control, 'pilot-v1-keyboard.png'), fullPage: true });
  await page.setViewportSize(MOBILE);
  await expect(page.getByRole('link', { name: text.download })).toBeVisible();
  const mobileDownload = await page.getByRole('link', { name: text.download }).boundingBox();
  expect(mobileDownload && mobileDownload.width > 0 && mobileDownload.x >= 0
    && mobileDownload.x + mobileDownload.width <= MOBILE.width).toBeTruthy();
  await expect(firstPreview.locator('a[href="#lien-he"]')).toBeVisible();
  await page.screenshot({ path: path.join(control, 'pilot-v1-mobile.png'), fullPage: true });

  // Revision on the same job, in the 390px viewport and from the keyboard.
  await page.goto(`/home?result=${encodeURIComponent(firstExecutionId)}`);
  const followup = page.getByTestId('followup-section');
  await expect(followup).toBeVisible();
  await followup.locator('textarea').fill(revision);
  expect((await followup.locator('textarea').inputValue()).length).toBe(PILOT_LIMITS.revisionGoalLength);
  await activate(page, followup.getByTestId('followup-submit-btn'));
  await expect(page.getByTestId('html-pilot-effect-disclosure')).toBeVisible();
  expect(starts).toHaveLength(1);
  const guardBeforeSecondStart = await readGuard('second-start:before');
  const secondSubmitStart = performance.now();
  const secondResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/execute'
    && response.request().method() === 'POST');
  await activate(page, page.getByTestId('html-pilot-confirm-effect'));
  const second = await secondResponse;
  await assertStart('second-start', second);
  const secondBody = await second.json() as typeof firstBody;
  const secondResponseEnd = performance.now();
  const secondEvidence = secondBody.governanceEvidenceReceipt?.htmlPilotEvidence;
  expect(secondBody.success).toBe(true);
  expect(secondBody.governanceEvidenceReceipt?.provider).toBe('alibaba');
  expect(secondBody.governanceEvidenceReceipt?.model).toBe('qwen-flash');
  expect(secondEvidence?.rootRunId).toBe(firstEvidence.rootRunId);
  expect(secondEvidence?.runId).not.toBe(firstEvidence.runId);
  expect(secondEvidence?.outputSha256).toBe(hash(secondBody.output));
  expect(secondBody.governanceEvidenceReceipt?.receiptIntegrity?.signatureStatus).toBe('SIGNED');
  expect(starts).toHaveLength(2);
  await activate(page, page.getByTestId('html-pilot-transfer-exact-run'));
  await expect(page.getByTestId('html-pilot-job-controls')).toBeVisible();
  await expect(page.getByTestId('pilot-job-id')).toHaveAttribute('data-job-id', jobId!);
  const secondJobReady = performance.now();
  await activate(page, page.getByTestId('pilot-build-preview'));
  await activate(page, page.getByTestId('pilot-save-version'));
  await expect(page.getByTestId('html-pilot-saved-version')).toBeVisible();
  const secondSavedVisible = performance.now();
  const v2 = (await page.getByTestId('html-pilot-saved-version').getAttribute('data-version-id'))!;
  expect(v2).not.toBe(v1);
  const secondPreview = page.frameLocator(`iframe[title="${text.previewTitle}"]`);
  await expect(secondPreview.locator('h1')).toHaveText(expectedV2.heading);
  const secondPreviewVisible = performance.now();
  const v2Phases = phasesFrom([secondSubmitStart, secondResponseEnd, secondJobReady, secondSavedVisible, secondPreviewVisible]);
  const v2PreviewSeconds = (secondPreviewVisible - secondSubmitStart) / 1000;
  const secondTiming = secondBody.governanceEvidenceReceipt?.htmlPilotTiming;
  const v2Timings = assertTimings({ providerAwaitSeconds: (secondTiming?.providerAwaitMs ?? 0) / 1000,
    localGovernanceSeconds: (secondTiming?.localGovernanceMs ?? Number.NaN) / 1000, previewSeconds: v2PreviewSeconds }, 'v2');
  assertGuardDelta(guardBeforeSecondStart, await readGuard('second-start:after'), { calls: 1, attempts: 1 }, 'second-start');
  await activate(page, page.getByTestId('pilot-use-version'));
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', 'PENDING_OPERATOR_ACCEPTANCE');
  await expect(secondPreview.locator('h2')).toHaveText(expectedV2.sections);
  await expect(secondPreview.locator('a[href="#lien-he"]')).toHaveText(expectedV2.ctaText);
  const secondSaved: typeof firstSaved =
    await (await page.request.get(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: firstEvidence.rootRunId, id: v2 })}`)).json();
  expect(secondSaved.data.htmlSha256).toBe(hash(secondSaved.data.html));
  expect(secondSaved.data.pilotSource.receipt.htmlPilotEvidence.runId).toBe(secondEvidence?.runId);
  assertPreviewStructure(secondSaved.data.html, expectedV2);
  const secondLink = await (await page.request.get(versionQuery(v2))).json() as { data: { htmlSha256: string } };
  const [secondDownload] = await Promise.all([page.waitForEvent('download'),
    activate(page, page.getByRole('link', { name: text.download }))]);
  const secondDownloadPath = await secondDownload.path();
  assertDownloadedBytes(secondDownloadPath ? await fs.readFile(secondDownloadPath) : null, { sha256: secondSaved.data.htmlSha256,
    byteLength: Buffer.byteLength(secondSaved.data.html, 'utf8'), boundSha256: secondLink.data.htmlSha256 });
  // Final v2 stays with the operator: no stored decision exists and none is made here; v1 stays the accepted record.
  const v2Stored = await readDecision(v2);
  assertDecisionAttribution({ v1Decision, fixture: v1Fixture,
    v2DecisionState: await page.getByTestId('pilot-decision-state').getAttribute('data-decision'), v2DecisionHttpStatus: v2Stored.status });
  assertDecisionPersisted(v1Decision, (await readDecision(v1)).data, 'before-checkpoint');
  expect(starts).toHaveLength(2);
  await page.setViewportSize(DESKTOP);

  const exact = { jobId, rootRunId: firstEvidence.rootRunId, v1Id: v1, v2Id: v2,
    v1HtmlSha256: firstSaved.data.htmlSha256, v2HtmlSha256: secondSaved.data.htmlSha256,
    profileDigest: firstEvidence.profileDigest, decisionState: 'PENDING_OPERATOR_ACCEPTANCE', paidStarts: 2 };
  assertIdentities({ jobId: jobId!, rootRunId: firstEvidence.rootRunId, v1Id: v1, v2Id: v2, v1HtmlSha256: exact.v1HtmlSha256,
    v2HtmlSha256: exact.v2HtmlSha256, profileDigest: firstEvidence.profileDigest, v1RunId: firstEvidence.runId,
    v2RunId: secondEvidence!.runId, paidStarts: 2 });
  await writeControl('checkpoint.json', { schema: 'cvf.htmlPilotCheckpointRequest.v1', ...exact });
  const restart = await readControl('restart.done.json', 'cvf.htmlPilotRestartAck.v1');
  expect(restart.jobId).toBe(jobId);
  await page.reload();
  await activate(page, page.getByTestId('pilot-show-versions'));
  await activate(page, page.getByRole('button', { name: text.restore(v2) }));
  await expect(page.getByTestId('html-pilot-saved-version')).toHaveAttribute('data-html-sha256', secondSaved.data.htmlSha256);
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', 'PENDING_OPERATOR_ACCEPTANCE');
  // The accepted v1 is the same stored record after restart; final v2 still has no stored decision.
  assertDecisionPersisted(v1Decision, (await readDecision(v1)).data, 'after-restart');
  expect((await readDecision(v2)).status).toBe(404);
  expect(starts).toHaveLength(2);
  const fullUiRestoreStart = performance.now();
  await writeControl('restore.request.json', { schema: 'cvf.htmlPilotRestoreRequest.v1', ...exact });
  const restored = await readControl('restore.done.json', 'cvf.htmlPilotRestoreAck.v1');
  expect(restored.jobId).toBe(jobId);
  const rootServerReadySeconds = assertRestoreSeconds(Number(restored.fullRtoSeconds), 'root-server-ready');
  await page.reload();
  await activate(page, page.getByTestId('pilot-show-versions'));
  // v2 stays human-pending; the restored v1 shows the ACCEPTED decision read back from the restored account store.
  for (const [versionId, expected, decision] of [[v2, secondSaved.data.htmlSha256, 'PENDING_OPERATOR_ACCEPTANCE'], [v1, firstSaved.data.htmlSha256, 'ACCEPTED']]) {
    await activate(page, page.getByRole('button', { name: text.restore(versionId) }));
    await expect(page.getByTestId('html-pilot-saved-version')).toHaveAttribute('data-html-sha256', expected);
    await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', decision);
  }
  const fullUsableUiRtoSeconds = assertRestoreSeconds((performance.now() - fullUiRestoreStart) / 1000, 'full-usable-ui');
  assertDecisionPersisted(v1Decision, (await readDecision(v1)).data, 'after-restore');
  expect((await readDecision(v2)).status).toBe(404);
  expect(starts).toHaveLength(2);
  await writeControl('revoke.request.json', { schema: 'cvf.htmlPilotRevokeRequest.v1', jobId,
    profileDigest: firstEvidence.profileDigest, paidStarts: 2 });
  const revoked = await readControl('revoke.done.json', 'cvf.htmlPilotRevokeAck.v1');
  expect(revoked.jobId).toBe(jobId);
  expect(revoked.profileDigest).toBe(firstEvidence.profileDigest);
  expect(revoked.state).toBe('REVOKED');
  const secondExecutionRequest = executionRequests.second;
  if (!secondExecutionRequest) throw new Error('SECOND_EXECUTION_REQUEST_MISSING');
  await denied('post-revoke-new-start', 403, 'PILOT_GRANT_UNAVAILABLE', () => page.request.post('/api/execute', { data: {
    ...secondExecutionRequest, htmlPilotIntent: { ...(secondExecutionRequest.htmlPilotIntent as Record<string, unknown>),
      operationKey: 'post-revocation-new-operation' } } }));
  const afterRevoke = await (await page.request.get(`/api/artifacts/drafts?${new URLSearchParams({ sourceRecordId: firstEvidence.rootRunId, id: v2 })}`)).json() as typeof secondSaved;
  expect(afterRevoke.data.htmlSha256).toBe(secondSaved.data.htmlSha256);
  const afterRevokeBytes = new Uint8Array(Buffer.from(afterRevoke.data.html, 'utf8'));
  assertDownloadedBytes(afterRevokeBytes, { sha256: secondSaved.data.htmlSha256, byteLength: Buffer.byteLength(secondSaved.data.html, 'utf8') });
  assertPreviewStructure(afterRevoke.data.html, expectedV2);
  expect(starts).toHaveLength(2);
  // Both previews must be ordinary: no denial, Stop or decline interval from the whole run may touch either window.
  assertCleanPreviewTiming({ phases: v1Phases, faults, previewSeconds: v1PreviewSeconds }, 'v1');
  assertCleanPreviewTiming({ phases: v2Phases, faults, previewSeconds: v2PreviewSeconds }, 'v2');
  // Whole-run physical accounting: exactly the two authorized paid starts moved the Root guard.
  const guardAtEnd = await readGuard('run-end');
  assertGuardDelta(guardAtStart, guardAtEnd, { calls: 2, attempts: 2 }, 'whole-run');
  await writeControl('restore.consumer-finality.json', { schema: 'cvf.htmlPilotConsumerRestoreFinality.v1', ...exact,
    rootServerReadySeconds, fullUsableUiRtoSeconds, finishedAt: new Date().toISOString() });

  // Safe measurements go to a Playwright attachment, not to Root's control files, whose field sets stay as protocol-fixed.
  const measurements = JSON.stringify({ schema: 'cvf.htmlPilotConsumerMeasurements.v1', fixtureHashes, v1Timings, v2Timings,
    v1Phases, v2Phases, faultIntervals: faults, rootServerReadySeconds, fullUsableUiRtoSeconds, deniedDrills: drills,
    browserExecuteStarts: starts.length, guard: { atStart: guardAtStart, atEnd: guardAtEnd },
    v1Decision: { decisionId: v1Decision.decisionId, decision: v1Decision.decision, versionId: v1, owner: v1Decision.owner, actor: v1Decision.actor,
      decidedAt: v1Decision.decidedAt, persistedChecks: ['after-local-stop', 'before-checkpoint', 'after-restart', 'after-restore'] },
    v1FixtureAttribution: v1Fixture, v2DecisionState: 'PENDING_OPERATOR_ACCEPTANCE', v2StoredDecisionHttpStatus: v2Stored.status,
    downloads: { v1Sha256: firstSaved.data.htmlSha256, v2Sha256: secondSaved.data.htmlSha256 } }, null, 2);
  assertRedacted(measurements, [process.env.CVF_NCR_HTML_PILOT_PASS ?? '', process.env.DASHSCOPE_API_KEY ?? '']);
  await testInfo.attach('pilot-consumer-measurements.json', { body: measurements, contentType: 'application/json' });
});
