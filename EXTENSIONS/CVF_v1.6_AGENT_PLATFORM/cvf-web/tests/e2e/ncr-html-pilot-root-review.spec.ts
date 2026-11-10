/** Provider-free, visible parent review. Product decisions and version selection remain operator actions. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { loginAs } from './utils';

const control = process.env.CVF_NCR_HTML_PILOT_REVIEW_CONTROL_DIR!;
const contextFile = process.env.CVF_NCR_HTML_PILOT_REVIEW_CONTEXT!;
const sourceHead = process.env.CVF_NCR_HTML_PILOT_SOURCE_HEAD!;
const user = process.env.CVF_NCR_HTML_PILOT_USER!;
const pass = process.env.CVF_NCR_HTML_PILOT_PASS!;
const waitMs = 1_100_000;

type Context = {
  schema: 'cvf.htmlPilotRootReviewContext.v1'; sourceHead: string; runId: string; sourceExecutionId: string;
  jobId: string; rootRunId: string; v1Id: string; v2Id: string; v1HtmlSha256: string; v2HtmlSha256: string;
  profileDigest: string; sourceEvidenceSha256: string; decisionState: 'PENDING_OPERATOR_ACCEPTANCE'; paidStarts: 2;
  execution: Record<string, unknown>;
};
type DecisionRow = {
  schema?: string; decisionId?: string; jobId?: string; sourceRecordId?: string; versionId?: string; htmlSha256?: string;
  sourceEvidenceSha256?: string; decision?: string; reviewedVersionConfirmed?: boolean;
  owner?: { userId?: string; orgId?: string; teamId?: string };
  actor?: { userId?: string; orgId?: string; teamId?: string }; decidedAt?: string; expiresAt?: string;
};

async function readContext(): Promise<Context> {
  const info = await fs.stat(contextFile);
  if (!info.isFile() || info.size > 256 * 1024) throw new Error('ROOT_REVIEW_CONTEXT_FILE_INVALID');
  const value = JSON.parse(await fs.readFile(contextFile, 'utf8')) as Context;
  if (value.schema !== 'cvf.htmlPilotRootReviewContext.v1' || value.sourceHead !== sourceHead || value.paidStarts !== 2
    || value.decisionState !== 'PENDING_OPERATOR_ACCEPTANCE' || value.execution?.id !== value.sourceExecutionId
    || value.execution?.htmlPilot === undefined) throw new Error('ROOT_REVIEW_CONTEXT_BINDING');
  return value;
}

const writeOnce = async (name: string, value: Record<string, unknown>) => fs.writeFile(path.join(control, name),
  `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

async function readControl(name: string, schema: string) {
  const target = path.join(control, name);
  const end = Date.now() + waitMs;
  for (;;) {
    try {
      const value = JSON.parse(await fs.readFile(target, 'utf8')) as Record<string, unknown>;
      if (value.schema !== schema) throw new Error('ROOT_REVIEW_CONTROL_SCHEMA');
      return value;
    } catch (error) {
      if (error instanceof Error && error.message === 'ROOT_REVIEW_CONTROL_SCHEMA') throw error;
      if (Date.now() >= end) throw new Error('ROOT_REVIEW_SERVER2_SIGNAL_TIMEOUT');
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

async function bindReviewExecution(page: Page, context: Context) {
  await page.addInitScript((execution) => {
    localStorage.setItem('cvf_language', 'vi');
    localStorage.setItem('cvf-executions-storage', JSON.stringify({ state: { executions: [execution], currentExecution: execution }, version: 0 }));
  }, context.execution);
}

function productDecisionUrl(context: Context) {
  return `/api/artifacts/jobs?${new URLSearchParams({ kind: 'product-decision', jobId: context.jobId,
    sourceRecordId: context.rootRunId, versionId: context.v2Id })}`;
}

async function decisionRow(page: Page, context: Context, expected: 'ACCEPTED' | 'REJECTED') {
  const response = await page.request.get(productDecisionUrl(context));
  if (response.status() !== 200) throw new Error('ROOT_REVIEW_NATIVE_DECISION_READ_FAILED');
  const body = await response.json() as { success?: boolean; data?: DecisionRow };
  const row = body.data;
  if (!body.success || !row || row.jobId !== context.jobId || row.sourceRecordId !== context.rootRunId
    || row.versionId !== context.v2Id || row.htmlSha256 !== context.v2HtmlSha256
    || row.sourceEvidenceSha256 !== context.sourceEvidenceSha256 || row.decision !== expected
    || row.reviewedVersionConfirmed !== true || row.owner?.userId !== 'usr_3' || row.owner.orgId !== 'org_cvf'
    || row.owner.teamId !== 'team_eng' || row.actor?.userId !== 'usr_3' || row.actor.orgId !== 'org_cvf'
    || row.actor.teamId !== 'team_eng' || typeof row.decisionId !== 'string'
    || typeof row.decidedAt !== 'string' || typeof row.expiresAt !== 'string') throw new Error('ROOT_REVIEW_NATIVE_DECISION_JOIN');
  return row;
}

async function waitForOperatorToRestoreExactVersion(page: Page, context: Context,
  expectedDecision: 'PENDING_OPERATOR_ACCEPTANCE' | 'ACCEPTED' | 'REJECTED') {
  // No code action chooses the version. The operator opens the list and selects the exact v2 in the native UI.
  await expect(page.getByTestId('pilot-show-versions')).toBeVisible();
  await expect(page.getByTestId('html-pilot-saved-version')).toHaveCount(0);
  const restore = page.locator(`[data-testid="pilot-restore-version"][data-version-id="${context.v2Id}"]`);
  await expect(restore).toBeVisible({ timeout: waitMs });
  await expect(page.getByTestId('html-pilot-saved-version')).toHaveAttribute('data-version-id', context.v2Id,
    { timeout: waitMs });
  await expect(page.getByTestId('html-pilot-saved-version')).toHaveAttribute('data-html-sha256', context.v2HtmlSha256);
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', expectedDecision);
}

function payload(context: Context, row: DecisionRow, schema: string) {
  return { schema, sourceHead: context.sourceHead, runId: context.runId, jobId: context.jobId,
    rootRunId: context.rootRunId, versionId: context.v2Id, htmlSha256: context.v2HtmlSha256,
    sourceEvidenceSha256: context.sourceEvidenceSha256, decisionId: row.decisionId!, decision: row.decision!,
    reviewedVersionConfirmed: true, owner: row.owner, actor: row.actor, decidedAt: row.decidedAt, expiresAt: row.expiresAt };
}

test('operator chooses and decides exact v2; fresh server and UI read back the same owner decision', async ({ page, browser }) => {
  test.setTimeout(1_200_000);
  expect(browser.browserType().name()).toBe('chromium');
  await page.route('**/*', route => {
    const host = new URL(route.request().url()).hostname;
    return ['localhost', '127.0.0.1', '[::1]'].includes(host) ? route.continue() : route.abort();
  });
  const context = await readContext();
  await bindReviewExecution(page, context);
  await loginAs(page, user, pass);
  const session = await (await page.request.get('/api/auth/session')).json() as { user?: { userId?: string; orgId?: string; teamId?: string } };
  expect(session.user).toMatchObject({ userId: 'usr_3', orgId: 'org_cvf', teamId: 'team_eng' });
  await page.goto(`/work-transfer?source=${encodeURIComponent(context.sourceExecutionId)}`);
  await expect(page.getByTestId('html-pilot-job-controls')).toBeVisible({ timeout: waitMs });
  await expect(page.getByTestId('pilot-job-id')).toHaveAttribute('data-job-id', context.jobId, { timeout: waitMs });
  // The operator opens the version list and restores v2, then reviews its native saved-byte panel.
  await waitForOperatorToRestoreExactVersion(page, context, 'PENDING_OPERATOR_ACCEPTANCE');
  const versionUrl = `/api/artifacts/jobs?${new URLSearchParams({ kind: 'version', jobId: context.jobId,
    sourceRecordId: context.rootRunId, versionId: context.v2Id })}`;
  const linked = await page.request.get(versionUrl);
  if (linked.status() !== 200) throw new Error('ROOT_REVIEW_VERSION_READ_FAILED');
  const versionBody = await linked.json() as { data?: { htmlSha256?: string; pilotEvidenceSha256?: string } };
  expect(versionBody.data?.htmlSha256).toBe(context.v2HtmlSha256);
  expect(versionBody.data?.pilotEvidenceSha256).toBe(context.sourceEvidenceSha256);
  const before = await page.request.get(productDecisionUrl(context));
  expect(before.status()).toBe(404);
  await writeOnce('review-ready.json', { schema: 'cvf.htmlPilotRootReviewReady.v1', sourceHead: context.sourceHead,
    runId: context.runId, jobId: context.jobId, rootRunId: context.rootRunId, versionId: context.v2Id,
    htmlSha256: context.v2HtmlSha256, sourceEvidenceSha256: context.sourceEvidenceSha256,
    decisionState: 'PENDING_OPERATOR_ACCEPTANCE', status: 'READY' });

  // No script action activates either decision button. The operator confirms review and chooses Accept or Reject.
  const decisionRequests: Array<Record<string, unknown>> = [];
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/artifacts/jobs') {
      const body = request.postDataJSON() as Record<string, unknown> | null;
      if (body?.action === 'DECIDE_PRODUCT_VERSION') decisionRequests.push(body);
    }
  });
  await expect.poll(async () => page.getByTestId('pilot-decision-state').getAttribute('data-decision'), { timeout: waitMs })
    .toMatch(/^(ACCEPTED|REJECTED)$/);
  const decision = await page.getByTestId('pilot-decision-state').getAttribute('data-decision');
  if (decision !== 'ACCEPTED' && decision !== 'REJECTED') throw new Error('ROOT_REVIEW_OPERATOR_DECISION_MISSING');
  expect(decisionRequests).toHaveLength(1);
  expect(decisionRequests[0]).toMatchObject({ action: 'DECIDE_PRODUCT_VERSION', jobId: context.jobId,
    sourceRecordId: context.rootRunId, versionId: context.v2Id, htmlSha256: context.v2HtmlSha256,
    sourceEvidenceSha256: context.sourceEvidenceSha256, decision, reviewedVersionConfirmed: true });
  const firstDecision = await decisionRow(page, context, decision);
  const decisionPayload = payload(context, firstDecision, 'cvf.htmlPilotRootReviewDecision.v1');
  await writeOnce('decision.json', decisionPayload);

  const ready = await readControl('server2-ready.json', 'cvf.htmlPilotRootReviewServerReady.v1');
  expect(ready).toMatchObject({ sourceHead: context.sourceHead, runId: context.runId, jobId: context.jobId,
    versionId: context.v2Id, decisionId: firstDecision.decisionId });
  await page.reload();
  await expect(page.getByTestId('html-pilot-job-controls')).toBeVisible({ timeout: waitMs });
  await expect(page.getByTestId('pilot-job-id')).toHaveAttribute('data-job-id', context.jobId, { timeout: waitMs });
  let uiDecisionReads = 0;
  page.on('request', request => {
    if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/artifacts/jobs') {
      const query = new URL(request.url()).searchParams;
      if (query.get('kind') === 'product-decision' && query.get('jobId') === context.jobId
        && query.get('sourceRecordId') === context.rootRunId && query.get('versionId') === context.v2Id) uiDecisionReads += 1;
    }
  });
  // The operator must select the same exact v2 again; this native restore reloads the durable decision.
  await waitForOperatorToRestoreExactVersion(page, context, decision);
  await expect(page.getByTestId('pilot-decision-state')).toHaveAttribute('data-decision', decision, { timeout: waitMs });
  expect(uiDecisionReads).toBeGreaterThan(0);
  const restartedDecision = await decisionRow(page, context, decision);
  expect(payload(context, restartedDecision, 'cvf.htmlPilotRootReviewDecision.v1')).toEqual(decisionPayload);
  await writeOnce('readback.json', { ...payload(context, restartedDecision, 'cvf.htmlPilotRootReviewReadback.v1'),
    afterServerRestart: true, readbackThroughUi: true });
});
