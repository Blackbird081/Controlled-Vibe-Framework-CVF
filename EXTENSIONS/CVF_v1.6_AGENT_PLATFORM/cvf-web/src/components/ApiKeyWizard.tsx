'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { validateApiKey } from '@/lib/security';
import { AVAILABLE_MODELS, ProviderKey, SettingsData } from './Settings';

interface ApiKeyWizardProps {
    onComplete: () => void;
    onClose?: () => void;
    settings: SettingsData;
    updateProvider: (provider: ProviderKey, updates: Partial<SettingsData['providers'][ProviderKey]>) => void;
    updatePreferences: (updates: Partial<SettingsData['preferences']>) => void;
}

const PROVIDERS: Array<{ id: ProviderKey; name: string; icon: string; hint: string }> = [
    { id: 'gemini', name: 'Google Gemini', icon: '✨', hint: 'Recommended for most users' },
    { id: 'openai', name: 'OpenAI', icon: '🤖', hint: 'Best for GPT-4 class models' },
    { id: 'anthropic', name: 'Anthropic Claude', icon: '🧠', hint: 'Strong for long-form reasoning' },
];

export function ApiKeyWizard({ onComplete, onClose, settings, updateProvider, updatePreferences }: ApiKeyWizardProps) {
    const { language } = useLanguage();

    const [step, setStep] = useState(0);
    const [provider, setProvider] = useState<ProviderKey>('gemini');
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [defaultProvider, setDefaultProvider] = useState<ProviderKey>('gemini');
    const [selectedModel, setSelectedModel] = useState<string>(AVAILABLE_MODELS.gemini[0].id);

    useEffect(() => {
        const existing = settings.providers[provider];
        setApiKey(existing.apiKey || '');
        setSelectedModel(existing.selectedModel || AVAILABLE_MODELS[provider][0].id);
        setDefaultProvider(provider);
        setError(null);
    }, [provider, settings.providers]);

    const labels = useMemo(() => ({
        vi: {
            title: 'API Key Wizard',
            step: 'Bước',
            next: 'Tiếp tục',
            back: 'Quay lại',
            finish: 'Hoàn tất',
            skip: 'Bỏ qua',
            selectProvider: 'Chọn nhà cung cấp AI',
            enterKey: 'Nhập API Key',
            keyPlaceholder: 'Dán API key tại đây...',
            show: 'Hiện',
            hide: 'Ẩn',
            model: 'Chọn model mặc định',
            defaultProvider: 'Provider mặc định',
            summary: 'Tóm tắt cấu hình',
            storageNote: 'API key được lưu local trong trình duyệt của bạn.',
            invalidKey: 'API key không đúng định dạng.',
        },
        en: {
            title: 'API Key Wizard',
            step: 'Step',
            next: 'Next',
            back: 'Back',
            finish: 'Finish',
            skip: 'Skip',
            selectProvider: 'Select AI Provider',
            enterKey: 'Enter API Key',
            keyPlaceholder: 'Paste your API key...',
            show: 'Show',
            hide: 'Hide',
            model: 'Select default model',
            defaultProvider: 'Default provider',
            summary: 'Configuration summary',
            storageNote: 'API key is stored locally in your browser.',
            invalidKey: 'Invalid API key format.',
        },
    }), []);

    const l = labels[language];
    const totalSteps = 3;

    const handleNext = () => {
        if (step === 1) {
            const validation = validateApiKey(provider, apiKey);
            if (!validation.valid) {
                setError(validation.error || l.invalidKey);
                return;
            }
        }
        setError(null);
        setStep(prev => Math.min(prev + 1, totalSteps - 1));
    };

    const handleFinish = () => {
        const validation = validateApiKey(provider, apiKey);
        if (!validation.valid) {
            setError(validation.error || l.invalidKey);
            setStep(1);
            return;
        }

        updateProvider(provider, {
            apiKey,
            enabled: true,
            selectedModel,
        });
        updatePreferences({ defaultProvider });
        onComplete();
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{l.title}</h2>
                    <p className="text-xs text-gray-500">{l.step} {step + 1}/{totalSteps}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="p-6 space-y-6">
                {step === 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{l.selectProvider}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setProvider(p.id)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all
                                        ${provider === p.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="text-xl mb-2">{p.icon}</div>
                                    <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                    <div className="text-xs text-gray-500">{p.hint}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{l.enterKey}</h3>
                        <div className="flex gap-2">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={l.keyPlaceholder}
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200
                                           dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <button
                                onClick={() => setShowKey(prev => !prev)}
                                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg"
                            >
                                {showKey ? l.hide : l.show}
                            </button>
                        </div>
                        {error && (
                            <div className="text-sm text-red-600">{error}</div>
                        )}
                        <div className="mt-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-500">
                            Screenshot placeholder: How to create {PROVIDERS.find(p => p.id === provider)?.name} API key
                        </div>
                        <p className="text-xs text-gray-500">{l.storageNote}</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{l.model}</h3>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                                       dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            {AVAILABLE_MODELS[provider].map(model => (
                                <option key={model.id} value={model.id}>
                                    {model.name} {model.recommended ? '⭐' : ''}
                                </option>
                            ))}
                        </select>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {l.defaultProvider}
                        </label>
                        <select
                            value={defaultProvider}
                            onChange={(e) => setDefaultProvider(e.target.value as ProviderKey)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200
                                       dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="gemini">✨ Google Gemini</option>
                            <option value="openai">🤖 OpenAI</option>
                            <option value="anthropic">🧠 Anthropic</option>
                        </select>

                        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                            <div className="font-medium text-gray-700 dark:text-gray-200">{l.summary}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Provider: {PROVIDERS.find(p => p.id === provider)?.name}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                                Model: {AVAILABLE_MODELS[provider].find(m => m.id === selectedModel)?.name}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex gap-2">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(prev => Math.max(prev - 1, 0))}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                            {l.back}
                        </button>
                    )}
                </div>
                <div className="flex gap-2">
                    {step < totalSteps - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {l.next}
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            {l.finish}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
