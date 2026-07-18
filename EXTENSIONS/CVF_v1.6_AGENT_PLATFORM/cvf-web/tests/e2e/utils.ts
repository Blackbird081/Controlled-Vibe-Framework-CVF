import { expect, Page } from '@playwright/test';
import { createHmac } from 'node:crypto';

const DEFAULT_SETTINGS = {
    providers: {
        gemini: { apiKey: 'mock-key', enabled: true, selectedModel: 'gemini-2.5-flash' },
        openai: { apiKey: '', enabled: false, selectedModel: 'gpt-4o' },
        anthropic: { apiKey: '', enabled: false, selectedModel: 'claude-sonnet-4-20250514' },
    },
    preferences: {
        defaultProvider: 'gemini',
        defaultExportMode: 'simple',
        defaultLanguage: 'vi',
        autoSaveHistory: true,
        showWelcomeTour: false,
    },
};

export async function seedStorage(page: Page) {
    await page.addInitScript((settings) => {
        localStorage.setItem('cvf_settings', JSON.stringify(settings));
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
    }, DEFAULT_SETTINGS);
}

async function signInViaNextAuth(page: Page, username: string, password: string): Promise<boolean> {
    const csrfResponse = await page.request.get('/api/auth/csrf');
    if (!csrfResponse.ok()) return false;

    const csrfBody = await csrfResponse.json() as { csrfToken?: string };
    if (!csrfBody.csrfToken) return false;

    const signInResponse = await page.request.post('/api/auth/callback/credentials?redirect=false', {
        form: {
            username,
            password,
            csrfToken: csrfBody.csrfToken,
            callbackUrl: '/home',
            json: 'true',
        },
    });
    if (!signInResponse.ok()) return false;

    const sessionResponse = await page.request.get('/api/auth/session');
    if (!sessionResponse.ok()) return false;

    const sessionBody = await sessionResponse.json() as { user?: unknown };
    return Boolean(sessionBody.user);
}

export async function loginAs(page: Page, username: string, password: string) {
    const signedIn = await signInViaNextAuth(page, username, password);
    if (signedIn) {
        await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 15_000 });
        await expect(page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first()).toBeVisible({ timeout: 15_000 });
        return;
    }

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 15_000 });
    await page.locator('input[type="text"][placeholder="admin"]').fill('admin');
    await page.locator('input[type="password"][placeholder="admin123"]').fill('admin123');
    await page.locator('input[type="text"][placeholder="admin"]').fill(username);
    await page.locator('input[type="password"][placeholder="admin123"]').fill(password);

    // Role select is optional — some login forms don't have it
    const roleSelect = page.locator('select');
    const selectCount = await roleSelect.count();
    if (selectCount > 0) {
        await roleSelect.first().selectOption('admin');
    }

    const loginButton = page.getByRole('button', { name: /Đăng nhập|Dang nhap|Sign in/i }).first();
    await loginButton.click({ timeout: 10_000 }).catch(async () => {
        await page.locator('input[type="password"][placeholder="admin123"]').press('Enter');
    });
    await expect(page.getByRole('button', { name: /Phân tích Chiến lược|Strategy Analysis/i }).first()).toBeVisible({ timeout: 15_000 });
}

export async function login(page: Page) {
    await loginAs(page, 'admin', 'admin123');
}

export async function openStrategyAnalysis(page: Page) {
    await page.goto('/home');
    const strategyButton = page.getByRole('button', { name: /Strategy Analysis|Phân tích Chiến lược|Chiến lược/i }).first();
    await strategyButton.waitFor({ state: 'visible', timeout: 10_000 });
    await strategyButton.click();
    await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Mở rộng thị trường miền Trung');
    await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill('Bối cảnh kiểm thử E2E cho CVF v1.6');
    await page.getByRole('button', { name: /Gửi đi|Submit/i }).click();
    await page.getByRole('button', { name: /Gửi đến Agent|Send to Agent/i }).waitFor();
}

