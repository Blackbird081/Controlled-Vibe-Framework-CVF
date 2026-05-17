/**
 * w140-ui-execution-lifecycle-diagnostic.live.spec.ts
 * W140-T1 - UI Execution Lifecycle Diagnostic
 *
 * W139 proved the trusted-form direct API matrix:
 * - Alibaba direct /api/execute: 12/12 accepted
 * - DeepSeek direct /api/execute: 6/6 accepted
 *
 * W140 keeps product runtime untouched and captures the browser UI lifecycle
 * for the remaining Alibaba repeated-journey timeout boundary.
 *
 * Output:
 *   docs/reviews/CVF_W140_UI_EXECUTION_LIFECYCLE_ALIBABA_EVIDENCE_2026-05-08.md
 *   docs/reviews/CVF_W140_UI_EXECUTION_LIFECYCLE_ALIBABA_EVIDENCE_2026-05-08.json
 */

import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

// Environment guards

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

// Evidence file paths

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const ALIBABA_MD = resolve(EVIDENCE_ROOT, 'CVF_W140_UI_EXECUTION_LIFECYCLE_ALIBABA_EVIDENCE_2026-05-08.md');
const ALIBABA_JSON = resolve(EVIDENCE_ROOT, 'CVF_W140_UI_EXECUTION_LIFECYCLE_ALIBABA_EVIDENCE_2026-05-08.json');

type JourneyOutcome =
  | 'accepted_with_receipt'
  | 'accepted_missing_receipt'
  | 'route_miss'
  | 'api_timeout'
  | 'provider_error'
  | 'ui_flow_error';

type DiagnosticSubcode =
  | 'execute_request_not_sent'
  | 'execute_request_sent_no_response'
  | 'execute_request_failed'
  | 'response_observed_result_not_rendered'
  | 'provider_timeout'
  | 'settings_not_hydrated'
  | 'provider_disabled'
  | 'missing_provider_key'
  | 'browser_context_closed'
  | null;

interface UiSnapshot {
  url: string;
  bodySnippet: string | null;
  processingVisible: boolean;
  completionBannerVisible: boolean;
  exportNudgeVisible: boolean;
  evidenceReceiptVisible: boolean;
  dynamicFormVisible: boolean;
  alertText: string | null;
}

