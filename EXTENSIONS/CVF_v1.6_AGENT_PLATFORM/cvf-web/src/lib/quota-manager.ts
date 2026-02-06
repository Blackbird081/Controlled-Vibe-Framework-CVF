'use client';

// ==================== TYPES ====================
export type ProviderKey = 'gemini' | 'openai' | 'anthropic';

export interface QuotaSettings {
    enabled: boolean;
    dailyBudget: number;      // USD, 0 = unlimited
    monthlyBudget: number;    // USD, 0 = unlimited
    fallbackEnabled: boolean;
    fallbackOrder: ProviderKey[];
    maxTokensPerRequest: number;  // 0 = unlimited
}

export interface UsageRecord {
    id: string;
    date: string;             // YYYY-MM-DD
    timestamp: number;
    provider: ProviderKey;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;             // USD
}

export interface UsageStats {
    today: { tokens: number; cost: number; requests: number };
    month: { tokens: number; cost: number; requests: number };
    byProvider: Record<ProviderKey, { tokens: number; cost: number; requests: number }>;
}

// ==================== MODEL PRICING ====================
// Prices per 1M tokens (USD)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    // Gemini
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-3-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash-lite': { input: 0.02, output: 0.08 },
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    // OpenAI
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4.5-preview': { input: 75.00, output: 150.00 },
    'o1': { input: 15.00, output: 60.00 },
    'o3-mini': { input: 1.10, output: 4.40 },
    // Anthropic
    'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
    'claude-3.5-haiku': { input: 0.80, output: 4.00 },
    'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
};

// Default pricing for unknown models
const DEFAULT_PRICING = { input: 1.00, output: 4.00 };

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
    settings: 'cvf_quota_settings',
    usage: 'cvf_quota_usage',
};

// ==================== DEFAULT SETTINGS ====================
export const DEFAULT_QUOTA_SETTINGS: QuotaSettings = {
    enabled: true,
    dailyBudget: 0,           // Unlimited by default
    monthlyBudget: 0,         // Unlimited by default
    fallbackEnabled: true,
    fallbackOrder: ['gemini', 'openai', 'anthropic'],
    maxTokensPerRequest: 0,   // Unlimited
};

// ==================== QUOTA MANAGER CLASS ====================
export class QuotaManager {
    private settings: QuotaSettings;
    private usageRecords: UsageRecord[];

    constructor() {
        this.settings = this.loadSettings();
        this.usageRecords = this.loadUsage();
        this.cleanupOldRecords();
    }

    // ==================== SETTINGS ====================
    private loadSettings(): QuotaSettings {
        if (typeof window === 'undefined') return DEFAULT_QUOTA_SETTINGS;
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.settings);
            if (stored) {
                return { ...DEFAULT_QUOTA_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.error('Failed to load quota settings:', e);
        }
        return DEFAULT_QUOTA_SETTINGS;
    }

