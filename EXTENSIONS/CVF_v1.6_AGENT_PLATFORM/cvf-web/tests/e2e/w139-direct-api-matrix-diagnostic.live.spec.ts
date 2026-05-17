/**
 * w139-direct-api-matrix-diagnostic.live.spec.ts
 * W139-T1 — direct /api/execute matrix to isolate UI/browser vs route/provider lifecycle.
 */

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { loginAs } from './utils';

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);
const HAS_DEEPSEEK_KEY = !!process.env.DEEPSEEK_API_KEY;

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const ALIBABA_JSON = resolve(EVIDENCE_ROOT, 'CVF_W139_DIRECT_API_MATRIX_ALIBABA_EVIDENCE_2026-05-07.json');
const ALIBABA_MD = resolve(EVIDENCE_ROOT, 'CVF_W139_DIRECT_API_MATRIX_ALIBABA_EVIDENCE_2026-05-07.md');
const DEEPSEEK_JSON = resolve(EVIDENCE_ROOT, 'CVF_W139_DIRECT_API_MATRIX_DEEPSEEK_EVIDENCE_2026-05-07.json');
const DEEPSEEK_MD = resolve(EVIDENCE_ROOT, 'CVF_W139_DIRECT_API_MATRIX_DEEPSEEK_EVIDENCE_2026-05-07.md');

type ProviderKey = 'alibaba' | 'deepseek';

type DirectRecord = {
  formType: string;
  templateId: string;
  httpStatus: number;
  success: boolean;
  receiptPresent: boolean;
  receiptDecision: string | null;
  outputValidationIssues: string[];
  retryAttempts: number;
  elapsedMs: number;
  diagnostic: 'accepted' | 'http_error' | 'provider_error' | 'route_timeout' | 'receipt_missing';
  error: string | null;
};

