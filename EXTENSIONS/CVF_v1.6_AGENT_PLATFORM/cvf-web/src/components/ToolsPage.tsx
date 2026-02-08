'use client';

import { useState } from 'react';
import { AVAILABLE_TOOLS, useTools, ToolResult, ToolType } from '@/lib/agent-tools';
import { useLanguage } from '@/lib/i18n';

interface ToolsPageProps {
    onClose?: () => void;
}

export function ToolsPage({ onClose }: ToolsPageProps) {
    const { toolCalls, clearHistory } = useTools();
    const [lastResult, setLastResult] = useState<{ toolId: ToolType; result: ToolResult } | null>(null);
    const { t } = useLanguage();

    const resolveI18n = (key: string, fallback: string) => {
        const value = t(key);
        return value === key ? fallback : value;
    };

    const getToolName = (toolId: ToolType, fallback: string) =>
        resolveI18n(`tools.catalog.${toolId}.name`, fallback);

    const getToolDescription = (toolId: ToolType, fallback: string) =>
        resolveI18n(`tools.catalog.${toolId}.description`, fallback);

    const getParamDescription = (toolId: ToolType, paramName: string, fallback: string) =>
        resolveI18n(`tools.catalog.${toolId}.param.${paramName}`, fallback);

    const handleToolResult = (toolId: ToolType, result: ToolResult) => {
        setLastResult({ toolId, result });
    };

    return (
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {t('tools.title')}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {t('tools.description')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {toolCalls.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                                {t('tools.clearHistory')}
                            </button>
                        )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Coming soon banner */}
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">🚧</span>
                            <div>
                                <h3 className="font-bold">{t('tools.comingSoonTitle')}</h3>
                                <p className="text-sm">
                                    {t('tools.comingSoonDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Last Result Display */}
                    {lastResult && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {t('tools.latestResult')}
                                    <span className="text-sm font-normal text-gray-500">
                                        {getToolName(lastResult.toolId, AVAILABLE_TOOLS[lastResult.toolId]?.name || '')}
                                    </span>
                                </h3>
                                <span className={`text-sm px-2 py-1 rounded ${lastResult.result.success
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                    {lastResult.result.success ? t('tools.success') : t('tools.failed')}
                                </span>
                            </div>

                            {lastResult.result.executionTime && (
                                <p className="text-xs text-gray-500 mb-2">
                                    ⏱️ {t('tools.executionTime')}: {lastResult.result.executionTime}ms
                                </p>
                            )}

                            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-64">
                                {JSON.stringify(lastResult.result.data || lastResult.result.error, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Tools Documentation */}
                    <div className="mt-8">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                            {t('tools.documentation')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(AVAILABLE_TOOLS).map(tool => (
                                <div
                                    key={tool.id}
                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{tool.icon}</span>
                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                            {getToolName(tool.id, tool.name)}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {getToolDescription(tool.id, tool.description)}
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500">{t('tools.parameters')}:</p>
                                        {tool.parameters.map(param => (
                                            <div key={param.name} className="text-xs text-gray-600 dark:text-gray-400 pl-2">
                                                • <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{param.name}</code>
                                                {param.required && <span className="text-red-500">*</span>}
                                                : {getParamDescription(tool.id, param.name, param.description)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Export button component
export function ToolsButton({ onClick }: { onClick: () => void }) {
    const { t } = useLanguage();
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white 
                      rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
            <span>🛠️</span>
            <span>{t('tools.button')}</span>
        </button>
    );
}
