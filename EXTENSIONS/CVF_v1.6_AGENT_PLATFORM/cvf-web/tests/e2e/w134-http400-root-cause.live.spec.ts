/**
 * W134-T1 CP1/CP2 — Pre-AI HTTP 400 root-cause probe.
 *
 * This probe captures the /api/execute response body for one targeted trusted
 * form journey so the route rejection path is visible in evidence.
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { seedStorageWithAlibaba } from './utils';

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);
const INTENT_FIRST_ENABLED = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const EVIDENCE_JSON = resolve(EVIDENCE_ROOT, 'CVF_W134_HTTP400_EMAIL_TEMPLATE_PROBE_2026-05-07.json');

interface ProbeRecord {
  formType: 'email_template';
  templateId: 'email_template';
  httpStatus: number | null;
  elapsedMs: number;
  responseBody: string | null;
  routePath: 'guard_block' | 'enforcement_block' | 'clarify' | 'provider_key' | 'success' | 'other';
}

async function login(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.locator('input[type="text"][placeholder="admin"]').fill('admin');
  await page.locator('input[type="password"][placeholder="admin123"]').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
}

function classifyRoutePath(status: number | null, body: string | null): ProbeRecord['routePath'] {
  if (status === 200) return 'success';
  if (!body) return 'other';
  if (body.includes('"guardResult"') || body.includes('guard-blocked')) return 'guard_block';
  if (body.includes('"enforcement"') && body.includes('"BLOCK"')) return 'enforcement_block';
  if (body.includes('"CLARIFY"') || body.includes('"missing"')) return 'clarify';
  if (body.includes('API key not configured')) return 'provider_key';
  return 'other';
}

test.describe('W134-T1 CP1/CP2 — HTTP 400 body capture', () => {
  test(
    'captures exact /api/execute response body for email_template',
    { tag: ['@live', '@w134-cp1', '@w134-email-template'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W134 probe requires Alibaba/DashScope-compatible live key');
      test.skip(!INTENT_FIRST_ENABLED, 'W134 probe requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');

      page.setDefaultNavigationTimeout(15_000);
      page.setDefaultTimeout(15_000);

      await seedStorageWithAlibaba(page);
      await login(page);

      let executeHttpStatus: number | null = null;
      let executeBody: string | null = null;
      const startedAt = Date.now();

      page.on('response', async (res) => {
        if (!res.url().includes('/api/execute')) return;
        executeHttpStatus = res.status();
        executeBody = await res.text().catch((err) => `<<body-read-failed:${String(err).slice(0, 120)}>>`);
      });

      await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15_000 });
      await page.locator('textarea').first().fill('Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng');
      await page.waitForTimeout(600);
      await page
        .locator('button')
        .filter({ hasText: /Bắt đầu với governed path|Start with governed path/i })
        .first()
        .click();

      await page.locator('input[type="text"]').first().fill('Email giới thiệu dịch vụ tư vấn');
      await page.locator('textarea').last().fill('Đã gặp khách hàng trong hội thảo. Cần gửi email giới thiệu dịch vụ tư vấn chuyển đổi số và đề nghị đặt lịch trao đổi 30 phút.');

      await page.evaluate(() => {
        const form = document.querySelector('form');
        form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });

      await expect.poll(() => executeHttpStatus, { timeout: 95_000 }).not.toBeNull();
      await expect.poll(() => executeBody, { timeout: 5_000 }).not.toBeNull();

      const record: ProbeRecord = {
        formType: 'email_template',
        templateId: 'email_template',
        httpStatus: executeHttpStatus,
        elapsedMs: Date.now() - startedAt,
        responseBody: executeBody,
        routePath: classifyRoutePath(executeHttpStatus, executeBody),
      };

      mkdirSync(dirname(EVIDENCE_JSON), { recursive: true });
      writeFileSync(EVIDENCE_JSON, JSON.stringify(record, null, 2), 'utf8');

      expect(record.httpStatus).not.toBeNull();
    },
  );
});

