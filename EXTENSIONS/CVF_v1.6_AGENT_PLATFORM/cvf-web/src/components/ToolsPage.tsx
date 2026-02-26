'use client';

import { useMemo, useState, useCallback } from 'react';
import { AVAILABLE_TOOLS, useTools, ToolType, ToolResult } from '@/lib/agent-tools';
import { useLanguage } from '@/lib/i18n';

interface ToolsPageProps {
    onClose?: () => void;
}

export function ToolsPage({ onClose }: ToolsPageProps) {
    const { toolCalls, clearHistory, executeTool, isExecuting } = useTools();
    const { t } = useLanguage();
    const [selectedToolId, setSelectedToolId] = useState<ToolType | null>(null);
    const [params, setParams] = useState<Record<string, string>>({});
    const [lastExecResult, setLastExecResult] = useState<{ toolId: ToolType; result: ToolResult } | null>(null);

    const lastResult = useMemo(() => {
        if (toolCalls.length === 0) return null;
        const latest = [...toolCalls].reverse().find(call => call.result);
        return latest?.result ? { toolId: latest.toolId, result: latest.result } : null;
    }, [toolCalls]);

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

    const handleSelectTool = useCallback((toolId: ToolType) => {
        if (selectedToolId === toolId) {
            setSelectedToolId(null);
            setParams({});
        } else {
            setSelectedToolId(toolId);
            setParams({});
            setLastExecResult(null);
        }
    }, [selectedToolId]);

    const handleExecute = useCallback(async () => {
        if (!selectedToolId) return;
        const result = await executeTool(selectedToolId, params);
        setLastExecResult({ toolId: selectedToolId, result });
    }, [selectedToolId, params, executeTool]);

    const displayResult = lastExecResult || lastResult;

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

                    {/* Execution Result */}
                    {displayResult && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {t('tools.latestResult')}
                                    <span className="text-sm font-normal text-gray-500">
                                        {getToolName(displayResult.toolId, AVAILABLE_TOOLS[displayResult.toolId]?.name || '')}
                                    </span>
                                </h3>
                                <span className={`text-sm px-2 py-1 rounded ${displayResult.result.success
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                    {displayResult.result.success ? t('tools.success') : t('tools.failed')}
                                </span>
                            </div>

                            {displayResult.result.executionTime && (
                                <p className="text-xs text-gray-500 mb-2">
                                    ⏱️ {t('tools.executionTime')}: {displayResult.result.executionTime}ms
                                </p>
                            )}

                            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-auto max-h-64">
                                {JSON.stringify(displayResult.result.data || displayResult.result.error, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Tools Grid — Interactive */}
                    <div className="mt-4">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                            {t('tools.documentation')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(AVAILABLE_TOOLS).map(tool => (
                                <div key={tool.id}>
                                    <button
                                        onClick={() => handleSelectTool(tool.id)}
                                        className={`w-full text-left p-4 border rounded-lg transition-all ${selectedToolId === tool.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm'
                                            }`}
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
                                    </button>

                                    {/* Expanded Execute Form */}
                                    {selectedToolId === tool.id && (
                                        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <div className="space-y-3">
                                                {tool.parameters.map(param => (
                                                    <div key={param.name}>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            {param.name} {param.required && <span className="text-red-500">*</span>}
                                                        </label>
                                                        <input
                                                            type={param.type === 'number' ? 'number' : 'text'}
                                                            value={params[param.name] || ''}
                                                            onChange={(e) => setParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                                                            placeholder={getParamDescription(tool.id, param.name, param.description)}
                                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={handleExecute}
                                                disabled={isExecuting}
                                                className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                                            >
                                                {isExecuting ? '⏳ Executing...' : `▶️ ${t('tools.execute')}`}
                                            </button>
                                        </div>
                                    )}
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
