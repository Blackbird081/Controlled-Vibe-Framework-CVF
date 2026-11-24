// Text Encoding Exception: Vietnamese product copy needs its native characters.
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { type OpenClawMode } from '@/lib/openclaw-config';
import { AVAILABLE_MODELS as PROVIDER_MODEL_CATALOG, type ProviderKey } from '@/lib/agent-model-catalog';
import { useProviders } from '@/lib/hooks/useExecute';
import { IntegrationsTab } from './IntegrationsTab';
import { JevHomeSettings } from './home/JevHomeSettings';
import { GOVERNED_ROUTE_DEFAULT_MODEL, GOVERNED_ROUTE_DEFAULT_PROVIDER, GOVERNED_ROUTE_OPENAI_MODELS, GOVERNED_ROUTE_UNSUPPORTED_NOTE, isGovernedRouteProvider } from '@/lib/governed-route-providers';

export type { ProviderKey } from '@/lib/agent-model-catalog';

export const AVAILABLE_MODELS = {
    ...PROVIDER_MODEL_CATALOG,
    openai: PROVIDER_MODEL_CATALOG.openai.filter(model => GOVERNED_ROUTE_OPENAI_MODELS.includes(model.id)),
};

export interface AIProviderSettings {
    gemini: { apiKey: string; enabled: boolean; selectedModel: string };
    openai: { apiKey: string; enabled: boolean; selectedModel: string };
    anthropic: { apiKey: string; enabled: boolean; selectedModel: string };
    alibaba: { apiKey: string; enabled: boolean; selectedModel: string };
    openrouter: { apiKey: string; enabled: boolean; selectedModel: string };
    deepseek: { apiKey: string; enabled: boolean; selectedModel: string };
}

