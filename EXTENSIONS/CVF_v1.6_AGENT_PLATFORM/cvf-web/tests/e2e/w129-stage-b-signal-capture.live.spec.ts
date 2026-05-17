/**
 * w129-stage-b-signal-capture.live.spec.ts
 * W129 Post-Closure Addendum §8 — Stage B Clarification Loop Signal Capture
 *
 * Purpose:
 *   Enable NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true and accumulate
 *   >= 5 `clarification_question_asked` events via real browser-driven UI
 *   journeys that trigger the clarification loop.
 *   Evaluate Stage C enablement criteria per the W129 rollout playbook.
 *
 * Governance policy (AGENTS.md §Mandatory Live Governance Proof):
 *   Any claim about CVF governance behavior MUST use a real provider API call.
 *   Live lane: Alibaba qwen-turbo (DASHSCOPE_API_KEY / ALIBABA_API_KEY).
 *
 * Clarification journey strategy:
 *   Uses SHORT (<=5 char) vague inputs that produce weak_confidence from
 *   routeIntent(). Inputs of <=5 chars bypass the preview CTA-disable mechanism
 *   (handleChange only calls routeIntent when val.trim().length > 5), keeping
 *   the CTA enabled so handleStart() can fire the clarification loop.
 *   After CTA click: handleStart() detects weak_confidence, isClarificationLoopEnabled()
 *   returns true, clarification question + options rendered in amber box.
 *   Test clicks first option; handles route-recovered (DynamicForm) or browse-fallback.
 *
 * Stage C unlock criteria (W129 rollout playbook §3):
 *   1. clarification_question_asked >= 5
 *   2. clarification_recovery lane NOT action_required
 *
 * Run:
 *   DASHSCOPE_API_KEY=<key> NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
 *   NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true \
 *     npx playwright test w129-stage-b-signal-capture.live.spec.ts
 *
 * Outputs:
 *   docs/reviews/CVF_W129_STAGE_B_SIGNAL_EVIDENCE_2026-04-28.md
 *   docs/reviews/CVF_W129_STAGE_B_SIGNAL_EVIDENCE_2026-04-28.json
 *
 * W129 Post-Closure Addendum §8
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
const CLARIFICATION_ENABLED = process.env.NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP === 'true';

const STAGE_B_FLAGS: NoncoderFlags = {
  intentFirstEnabled: true,
  clarificationLoopEnabled: true,
  iterationMemoryEnabled: false,
};

/** Stage C criterion: >=5 clarification_question_asked events */
const STAGE_C_THRESHOLD = 5;

/**
 * Short (<=5 char trim length) vague inputs that guarantee weak_confidence.
 * These inputs do NOT match any wizard activation keyword or trusted-form
 * activation pattern, and are short enough that handleChange() does NOT
 * call routeIntent() (requires > 5 chars), so preview stays null and the
 * CTA button stays enabled — allowing handleStart() to run the clarification.
 */
const STAGE_B_JOURNEYS = [
  { input: 'help', desc: 'EN ambiguous short help' },
  { input: 'idea', desc: 'EN vague idea' },
  { input: 'goal', desc: 'EN vague goal' },
  { input: 'Giúp', desc: 'VN short help (4 chars)' },
  { input: 'work', desc: 'EN vague work' },
  { input: 'task', desc: 'EN vague task' },
  { input: 'plan', desc: 'EN ambiguous plan (no wizard match without context)' },
  { input: 'need', desc: 'EN vague need' },
] as const;

const EVIDENCE_MD_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_B_SIGNAL_EVIDENCE_2026-04-28.md',
);
const EVIDENCE_JSON_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W129_STAGE_B_SIGNAL_EVIDENCE_2026-04-28.json',
);

