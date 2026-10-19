import { test, expect } from '@playwright/test';
import { seedStorageWithAlibaba, login, postLiveGovernedExecution } from './utils';

// Text Encoding Exception: Vietnamese selectors verify the bilingual intake UI.
// Structural cases avoid AI calls; live cases use Alibaba only.
// API receipts and the direct client modal are distinct proof surfaces.

test.beforeEach(async ({ page }, testInfo) => {
    await seedStorageWithAlibaba(page,
        testInfo.title.startsWith('full-mode Idea Brief') ? 'qwen-flash' : 'qwen-plus');
});

test('landing page renders CVF value props and non-coder CTA', async ({ page }) => {
    await page.goto('/landing');

    await expect(page.locator('h1').first()).toBeVisible();

    await expect(
        page.getByRole('link', { name: /Xem templates|View templates/i }).first()
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: /EN|VI/i }).first()
    ).toBeVisible();
});

test('template gallery shows governed templates for non-coder', async ({ page }) => {
    await login(page);

    await expect(
        page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first()
    ).toBeVisible({ timeout: 30_000 });

    const linkCount = await page.getByRole('button').count();
    expect(linkCount).toBeGreaterThan(0);
});

test('intake wizard advances after project details — no AI call required', async ({ page }) => {
    await login(page);
    const strategyButton = page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first();
    await strategyButton.click();

    await expect(
        page.getByRole('heading', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first()
    ).toBeVisible({ timeout: 10_000 });
});

test('governance controls fire on real Alibaba AI response — L-008', async ({ page }) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'simple');

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enforcement).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(body.providerRouting?.selectedProvider).toBe('alibaba');
    expect(String(body.output ?? '').length).toBeGreaterThan(100);
    expect(String(body.output ?? '')).not.toContain('MOCK_');
});

test('full-mode API returns a governed live result and receipt', async ({ page }, testInfo) => {
    await login(page);
    const { response, body } = await postLiveGovernedExecution(page, 'full');

    await testInfo.attach('full-api-safe-status', {
        contentType: 'application/json',
        body: JSON.stringify({ httpStatus: response.status(), success: body.success,
            diagnostic: body.diagnostic ? { stage: body.diagnostic.stage, class: body.diagnostic.class,
                retryable: body.diagnostic.retryable, userAction: body.diagnostic.userAction } : null }),
    });

    expect(response.status()).toBe(200);
    expect(body.success).toBe(true);
    expect(body.enforcement).toBeDefined();
    expect(body.guardResult).toBeDefined();
    expect(body.providerRouting?.selectedProvider).toBe('alibaba');
    expect(body.enforcement.specGate?.status).toBe('PASS');
    expect(body.governanceEnvelope?.evidenceMode).toBe('live');
    expect(body.governanceEvidenceReceipt?.receiptId).toBeTruthy();
    expect(String(body.output ?? '').length).toBeGreaterThan(100);
    expect(String(body.output ?? '')).not.toContain('MOCK_');
    await testInfo.attach('full-api-safe-observation', {
        contentType: 'application/json',
        body: JSON.stringify({ surface: 'server_execute_full', httpStatus: response.status(),
            success: body.success, specGate: body.enforcement.specGate.status,
            provider: body.providerRouting.selectedProvider, outputLength: String(body.output).length,
            receiptId: body.governanceEvidenceReceipt.receiptId,
            providerAttemptReconciliation: body.providerAttemptReconciliation ?? null }),
    });
});

test('cold HTML template waits for hydration before opening the idea form', async ({ page, context }) => {
    await login(page);
    // Keep authentication cookies, but never assert against the warmed login
    // page while a second navigation is replacing its document. Hold all Next
    // script chunks so shared/layout modules cannot hydrate the card early.
    const coldPage = await context.newPage();
    await seedStorageWithAlibaba(coldPage);
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    let heldScripts = 0;
    await coldPage.route('**/_next/static/**', async route => {
        if (route.request().resourceType() === 'script') {
            heldScripts++;
            await held;
        }
        await route.continue();
    });
    let directRequests = 0;
    coldPage.on('request', request => {
        if (request.url().startsWith('https://dashscope-intl.aliyuncs.com/')
            && request.method() === 'POST') directRequests++;
    });
    const card = coldPage.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first();
    try {
        try {
            await coldPage.goto('/home', { waitUntil: 'commit' });
            await expect(card).toBeVisible();
            await expect(card).toBeDisabled();
            expect(heldScripts).toBeGreaterThan(0);
        } finally {
            release();
        }
        await expect(card).toBeEnabled();
        await card.click();
        await expect(coldPage.getByPlaceholder('VD: Mở rộng thị trường miền Trung')).toBeVisible();
        expect(directRequests).toBe(0);
    } finally {
        release();
        await coldPage.close();
    }
});

