/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    QuotaManager,
    DEFAULT_QUOTA_SETTINGS,
    setModelPricing,
    useQuotaManager,
} from './quota-manager';
import { DEFAULT_MODEL_PRICING } from './model-pricing';

const SETTINGS_KEY = 'cvf_quota_settings';
const USAGE_KEY = 'cvf_quota_usage';

describe('QuotaManager', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    beforeEach(() => {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(USAGE_KEY);
        setModelPricing(DEFAULT_MODEL_PRICING);
    });

    afterEach(() => {
        consoleErrorSpy.mockClear();
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

    it('returns ok when quota checks are disabled', () => {
        const manager = new QuotaManager();
        manager.updateSettings({
            ...DEFAULT_QUOTA_SETTINGS,
            enabled: false,
        });

        const status = manager.checkBudget();
        expect(status.ok).toBe(true);
        expect(status.warning).toBe(false);
        expect(status.remaining.daily).toBe(Infinity);
    });

    it('flags monthly budget exceeded when daily is still available', () => {
        const manager = new QuotaManager();
        manager.updateSettings({
            ...DEFAULT_QUOTA_SETTINGS,
            enabled: true,
            dailyBudget: 5,
            monthlyBudget: 0.5,
        });

        manager.trackUsage('openai', 'gpt-4o', 100000, 100000);
        const status = manager.checkBudget();
        expect(status.ok).toBe(false);
        expect(status.message).toMatch(/Monthly budget exceeded/i);
    });

    it('warns when monthly budget is nearly exhausted', () => {
        const manager = new QuotaManager();
        manager.updateSettings({
            ...DEFAULT_QUOTA_SETTINGS,
            enabled: true,
            dailyBudget: 0,
            monthlyBudget: 2,
        });

        manager.trackUsage('openai', 'gpt-4o', 100000, 150000);
        const status = manager.checkBudget();
        expect(status.ok).toBe(true);
        expect(status.warning).toBe(true);
        expect(status.message).toMatch(/Monthly budget nearly exhausted/i);
    });

    it('clears usage records and resets stats', () => {
        const manager = new QuotaManager();
        manager.trackUsage('gemini', 'gemini-2.5-flash', 1000, 2000);

        manager.clearUsage();
        const stats = manager.getStats();
        expect(stats.today.requests).toBe(0);
        expect(stats.byProvider.gemini.requests).toBe(0);
    });

    it('returns null when no enabled provider is available', () => {
        const manager = new QuotaManager();
        const next = manager.getNextProvider('gemini', []);
        expect(next).toBeNull();
    });

    it('handles invalid settings storage', () => {
        localStorage.setItem(SETTINGS_KEY, 'invalid-json');
        const manager = new QuotaManager();
        expect(manager.getSettings()).toEqual(DEFAULT_QUOTA_SETTINGS);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('handles invalid usage storage', () => {
        localStorage.setItem(USAGE_KEY, 'invalid-json');
        const manager = new QuotaManager();
        expect(manager.getStats().today.requests).toBe(0);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('loads stored settings when valid', () => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({
            dailyBudget: 4,
            fallbackEnabled: false,
        }));

        const manager = new QuotaManager();
        const settings = manager.getSettings();
        expect(settings.dailyBudget).toBe(4);
        expect(settings.fallbackEnabled).toBe(false);
    });

    it('resets settings to defaults', () => {
        const manager = new QuotaManager();
        manager.updateSettings({ dailyBudget: 5, monthlyBudget: 5 });
        manager.resetSettings();
        expect(manager.getSettings()).toEqual(DEFAULT_QUOTA_SETTINGS);
    });

    it('cleans up old usage records', () => {
        const now = Date.now();
        localStorage.setItem(USAGE_KEY, JSON.stringify([
            {
                id: 'old',
                date: '2025-11-01',
                timestamp: now - 61 * 24 * 60 * 60 * 1000,
                provider: 'gemini',
                model: 'gemini-2.5-flash',
                inputTokens: 100,
                outputTokens: 200,
                cost: 0.001,
            },
        ]));

        const manager = new QuotaManager();
        const stats = manager.getStats();
        expect(stats.today.requests).toBe(0);
    });

    it('saves settings to storage', () => {
        const manager = new QuotaManager();
        manager.updateSettings({ dailyBudget: 2 });
        const stored = localStorage.getItem(SETTINGS_KEY) || '';
        expect(stored).toContain('dailyBudget');
    });

    it('saves usage to storage', () => {
        const manager = new QuotaManager();
        manager.trackUsage('gemini', 'gemini-2.5-flash', 1000, 1000);
        const stored = localStorage.getItem(USAGE_KEY) || '';
        expect(stored).toContain('usage_');
    });

    it('handles storage write errors gracefully', () => {
        const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('fail');
        });

        const manager = new QuotaManager();
        expect(() => manager.updateSettings({ dailyBudget: 3 })).not.toThrow();
        expect(() => manager.trackUsage('openai', 'gpt-4o', 100, 100)).not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalled();

        setSpy.mockRestore();
    });

    it('useQuotaManager updates settings and tracks usage', () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => useQuotaManager());

        act(() => {
            result.current.updateSettings({ dailyBudget: 2 });
        });
        expect(result.current.settings.dailyBudget).toBe(2);

        act(() => {
            result.current.trackUsage('gemini', 'gemini-2.5-flash', 1000, 500);
        });
        expect(result.current.stats.today.requests).toBe(1);

        const budget = result.current.checkBudget();
        expect(budget).toHaveProperty('ok');

        act(() => {
            result.current.clearUsage();
        });
        expect(result.current.stats.today.requests).toBe(0);

        act(() => {
            result.current.resetSettings();
        });
        expect(result.current.settings).toEqual(DEFAULT_QUOTA_SETTINGS);

        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });
});
