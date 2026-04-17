import { Page } from '@playwright/test';

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
    await page.waitForURL('**/home', { timeout: 10000 });
}

export async function login(page: Page) {
    await loginAs(page, 'admin', 'admin123');
}

export async function openStrategyAnalysis(page: Page) {
    await page.getByRole('heading', { name: 'Strategy Analysis' }).click();
    await page.getByPlaceholder('VD: Mở rộng thị trường miền Trung').fill('Mở rộng thị trường miền Trung');
    await page.getByPlaceholder('Mô tả ngành, quy mô, thị trường...').fill('Bối cảnh kiểm thử E2E cho CVF v1.6');
    await page.getByRole('button', { name: /Export Spec/i }).click();
    await page.getByRole('button', { name: /Gửi đến Agent|Send to Agent/i }).waitFor();
}

export async function sendSpecToAgent(page: Page, mode: 'simple' | 'governance' | 'full') {
    if (mode === 'governance') {
        await page.getByRole('button', { name: /^⚠️/ }).click();
    }
    if (mode === 'full') {
        await page.getByRole('button', { name: /^🚦/ }).click();
    }
    await page.getByRole('button', { name: /Gửi đến Agent|Send to Agent/i }).click();
    await page.getByRole('heading', { name: 'CVF Agent' }).waitFor();
}