test('fallback login waits for session readiness before filling credentials', async ({ page }) => {
    // page.request is not intercepted by page routes; force only the helper's
    // first server-auth probe to use its normal browser fallback.
    const originalGet = page.request.get.bind(page.request);
    let probe = true;
    page.request.get = async (...args) => {
        if (probe && String(args[0]).endsWith('/api/auth/csrf')) {
            probe = false;
            return { ok: () => false } as Awaited<ReturnType<typeof originalGet>>;
        }
        return originalGet(...args);
    };
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/auth/session', async route => { await held; await route.continue(); });
    const pending = login(page);
    try {
        await expect(page.getByRole('button', { name: /Checking session|Đang kiểm tra phiên/i })).toBeDisabled();
        await expect(page.locator('input[type="text"][placeholder="admin"]')).toHaveValue('');
        await expect(page.locator('input[type="password"][placeholder="admin123"]')).toHaveValue('');
    } finally {
        release();
        await pending;
        page.request.get = originalGet;
    }
});

test('full-mode Idea Brief export reaches the client INTAKE gate on real Alibaba output', async ({ page }, testInfo) => {
    let directRequests = 0;
    page.on('request', request => {
        if (request.url().startsWith('https://dashscope-intl.aliyuncs.com/') && request.method() === 'POST') directRequests++;
    });
    // Refuse unexpected approval effects; this fixture only reads INTAKE output.
    page.on('dialog', dialog => dialog.dismiss());
    try {
    await login(page);
    await page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first().click();
    await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Ý tưởng kiểm thử INTAKE');
    await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill(
        'Synthetic review-only example: compare two ways to organize a small internal workshop. '
        + 'Return an INTAKE heading and at most 150 words: goal, assumptions, constraints and one material question. '
        + 'This is idea clarification, with no implementation or phase progression requested.'
    );
    await page.getByRole('button', { name: /Tạo Spec cho Agent|Create Agent Spec/i }).click({ timeout: 15_000 });
    await page.getByText('Hướng dẫn kèm theo cho agent', { exact: true }).click();
    await page.getByRole('button', { name: 'CVF Guided Agent', exact: true }).click();
    const send = page.getByRole('button', { name: 'Gửi Working Brief cho Agent INTAKE', exact: true });
    await expect(send).toBeDisabled();
    expect(directRequests).toBe(0);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Xác nhận ý tưởng và xuất cho agent', exact: true }).click();
    expect((await download).suggestedFilename()).toMatch(/-full\.md$/);
    await expect(send).toBeEnabled();
    expect(directRequests).toBe(0);
    const providerResponse = page.waitForResponse(response =>
        response.url().startsWith('https://dashscope-intl.aliyuncs.com/')
        && response.request().method() === 'POST', { timeout: 90_000 });
    await send.click();
    const response = await providerResponse;
    expect(response.status()).toBe(200);
    const payload = await response.text();
    const events = payload.split('\n').filter(line => line.startsWith('data: ') && !line.includes('[DONE]'))
        .map(line => JSON.parse(line.slice(6)));
    const finishReason = events.map(event => event.choices?.[0]?.finish_reason).filter(Boolean).at(-1);
    const outputLength = events.reduce((total, event) => total + String(event.choices?.[0]?.delta?.content ?? '').length, 0);
    expect(finishReason).toBe('stop');
    expect(outputLength).toBeGreaterThan(100);
    expect(response.request().postDataJSON().model).toBe('qwen-flash');
    await expect(page.getByRole('dialog', { name: /Kiểm tra giai đoạn|Phase gate check/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Phase 1: Tiếp nhận|Phase 1: Intake/i })).toBeVisible();
    expect(directRequests).toBe(1);
    await testInfo.attach('full-client-safe-observation', {
        contentType: 'application/json',
        body: JSON.stringify({ surface: 'direct_client_intake_modal', directRequests,
            provider: 'alibaba', model: 'qwen-flash', httpStatus: response.status(), finishReason,
            outputLength, ideaConfirmedBeforeSend: true, modalPhase: 'INTAKE', phaseApproved: false,
            claimBoundary: 'client_ui_only_not_server_receipt_or_phase_progression' }),
    });
    } finally {
        await testInfo.attach('full-client-request-count', {
            contentType: 'application/json',
            body: JSON.stringify({ directRequests, scope: 'observed_direct_alibaba_posts_only',
                phaseApproved: false }),
        });
    }
});
