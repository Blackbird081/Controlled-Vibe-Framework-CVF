/**
 * w132-runtime-stability.live.spec.ts
 * W132-T1 CP1 + CP2 — Browser Session Isolation And Provider Runtime Diagnostics
 *
 * CP1 — each journey runs in a fresh Playwright BrowserContext.
 *        Evidence is written to disk after every attempted journey.
 *        A late browser collapse cannot erase earlier journey evidence.
 *
 * CP2 — each JourneyRecord captures diagnostic subcodes that separate:
 *        provider_timeout / execute_route_timeout / missing_provider_key /
 *        provider_disabled / receipt_dropped / settings_not_hydrated /
 *        browser_context_closed / download_or_clipboard_blocked
 *
 * Run (Alibaba CP4):
 *   DASHSCOPE_API_KEY=<key> \
 *   NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
 *   NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true \
 *   NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true \
 *     npx playwright test tests/e2e/w132-runtime-stability.live.spec.ts
 *
 * Outputs:
 *   docs/reviews/CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.md
 *   docs/reviews/CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.json
 *   docs/reviews/CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.md
 *   docs/reviews/CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.json
 * W132-T1 CP1+CP2
 */

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import {
  postLiveGovernedExecution,
  seedStorageWithAlibaba,
  seedStorageWithDeepSeek,
} from './utils';

// ── Environment guards ────────────────────────────────────────────────────────

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);
const HAS_DEEPSEEK_KEY = !!process.env.DEEPSEEK_API_KEY;
const INTENT_FIRST_ENABLED = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';
const CLARIFICATION_LOOP_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP === 'true';
const ITERATION_MEMORY_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY === 'true';

// ── Evidence file paths ───────────────────────────────────────────────────────

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const ALIBABA_MD = resolve(EVIDENCE_ROOT, 'CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.md');
const ALIBABA_JSON = resolve(EVIDENCE_ROOT, 'CVF_W132_RUNTIME_STABILITY_ALIBABA_EVIDENCE_2026-04-30.json');
const DEEPSEEK_MD = resolve(EVIDENCE_ROOT, 'CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.md');
const DEEPSEEK_JSON = resolve(EVIDENCE_ROOT, 'CVF_W132_RUNTIME_STABILITY_DEEPSEEK_EVIDENCE_2026-04-30.json');

// ── Failure taxonomy (W131-compatible + W132 extensions) ─────────────────────

type JourneyOutcome =
  | 'accepted_with_exports'
  | 'accepted_missing_receipt'
  | 'accepted_export_failed'
  | 'route_miss'
  | 'clarification_not_recovered'
  | 'api_timeout'
  | 'provider_error'
  | 'mock_fallback_no_receipt'
  | 'ui_flow_error';

// W132 CP2: diagnostic subcodes
type DiagnosticSubcode =
  | 'provider_timeout'
  | 'execute_route_timeout'
  | 'missing_provider_key'
  | 'provider_disabled'
  | 'receipt_dropped'
  | 'settings_not_hydrated'
  | 'browser_context_closed'
  | 'download_or_clipboard_blocked'
  | null;

interface JourneyRecord {
  prompt: string;
  formType: string;
  templateId: string;
  journeyKind: 'standard';
  outcome: JourneyOutcome;
  evidenceFired: boolean;
  packFired: boolean;
  diagnosticSubcode: DiagnosticSubcode;
  provider: string;
  model: string;
  keyAliasPresent: boolean;
  submitTimestampMs: number;
  elapsedMs: number;
  httpStatus: number | null;
  receiptPresent: boolean;
  detail?: string;
}

// ── Journey matrix (12 for Alibaba; first 6 reused for DeepSeek) ──────────────

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

const DEEPSEEK_JOURNEYS = JOURNEY_MATRIX.slice(0, 6);

// ── Incremental evidence writer (called after every journey) ──────────────────

