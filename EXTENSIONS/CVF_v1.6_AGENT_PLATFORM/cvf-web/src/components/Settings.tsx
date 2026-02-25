'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

// Types
export type ProviderKey = 'gemini' | 'openai' | 'anthropic';

// Available models for each provider
export const AVAILABLE_MODELS: Record<ProviderKey, { id: string; name: string; recommended?: boolean }[]> = {
    gemini: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', recommended: true },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', recommended: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'o1', name: 'o1 (Reasoning)' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', recommended: true },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    ],
};

export interface AIProviderSettings {
    gemini: { apiKey: string; enabled: boolean; selectedModel: string };
    openai: { apiKey: string; enabled: boolean; selectedModel: string };
    anthropic: { apiKey: string; enabled: boolean; selectedModel: string };
}

export interface UserPreferences {
    defaultProvider: 'gemini' | 'openai' | 'anthropic';
    defaultExportMode: 'simple' | 'governance' | 'full';
    defaultLanguage: 'vi' | 'en';
    autoSaveHistory: boolean;
    showWelcomeTour: boolean;
    analyticsEnabled: boolean;
    multiAgentMode: 'single' | 'multi';
    agentProviders: {
        orchestrator: ProviderKey;
        architect: ProviderKey;
        builder: ProviderKey;
        reviewer: ProviderKey;
    };
}

export interface SettingsData {
    providers: AIProviderSettings;
    preferences: UserPreferences;
}

const STORAGE_KEY = 'cvf_settings';
const MIGRATION_KEY = 'cvf_settings_migrated_governance';

const defaultSettings: SettingsData = {
    providers: {
        gemini: { apiKey: '', enabled: true, selectedModel: 'gemini-2.5-flash' },
        openai: { apiKey: '', enabled: false, selectedModel: 'gpt-4o' },
        anthropic: { apiKey: '', enabled: false, selectedModel: 'claude-sonnet-4-20250514' },
    },
    preferences: {
        defaultProvider: 'gemini',
        defaultExportMode: 'governance',
        defaultLanguage: 'vi',
        autoSaveHistory: true,
        showWelcomeTour: true,
        analyticsEnabled: true,
        multiAgentMode: 'single',
        agentProviders: {
            orchestrator: 'gemini',
            architect: 'gemini',
            builder: 'gemini',
            reviewer: 'gemini',
        },
    },
};

function loadInitialSettings(): SettingsData {
    if (typeof window === 'undefined') {
        return defaultSettings;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        localStorage.setItem(MIGRATION_KEY, '1');
        return defaultSettings;
    }

    try {
        const parsed = JSON.parse(saved);
        const merged: SettingsData = {
            ...defaultSettings,
            ...parsed,
            providers: { ...defaultSettings.providers, ...parsed.providers },
            preferences: { ...defaultSettings.preferences, ...parsed.preferences },
        };

        const migrated = localStorage.getItem(MIGRATION_KEY) === '1';
        if (!migrated) {
            merged.preferences.defaultExportMode = 'governance';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(MIGRATION_KEY, '1');
        }
        return merged;
    } catch {
        return defaultSettings;
    }
}

// Hook for settings
export function useSettings() {
    const [settings, setSettings] = useState<SettingsData>(() => loadInitialSettings());
    const [isLoaded] = useState(true);

    const saveSettings = useCallback((newSettings: SettingsData) => {
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        localStorage.setItem(MIGRATION_KEY, '1');
    }, []);

    const updateProvider = useCallback((
        provider: keyof AIProviderSettings,
        updates: Partial<AIProviderSettings[keyof AIProviderSettings]>
    ) => {
        const newSettings = {
            ...settings,
            providers: {
                ...settings.providers,
                [provider]: { ...settings.providers[provider], ...updates },
            },
        };
        saveSettings(newSettings);
    }, [settings, saveSettings]);

    const updatePreferences = useCallback((
        updates: Partial<UserPreferences>
    ) => {
        const newSettings = {
            ...settings,
            preferences: { ...settings.preferences, ...updates },
        };
        saveSettings(newSettings);
    }, [settings, saveSettings]);

    const resetSettings = useCallback(() => {
        setSettings(defaultSettings);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const exportSettings = useCallback(() => {
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cvf-settings-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [settings]);

    const importSettings = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string);
                saveSettings({ ...defaultSettings, ...imported });
            } catch {
                console.error('Failed to import settings');
            }
        };
        reader.readAsText(file);
    }, [saveSettings]);

    return {
        settings,
        isLoaded,
        updateProvider,
        updatePreferences,
        resetSettings,
        exportSettings,
        importSettings,
    };
}