export interface UserPreferences {
    defaultProvider: ProviderKey;
    defaultExportMode: 'simple' | 'governance' | 'full';
    defaultLanguage: 'vi' | 'en';
    autoSaveHistory: boolean;
    showWelcomeTour: boolean;
    analyticsEnabled: boolean;
    openClawEnabled: boolean;
    openClawMode: OpenClawMode;
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

export { GOVERNED_ROUTE_UNSUPPORTED_NOTE, isGovernedRouteProvider };

const STORAGE_KEY = 'cvf_settings';
const SETTINGS_SAVED = 'cvf:settings-saved';
const MIGRATION_KEY = 'cvf_settings_migrated_governance';

const defaultSettings: SettingsData = {
    providers: {
        gemini: { apiKey: '', enabled: false, selectedModel: AVAILABLE_MODELS.gemini[0].id },
        openai: { apiKey: '', enabled: true, selectedModel: GOVERNED_ROUTE_DEFAULT_MODEL },
        anthropic: { apiKey: '', enabled: false, selectedModel: AVAILABLE_MODELS.anthropic[0].id },
        alibaba: { apiKey: '', enabled: false, selectedModel: AVAILABLE_MODELS.alibaba[0].id },
        openrouter: { apiKey: '', enabled: false, selectedModel: AVAILABLE_MODELS.openrouter[0].id },
        deepseek: { apiKey: '', enabled: false, selectedModel: AVAILABLE_MODELS.deepseek[0].id },
    },
    preferences: {
        defaultProvider: 'openai',
        defaultExportMode: 'governance',
        defaultLanguage: 'vi',
        autoSaveHistory: true,
        showWelcomeTour: true,
        analyticsEnabled: true,
        openClawEnabled: false,
        openClawMode: 'disabled' as OpenClawMode,
        multiAgentMode: 'single',
        agentProviders: {
            orchestrator: 'openai',
            architect: 'openai',
            builder: 'openai',
            reviewer: 'openai',
        },
    },
};

/**
 * Idempotent migration of saved settings to the governed route: a saved default/role provider the route cannot run
 * (gemini, openrouter, deepseek) is remapped to OpenAI, and a saved model that is no longer offered (for
 * example o1) falls back to the provider default. Anthropic is left alone (it is valid on the native subscription lane).
 */
export function migrateSettingsForGovernedRoute(input: SettingsData): { settings: SettingsData; changed: boolean } {
    let changed = false;
    const remap = (provider: ProviderKey): ProviderKey => {
        if (isGovernedRouteProvider(provider, true)) return provider;
        changed = true;
        return GOVERNED_ROUTE_DEFAULT_PROVIDER;
    };
    // Tolerate partial imports: missing sections fall back to the defaults before the checks run.
    const base = { ...defaultSettings.preferences, ...input.preferences };
    const roles = { ...defaultSettings.preferences.agentProviders, ...base.agentProviders };
    const preferences = {
        ...base,
        defaultProvider: remap(base.defaultProvider),
        agentProviders: {
            orchestrator: remap(roles.orchestrator),
            architect: remap(roles.architect),
            builder: remap(roles.builder),
            reviewer: remap(roles.reviewer),
        },
    };
    const providers = { ...defaultSettings.providers, ...input.providers };
    for (const provider of Object.keys(AVAILABLE_MODELS) as ProviderKey[]) {
        if (AVAILABLE_MODELS[provider].some(model => model.id === providers[provider]?.selectedModel)) continue;
        changed = true;
        providers[provider] = { ...defaultSettings.providers[provider], ...providers[provider], selectedModel: defaultSettings.providers[provider].selectedModel };
    }
    return { settings: changed ? { ...input, providers, preferences } : input, changed };
}

/** In-memory injection of the build-time Gemini key into settings that hold none (shared by load and updates). */
function applyEnvGeminiKey(settings: SettingsData): void {
    const envGeminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (envGeminiKey && !settings.providers.gemini.apiKey) {
        settings.providers.gemini = { ...settings.providers.gemini, apiKey: envGeminiKey };
    }
}

function loadInitialSettings(): SettingsData {
    if (typeof window === 'undefined') {
        return defaultSettings;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        localStorage.setItem(MIGRATION_KEY, '1');
        const initial = { ...defaultSettings };
        const envGeminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        if (envGeminiKey) {
            initial.providers = {
                ...initial.providers,
                gemini: { ...initial.providers.gemini, apiKey: envGeminiKey },
            };
        }
        return initial;
    }

    try {
        const parsed = JSON.parse(saved);
        const merged: SettingsData = {
            ...defaultSettings,
            ...parsed,
            providers: { ...defaultSettings.providers, ...parsed.providers },
            preferences: { ...defaultSettings.preferences, ...parsed.preferences },
        };

        applyEnvGeminiKey(merged);

        const migrated = localStorage.getItem(MIGRATION_KEY) === '1';
        if (!migrated) {
            merged.preferences.defaultExportMode = 'governance';
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            localStorage.setItem(MIGRATION_KEY, '1');
        }
        const governed = migrateSettingsForGovernedRoute(merged);
        if (governed.changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(governed.settings));
        return governed.settings;
    } catch {
        return defaultSettings;
    }
}

/**
 * Latest persisted settings merged over the defaults, or undefined when nothing valid is stored. Every `useSettings()` caller
 * holds its own state, and an update writes the whole object: basing it on a stale or pre-load in-memory copy would persist the
 * defaults (for example the default provider reverting to OpenAI), so updates build on what is stored.
 */
function readPersistedSettings(): SettingsData | undefined {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return undefined;
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object') return undefined;
        const merged: SettingsData = {
            ...defaultSettings,
            ...parsed,
            providers: { ...defaultSettings.providers, ...parsed.providers },
            preferences: { ...defaultSettings.preferences, ...parsed.preferences },
        };
        applyEnvGeminiKey(merged);
        return merged;
    } catch {
        return undefined;
    }
}

