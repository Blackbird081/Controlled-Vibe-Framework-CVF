/**
 * W149-T1 - Trusted Form Full-Corpus Browser UI Live Matrix
 */

import { test, expect, type Page, type Request, type Response } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { getW149TrustedFormCorpus, type W149CorpusEntry } from './w149-trusted-form-corpus';

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
const UI_FILTER = (process.env.W149_UI_FILTER || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const EVIDENCE_MD = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_UI_ALIBABA_EVIDENCE_2026-05-08.md');
const EVIDENCE_JSON = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_UI_ALIBABA_EVIDENCE_2026-05-08.json');

type Outcome =
  | 'accepted_with_receipt'
  | 'accepted_missing_receipt'
  | 'route_miss'
  | 'api_timeout'
  | 'http_error'
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
  responseBody: string | null;
  receiptPresent: boolean;
  pageSnippet: string | null;
  detail?: string;
}

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

async function fillVisibleFields(page: Page, journey: W149CorpusEntry) {
  const form = page.locator('form').first();
  const allInputs = form.locator('input[type="text"]');
  const inputCount = await allInputs.count();
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    if (await input.isVisible().catch(() => false)) {
      const currentValue = await input.inputValue().catch(() => '');
      if (currentValue) continue;
      const name = await input.getAttribute('name').catch(() => null);
      await input.fill(name && journey.inputs[name] ? journey.inputs[name] : (i === 0 ? journey.topicValue : `W149 bổ sung ${i}`));
    }
  }

  const allTextareas = form.locator('textarea');
  const textareaCount = await allTextareas.count();
  for (let i = 0; i < textareaCount; i++) {
    const textarea = allTextareas.nth(i);
    if (await textarea.isVisible().catch(() => false)) {
      const currentValue = await textarea.inputValue().catch(() => '');
      if (currentValue) continue;
      const name = await textarea.getAttribute('name').catch(() => null);
      await textarea.fill(name && journey.inputs[name] ? journey.inputs[name] : `W149 ${journey.formType}: nội dung kiểm thử live có ngữ cảnh, tiêu chí thành công và ràng buộc.`);
    }
  }

  const allSelects = form.locator('select');
  const selectCount = await allSelects.count();
  for (let i = 0; i < selectCount; i++) {
    const select = allSelects.nth(i);
    if (await select.isVisible().catch(() => false)) {
      const currentValue = await select.inputValue().catch(() => '');
      if (currentValue) continue;
      const firstOption = await select.locator('option').evaluateAll((options) => {
        const usable = options
          .map((option) => (option as HTMLOptionElement).value)
          .find((value) => value && value.trim());
        return usable || '';
      }).catch(() => '');
      if (firstOption) await select.selectOption(firstOption);
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

async function runJourney(page: Page, journey: W149CorpusEntry): Promise<JourneyRecord> {
  const startedAt = Date.now();
  let httpStatus: number | null = null;
  let executeRequestStarted = 0;
  let executeResponseObserved = 0;
  let executeRequestFinished = 0;
  let executeRequestFailed = 0;
  let requestFailureText: string | null = null;
  let responseBody: string | null = null;
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
    responseBody,
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
    if (res.status() >= 400) {
      void res.text()
        .then((text) => {
          responseBody = compact(text, 1000);
        })
        .catch(() => {
          responseBody = null;
        });
    }
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
    await page.waitForTimeout(600);

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
    await page.waitForTimeout(500);

    const cta = page
      .locator('button')
      .filter({ hasText: /Bắt đầu với governed path|Start with governed path/i })
      .first();
    if (!await cta.isEnabled().catch(() => false)) {
      return record('route_miss', null, 'CTA disabled');
    }
    await cta.click();
    await page.waitForTimeout(350);

    const pageText = await page.locator('body').innerText({ timeout: 1_000 }).catch(() => '');
    const firstFormControl = page.locator('form').first().locator('input[type="text"], textarea, select').first();
    if (!await firstFormControl.isVisible().catch(() => false)) {
      const shadowedByWizard = /Wizard|System Design|Business Strategy|App Builder|Product Design|Security Assessment/.test(pageText);
      return record(
        'route_miss',
        shadowedByWizard ? 'wizard_routing_shadow' : null,
        shadowedByWizard ? 'Intent routed to wizard instead of trusted form' : 'DynamicForm not visible after CTA',
      );
    }

    await fillVisibleFields(page, journey);
    await submitCurrentForm(page);
    await page.waitForTimeout(500);

    const exportNudge = page.locator('[data-testid="noncoder-export-nudge"]');
    try {
      await exportNudge.waitFor({ state: 'visible', timeout: 100_000 });
    } catch {
      const subcode: Subcode =
        executeRequestStarted === 0
          ? 'execute_request_not_sent'
          : executeRequestFailed > 0
            ? 'execute_request_failed'
            : executeResponseObserved === 0
              ? 'execute_request_sent_no_response'
              : null;
      if (httpStatus && httpStatus >= 400) {
        return record('http_error', subcode, `HTTP ${httpStatus}: ${responseBody ?? 'body not captured'}`);
      }
      return record('api_timeout', subcode, 'Export nudge absent after 100s');
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
  const summary = {
    capturedAt: new Date().toISOString(),
    runStatus,
    provider: 'alibaba',
    model: 'qwen-plus',
    tranche: 'W149-T1 Trusted Form Full-Corpus Browser UI Matrix',
    attemptedJourneys: journeyLog.length,
    acceptedWithReceipt,
    outcomeBreakdown: {
      accepted_with_receipt: acceptedWithReceipt,
      accepted_missing_receipt: count('accepted_missing_receipt'),
      route_miss: count('route_miss'),
      api_timeout: count('api_timeout'),
      http_error: count('http_error'),
      ui_flow_error: count('ui_flow_error'),
    },
    diagnosticBreakdown: {
      execute_request_not_sent: countSubcode('execute_request_not_sent'),
      execute_request_sent_no_response: countSubcode('execute_request_sent_no_response'),
      execute_request_failed: countSubcode('execute_request_failed'),
      wizard_routing_shadow: countSubcode('wizard_routing_shadow'),
      settings_not_hydrated: countSubcode('settings_not_hydrated'),
      provider_disabled: countSubcode('provider_disabled'),
      missing_provider_key: countSubcode('missing_provider_key'),
    },
    journeyLog,
  };

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W149 Trusted Form UI Matrix - Alibaba',
    '',
    `**Run status:** ${runStatus}`,
    `**Captured:** ${summary.capturedAt}`,
    '**Provider:** alibaba / qwen-plus',
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| Attempted | ${summary.attemptedJourneys} |`,
    `| Accepted with receipt | ${acceptedWithReceipt} |`,
    `| Execute request not sent | ${summary.diagnosticBreakdown.execute_request_not_sent} |`,
    `| Wizard routing shadow | ${summary.diagnosticBreakdown.wizard_routing_shadow} |`,
    '',
    '| # | Form | Outcome | Subcode | HTTP | Started | Response | Finished | Failed | Elapsed |',
    '|---:|---|---|---|---:|---:|---:|---:|---:|---:|',
    ...journeyLog.map((j, index) =>
      `| ${index + 1} | \`${j.formType}\` | \`${j.outcome}\` | ${j.subcode ?? 'none'} | ${j.httpStatus ?? 'n/a'} | ${j.executeRequestStarted} | ${j.executeResponseObserved} | ${j.executeRequestFinished} | ${j.executeRequestFailed} | ${j.elapsedMs} |`,
    ),
    '',
  ].join('\n');

  mkdirSync(dirname(EVIDENCE_MD), { recursive: true });
  writeFileSync(EVIDENCE_MD, md, 'utf8');
  writeFileSync(EVIDENCE_JSON, JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}

test.describe('W149-T1 - trusted form full corpus UI matrix', () => {
  test(
    'CP3 Alibaba browser UI 40-form matrix',
    { tag: ['@live', '@w149-alibaba-ui'] },
    async ({ browser }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W149 UI matrix requires DashScope-compatible key');
      test.skip(!INTENT_FIRST_ENABLED, 'W149 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_LOOP_ENABLED, 'W149 requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W149 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');
      test.setTimeout(7_200_000);

      const allCorpus = getW149TrustedFormCorpus();
      const corpus = UI_FILTER.length
        ? allCorpus.filter((entry) => UI_FILTER.includes(entry.formType))
        : allCorpus;
      const isFullCorpusRun = corpus.length === allCorpus.length;
      const journeyLog: JourneyRecord[] = [];
      for (const journey of corpus) {
        const idx = journeyLog.length + 1;
        console.log(`[W149-ui-alibaba] journey ${idx}/${corpus.length}: ${journey.formType}`);

        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        try {
          await setupAlibabaPage(page);
          await login(page);
          const result = await runJourney(page, journey);
          journeyLog.push(result);
          console.log(
            `[W149-ui-alibaba] outcome=${result.outcome} subcode=${result.subcode ?? 'none'} http=${result.httpStatus ?? 'none'} started=${result.executeRequestStarted} response=${result.executeResponseObserved} elapsed=${result.elapsedMs}ms`,
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
            responseBody: null,
            receiptPresent: false,
            pageSnippet: null,
            detail: String(err).slice(0, 200),
          });
        } finally {
          await ctx.close().catch(() => {});
        }

        writeEvidence(journeyLog, 'in_progress');
        if (idx < corpus.length) {
          await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
        }
      }

      const summary = writeEvidence(journeyLog, 'complete');
      expect(summary.attemptedJourneys).toBe(corpus.length);
      if (isFullCorpusRun) {
        expect(summary.attemptedJourneys).toBe(40);
        expect(summary.acceptedWithReceipt).toBeGreaterThanOrEqual(34);
        expect(summary.diagnosticBreakdown.execute_request_not_sent).toBeLessThanOrEqual(1);
        expect(summary.diagnosticBreakdown.wizard_routing_shadow).toBe(0);
      }
    },
  );
});
