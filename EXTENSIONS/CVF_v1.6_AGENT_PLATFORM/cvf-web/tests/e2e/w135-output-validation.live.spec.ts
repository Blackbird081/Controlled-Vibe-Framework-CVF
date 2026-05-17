/**
 * w135-output-validation.live.spec.ts
 * W135-T1 CP5 — live competitor_review output-validation false-positive proof.
 */

import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { loginAs, seedStorageWithAlibaba } from './utils';

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const EVIDENCE_JSON = resolve(EVIDENCE_ROOT, 'CVF_W135_COMPETITOR_REVIEW_OUTPUT_VALIDATION_EVIDENCE_2026-05-07.json');
const EVIDENCE_MD = resolve(EVIDENCE_ROOT, 'CVF_W135_COMPETITOR_REVIEW_OUTPUT_VALIDATION_EVIDENCE_2026-05-07.md');

function writeEvidence(record: Record<string, unknown>) {
  mkdirSync(dirname(EVIDENCE_JSON), { recursive: true });
  writeFileSync(EVIDENCE_JSON, JSON.stringify(record, null, 2), 'utf8');

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W135 Competitor Review Output Validation Evidence',
    '',
    `**Captured:** ${record.capturedAt}`,
    `**Provider:** ${record.provider}`,
    `**Model:** ${record.model}`,
    `**HTTP status:** ${record.httpStatus}`,
    `**Success:** ${record.success}`,
    `**Receipt decision:** ${record.receiptDecision}`,
    `**Output validation issues:** ${JSON.stringify(record.outputValidationIssues ?? [])}`,
    `**Quality hint:** ${record.qualityHint ?? 'n/a'}`,
    '',
    '## Boundary',
    '',
    'This proves the W135 targeted `competitor_review` false-positive path no longer exhausts output validation with HTTP 422 on Alibaba. It does not claim the W134 timeout residuals are solved.',
    '',
  ].join('\n');

  writeFileSync(EVIDENCE_MD, md, 'utf8');
}

test.describe('W135-T1 CP5 — competitor_review live output-validation proof', () => {
  test(
    'Alibaba competitor_review returns live governance receipt without HTTP 422 false-positive block',
    { tag: ['@live', '@w135-cp5', '@w135-alibaba'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W135 CP5 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.setTimeout(180_000);

      await seedStorageWithAlibaba(page);
      await loginAs(page, 'admin', 'admin123');

      const response = await page.request.post('/api/execute', {
        data: {
          templateId: 'competitor_review',
          templateName: 'Phân tích Đối thủ',
          intent: `INTENT:
Tôi muốn phân tích đối thủ cạnh tranh trong ngành dịch vụ logistics.

MY COMPANY:
CVF Logistics Advisory — dịch vụ tư vấn vận hành cho SME Việt Nam.

COMPETITORS:
1. FastShip Consulting — tư vấn vận hành giao hàng nhanh.
2. LocalOps Partner — hỗ trợ quy trình kho vận địa phương.
3. RouteWise Asia — phân tích tuyến và chi phí logistics.

COMPARISON CRITERIA:
Giá, khả năng áp dụng, hỗ trợ tiếng Việt, báo cáo vận hành.

OUTPUT FORMAT:
- Competitor Matrix → SWOT per Competitor → Differentiation Opportunities → Market Positioning

SUCCESS CRITERIA:
- Ma trận so sánh các đối thủ
- Điểm mạnh/yếu từng đối thủ
- Cơ hội khác biệt hóa`,
          inputs: {
            company: 'CVF Logistics Advisory — dịch vụ tư vấn vận hành cho SME Việt Nam.',
            competitors: 'FastShip Consulting\nLocalOps Partner\nRouteWise Asia',
            industry: 'Dịch vụ logistics và tư vấn vận hành',
            criteria: 'Giá, khả năng áp dụng, hỗ trợ tiếng Việt, báo cáo vận hành',
          },
          provider: 'alibaba',
          model: 'qwen-plus',
          mode: 'governance',
          action: 'analyze template execution request',
        },
      });

      const body = await response.json();
      const record = {
        capturedAt: new Date().toISOString(),
        tranche: 'W135-T1 CP5',
        provider: body.provider ?? 'alibaba',
        model: body.model ?? 'qwen-plus',
        httpStatus: response.status(),
        success: body.success === true,
        receiptDecision: body.governanceEvidenceReceipt?.decision ?? null,
        routingDecision: body.governanceEvidenceReceipt?.routingDecision ?? null,
        qualityHint: body.outputValidation?.qualityHint ?? body.governanceEvidenceReceipt?.validationHint ?? null,
        outputValidationIssues: body.outputValidation?.issues ?? [],
        retryAttempts: body.outputValidation?.retryAttempts ?? 0,
        error: body.error ?? null,
        receiptPresent: !!body.governanceEvidenceReceipt,
      };

      writeEvidence(record);

      expect(response.status()).toBe(200);
      expect(body.success).toBe(true);
      expect(body.governanceEvidenceReceipt?.decision).toBe('ALLOW');
      expect(record.outputValidationIssues).not.toContain('UNSAFE_CONTENT');
    },
  );
});
