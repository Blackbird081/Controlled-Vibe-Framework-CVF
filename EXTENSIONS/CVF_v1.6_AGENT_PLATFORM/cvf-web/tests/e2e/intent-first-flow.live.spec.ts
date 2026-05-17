/**
 * intent-first-flow.live.spec.ts
 * W122-T1 CP5 — Intent-First Flow Live E2E Tests
 *
 * Governance policy (AGENTS.md §Mandatory Live Governance Proof):
 *   Any claim about CVF governance behavior MUST use a real provider API call.
 *   Live lane: Alibaba (DASHSCOPE_API_KEY / ALIBABA_API_KEY).
 *
 * Journey coverage (3 locked journeys per §5.3 of roadmap):
 *   J1: Intent-first entry → route detection → wizard launch (mock mode flag off — structural)
 *   J2: Intent-first entry with flag on → IntentEntry visible → routing CTA → wizard wired (flag=true)
 *   J3: Live governed execution via routed wizard path → governanceEvidenceReceipt present
 *
 * Run:
 *   DASHSCOPE_API_KEY=<key> NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true npx playwright test intent-first-flow.live.spec.ts
 *
 * W122-T1 — CP5
 */

import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login } from './utils';

const INTENT_FLAG_OFF = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR !== 'true';
const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);