const JOURNEY_MATRIX = [
  {
    formType: 'documentation',
    templateId: 'documentation',
    templateName: 'Tài liệu Kỹ thuật',
    prompt: 'Viết tài liệu hướng dẫn sử dụng cho nhân viên mới',
    inputs: {
      subject: 'Tài liệu hướng dẫn nhân viên mới',
      currentNotes: 'Nội dung kiểm thử W139 cho trường này.',
      readerGoal: 'Thông tin bổ sung 1',
      audience: 'Người vận hành nội bộ',
      mustPreserve: 'Nội dung kiểm thử W139 cho trường này.',
    },
  },
  {
    formType: 'email_template',
    templateId: 'email_template',
    templateName: 'Email Template',
    prompt: 'Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng',
    inputs: { purpose: 'Email giới thiệu dịch vụ tư vấn', audience: 'Thông tin bổ sung 1', context: 'Nội dung kiểm thử W139 cho trường này.' },
  },
  {
    formType: 'risk_assessment',
    templateId: 'risk_assessment',
    templateName: 'Đánh giá Rủi ro',
    prompt: 'Đánh giá rủi ro cho dự án phần mềm quản lý kho tại doanh nghiệp',
    inputs: { subject: 'Rủi ro dự án phần mềm kho', description: 'Nội dung kiểm thử W139 cho trường này.', stakeholders: 'Thông tin bổ sung 1', timeline: 'Thông tin bổ sung 2', tolerance: 'Medium' },
  },
  {
    formType: 'competitor_review',
    templateId: 'competitor_review',
    templateName: 'Phân tích Đối thủ',
    prompt: 'Phân tích đối thủ cạnh tranh trong lĩnh vực dịch vụ logistics',
    inputs: { company: 'Đối thủ cạnh tranh logistics', competitors: 'Nội dung kiểm thử W139 cho trường này.', industry: 'Thông tin bổ sung 1', criteria: 'Nội dung kiểm thử W139 cho trường này.' },
  },
  {
    formType: 'user_persona',
    templateId: 'user_persona',
    templateName: 'User Persona',
    prompt: 'Xây dựng hồ sơ khách hàng mục tiêu cho ứng dụng quản lý tài chính cá nhân',
    inputs: { product: 'Khách hàng ứng dụng tài chính cá nhân', data: 'Nội dung kiểm thử W139 cho trường này.', segments: 'Thông tin bổ sung 1', goals: 'Thông tin bổ sung 2' },
  },
  {
    formType: 'strategy_analysis',
    templateId: 'strategy_analysis',
    templateName: 'Phân tích Chiến lược',
    prompt: 'Phân tích chiến lược mở rộng sang thị trường miền Trung Việt Nam',
    inputs: { topic: 'Chiến lược mở rộng miền Trung', context: 'Nội dung kiểm thử W139 cho trường này.', options: 'Nội dung kiểm thử W139 cho trường này.', constraints: 'Thông tin bổ sung 1', priority: 'Growth' },
  },
  {
    formType: 'feature_prioritization',
    templateId: 'feature_prioritization',
    templateName: 'Feature Prioritization',
    prompt: 'Lập danh sách ưu tiên tính năng cho phiên bản tiếp theo của sản phẩm SaaS',
    inputs: { product: 'Ưu tiên tính năng SaaS v2', features: 'Nội dung kiểm thử W139 cho trường này.', goal: 'Thông tin bổ sung 1' },
  },
  {
    formType: 'pricing_strategy',
    templateId: 'pricing_strategy',
    templateName: 'Pricing Strategy',
    prompt: 'Xây dựng chiến lược định giá cho sản phẩm SaaS B2B trong thị trường SME',
    inputs: { product: 'Chiến lược giá SaaS B2B SME', currentPrice: 'Thông tin bổ sung 1', model: 'Subscription', target: 'B2B SMB', competitors: 'Nội dung kiểm thử W139 cho trường này.' },
  },
  {
    formType: 'documentation',
    templateId: 'documentation',
    templateName: 'Tài liệu Kỹ thuật',
    prompt: 'Tạo tài liệu kỹ thuật cho API tích hợp hệ thống thanh toán',
    inputs: {
      subject: 'Tài liệu kỹ thuật API thanh toán',
      currentNotes: 'Nội dung kiểm thử W139 cho trường này.',
      readerGoal: 'Thông tin bổ sung 1',
      audience: 'Người vận hành nội bộ',
      mustPreserve: 'Nội dung kiểm thử W139 cho trường này.',
    },
  },
  {
    formType: 'email_template',
    templateId: 'email_template',
    templateName: 'Email Template',
    prompt: 'Viết email xác nhận lịch hẹn với đối tác kinh doanh',
    inputs: { purpose: 'Email xác nhận lịch hẹn đối tác', audience: 'Thông tin bổ sung 1', context: 'Nội dung kiểm thử W139 cho trường này.' },
  },
  {
    formType: 'risk_assessment',
    templateId: 'risk_assessment',
    templateName: 'Đánh giá Rủi ro',
    prompt: 'Phân tích rủi ro khi mở rộng kinh doanh sang thị trường Đông Nam Á',
    inputs: { subject: 'Rủi ro mở rộng thị trường Đông Nam Á', description: 'Nội dung kiểm thử W139 cho trường này.', stakeholders: 'Thông tin bổ sung 1', timeline: 'Thông tin bổ sung 2', tolerance: 'Medium' },
  },
  {
    formType: 'strategy_analysis',
    templateId: 'strategy_analysis',
    templateName: 'Phân tích Chiến lược',
    prompt: 'Đánh giá cơ hội và thách thức khi ra mắt sản phẩm mới cho phân khúc doanh nghiệp lớn',
    inputs: { topic: 'Cơ hội ra mắt sản phẩm doanh nghiệp lớn', context: 'Nội dung kiểm thử W139 cho trường này.', options: 'Nội dung kiểm thử W139 cho trường này.', constraints: 'Thông tin bổ sung 1', priority: 'Growth' },
  },
] as const;

const DEEPSEEK_JOURNEYS = JOURNEY_MATRIX.slice(0, 6);

