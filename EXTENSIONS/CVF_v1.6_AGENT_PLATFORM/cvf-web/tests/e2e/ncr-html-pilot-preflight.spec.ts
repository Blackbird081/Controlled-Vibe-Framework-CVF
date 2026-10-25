// Text Encoding Exception: Vietnamese fixture labels and localized UI text are intentional.
/**
 * No-key structure and serialization preflight for the HTML pilot Home entry, in EN and VI, desktop and 390px.
 * Every execute request is answered or aborted inside the browser before it can reach the production handler, and
 * any artifact request is aborted and counted, so this proves page structure, keyboard order and what would be sent,
 * never governance, provider output or storage behaviour.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { loginAs, seedStorage } from './utils';
import { pilotCopy } from '../../src/components/html-pilot-copy';
import { PILOT_LIMITS, assertRedacted, assertSerializedGoal } from '../helpers/ncr-html-pilot-proof-assertions';

const out = process.env.CVF_NCR_PREFLIGHT_OUT!;
const pad = (seed: string, length: number) => `${seed.repeat(Math.ceil(length / seed.length)).slice(0, length - 1)}.`;
// Invented fictional goal of the locked length; never the operator's real goal text.
const goal = pad('Trang giới thiệu không gian đọc sách hư cấu Ánh Sao. ', PILOT_LIMITS.initialGoalLength);
const disclosure = { kind: 'REAL_PROVIDER_FICTIONAL_CONTENT', provider: 'alibaba', model: 'qwen-flash', endpoint: 'fixture.invalid', sent: 'FICTIONAL_INPUT_PLUS_CVF_STATIC_PROMPT',
  retention: 'UP_TO_30_DAYS_PLUS_LEGAL_SECURITY_EXCEPTIONS', maxPaidStarts: 2, maxTokens: 1000, maxUsd: 0.1, maxSeconds: 120,
  stop: 'LOCAL_STOP_REMOTE_OUTCOME_UNKNOWN', unknown: 'NO_AUTOMATIC_RESEND', profileDigest: 'a'.repeat(64) };
const LOOPBACK = ['localhost', '127.0.0.1', '[::1]'];

interface Seen { executePosts: Array<Record<string, unknown>>; disclosureReads: number; artifactAttempts: string[]; externalAborted: number; logs: string[] }

async function intercept(page: Page): Promise<Seen> {
  const seen: Seen = { executePosts: [], disclosureReads: 0, artifactAttempts: [], externalAborted: 0, logs: [] };
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') seen.logs.push(message.text()); });
  page.on('pageerror', error => seen.logs.push(error.message));
  await page.context().route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!LOOPBACK.includes(url.hostname)) { seen.externalAborted += 1; return route.abort(); }
    if (url.pathname === '/api/execute') {
      if (request.method() === 'GET') {
        seen.disclosureReads += 1;
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, disclosure }) });
      }
      if (request.method() === 'POST') { seen.executePosts.push(request.postDataJSON() as Record<string, unknown>); return route.abort('blockedbyclient'); }
      return route.abort();
    }
    if (url.pathname.startsWith('/api/artifacts/')) { seen.artifactAttempts.push(`${request.method()} ${url.pathname}`); return route.abort(); }
    return route.continue();
  });
  return seen;
}

async function open(page: Page, language: 'en' | 'vi') {
  await seedStorage(page);
  await page.addInitScript(lang => { localStorage.setItem('cvf_language', lang); }, language);
  const seen = await intercept(page);
  // The shared sign-in helper waits for a desktop-only landing control, so sign in at desktop size and then measure at the target size.
  const target = page.viewportSize()!;
  await page.setViewportSize({ width: 1280, height: 800 });
  await loginAs(page, 'admin', 'admin123');
  await page.setViewportSize(target);
  await page.goto('/home?template=web_build_handoff&htmlPilot=1');
  return seen;
}

const inViewport = async (page: Page, locator: ReturnType<Page['locator']>) => {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const viewport = page.viewportSize()!;
  return !!box && box.width > 0 && box.x >= 0 && box.x + box.width <= viewport.width + 1;
};

async function record(name: string, language: string, viewport: string, seen: Seen, extra: Record<string, unknown>) {
  const report = JSON.stringify({ schema: 'cvf.htmlPilotPreflightResult.v1', language, viewport, goalLength: goal.length,
    goalSha256: createHash('sha256').update(goal, 'utf8').digest('hex'), executePostCount: seen.executePosts.length,
    disclosureReads: seen.disclosureReads, artifactAttempts: seen.artifactAttempts.length, externalAborted: seen.externalAborted,
    consoleMessages: seen.logs.length, bodies: 'OMITTED', ...extra }, null, 2);
  assertRedacted(report, ['admin123']);
  assertRedacted(seen.logs.join('\n'), ['admin123']);
  await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, `${name}.json`), `${report}\n`, { flag: 'w' });
}

for (const language of ['en', 'vi'] as const) {
  for (const [viewportName, size] of [['desktop', { width: 1280, height: 800 }], ['mobile', { width: 390, height: 844 }]] as const) {
    test.describe(`${language} ${viewportName}`, () => {
      const copy = pilotCopy(language);
      test.use({ viewport: size });

      test('serializes the exact goal after a keyboard-only consent, before any production handler', async ({ page }) => {
        const seen = await open(page, language);
        await expect(page.getByRole('heading', { name: copy.home.heading })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
        const field = page.locator('input[name="websiteGoal"]');
        await expect(field).toHaveAttribute('maxlength', String(PILOT_LIMITS.goalMaxLength));
        await field.fill(goal);
        expect((await field.inputValue()).length).toBe(PILOT_LIMITS.initialGoalLength);
        await page.keyboard.press('Tab');
        const submit = page.getByRole('button', { name: copy.home.continueLabel });
        await expect(submit).toBeFocused();
        expect(await inViewport(page, submit)).toBe(true);
        await submit.focus();
        await page.keyboard.press('Enter');
        const consent = page.getByTestId('html-pilot-confirm-effect');
        await expect(page.getByTestId('html-pilot-effect-disclosure')).toBeVisible();
        expect(seen.executePosts).toHaveLength(0);
        expect(await inViewport(page, consent)).toBe(true);
        await consent.focus();
        await expect(consent).toBeFocused();
        await page.keyboard.press('Enter');
        await expect.poll(() => seen.executePosts.length).toBe(1);
        const body = seen.executePosts[0];
        assertSerializedGoal(body, goal);
        expect(body.templateId).toBe('web_build_handoff');
        expect(typeof (body.htmlPilotIntent as { operationKey?: unknown }).operationKey).toBe('string');
        for (const key of ['knowledgeContext', 'knowledgeCollectionId', 'aifMemoryReinjection', 'durableMemory', 'provider', 'model']) {
          expect(Object.hasOwn(body, key), key).toBe(false);
        }
        expect(seen.artifactAttempts).toEqual([]);
        await record(`preflight-serialize-${language}-${viewportName}`, language, viewportName, seen, { intercepted: true });
      });

      test('declines from the keyboard with zero execute requests and a locked, explained submit', async ({ page }) => {
        const seen = await open(page, language);
        await page.locator('input[name="websiteGoal"]').fill(goal);
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('html-pilot-effect-disclosure')).toBeVisible();
        const cancel = page.getByRole('button', { name: language === 'vi' ? 'Hủy' : 'Cancel', exact: true });
        expect(await inViewport(page, cancel)).toBe(true);
        await cancel.focus();
        await page.keyboard.press('Space');
        await expect(page.getByTestId('html-pilot-goal-blocked')).toHaveText(copy.home.blockedHint);
        await expect(page.getByRole('button', { name: copy.home.continueLabel })).toBeDisabled();
        await expect(page.getByTestId('draft-stop-notice')).toContainText(copy.home.stoppedNotice);
        expect(seen.executePosts).toHaveLength(0);
        expect(seen.artifactAttempts).toEqual([]);
        await record(`preflight-decline-${language}-${viewportName}`, language, viewportName, seen, { intercepted: true });
      });
    });
  }
}
