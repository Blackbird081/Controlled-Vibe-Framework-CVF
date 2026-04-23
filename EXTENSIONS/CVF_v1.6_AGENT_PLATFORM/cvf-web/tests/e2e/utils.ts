import { expect, Page } from '@playwright/test';

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
    }, DEFAULT_SETTINGS);
}

export async function loginAs(page: Page, username: string, password: string) {
    await page.goto('/login');
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

    await page.getByRole('button', { name: /Đăng nhập/i }).click();
    await expect(page.getByRole('heading', { name: /Templates/i }).first()).toBeVisible({ timeout: 15_000 });
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
                alibaba: { apiKey: k, enabled: true, selectedModel: 'qwen-turbo' },
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
    const response = await page.request.post('/api/execute', {
        data: {
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
        },
    });

    const body = await response.json();
    return { response, body };
}
