/**
 * w141-trusted-form-wizard-disambiguation.live.spec.ts
 * W141-T1 - Trusted Form / Wizard Disambiguation Live Proof
 *
 * Proves the W140 `execute_request_not_sent` rows are closed by routing the
 * 12 trusted-form Alibaba UI prompts to form workflow state instead of wizard
 * workflow state.
 */

import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const ALIBABA_KEY =
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY ||
  '';
const HAS_ALIBABA_KEY = Boolean(ALIBABA_KEY);
const INTENT_FIRST_ENABLED = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';
const CLARIFICATION_LOOP_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP === 'true';
const ITERATION_MEMORY_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY === 'true';

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const EVIDENCE_MD = resolve(EVIDENCE_ROOT, 'CVF_W141_TRUSTED_FORM_WIZARD_DISAMBIGUATION_ALIBABA_EVIDENCE_2026-05-08.md');
const EVIDENCE_JSON = resolve(EVIDENCE_ROOT, 'CVF_W141_TRUSTED_FORM_WIZARD_DISAMBIGUATION_ALIBABA_EVIDENCE_2026-05-08.json');

type Outcome =
  | 'accepted_with_receipt'
  | 'accepted_missing_receipt'
  | 'route_miss'
  | 'api_timeout'
  | 'ui_flow_error';

type Subcode =
  | 'execute_request_not_sent'
  | 'execute_request_sent_no_response'
  | 'execute_request_failed'
  | 'wizard_routing_shadow'
  | 'settings_not_hydrated'
  | 'provider_disabled'
  | 'missing_provider_key'
  | null;

interface JourneyRecord {
  formType: string;
  templateId: string;
  prompt: string;
  outcome: Outcome;
  subcode: Subcode;
  elapsedMs: number;
  httpStatus: number | null;
  executeRequestStarted: number;
  executeResponseObserved: number;
  executeRequestFinished: number;
  executeRequestFailed: number;
  requestFailureText: string | null;
  receiptPresent: boolean;
  pageSnippet: string | null;
  detail?: string;
}

const JOURNEY_MATRIX = [
  {
    formType: 'documentation', templateId: 'documentation',
    topicValue: 'Tài liệu hướng dẫn nhân viên mới',
    prompt: 'Viết tài liệu hướng dẫn sử dụng cho nhân viên mới',
  },
  {
    formType: 'email_template', templateId: 'email_template',
    topicValue: 'Email giới thiệu dịch vụ tư vấn',
    prompt: 'Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng',
  },
  {
    formType: 'risk_assessment', templateId: 'risk_assessment',
    topicValue: 'Rủi ro dự án phần mềm kho',
    prompt: 'Đánh giá rủi ro cho dự án triển khai phần mềm quản lý kho tại doanh nghiệp',
  },
  {
    formType: 'competitor_review', templateId: 'competitor_review',
    topicValue: 'Đối thủ cạnh tranh logistics',
    prompt: 'Phân tích đối thủ cạnh tranh trong lĩnh vực dịch vụ logistics',
  },
  {
    formType: 'user_persona', templateId: 'user_persona',
    topicValue: 'Khách hàng ứng dụng tài chính cá nhân',
    prompt: 'Xây dựng hồ sơ khách hàng mục tiêu cho ứng dụng quản lý tài chính cá nhân',
  },
  {
    formType: 'strategy_analysis', templateId: 'strategy_analysis',
    topicValue: 'Chiến lược mở rộng miền Trung',
    prompt: 'Phân tích chiến lược mở rộng sang thị trường miền Trung Việt Nam',
  },
  {
    formType: 'feature_prioritization', templateId: 'feature_prioritization',
    topicValue: 'Ưu tiên tính năng SaaS v2',
    prompt: 'Lập danh sách ưu tiên tính năng cho phiên bản tiếp theo của sản phẩm SaaS',
  },
  {
    formType: 'pricing_strategy', templateId: 'pricing_strategy',
    topicValue: 'Chiến lược giá SaaS B2B SME',
    prompt: 'Xây dựng chiến lược định giá cho sản phẩm SaaS B2B trong thị trường SME',
  },
  {
    formType: 'documentation', templateId: 'documentation',
    topicValue: 'Tài liệu kỹ thuật API thanh toán',
    prompt: 'Tạo tài liệu kỹ thuật cho API tích hợp hệ thống thanh toán',
  },
  {
    formType: 'email_template', templateId: 'email_template',
    topicValue: 'Email xác nhận lịch hẹn đối tác',
    prompt: 'Viết email xác nhận lịch hẹn với đối tác kinh doanh',
  },
  {
    formType: 'risk_assessment', templateId: 'risk_assessment',
    topicValue: 'Rủi ro mở rộng thị trường Đông Nam Á',
    prompt: 'Phân tích rủi ro khi mở rộng kinh doanh sang thị trường Đông Nam Á',
  },
  {
    formType: 'strategy_analysis', templateId: 'strategy_analysis',
    topicValue: 'Cơ hội ra mắt sản phẩm doanh nghiệp lớn',
    prompt: 'Đánh giá cơ hội và thách thức khi ra mắt sản phẩm mới cho phân khúc doanh nghiệp lớn',
  },
] as const;

