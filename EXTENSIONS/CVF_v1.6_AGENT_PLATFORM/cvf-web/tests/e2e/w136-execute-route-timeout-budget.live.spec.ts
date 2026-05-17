/**
 * w136-execute-route-timeout-budget.live.spec.ts
 * W136-T1 CP5 — targeted live proof for bounded /api/execute route latency.
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

const EVIDENCE_ROOT = resolve(__dirname, '../../../../../docs/reviews');
const EVIDENCE_JSON = resolve(EVIDENCE_ROOT, 'CVF_W136_EXECUTE_ROUTE_TIMEOUT_BUDGET_EVIDENCE_2026-05-07.json');
const EVIDENCE_MD = resolve(EVIDENCE_ROOT, 'CVF_W136_EXECUTE_ROUTE_TIMEOUT_BUDGET_EVIDENCE_2026-05-07.md');

const JOURNEYS = [
  {
    name: 'documentation',
    body: {
      templateId: 'documentation',
      templateName: 'Tài liệu Kỹ thuật',
      intent: 'Analyze notes and produce a clear operational handoff document for non-experts.',
      inputs: {
        subject: 'Quy trình tiếp nhận khách hàng mới',
        currentNotes: 'Lead vào từ form đăng ký. Sales gọi lại trong 2 giờ. Nếu đủ điều kiện thì gửi báo giá trong ngày. Cần ghi rõ lỗi hay gặp và checklist bàn giao.',
        readerGoal: 'Nhân viên mới có thể xử lý lead đầu vào mà không hỏi lại team lead.',
        audience: 'Người vận hành nội bộ',
        mustPreserve: 'Giữ nguyên SLA phản hồi 2 giờ và tên gói Enterprise Plus.',
      },
      provider: 'alibaba',
      model: 'qwen-plus',
      mode: 'governance',
      action: 'analyze template execution request',
    },
  },
  {
    name: 'strategy_analysis',
    body: {
      templateId: 'strategy_analysis',
      templateName: 'Phân tích Chiến lược',
      intent: 'Analyze a regional market expansion strategy and recommend a practical option.',
      inputs: {
        topic: 'Mở rộng thị trường miền Trung cho dịch vụ SaaS B2B',
        context: 'Công ty SaaS B2B phục vụ doanh nghiệp vừa và nhỏ tại Việt Nam, doanh thu ổn định và có đội sales hiện hữu.',
        options: '1. Mở đội sales tại Đà Nẵng\n2. Hợp tác reseller địa phương\n3. Chạy chiến dịch online trước',
        constraints: 'Ngân sách tối đa 300 triệu VND, cần kết quả trong 6 tháng',
        priority: 'Growth',
      },
      provider: 'alibaba',
      model: 'qwen-plus',
      mode: 'governance',
      action: 'analyze template execution request',
    },
  },
] as const;

function writeEvidence(records: Array<Record<string, unknown>>) {
  mkdirSync(dirname(EVIDENCE_JSON), { recursive: true });
  const summary = {
    capturedAt: new Date().toISOString(),
    tranche: 'W136-T1 CP5',
    provider: 'alibaba',
    model: 'qwen-plus',
    routeDeadlineMs: 90_000,
    records,
  };
  writeFileSync(EVIDENCE_JSON, JSON.stringify(summary, null, 2), 'utf8');

  const md = [
    '<!-- Memory class: FULL_RECORD -->',
    '# CVF W136 Execute Route Timeout Budget Evidence',
    '',
    `**Captured:** ${summary.capturedAt}`,
    '**Provider:** alibaba',
    '**Model:** qwen-plus',
    '**Route deadline:** 90000ms',
    '',
    '## Journey Results',
    '',
    '| Journey | HTTP | Success | Receipt | Elapsed | Retry Attempts | Issues |',
    '|---|---:|---:|---:|---:|---:|---|',
    ...records.map((record) =>
      `| ${record.name} | ${record.httpStatus} | ${record.success} | ${record.receiptDecision ?? 'n/a'} | ${record.elapsedMs}ms | ${record.retryAttempts} | ${JSON.stringify(record.outputValidationIssues ?? [])} |`
    ),
    '',
    '## Boundary',
    '',
    'This targeted proof shows the residual documentation and strategy_analysis forms return within the browser evidence deadline after W136 route-budget hardening. It does not claim a full 12-journey stability matrix.',
    '',
  ].join('\n');
  writeFileSync(EVIDENCE_MD, md, 'utf8');
}

test.describe('W136-T1 CP5 — execute route timeout budget proof', () => {
  test(
    'documentation and strategy_analysis return live receipts within 90s',
    { tag: ['@live', '@w136-cp5', '@w136-alibaba'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W136 CP5 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.setTimeout(240_000);

      await loginAs(page, 'admin', 'admin123');

      const records: Array<Record<string, unknown>> = [];
      for (const journey of JOURNEYS) {
        const startedAt = Date.now();
        const response = await page.request.post('/api/execute', { data: journey.body });
        const elapsedMs = Date.now() - startedAt;
        const body = await response.json();
        const record = {
          name: journey.name,
          httpStatus: response.status(),
          elapsedMs,
          success: body.success === true,
          receiptDecision: body.governanceEvidenceReceipt?.decision ?? null,
          receiptPresent: !!body.governanceEvidenceReceipt,
          outputValidationIssues: body.outputValidation?.issues ?? [],
          retryAttempts: body.outputValidation?.retryAttempts ?? 0,
          error: body.error ?? null,
        };
        records.push(record);
        writeEvidence(records);

        expect(elapsedMs).toBeLessThan(90_000);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.governanceEvidenceReceipt?.decision).toBe('ALLOW');
      }
    },
  );
});
