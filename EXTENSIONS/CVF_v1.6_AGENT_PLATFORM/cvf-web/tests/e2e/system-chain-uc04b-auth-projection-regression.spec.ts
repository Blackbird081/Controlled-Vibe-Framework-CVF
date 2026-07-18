/**
 * System Chain UC-04B R2 Web Auth Projection Regression -- Proof Spec
 *
 * GC: provider-free local development proof. One Playwright invocation,
 * two stable cases, zero business submissions, zero checker executions,
 * zero retries, zero provider calls.
 *
 * Positive: developer direct NextAuth session, `/api/auth/me`, and the
 *   Operations page active-role readout all agree on role `developer`
 *   projected to Operations active role `operator`.
 * Negative: a fresh anonymous context receives `/api/auth/me` 401 and the
 *   Operations page active-role readout `anonymous_local`.
 */

import { expect, test } from '@playwright/test';
import { seedStorage } from './utils';

const OPERATIONS_URL = '/governance/operations';

type MeResponse = {
  authenticated: boolean;
  role?: string;
};

async function authenticateDirectly(
  page: import('@playwright/test').Page,
  username: string,
  password: string,
  expectedRole: string,
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

test.describe('UC-04B R2 Web Auth Projection Regression', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    await seedStorage(page);
  });

  test('positive_developer_auth_projection: developer session, auth-me, and Operations projections agree', async ({ page }) => {
    await authenticateDirectly(page, 'dev', 'dev123', 'developer');

    const meResponse = await page.request.get('/api/auth/me');
    expect(meResponse.status()).toBe(200);
    const meBody = await meResponse.json() as MeResponse;
    expect(meBody.authenticated).toBe(true);
    expect(meBody.role).toBe('developer');

    await page.goto(OPERATIONS_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(page.getByText('operator')).toBeVisible({ timeout: 15_000 });
  });

  test('negative_anonymous_auth_projection: anonymous auth-me and Operations projections remain denied', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seedStorage(page);

    const meResponse = await page.request.get('/api/auth/me');
    expect(meResponse.status()).toBe(401);
    const meBody = await meResponse.json() as MeResponse;
    expect(meBody.authenticated).toBe(false);

    await page.goto(OPERATIONS_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(page.getByText('anonymous_local')).toBeVisible({ timeout: 15_000 });

    await context.close();
  });
});
