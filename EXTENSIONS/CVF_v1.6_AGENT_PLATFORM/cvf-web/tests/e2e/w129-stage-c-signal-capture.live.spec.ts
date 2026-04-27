/**
 * w129-stage-c-signal-capture.live.spec.ts
 * W129 Post-Closure Addendum §9 — Stage C Iteration Memory Signal Capture
 *
 * Purpose:
 *   Enable NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true and accumulate
 *   `followup_started` events via real browser-driven UI journeys that go
 *   all the way through: IntentEntry → DynamicForm → live API → ResultViewer
 *   → follow-up submit.
 *   Evaluate followup_continuity lane readiness.
 *
 * Governance policy (AGENTS.md §Mandatory Live Governance Proof):
 *   Any claim about CVF governance behavior MUST use a real provider API call.
 *   Live lane: Alibaba qwen-turbo (DASHSCOPE_API_KEY / ALIBABA_API_KEY).
 *
 * Journey strategy:
 *   Uses W126 trusted form-route prompts (same as Stage A). Each journey:
 *   1. IntentEntry → route preview → CTA click → DynamicForm
 *   2. Fill required fields → requestSubmit() → execution_created
 *   3. Wait up to 60s for API response → ResultViewer shows
 *   4. Fill [data-testid="followup-input"] with >=5 chars
 *   5. Click [data-testid="followup-submit-btn"] → followup_started fires
 *
 *   followup_started fires synchronously in ResultViewer before calling
 *   onFollowUp, so no second-API-call wait is needed.
 *
 * Stage C rollout criteria (W129 playbook §3):
 *   Stage C may be enabled when Stage B criteria are met. No specific
 *   event threshold defined — this spec captures the signal to prove
 *   followup_continuity lane is healthy and W129 rollout is complete.
 *
 * Run:
 *   DASHSCOPE_API_KEY=<key> \
 *   NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
 *   NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true \
 *   NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true \
 *     npx playwright test tests/e2e/w129-stage-c-signal-capture.live.spec.ts
 *
 * Outputs:
 *   docs/reviews/CVF_W129_STAGE_C_SIGNAL_EVIDENCE_2026-04-28.md
 *   docs/reviews/CVF_W129_STAGE_C_SIGNAL_EVIDENCE_2026-04-28.json
 *
 * W129 Post-Closure Addendum §9
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
const ITERATION_MEMORY_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY === 'true';

const STAGE_C_FLAGS: NoncoderFlags = {
  intentFirstEnabled: true,
  clarificationLoopEnabled: true,
  iterationMemoryEnabled: true,
};

const EVIDENCE_MD_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_C_SIGNAL_EVIDENCE_2026-04-28.md',
);
const EVIDENCE_JSON_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_C_SIGNAL_EVIDENCE_2026-04-28.json',
);

/** 5 trusted form-route prompts — verified no wizard-trigger keywords */
const STAGE_C_JOURNEYS = [
  {
    prompt: 'Tôi cần đánh giá rủi ro khi triển khai quy trình mới tại công ty',
    topicValue: 'Quy trình triển khai mới',
  },
  {
    prompt: 'Soạn email giới thiệu dịch vụ tư vấn đến khách hàng tiềm năng',
    topicValue: 'Email giới thiệu dịch vụ',
  },
  {
    prompt: 'Phân tích đối thủ cạnh tranh trong lĩnh vực dịch vụ logistics',
    topicValue: 'Đối thủ logistics',
  },
  {
    prompt: 'Viết tài liệu hướng dẫn sử dụng cho nhân viên mới',
    topicValue: 'Hướng dẫn nhân viên mới',
  },
  {
    prompt: 'Định giá dịch vụ tư vấn cho khách hàng doanh nghiệp vừa và nhỏ',
    topicValue: 'Định giá dịch vụ SME',
  },
] as const;

