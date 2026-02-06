'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useSettings } from './Settings';
import { Template } from '@/types';

// Props for the Execute with AI button
export interface ExecuteWithAIProps {
    template: Template;
    values: Record<string, string>;
    spec: string;
    onExecute: (prompt: string) => void;
    disabled?: boolean;
}

// Execute With AI Button Component
export function ExecuteWithAIButton({ template, values, spec, onExecute, disabled }: ExecuteWithAIProps) {
    const { language } = useLanguage();
    const { settings } = useSettings();
    const [showPreview, setShowPreview] = useState(false);

    const labels = {
        vi: {
            execute: 'Thực thi với AI',
            preview: 'Xem trước prompt',
            noApiKey: 'Chưa có API Key',
            configure: 'Cấu hình',
            provider: 'Provider',
            mode: 'Mode',
            close: 'Đóng',
            confirm: 'Xác nhận & Thực thi',
        },
        en: {
            execute: 'Execute with AI',
            preview: 'Preview prompt',
            noApiKey: 'No API Key',
            configure: 'Configure',
            provider: 'Provider',
            mode: 'Mode',
            close: 'Close',
            confirm: 'Confirm & Execute',
        },
    };
    const l = labels[language];

    const provider = settings.preferences.defaultProvider;
    const hasApiKey = !!settings.providers[provider]?.apiKey;

    const providerLabels = {
        gemini: '✨ Gemini',
        openai: '🤖 GPT-4',
        anthropic: '🧠 Claude',
    };

    const handleExecute = () => {
        if (!hasApiKey) return;
        onExecute(spec);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                {/* Main execute button */}
                <button
                    onClick={() => setShowPreview(true)}
                    disabled={disabled}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white
                               transition-all transform hover:scale-105 ${hasApiKey
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    <span className="text-xl">🚀</span>
                    {l.execute}
                </button>

                {/* Provider indicator */}
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                    <span>{providerLabels[provider]}</span>
                    {!hasApiKey && (
                        <span className="text-xs text-red-500 ml-1">⚠️</span>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] 
                                   overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700
                                       bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🚀</span>
                                <div>
                                    <h3 className="font-bold">{l.preview}</h3>
                                    <p className="text-sm opacity-80">
                                        {template.icon} {template.name}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Settings summary */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">{l.provider}</div>
                                    <div className="font-medium flex items-center gap-2">
                                        {providerLabels[provider]}
                                        {hasApiKey ? (
                                            <span className="text-xs text-green-500">✓ Ready</span>
                                        ) : (
                                            <span className="text-xs text-red-500">⚠️ {l.noApiKey}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="text-xs text-gray-500 mb-1">{l.mode}</div>
                                    <div className="font-medium">
                                        {settings.preferences.defaultExportMode === 'full' && '🚀 CVF Full'}
                                        {settings.preferences.defaultExportMode === 'governance' && '🛡️ Governance'}
                                        {settings.preferences.defaultExportMode === 'simple' && '⚡ Simple'}
                                    </div>
                                </div>
                            </div>

                            {/* Spec preview */}
                            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                    {spec.substring(0, 2000)}
                                    {spec.length > 2000 && '...\n\n[Truncated for preview]'}
                                </pre>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg
                                          text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200
                                          dark:hover:bg-gray-600 transition-colors"
                            >
                                {l.close}
                            </button>
                            <button
                                onClick={handleExecute}
                                disabled={!hasApiKey}
                                className={`px-6 py-2 rounded-lg font-medium text-white transition-all ${hasApiKey
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {hasApiKey ? `🚀 ${l.confirm}` : `⚠️ ${l.noApiKey}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Quick Actions Panel (for use after form completion)
export interface QuickActionsProps {
    template: Template;
    values: Record<string, string>;
    spec: string;
    onCopySpec: () => void;
    onExecuteWithAI: (prompt: string) => void;
    onExportFile: () => void;
}

export function QuickActions({
    template,
    values,
    spec,
    onCopySpec,
    onExecuteWithAI,
    onExportFile
}: QuickActionsProps) {
    const { language } = useLanguage();

    const labels = {
        vi: {
            title: 'Tiếp theo',
            copy: 'Copy Prompt',
            execute: 'Thực thi AI',
            export: 'Lưu File',
            copied: 'Đã copy!',
        },
        en: {
            title: 'Next Steps',
            copy: 'Copy Prompt',
            execute: 'Execute AI',
            export: 'Save File',
            copied: 'Copied!',
        },
    };
    const l = labels[language];

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopySpec();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                       rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {l.title}
            </h4>

            <div className="grid grid-cols-3 gap-3">
                {/* Copy button */}
                <button
                    onClick={handleCopy}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                               ${copied
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700'
                            : 'bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        }`}
                >
                    <span className="text-2xl">{copied ? '✓' : '📋'}</span>
                    <span className="text-xs font-medium">{copied ? l.copied : l.copy}</span>
                </button>

                {/* Execute button */}
                <button
                    onClick={() => onExecuteWithAI(spec)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl
                              bg-gradient-to-br from-purple-500 to-blue-600 text-white
                              hover:from-purple-600 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                    <span className="text-2xl">🚀</span>
                    <span className="text-xs font-medium">{l.execute}</span>
                </button>

                {/* Export button */}
                <button
                    onClick={onExportFile}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl
                              bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                    <span className="text-2xl">💾</span>
                    <span className="text-xs font-medium">{l.export}</span>
                </button>
            </div>
        </div>
    );
}