function compact(value: string | null | undefined, max = 500) {
  if (!value) return null;
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

async function setupAlibabaPage(page: Page) {
  page.setDefaultNavigationTimeout(15_000);
  page.setDefaultTimeout(15_000);
  await page.addInitScript((key) => {
    localStorage.setItem('cvf_settings', JSON.stringify({
      providers: {
        alibaba: { apiKey: key, enabled: true, selectedModel: 'qwen-plus' },
      },
      preferences: {
        defaultProvider: 'alibaba',
        defaultExportMode: 'governance',
        defaultLanguage: 'vi',
        autoSaveHistory: true,
        showWelcomeTour: false,
      },
    }));
    localStorage.setItem('cvf_onboarding_complete', 'true');
    localStorage.setItem('cvf_onboarding_seen', '1');
    localStorage.setItem('cvf_setup_banner_dismissed', 'true');
  }, ALIBABA_KEY);
}

async function login(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.locator('input[type="text"][placeholder="admin"]').fill('admin');
  await page.locator('input[type="password"][placeholder="admin123"]').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
}

async function fillVisibleFields(page: Page, topicValue: string) {
  const allInputs = page.locator('input[type="text"]');
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    if (await input.isVisible().catch(() => false)) {
      const value = await input.inputValue().catch(() => '');
      if (!value) await input.fill(i === 0 ? topicValue : `Thông tin bổ sung ${i}`);
    }
  }

  const allTextareas = page.locator('textarea');
  const textareaCount = await allTextareas.count();
  for (let i = 0; i < textareaCount; i++) {
    const textarea = allTextareas.nth(i);
    if (await textarea.isVisible().catch(() => false)) {
      const value = await textarea.inputValue().catch(() => '');
      if (!value) await textarea.fill('Nội dung kiểm thử W141 cho trường này.');
    }
  }
}