function countByType(events: AnalyticsEvent[], type: AnalyticsEvent['type']): number {
  return events.filter((e) => e.type === type).length;
}

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('W129 Stage C signal capture — §9 Post-Closure Addendum', () => {
  test(
    'accumulates followup_started events and confirms followup_continuity lane health',
    { tag: ['@live', '@w129-stage-c'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'Stage C spec requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.skip(!INTENT_FIRST_ENABLED, 'Stage C spec requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'Stage C spec requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');

      test.setTimeout(480_000);

      await seedStorageWithAlibaba(page);
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
      });

      await login(page);

      type JourneyOutcome =
        | 'followup_submitted'
        | 'no_followup_section'
        | 'api_timeout'
        | 'form_not_found'
        | 'intent_entry_missing'
        | 'error';

      const journeyLog: Array<{
        prompt: string;
        outcome: JourneyOutcome;
        followupFired: boolean;
        detail?: string;
      }> = [];

      // ── Journey loop ──────────────────────────────────────────────────────

      for (const journey of STAGE_C_JOURNEYS) {
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);

        // 1. Find IntentEntry textarea
        const textarea = page.locator('textarea').first();
        if (!await textarea.isVisible().catch(() => false)) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'intent_entry_missing', followupFired: false, detail: 'IntentEntry textarea not visible' });
          continue;
        }

        // 2. Type prompt (strong-confidence form route)
        await textarea.fill(journey.prompt);
        await page.waitForTimeout(600);

        // 3. Wait for route preview and CTA to enable
        const ctaButton = page.locator('button').filter({ hasText: /Bắt đầu với governed path|Start with governed path/i }).first();
        const ctaEnabled = await ctaButton.isEnabled().catch(() => false);
        if (!ctaEnabled) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'intent_entry_missing', followupFired: false, detail: 'CTA disabled — no strong route match' });
          continue;
        }
        await ctaButton.click();
        await page.waitForTimeout(400);

        // 4. Wait for DynamicForm
        const firstTextInput = page.locator('input[type="text"]').first();
        const formVisible = await firstTextInput.isVisible().catch(() => false);
        if (!formVisible) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'form_not_found', followupFired: false, detail: 'DynamicForm input not visible after CTA click' });
          continue;
        }

        // 5. Fill all form inputs
        const allTextInputs = page.locator('input[type="text"]');
        const inputCount = await allTextInputs.count();
        for (let i = 0; i < inputCount; i++) {
          const inp = allTextInputs.nth(i);
          if (await inp.isVisible().catch(() => false)) {
            const v = await inp.inputValue().catch(() => '');
            if (!v) await inp.fill(i === 0 ? journey.topicValue : `Thông tin bổ sung ${i}`);
          }
        }
        const textareas = page.locator('textarea');
        const taCount = await textareas.count();
        for (let i = 0; i < taCount; i++) {
          const ta = textareas.nth(i);
          if (await ta.isVisible().catch(() => false)) {
            const v = await ta.inputValue().catch(() => '');
            if (!v) await ta.fill('Nội dung kiểm thử chi tiết cho trường này.');
          }
        }

        // 6. Submit form → execution_created fires
        await page.evaluate(() => {
          const form = document.querySelector('form');
          if (form) {
            try { form.requestSubmit(); } catch {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
          }
        });
        await page.waitForTimeout(500);

        // 7. Wait for ResultViewer (API call — up to 60s)
        const followupSection = page.locator('[data-testid="followup-section"]');
        let apiCompleted = false;
        try {
          await followupSection.waitFor({ state: 'visible', timeout: 60_000 });
          apiCompleted = true;
        } catch {
          journeyLog.push({ prompt: journey.prompt, outcome: 'api_timeout', followupFired: false, detail: 'API call did not complete within 60s' });
          continue;
        }

        if (!apiCompleted) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'no_followup_section', followupFired: false, detail: 'followup-section not visible after API' });
          continue;
        }

        // 8. Fill follow-up input (>= 5 chars required)
        const followupInput = page.locator('[data-testid="followup-input"]');
        await followupInput.fill('Vui lòng bổ sung thêm thông tin chi tiết hơn và mở rộng phân tích.');
        await page.waitForTimeout(200);

        // 9. Click submit → followup_started fires synchronously
        const followupBtn = page.locator('[data-testid="followup-submit-btn"]');
        const btnEnabled = await followupBtn.isEnabled().catch(() => false);
        if (!btnEnabled) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'no_followup_section', followupFired: false, detail: 'followup-submit-btn disabled' });
          continue;
        }
        await followupBtn.click();
        await page.waitForTimeout(800);

        journeyLog.push({ prompt: journey.prompt, outcome: 'followup_submitted', followupFired: true });
      }

      // ── Live governance proof ────────────────────────────────────────────────
      const { response, body } = await postLiveGovernedExecution(page, 'governance');
      expect([200, 400, 409, 422]).toContain(response.status());
      expect(body).toHaveProperty('governanceEvidenceReceipt');

      // ── Collect analytics ────────────────────────────────────────────────────
      await page.goto('/home');
      const events = await page.evaluate(() => {
        const raw = localStorage.getItem('cvf_analytics_events');
        return raw ? JSON.parse(raw) : [];
      }) as AnalyticsEvent[];

      const followupStartedCount = countByType(events, 'followup_started');
      const executionCreatedCount = countByType(events, 'execution_created');
      const intentRoutedCount = countByType(events, 'intent_routed');

      // ── Lane readout ─────────────────────────────────────────────────────────
      const readout = computeLaneReadout(events, STAGE_C_FLAGS);
      const followupLane = readout.find((l) => l.laneId === 'followup_continuity');
      const entryLane = readout.find((l) => l.laneId === 'entry_routing');
      const clarLane = readout.find((l) => l.laneId === 'clarification_recovery');

      const successJourneys = journeyLog.filter((j) => j.followupFired).length;

      // ── Rollout completion decision ───────────────────────────────────────────
      const allLanesHealthy = [followupLane, entryLane, clarLane].every(
        (l) => l?.status !== 'action_required'
      );
      const rolloutComplete = followupStartedCount >= 3 && allLanesHealthy;

      const rolloutDecision = rolloutComplete
        ? 'W129_ROLLOUT_COMPLETE — All 3 flags enabled, all measured lanes healthy, followup_started threshold met. W130 may be opened with fresh GC-018.'
        : followupStartedCount < 3
          ? `W129_ROLLOUT_PARTIAL — followup_started ${followupStartedCount}/3 (threshold not met)`
          : `W129_ROLLOUT_HOLD — one or more lanes in action_required`;

      // ── Evidence ──────────────────────────────────────────────────────────────
      const summary = {
        capturedAt: new Date().toISOString(),
        provider: 'alibaba / qwen-turbo',
        stage: 'Stage C signal capture — §9 Post-Closure Addendum',
        flags: {
          NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR: true,
          NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP: true,
          NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY: true,
        },
        attemptedJourneys: STAGE_C_JOURNEYS.length,
        successJourneys,
        liveExecutionStatus: response.status(),
        liveDecision: body.governanceEvidenceReceipt?.decision ?? null,
        rolloutDecision,
        rolloutComplete,
        eventCounts: {
          followup_started: followupStartedCount,
          execution_created: executionCreatedCount,
          intent_routed: intentRoutedCount,
        },
        laneReadout: {
          followup_continuity: followupLane ? { status: followupLane.status, metricValue: followupLane.metricValue, explanation: followupLane.explanation } : null,
          entry_routing: entryLane ? { status: entryLane.status, metricValue: entryLane.metricValue } : null,
          clarification_recovery: clarLane ? { status: clarLane.status, metricValue: clarLane.metricValue } : null,
        },
        journeyLog,
      };

      const markdown = [
        '<!-- Memory class: FULL_RECORD -->',
        '# CVF W129 Stage C Signal Evidence',
        '',
        `**Captured:** ${summary.capturedAt}`,
        `**Provider:** ${summary.provider}`,
        `**Stage:** ${summary.stage}`,
        '',
        '## Flag Posture (All Stages Enabled)',
        '',
        '| Flag | Value |',
        '|---|---|',
        '| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | `true` |',
        '| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | `true` |',
        '| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | `true` |',
        '',
        '## W129 Rollout Completion Decision',
        '',
        `**Decision:** ${rolloutDecision}`,
        '',
        '## Event Counts',
        '',
        '| Event | Count |',
        '|---|---|',
        `| followup_started | ${followupStartedCount} |`,
        `| execution_created (cumulative) | ${executionCreatedCount} |`,
        `| intent_routed | ${intentRoutedCount} |`,
        '',
        '## Lane Readout',
        '',
        '| Lane | Status | Metric |',
        '|---|---|---|',
        `| followup_continuity | ${followupLane?.status ?? 'n/a'} | ${followupLane?.metricValue ?? 'n/a'} |`,
        `| entry_routing | ${entryLane?.status ?? 'n/a'} | ${entryLane?.metricValue ?? 'n/a'} |`,
        `| clarification_recovery | ${clarLane?.status ?? 'n/a'} | ${clarLane?.metricValue ?? 'n/a'} |`,
        '',
        '## Journey Log',
        '',
        '| Prompt | Outcome | Follow-up Fired |',
        '|---|---|---|',
        ...journeyLog.map((j) => `| ${j.prompt.slice(0, 60)} | ${j.outcome} | ${j.followupFired ? '✅' : '❌'} |`),
        '',
        '## Live Governance Proof',
        '',
        '| Field | Value |',
        '|---|---|',
        `| HTTP Status | ${response.status()} |`,
        `| decision | ${body.governanceEvidenceReceipt?.decision ?? 'n/a'} |`,
        `| provider | ${body.governanceEvidenceReceipt?.provider ?? 'n/a'} |`,
        '',
        '## Continuation',
        '',
        rolloutComplete
          ? '- **W129 rollout is COMPLETE.** All 3 flags enabled and all measured lanes healthy.'
          : '- W129 rollout not yet complete — see rollout decision above.',
        rolloutComplete
          ? '- Next: open W130 with fresh GC-018 to start next tranche.'
          : '- Next: accumulate additional signal until criteria are met.',
        '',
      ].join('\n');

      mkdirSync(dirname(EVIDENCE_MD_PATH), { recursive: true });
      writeFileSync(EVIDENCE_MD_PATH, markdown, 'utf8');
      writeFileSync(EVIDENCE_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');

      console.log('[W129-stage-c] journey log:', JSON.stringify(journeyLog, null, 2));
      console.log(`[W129-stage-c] followup_started=${followupStartedCount}, followup_continuity=${followupLane?.status}, rollout=${rolloutDecision}`);

      expect(followupStartedCount).toBeGreaterThanOrEqual(3);
      expect(followupLane?.status).not.toBe('action_required');
    },
  );
});