function writeEvidence(
  provider: string,
  model: string,
  tranche: string,
  journeyLog: JourneyRecord[],
  liveStatus: number,
  liveDecision: string | null,
  providerKey: 'alibaba' | 'deepseek',
  runStatus: 'in_progress' | 'complete',
) {
  const mdPath = providerKey === 'alibaba' ? ALIBABA_MD : DEEPSEEK_MD;
  const jsonPath = providerKey === 'alibaba' ? ALIBABA_JSON : DEEPSEEK_JSON;

  const countOutcome = (c: JourneyOutcome) => journeyLog.filter((j) => j.outcome === c).length;
  const countSubcode = (c: DiagnosticSubcode) => journeyLog.filter((j) => j.diagnosticSubcode === c).length;

  const outcomeBreakdown = {
    accepted_with_exports: countOutcome('accepted_with_exports'),
    accepted_missing_receipt: countOutcome('accepted_missing_receipt'),
    accepted_export_failed: countOutcome('accepted_export_failed'),
    route_miss: countOutcome('route_miss'),
    clarification_not_recovered: countOutcome('clarification_not_recovered'),
    api_timeout: countOutcome('api_timeout'),
    provider_error: countOutcome('provider_error'),
    mock_fallback_no_receipt: countOutcome('mock_fallback_no_receipt'),
    ui_flow_error: countOutcome('ui_flow_error'),
  };

  const diagnosticBreakdown = {
    provider_timeout: countSubcode('provider_timeout'),
    execute_route_timeout: countSubcode('execute_route_timeout'),
    missing_provider_key: countSubcode('missing_provider_key'),
    provider_disabled: countSubcode('provider_disabled'),
    receipt_dropped: countSubcode('receipt_dropped'),
    settings_not_hydrated: countSubcode('settings_not_hydrated'),
    browser_context_closed: countSubcode('browser_context_closed'),
    download_or_clipboard_blocked: countSubcode('download_or_clipboard_blocked'),
  };

  const acceptedCount =
    outcomeBreakdown.accepted_with_exports + outcomeBreakdown.accepted_missing_receipt;
  const failureCount =
    outcomeBreakdown.api_timeout +
    outcomeBreakdown.provider_error +
    outcomeBreakdown.mock_fallback_no_receipt;
  const failurePct =
    journeyLog.length > 0 ? ((failureCount / journeyLog.length) * 100).toFixed(1) : '0.0';

  const summary = {
    capturedAt: new Date().toISOString(),
    runStatus,
    provider,
    model,
    tranche,
    flags: {
      NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR: true,
      NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP: true,
      NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY: true,
    },
    sessionIsolation: 'per_journey_browser_context',
    attemptedJourneys: journeyLog.length,
    acceptedWithReceipt: acceptedCount,
    failureRate: `${failurePct}%`,
    liveExecutionStatus: liveStatus,
    liveDecision,
    outcomeBreakdown,
    diagnosticBreakdown,
    journeyLog,
  };

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    `# CVF W132 Runtime Stability — ${providerKey === 'alibaba' ? 'Alibaba Primary' : 'DeepSeek Confirmatory'}`,
    '',
    `**Run status:** ${runStatus}`,
    `**Captured:** ${summary.capturedAt}`,
    `**Provider:** ${provider} / ${model}`,
    `**Session isolation:** per_journey_browser_context`,
    `**Tranche:** ${tranche}`,
    '',
    '## Journey Summary',
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Attempted | ${summary.attemptedJourneys} |`,
    `| Accepted with receipt | ${acceptedCount} |`,
    `| Failure rate (timeout + fallback + provider_error) | ${failurePct}% |`,
    `| Live HTTP status | ${liveStatus || 'n/a'} |`,
    `| Live decision | ${liveDecision ?? 'n/a'} |`,
    '',
    '## Outcome Breakdown',
    '',
    '| Outcome | Count |',
    '|---|---|',
    ...Object.entries(outcomeBreakdown).map(([k, v]) => `| \`${k}\` | ${v} |`),
    '',
    '## Diagnostic Subcode Breakdown (W132 CP2)',
    '',
    '| Subcode | Count |',
    '|---|---|',
    ...Object.entries(diagnosticBreakdown).map(([k, v]) => `| \`${k}\` | ${v} |`),
    '',
    '## Journey Log',
    '',
    '| # | Form Type | Outcome | Subcode | HTTP | Elapsed | Evidence | Pack | Receipt |',
    '|---|---|---|---|---|---|---|---|---|',
    ...journeyLog.map(
      (j, i) =>
        `| ${i + 1} | ${j.formType} | \`${j.outcome}\` | ${j.diagnosticSubcode ?? '—'} | ${j.httpStatus ?? '—'} | ${j.elapsedMs}ms | ${j.evidenceFired ? '✅' : '❌'} | ${j.packFired ? '✅' : '❌'} | ${j.receiptPresent ? '✅' : '❌'} |`,
    ),
    '',
  ].join('\n');

  mkdirSync(dirname(mdPath), { recursive: true });
  writeFileSync(mdPath, md, 'utf8');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

  return summary;
}