function writeEvidence(providerKey: ProviderKey, records: DirectRecord[], status: 'in_progress' | 'complete') {
  const jsonPath = providerKey === 'alibaba' ? ALIBABA_JSON : DEEPSEEK_JSON;
  const mdPath = providerKey === 'alibaba' ? ALIBABA_MD : DEEPSEEK_MD;
  const accepted = records.filter((r) => r.diagnostic === 'accepted').length;
  const summary = {
    capturedAt: new Date().toISOString(),
    tranche: 'W139-T1 Direct API Matrix Diagnostic',
    status,
    provider: providerKey,
    model: providerKey === 'alibaba' ? 'qwen-plus' : 'deepseek-chat',
    attempted: records.length,
    accepted,
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
    `# CVF W139 Direct API Matrix — ${providerKey}`,
    '',
    `**Status:** ${status}`,
    `**Captured:** ${summary.capturedAt}`,
    `**Provider:** ${providerKey}`,
    `**Model:** ${summary.model}`,
    `**Attempted:** ${summary.attempted}`,
    `**Accepted:** ${summary.accepted}`,
    '',
    '| # | Form | HTTP | Diagnostic | Elapsed | Receipt | Issues |',
    '|---|---|---:|---|---:|---:|---|',
    ...records.map((r, i) => `| ${i + 1} | ${r.formType} | ${r.httpStatus} | ${r.diagnostic} | ${r.elapsedMs}ms | ${r.receiptDecision ?? 'n/a'} | ${JSON.stringify(r.outputValidationIssues)} |`),
    '',
  ].join('\n'), 'utf8');

  return summary;
}

async function runDirectJourney(page: import('@playwright/test').Page, providerKey: ProviderKey, journey: typeof JOURNEY_MATRIX[number]): Promise<DirectRecord> {
  const startedAt = Date.now();
  try {
    const response = await page.request.post('/api/execute', {
      timeout: 90_000,
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
    const success = body.success === true;
    const receiptPresent = !!body.governanceEvidenceReceipt;
    const diagnostic: DirectRecord['diagnostic'] =
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
      httpStatus: response.status(),
      success,
      receiptPresent,
      receiptDecision: body.governanceEvidenceReceipt?.decision ?? null,
      outputValidationIssues: body.outputValidation?.issues ?? [],
      retryAttempts: body.outputValidation?.retryAttempts ?? 0,
      elapsedMs: Date.now() - startedAt,
      diagnostic,
      error: body.error ?? null,
    };
  } catch (err) {
    return {
      formType: journey.formType,
      templateId: journey.templateId,
      httpStatus: 0,
      success: false,
      receiptPresent: false,
      receiptDecision: null,
      outputValidationIssues: [],
      retryAttempts: 0,
      elapsedMs: Date.now() - startedAt,
      diagnostic: 'route_timeout',
      error: String(err).slice(0, 200),
    };
  }
}

test.describe('W139-T1 — direct API matrix diagnostic', () => {
  test('Alibaba direct 12-journey matrix', { tag: ['@live', '@w139-alibaba'] }, async ({ page }) => {
    test.skip(!HAS_ALIBABA_KEY, 'W139 Alibaba diagnostic requires DashScope-compatible key');
    test.setTimeout(1_500_000);

    await loginAs(page, 'admin', 'admin123');
    const records: DirectRecord[] = [];
    for (const journey of JOURNEY_MATRIX) {
      const result = await runDirectJourney(page, 'alibaba', journey);
      records.push(result);
      writeEvidence('alibaba', records, 'in_progress');
      await page.waitForTimeout(1500);
    }
    const summary = writeEvidence('alibaba', records, 'complete');
    expect(summary.attempted).toBe(12);
  });

  test('DeepSeek direct 6-journey matrix', { tag: ['@live', '@w139-deepseek'] }, async ({ page }) => {
    test.skip(!HAS_DEEPSEEK_KEY, 'W139 DeepSeek diagnostic requires DEEPSEEK_API_KEY');
    test.setTimeout(900_000);

    await loginAs(page, 'admin', 'admin123');
    const records: DirectRecord[] = [];
    for (const journey of DEEPSEEK_JOURNEYS) {
      const result = await runDirectJourney(page, 'deepseek', journey);
      records.push(result);
      writeEvidence('deepseek', records, 'in_progress');
      await page.waitForTimeout(1500);
    }
    const summary = writeEvidence('deepseek', records, 'complete');
    expect(summary.attempted).toBe(6);
  });
});
