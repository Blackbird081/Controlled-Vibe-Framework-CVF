'use client';

import { useState, useCallback } from 'react';
import {
    useMultiAgentWorkflow,
    WorkflowSelector,
    WorkflowProgress,
    WORKFLOW_TEMPLATES,
    AgentCard,
    AGENTS,
    Agent
} from '@/lib/multi-agent';
import { createAIProvider } from '@/lib/ai-providers';
import { useSettings } from './Settings';

interface MultiAgentPanelProps {
    initialInput?: string;
    onComplete?: (result: string) => void;
    onClose?: () => void;
}

export function MultiAgentPanel({ initialInput, onComplete, onClose }: MultiAgentPanelProps) {
    const { settings } = useSettings();
    const {
        workflow,
        isRunning,
        setIsRunning,
        createWorkflow,
        addTask,
        updateTaskStatus,
        moveToNextAgent,
        getCurrentAgent,
        reset,
    } = useMultiAgentWorkflow();

    const [input, setInput] = useState(initialInput || '');
    const [outputs, setOutputs] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // Start workflow execution
    const handleStartWorkflow = async (templateKey: keyof typeof WORKFLOW_TEMPLATES) => {
        if (!input.trim()) {
            setError('Vui lòng nhập yêu cầu của bạn');
            return;
        }

        setError(null);
        const wf = createWorkflow(templateKey);
        setIsRunning(true);

        // Execute agents sequentially
        let currentInput = input;

        for (let i = 0; i < wf.agents.length; i++) {
            const agent = wf.agents[i];

            try {
                // Add task
                const task = addTask(agent.id, currentInput);
                if (!task) continue;

                // Update status to running
                updateTaskStatus(task.id, 'running');

                // Call AI with agent's system prompt
                // Select provider based on multi-agent mode
                const provider = settings.preferences.multiAgentMode === 'multi' && settings.preferences.agentProviders
                    ? settings.preferences.agentProviders[agent.role as keyof typeof settings.preferences.agentProviders]
                    : settings.preferences.defaultProvider;

                const apiKey = settings.providers[provider]?.apiKey;

                if (!apiKey) {
                    updateTaskStatus(task.id, 'failed', undefined, 'No API key configured');
                    setError('Chưa cấu hình API key. Vui lòng vào Settings.');
                    setIsRunning(false);
                    return;
                }

                const aiProvider = createAIProvider(provider, { apiKey });

                // Build messages with system prompt
                const messages = [
                    { role: 'system' as const, content: agent.systemPrompt },
                    { role: 'user' as const, content: currentInput },
                ];

                // Get response
                let response = '';
                const result = await aiProvider.chat(messages, (chunk) => {
                    response += chunk.text;
                });
                response = result.text;

                // Update task and output
                updateTaskStatus(task.id, 'completed', response);
                setOutputs(prev => ({ ...prev, [agent.id]: response }));

                // Use this output as input for next agent
                currentInput = `Previous agent (${agent.name}) output:\n\n${response}\n\nContinue based on this.`;

                // Move to next agent
                moveToNextAgent();

            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(`Error with ${agent.name}: ${errorMsg}`);
                setIsRunning(false);
                return;
            }
        }

        setIsRunning(false);
        if (onComplete && wf.agents.length > 0) {
            const lastAgent = wf.agents[wf.agents.length - 1];
            onComplete(outputs[lastAgent.id] || '');
        }
    };

    // Reset and start over
    const handleReset = () => {
        reset();
        setOutputs({});
        setError(null);
        setInput(initialInput || '');
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            🤖 Multi-Agent Workflow
                        </h2>
                        {/* Mode Indicator */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settings.preferences.multiAgentMode === 'single'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            }`}>
                            {settings.preferences.multiAgentMode === 'single' ? '🎯 Single AI' : '🤖 Multi AI'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Phối hợp nhiều AI agents để hoàn thành task
                    </p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6">
                {!workflow ? (
                    // Step 1: Input and Select Workflow
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                📝 Nhập yêu cầu của bạn
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ví dụ: Xây dựng API REST cho quản lý sản phẩm với CRUD operations..."
                                className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 
                                          rounded-xl bg-white dark:bg-gray-800 
                                          text-gray-900 dark:text-white resize-none
                                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
                                ⚠️ {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                🎯 Chọn Workflow
                            </label>
                            <WorkflowSelector onSelect={handleStartWorkflow} />
                        </div>

                        {/* Multi-Agent Mode Summary */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    🧩 Multi-Agent Mode
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settings.preferences.multiAgentMode === 'single'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                    }`}>
                                    {settings.preferences.multiAgentMode === 'single' ? 'Single AI' : 'Multi AI'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                Cấu hình trong Settings → Preferences.
                            </p>
                            {settings.preferences.multiAgentMode === 'multi' && (
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                                    <div>Orchestrator: {settings.preferences.agentProviders.orchestrator}</div>
                                    <div>Architect: {settings.preferences.agentProviders.architect}</div>
                                    <div>Builder: {settings.preferences.agentProviders.builder}</div>
                                    <div>Reviewer: {settings.preferences.agentProviders.reviewer}</div>
                                </div>
                            )}
                            {settings.preferences.multiAgentMode === 'single' && (
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                    Dùng 1 provider cho tất cả vai trò: {settings.preferences.defaultProvider}
                                </div>
                            )}
                        </div>

                        {/* Available Agents */}
                        <div className="mt-8">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Available Agents
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.values(AGENTS).map(agent => (
                                    <div
                                        key={agent.id}
                                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                                    >
                                        <span className="text-2xl">{agent.icon}</span>
                                        <div className="text-sm font-medium mt-1">{agent.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Step 2: Workflow Execution
                    <div className="max-w-4xl mx-auto space-y-6">
                        <WorkflowProgress workflow={workflow} />

                        {/* Agent Outputs */}
                        {Object.entries(outputs).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    📤 Agent Outputs
                                </h3>
                                {Object.entries(outputs).map(([agentId, output]) => {
                                    const agent = AGENTS[agentId as keyof typeof AGENTS];
                                    return (
                                        <div
                                            key={agentId}
                                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span>{agent?.icon}</span>
                                                <span className="font-bold">{agent?.name}</span>
                                            </div>
                                            <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 max-h-64 overflow-auto">
                                                {output}
                                            </pre>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Actions */}
                        {!isRunning && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium
                                              hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    🔄 Start New
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium
                                                  hover:bg-blue-700 transition-colors"
                                    >
                                        ✓ Done
                                    </button>
                                )}
                            </div>
                        )}

                        {isRunning && (
                            <div className="flex items-center gap-3 text-blue-600">
                                <div className="animate-spin">⏳</div>
                                <span>Đang xử lý với agent hiện tại...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Quick Multi-Agent Button
export function MultiAgentButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white 
                      rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
            <span>🤖</span>
            <span>Multi-Agent</span>
        </button>
    );
}