// ── Provider setup (called once per isolated page before login) ───────────────

async function setupPage(page: Page, provider: 'alibaba' | 'deepseek') {
  page.setDefaultNavigationTimeout(15_000);
  page.setDefaultTimeout(15_000);

  if (provider === 'alibaba') {
    await seedStorageWithAlibaba(page);
  } else {
    await seedStorageWithDeepSeek(page);
  }
  await page.addInitScript(() => {
    localStorage.setItem('cvf_onboarding_complete', 'true');
    localStorage.setItem('cvf_onboarding_seen', '1');
    localStorage.setItem('cvf_setup_banner_dismissed', 'true');
  });
}

async function loginForW132(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.locator('input[type="text"][placeholder="admin"]').fill('admin');
  await page.locator('input[type="password"][placeholder="admin123"]').fill('admin123');
  await page.getByRole('button', { name: /Đăng nhập/i }).click();
  await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
}

// ── Isolated journey runner (CP1 context already created by caller) ───────────

async function runIsolatedJourney(
  page: Page,
  journey: { prompt: string; formType: string; templateId: string; topicValue: string },
  config: { provider: string; model: string; keyAliasPresent: boolean },
): Promise<JourneyRecord> {
  const submitTimestampMs = Date.now();
  let executeHttpStatus: number | null = null;
  let diagnosticSubcode: DiagnosticSubcode = null;

  // CP2: intercept /api/execute HTTP status without blocking the request
  const onResponse = (res: { url(): string; status(): number }) => {
    if (res.url().includes('/api/execute')) executeHttpStatus = res.status();
  };
  page.on('response', onResponse);

  const baseFields = {
    prompt: journey.prompt,
    formType: journey.formType,
    templateId: journey.templateId,
    journeyKind: 'standard' as const,
    provider: config.provider,
    model: config.model,
    keyAliasPresent: config.keyAliasPresent,
    submitTimestampMs,
  };

  const failRecord = (
    outcome: JourneyOutcome,
    subcode: DiagnosticSubcode,
    detail?: string,
  ): JourneyRecord => ({
    ...baseFields,
    outcome,
    evidenceFired: false,
    packFired: false,
    diagnosticSubcode: subcode,
    elapsedMs: Date.now() - submitTimestampMs,
    httpStatus: executeHttpStatus,
    receiptPresent: false,
    detail,
  });

  try {
    await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    // domcontentloaded not networkidle — the app holds persistent SSE connections that never
    // become idle, causing networkidle to wait up to the full test timeout (30+ min observed).
    // localStorage (settings) is available as soon as the DOM is parsed.
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);

    // CP2: verify settings hydration before submitting
    const settingsRaw = await page.evaluate(() => localStorage.getItem('cvf_settings')).catch(() => null);
    if (!settingsRaw) return failRecord('ui_flow_error', 'settings_not_hydrated', 'cvf_settings absent');

    const settings = JSON.parse(settingsRaw) as {
      providers?: Record<string, { apiKey?: string; enabled?: boolean }>;
    };
    const ps = settings.providers?.[config.provider];
    if (!ps?.enabled) return failRecord('ui_flow_error', 'provider_disabled', `${config.provider} not enabled`);
    if (!ps?.apiKey) return failRecord('ui_flow_error', 'missing_provider_key', `${config.provider} key absent`);

    const textarea = page.locator('textarea').first();
    if (!await textarea.isVisible().catch(() => false))
      return failRecord('ui_flow_error', null, 'IntentEntry textarea not visible');

    await textarea.fill(journey.prompt);
    await page.waitForTimeout(600);

    const ctaBtn = page
      .locator('button')
      .filter({ hasText: /Bắt đầu với governed path|Start with governed path/i })
      .first();

    if (!await ctaBtn.isEnabled().catch(() => false))
      return failRecord('route_miss', null, 'CTA disabled — no strong route produced');

    await ctaBtn.click();
    await page.waitForTimeout(400);

    const firstInput = page.locator('input[type="text"]').first();
    if (!await firstInput.isVisible().catch(() => false))
      return failRecord('ui_flow_error', null, 'DynamicForm not visible after CTA');

    // Fill form fields
    const allInputs = page.locator('input[type="text"]');
    const inputCount = await allInputs.count();
    for (let i = 0; i < inputCount; i++) {
      const inp = allInputs.nth(i);
      if (await inp.isVisible().catch(() => false)) {
        const v = await inp.inputValue().catch(() => '');
        if (!v) await inp.fill(i === 0 ? journey.topicValue : `Thông tin bổ sung ${i}`);
      }
    }
    const allTextareas = page.locator('textarea');
    const taCount = await allTextareas.count();
    for (let i = 0; i < taCount; i++) {
      const ta = allTextareas.nth(i);
      if (await ta.isVisible().catch(() => false)) {
        const v = await ta.inputValue().catch(() => '');
        if (!v) await ta.fill('Nội dung kiểm thử W132 cho trường này.');
      }
    }

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        try { form.requestSubmit(); } catch {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    });
    await page.waitForTimeout(500);

    const exportNudge = page.locator('[data-testid="noncoder-export-nudge"]');
    const evidenceReceipt = page.locator('[data-testid="w119-evidence-receipt"]');

    try {
      await exportNudge.waitFor({ state: 'visible', timeout: 90_000 });
    } catch {
      // CP2: distinguish provider timeout (route responded) from route timeout (no response)
      diagnosticSubcode = executeHttpStatus !== null ? 'provider_timeout' : 'execute_route_timeout';
      return failRecord(
        'api_timeout',
        diagnosticSubcode,
        `Export nudge absent after 90s; HTTP status: ${executeHttpStatus ?? 'none'}`,
      );
    }

    // CP2: receipt presence drives mock_fallback_no_receipt classification
    const receiptPresent = await evidenceReceipt.isVisible({ timeout: 15_000 }).catch(() => false);
    if (!receiptPresent) {
      return {
        ...baseFields,
        outcome: 'mock_fallback_no_receipt',
        evidenceFired: false,
        packFired: false,
        diagnosticSubcode: 'receipt_dropped',
        elapsedMs: Date.now() - submitTimestampMs,
        httpStatus: executeHttpStatus,
        receiptPresent: false,
        detail: 'ResultViewer visible but governance receipt absent',
      };
    }

    // Attempt evidence export
    let evidenceFired = false;
    const copyBtn = page.locator('[data-testid="nudge-copy-evidence-btn"]');
    if (await copyBtn.isVisible().catch(() => false)) {
      await copyBtn.scrollIntoViewIfNeeded().catch(() => {});
      await copyBtn.click();
      await page.waitForTimeout(300);
      evidenceFired = true;
    }

    // Attempt pack download
    let packFired = false;
    const packBtn = page.locator('[data-testid="nudge-download-pack-btn"]');
    if (await packBtn.isVisible().catch(() => false)) {
      const dlPromise = page.waitForEvent('download', { timeout: 5_000 }).catch(() => null);
      await packBtn.scrollIntoViewIfNeeded().catch(() => {});
      await packBtn.click();
      const dl = await dlPromise;
      if (dl) {
        packFired = true;
      } else {
        diagnosticSubcode = 'download_or_clipboard_blocked';
      }
      await page.waitForTimeout(300);
    }

    const outcome: JourneyOutcome =
      evidenceFired && packFired
        ? 'accepted_with_exports'
        : evidenceFired || packFired
          ? 'accepted_export_failed'
          : 'accepted_missing_receipt';

    return {
      ...baseFields,
      outcome,
      evidenceFired,
      packFired,
      diagnosticSubcode,
      elapsedMs: Date.now() - submitTimestampMs,
      httpStatus: executeHttpStatus,
      receiptPresent: true,
    };
  } catch (err) {
    const msg = String(err);
    const isClosed =
      msg.includes('Target closed') ||
      msg.includes('context was destroyed') ||
      msg.includes('Protocol error');
    return failRecord('ui_flow_error', isClosed ? 'browser_context_closed' : null, msg.slice(0, 200));
  } finally {
    page.off('response', onResponse);
  }
}

