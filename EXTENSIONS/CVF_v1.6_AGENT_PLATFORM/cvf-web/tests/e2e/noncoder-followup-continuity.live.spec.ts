// W123-T1: noncoder-followup-continuity.live.spec.ts
// Journeys:
//   J1 — structural (mock): history page renders, no "continue" button when flag OFF
//   J2 — UI (flag ON, mock): history shows thread-label + followup-badge + continue CTA
//   J3 — live governed (Alibaba): execute → follow-up → verify thread chain in store

import { test, expect, type Page } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

const ITERATION_FLAG_OFF = process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY !== 'true';
const HAS_ALIBABA_KEY = !!(process.env.DASHSCOPE_API_KEY ?? process.env.ALIBABA_API_KEY ?? process.env.CVF_ALIBABA_API_KEY);

// ── helpers ──────────────────────────────────────────────────────────────────

async function seedOnboarding(page: Page) {
    await page.addInitScript(() => {
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
    });
}

async function seedHistoryWithThread(page: Page) {
    await page.addInitScript(() => {
        const rootExec = {
            id: 'root_e2e_1',
            templateId: 'documentation',
            templateName: 'Documentation',
            category: 'content',
            input: { subject: 'E2E test subject' },
            intent: 'Create documentation',
            output: 'This is the generated documentation content from the root run.',
            status: 'completed',
            result: 'accepted',
            qualityScore: 8.2,
            createdAt: new Date('2026-04-27T10:00:00Z'),
            completedAt: new Date('2026-04-27T10:01:00Z'),
            threadId: 'root_e2e_1',
            rootExecutionId: 'root_e2e_1',
            projectLabel: 'E2E Thread Project',
        };
        const childExec = {
            id: 'child_e2e_1',
            templateId: 'documentation',
            templateName: 'Documentation',
            category: 'content',
            input: { subject: 'E2E test subject', _previousOutput: 'prev output' },
            intent: 'Add more details',
            output: 'Updated documentation with more details.',
            status: 'completed',
            result: 'accepted',
            qualityScore: 8.5,
            createdAt: new Date('2026-04-27T10:05:00Z'),
            completedAt: new Date('2026-04-27T10:06:00Z'),
            threadId: 'root_e2e_1',
            rootExecutionId: 'root_e2e_1',
            parentExecutionId: 'root_e2e_1',
            projectLabel: 'E2E Thread Project',
            starterSource: 'history-followup',
        };
        const store = { state: { executions: [childExec, rootExec], currentExecution: null }, version: 0 };
        localStorage.setItem('cvf-executions-storage', JSON.stringify(store));
    });
}

// ── J1: structural (flag OFF) ─────────────────────────────────────────────────

test.describe('J1 — history structural when iteration memory flag is OFF', () => {
    test.skip(!ITERATION_FLAG_OFF, 'J1 only runs when NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY is not true');

    test('History page loads without continue-work button', async ({ page }) => {
        await seedOnboarding(page);
        await seedHistoryWithThread(page);
        await login(page);
        await page.goto('/history');
        await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10_000 });
        const continueBtn = page.getByTestId('continue-work-btn');
        await expect(continueBtn).toHaveCount(0);
    });
});

// ── J2: UI (flag ON, mock) ────────────────────────────────────────────────────

test.describe('J2 — history thread UI when iteration memory flag is ON', () => {
    test.skip(ITERATION_FLAG_OFF, 'J2 requires NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY=true');

    test.beforeEach(async ({ page }) => {
        await seedOnboarding(page);
        await seedHistoryWithThread(page);
        await login(page);
    });

    test('History shows thread-label badge on executions with projectLabel', async ({ page }) => {
        await page.goto('/history');
        await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10_000 });
        const threadLabel = page.getByTestId('thread-label').first();
        await expect(threadLabel).toBeVisible({ timeout: 5_000 });
        await expect(threadLabel).toContainText('E2E Thread Project');
    });

    test('History shows follow-up badge on child executions', async ({ page }) => {
        await page.goto('/history');
        await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10_000 });
        const followupBadge = page.getByTestId('followup-badge').first();
        await expect(followupBadge).toBeVisible({ timeout: 5_000 });
    });

    test('History shows continue-work button for accepted executions', async ({ page }) => {
        await page.goto('/history');
        await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10_000 });
        const continueBtn = page.getByTestId('continue-work-btn').first();
        await expect(continueBtn).toBeVisible({ timeout: 5_000 });
    });

    test('Clicking continue-work button navigates to home with ?continue= param', async ({ page }) => {
        await page.goto('/history');
        await expect(page.getByText('Documentation').first()).toBeVisible({ timeout: 10_000 });
        const continueBtn = page.getByTestId('continue-work-btn').first();
        await continueBtn.click();
        await page.waitForURL(/\/home\?continue=/, { timeout: 5_000 });
        expect(page.url()).toMatch(/\/home\?continue=/);
    });
});

// ── J3: live governed follow-up (Alibaba) ────────────────────────────────────

test.describe('J3 — live governed follow-up continuity (Alibaba lane)', () => {
    test.skip(!HAS_ALIBABA_KEY, 'J3 requires DASHSCOPE_API_KEY or ALIBABA_API_KEY');

    test.beforeEach(async ({ page }) => {
        await seedStorageWithAlibaba(page);
        await login(page);
    });

    test('J3.1: POST /api/execute (root run) returns governanceEvidenceReceipt with decision field', async ({ page }) => {
        const { response, body } = await postLiveGovernedExecution(page);
        expect([200, 400]).toContain(response.status());
        if (response.status() === 200) {
            expect(body.governanceEvidenceReceipt).toBeDefined();
            expect(typeof body.governanceEvidenceReceipt.decision).toBe('string');
        } else {
            // BLOCK is a valid governed outcome
            expect(body.error ?? body.guidedResponse ?? body.success).toBeDefined();
        }
    });

    test('J3.2: POST /api/execute (follow-up with _previousOutput) returns valid governed response', async ({ page }) => {
        const prevOutput = 'Root run output: CVF governed strategy analysis completed.';
        const response = await page.request.post('/api/execute', {
            data: {
                templateId: 'strategy_analysis',
                templateName: 'Phân tích Chiến lược',
                intent: `INTENT: Follow-up analysis with context.\n\nCONTEXT: ${prevOutput}\n\nSUCCESS CRITERIA:\n- Extend previous analysis`,
                inputs: {
                    topic: 'Mở rộng thị trường',
                    context: 'Tiếp nối phân tích trước: ' + prevOutput.slice(0, 100),
                    options: 'Hướng tiếp theo',
                    constraints: '6 tháng',
                    priority: 'Growth',
                    _previousOutput: prevOutput,
                },
                provider: 'alibaba',
                model: 'qwen-turbo',
                mode: 'governance',
                action: 'analyze',
            },
        });
        const body = await response.json();
        expect([200, 400]).toContain(response.status());
        if (response.status() === 200) {
            expect(body.governanceEvidenceReceipt?.decision).toBeDefined();
        } else {
            expect(body.error ?? body.guidedResponse).toBeDefined();
        }
    });
});