// Hook for settings
export function useSettings(syncSavedSettings = false) {
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage AFTER hydration, not during initial render
    useEffect(() => {
        const loaded = loadInitialSettings();
        // Use queueMicrotask to avoid synchronous setState-in-effect lint warning
        queueMicrotask(() => {
            setSettings(loaded);
            setIsLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (!syncSavedSettings) return;
        const sync = () => {
            const persisted = readPersistedSettings();
            if (persisted) setSettings(persisted);
        };
        window.addEventListener(SETTINGS_SAVED, sync);
        return () => window.removeEventListener(SETTINGS_SAVED, sync);
    }, [syncSavedSettings]);

    const saveSettings = useCallback((newSettings: SettingsData) => {
        setSettings(newSettings);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        localStorage.setItem(MIGRATION_KEY, '1');
        window.dispatchEvent(new Event(SETTINGS_SAVED));
    }, []);

    const updateProvider = useCallback((
        provider: keyof AIProviderSettings,
        updates: Partial<AIProviderSettings[keyof AIProviderSettings]>
    ) => {
        setSettings(prev => {
            const base = readPersistedSettings() ?? prev;
            const newSettings = {
                ...base,
                providers: {
                    ...base.providers,
                    [provider]: { ...base.providers[provider], ...updates },
                },
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            localStorage.setItem(MIGRATION_KEY, '1');
            return newSettings;
        });
    }, []);

    const updatePreferences = useCallback((
        updates: Partial<UserPreferences>
    ) => {
        setSettings(prev => {
            const base = readPersistedSettings() ?? prev;
            const newSettings = {
                ...base,
                preferences: { ...base.preferences, ...updates },
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            localStorage.setItem(MIGRATION_KEY, '1');
            return newSettings;
        });
    }, []);

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
                saveSettings(migrateSettingsForGovernedRoute({ ...defaultSettings, ...imported }).settings);
            } catch {
                console.error('Failed to import settings');
            }
        };
        reader.readAsText(file);
    }, [saveSettings]);

    return {
        settings,
        isLoaded,
        saveSettings,
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
    const { settings: persisted, isLoaded, saveSettings, resetSettings, exportSettings, importSettings } = useSettings();
    // Provider and preference edits stay a local draft until "Save settings" (operator request 2026-11-16: with silent autosave and
    // no Save button users could not tell whether a change had taken effect). Data-tab actions still apply immediately.
    const [draft, setDraft] = useState<SettingsData | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const settings = draft ?? persisted;
    const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(persisted);
    const updateProvider = (provider: keyof AIProviderSettings, updates: Partial<AIProviderSettings[keyof AIProviderSettings]>) => {
        setDraft(prev => { const base = prev ?? persisted; return { ...base, providers: { ...base.providers, [provider]: { ...base.providers[provider], ...updates } } }; });
        setSavedAt(null);
    };
    const updatePreferences = (updates: Partial<UserPreferences>) => {
        setDraft(prev => { const base = prev ?? persisted; return { ...base, preferences: { ...base.preferences, ...updates } }; });
        setSavedAt(null);
    };
    const saveDraft = () => {
        if (!draft) return;
        saveSettings(draft);
        setDraft(null);
        setSavedAt(new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const { providers: serverProviders, fetchProviders } = useProviders();
    useEffect(() => { void fetchProviders(); }, [fetchProviders]);
    const nativeClaude = serverProviders.find(p => p.provider === 'claude' && p.executionSurface === 'claude_cli_subscription');

    const [activeTab, setActiveTab] = useState<'providers' | 'preferences' | 'data' | 'integrations'>('providers');
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

    const handleApiKeyChange = (provider: keyof AIProviderSettings, value: string) => {
        updateProvider(provider, { apiKey: value });
    };

    const toggleProvider = (provider: keyof AIProviderSettings) => {
        updateProvider(provider, { enabled: !settings.providers[provider].enabled });
    };

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            importSettings(file);
            setDraft(null);
        }
    };

    if (!isLoaded) return null;

    const labels = {
        vi: {
            title: '⚙️ Cài đặt',
            providers: '🔑 AI Providers',
            preferences: '🎨 Preferences',
            data: '💾 Data',
            integrations: '🔗 Integrations',
            apiKey: 'API Key',
            show: 'Hiện',
            hide: 'Ẩn',
            enabled: 'Bật',
            disabled: 'Tắt',
            defaultProvider: 'Provider mặc định',
            defaultProviderNote: 'Nhấn "Lưu cài đặt" để áp dụng thay đổi. Provider mặc định chọn ở đây được dùng cho các lần chạy từ trình duyệt này và thay thế mặc định của máy chủ.',
            defaultMode: 'Chế độ export mặc định',
            defaultLang: 'Ngôn ngữ mặc định',
            autoSave: 'Tự động lưu history',
            showTour: 'Hiện welcome tour',
            analytics: 'Bật analytics (local-only)',
            openClaw: '🐾 OpenClaw',
            openClawEnabled: 'Bật OpenClaw Adapter',
            openClawMode: 'Chế độ OpenClaw',
            openClawDesc: 'AI có thể đề xuất. Chỉ CVF mới được thực thi.',
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
            save: 'Lưu cài đặt',
            discard: 'Hủy thay đổi',
            unsaved: 'Có thay đổi chưa lưu',
            savedAt: 'Đã lưu lúc',
            noChanges: 'Không có thay đổi chưa lưu',
            confirmDiscard: 'Bạn có thay đổi chưa lưu. Đóng và bỏ các thay đổi này?',
            geminiDesc: 'Gemini 4 và Gemini Flash-Lite',
            openaiDesc: 'GPT-6 Luna, GPT-6.1 Terra, GPT-4o mini, GPT-4o',
            anthropicDesc: 'Claude Sonnet, Haiku, Opus 5.5',
            alibabaDesc: 'Qwen Plus Character, Qwen Flash Character',
            openrouterDesc: 'Multi-model hub (Llama, Mistral, DeepSeek...)',
            deepseekDesc: 'DeepSeek V4.1 Flash và V4 Pro',
            agentModels: 'Chọn model cá nhân trong Hỏi trợ lý AI. Quyền dùng model phụ thuộc vào khóa của bạn.',
            warningReset: 'Sẽ xóa tất cả settings và API keys',
            close: 'Đóng',
        },
        en: {
            title: '⚙️ Settings',
            providers: '🔑 AI Providers',
            preferences: '🎨 Preferences',
            data: '💾 Data',
            integrations: '🔗 Integrations',
            apiKey: 'API Key',
            show: 'Show',
            hide: 'Hide',
            enabled: 'Enabled',
            disabled: 'Disabled',
            defaultProvider: 'Default Provider',
            defaultProviderNote: 'Press "Save settings" to apply changes. The default provider chosen here is used for runs from this browser and overrides the server default.',
            defaultMode: 'Default Export Mode',
            defaultLang: 'Default Language',
            autoSave: 'Auto-save history',
            showTour: 'Show welcome tour',
            analytics: 'Enable analytics (local-only)',
            openClaw: '🐾 OpenClaw',
            openClawEnabled: 'Enable OpenClaw Adapter',
            openClawMode: 'OpenClaw Mode',
            openClawDesc: 'AI can propose. Only CVF can execute.',
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
            save: 'Save settings',
            discard: 'Discard changes',
            unsaved: 'Unsaved changes',
            savedAt: 'Saved at',
            noChanges: 'No unsaved changes',
            confirmDiscard: 'You have unsaved changes. Close and discard them?',
            geminiDesc: 'Gemini 4 and Gemini Flash-Lite',
            openaiDesc: 'GPT-6 Luna, GPT-6.1 Terra, GPT-4o mini, GPT-4o',
            anthropicDesc: 'Claude Sonnet, Haiku, Opus 5.5',
            alibabaDesc: 'Qwen Plus Character, Qwen Flash Character',
            openrouterDesc: 'Multi-model hub (Llama, Mistral, DeepSeek...)',
            deepseekDesc: 'DeepSeek V4.1 Flash and V4 Pro',
            agentModels: 'Choose a personal model in AI Agent. Access depends on your API key.',
            warningReset: 'This will delete all settings and API keys',
            close: 'Close',
        },
    };

    const l = labels[language];

    const providers = [
        { id: 'gemini' as const, name: 'Google Gemini', icon: '✨', desc: l.geminiDesc, color: 'blue' },
        { id: 'openai' as const, name: 'OpenAI', icon: '🤖', desc: l.openaiDesc, color: 'green' },
        { id: 'anthropic' as const, name: 'Anthropic Claude', icon: '🧠', desc: l.anthropicDesc, color: 'orange' },
        { id: 'alibaba' as const, name: 'Alibaba DashScope', icon: '🌏', desc: l.alibabaDesc, color: 'amber' },
        { id: 'openrouter' as const, name: 'OpenRouter', icon: '🔀', desc: l.openrouterDesc, color: 'violet' },
        { id: 'deepseek' as const, name: 'DeepSeek', icon: '🦋', desc: l.deepseekDesc, color: 'cyan' },
    ];

    const optionNames: Record<ProviderKey, string> = {
        gemini: '✨ Google Gemini', openai: '🤖 OpenAI', anthropic: '🧠 Anthropic',
        alibaba: '🌏 Alibaba DashScope', openrouter: '🔀 OpenRouter', deepseek: '🦋 DeepSeek',
    };
    // Unsupported providers stay visible (a saved choice must not crash the page) but cannot be newly selected.
    const providerOptions = (Object.keys(optionNames) as ProviderKey[]).map((key) => {
        const supported = isGovernedRouteProvider(key, Boolean(nativeClaude));
        return (
            <option key={key} value={key} disabled={!supported}>
                {supported ? optionNames[key] : `${optionNames[key]} — ${GOVERNED_ROUTE_UNSUPPORTED_NOTE}`}
            </option>
        );
    });

    return (
        <div className="bg-white dark:bg-[#1a1d2e] rounded-xl border border-gray-200 dark:border-white/[0.07] max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/[0.07]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {l.title}
                </h2>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button
                            onClick={() => { if (!dirty || confirm(l.confirmDiscard)) onClose(); }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/[0.07]">
                {(['providers', 'preferences', 'data', 'integrations'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors
                            ${activeTab === tab
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">{l.agentModels}</p>
                        {providers.map((provider) => (
                            <div
                                key={provider.id}
                                className={`p-4 rounded-xl border-2 transition-all
                                    ${settings.providers[provider.id].enabled
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-white/[0.07]'
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
                                            {!isGovernedRouteProvider(provider.id, Boolean(nativeClaude)) && (
                                                <p className="text-xs text-amber-700 dark:text-amber-300">{GOVERNED_ROUTE_UNSUPPORTED_NOTE}</p>
                                            )}
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
                                        {provider.id === 'anthropic' && nativeClaude ? (
                                            <div role="status" className="text-sm text-gray-600 dark:text-gray-300">
                                                <p>Claude subscription: {nativeClaude.nativeAuthState ?? 'unknown'}</p>
                                                <p>{language === 'vi' ? 'Bí danh native: sonnet. Lựa chọn API đã lưu không hoạt động trong chế độ này.' : 'Native alias: sonnet. The saved API model is inactive in this mode.'}</p>
                                                <p>{nativeClaude.checkedAt}</p>
                                            </div>
                                        ) : <><div className="flex gap-2">
                                            <input
                                                type={showApiKey[provider.id] ? 'text' : 'password'}
                                                value={settings.providers[provider.id].apiKey}
                                                onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                                                placeholder={`${provider.name} ${l.apiKey}...`}
                                                title={`Enter your ${provider.name} API key`}
                                                aria-label={`${provider.name} API key`}
                                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 
                                                           dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e] 
                                                           text-gray-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => setShowApiKey({ ...showApiKey, [provider.id]: !showApiKey[provider.id] })}
                                                className="px-3 py-2 text-xs bg-gray-100 dark:bg-white/[0.07] rounded-lg"
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
                                            <label htmlFor={`settings-model-${provider.id}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                {language === 'vi' ? 'Model' : 'Model'}
                                            </label>
                                            <select
                                                id={`settings-model-${provider.id}`}
                                                value={settings.providers[provider.id].selectedModel || defaultSettings.providers[provider.id].selectedModel}
                                                onChange={(e) => updateProvider(provider.id, { selectedModel: e.target.value })}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 
                                                           dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e] 
                                                           text-gray-900 dark:text-white"
                                            >
                                                {AVAILABLE_MODELS[provider.id].map((model) => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div></>}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                    <div className="space-y-6">
                        <JevHomeSettings language={language} />
                        {/* OpenClaw Adapter */}
                        <div className={`p-4 rounded-xl border-2 transition-all ${settings.preferences.openClawEnabled
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                            : 'border-gray-200 dark:border-white/[0.07]'
                            }`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">🐾</span>
                                    <div>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {l.openClaw}
                                        </span>
                                        <p className="text-xs text-gray-500">{l.openClawDesc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newEnabled = !settings.preferences.openClawEnabled;
                                        updatePreferences({
                                            openClawEnabled: newEnabled,
                                            openClawMode: newEnabled ? 'proposal-only' : 'disabled',
                                        });
                                    }}
                                    className={`w-12 h-6 rounded-full transition-colors ${settings.preferences.openClawEnabled
                                        ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.preferences.openClawEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>

                            {settings.preferences.openClawEnabled && (
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        {l.openClawMode}
                                    </label>
                                    <select
                                        value={settings.preferences.openClawMode}
                                        onChange={(e) => updatePreferences({ openClawMode: e.target.value as OpenClawMode })}
                                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                                                   dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e]
                                                   text-gray-900 dark:text-white"
                                    >
                                        <option value="proposal-only">📝 {language === 'vi' ? 'Chỉ đề xuất' : 'Proposal Only'}</option>
                                        <option value="full">🚀 {language === 'vi' ? 'Đầy đủ' : 'Full'}</option>
                                    </select>
                                </div>
                            )}
                        </div>

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
                                            {providerOptions}
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
                                {providerOptions}
                            </select>
                            <p data-testid="default-provider-note" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {l.defaultProviderNote}
                            </p>
                            {!isGovernedRouteProvider(settings.preferences.defaultProvider, Boolean(nativeClaude)) && (
                                <p role="alert" className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                                    {GOVERNED_ROUTE_UNSUPPORTED_NOTE}
                                </p>
                            )}
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
                                        ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
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
                                        ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
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
                                        ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
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
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg
                                       font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span>💾</span> {l.export}
                        </button>

                        <label className="block w-full py-3 px-4 bg-gray-100 dark:bg-white/[0.07] hover:bg-gray-200 
                                          dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 rounded-lg
                                          font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                            <span>📂</span> {l.import}
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                            />
                        </label>

                        <div className="pt-4 border-t border-gray-200 dark:border-white/[0.07]">
                            <button
                                onClick={() => {
                                    if (confirm(l.warningReset)) {
                                        resetSettings();
                                        setDraft(null);
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

                {activeTab === 'integrations' && (
                    <IntegrationsTab />
                )}
            </div>

            {(activeTab === 'providers' || activeTab === 'preferences') && (
                <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#1a1d2e] rounded-b-xl">
                    <span role="status" data-testid="settings-save-status" className={`mr-auto text-sm ${dirty ? 'text-amber-700 dark:text-amber-300 font-medium' : savedAt ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {dirty ? `● ${l.unsaved}` : savedAt ? `✓ ${l.savedAt} ${savedAt}` : l.noChanges}
                    </span>
                    <button type="button" onClick={() => setDraft(null)} disabled={!dirty}
                        className="min-h-11 px-4 rounded-lg border border-gray-300 dark:border-white/[0.15] text-gray-700 dark:text-gray-300 font-medium disabled:opacity-40">
                        {l.discard}
                    </button>
                    <button type="button" onClick={saveDraft} disabled={!dirty}
                        className="min-h-11 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium disabled:opacity-40">
                        {l.save}
                    </button>
                </div>
            )}
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
