import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { computeLaneReadout, type NoncoderFlags } from '../../src/lib/noncoder-rollout-readout';
import type { AnalyticsEvent } from '../../src/lib/analytics';
import { login, postLiveGovernedExecution, seedStorageWithAlibaba } from './utils';

const HAS_ALIBABA_KEY = !!(
  process.env.DASHSCOPE_API_KEY ||
  process.env.ALIBABA_API_KEY ||
  process.env.CVF_ALIBABA_API_KEY ||
  process.env.CVF_BENCHMARK_ALIBABA_KEY
);

const INTENT_FIRST_ENABLED = process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';

const STAGE_A_FLAGS: NoncoderFlags = {
  intentFirstEnabled: true,
  clarificationLoopEnabled: false,
  iterationMemoryEnabled: false,
};

const ROUTING_PROMPTS = [
  'Tôi muốn xây dựng app quản lý kho hàng',
  'Tôi muốn tạo app quản lý công việc',
  'Tôi muốn xây dựng app theo dõi deadline cho đội sales',
  'Tôi muốn tạo app quản lý yêu cầu nội bộ',
  'Tôi muốn xây dựng app quản lý đơn hàng',
];

const REVIEW_MD_PATH = resolve(__dirname, '../../../../../docs/reviews/CVF_W129_STAGE_A_SIGNAL_CAPTURE_EVIDENCE_2026-04-27.md');
const REVIEW_JSON_PATH = resolve(__dirname, '../../../../../docs/reviews/CVF_W129_STAGE_A_SIGNAL_CAPTURE_EVIDENCE_2026-04-27.json');

function countByType(events: AnalyticsEvent[], type: AnalyticsEvent['type']) {
  return events.filter((event) => event.type === type).length;
}

function formatMetric(value: number | null) {
  return value === null ? 'N/A' : `${value}%`;
}

