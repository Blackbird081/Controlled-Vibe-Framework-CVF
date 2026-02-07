/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    QuotaManager,
    DEFAULT_QUOTA_SETTINGS,
    setModelPricing,
} from './quota-manager';
import { DEFAULT_MODEL_PRICING } from './model-pricing';

const SETTINGS_KEY = 'cvf_quota_settings';
const USAGE_KEY = 'cvf_quota_usage';

describe('QuotaManager', () => {
    beforeEach(() => {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(USAGE_KEY);
        setModelPricing(DEFAULT_MODEL_PRICING);
    });

    it('tracks usage and updates stats', () => {
        const manager = new QuotaManager();

        manager.trackUsage('gemini', 'gemini-2.5-flash', 1000, 2000);
        manager.trackUsage('openai', 'gpt-4o', 500, 500);

        const stats = manager.getStats();
        expect(stats.today.requests).toBe(2);
        expect(stats.byProvider.gemini.requests).toBe(1);
        expect(stats.byProvider.openai.requests).toBe(1);
        expect(stats.today.tokens).toBe(4000);
    });

    it('checks budget and flags overages', () => {
        const manager = new QuotaManager();
        manager.updateSettings({
            ...DEFAULT_QUOTA_SETTINGS,
            enabled: true,
            dailyBudget: 0.01,
            monthlyBudget: 0.01,
        });

        manager.trackUsage('openai', 'gpt-4o', 20000, 20000);

        const status = manager.checkBudget();
        expect(status.ok).toBe(false);
        expect(status.warning).toBe(true);
    });

    it('uses updated pricing when calculating cost', () => {
        setModelPricing({
            ...DEFAULT_MODEL_PRICING,
            'test-model': { input: 10, output: 20 },
        });

        const manager = new QuotaManager();
        const cost = manager.calculateCost('test-model', 1000, 1000);
        expect(cost).toBeCloseTo((1000 / 1_000_000) * 10 + (1000 / 1_000_000) * 20, 6);
    });

    it('returns next provider in fallback order', () => {
        const manager = new QuotaManager();
        const next = manager.getNextProvider('openai', ['gemini', 'openai', 'anthropic']);
        expect(next).toBe('anthropic');
    });

    it('wraps provider fallback order when needed', () => {
        const manager = new QuotaManager();
        const next = manager.getNextProvider('anthropic', ['gemini', 'openai']);
        expect(next).toBe('gemini');
    });

    it('returns null when fallback is disabled', () => {
        const manager = new QuotaManager();
        manager.updateSettings({ ...DEFAULT_QUOTA_SETTINGS, fallbackEnabled: false });
        const next = manager.getNextProvider('openai', ['gemini', 'openai', 'anthropic']);
        expect(next).toBeNull();
    });

    it('flags budget warning when nearing limit', () => {
        const manager = new QuotaManager();
        manager.updateSettings({
            ...DEFAULT_QUOTA_SETTINGS,
            enabled: true,
            dailyBudget: 1,
            monthlyBudget: 10,
        });

        manager.trackUsage('openai', 'gpt-4o', 0, 85000);

        const status = manager.checkBudget();
        expect(status.ok).toBe(true);
        expect(status.warning).toBe(true);
        expect(status.message).toMatch(/Budget warning/i);
    });

    it('clears usage records and resets stats', () => {
        const manager = new QuotaManager();
        manager.trackUsage('gemini', 'gemini-2.5-flash', 1000, 2000);

        manager.clearUsage();
        const stats = manager.getStats();
        expect(stats.today.requests).toBe(0);
        expect(stats.byProvider.gemini.requests).toBe(0);
    });
});