function countByType(events: AnalyticsEvent[], type: AnalyticsEvent['type']): number {
  return events.filter((e) => e.type === type).length;
}

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('W129 Stage B signal capture — §8 Post-Closure Addendum', () => {
  test(
    'accumulates >=5 clarification_question_asked events and evaluates Stage C readiness',
    { tag: ['@live', '@w129-stage-b'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'Stage B spec requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.skip(!INTENT_FIRST_ENABLED, 'Stage B spec requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!CLARIFICATION_ENABLED, 'Stage B spec requires NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true');

      test.setTimeout(300_000);

      // Seed localStorage before first navigation
      await seedStorageWithAlibaba(page);
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
      });

      await login(page);

      type JourneyOutcome =
        | 'clarify_then_route'
        | 'clarify_then_browse'
        | 'clarify_depth2_then_route'
        | 'clarify_depth2_then_browse'
        | 'no_clarification'
        | 'cta_disabled'
        | 'error';

      const journeyLog: Array<{
        input: string;
        desc: string;
        outcome: JourneyOutcome;
        clarificationFired: boolean;
        detail?: string;
      }> = [];

      // ── Journey loop ────────────────────────────────────────────────────────

      for (const journey of STAGE_B_JOURNEYS) {
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);

        const textarea = page.locator('textarea').first();
        const intentEntryVisible = await textarea.isVisible().catch(() => false);
        if (!intentEntryVisible) {
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'error', clarificationFired: false, detail: 'IntentEntry textarea not found' });
          continue;
        }

        await textarea.fill(journey.input);
        await page.waitForTimeout(350);

        // CTA must be enabled (short input means preview=null → ctaDisabled=false)
        const ctaButton = page.locator('button').filter({ hasText: /Bắt đầu với governed path|Start with governed path/i }).first();
        const ctaFound = await ctaButton.count() > 0;
        if (!ctaFound) {
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'error', clarificationFired: false, detail: 'CTA button not found — IntentEntry may not be rendering' });
          continue;
        }

        const ctaEnabled = await ctaButton.isEnabled().catch(() => false);
        if (!ctaEnabled) {
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'cta_disabled', clarificationFired: false, detail: 'CTA disabled — preview may have set weak confidence (input too long or preview triggered)' });
          continue;
        }

        await ctaButton.click();
        await page.waitForTimeout(500);

        // Check for clarification amber box
        const clarHeading = page.locator('text=/CVF cần thêm thông tin|CVF needs a bit more context/i');
        const hasClarification = await clarHeading.count() > 0;

        if (!hasClarification) {
          // Either strong-confidence route or browse fallback without clarification
          const formInput = page.locator('input[type="text"]').first();
          const formVisible = await formInput.isVisible().catch(() => false);
          journeyLog.push({
            input: journey.input,
            desc: journey.desc,
            outcome: formVisible ? 'clarify_then_route' : 'no_clarification',
            clarificationFired: false,
            detail: formVisible ? 'Routed directly without clarification question' : 'No clarification and no form — strong route or browse',
          });
          continue;
        }

        // Clarification question shown — click first option (depth 0)
        const optButtons = page.locator('.bg-amber-900\\/20 button, button.bg-amber-800\\/30');
        const optCount = await optButtons.count();
        if (optCount === 0) {
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'error', clarificationFired: true, detail: 'Clarification heading shown but no option buttons found' });
          continue;
        }

        await optButtons.first().click();
        await page.waitForTimeout(600);

        // After depth-0 answer: check outcomes
        const formInputD1 = page.locator('input[type="text"]').first();
        const formVisibleD1 = await formInputD1.isVisible().catch(() => false);
        const browseD1 = await page.locator('text=/Không thể xác định|Could not find a confident match/i').count() > 0;
        const clarD1 = await page.locator('text=/CVF cần thêm thông tin|CVF needs a bit more context/i').count() > 0;

        if (formVisibleD1) {
          // Route recovered — fill form and submit for execution_created
          const allTextInputs = page.locator('input[type="text"]');
          const inputCount = await allTextInputs.count();
          for (let i = 0; i < inputCount; i++) {
            const inp = allTextInputs.nth(i);
            if (await inp.isVisible().catch(() => false)) {
              const v = await inp.inputValue().catch(() => '');
              if (!v) await inp.fill(i === 0 ? `Test topic for ${journey.desc}` : `Test field ${i}`);
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
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) { try { form.requestSubmit(); } catch { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } }
          });
          await page.waitForTimeout(1000);
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'clarify_then_route', clarificationFired: true });
          continue;
        }

        if (browseD1) {
          journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'clarify_then_browse', clarificationFired: true });
          continue;
        }

        if (clarD1) {
          // Depth-1 clarification question — click first option
          const optD1 = page.locator('.bg-amber-900\\/20 button, button.bg-amber-800\\/30');
          if (await optD1.count() > 0) {
            await optD1.first().click();
            await page.waitForTimeout(600);
          }

          const formInputD2 = page.locator('input[type="text"]').first();
          const formVisibleD2 = await formInputD2.isVisible().catch(() => false);
          const browseD2 = await page.locator('text=/Không thể xác định|Could not find a confident match/i').count() > 0;

          if (formVisibleD2) {
            const allTextInputs = page.locator('input[type="text"]');
            const inputCount = await allTextInputs.count();
            for (let i = 0; i < inputCount; i++) {
              const inp = allTextInputs.nth(i);
              if (await inp.isVisible().catch(() => false)) {
                const v = await inp.inputValue().catch(() => '');
                if (!v) await inp.fill(i === 0 ? `Test topic for ${journey.desc}` : `Test field ${i}`);
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
            await page.evaluate(() => {
              const form = document.querySelector('form');
              if (form) { try { form.requestSubmit(); } catch { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } }
            });
            await page.waitForTimeout(1000);
            journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'clarify_depth2_then_route', clarificationFired: true });
          } else {
            journeyLog.push({ input: journey.input, desc: journey.desc, outcome: browseD2 ? 'clarify_depth2_then_browse' : 'clarify_then_browse', clarificationFired: true });
          }
          continue;
        }

        journeyLog.push({ input: journey.input, desc: journey.desc, outcome: 'no_clarification', clarificationFired: true, detail: 'Clicked option but no recognizable outcome after depth-0 answer' });
      }

      // ── Live governance proof ────────────────────────────────────────────────
      const { response, body } = await postLiveGovernedExecution(page, 'governance');
      expect([200, 400, 409, 422]).toContain(response.status());
      expect(body).toHaveProperty('governanceEvidenceReceipt');

      // ── Collect analytics from localStorage ─────────────────────────────────
      await page.goto('/home');
      const events = await page.evaluate(() => {
        const raw = localStorage.getItem('cvf_analytics_events');
        return raw ? JSON.parse(raw) : [];
      }) as AnalyticsEvent[];

      const clarQuestionsCount = countByType(events, 'clarification_question_asked');
      const clarAnsweredCount = countByType(events, 'clarification_answered');
      const clarRecoveredCount = countByType(events, 'clarification_route_recovered');
      const clarBrowseCount = countByType(events, 'clarification_browse_fallback');
      const clarWeakCount = countByType(events, 'clarification_weak_confidence_detected');
      const executionCreatedCount = countByType(events, 'execution_created');

      // ── Lane readout ─────────────────────────────────────────────────────────
      const readout = computeLaneReadout(events, STAGE_B_FLAGS);
      const clarRecoveryLane = readout.find((lane) => lane.laneId === 'clarification_recovery');
      const entryRoutingLane = readout.find((lane) => lane.laneId === 'entry_routing');

      // ── Stage C decision ──────────────────────────────────────────────────────
      const thresholdMet = clarQuestionsCount >= STAGE_C_THRESHOLD;
      const recoveryHealthy = clarRecoveryLane?.status !== 'action_required';
      const stageCMet = thresholdMet && recoveryHealthy;

      const stageCDecision = stageCMet
        ? 'STAGE_C_MAY_ENABLE — clarification_question_asked threshold met and clarification_recovery not action_required'
        : !thresholdMet
          ? `STAGE_C_HOLD — clarification_question_asked ${clarQuestionsCount}/${STAGE_C_THRESHOLD} (threshold not met)`
          : `STAGE_C_HOLD — clarification_recovery is ${clarRecoveryLane?.status ?? 'unknown'} (must not be action_required)`;

      const clarifiedJourneys = journeyLog.filter((j) => j.clarificationFired).length;
      const routeRecoveredJourneys = journeyLog.filter((j) =>
        j.outcome === 'clarify_then_route' || j.outcome === 'clarify_depth2_then_route'
      ).length;

      // ── Evidence summary ─────────────────────────────────────────────────────
      const summary = {
        capturedAt: new Date().toISOString(),
        provider: 'alibaba / qwen-turbo',
        stage: 'Stage B signal capture — §8 Post-Closure Addendum',
        attemptedJourneys: STAGE_B_JOURNEYS.length,
        clarifiedJourneys,
        routeRecoveredJourneys,
        liveExecutionStatus: response.status(),
        liveDecision: body.governanceEvidenceReceipt?.decision ?? null,
        stageCDecision,
        thresholdMet: stageCMet,
        eventCounts: {
          clarification_question_asked: clarQuestionsCount,
          clarification_answered: clarAnsweredCount,
          clarification_route_recovered: clarRecoveredCount,
          clarification_browse_fallback: clarBrowseCount,
          clarification_weak_confidence_detected: clarWeakCount,
          execution_created: executionCreatedCount,
        },
        clarificationRecovery: clarRecoveryLane
          ? {
              status: clarRecoveryLane.status,
              metricValue: clarRecoveryLane.metricValue,
              explanation: clarRecoveryLane.explanation,
              recommendation: clarRecoveryLane.recommendation,
            }
          : null,
        entryRouting: entryRoutingLane
          ? {
              status: entryRoutingLane.status,
              metricValue: entryRoutingLane.metricValue,
              explanation: entryRoutingLane.explanation,
            }
          : null,
        journeyLog,
      };

      // ── Markdown evidence ─────────────────────────────────────────────────────
      const markdown = [
        '<!-- Memory class: FULL_RECORD -->',
        '# CVF W129 Stage B Signal Evidence',
        '',
        `**Captured:** ${summary.capturedAt}`,
        `**Provider:** ${summary.provider}`,
        `**Stage:** ${summary.stage}`,
        '',
        '## Stage C Unlock Decision',
        '',
        `**Decision:** ${stageCDecision}`,
        '',
        `| Criterion | Value | Threshold | Met? |`,
        `|---|---|---|---|`,
        `| clarification_question_asked | ${clarQuestionsCount} | >= ${STAGE_C_THRESHOLD} | ${thresholdMet ? '✅' : '❌'} |`,
        `| clarification_recovery lane | ${clarRecoveryLane?.status ?? 'n/a'} | != action_required | ${recoveryHealthy ? '✅' : '❌'} |`,
        '',
        '## Event Counts',
        '',
        `| Event | Count |`,
        `|---|---|`,
        `| clarification_question_asked | ${clarQuestionsCount} |`,
        `| clarification_answered | ${clarAnsweredCount} |`,
        `| clarification_route_recovered | ${clarRecoveredCount} |`,
        `| clarification_browse_fallback | ${clarBrowseCount} |`,
        `| clarification_weak_confidence_detected | ${clarWeakCount} |`,
        `| execution_created (cumulative) | ${executionCreatedCount} |`,
        '',
        '## Journey Log',
        '',
        `| Input | Outcome | Clarification Fired |`,
        `|---|---|---|`,
        ...journeyLog.map((j) => `| \`${j.input}\` (${j.desc}) | ${j.outcome} | ${j.clarificationFired ? '✅' : '❌'} |`),
        '',
        '## Lane Readout',
        '',
        `| Lane | Status | Metric | Explanation |`,
        `|---|---|---|---|`,
        `| clarification_recovery | ${clarRecoveryLane?.status ?? 'n/a'} | ${clarRecoveryLane?.metricValue ?? 'n/a'} | ${clarRecoveryLane?.explanation ?? ''} |`,
        `| entry_routing | ${entryRoutingLane?.status ?? 'n/a'} | ${entryRoutingLane?.metricValue ?? 'n/a'} | ${entryRoutingLane?.explanation ?? ''} |`,
        '',
        '## Live Governance Proof',
        '',
        `| Field | Value |`,
        `|---|---|`,
        `| HTTP Status | ${response.status()} |`,
        `| decision | ${body.governanceEvidenceReceipt?.decision ?? 'n/a'} |`,
        `| provider | ${body.governanceEvidenceReceipt?.provider ?? 'n/a'} |`,
        '',
        '## Continuation Decision',
        '',
        stageCMet
          ? '- Stage C (`NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY`) may be enabled per W129 rollout playbook §3.'
          : '- Stage C remains deferred until Stage B signal criteria are met.',
        stageCMet
          ? '- Next: enable Stage C, run new evidence pass, then reassess W130.'
          : '- Next: continue Stage B traffic accumulation until threshold is met.',
        '',
      ].join('\n');

      mkdirSync(dirname(EVIDENCE_MD_PATH), { recursive: true });
      writeFileSync(EVIDENCE_MD_PATH, markdown, 'utf8');
      writeFileSync(EVIDENCE_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');

      console.log('[W129-stage-b] journey log:', JSON.stringify(journeyLog, null, 2));
      console.log(`[W129-stage-b] clarification_question_asked=${clarQuestionsCount}, clarification_recovery=${clarRecoveryLane?.status}, stageCDecision=${stageCDecision}`);

      expect(clarQuestionsCount).toBeGreaterThanOrEqual(STAGE_C_THRESHOLD);
      expect(clarRecoveryLane?.status).not.toBe('action_required');
    },
  );
});