// Settings Page Component
interface SettingsPageProps {
    onClose?: () => void;
}

export function SettingsPage({ onClose }: SettingsPageProps) {
    const { language } = useLanguage();
    const {
        settings,
        isLoaded,
        updateProvider,
        updatePreferences,
        resetSettings,
        exportSettings,
        importSettings,
    } = useSettings();

    const [activeTab, setActiveTab] = useState<'providers' | 'preferences' | 'data'>('providers');
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState(false);

    const handleApiKeyChange = (provider: keyof AIProviderSettings, value: string) => {
        updateProvider(provider, { apiKey: value });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleProvider = (provider: keyof AIProviderSettings) => {
        updateProvider(provider, { enabled: !settings.providers[provider].enabled });
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importSettings(file);
        }
    };

    if (!isLoaded) return null;

    const labels = {
        vi: {
            title: '⚙️ Cài đặt',
            providers: '🔑 AI Providers',
            preferences: '🎨 Preferences',
            data: '💾 Data',
            apiKey: 'API Key',
            show: 'Hiện',
            hide: 'Ẩn',
            enabled: 'Bật',
            disabled: 'Tắt',
            defaultProvider: 'Provider mặc định',
            defaultMode: 'Chế độ export mặc định',
            defaultLang: 'Ngôn ngữ mặc định',
            autoSave: 'Tự động lưu history',
            showTour: 'Hiện welcome tour',
            analytics: 'Bật analytics (local-only)',
            multiAgentMode: 'Chế độ Multi-Agent',
            multiAgentSingle: 'Single AI (1 AI nhiều vai)',
            multiAgentMulti: 'Multi AI (mỗi vai 1 AI)',
            agentProviders: 'Gán Provider theo vai trò',
            roleOrchestrator: 'Orchestrator',
            roleArchitect: 'Architect',
            roleBuilder: 'Builder',
            roleReviewer: 'Reviewer',
            export: 'Xuất Settings',
            import: 'Nhập Settings',
            reset: 'Reset tất cả',
            saved: 'Đã lưu!',
            geminiDesc: 'Free tier lớn, nên dùng',
            openaiDesc: 'GPT-4, GPT-4o',
            anthropicDesc: 'Claude 3.5 Sonnet',
            warningReset: 'Sẽ xóa tất cả settings và API keys',
            close: 'Đóng',
        },
        en: {
            title: '⚙️ Settings',
            providers: '🔑 AI Providers',
            preferences: '🎨 Preferences',
            data: '💾 Data',
            apiKey: 'API Key',
            show: 'Show',
            hide: 'Hide',
            enabled: 'Enabled',
            disabled: 'Disabled',
            defaultProvider: 'Default Provider',
            defaultMode: 'Default Export Mode',
            defaultLang: 'Default Language',
            autoSave: 'Auto-save history',
            showTour: 'Show welcome tour',
            analytics: 'Enable analytics (local-only)',
            multiAgentMode: 'Multi-Agent Mode',
            multiAgentSingle: 'Single AI (one AI, many roles)',
            multiAgentMulti: 'Multi AI (one AI per role)',
            agentProviders: 'Assign Provider per Role',
            roleOrchestrator: 'Orchestrator',
            roleArchitect: 'Architect',
            roleBuilder: 'Builder',
            roleReviewer: 'Reviewer',
            export: 'Export Settings',
            import: 'Import Settings',
            reset: 'Reset All',
            saved: 'Saved!',
            geminiDesc: 'Large free tier, recommended',
            openaiDesc: 'GPT-4, GPT-4o',
            anthropicDesc: 'Claude 3.5 Sonnet',
            warningReset: 'This will delete all settings and API keys',
            close: 'Close',
        },
    };

    const l = labels[language];

    const providers = [
        { id: 'gemini' as const, name: 'Google Gemini', icon: '✨', desc: l.geminiDesc, color: 'blue' },
        { id: 'openai' as const, name: 'OpenAI', icon: '🤖', desc: l.openaiDesc, color: 'green' },
        { id: 'anthropic' as const, name: 'Anthropic Claude', icon: '🧠', desc: l.anthropicDesc, color: 'orange' },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {l.title}
                </h2>
                <div className="flex items-center gap-2">
                    {saved && (
                        <span className="text-sm text-green-600 dark:text-green-400">✓ {l.saved}</span>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {(['providers', 'preferences', 'data'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors
                            ${activeTab === tab
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {l[tab]}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Providers Tab */}
                {activeTab === 'providers' && (
                    <div className="space-y-4">
                        {providers.map((provider) => (
                            <div
                                key={provider.id}
                                className={`p-4 rounded-xl border-2 transition-all
                                    ${settings.providers[provider.id].enabled
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{provider.icon}</span>
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {provider.name}
                                            </span>
                                            <p className="text-xs text-gray-500">{provider.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleProvider(provider.id)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                                            ${settings.providers[provider.id].enabled
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                                            }`}
                                    >
                                        {settings.providers[provider.id].enabled ? l.enabled : l.disabled}
                                    </button>
                                </div>

                                {settings.providers[provider.id].enabled && (
                                    <>
                                        <div className="flex gap-2">
                                            <input
                                                type={showApiKey[provider.id] ? 'text' : 'password'}
                                                value={settings.providers[provider.id].apiKey}
                                                onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                                                placeholder={`${provider.name} ${l.apiKey}...`}
                                                title={`Enter your ${provider.name} API key`}
                                                aria-label={`${provider.name} API key`}
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 
                                                           dark:border-gray-600 bg-white dark:bg-gray-700 
                                                           text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => setShowApiKey({ ...showApiKey, [provider.id]: !showApiKey[provider.id] })}
                                                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-600 rounded-lg"
                                                aria-label={showApiKey[provider.id] ? `Hide ${provider.name} API key` : `Show ${provider.name} API key`}
                                            >
                                                {showApiKey[provider.id] ? l.hide : l.show}
                                            </button>
                                            {settings.providers[provider.id].apiKey && (
                                                <button
                                                    onClick={() => handleApiKeyChange(provider.id, '')}
                                                    className="px-3 py-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200"
                                                    title="Clear API Key"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        {/* Model Selector */}
                                        <div className="mt-3">
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                {language === 'vi' ? 'Model' : 'Model'}
                                            </label>
                                            <select
                                                value={settings.providers[provider.id].selectedModel || AVAILABLE_MODELS[provider.id][0].id}
                                                onChange={(e) => updateProvider(provider.id, { selectedModel: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 
                                                           dark:border-gray-600 bg-white dark:bg-gray-700 
                                                           text-gray-900 dark:text-white"
                                            >
                                                {AVAILABLE_MODELS[provider.id].map((model) => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name} {model.recommended ? '⭐' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div className="space-y-6">
                        {/* Multi-Agent Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.multiAgentMode}
                            </label>
                            <select
                                value={settings.preferences.multiAgentMode}
                                onChange={(e) => updatePreferences({ multiAgentMode: e.target.value as UserPreferences['multiAgentMode'] })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="single">🎯 {l.multiAgentSingle}</option>
                                <option value="multi">🤖 {l.multiAgentMulti}</option>
                            </select>
                        </div>

                        {/* Multi-Agent Providers */}
                        {settings.preferences.multiAgentMode === 'multi' && (
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {l.agentProviders}
                                </label>
                                {([
                                    { key: 'orchestrator', label: l.roleOrchestrator },
                                    { key: 'architect', label: l.roleArchitect },
                                    { key: 'builder', label: l.roleBuilder },
                                    { key: 'reviewer', label: l.roleReviewer },
                                ] as const).map((role) => (
                                    <div key={role.key} className="flex items-center gap-3">
                                        <span className="w-32 text-sm text-gray-600 dark:text-gray-300">{role.label}</span>
                                        <select
                                            value={settings.preferences.agentProviders[role.key]}
                                            onChange={(e) => updatePreferences({
                                                agentProviders: {
                                                    ...settings.preferences.agentProviders,
                                                    [role.key]: e.target.value as ProviderKey,
                                                },
                                            })}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        >
                                            <option value="gemini">✨ Google Gemini</option>
                                            <option value="openai">🤖 OpenAI</option>
                                            <option value="anthropic">🧠 Anthropic</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Default Provider */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.defaultProvider}
                            </label>
                            <select
                                value={settings.preferences.defaultProvider}
                                onChange={(e) => updatePreferences({ defaultProvider: e.target.value as UserPreferences['defaultProvider'] })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="gemini">✨ Google Gemini</option>
                                <option value="openai">🤖 OpenAI</option>
                                <option value="anthropic">🧠 Anthropic</option>
                            </select>
                        </div>

                        {/* Default Export Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.defaultMode}
                            </label>
                            <select
                                value={settings.preferences.defaultExportMode}
                                onChange={(e) => updatePreferences({ defaultExportMode: e.target.value as UserPreferences['defaultExportMode'] })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="simple">⚡ Simple</option>
                                <option value="governance">🛡️ Governance</option>
                                <option value="full">🚀 CVF Full Mode</option>
                            </select>
                        </div>

                        {/* Default Language */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {l.defaultLang}
                            </label>
                            <select
                                value={settings.preferences.defaultLanguage}
                                onChange={(e) => updatePreferences({ defaultLanguage: e.target.value as UserPreferences['defaultLanguage'] })}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                <option value="en">🇺🇸 English</option>
                            </select>
                        </div>

                        {/* Toggles */}
                        <div className="space-y-3">
                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{l.autoSave}</span>
                                <button
                                    onClick={() => updatePreferences({ autoSaveHistory: !settings.preferences.autoSaveHistory })}
                                    className={`w-12 h-6 rounded-full transition-colors ${settings.preferences.autoSaveHistory
                                        ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.preferences.autoSaveHistory ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{l.showTour}</span>
                                <button
                                    onClick={() => updatePreferences({ showWelcomeTour: !settings.preferences.showWelcomeTour })}
                                    className={`w-12 h-6 rounded-full transition-colors ${settings.preferences.showWelcomeTour
                                        ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.preferences.showWelcomeTour ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </label>

                            <label className="flex items-center justify-between cursor-pointer">
                                <span className="text-sm text-gray-700 dark:text-gray-300">{l.analytics}</span>
                                <button
                                    onClick={() => updatePreferences({ analyticsEnabled: !settings.preferences.analyticsEnabled })}
                                    className={`w-12 h-6 rounded-full transition-colors ${settings.preferences.analyticsEnabled
                                        ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.preferences.analyticsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </label>
                        </div>
                    </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                    <div className="space-y-4">
                        <button
                            onClick={exportSettings}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                                       font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span>💾</span> {l.export}
                        </button>

                        <label className="block w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 
                                          dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                                          font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <span>📂</span> {l.import}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                        </label>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    if (confirm(l.warningReset)) {
                                        resetSettings();
                                    }
                                }}
                                className="w-full py-3 px-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 
                                           dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg
                                           font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <span>🗑️</span> {l.reset}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">{l.warningReset}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Compact Settings Button
export function SettingsButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 
                       hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            title="Settings"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </button>
    );
}
