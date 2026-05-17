/**
 * W149-T1 - Trusted Form Full-Corpus Direct API Live Matrix
 */

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { routeToTrustedForm, TRUSTED_FORM_MAP } from '../../src/lib/form-routing';
import { getW149TrustedFormCorpus, W149_DEEPSEEK_SUBSET, type W149CorpusEntry } from './w149-trusted-form-corpus';
import { loginAs } from './utils';

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);
const HAS_DEEPSEEK_KEY = !!process.env.DEEPSEEK_API_KEY;

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const ALIBABA_JSON = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_DIRECT_API_ALIBABA_EVIDENCE_2026-05-08.json');
const ALIBABA_MD = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_DIRECT_API_ALIBABA_EVIDENCE_2026-05-08.md');
const DEEPSEEK_JSON = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_DEEPSEEK_CONFIRMATORY_EVIDENCE_2026-05-08.json');
const DEEPSEEK_MD = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_DEEPSEEK_CONFIRMATORY_EVIDENCE_2026-05-08.md');
const CORPUS_LOCK = resolve(EVIDENCE_ROOT, 'CVF_W149_TRUSTED_FORM_FULL_CORPUS_LOCK_2026-05-08.md');

type ProviderKey = 'alibaba' | 'deepseek';
type Diagnostic = 'accepted' | 'http_error' | 'provider_error' | 'route_timeout' | 'receipt_missing';

type DirectRecord = {
  formType: string;
  templateId: string;
  expectedRouteId: string | null;
  httpStatus: number;
  success: boolean;
  receiptPresent: boolean;
  receiptDecision: string | null;
  outputValidationIssues: string[];
  outputValidationHint: string | null;
  retryAttempts: number;
  outputLength: number;
  usefulByHeuristic: boolean;
  elapsedMs: number;
  diagnostic: Diagnostic;
  error: string | null;
};

function compact(value: unknown, max = 240) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function writeCorpusLock(corpus: W149CorpusEntry[]) {
  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W149 Trusted Form Full Corpus Lock',
    '',
    `**Captured:** ${new Date().toISOString()}`,
    `**Trusted forms:** ${corpus.length}`,
    '',
    '| # | Form | Template | Prompt | Required inputs |',
    '|---:|---|---|---|---:|',
    ...corpus.map((entry, index) =>
      `| ${index + 1} | \`${entry.formType}\` | ${entry.templateName} | ${entry.prompt} | ${Object.keys(entry.inputs).filter((k) => !k.startsWith('_')).length} |`,
    ),
    '',
    'Boundary: W149 locks the existing trusted-form corpus. It does not add new templates.',
    '',
  ].join('\n');

  mkdirSync(dirname(CORPUS_LOCK), { recursive: true });
  writeFileSync(CORPUS_LOCK, md, 'utf8');
}

function writeEvidence(providerKey: ProviderKey, records: DirectRecord[], status: 'in_progress' | 'complete') {
  const jsonPath = providerKey === 'alibaba' ? ALIBABA_JSON : DEEPSEEK_JSON;
  const mdPath = providerKey === 'alibaba' ? ALIBABA_MD : DEEPSEEK_MD;
  const accepted = records.filter((r) => r.diagnostic === 'accepted').length;
  const useful = records.filter((r) => r.usefulByHeuristic).length;
  const summary = {
    capturedAt: new Date().toISOString(),
    tranche: 'W149-T1 Trusted Form Full-Corpus Live Value Gate',
    status,
    provider: providerKey,
    model: providerKey === 'alibaba' ? 'qwen-plus' : 'deepseek-chat',
    attempted: records.length,
    accepted,
    usefulByHeuristic: useful,
    diagnostics: records.reduce<Record<string, number>>((acc, r) => {
      acc[r.diagnostic] = (acc[r.diagnostic] ?? 0) + 1;
      return acc;
    }, {}),
    records,
  };

  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');
  writeFileSync(mdPath, [
    '<!-- Memory class: FULL_RECORD -->',
    `# CVF W149 Trusted Form Direct API - ${providerKey}`,
    '',
    `**Status:** ${status}`,
    `**Captured:** ${summary.capturedAt}`,
    `**Provider:** ${providerKey}`,
    `**Model:** ${summary.model}`,
    `**Attempted:** ${summary.attempted}`,
    `**Accepted:** ${summary.accepted}`,
    `**Useful by heuristic:** ${summary.usefulByHeuristic}`,
    '',
    '| # | Form | HTTP | Diagnostic | Receipt | Output chars | Issues | Elapsed |',
    '|---:|---|---:|---|---|---:|---|---:|',
    ...records.map((r, i) =>
      `| ${i + 1} | \`${r.formType}\` | ${r.httpStatus} | \`${r.diagnostic}\` | ${r.receiptDecision ?? 'n/a'} | ${r.outputLength} | ${JSON.stringify(r.outputValidationIssues)} | ${r.elapsedMs}ms |`,
    ),
    '',
  ].join('\n'), 'utf8');

  return summary;
}

