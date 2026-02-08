'use client';

import { useState, useCallback } from 'react';
import { createSandbox, validateUrl } from './security';

// Tool Types
export type ToolType = 'web_search' | 'code_execute' | 'file_read' | 'file_write' | 'calculator' | 'datetime' | 'json_parse' | 'url_fetch';

export interface Tool {
    id: ToolType;
    name: string;
    description: string;
    icon: string;
    category: 'web' | 'code' | 'file' | 'utility';
    parameters: ToolParameter[];
    execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    defaultValue?: unknown;
}

export interface ToolResult {
    success: boolean;
    data?: unknown;
    error?: string;
    executionTime?: number;
}

export interface ToolCall {
    id: string;
    toolId: ToolType;
    parameters: Record<string, unknown>;
    result?: ToolResult;
    status: 'pending' | 'running' | 'completed' | 'failed';
    timestamp: Date;
}

// Tool Implementations
const webSearchTool: Tool = {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information',
    icon: '🔍',
    category: 'web',
    parameters: [
        { name: 'query', type: 'string', description: 'Search query', required: true },
        { name: 'limit', type: 'number', description: 'Max results', required: false, defaultValue: 5 },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            // ⚠️ MOCK — In production, integrate a real search API (e.g., Bing/Google Custom Search)
            const query = params.query as string;
            const mockResults = [
                { title: `[MOCK] Result 1 for "${query}"`, url: 'https://example.com/1', snippet: 'This is a sample search result...' },
                { title: `[MOCK] Result 2 for "${query}"`, url: 'https://example.com/2', snippet: 'Another relevant result...' },
                { title: `[MOCK] Result 3 for "${query}"`, url: 'https://example.com/3', snippet: 'More information about your query...' },
            ];
            return {
                success: true,
                data: {
                    results: mockResults,
                    query,
                    totalResults: 3,
                    disclaimer: '⚠️ [MOCK DATA] Kết quả mô phỏng, không phải tìm kiếm thật. / Simulated results, not a real web search.',
                },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

const codeExecuteTool: Tool = {
    id: 'code_execute',
    name: 'Code Execute',
    description: 'Execute JavaScript code safely',
    icon: '▶️',
    category: 'code',
    parameters: [
        { name: 'code', type: 'string', description: 'JavaScript code to execute', required: true },
        { name: 'timeout', type: 'number', description: 'Timeout in ms', required: false, defaultValue: 5000 },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            const code = params.code as string;
            const timeout = (params.timeout as number) || 5000;
            // Use CVF sandbox for safe execution (keyword blocklist + limited globals)
            const sandbox = createSandbox();
            const { result, error } = sandbox.executeAsync
                ? await sandbox.executeAsync(code, timeout)
                : sandbox.execute(code, timeout);
            if (error) {
                return { success: false, error, executionTime: Date.now() - startTime };
            }
            return {
                success: true,
                data: { result: JSON.stringify(result, null, 2), type: typeof result },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

const calculatorTool: Tool = {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations',
    icon: '🔢',
    category: 'utility',
    parameters: [
        { name: 'expression', type: 'string', description: 'Math expression (e.g., "2 + 2 * 3")', required: true },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            const expr = params.expression as string;
            // Safe math evaluation
            const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
            const result = Function(`"use strict"; return (${sanitized})`)();
            return {
                success: true,
                data: { expression: expr, result: Number(result) },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

const datetimeTool: Tool = {
    id: 'datetime',
    name: 'Date & Time',
    description: 'Get current date/time or format dates',
    icon: '📅',
    category: 'utility',
    parameters: [
        { name: 'format', type: 'string', description: 'Output format (iso, locale, unix)', required: false, defaultValue: 'iso' },
        { name: 'timezone', type: 'string', description: 'Timezone', required: false, defaultValue: 'Asia/Ho_Chi_Minh' },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            const format = params.format as string || 'iso';
            const timezone = params.timezone as string || 'Asia/Ho_Chi_Minh';
            const now = new Date();

            let formatted: string | number;
            if (format === 'unix') {
                formatted = Math.floor(now.getTime() / 1000);
            } else if (format === 'locale') {
                formatted = now.toLocaleString('vi-VN', { timeZone: timezone });
            } else {
                formatted = now.toISOString();
            }

            return {
                success: true,
                data: { formatted, timestamp: now.getTime(), timezone },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

const jsonParseTool: Tool = {
    id: 'json_parse',
    name: 'JSON Parser',
    description: 'Parse and format JSON data',
    icon: '📋',
    category: 'utility',
    parameters: [
        { name: 'input', type: 'string', description: 'JSON string to parse', required: true },
        { name: 'path', type: 'string', description: 'JSON path to extract (e.g., "data.items[0]")', required: false },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            const input = params.input as string;
            const parsed = JSON.parse(input);

            let result = parsed;
            if (params.path) {
                const pathParts = (params.path as string).split(/[.\[\]]+/).filter(Boolean);
                for (const part of pathParts) {
                    result = result?.[part];
                }
            }

            return {
                success: true,
                data: { parsed: result, keys: Object.keys(parsed) },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

const urlFetchTool: Tool = {
    id: 'url_fetch',
    name: 'URL Fetch',
    description: 'Fetch data from a URL (CORS permitting)',
    icon: '🌐',
    category: 'web',
    parameters: [
        { name: 'url', type: 'string', description: 'URL to fetch', required: true },
        { name: 'method', type: 'string', description: 'HTTP method', required: false, defaultValue: 'GET' },
    ],
    execute: async (params) => {
        const startTime = Date.now();
        try {
            const url = params.url as string;
            const method = (params.method as string) || 'GET';

            // Security: validate URL and block private/internal addresses
            if (!validateUrl(url)) {
                return { success: false, error: 'Invalid URL: must be http or https', executionTime: Date.now() - startTime };
            }
            const BLOCKED_PATTERNS = [
                /^https?:\/\/(localhost|127\.|0\.0\.0\.0)/i,
                /^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01]))/,
                /^https?:\/\/\[::1\]/,
                /^https?:\/\/169\.254\./,  // link-local
            ];
            if (BLOCKED_PATTERNS.some(p => p.test(url))) {
                return { success: false, error: 'Blocked: cannot fetch internal/private network URLs', executionTime: Date.now() - startTime };
            }

            const response = await fetch(url, { method });
            const contentType = response.headers.get('content-type') || '';

            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            return {
                success: true,
                data: { status: response.status, contentType, data },
                executionTime: Date.now() - startTime,
            };
        } catch (error) {
            return { success: false, error: String(error), executionTime: Date.now() - startTime };
        }
    },
};

// All available tools
export const AVAILABLE_TOOLS: Record<ToolType, Tool> = {
    web_search: webSearchTool,
    code_execute: codeExecuteTool,
    calculator: calculatorTool,
    datetime: datetimeTool,
    json_parse: jsonParseTool,
    url_fetch: urlFetchTool,
    file_read: {
        id: 'file_read',
        name: 'File Read',
        description: 'Read file content from localStorage',
        icon: '📄',
        category: 'file',
        parameters: [
            { name: 'key', type: 'string', description: 'Storage key', required: true },
        ],
        execute: async (params) => {
            const startTime = Date.now();
            try {
                const key = params.key as string;
                const data = localStorage.getItem(key);
                return {
                    success: true,
                    data: { key, content: data, exists: data !== null },
                    executionTime: Date.now() - startTime,
                };
            } catch (error) {
                return { success: false, error: String(error), executionTime: Date.now() - startTime };
            }
        },
    },
    file_write: {
        id: 'file_write',
        name: 'File Write',
        description: 'Write file content to localStorage',
        icon: '💾',
        category: 'file',
        parameters: [
            { name: 'key', type: 'string', description: 'Storage key', required: true },
            { name: 'content', type: 'string', description: 'Content to write', required: true },
        ],
        execute: async (params) => {
            const startTime = Date.now();
            try {
                const key = params.key as string;
                const content = params.content as string;
                localStorage.setItem(key, content);
                return {
                    success: true,
                    data: { key, bytesWritten: content.length },
                    executionTime: Date.now() - startTime,
                };
            } catch (error) {
                return { success: false, error: String(error), executionTime: Date.now() - startTime };
            }
        },
    },
};

// Hook for using tools
export function useTools() {
    const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);

    const executeTool = useCallback(async (
        toolId: ToolType,
        parameters: Record<string, unknown>
    ): Promise<ToolResult> => {
        const tool = AVAILABLE_TOOLS[toolId];
        if (!tool) {
            return { success: false, error: `Tool not found: ${toolId}` };
        }

        const callId = `call_${Date.now()}`;
        const newCall: ToolCall = {
            id: callId,
            toolId,
            parameters,
            status: 'running',
            timestamp: new Date(),
        };

        setToolCalls(prev => [...prev, newCall]);
        setIsExecuting(true);

        try {
            const result = await tool.execute(parameters);

            setToolCalls(prev => prev.map(c =>
                c.id === callId
                    ? { ...c, status: result.success ? 'completed' : 'failed', result }
                    : c
            ));

            return result;
        } catch (error) {
            const errorResult: ToolResult = { success: false, error: String(error) };
            setToolCalls(prev => prev.map(c =>
                c.id === callId
                    ? { ...c, status: 'failed', result: errorResult }
                    : c
            ));
            return errorResult;
        } finally {
            setIsExecuting(false);
        }
    }, []);

    const clearHistory = useCallback(() => {
        setToolCalls([]);
    }, []);

    return {
        tools: AVAILABLE_TOOLS,
        toolCalls,
        isExecuting,
        executeTool,
        clearHistory,
    };
}

// Tool Card Component
export function ToolCard({
    tool,
    onExecute,
    isActive
}: {
    tool: Tool;
    onExecute?: (tool: Tool) => void;
    isActive?: boolean;
}) {
    const categoryColors: Record<string, string> = {
        web: 'from-blue-500 to-cyan-500',
        code: 'from-green-500 to-emerald-500',
        file: 'from-amber-500 to-orange-500',
        utility: 'from-purple-500 to-pink-500',
    };

    return (
        <button
            onClick={() => onExecute?.(tool)}
            className={`p-4 rounded-xl border-2 transition-all text-left
                       ${isActive
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }
                       bg-white dark:bg-gray-900`}
        >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryColors[tool.category]} 
                           flex items-center justify-center text-xl mb-2`}>
                {tool.icon}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">{tool.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{tool.description}</p>
            <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${categoryColors[tool.category]} text-white`}>
                    {tool.category}
                </span>
            </div>
        </button>
    );
}

// Tools Panel Component
export function ToolsPanel({
    onToolResult
}: {
    onToolResult?: (toolId: ToolType, result: ToolResult) => void;
}) {
    const { tools, toolCalls, isExecuting, executeTool } = useTools();
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [params, setParams] = useState<Record<string, string>>({});

    const handleExecute = async () => {
        if (!selectedTool) return;

        const result = await executeTool(selectedTool.id, params);
        onToolResult?.(selectedTool.id, result);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🛠️ Agent Tools
            </h3>

            {/* Tool Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {Object.values(tools).map(tool => (
                    <ToolCard
                        key={tool.id}
                        tool={tool}
                        isActive={selectedTool?.id === tool.id}
                        onExecute={setSelectedTool}
                    />
                ))}
            </div>

            {/* Selected Tool Params */}
            {selectedTool && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        {selectedTool.icon} {selectedTool.name}
                    </h4>

                    <div className="space-y-3">
                        {selectedTool.parameters.map(param => (
                            <div key={param.name}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {param.name} {param.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type={param.type === 'number' ? 'number' : 'text'}
                                    value={params[param.name] || ''}
                                    onChange={(e) => setParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                                    placeholder={param.description}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 
                                              rounded-lg bg-white dark:bg-gray-900 text-sm"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleExecute}
                        disabled={isExecuting}
                        className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white 
                                  rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                        {isExecuting ? '⏳ Executing...' : '▶️ Execute'}
                    </button>
                </div>
            )}

            {/* Recent Tool Calls */}
            {toolCalls.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Recent Calls</h4>
                    <div className="space-y-2 max-h-48 overflow-auto">
                        {toolCalls.slice(-5).reverse().map(call => (
                            <div
                                key={call.id}
                                className={`p-2 rounded text-xs ${call.status === 'completed'
                                        ? 'bg-green-50 dark:bg-green-900/30'
                                        : call.status === 'failed'
                                            ? 'bg-red-50 dark:bg-red-900/30'
                                            : 'bg-gray-50 dark:bg-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{tools[call.toolId]?.icon}</span>
                                    <span className="font-medium">{tools[call.toolId]?.name}</span>
                                    <span className={`ml-auto ${call.status === 'completed' ? 'text-green-600' :
                                            call.status === 'failed' ? 'text-red-600' : 'text-gray-500'
                                        }`}>
                                        {call.status}
                                    </span>
                                </div>
                                {call.result && (
                                    <pre className="mt-1 text-gray-600 dark:text-gray-400 truncate">
                                        {JSON.stringify(call.result.data || call.result.error, null, 2).substring(0, 100)}...
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