test.describe('W129 Stage A signal capture', () => {
  test.skip(!HAS_ALIBABA_KEY, 'Alibaba live key is required for W129 Stage A signal capture');
  test.skip(!INTENT_FIRST_ENABLED, 'NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true is required for W129 Stage A signal capture');

    test('captures explicit intent-first routing evidence and writes a review artifact', async ({ page }) => {
    test.setTimeout(240_000);

    await seedStorageWithAlibaba(page);
    await login(page);
    await page.evaluate(() => {
      localStorage.removeItem('cvf_analytics_events');
      sessionStorage.clear();
    });

    for (const prompt of ROUTING_PROMPTS) {
      await page.goto('/home');
      await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });

      const textarea = page.getByPlaceholder(/Ví dụ|e\.g\./i).first();
      await textarea.waitFor({ state: 'visible', timeout: 10_000 });
      await textarea.fill(prompt);
      await expect(page.getByText(/CVF đề xuất|CVF recommends/i)).toBeVisible({ timeout: 10_000 });

      const cta = page.getByRole('button', { name: /Bắt đầu với governed path|Start with governed path/i });
      await expect(cta).toBeEnabled({ timeout: 5_000 });
      await cta.click();

      await page.waitForTimeout(500);
    }

    const { response, body } = await postLiveGovernedExecution(page, 'governance');
    expect([200, 400, 409, 422]).toContain(response.status());
    expect(body).toHaveProperty('governanceEvidenceReceipt');

    await page.goto('/home');
    const events = await page.evaluate(() => {
      const raw = localStorage.getItem('cvf_analytics_events');
      return raw ? JSON.parse(raw) : [];
    }) as AnalyticsEvent[];

    const readout = computeLaneReadout(events, STAGE_A_FLAGS);
    const entryRouting = readout.find((lane) => lane.laneId === 'entry_routing');
    const trustedForm = readout.find((lane) => lane.laneId === 'trusted_form');

    expect(events.length).toBeGreaterThan(0);
    expect(countByType(events, 'rollout_flag_enabled')).toBeGreaterThan(0);
    expect(countByType(events, 'rollout_session_start')).toBe(1);
    expect(countByType(events, 'intent_routed')).toBeGreaterThanOrEqual(ROUTING_PROMPTS.length);
    expect(countByType(events, 'clarification_browse_fallback')).toBe(0);
    expect(entryRouting?.status).not.toBe('no_data');
    expect(trustedForm?.status).not.toBe('no_data');

    const summary = {
      capturedAt: new Date().toISOString(),
      liveExecutionStatus: response.status(),
      liveDecision: body.governanceEvidenceReceipt?.decision ?? null,
      eventCount: events.length,
      eventCounts: {
        rollout_flag_enabled: countByType(events, 'rollout_flag_enabled'),
        rollout_session_start: countByType(events, 'rollout_session_start'),
        intent_routed: countByType(events, 'intent_routed'),
        clarification_weak_confidence_detected: countByType(events, 'clarification_weak_confidence_detected'),
        clarification_browse_fallback: countByType(events, 'clarification_browse_fallback'),
      },
      entryRouting: entryRouting
        ? {
            status: entryRouting.status,
            metricValue: entryRouting.metricValue,
            explanation: entryRouting.explanation,
            recommendation: entryRouting.recommendation,
          }
        : null,
      trustedForm: trustedForm
        ? {
            status: trustedForm.status,
            metricValue: trustedForm.metricValue,
            explanation: trustedForm.explanation,
            recommendation: trustedForm.recommendation,
          }
        : null,
    };

    const markdown = [
      '# CVF W129 Stage A Signal Capture Evidence',
      '',
      '> Date: 2026-04-27',
      '> Source: dedicated Playwright live signal-capture spec (`w129-stage-a-signal-capture.live.spec.ts`)',
      '> Status: EXPLICIT ROUTING SIGNAL CAPTURED',
      '',
      '## Live Proof',
      '',
      `- Live governed execution status: \`${response.status()}\``,
      `- Governance decision surfaced: \`${body.governanceEvidenceReceipt?.decision ?? 'UNKNOWN'}\``,
      `- Provider lane: \`alibaba / qwen-turbo\``,
      '',
      '## Browser-Local Analytics',
      '',
      `- Total events captured: \`${summary.eventCount}\``,
      `- \`rollout_flag_enabled\`: \`${summary.eventCounts.rollout_flag_enabled}\``,
      `- \`rollout_session_start\`: \`${summary.eventCounts.rollout_session_start}\``,
      `- \`intent_routed\`: \`${summary.eventCounts.intent_routed}\``,
      `- \`clarification_weak_confidence_detected\`: \`${summary.eventCounts.clarification_weak_confidence_detected}\``,
      `- \`clarification_browse_fallback\`: \`${summary.eventCounts.clarification_browse_fallback}\``,
      '',
      '## Lane Readout',
      '',
      '| Lane | Status | Metric | Note |',
      '|---|---|---|---|',
      `| \`entry_routing\` | **${entryRouting?.status ?? 'unknown'}** | ${formatMetric(entryRouting?.metricValue ?? null)} | ${entryRouting?.explanation ?? 'n/a'} |`,
      `| \`trusted_form\` | **${trustedForm?.status ?? 'unknown'}** | ${formatMetric(trustedForm?.metricValue ?? null)} | ${trustedForm?.explanation ?? 'n/a'} |`,
      '',
      '## Continuation Posture',
      '',
      '- This artifact resolves the W129 proof-scope gap for explicit Stage A routing signal.',
      '- It does not by itself satisfy the Stage B playbook threshold of `>=10 execution_created` events.',
      '- W130 remains blocked until continuation authorization criteria are explicitly met.',
      '',
    ].join('\n');

    mkdirSync(dirname(REVIEW_MD_PATH), { recursive: true });
    writeFileSync(REVIEW_MD_PATH, markdown, 'utf8');
    writeFileSync(REVIEW_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');
  });
});
