/**
 * w129-stage-a-volume-capture.live.spec.ts
 * W129 Post-Closure Addendum §7 — Stage A Volume Pass
 *
 * Purpose:
 *   Accumulate >= 10 browser-local `execution_created` events via real browser-driven
 *   UI journeys (IntentEntry → form route CTA → DynamicForm → Enter submit).
 *   Evaluate Stage B enablement criteria per §7.1 of the W129 roadmap addendum.
 *
 * Governance policy (AGENTS.md §Mandatory Live Governance Proof):
 *   Any claim about CVF governance behavior MUST use a real provider API call.
 *   Live lane: Alibaba qwen-turbo (DASHSCOPE_API_KEY / ALIBABA_API_KEY).
 *
 * Hard Boundaries (§7.2):
 *   - Real live provider calls only — mock mode is not valid evidence
 *   - execution_created events must come from browser-driven UI journeys, not raw
 *     /api/execute calls alone
 *   - Do not print or commit raw API key values
 *   - Keep rollout to Stage A only during this pass
 *
 * Stage B unlock rule (§7.1):
 *   1. Stage A must have >= 10 `execution_created` events in browser-local analytics
 *   2. `entry_routing` must NOT be `action_required`
 *
 * Journey strategy:
 *   Uses W126 trusted form-route prompts (strategy, risk, documentation, competitor,
 *   pricing, persona, feature). Each journey goes through IntentEntry → route preview
 *   → form CTA click → DynamicForm → fill required fields → Enter submit → execution_created.
 *   `execution_created` fires immediately at form submit via store.addExecution().
 *
 * Run:
 *   DASHSCOPE_API_KEY=<key> NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
 *     npx playwright test w129-stage-a-volume-capture.live.spec.ts
 *
 * Outputs:
 *   docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.md
 *   docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.json
 *
 * W129 Post-Closure Addendum §7
 */

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

const STAGE_B_THRESHOLD = 10;

/**
 * 12 form-route journeys using W126 trusted form activation patterns.
 * All prompts are designed to route to DynamicForm (not wizard) so that
 * the standard handleFormSubmit → addExecution → execution_created path fires.
 *
 * topicValue: pre-filled value for the first text input (main topic/subject field).
 */
const VOLUME_JOURNEYS = [
  {
    prompt: 'Tôi cần phân tích chiến lược mở rộng thị trường Đông Nam Á',
    topicValue: 'Chiến lược mở rộng thị trường Đông Nam Á',
  },
  {
    prompt: 'Giúp tôi đánh giá rủi ro dự án tích hợp hệ thống ERP',
    topicValue: 'Tích hợp hệ thống ERP doanh nghiệp vừa',
  },
  {
    prompt: 'Tôi muốn phân tích đối thủ cạnh tranh trong ngành SaaS B2B',
    topicValue: 'Cạnh tranh SaaS B2B thị trường Việt Nam',
  },
  {
    prompt: 'Tôi cần viết tài liệu quy trình onboarding nhân viên mới',
    topicValue: 'Quy trình onboarding nhân viên',
  },
  {
    prompt: 'Giúp tôi phân tích chiến lược ra mắt sản phẩm cho thị trường B2B',
    topicValue: 'Chiến lược go-to-market sản phẩm B2B',
  },
  {
    prompt: 'Tôi cần đánh giá rủi ro khi triển khai cloud migration',
    topicValue: 'Cloud migration cho doanh nghiệp vừa',
  },
  {
    prompt: 'Soạn email proposal gửi khách hàng enterprise',
    topicValue: 'Enterprise partnership proposal',
  },
  {
    prompt: 'Tôi muốn xây dựng chiến lược giá cho sản phẩm SaaS',
    topicValue: 'Chiến lược định giá SaaS theo gói',
  },
  {
    prompt: 'Giúp tôi ưu tiên tính năng cho product roadmap quý tới',
    topicValue: 'Product roadmap Q3 2026',
  },
  {
    prompt: 'Tôi cần xác định người dùng mục tiêu cho sản phẩm fintech',
    topicValue: 'Target user cho ứng dụng fintech',
  },
  {
    prompt: 'Tôi cần phân tích chiến lược phát triển kênh bán hàng mới',
    topicValue: 'Phát triển kênh sales mới cho doanh nghiệp',
  },
  {
    prompt: 'Giúp tôi đánh giá rủi ro khi mở rộng sang thị trường quốc tế',
    topicValue: 'Rủi ro mở rộng thị trường quốc tế',
  },
] as const;

const VOLUME_MD_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.md',
);
const VOLUME_JSON_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_A_VOLUME_EVIDENCE_2026-04-27.json',
);

function countByType(events: AnalyticsEvent[], type: AnalyticsEvent['type']): number {
  return events.filter((e) => e.type === type).length;
}