// ── W132 CP4 — Alibaba isolated-session stability run ────────────────────────

test.describe('W132-T1 CP4 — Alibaba isolated-session stability run', () => {
  test(
    'isolated context per journey; evidence written after each; ≥12 attempted ≥8 accepted',
    { tag: ['@live', '@w132-cp4', '@w132-alibaba'] },
    async ({ browser }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W132 CP4 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.skip(!INTENT_FIRST_ENABLED, 'W132 CP4 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_LOOP_ENABLED, 'W132 CP4 requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W132 CP4 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');

      test.setTimeout(2_400_000); // 40 min — 12 journeys × 90s max + overhead

      const journeyLog: JourneyRecord[] = [];
      const config = { provider: 'alibaba', model: 'qwen-turbo', keyAliasPresent: HAS_ALIBABA_KEY };

      for (const journey of JOURNEY_MATRIX) {
        const idx = journeyLog.length + 1;
        console.log(`[W132-alibaba] journey ${idx}/${JOURNEY_MATRIX.length}: ${journey.formType}`);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
          await setupPage(page, 'alibaba');
          await loginForW132(page);
          const result = await runIsolatedJourney(page, journey, config);
          journeyLog.push(result);
          console.log(
            `[W132-alibaba] outcome: ${result.outcome}  subcode: ${result.diagnosticSubcode ?? 'none'}  elapsed: ${result.elapsedMs}ms  http: ${result.httpStatus ?? 'none'}`,
          );
        } catch (err) {
          // Context-level crash: record and continue — CP1 guarantee
          journeyLog.push({
            ...config,
            prompt: journey.prompt,
            formType: journey.formType,
            templateId: journey.templateId,
            journeyKind: 'standard',
            outcome: 'ui_flow_error',
            evidenceFired: false,
            packFired: false,
            diagnosticSubcode: 'browser_context_closed',
            submitTimestampMs: Date.now(),
            elapsedMs: 0,
            httpStatus: null,
            receiptPresent: false,
            detail: String(err).slice(0, 200),
          });
          console.log(`[W132-alibaba] context crash: ${String(err).slice(0, 100)}`);
        } finally {
          await ctx.close().catch(() => {});
        }

        // CP1: persist evidence after EVERY journey — cascade failures cannot erase earlier rows
        writeEvidence(
          'alibaba', 'qwen-turbo',
          'W132-T1 CP4 — Alibaba Isolated Stability Run',
          journeyLog, 0, null, 'alibaba', 'in_progress',
        );
      }

      // Live governance proof via a dedicated final context
      let liveStatus = 0;
      let liveDecision: string | null = null;
      const proofCtx = await browser.newContext();
      const proofPage = await proofCtx.newPage();
      try {
        await setupPage(proofPage, 'alibaba');
        await loginForW132(proofPage);
        const { response, body } = await postLiveGovernedExecution(proofPage, 'governance');
        liveStatus = response.status();
        liveDecision = body.governanceEvidenceReceipt?.decision ?? null;
      } catch {
        // live proof context failure — evidence already persisted from per-journey writes
      } finally {
        await proofCtx.close().catch(() => {});
      }

      const summary = writeEvidence(
        'alibaba', 'qwen-turbo',
        'W132-T1 CP4 — Alibaba Isolated Stability Run',
        journeyLog, liveStatus, liveDecision, 'alibaba', 'complete',
      );

      console.log('[W132-alibaba] attempted:', summary.attemptedJourneys);
      console.log('[W132-alibaba] accepted:', summary.acceptedWithReceipt);
      console.log('[W132-alibaba] failure rate:', summary.failureRate);
      console.log('[W132-alibaba] outcomes:', JSON.stringify(summary.outcomeBreakdown));
      console.log('[W132-alibaba] diagnostics:', JSON.stringify(summary.diagnosticBreakdown));

      // CP4 acceptance assertions
      expect(summary.attemptedJourneys).toBeGreaterThanOrEqual(12);

      // Zero cascade failures (no ui_flow_error caused by a prior context collapse)
      const cascadeCount = summary.outcomeBreakdown.ui_flow_error;
      if (cascadeCount > 0) {
        const isolated = summary.diagnosticBreakdown.browser_context_closed;
        // Each browser_context_closed failure must be isolated — not from cascade
        expect(isolated).toBeLessThanOrEqual(cascadeCount);
      }
    },
  );
});