interface JourneyRecord {
  prompt: string;
  formType: string;
  templateId: string;
  outcome: JourneyOutcome;
  diagnosticSubcode: DiagnosticSubcode;
  provider: 'alibaba';
  model: 'qwen-plus';
  keyAliasPresent: boolean;
  submitTimestampMs: number;
  elapsedMs: number;
  httpStatus: number | null;
  responseBodySnippet: string | null;
  executeRequestStarted: number;
  executeResponseObserved: number;
  executeRequestFinished: number;
  executeRequestFailed: number;
  executeRequestFailureText: string | null;
  processingVisibleAtTimeout: boolean | null;
  completionBannerVisibleAtTimeout: boolean | null;
  exportNudgeVisibleAtTimeout: boolean | null;
  evidenceReceiptVisibleAtTimeout: boolean | null;
  dynamicFormVisibleAtTimeout: boolean | null;
  windowLocationAtTimeout: string | null;
  pageTextSnippetAtTimeout: string | null;
  alertTextAtTimeout: string | null;
  consoleMessages: string[];
  pageErrors: string[];
  receiptPresent: boolean;
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

function snippet(value: string | null | undefined, max = 500) {
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
  await page.getByRole('button', { name: /Dang nhap|Đăng nhập/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
}

async function captureUiSnapshot(page: Page): Promise<UiSnapshot> {
  const bodyText = await page.locator('body').innerText({ timeout: 1_000 }).catch(() => null);
  const alertText = await page.locator('[role="alert"]').first().innerText({ timeout: 500 }).catch(() => null);
  return {
    url: page.url(),
    bodySnippet: snippet(bodyText, 700),
    processingVisible: await page.getByRole('heading', { name: /Processing|Dang xu ly|Đang xử lý|AI Processing/i }).first().isVisible().catch(() => false),
    completionBannerVisible: await page.locator('[data-testid="completion-banner"]').isVisible().catch(() => false),
    exportNudgeVisible: await page.locator('[data-testid="noncoder-export-nudge"]').isVisible().catch(() => false),
    evidenceReceiptVisible: await page.locator('[data-testid="w119-evidence-receipt"]').isVisible().catch(() => false),
    dynamicFormVisible: await page.locator('form').first().isVisible().catch(() => false),
    alertText: snippet(alertText, 300),
  };
}

function classifyTimeout(params: {
  executeRequestStarted: number;
  executeRequestFailed: number;
  executeHttpStatus: number | null;
  snapshot: UiSnapshot;
}): DiagnosticSubcode {
  if (params.executeRequestStarted === 0) return 'execute_request_not_sent';
  if (params.executeRequestFailed > 0) return 'execute_request_failed';
  if (params.executeHttpStatus !== null && params.snapshot.exportNudgeVisible) return 'provider_timeout';
  if (params.executeHttpStatus !== null) return 'response_observed_result_not_rendered';
  return 'execute_request_sent_no_response';
}

function withUiSnapshot(record: JourneyRecord, snapshot: UiSnapshot): JourneyRecord {
  return {
    ...record,
    processingVisibleAtTimeout: snapshot.processingVisible,
    completionBannerVisibleAtTimeout: snapshot.completionBannerVisible,
    exportNudgeVisibleAtTimeout: snapshot.exportNudgeVisible,
    evidenceReceiptVisibleAtTimeout: snapshot.evidenceReceiptVisible,
    dynamicFormVisibleAtTimeout: snapshot.dynamicFormVisible,
    windowLocationAtTimeout: snapshot.url,
    pageTextSnippetAtTimeout: snapshot.bodySnippet,
    alertTextAtTimeout: snapshot.alertText,
  };
}

async function runUiJourney(
  page: Page,
  journey: { prompt: string; formType: string; templateId: string; topicValue: string },
): Promise<JourneyRecord> {
  const submitTimestampMs = Date.now();
  let executeHttpStatus: number | null = null;
  let executeResponseBodySnippet: string | null = null;
  let executeRequestStarted = 0;
  let executeResponseObserved = 0;
  let executeRequestFinished = 0;
  let executeRequestFailed = 0;
  let executeRequestFailureText: string | null = null;
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  const isExecuteUrl = (url: string) => url.includes('/api/execute');

  const baseFields = {
    prompt: journey.prompt,
    formType: journey.formType,
    templateId: journey.templateId,
    provider: 'alibaba' as const,
    model: 'qwen-plus' as const,
    keyAliasPresent: HAS_ALIBABA_KEY,
    submitTimestampMs,
  };

  const baseRecord = (
    outcome: JourneyOutcome,
    diagnosticSubcode: DiagnosticSubcode,
    detail?: string,
  ): JourneyRecord => ({
    ...baseFields,
    outcome,
    diagnosticSubcode,
    elapsedMs: Date.now() - submitTimestampMs,
    httpStatus: executeHttpStatus,
    responseBodySnippet: executeResponseBodySnippet,
    executeRequestStarted,
    executeResponseObserved,
    executeRequestFinished,
    executeRequestFailed,
    executeRequestFailureText,
    processingVisibleAtTimeout: null,
    completionBannerVisibleAtTimeout: null,
    exportNudgeVisibleAtTimeout: null,
    evidenceReceiptVisibleAtTimeout: null,
    dynamicFormVisibleAtTimeout: null,
    windowLocationAtTimeout: null,
    pageTextSnippetAtTimeout: null,
    alertTextAtTimeout: null,
    consoleMessages,
    pageErrors,
    receiptPresent: false,
    detail,
  });

  const onRequest = (req: Request) => {
    if (isExecuteUrl(req.url())) executeRequestStarted++;
  };
  const onResponse = async (res: Response) => {
    if (!isExecuteUrl(res.url())) return;
    executeResponseObserved++;
    executeHttpStatus = res.status();
    if (res.status() >= 400) {
      executeResponseBodySnippet = snippet(
        await res.text().catch((err) => `<<body-read-failed:${String(err).slice(0, 120)}>>`),
      );
    } else {
      executeResponseBodySnippet = '<<success-body-elided>>';
    }
  };
  const onRequestFinished = (req: Request) => {
    if (isExecuteUrl(req.url())) executeRequestFinished++;
  };
  const onRequestFailed = (req: Request) => {
    if (!isExecuteUrl(req.url())) return;
    executeRequestFailed++;
    executeRequestFailureText = req.failure()?.errorText ?? null;
  };
  const onConsole = (msg: { type(): string; text(): string }) => {
    if (!['error', 'warning'].includes(msg.type())) return;
    if (consoleMessages.length < 8) consoleMessages.push(snippet(`${msg.type()}: ${msg.text()}`, 220) ?? '');
  };
  const onPageError = (err: Error) => {
    if (pageErrors.length < 8) pageErrors.push(snippet(err.message, 220) ?? '');
  };

  page.on('request', onRequest);
  page.on('response', onResponse);
  page.on('requestfinished', onRequestFinished);
  page.on('requestfailed', onRequestFailed);
  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  try {
    await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    const settingsRaw = await page.evaluate(() => localStorage.getItem('cvf_settings')).catch(() => null);
    if (!settingsRaw) return baseRecord('ui_flow_error', 'settings_not_hydrated', 'cvf_settings absent');
    const settings = JSON.parse(settingsRaw) as {
      providers?: Record<string, { apiKey?: string; enabled?: boolean }>;
    };
    const ps = settings.providers?.alibaba;
    if (!ps?.enabled) return baseRecord('ui_flow_error', 'provider_disabled', 'alibaba not enabled');
    if (!ps?.apiKey) return baseRecord('ui_flow_error', 'missing_provider_key', 'alibaba key absent');

    const intentInput = page.locator('textarea').first();
    if (!await intentInput.isVisible().catch(() => false)) {
      return baseRecord('ui_flow_error', null, 'IntentEntry textarea not visible');
    }

    await intentInput.fill(journey.prompt);
    await page.waitForTimeout(600);

    const ctaBtn = page
      .locator('button')
      .filter({ hasText: /Bat dau voi governed path|Bắt đầu với governed path|Start with governed path/i })
      .first();
    if (!await ctaBtn.isEnabled().catch(() => false)) {
      return baseRecord('route_miss', null, 'CTA disabled; no strong route produced');
    }
    await ctaBtn.click();
    await page.waitForTimeout(400);

    const firstInput = page.locator('input[type="text"]').first();
    if (!await firstInput.isVisible().catch(() => false)) {
      return baseRecord('ui_flow_error', null, 'DynamicForm not visible after CTA');
    }

    const allInputs = page.locator('input[type="text"]');
    const inputCount = await allInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const inp = allInputs.nth(i);
      if (await inp.isVisible().catch(() => false)) {
        const currentValue = await inp.inputValue().catch(() => '');
        if (!currentValue) await inp.fill(i === 0 ? journey.topicValue : `Thông tin bổ sung ${i}`);
      }
    }

    const allTextareas = page.locator('textarea');
    const textareaCount = await allTextareas.count();
    for (let i = 0; i < textareaCount; i++) {
      const ta = allTextareas.nth(i);
      if (await ta.isVisible().catch(() => false)) {
        const currentValue = await ta.inputValue().catch(() => '');
        if (!currentValue) await ta.fill('Nội dung kiểm thử W140 cho trường này.');
      }
    }

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return;
      try {
        form.requestSubmit();
      } catch {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });
    await page.waitForTimeout(500);

    const exportNudge = page.locator('[data-testid="noncoder-export-nudge"]');
    const evidenceReceipt = page.locator('[data-testid="w119-evidence-receipt"]');

    try {
      await exportNudge.waitFor({ state: 'visible', timeout: 90_000 });
    } catch {
      const snapshot = await captureUiSnapshot(page);
      const diagnosticSubcode = classifyTimeout({
        executeRequestStarted,
        executeRequestFailed,
        executeHttpStatus,
        snapshot,
      });
      return withUiSnapshot(
        baseRecord(
          'api_timeout',
          diagnosticSubcode,
          `Export nudge absent after 90s; requestStarted=${executeRequestStarted}; responseObserved=${executeResponseObserved}; requestFinished=${executeRequestFinished}; requestFailed=${executeRequestFailed}; http=${executeHttpStatus ?? 'none'}`,
        ),
        snapshot,
      );
    }

    const receiptPresent = await evidenceReceipt.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!receiptPresent) {
      return baseRecord('accepted_missing_receipt', null, 'ResultViewer visible but governance receipt absent');
    }

    return {
      ...baseRecord('accepted_with_receipt', null),
      receiptPresent: true,
    };
  } catch (err) {
    const msg = String(err);
    const isClosed =
      msg.includes('Target closed') ||
      msg.includes('context was destroyed') ||
      msg.includes('Protocol error');
    return baseRecord('ui_flow_error', isClosed ? 'browser_context_closed' : null, msg.slice(0, 200));
  } finally {
    page.off('request', onRequest);
    page.off('response', onResponse);
    page.off('requestfinished', onRequestFinished);
    page.off('requestfailed', onRequestFailed);
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
}

function writeEvidence(journeyLog: JourneyRecord[], runStatus: 'in_progress' | 'complete') {
  const countOutcome = (outcome: JourneyOutcome) => journeyLog.filter((j) => j.outcome === outcome).length;
  const countSubcode = (subcode: DiagnosticSubcode) => journeyLog.filter((j) => j.diagnosticSubcode === subcode).length;
  const acceptedWithReceipt = countOutcome('accepted_with_receipt');
  const outcomeBreakdown = {
    accepted_with_receipt: acceptedWithReceipt,
    accepted_missing_receipt: countOutcome('accepted_missing_receipt'),
    route_miss: countOutcome('route_miss'),
    api_timeout: countOutcome('api_timeout'),
    provider_error: countOutcome('provider_error'),
    ui_flow_error: countOutcome('ui_flow_error'),
  };
  const diagnosticBreakdown = {
    execute_request_not_sent: countSubcode('execute_request_not_sent'),
    execute_request_sent_no_response: countSubcode('execute_request_sent_no_response'),
    execute_request_failed: countSubcode('execute_request_failed'),
    response_observed_result_not_rendered: countSubcode('response_observed_result_not_rendered'),
    provider_timeout: countSubcode('provider_timeout'),
    settings_not_hydrated: countSubcode('settings_not_hydrated'),
    provider_disabled: countSubcode('provider_disabled'),
    missing_provider_key: countSubcode('missing_provider_key'),
    browser_context_closed: countSubcode('browser_context_closed'),
  };
  const lifecycleBreakdown = {
    noExecuteRequestStarted: journeyLog.filter((j) => j.executeRequestStarted === 0).length,
    executeStartedNoResponse: journeyLog.filter((j) => j.executeRequestStarted > 0 && j.executeResponseObserved === 0).length,
    executeResponseObserved: journeyLog.filter((j) => j.executeResponseObserved > 0).length,
    executeRequestFailed: journeyLog.filter((j) => j.executeRequestFailed > 0).length,
    responseObservedResultNotRendered: countSubcode('response_observed_result_not_rendered'),
  };
  const summary = {
    capturedAt: new Date().toISOString(),
    runStatus,
    provider: 'alibaba',
    model: 'qwen-plus',
    tranche: 'W140-T1 - UI Execution Lifecycle Diagnostic',
    flags: {
      NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR: true,
      NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP: true,
      NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY: true,
    },
    attemptedJourneys: journeyLog.length,
    acceptedWithReceipt,
    outcomeBreakdown,
    diagnosticBreakdown,
    lifecycleBreakdown,
    journeyLog,
  };

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W140 UI Execution Lifecycle Diagnostic - Alibaba',
    '',
    `**Run status:** ${runStatus}`,
    `**Captured:** ${summary.capturedAt}`,
    '**Provider:** alibaba / qwen-plus',
    '**Scope:** diagnostic only; no product runtime change',
    '',
    '## Journey Summary',
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| Attempted | ${summary.attemptedJourneys} |`,
    `| Accepted with receipt | ${acceptedWithReceipt} |`,
    `| No execute request started | ${lifecycleBreakdown.noExecuteRequestStarted} |`,
    `| Execute started no response | ${lifecycleBreakdown.executeStartedNoResponse} |`,
    `| Execute response observed | ${lifecycleBreakdown.executeResponseObserved} |`,
    `| Execute request failed | ${lifecycleBreakdown.executeRequestFailed} |`,
    '',
    '## Diagnostic Breakdown',
    '',
    '| Subcode | Count |',
    '|---|---:|',
    ...Object.entries(diagnosticBreakdown).map(([k, v]) => `| \`${k}\` | ${v} |`),
    '',
    '## Journey Log',
    '',
    '| # | Form | Outcome | Subcode | HTTP | Started | Response | Finished | Failed | Processing | Result | Elapsed |',
    '|---|---|---|---|---:|---:|---:|---:|---:|---|---|---:|',
    ...journeyLog.map((j, i) => {
      const processing = j.processingVisibleAtTimeout === null ? 'n/a' : String(j.processingVisibleAtTimeout);
      const result = j.exportNudgeVisibleAtTimeout === null ? 'n/a' : String(j.exportNudgeVisibleAtTimeout);
      return `| ${i + 1} | ${j.formType} | \`${j.outcome}\` | ${j.diagnosticSubcode ?? 'none'} | ${j.httpStatus ?? 'n/a'} | ${j.executeRequestStarted} | ${j.executeResponseObserved} | ${j.executeRequestFinished} | ${j.executeRequestFailed} | ${processing} | ${result} | ${j.elapsedMs} |`;
    }),
    '',
    '## Timeout Details',
    '',
    ...journeyLog
      .filter((j) => j.outcome === 'api_timeout' || j.outcome === 'ui_flow_error')
      .map((j, i) => [
        `### Failure ${i + 1}: ${j.formType}`,
        '',
        `- Subcode: \`${j.diagnosticSubcode ?? 'none'}\``,
        `- Detail: ${j.detail ?? 'n/a'}`,
        `- Alert: ${j.alertTextAtTimeout ?? 'n/a'}`,
        `- URL: ${j.windowLocationAtTimeout ?? 'n/a'}`,
        `- Page text snippet: ${j.pageTextSnippetAtTimeout ?? 'n/a'}`,
        `- Console: ${j.consoleMessages.length ? j.consoleMessages.join(' | ') : 'n/a'}`,
        `- Page errors: ${j.pageErrors.length ? j.pageErrors.join(' | ') : 'n/a'}`,
        '',
      ].join('\n')),
    '',
  ].join('\n');

  mkdirSync(dirname(ALIBABA_MD), { recursive: true });
  writeFileSync(ALIBABA_MD, md, 'utf8');
  writeFileSync(ALIBABA_JSON, JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

test.describe('W140-T1 - Alibaba UI execution lifecycle diagnostic', () => {
  test(
    'captures /api/execute lifecycle across 12 browser UI journeys',
    { tag: ['@live', '@w140', '@w140-alibaba'] },
    async ({ browser }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W140 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY alias');
      test.skip(!INTENT_FIRST_ENABLED, 'W140 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_LOOP_ENABLED, 'W140 requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W140 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');
      test.setTimeout(2_400_000);

      const journeyLog: JourneyRecord[] = [];

      for (const journey of JOURNEY_MATRIX) {
        const idx = journeyLog.length + 1;
        console.log(`[W140-alibaba] journey ${idx}/${JOURNEY_MATRIX.length}: ${journey.formType}`);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
          await setupAlibabaPage(page);
          await login(page);
          const result = await runUiJourney(page, journey);
          journeyLog.push(result);
          console.log(
            `[W140-alibaba] outcome=${result.outcome} subcode=${result.diagnosticSubcode ?? 'none'} http=${result.httpStatus ?? 'none'} started=${result.executeRequestStarted} response=${result.executeResponseObserved} finished=${result.executeRequestFinished} failed=${result.executeRequestFailed} elapsed=${result.elapsedMs}ms`,
          );
        } catch (err) {
          journeyLog.push({
            prompt: journey.prompt,
            formType: journey.formType,
            templateId: journey.templateId,
            outcome: 'ui_flow_error',
            diagnosticSubcode: 'browser_context_closed',
            provider: 'alibaba',
            model: 'qwen-plus',
            keyAliasPresent: HAS_ALIBABA_KEY,
            submitTimestampMs: Date.now(),
            elapsedMs: 0,
            httpStatus: null,
            responseBodySnippet: null,
            executeRequestStarted: 0,
            executeResponseObserved: 0,
            executeRequestFinished: 0,
            executeRequestFailed: 0,
            executeRequestFailureText: null,
            processingVisibleAtTimeout: null,
            completionBannerVisibleAtTimeout: null,
            exportNudgeVisibleAtTimeout: null,
            evidenceReceiptVisibleAtTimeout: null,
            dynamicFormVisibleAtTimeout: null,
            windowLocationAtTimeout: null,
            pageTextSnippetAtTimeout: null,
            alertTextAtTimeout: null,
            consoleMessages: [],
            pageErrors: [],
            receiptPresent: false,
            detail: String(err).slice(0, 200),
          });
          console.log(`[W140-alibaba] context crash: ${String(err).slice(0, 100)}`);
        } finally {
          await ctx.close().catch(() => {});
        }

        writeEvidence(journeyLog, 'in_progress');

        if (idx < JOURNEY_MATRIX.length) {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
        }
      }

      const summary = writeEvidence(journeyLog, 'complete');
      console.log('[W140-alibaba] attempted:', summary.attemptedJourneys);
      console.log('[W140-alibaba] accepted:', summary.acceptedWithReceipt);
      console.log('[W140-alibaba] lifecycle:', JSON.stringify(summary.lifecycleBreakdown));
      console.log('[W140-alibaba] diagnostics:', JSON.stringify(summary.diagnosticBreakdown));

      expect(summary.attemptedJourneys).toBeGreaterThanOrEqual(12);
      expect(summary.lifecycleBreakdown.noExecuteRequestStarted).toBeGreaterThanOrEqual(0);
    },
  );
});
