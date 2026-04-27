/**
 * w130-evidence-pack-export.live.spec.ts
 * W130-T1 CP3 — Evidence And Pack Export Activation Proof
 *
 * Purpose:
 *   Drive 3 noncoder journeys through IntentEntry → DynamicForm → live API
 *   → ResultViewer and interact with the W130 export nudge section to prove
 *   that `evidence_exported` and `deliverable_pack_exported` analytics events
 *   fire in the browser. Verify both W128 lanes exit `no_data`.
 *
 * Governance policy (AGENTS.md §Mandatory Live Governance Proof):
 *   Any claim about CVF governance behavior MUST use a real provider API call.
 *   Live lane: Alibaba qwen-turbo (DASHSCOPE_API_KEY / ALIBABA_API_KEY).
 *
 * Journey steps:
 *   1. IntentEntry → strong-confidence form route → CTA click → DynamicForm
 *   2. Fill all form fields → requestSubmit() → execution_created
 *   3. Wait up to 60s for API response → ResultViewer + export nudge appear
 *   4. Click [data-testid="nudge-copy-evidence-btn"] → evidence_exported fires
 *   5. Click [data-testid="nudge-download-pack-btn"] → deliverable_pack_exported fires
 *
 * W130 acceptance criteria (CP3):
 *   - At least 1 `evidence_exported` event per spec run
 *   - At least 1 `deliverable_pack_exported` event per spec run
 *   - `evidence_export` lane exits `no_data` in W128 readout
 *   - `deliverable_pack` lane exits `no_data` in W128 readout
 *   - Live `/api/execute` call confirmed (governanceEvidenceReceipt present)
 *
 * Run:
 *   DASHSCOPE_API_KEY=<key> \
 *   NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true \
 *   NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP=true \
 *   NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true \
 *     npx playwright test tests/e2e/w130-evidence-pack-export.live.spec.ts
 *
 * Outputs:
 *   docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.md
 *   docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.json
 *
 * W130-T1 CP3
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

const W130_FLAGS: NoncoderFlags = {
  intentFirstEnabled: true,
  clarificationLoopEnabled: true,
  iterationMemoryEnabled: true,
};

const EVIDENCE_MD_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.md',
);
const EVIDENCE_JSON_PATH = resolve(
  __dirname,
  '../../../../../docs/reviews/CVF_W130_EVIDENCE_PACK_EXPORT_EVIDENCE_2026-04-28.json',
);

/** 3 trusted form-route prompts — verified strong-confidence routing */
const W130_JOURNEYS = [
  {
    prompt: 'Soạn email giới thiệu dịch vụ tư vấn chiến lược đến khách hàng doanh nghiệp',
    topicValue: 'Email tư vấn chiến lược',
  },
  {
    prompt: 'Đánh giá rủi ro khi triển khai hệ thống CRM mới cho công ty',
    topicValue: 'Rủi ro triển khai CRM',
  },
  {
    prompt: 'Viết tài liệu hướng dẫn quy trình onboarding cho nhân viên mới',
    topicValue: 'Quy trình onboarding',
  },
] as const;