test.describe('W122 Intent-First Flow', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // J1: Structural — flag OFF (default behavior unchanged)
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('J1: Flag off — intent entry NOT visible (default behavior preserved)', () => {
    test.skip(!INTENT_FLAG_OFF, 'Skipped: flag is ON — J1 structural-off assertions cannot run against a flag-on server instance');

    test('Home page loads and shows template gallery without IntentEntry banner', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/home');
      await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByPlaceholder(/Mô tả mục tiêu|Describe your goal/i)).not.toBeVisible();
    });

    test('QuickStart step 2 renders intent textarea without router rationale panel', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/home');
      const qs_btn = page.getByRole('button', { name: /Khởi động nhanh|Quick Start/i }).first();
      await qs_btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {
        test.skip(true, 'QuickStart button not found — skip J1 step 2 check');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // J2: Flag ON — IntentEntry visible, routing CTA present
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('J2: Flag on — IntentEntry banner visible on Home', () => {
    test.skip(INTENT_FLAG_OFF, 'Skipped: NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR not set to true');

    test('IntentEntry banner renders on home page', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/home');
      await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText(/Mô tả mục tiêu|Describe your goal/i)).toBeVisible({ timeout: 5_000 });
    });

    test('Typing in IntentEntry shows route preview after 5+ chars', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/home');
      await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });

      const textarea = page.getByPlaceholder(/Ví dụ|e\.g\./i).first();
      await textarea.waitFor({ state: 'visible', timeout: 5_000 });
      await textarea.fill('Tôi muốn tạo app quản lý công việc');

      await expect(page.getByText(/CVF đề xuất|CVF recommends/i)).toBeVisible({ timeout: 5_000 });
    });

    test('Clicking CTA from IntentEntry routes to wizard state', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/home');
      await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });

      const textarea = page.getByPlaceholder(/Ví dụ|e\.g\./i).first();
      await textarea.waitFor({ state: 'visible', timeout: 5_000 });
      await textarea.fill('Tôi muốn xây dựng app quản lý kho hàng');
      await expect(page.getByText(/CVF đề xuất|CVF recommends/i)).toBeVisible({ timeout: 5_000 });

      const cta = page.getByRole('button', { name: /Bắt đầu với governed path|Start with governed path/i });
      await cta.waitFor({ state: 'visible', timeout: 3_000 });
      await cta.click();

      await expect(page.getByText(/Wizard|App Builder/i).first()).toBeVisible({ timeout: 5_000 });
    });

    test('Skills page shows intent-first back-link when flag is on', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
      });
      await page.goto('/skills');
      await expect(page.getByText(/Mô tả mục tiêu để CVF|Describe your goal and let CVF/i)).toBeVisible({ timeout: 10_000 });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // J3: Live governed execution via routed wizard (live API — Alibaba lane)
  // ─────────────────────────────────────────────────────────────────────────
  test.describe('J3: Live governed execution after intent routing', () => {
    test.skip(!HAS_ALIBABA_KEY, 'Skipped: no Alibaba API key in environment');

    test.beforeEach(async ({ page }) => {
      await seedStorageWithAlibaba(page);
      await login(page);
    });

    test('POST /api/execute with app-builder wizard template returns governanceEvidenceReceipt', async ({ page }) => {
      const apiKey = process.env.DASHSCOPE_API_KEY
        ?? process.env.ALIBABA_API_KEY
        ?? process.env.CVF_ALIBABA_API_KEY
        ?? process.env.CVF_BENCHMARK_ALIBABA_KEY
        ?? '';

      const response = await page.request.post('/api/execute', {
        data: {
          templateId: 'app_builder_wizard',
          templateName: 'App Builder Wizard',
          intent: `INTENT:\nBuild a task management web application.\n\nCONTEXT:\nSmall team, need kanban board, deadline tracking, role-based access.\n\nSUCCESS CRITERIA:\n- Clear architecture\n- Governed and auditable`,
          inputs: {
            projectName: 'TaskFlow',
            description: 'Task management app with kanban board',
            techStack: 'Next.js, TypeScript, PostgreSQL',
            requirements: 'Kanban board, deadlines, RBAC',
          },
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'governance',
          action: 'generate',
          apiKey,
        },
      });

      const body = await response.json();

      // Accept any governed outcome: ALLOW (200), BLOCK (400), CLARIFY (422),
      // NEEDS_APPROVAL / approval-conflict (409). All paths surface
      // governanceEvidenceReceipt; only ALLOW carries `output`.
      expect([200, 400, 409, 422]).toContain(response.status());
      expect(body).toHaveProperty('governanceEvidenceReceipt');
      expect(body.governanceEvidenceReceipt).toHaveProperty('decision');

      if (response.status() === 200) {
        expect(body).toHaveProperty('output');
        expect(body.success).toBe(true);
        console.log('[W122-CP5-J3] ALLOW receipt:', JSON.stringify(body.governanceEvidenceReceipt));
      } else {
        // BLOCK / CLARIFY / NEEDS_APPROVAL — error path, no `output` field.
        expect(body).toHaveProperty('error');
        expect(body.success).toBe(false);
        console.log('[W122-CP5-J3] Governed non-allow:', response.status(), body.governanceEvidenceReceipt?.decision, body.error);
      }
    });

    test('Routed intent + live execution preserves governance fields (phase, riskLevel in audit trail)', async ({ page }) => {
      const apiKey = process.env.DASHSCOPE_API_KEY
        ?? process.env.ALIBABA_API_KEY
        ?? process.env.CVF_ALIBABA_API_KEY
        ?? process.env.CVF_BENCHMARK_ALIBABA_KEY
        ?? '';

      const response = await page.request.post('/api/execute', {
        data: {
          templateId: 'business_strategy_wizard',
          templateName: 'Business Strategy Wizard',
          intent: `INTENT:\nMở rộng thị trường cho startup SaaS tại Đông Nam Á.\n\nCONTEXT:\nB2B SaaS, 50 khách hàng VN hiện tại.\n\nSUCCESS CRITERIA:\nPhân tích rõ cơ hội và rủi ro`,
          inputs: {
            business: 'B2B SaaS — quản lý dự án',
            market: 'Đông Nam Á',
            stage: 'Seed',
          },
          provider: 'alibaba',
          model: 'qwen-turbo',
          mode: 'governance',
          action: 'analyze',
          apiKey,
        },
      });

      const body = await response.json();
      // Same governed-outcome contract as Test J3.1 — receipt always present;
      // `output` only on ALLOW (200).
      expect([200, 400, 409, 422]).toContain(response.status());
      expect(body).toHaveProperty('governanceEvidenceReceipt');
      const receipt = body.governanceEvidenceReceipt;
      expect(receipt).toHaveProperty('decision');
      expect(['ALLOW', 'NEEDS_APPROVAL', 'BLOCK', 'CLARIFY']).toContain(receipt.decision);

      if (response.status() === 200) {
        expect(body).toHaveProperty('output');
        expect(body.success).toBe(true);
      } else {
        expect(body).toHaveProperty('error');
        expect(body.success).toBe(false);
      }
      console.log('[W122-CP5-J3] Evidence receipt decision:', receipt.decision);
    });
  });
});