    private saveSettings(): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save quota settings:', e);
        }
    }

    getSettings(): QuotaSettings {
        return { ...this.settings };
    }

    updateSettings(updates: Partial<QuotaSettings>): void {
        this.settings = { ...this.settings, ...updates };
        this.saveSettings();
    }

    // ==================== USAGE RECORDS ====================
    private loadUsage(): UsageRecord[] {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.usage);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load usage records:', e);
        }
        return [];
    }

    private saveUsage(): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEYS.usage, JSON.stringify(this.usageRecords));
        } catch (e) {
            console.error('Failed to save usage records:', e);
        }
    }

    private cleanupOldRecords(): void {
        // Keep only last 60 days of records
        const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
        const before = this.usageRecords.length;
        this.usageRecords = this.usageRecords.filter(r => r.timestamp > cutoff);
        if (this.usageRecords.length < before) {
            this.saveUsage();
        }
    }

    // ==================== COST CALCULATION ====================
    calculateCost(model: string, inputTokens: number, outputTokens: number): number {
        const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;
        const inputCost = (inputTokens / 1_000_000) * pricing.input;
        const outputCost = (outputTokens / 1_000_000) * pricing.output;
        return inputCost + outputCost;
    }

    // ==================== TRACK USAGE ====================
    trackUsage(
        provider: ProviderKey,
        model: string,
        inputTokens: number,
        outputTokens: number
    ): UsageRecord {
        const now = new Date();
        const record: UsageRecord = {
            id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
            provider,
            model,
            inputTokens,
            outputTokens,
            cost: this.calculateCost(model, inputTokens, outputTokens),
        };
        this.usageRecords.push(record);
        this.saveUsage();
        return record;
    }

    // ==================== GET STATISTICS ====================
    getStats(): UsageStats {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats: UsageStats = {
            today: { tokens: 0, cost: 0, requests: 0 },
            month: { tokens: 0, cost: 0, requests: 0 },
            byProvider: {
                gemini: { tokens: 0, cost: 0, requests: 0 },
                openai: { tokens: 0, cost: 0, requests: 0 },
                anthropic: { tokens: 0, cost: 0, requests: 0 },
            },
        };

        for (const record of this.usageRecords) {
            const tokens = record.inputTokens + record.outputTokens;

            // By provider (all time - last 60 days)
            stats.byProvider[record.provider].tokens += tokens;
            stats.byProvider[record.provider].cost += record.cost;
            stats.byProvider[record.provider].requests += 1;

            // Today
            if (record.date === todayStr) {
                stats.today.tokens += tokens;
                stats.today.cost += record.cost;
                stats.today.requests += 1;
            }

            // This month
            if (record.timestamp >= monthStart.getTime()) {
                stats.month.tokens += tokens;
                stats.month.cost += record.cost;
                stats.month.requests += 1;
            }
        }

        return stats;
    }

    // ==================== BUDGET CHECK ====================
    checkBudget(): { ok: boolean; warning: boolean; message?: string; remaining: { daily: number; monthly: number } } {
        if (!this.settings.enabled) {
            return { ok: true, warning: false, remaining: { daily: Infinity, monthly: Infinity } };
        }

        const stats = this.getStats();
        const dailyRemaining = this.settings.dailyBudget > 0
            ? this.settings.dailyBudget - stats.today.cost
            : Infinity;
        const monthlyRemaining = this.settings.monthlyBudget > 0
            ? this.settings.monthlyBudget - stats.month.cost
            : Infinity;

        // Check if exceeded
        if (dailyRemaining <= 0) {
            return {
                ok: false,
                warning: true,
                message: 'Daily budget exceeded',
                remaining: { daily: 0, monthly: Math.max(0, monthlyRemaining) },
            };
        }
        if (monthlyRemaining <= 0) {
            return {
                ok: false,
                warning: true,
                message: 'Monthly budget exceeded',
                remaining: { daily: Math.max(0, dailyRemaining), monthly: 0 },
            };
        }

        // Check if near limit (80%)
        const dailyWarning = this.settings.dailyBudget > 0 &&
            dailyRemaining < this.settings.dailyBudget * 0.2;
        const monthlyWarning = this.settings.monthlyBudget > 0 &&
            monthlyRemaining < this.settings.monthlyBudget * 0.2;

        if (dailyWarning || monthlyWarning) {
            return {
                ok: true,
                warning: true,
                message: `Budget warning: ${dailyWarning ? 'Daily' : 'Monthly'} budget nearly exhausted`,
                remaining: { daily: dailyRemaining, monthly: monthlyRemaining },
            };
        }

        return {
            ok: true,
            warning: false,
            remaining: { daily: dailyRemaining, monthly: monthlyRemaining },
        };
    }

    // ==================== FALLBACK PROVIDER ====================
    getNextProvider(currentProvider: ProviderKey, enabledProviders: ProviderKey[]): ProviderKey | null {
        if (!this.settings.fallbackEnabled) return null;

        const order = this.settings.fallbackOrder;
        const currentIdx = order.indexOf(currentProvider);

        // Find next enabled provider after current
        for (let i = currentIdx + 1; i < order.length; i++) {
            if (enabledProviders.includes(order[i])) {
                return order[i];
            }
        }

        // Wrap around to beginning
        for (let i = 0; i < currentIdx; i++) {
            if (enabledProviders.includes(order[i])) {
                return order[i];
            }
        }

        return null;
    }

    // ==================== CLEAR DATA ====================
    clearUsage(): void {
        this.usageRecords = [];
        this.saveUsage();
    }

    resetSettings(): void {
        this.settings = { ...DEFAULT_QUOTA_SETTINGS };
        this.saveSettings();
    }
}

// ==================== SINGLETON INSTANCE ====================
let quotaManagerInstance: QuotaManager | null = null;

export function getQuotaManager(): QuotaManager {
    if (!quotaManagerInstance) {
        quotaManagerInstance = new QuotaManager();
    }
    return quotaManagerInstance;
}

// ==================== REACT HOOK ====================
import { useState, useEffect, useCallback } from 'react';

export function useQuotaManager() {
    const [manager] = useState(() => getQuotaManager());
    const [settings, setSettings] = useState<QuotaSettings>(manager.getSettings());
    const [stats, setStats] = useState<UsageStats>(manager.getStats());

    const refreshStats = useCallback(() => {
        setStats(manager.getStats());
    }, [manager]);

    const updateSettings = useCallback((updates: Partial<QuotaSettings>) => {
        manager.updateSettings(updates);
        setSettings(manager.getSettings());
    }, [manager]);

    const trackUsage = useCallback((
        provider: ProviderKey,
        model: string,
        inputTokens: number,
        outputTokens: number
    ) => {
        const record = manager.trackUsage(provider, model, inputTokens, outputTokens);
        refreshStats();
        return record;
    }, [manager, refreshStats]);

    const checkBudget = useCallback(() => {
        return manager.checkBudget();
    }, [manager]);

    // Refresh stats periodically
    useEffect(() => {
        const interval = setInterval(refreshStats, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [refreshStats]);

    return {
        settings,
        stats,
        updateSettings,
        trackUsage,
        checkBudget,
        refreshStats,
        getNextProvider: manager.getNextProvider.bind(manager),
        clearUsage: () => { manager.clearUsage(); refreshStats(); },
        resetSettings: () => { manager.resetSettings(); setSettings(manager.getSettings()); },
    };
}
