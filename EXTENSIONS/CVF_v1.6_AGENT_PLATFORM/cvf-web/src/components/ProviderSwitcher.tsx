'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { AIProvider } from '@/lib/ai-providers';

interface ProviderOption {
    id: AIProvider;
    name: string;
    icon: string;
    color: string;
    model: string;
}

const PROVIDERS: ProviderOption[] = [
    { id: 'gemini', name: 'Gemini', icon: '✨', color: 'from-blue-500 to-cyan-500', model: 'gemini-2.5-flash' },
    { id: 'openai', name: 'GPT-4o', icon: '🤖', color: 'from-green-500 to-emerald-500', model: 'gpt-4o' },
    { id: 'anthropic', name: 'Claude', icon: '🧠', color: 'from-purple-500 to-pink-500', model: 'claude-sonnet-4-20250514' },
];

interface ProviderSwitcherProps {
    compact?: boolean;
    showStatus?: boolean;
    onChange?: (provider: AIProvider) => void;
}

export function ProviderSwitcher({ compact = false, showStatus = true, onChange }: ProviderSwitcherProps) {
    const { language } = useLanguage();
    const { settings, updatePreferences } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentProvider = PROVIDERS.find(p => p.id === settings.preferences.defaultProvider) || PROVIDERS[0];
    const hasApiKey = !!settings.providers[currentProvider.id]?.apiKey;

    const labels = {
        vi: {
            selectProvider: 'Chọn AI Provider',
            noApiKey: 'Chưa có API Key',
            ready: 'Sẵn sàng',
            currentModel: 'Model hiện tại',
        },
        en: {
            selectProvider: 'Select AI Provider',
            noApiKey: 'No API Key',
            ready: 'Ready',
            currentModel: 'Current model',
        },
    };
    const l = labels[language];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (provider: AIProvider) => {
        updatePreferences({ defaultProvider: provider });
        onChange?.(provider);
        setIsOpen(false);
    };

    if (compact) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                               bg-gradient-to-r ${currentProvider.color} text-white
                               hover:shadow-lg hover:scale-105`}
                >
                    <span>{currentProvider.icon}</span>
                    <span className="font-medium text-sm">{currentProvider.name}</span>
                    {showStatus && (
                        <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-300' : 'bg-red-300'}`} />
                    )}
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 
                                   rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
                                   overflow-hidden z-50 min-w-48">
                        {PROVIDERS.map(provider => {
                            const providerHasKey = !!settings.providers[provider.id]?.apiKey;
                            const isSelected = provider.id === currentProvider.id;

                            return (
                                <button
                                    key={provider.id}
                                    onClick={() => handleSelect(provider.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors
                                               ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="text-xl">{provider.icon}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            {provider.name}
                                        </div>
                                        <div className="text-xs text-gray-500">{provider.model}</div>
                                    </div>
                                    {providerHasKey ? (
                                        <span className="text-xs text-green-500">✓</span>
                                    ) : (
                                        <span className="text-xs text-gray-400">⚠️</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Full-size version
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-500 mb-3">{l.selectProvider}</h4>

            <div className="grid grid-cols-3 gap-2">
                {PROVIDERS.map(provider => {
                    const providerHasKey = !!settings.providers[provider.id]?.apiKey;
                    const isSelected = provider.id === currentProvider.id;

                    return (
                        <button
                            key={provider.id}
                            onClick={() => handleSelect(provider.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                                       ${isSelected
                                    ? `bg-gradient-to-br ${provider.color} text-white shadow-lg scale-105`
                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                        >
                            <span className="text-2xl">{provider.icon}</span>
                            <span className="font-medium text-sm">{provider.name}</span>
                            <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                {provider.model}
                            </span>
                            {showStatus && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${providerHasKey
                                    ? isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : isSelected
                                        ? 'bg-white/20 text-white'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {providerHasKey ? l.ready : l.noApiKey}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Current model info */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{l.currentModel}</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                        {currentProvider.model}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Inline provider badge for chat header
export function ProviderBadge({ onClick }: { onClick?: () => void }) {
    const { settings } = useSettings();
    const currentProvider = PROVIDERS.find(p => p.id === settings.preferences.defaultProvider) || PROVIDERS[0];
    const hasApiKey = !!settings.providers[currentProvider.id]?.apiKey;

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all
                       bg-gradient-to-r ${currentProvider.color} text-white text-sm
                       hover:shadow-lg hover:scale-105`}
        >
            <span>{currentProvider.icon}</span>
            <span className="font-medium">{currentProvider.name}</span>
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-300' : 'bg-red-300 animate-pulse'}`} />
        </button>
    );
}

// Quick switch buttons for inline use
export function QuickProviderSwitch({ size = 'md' }: { size?: 'sm' | 'md' }) {
    const { settings, updatePreferences } = useSettings();

    const handleSwitch = (provider: AIProvider) => {
        updatePreferences({ defaultProvider: provider });
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-lg',
    };

    return (
        <div className="flex items-center gap-1">
            {PROVIDERS.map(provider => {
                const isSelected = provider.id === settings.preferences.defaultProvider;
                const hasKey = !!settings.providers[provider.id]?.apiKey;

                return (
                    <button
                        key={provider.id}
                        onClick={() => handleSwitch(provider.id)}
                        title={`${provider.name} (${hasKey ? 'Ready' : 'No API Key'})`}
                        className={`${sizeClasses[size]} rounded-full flex items-center justify-center
                                   transition-all ${isSelected
                                ? `bg-gradient-to-br ${provider.color} text-white shadow-md scale-110`
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {provider.icon}
                    </button>
                );
            })}
        </div>
    );
}
