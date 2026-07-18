/**
 * System Chain UC-04B Web Operations Readout -- Proof Spec
 *
 * GC: provider-free local development proof. One Playwright invocation,
 * two Web submissions, exactly one real checker execution, zero retries,
 * zero provider calls.
 *
 * Positive: developer/operator runs docs_governance_check through the UI and
 *   sees succeeded status, job type/ID, and audit trail.
 * Negative: reviewer POST is blocked with HTTP 403, blocked_by_policy,
 *   read_only_role_cannot_trigger, and no running/succeeded event.
 */

import { expect, test } from '@playwright/test';
import { seedStorage } from './utils';

const OPERATIONS_URL = '/governance/operations';
const JOB_TYPE = 'docs_governance_check';
const RUN_TEST_ID = `governance-job-run-${JOB_TYPE}-default`;

type ExpectedRole = 'developer' | 'reviewer';

type JobResult = {
  jobId: string;
  status: string;
  decision: string;
  decisionReason: string;
};

type AuditEvent = {
  jobId: string;
  eventType: string;
  status: string;
};

async function authenticateDirectly(
  page: import('@playwright/test').Page,
  username: string,
  password: string,
  expectedRole: ExpectedRole,
) {
  const csrfResponse = await page.request.get('/api/auth/csrf');
  expect(csrfResponse.ok()).toBe(true);
  const csrfBody = await csrfResponse.json() as { csrfToken?: string };
  expect(csrfBody.csrfToken).toBeTruthy();

  const callbackResponse = await page.request.post('/api/auth/callback/credentials?redirect=false', {
    form: {
      username,
      password,
      csrfToken: csrfBody.csrfToken as string,
      callbackUrl: OPERATIONS_URL,
      json: 'true',
    },
  });
  expect(callbackResponse.ok()).toBe(true);

  const sessionResponse = await page.request.get('/api/auth/session');
  expect(sessionResponse.ok()).toBe(true);
  const sessionBody = await sessionResponse.json() as { user?: { role?: string } };
  expect(sessionBody.user?.role).toBe(expectedRole);
}

async function readAuditEvents(page: import('@playwright/test').Page): Promise<AuditEvent[]> {
  const response = await page.request.get('/api/system/jobs');
  expect(response.ok()).toBe(true);
  const body = await response.json() as { events?: AuditEvent[] };
  return body.events ?? [];
}

test.describe('UC-04B Web Operations Readout', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test('positive_developer_docs_check: developer submits docs_governance_check and sees succeeded readout', async ({ page }) => {
    await authenticateDirectly(page, 'dev', 'dev123', 'developer');
    await page.goto(OPERATIONS_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });

    await expect(page.getByText('operator')).toBeVisible({ timeout: 15_000 });

    const runButton = page.locator(`[data-testid="${RUN_TEST_ID}"]`);
    await expect(runButton).toBeVisible({ timeout: 10_000 });
    await expect(runButton).toBeEnabled({ timeout: 5_000 });

    const responsePromise = page.waitForResponse((response) => (
      response.url().endsWith('/api/system/jobs') && response.request().method() === 'POST'
    ));
    await runButton.click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    const result = await response.json() as JobResult;
    expect(result.status).toBe('succeeded');
    expect(result.decision).toBe('allowed');

    await expect(
      page.getByText('succeeded', { exact: false }).first()
    ).toBeVisible({ timeout: 90_000 });

    await expect(page.getByText(JOB_TYPE, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/Docs Governance Check/).first()).toBeVisible();

    const events = (await readAuditEvents(page)).filter((event) => event.jobId === result.jobId);
    expect(events.map((event) => event.eventType)).toEqual(['requested', 'running', 'succeeded']);
  });

  test('negative_reviewer_docs_check: reviewer is blocked from submitting docs_governance_check', async ({ page }) => {
    await authenticateDirectly(page, 'reviewer', 'reviewer123', 'reviewer');
    await page.goto(OPERATIONS_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });

    await expect(page.getByText('Active role', { exact: true }).locator('..').getByText('reviewer', { exact: true })).toBeVisible({ timeout: 15_000 });

    const runButton = page.locator(`[data-testid="${RUN_TEST_ID}"]`);
    await expect(runButton).toBeVisible({ timeout: 10_000 });
    await expect(runButton).toBeDisabled({ timeout: 5_000 });

    const response = await page.request.post('/api/system/jobs', {
      data: {
        jobType: JOB_TYPE,
        uiRequestId: `uc04b-neg-${Date.now()}`,
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(403);
    const body = await response.json() as JobResult;
    expect(body.status).toBe('blocked_by_policy');
    expect(body.decisionReason).toBe('read_only_role_cannot_trigger');

    const events = (await readAuditEvents(page)).filter((event) => event.jobId === body.jobId);
    expect(events.map((event) => event.eventType)).toEqual(['requested', 'blocked_by_policy']);
    expect(events.some((event) => ['running', 'succeeded', 'failed', 'timed_out'].includes(event.eventType))).toBe(false);
  });
});