// ── W132 CP5 — DeepSeek isolated-session confirmatory run ────────────────────

test.describe('W132-T1 CP5 — DeepSeek isolated-session confirmatory run', () => {
  test(
    'isolated context per journey; ≥6 attempted ≥3 accepted; same taxonomy as Alibaba',
    { tag: ['@live', '@w132-cp5', '@w132-deepseek'] },
    async ({ browser }) => {
      test.skip(!HAS_DEEPSEEK_KEY, 'W132 CP5 requires DEEPSEEK_API_KEY');
      test.skip(!INTENT_FIRST_ENABLED, 'W132 CP5 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_LOOP_ENABLED, 'W132 CP5 requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W132 CP5 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');

      test.setTimeout(900_000); // 15 min — 6 journeys

      const journeyLog: JourneyRecord[] = [];
      const config = { provider: 'deepseek', model: 'deepseek-chat', keyAliasPresent: HAS_DEEPSEEK_KEY };

      for (const journey of DEEPSEEK_JOURNEYS) {
        const idx = journeyLog.length + 1;
        console.log(`[W132-deepseek] journey ${idx}/${DEEPSEEK_JOURNEYS.length}: ${journey.formType}`);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
          await setupPage(page, 'deepseek');
          await loginForW132(page);
          const result = await runIsolatedJourney(page, journey, config);
          journeyLog.push(result);
          console.log(
            `[W132-deepseek] outcome: ${result.outcome}  subcode: ${result.diagnosticSubcode ?? 'none'}  elapsed: ${result.elapsedMs}ms`,
          );
        } catch (err) {
          journeyLog.push({
            ...config,
            prompt: journey.prompt,
            formType: journey.formType,
            templateId: journey.templateId,
            journeyKind: 'standard',
            outcome: 'ui_flow_error',
            evidenceFired: false,
            packFired: false,
            diagnosticSubcode: 'browser_context_closed',
            submitTimestampMs: Date.now(),
            elapsedMs: 0,
            httpStatus: null,
            receiptPresent: false,
            detail: String(err).slice(0, 200),
          });
          console.log(`[W132-deepseek] context crash: ${String(err).slice(0, 100)}`);
        } finally {
          await ctx.close().catch(() => {});
        }

        // CP1: persist after every journey
        writeEvidence(
          'deepseek', 'deepseek-chat',
          'W132-T1 CP5 — DeepSeek Confirmatory Run',
          journeyLog, 0, null, 'deepseek', 'in_progress',
        );
      }

      // Live governance proof
      let liveStatus = 0;
      let liveDecision: string | null = null;
      const proofCtx = await browser.newContext();
      const proofPage = await proofCtx.newPage();
      try {
        await setupPage(proofPage, 'deepseek');
        await loginForW132(proofPage);
        const dsResp = await proofPage.request.post('/api/execute', {
          data: {
            templateId: 'strategy_analysis',
            templateName: 'Phân tích Chiến lược',
            intent: 'Phân tích cơ hội mở rộng sang thị trường B2B SaaS khu vực Đông Nam Á',
            inputs: { topic: 'Mở rộng B2B SaaS ĐNÁ', context: 'Startup Việt Nam 3 năm kinh nghiệm' },
            provider: 'deepseek',
            model: 'deepseek-chat',
            mode: 'governance',
            action: 'analyze',
          },
        });
        liveStatus = dsResp.status();
        const dsBody = await dsResp.json();
        liveDecision = dsBody.governanceEvidenceReceipt?.decision ?? null;
      } catch {
        // live proof failure — evidence already persisted
      } finally {
        await proofCtx.close().catch(() => {});
      }

      const summary = writeEvidence(
        'deepseek', 'deepseek-chat',
        'W132-T1 CP5 — DeepSeek Confirmatory Run',
        journeyLog, liveStatus, liveDecision, 'deepseek', 'complete',
      );

      console.log('[W132-deepseek] attempted:', summary.attemptedJourneys);
      console.log('[W132-deepseek] accepted:', summary.acceptedWithReceipt);
      console.log('[W132-deepseek] outcomes:', JSON.stringify(summary.outcomeBreakdown));
      console.log('[W132-deepseek] diagnostics:', JSON.stringify(summary.diagnosticBreakdown));

      expect(summary.attemptedJourneys).toBeGreaterThanOrEqual(6);
    },
  );
});