export async function sendSpecToAgent(page: Page, mode: 'simple' | 'governance' | 'full') {
    if (mode === 'simple') {
        await page.getByRole('button', { name: /^📝/ }).click();
    }
    if (mode === 'governance') {
        await page.getByRole('button', { name: /^⚠️/ }).click();
    }
    if (mode === 'full') {
        await page.getByRole('button', { name: /^🚦/ }).click();
    }
    await page.getByRole('button', { name: /Gửi đến Agent|Send to Agent/i }).click();
    await page.getByRole('heading', { name: 'CVF Agent' }).waitFor();
}

export async function seedStorageWithAlibaba(page: Page) {
    const key = process.env.DASHSCOPE_API_KEY ?? '';
    await page.addInitScript((k) => {
        localStorage.setItem('cvf_settings', JSON.stringify({
            providers: {
                alibaba: { apiKey: k, enabled: true, selectedModel: 'qwen-plus' },
            },
            preferences: {
                defaultProvider: 'alibaba',
                defaultLanguage: 'vi',
                autoSaveHistory: true,
                showWelcomeTour: false,
            },
        }));
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
    }, key);
}

export async function seedStorageWithDeepSeek(page: Page) {
    const key = process.env.DEEPSEEK_API_KEY ?? '';
    await page.addInitScript((k) => {
        localStorage.setItem('cvf_settings', JSON.stringify({
            providers: {
                deepseek: { apiKey: k, enabled: true, selectedModel: 'deepseek-chat' },
            },
            preferences: {
                defaultProvider: 'deepseek',
                defaultLanguage: 'vi',
                autoSaveHistory: true,
                showWelcomeTour: false,
            },
        }));
        localStorage.setItem('cvf_onboarding_complete', 'true');
        localStorage.setItem('cvf_onboarding_seen', '1');
        localStorage.setItem('cvf_setup_banner_dismissed', 'true');
    }, key);
}

export async function openSettingsModal(page: Page) {
    await page.goto('/home');
    const settingsButton = page.getByRole('button', { name: /Cài đặt|Settings/i }).last();
    await settingsButton.waitFor({ state: 'visible', timeout: 10_000 });
    await settingsButton.click();
    await expect(page.getByRole('heading', { name: /Cài đặt|Settings/i })).toBeVisible({ timeout: 10_000 });
}

export async function postLiveGovernedExecution(page: Page, mode: 'simple' | 'governance' | 'full' = 'governance') {
    const payload = {
        templateId: 'strategy_analysis',
        templateName: 'Phân tích Chiến lược',
        intent: `INTENT:
Tôi muốn phân tích chiến lược mở rộng thị trường miền Trung.

CONTEXT:
Công ty bán phần mềm quản lý kho cho doanh nghiệp vừa và nhỏ tại Việt Nam.

OPTIONS:
1. Mở đội sales tại Đà Nẵng
2. Hợp tác reseller địa phương
3. Chạy chiến dịch online trước khi tuyển đội sales

CONSTRAINTS:
Ngân sách tối đa 300 triệu VND, cần kết quả trong 6 tháng.

SUCCESS CRITERIA:
- Phân tích rõ ưu/nhược điểm
- Xác định rủi ro chính
- Đưa ra khuyến nghị có căn cứ`,
        inputs: {
            topic: 'Mở rộng thị trường miền Trung',
            context: 'Công ty bán phần mềm quản lý kho cho SME Việt Nam.',
            options: 'Mở đội sales tại Đà Nẵng\nHợp tác reseller\nChạy online trước',
            constraints: 'Ngân sách 300 triệu VND, 6 tháng',
            priority: 'Growth',
        },
        provider: 'alibaba',
        model: 'qwen-turbo',
        mode,
        action: 'analyze',
    };

    const rawBody = JSON.stringify(payload);
    const serviceToken = process.env.CVF_SERVICE_TOKEN ?? '';
    const timestamp = String(Date.now());
    const serviceHeaders: Record<string, string> = { 'content-type': 'application/json' };
    if (serviceToken) {
        serviceHeaders['x-cvf-service-token'] = serviceToken;
        serviceHeaders['x-cvf-service-timestamp'] = timestamp;
        serviceHeaders['x-cvf-service-signature'] = createHmac('sha256', serviceToken).update(`${timestamp}.${rawBody}`).digest('hex');
    }

    const response = await page.request.post('/api/execute', {
        data: rawBody,
        headers: serviceHeaders,
    });

    const body = await response.json();
    return { response, body };
}