async function submitCurrentForm(page: Page) {
  await page.evaluate(() => {
    const form = document.querySelector('form');
    if (!form) return;
    try {
      form.requestSubmit();
    } catch {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
}

async function runJourney(
  page: Page,
  journey: { prompt: string; formType: string; templateId: string; topicValue: string },
): Promise<JourneyRecord> {
  const startedAt = Date.now();
  let httpStatus: number | null = null;
  let executeRequestStarted = 0;
  let executeResponseObserved = 0;
  let executeRequestFinished = 0;
  let executeRequestFailed = 0;
  let requestFailureText: string | null = null;
  const isExecuteUrl = (url: string) => url.includes('/api/execute');

  const record = async (outcome: Outcome, subcode: Subcode, detail?: string): Promise<JourneyRecord> => ({
    formType: journey.formType,
    templateId: journey.templateId,
    prompt: journey.prompt,
    outcome,
    subcode,
    elapsedMs: Date.now() - startedAt,
    httpStatus,
    executeRequestStarted,
    executeResponseObserved,
    executeRequestFinished,
    executeRequestFailed,
    requestFailureText,
    receiptPresent: false,
    pageSnippet: compact(await page.locator('body').innerText({ timeout: 1_000 }).catch(() => null), 700),
    detail,
  });

  const onRequest = (req: Request) => {
    if (isExecuteUrl(req.url())) executeRequestStarted++;
  };
  const onResponse = (res: Response) => {
    if (!isExecuteUrl(res.url())) return;
    executeResponseObserved++;
    httpStatus = res.status();
  };
  const onRequestFinished = (req: Request) => {
    if (isExecuteUrl(req.url())) executeRequestFinished++;
  };
  const onRequestFailed = (req: Request) => {
    if (!isExecuteUrl(req.url())) return;
    executeRequestFailed++;
    requestFailureText = req.failure()?.errorText ?? null;
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFailed);

  try {
    await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForTimeout(800);

    const settingsRaw = await page.evaluate(() => localStorage.getItem('cvf_settings')).catch(() => null);
    if (!settingsRaw) return record('ui_flow_error', 'settings_not_hydrated', 'cvf_settings absent');
    const settings = JSON.parse(settingsRaw) as { providers?: Record<string, { enabled?: boolean; apiKey?: string }> };
    const providerSettings = settings.providers?.alibaba;
    if (!providerSettings?.enabled) return record('ui_flow_error', 'provider_disabled', 'alibaba not enabled');
    if (!providerSettings?.apiKey) return record('ui_flow_error', 'missing_provider_key', 'alibaba key absent');

    const intentInput = page.locator('textarea').first();
    if (!await intentInput.isVisible().catch(() => false)) {
      return record('ui_flow_error', null, 'IntentEntry textarea not visible');
    }
    await intentInput.fill(journey.prompt);
    await page.waitForTimeout(600);

    const cta = page
      .locator('button')
      .filter({ hasText: /Bắt đầu với governed path|Start with governed path/i })
      .first();
    if (!await cta.isEnabled().catch(() => false)) {
      return record('route_miss', null, 'CTA disabled');
    }
    await cta.click();
    await page.waitForTimeout(400);

    const pageText = await page.locator('body').innerText({ timeout: 1_000 }).catch(() => '');
    const firstTextInput = page.locator('input[type="text"]').first();
    if (!await firstTextInput.isVisible().catch(() => false)) {
      const shadowedByWizard = /Wizard|System Design|Business Strategy/.test(pageText);
      return record(
        'route_miss',
        shadowedByWizard ? 'wizard_routing_shadow' : null,
        shadowedByWizard ? 'Intent routed to wizard instead of trusted form' : 'DynamicForm not visible after CTA',
      );
    }

    await fillVisibleFields(page, journey.topicValue);
    await submitCurrentForm(page);
    await page.waitForTimeout(500);

    const exportNudge = page.locator('[data-testid="noncoder-export-nudge"]');
    try {
      await exportNudge.waitFor({ state: 'visible', timeout: 90_000 });
    } catch {
      const subcode: Subcode =
        executeRequestStarted === 0
          ? 'execute_request_not_sent'
          : executeRequestFailed > 0
            ? 'execute_request_failed'
            : executeResponseObserved === 0
              ? 'execute_request_sent_no_response'
              : null;
      return record('api_timeout', subcode, 'Export nudge absent after 90s');
    }

    const evidenceReceipt = page.locator('[data-testid="w119-evidence-receipt"]');
    const receiptPresent = await evidenceReceipt.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!receiptPresent) {
      return record('accepted_missing_receipt', null, 'Result visible but receipt absent');
    }

    return {
      ...(await record('accepted_with_receipt', null)),
      receiptPresent: true,
    };
  } finally {
    page.off('request', onRequest);
    page.off('response', onResponse);
    page.off('requestfinished', onRequestFinished);
    page.off('requestfailed', onRequestFailed);
  }
}

function writeEvidence(journeyLog: JourneyRecord[], runStatus: 'in_progress' | 'complete') {
  const count = (outcome: Outcome) => journeyLog.filter((j) => j.outcome === outcome).length;
  const countSubcode = (subcode: Subcode) => journeyLog.filter((j) => j.subcode === subcode).length;
  const acceptedWithReceipt = count('accepted_with_receipt');
  const outcomeBreakdown = {
    accepted_with_receipt: acceptedWithReceipt,
    accepted_missing_receipt: count('accepted_missing_receipt'),
    route_miss: count('route_miss'),
    api_timeout: count('api_timeout'),
    ui_flow_error: count('ui_flow_error'),
  };
  const diagnosticBreakdown = {
    execute_request_not_sent: countSubcode('execute_request_not_sent'),
    execute_request_sent_no_response: countSubcode('execute_request_sent_no_response'),
    execute_request_failed: countSubcode('execute_request_failed'),
    wizard_routing_shadow: countSubcode('wizard_routing_shadow'),
    settings_not_hydrated: countSubcode('settings_not_hydrated'),
    provider_disabled: countSubcode('provider_disabled'),
    missing_provider_key: countSubcode('missing_provider_key'),
  };
  const summary = {
    capturedAt: new Date().toISOString(),
    runStatus,
    provider: 'alibaba',
    model: 'qwen-plus',
    tranche: 'W141-T1 - Trusted Form / Wizard Disambiguation',
    attemptedJourneys: journeyLog.length,
    acceptedWithReceipt,
    outcomeBreakdown,
    diagnosticBreakdown,
    lifecycleBreakdown: {
      noExecuteRequestStarted: journeyLog.filter((j) => j.executeRequestStarted === 0).length,
      executeResponseObserved: journeyLog.filter((j) => j.executeResponseObserved > 0).length,
      executeRequestFailed: journeyLog.filter((j) => j.executeRequestFailed > 0).length,
    },
    journeyLog,
  };

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W141 Trusted Form / Wizard Disambiguation - Alibaba',
    '',
    `**Run status:** ${runStatus}`,
    `**Captured:** ${summary.capturedAt}`,
    '**Provider:** alibaba / qwen-plus',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| Attempted | ${summary.attemptedJourneys} |`,
    `| Accepted with receipt | ${acceptedWithReceipt} |`,
    `| No execute request started | ${summary.lifecycleBreakdown.noExecuteRequestStarted} |`,
    `| Wizard routing shadow | ${diagnosticBreakdown.wizard_routing_shadow} |`,
    '',
    '## Journey Log',
    '',
    '| # | Form | Outcome | Subcode | HTTP | Started | Response | Finished | Failed | Elapsed |',
    '|---|---|---|---|---:|---:|---:|---:|---:|---:|',
    ...journeyLog.map((j, index) =>
      `| ${index + 1} | ${j.formType} | \`${j.outcome}\` | ${j.subcode ?? 'none'} | ${j.httpStatus ?? 'n/a'} | ${j.executeRequestStarted} | ${j.executeResponseObserved} | ${j.executeRequestFinished} | ${j.executeRequestFailed} | ${j.elapsedMs} |`,
    ),
    '',
  ].join('\n');

  mkdirSync(dirname(EVIDENCE_MD), { recursive: true });
  writeFileSync(EVIDENCE_MD, md, 'utf8');
  writeFileSync(EVIDENCE_JSON, JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

test.describe('W141-T1 - trusted form / wizard disambiguation', () => {
  test(
    'Alibaba 12-journey UI matrix no longer routes trusted forms into wizard flows',
    { tag: ['@live', '@w141', '@w141-alibaba'] },
    async ({ browser }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W141 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY alias');
      test.skip(!INTENT_FIRST_ENABLED, 'W141 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_LOOP_ENABLED, 'W141 requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W141 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');
      test.setTimeout(2_400_000);

      const journeyLog: JourneyRecord[] = [];
      for (const journey of JOURNEY_MATRIX) {
        const idx = journeyLog.length + 1;
        console.log(`[W141-alibaba] journey ${idx}/${JOURNEY_MATRIX.length}: ${journey.formType}`);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
          await setupAlibabaPage(page);
          await login(page);
          const result = await runJourney(page, journey);
          journeyLog.push(result);
          console.log(
            `[W141-alibaba] outcome=${result.outcome} subcode=${result.subcode ?? 'none'} http=${result.httpStatus ?? 'none'} started=${result.executeRequestStarted} response=${result.executeResponseObserved} elapsed=${result.elapsedMs}ms`,
          );
        } catch (err) {
          journeyLog.push({
            formType: journey.formType,
            templateId: journey.templateId,
            prompt: journey.prompt,
            outcome: 'ui_flow_error',
            subcode: null,
            elapsedMs: 0,
            httpStatus: null,
            executeRequestStarted: 0,
            executeResponseObserved: 0,
            executeRequestFinished: 0,
            executeRequestFailed: 0,
            requestFailureText: null,
            receiptPresent: false,
            pageSnippet: null,
            detail: String(err).slice(0, 200),
          });
        } finally {
          await ctx.close().catch(() => {});
        }

        writeEvidence(journeyLog, 'in_progress');
        if (idx < JOURNEY_MATRIX.length) {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
        }
      }

      const summary = writeEvidence(journeyLog, 'complete');
      console.log('[W141-alibaba] attempted:', summary.attemptedJourneys);
      console.log('[W141-alibaba] accepted:', summary.acceptedWithReceipt);
      console.log('[W141-alibaba] diagnostics:', JSON.stringify(summary.diagnosticBreakdown));

      expect(summary.attemptedJourneys).toBeGreaterThanOrEqual(12);
      expect(summary.acceptedWithReceipt).toBeGreaterThanOrEqual(11);
      expect(summary.diagnosticBreakdown.execute_request_not_sent).toBe(0);
      expect(summary.diagnosticBreakdown.wizard_routing_shadow).toBe(0);
    },
  );
});