function formatMetric(value: number | null): string {
  return value === null ? 'N/A' : `${value}%`;
}

test.describe('W129 Stage A volume capture — Stage B unlock evidence', () => {
  test.skip(!HAS_ALIBABA_KEY, 'Alibaba live key required for W129 Stage A volume capture');
  test.skip(
    !INTENT_FIRST_ENABLED,
    'NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true required for W129 Stage A volume capture',
  );

  test(
    'accumulates >=10 execution_created events via form-route UI journeys and evaluates Stage B readiness',
    async ({ page }) => {
      test.setTimeout(600_000);

      await seedStorageWithAlibaba(page);
      await login(page);

      await page.evaluate(() => {
        localStorage.removeItem('cvf_analytics_events');
        sessionStorage.clear();
      });

      type JourneyStatus = 'success' | 'skip_no_cta' | 'skip_no_form' | 'error';
      const journeyLog: Array<{ prompt: string; status: JourneyStatus; detail?: string }> = [];
      let successCount = 0;

      for (const journey of VOLUME_JOURNEYS) {
        await page.goto('/home');
        await expect(
          page.getByRole('heading', { name: /Templates/i }).first(),
        ).toBeVisible({ timeout: 15_000 });

        const textarea = page.getByPlaceholder(/Ví dụ|e\.g\./i).first();
        await textarea.waitFor({ state: 'visible', timeout: 10_000 });
        await textarea.fill(journey.prompt);

        const routePreview = page.getByText(/CVF đề xuất|CVF recommends/i);
        await routePreview.waitFor({ timeout: 8_000 }).catch(() => {});

        const cta = page.getByRole('button', {
          name: /Bắt đầu với governed path|Start with governed path/i,
        });
        const ctaEnabled = await cta.isEnabled().catch(() => false);
        if (!ctaEnabled) {
          journeyLog.push({
            prompt: journey.prompt,
            status: 'skip_no_cta',
            detail: 'CTA not enabled — weak or unmatched route',
          });
          continue;
        }
        await cta.click();
        await page.waitForTimeout(600);

        const firstTextInput = page.locator('input[type="text"]').first();
        const formVisible = await firstTextInput.isVisible().catch(() => false);
        if (!formVisible) {
          journeyLog.push({
            prompt: journey.prompt,
            status: 'skip_no_form',
            detail: 'DynamicForm text input not found — may have routed to wizard',
          });
          continue;
        }

        await firstTextInput.fill(journey.topicValue);

        const allTextInputs = page.locator('input[type="text"]');
        const inputCount = await allTextInputs.count();
        for (let i = 1; i < inputCount; i++) {
          const inp = allTextInputs.nth(i);
          if (await inp.isVisible().catch(() => false)) {
            const v = await inp.inputValue().catch(() => '');
            if (!v) await inp.fill(`Giá trị kiểm thử ${i}`);
          }
        }

        const textareas = page.locator('textarea');
        const taCount = await textareas.count();
        for (let i = 0; i < taCount; i++) {
          const ta = textareas.nth(i);
          if (await ta.isVisible().catch(() => false)) {
            const v = await ta.inputValue().catch(() => '');
            if (!v) await ta.fill('Nội dung kiểm thử cho trường này.');
          }
        }

        await firstTextInput.press('Enter');
        await page.waitForTimeout(800);

        const formGone = await firstTextInput.isHidden().catch(() => true);
        if (formGone) {
          successCount++;
          journeyLog.push({ prompt: journey.prompt, status: 'success' });
        } else {
          journeyLog.push({
            prompt: journey.prompt,
            status: 'error',
            detail: 'Form still visible after Enter — required field validation may have blocked submit',
          });
        }
      }

      const { response, body } = await postLiveGovernedExecution(page, 'governance');
      expect([200, 400, 409, 422]).toContain(response.status());
      expect(body).toHaveProperty('governanceEvidenceReceipt');

      await page.goto('/home');
      const events = await page.evaluate(() => {
        const raw = localStorage.getItem('cvf_analytics_events');
        return raw ? JSON.parse(raw) : [];
      }) as AnalyticsEvent[];

      const executionCreatedCount = countByType(events, 'execution_created');
      const intentRoutedCount = countByType(events, 'intent_routed');
      const browseFallbackCount = countByType(events, 'clarification_browse_fallback');

      const readout = computeLaneReadout(events, STAGE_A_FLAGS);
      const entryRouting = readout.find((lane) => lane.laneId === 'entry_routing');
      const trustedForm = readout.find((lane) => lane.laneId === 'trusted_form');

      const thresholdMet = executionCreatedCount >= STAGE_B_THRESHOLD;
      const routingHealthy = entryRouting?.status !== 'action_required';
      const stageBMet = thresholdMet && routingHealthy;

      const stageBDecision = stageBMet
        ? 'STAGE_B_MAY_ENABLE — execution_created threshold met and entry_routing not action_required'
        : !thresholdMet
          ? `STAGE_B_HOLD — execution_created ${executionCreatedCount}/${STAGE_B_THRESHOLD} (threshold not met)`
          : `STAGE_B_HOLD — entry_routing is ${entryRouting?.status ?? 'unknown'} (must not be action_required)`;

      expect(executionCreatedCount).toBeGreaterThanOrEqual(STAGE_B_THRESHOLD);
      expect(entryRouting?.status).not.toBe('action_required');

      const summary = {
        capturedAt: new Date().toISOString(),
        provider: 'alibaba / qwen-turbo',
        stage: 'Stage A volume pass — §7 Post-Closure Addendum',
        attemptedJourneys: VOLUME_JOURNEYS.length,
        successfulJourneys: successCount,
        liveExecutionStatus: response.status(),
        liveDecision: body.governanceEvidenceReceipt?.decision ?? null,
        stageBDecision,
        thresholdMet: stageBMet,
        eventCounts: {
          execution_created: executionCreatedCount,
          intent_routed: intentRoutedCount,
          clarification_browse_fallback: browseFallbackCount,
          rollout_flag_enabled: countByType(events, 'rollout_flag_enabled'),
          rollout_session_start: countByType(events, 'rollout_session_start'),
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
            }
          : null,
        journeyLog,
      };

      const markdown = [
        '# CVF W129 Stage A Volume Evidence',
        '',
        '> Date: 2026-04-27',
        '> Source: `w129-stage-a-volume-capture.live.spec.ts`',
        `> Status: ${stageBMet ? 'STAGE B UNLOCK CRITERIA MET' : 'STAGE B HOLD — CRITERIA NOT MET'}`,
        '',
        '## Stage B Decision',
        '',
        `**${stageBDecision}**`,
        '',
        `- Threshold: \`execution_created >= ${STAGE_B_THRESHOLD}\` → **${thresholdMet ? 'MET' : 'NOT MET'}** (\`${executionCreatedCount}\` events)`,
        `- Routing health: \`entry_routing != action_required\` → **${routingHealthy ? 'MET' : 'NOT MET'}** (status: \`${entryRouting?.status ?? 'unknown'}\`)`,
        '',
        '## Volume Metrics',
        '',
        `- Attempted journeys: \`${VOLUME_JOURNEYS.length}\``,
        `- Successful UI form submissions: \`${successCount}\``,
        `- \`execution_created\` events in analytics: \`${executionCreatedCount}\``,
        `- \`intent_routed\` events in analytics: \`${intentRoutedCount}\``,
        `- \`clarification_browse_fallback\`: \`${browseFallbackCount}\``,
        '',
        '## Live Governance Proof',
        '',
        `- Live governed execution status: \`${response.status()}\``,
        `- Governance decision: \`${body.governanceEvidenceReceipt?.decision ?? 'UNKNOWN'}\``,
        `- Provider lane: \`alibaba / qwen-turbo\``,
        '',
        '## Lane Readout',
        '',
        '| Lane | Status | Metric | Note |',
        '|---|---|---|---|',
        `| \`entry_routing\` | **${entryRouting?.status ?? 'unknown'}** | ${formatMetric(entryRouting?.metricValue ?? null)} | ${entryRouting?.explanation ?? 'n/a'} |`,
        `| \`trusted_form\` | **${trustedForm?.status ?? 'unknown'}** | ${formatMetric(trustedForm?.metricValue ?? null)} | ${trustedForm?.explanation ?? 'n/a'} |`,
        '',
        '## Journey Log',
        '',
        ...journeyLog.map(
          (j) =>
            `- [${j.status.toUpperCase()}] \`${j.prompt}\`${j.detail ? ` — ${j.detail}` : ''}`,
        ),
        '',
        '## Continuation Posture',
        '',
        stageBMet
          ? '- **Stage B (`NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP`) MAY BE ENABLED** per W129 rollout playbook.'
          : '- **Stage B must remain OFF** — unlock criteria not fully met.',
        '- Stage C (`NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY`) remains deferred until Stage B signal is captured.',
        stageBMet
          ? '- Next: enable Stage B, run new evidence pass, then reassess W130.'
          : '- Next: continue Stage A traffic accumulation until threshold is met.',
        '',
      ].join('\n');

      mkdirSync(dirname(VOLUME_MD_PATH), { recursive: true });
      writeFileSync(VOLUME_MD_PATH, markdown, 'utf8');
      writeFileSync(VOLUME_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');
    },
  );
});