function countByType(events: AnalyticsEvent[], type: AnalyticsEvent['type']): number {
  return events.filter((e) => e.type === type).length;
}

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('W130-T1 CP3 — evidence and pack export activation proof', () => {
  test(
    'noncoder export nudge fires evidence_exported and deliverable_pack_exported; both lanes exit no_data',
    { tag: ['@live', '@w130-cp3'] },
    async ({ page }) => {
      test.skip(!HAS_ALIBABA_KEY, 'W130 CP3 requires DASHSCOPE_API_KEY / ALIBABA_API_KEY');
      test.skip(!INTENT_FIRST_ENABLED, 'W130 CP3 requires NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR=true');
      test.skip(!ITERATION_MEMORY_ENABLED, 'W130 CP3 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');

      test.setTimeout(480_000);

      await seedStorageWithAlibaba(page);
      await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
      });

      await login(page);

      type JourneyOutcome =
        | 'both_exports_fired'
        | 'pack_only_fired'
        | 'evidence_only_fired'
        | 'nudge_not_visible'
        | 'api_timeout'
        | 'form_not_found'
        | 'intent_entry_missing'
        | 'error';

      const journeyLog: Array<{
        prompt: string;
        outcome: JourneyOutcome;
        evidenceFired: boolean;
        packFired: boolean;
        detail?: string;
      }> = [];

      // ── Journey loop ──────────────────────────────────────────────────────

      for (const journey of W130_JOURNEYS) {
        await page.goto('/home');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(400);

        // 1. Find IntentEntry textarea
        const textarea = page.locator('textarea').first();
        if (!await textarea.isVisible().catch(() => false)) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'intent_entry_missing', evidenceFired: false, packFired: false, detail: 'IntentEntry textarea not visible' });
          continue;
        }

        // 2. Type prompt (strong-confidence form route)
        await textarea.fill(journey.prompt);
        await page.waitForTimeout(600);

        // 3. Wait for route preview CTA to enable
        const ctaButton = page.locator('button').filter({ hasText: /Bắt đầu với governed path|Start with governed path/i }).first();
        const ctaEnabled = await ctaButton.isEnabled().catch(() => false);
        if (!ctaEnabled) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'intent_entry_missing', evidenceFired: false, packFired: false, detail: 'CTA disabled — no strong route match' });
          continue;
        }
        await ctaButton.click();
        await page.waitForTimeout(400);

        // 4. Wait for DynamicForm
        const firstTextInput = page.locator('input[type="text"]').first();
        const formVisible = await firstTextInput.isVisible().catch(() => false);
        if (!formVisible) {
          journeyLog.push({ prompt: journey.prompt, outcome: 'form_not_found', evidenceFired: false, packFired: false, detail: 'DynamicForm input not visible after CTA click' });
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

        // 7. Wait for export nudge section to appear (API completes → ResultViewer renders)
        const exportNudge = page.locator('[data-testid="noncoder-export-nudge"]');
        try {
          await exportNudge.waitFor({ state: 'visible', timeout: 60_000 });
        } catch {
          journeyLog.push({ prompt: journey.prompt, outcome: 'api_timeout', evidenceFired: false, packFired: false, detail: 'Export nudge did not appear within 60s (API timeout)' });
          continue;
        }

        // 8. Click evidence copy button (fires evidence_exported)
        let evidenceFired = false;
        const copyEvidenceBtn = page.locator('[data-testid="nudge-copy-evidence-btn"]');
        if (await copyEvidenceBtn.isVisible().catch(() => false)) {
          await copyEvidenceBtn.click();
          await page.waitForTimeout(300);
          evidenceFired = true;
        }

        // 9. Click pack download button (fires deliverable_pack_exported)
        let packFired = false;
        const downloadPackBtn = page.locator('[data-testid="nudge-download-pack-btn"]');
        if (await downloadPackBtn.isVisible().catch(() => false)) {
          // Handle potential file download dialog without failing
          const downloadPromise = page.waitForEvent('download', { timeout: 5_000 }).catch(() => null);
          await downloadPackBtn.click();
          await downloadPromise;
          await page.waitForTimeout(300);
          packFired = true;
        }

        const outcome: JourneyOutcome =
          evidenceFired && packFired ? 'both_exports_fired' :
          packFired ? 'pack_only_fired' :
          evidenceFired ? 'evidence_only_fired' : 'nudge_not_visible';

        journeyLog.push({ prompt: journey.prompt, outcome, evidenceFired, packFired });
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

      const evidenceExportedCount = countByType(events, 'evidence_exported');
      const packExportedCount = countByType(events, 'deliverable_pack_exported');
      const executionCreatedCount = countByType(events, 'execution_created');

      // ── Lane readout ─────────────────────────────────────────────────────────
      const readout = computeLaneReadout(events, W130_FLAGS);
      const evidenceLane = readout.find((l) => l.laneId === 'evidence_export');
      const packLane = readout.find((l) => l.laneId === 'deliverable_pack');
      const entryLane = readout.find((l) => l.laneId === 'entry_routing');

      const successJourneys = journeyLog.filter((j) => j.packFired || j.evidenceFired).length;

      // ── W130 CP4 lane exit decision ───────────────────────────────────────────
      const evidenceLaneExited = evidenceLane?.status !== 'no_data';
      const packLaneExited = packLane?.status !== 'no_data';
      const bothLanesExited = evidenceLaneExited && packLaneExited;

      const w130Decision = bothLanesExited
        ? 'W130_CP4_PASS — both evidence_export and deliverable_pack lanes exited no_data'
        : !evidenceLaneExited && !packLaneExited
          ? 'W130_CP4_FAIL — both lanes still no_data (no export events fired)'
          : `W130_CP4_PARTIAL — evidence_export=${evidenceLane?.status ?? 'n/a'}, deliverable_pack=${packLane?.status ?? 'n/a'}`;

      // ── Evidence files ────────────────────────────────────────────────────────
      const summary = {
        capturedAt: new Date().toISOString(),
        provider: 'alibaba / qwen-turbo',
        tranche: 'W130-T1 CP3 — Evidence And Pack Export Activation Proof',
        flags: {
          NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR: true,
          NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP: true,
          NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY: true,
        },
        attemptedJourneys: W130_JOURNEYS.length,
        successJourneys,
        liveExecutionStatus: response.status(),
        liveDecision: body.governanceEvidenceReceipt?.decision ?? null,
        w130Decision,
        bothLanesExited,
        eventCounts: {
          evidence_exported: evidenceExportedCount,
          deliverable_pack_exported: packExportedCount,
          execution_created: executionCreatedCount,
        },
        laneReadout: {
          evidence_export: evidenceLane ? { status: evidenceLane.status, metricValue: evidenceLane.metricValue } : null,
          deliverable_pack: packLane ? { status: packLane.status, metricValue: packLane.metricValue } : null,
          entry_routing: entryLane ? { status: entryLane.status, metricValue: entryLane.metricValue } : null,
        },
        journeyLog,
      };

      const markdown = [
        '<!-- Memory class: FULL_RECORD -->',
        '# CVF W130-T1 Evidence And Pack Export Evidence',
        '',
        `**Captured:** ${summary.capturedAt}`,
        `**Provider:** ${summary.provider}`,
        `**Tranche:** ${summary.tranche}`,
        '',
        '## Flag Posture',
        '',
        '| Flag | Value |',
        '|---|---|',
        '| `NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR` | `true` |',
        '| `NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP` | `true` |',
        '| `NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY` | `true` |',
        '',
        '## W130 CP4 Lane Exit Decision',
        '',
        `**Decision:** ${w130Decision}`,
        '',
        '## Export Event Counts',
        '',
        '| Event | Count |',
        '|---|---|',
        `| evidence_exported | ${evidenceExportedCount} |`,
        `| deliverable_pack_exported | ${packExportedCount} |`,
        `| execution_created (cumulative) | ${executionCreatedCount} |`,
        '',
        '## Lane Readout',
        '',
        '| Lane | Status | Metric |',
        '|---|---|---|',
        `| evidence_export | ${evidenceLane?.status ?? 'n/a'} | ${evidenceLane?.metricValue ?? 'n/a'} |`,
        `| deliverable_pack | ${packLane?.status ?? 'n/a'} | ${packLane?.metricValue ?? 'n/a'} |`,
        `| entry_routing | ${entryLane?.status ?? 'n/a'} | ${entryLane?.metricValue ?? 'n/a'} |`,
        '',
        '## Journey Log',
        '',
        '| Prompt | Outcome | Evidence Fired | Pack Fired |',
        '|---|---|---|---|',
        ...journeyLog.map((j) => `| ${j.prompt.slice(0, 55)} | ${j.outcome} | ${j.evidenceFired ? '✅' : '❌'} | ${j.packFired ? '✅' : '❌'} |`),
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
        bothLanesExited
          ? '- **W130-T1 CP3+CP4 PASS.** Both `evidence_export` and `deliverable_pack` lanes exited `no_data`. W130 CP5 (handoff + GC-026) may proceed.'
          : '- W130-T1 CP3+CP4 NOT YET COMPLETE — see lane exit decision above.',
        '',
      ].join('\n');

      mkdirSync(dirname(EVIDENCE_MD_PATH), { recursive: true });
      writeFileSync(EVIDENCE_MD_PATH, markdown, 'utf8');
      writeFileSync(EVIDENCE_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');

      console.log('[W130-cp3] journey log:', JSON.stringify(journeyLog, null, 2));
      console.log(`[W130-cp3] evidence_exported=${evidenceExportedCount}, deliverable_pack_exported=${packExportedCount}`);
      console.log(`[W130-cp3] evidence_export=${evidenceLane?.status}, deliverable_pack=${packLane?.status}`);
      console.log(`[W130-cp3] ${w130Decision}`);

      // CP3 acceptance: at least 1 of each event
      expect(evidenceExportedCount).toBeGreaterThanOrEqual(1);
      expect(packExportedCount).toBeGreaterThanOrEqual(1);

      // CP4 acceptance: both lanes exit no_data
      expect(evidenceLane?.status).not.toBe('no_data');
      expect(packLane?.status).not.toBe('no_data');
    },
  );
});