async function runDirectJourney(
  page: import('@playwright/test').Page,
  providerKey: ProviderKey,
  journey: W149CorpusEntry,
): Promise<DirectRecord> {
  const startedAt = Date.now();
  const routeMatch = routeToTrustedForm(journey.prompt);
  try {
    const response = await page.request.post('/api/execute', {
      timeout: 120_000,
      data: {
        templateId: journey.templateId,
        templateName: journey.templateName,
        intent: journey.prompt,
        inputs: journey.inputs,
        provider: providerKey,
        model: providerKey === 'alibaba' ? 'qwen-plus' : 'deepseek-chat',
        mode: 'governance',
        action: 'analyze template execution request',
      },
    });
    const body = await response.json().catch(() => ({}));
    const output = typeof body.output === 'string' ? body.output : '';
    const success = body.success === true;
    const receiptPresent = !!body.governanceEvidenceReceipt;
    const diagnostic: Diagnostic =
      success && receiptPresent
        ? 'accepted'
        : response.status() >= 500 || body.providerRouting?.decision === 'DENY'
          ? 'provider_error'
          : !receiptPresent
            ? 'receipt_missing'
            : 'http_error';

    return {
      formType: journey.formType,
      templateId: journey.templateId,
      expectedRouteId: routeMatch?.id ?? null,
      httpStatus: response.status(),
      success,
      receiptPresent,
      receiptDecision: body.governanceEvidenceReceipt?.decision ?? null,
      outputValidationIssues: body.outputValidation?.issues ?? [],
      outputValidationHint: body.outputValidation?.qualityHint ?? null,
      retryAttempts: body.outputValidation?.retryAttempts ?? 0,
      outputLength: output.length,
      usefulByHeuristic: success && receiptPresent && output.length >= 300 && (body.outputValidation?.decision ?? 'PASS') !== 'RETRY',
      elapsedMs: Date.now() - startedAt,
      diagnostic,
      error: compact(body.error),
    };
  } catch (err) {
    return {
      formType: journey.formType,
      templateId: journey.templateId,
      expectedRouteId: routeMatch?.id ?? null,
      httpStatus: 0,
      success: false,
      receiptPresent: false,
      receiptDecision: null,
      outputValidationIssues: [],
      outputValidationHint: null,
      retryAttempts: 0,
      outputLength: 0,
      usefulByHeuristic: false,
      elapsedMs: Date.now() - startedAt,
      diagnostic: 'route_timeout',
      error: compact(err),
    };
  }
}

test.describe('W149-T1 - trusted form full corpus direct API', () => {
  test('CP1 corpus lock has exactly 40 entries and prompts route to expected forms', () => {
    const corpus = getW149TrustedFormCorpus();
    writeCorpusLock(corpus);

    expect(Object.keys(TRUSTED_FORM_MAP)).toHaveLength(40);
    expect(corpus).toHaveLength(40);
    for (const entry of corpus) {
      expect(routeToTrustedForm(entry.prompt)?.id, entry.formType).toBe(entry.templateId);
      expect(Object.keys(entry.inputs).filter((key) => !key.startsWith('_')).length, entry.formType).toBeGreaterThan(0);
    }
  });

  test('CP2 Alibaba direct API 40-form matrix', { tag: ['@live', '@w149-alibaba-direct'] }, async ({ page }) => {
    test.skip(!HAS_ALIBABA_KEY, 'W149 Alibaba direct matrix requires DashScope-compatible key');
    test.setTimeout(5_400_000);

    const corpus = getW149TrustedFormCorpus();
    writeCorpusLock(corpus);
    await loginAs(page, 'admin', 'admin123');

    const records: DirectRecord[] = [];
    for (const journey of corpus) {
      console.log(`[W149-direct-alibaba] ${records.length + 1}/${corpus.length}: ${journey.formType}`);
      const result = await runDirectJourney(page, 'alibaba', journey);
      records.push(result);
      console.log(`[W149-direct-alibaba] outcome=${result.diagnostic} http=${result.httpStatus} receipt=${result.receiptDecision ?? 'none'} elapsed=${result.elapsedMs}ms`);
      writeEvidence('alibaba', records, 'in_progress');
      await page.waitForTimeout(1500);
    }

    const summary = writeEvidence('alibaba', records, 'complete');
    expect(summary.attempted).toBe(40);
    expect(summary.accepted).toBeGreaterThanOrEqual(34);
    expect(summary.usefulByHeuristic).toBeGreaterThanOrEqual(30);
  });

  test('CP5 DeepSeek 12-form confirmatory subset', { tag: ['@live', '@w149-deepseek'] }, async ({ page }) => {
    test.skip(!HAS_DEEPSEEK_KEY, 'W149 DeepSeek confirmatory requires DEEPSEEK_API_KEY');
    test.setTimeout(1_800_000);

    const corpus = getW149TrustedFormCorpus().filter((entry) =>
      (W149_DEEPSEEK_SUBSET as readonly string[]).includes(entry.formType),
    );
    await loginAs(page, 'admin', 'admin123');

    const records: DirectRecord[] = [];
    for (const journey of corpus) {
      console.log(`[W149-direct-deepseek] ${records.length + 1}/${corpus.length}: ${journey.formType}`);
      const result = await runDirectJourney(page, 'deepseek', journey);
      records.push(result);
      writeEvidence('deepseek', records, 'in_progress');
      await page.waitForTimeout(1500);
    }

    const summary = writeEvidence('deepseek', records, 'complete');
    expect(summary.attempted).toBe(12);
    expect(summary.accepted).toBeGreaterThanOrEqual(8);
  });
});
