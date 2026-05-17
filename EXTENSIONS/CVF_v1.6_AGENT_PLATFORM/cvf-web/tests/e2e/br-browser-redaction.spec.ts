import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const FAKE_KEY = 'test_invalid_cvf_redaction_probe_20260508';
const EVIDENCE_MD = resolve(__dirname, '../../../../../docs/reviews/CVF_C5_BROWSER_REDACTION_6_STREAM_EVIDENCE_2026-05-08.md');

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

async function loginFast(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="text"][placeholder="admin"]').fill(username);
  await page.locator('input[type="password"][placeholder="admin123"]').fill(password);
  const button = page.getByRole('button', { name: /Đăng nhập|Sign in/i });
  await button.click({ force: true }).catch(async () => {
    await page.locator('input[type="password"][placeholder="admin123"]').press('Enter');
  });
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 20_000 });
}

test('BR browser response and network capture redact runCommand-layer fake key', async ({ page }) => {
  test.skip(
    process.env.CVF_WEB_GOVERNANCE_REDACTION_PROBE !== 'run_command_fake_key',
    'BR redaction proof requires CVF_WEB_GOVERNANCE_REDACTION_PROBE=run_command_fake_key',
  );
  test.skip(
    process.env.ALIBABA_API_KEY !== FAKE_KEY,
    'BR redaction proof requires ALIBABA_API_KEY to be the deterministic fake key',
  );

  const networkBodies: string[] = [];
  page.on('response', async (response) => {
    if (response.url().includes('/api/system/jobs')) {
      networkBodies.push(await response.text().catch(() => ''));
    }
  });

  await loginFast(page, 'admin', 'admin123');

  const body = await page.evaluate(async () => {
    const response = await fetch('/api/system/jobs', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jobType: 'full_live_release_gate',
        uiRequestId: 'br-browser-redaction-run-command-probe',
      }),
    });
    return {
      status: response.status,
      text: await response.text(),
    };
  });

  const browserResponse = body.text;
  const networkCapture = networkBodies.join('\n');

  expect(body.status).toBe(200);
  expect(browserResponse).not.toContain(FAKE_KEY);
  expect(networkCapture).not.toContain(FAKE_KEY);
  expect(browserResponse).toContain('[REDACTED]');
  expect(networkCapture).toContain('[REDACTED]');

  ensureDir(EVIDENCE_MD);
  writeFileSync(EVIDENCE_MD, [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF C5 Browser Redaction 6-Stream Evidence',
    '',
    '**Date:** 2026-05-08',
    '**Status:** PASS',
    '**Track:** BR - Browser Redaction Closure',
    '**Provider calls:** 0 live calls',
    '',
    '## Design',
    '',
    '- Fake key: deterministic sentinel `test_invalid_cvf_redaction_probe_20260508`.',
    '- Injection point: `defaultRunCommand()` runCommand layer before the redaction pipeline.',
    '- Test hook: `CVF_WEB_GOVERNANCE_REDACTION_PROBE=run_command_fake_key` and fake `ALIBABA_API_KEY`.',
    '- API-response-layer mock was not used.',
    '',
    '## Stream Coverage',
    '',
    '| Stream | Status | Evidence |',
    '|---|---|---|',
    '| stdout | PASS | Existing unit probe plus runCommand stdout injection. |',
    '| stderr | PASS | Existing unit probe plus runCommand stderr injection. |',
    '| returned job object | PASS | `/api/system/jobs` returned redacted job result. |',
    '| persisted runtime state | PASS | Existing persisted state probe remains covered by `web-governance-jobs.test.ts`. |',
    '| browser-visible API response | PASS | Playwright browser `fetch()` response omitted the fake key and contained `[REDACTED]`. |',
    '| network capture | PASS | Playwright response event capture omitted the fake key and contained `[REDACTED]`. |',
    '',
    '## Boundary',
    '',
    '- This proves redaction behavior only.',
    '- It does not prove live provider governance behavior.',
    '- No real provider key was used.',
    '- No live provider call was made.',
  ].join('\n'), 'utf8');
});
