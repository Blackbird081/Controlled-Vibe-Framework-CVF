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
import { useQuotaManager } from '@/lib/quota-manager';
import { evaluateEnforcement } from '@/lib/enforcement';
import { logEnforcementDecision } from '@/lib/enforcement-log';
import { useLanguage } from '@/lib/i18n';
import { GovernanceBar } from './GovernanceBar';
import { GovernancePanel } from './GovernancePanel';
import {
    GovernanceState,
    DEFAULT_GOVERNANCE_STATE,
    buildGovernanceSystemPrompt,
    buildSelfUATPrompt,
} from '@/lib/governance-context';

type Lang = 'vi' | 'en';

const UI: Record<Lang, {
    title: string;
    subtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    chooseWorkflow: string;
    modeSummary: string;
    configInSettings: string;
    singleAiAll: string;
    availableAgents: string;
    agentOutputs: string;
    startNew: string;
    done: string;
    processing: string;
    governanceBar: string;
    errorNoInput: string;
    errorNoApiKey: string;
    errorClarify: string;
    errorRiskStopped: string;
    riskPrompt: string;
}> = {
    vi: {
        title: '🤖 Multi-Agent Workflow',
        subtitle: 'Phối hợp nhiều AI agents để hoàn thành task',
        inputLabel: '📝 Nhập yêu cầu của bạn',
        inputPlaceholder: 'Ví dụ: Xây dựng API REST cho quản lý sản phẩm với CRUD operations...',
        chooseWorkflow: '🎯 Chọn Workflow',
        modeSummary: '🧩 Multi-Agent Mode',
        configInSettings: 'Cấu hình trong Settings → Preferences.',
        singleAiAll: 'Dùng 1 provider cho tất cả vai trò',
        availableAgents: 'Agents có sẵn',
        agentOutputs: '📤 Kết quả từ Agents',
        startNew: '🔄 Bắt đầu mới',
        done: '✓ Xong',
        processing: 'Đang xử lý với agent hiện tại...',
        governanceBar: '🔐 Governance',
        errorNoInput: 'Vui lòng nhập yêu cầu của bạn',
        errorNoApiKey: 'Chưa cấu hình API key. Vui lòng vào Settings.',
        errorClarify: 'Thiếu thông tin quan trọng. Vui lòng bổ sung để tiếp tục.',
        errorRiskStopped: 'Đã dừng do chưa có xác nhận rủi ro.',
        riskPrompt: 'Rủi ro yêu cầu xác nhận. Tiếp tục?',
    },
    en: {
        title: '🤖 Multi-Agent Workflow',
        subtitle: 'Coordinate multiple AI agents to complete tasks',
        inputLabel: '📝 Enter your request',
        inputPlaceholder: 'Example: Build a REST API for product management with CRUD operations...',
        chooseWorkflow: '🎯 Choose Workflow',
        modeSummary: '🧩 Multi-Agent Mode',
        configInSettings: 'Configure in Settings → Preferences.',
        singleAiAll: 'Using 1 provider for all roles',
        availableAgents: 'Available Agents',
        agentOutputs: '📤 Agent Outputs',
        startNew: '🔄 Start New',
        done: '✓ Done',
        processing: 'Processing with current agent...',
        governanceBar: '🔐 Governance',
        errorNoInput: 'Please enter your request',
        errorNoApiKey: 'No API key configured. Please go to Settings.',
        errorClarify: 'Missing critical information. Please add details to continue.',
        errorRiskStopped: 'Stopped — risk has not been confirmed.',
        riskPrompt: 'Risk detected, confirmation required. Continue?',
    },
};

interface MultiAgentPanelProps {
    initialInput?: string;
    onComplete?: (result: string) => void;
    onClose?: () => void;
}

export function MultiAgentPanel({ initialInput, onComplete, onClose }: MultiAgentPanelProps) {
    const { settings } = useSettings();
    const { checkBudget } = useQuotaManager();
    const { language } = useLanguage();
    const ui = UI[language];
    const {
        workflow,
        isRunning,
        setIsRunning,
        createWorkflow,
        addTask,
        updateTaskStatus,
        moveToNextAgent,
        getCurrentAgent,
        setWorkflowStatus,
        reset,
    } = useMultiAgentWorkflow();

    const [input, setInput] = useState(initialInput || '');
    const [outputs, setOutputs] = useState<Record<string, string>>({});
    const [outputLog, setOutputLog] = useState<{ agentId: string; content: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Governance state — managed locally for multi-agent
    const [govState, setGovState] = useState<GovernanceState>(DEFAULT_GOVERNANCE_STATE);
    const [showGovernancePanel, setShowGovernancePanel] = useState(false);

    const roleGuidelines: Record<Agent['role'], { goal: string; output: string; handoff: string }> = {
        orchestrator: {
            goal: 'Break down the request into a clear task plan and assign responsibilities to other agents.',
            output: `## Task Breakdown
- Goal
- Key assumptions
- Constraints

## Agent Assignments
- Architect: ...
- Builder: ...
- Reviewer: ...

## Risks & Mitigations
- ...

## Definition of Done
- ...`,
            handoff: 'End with a short "Handoff to Architect" section summarizing priorities.',
        },
        architect: {
            goal: 'Design the solution with clear specs, architecture, and interfaces.',
            output: `## Architecture Overview
- Components
- Data flow

## Specifications
- APIs / Interfaces
- Data models

## Decisions
- ...

## Build Plan
- Steps for Builder`,
            handoff: 'End with "Handoff to Builder" that lists build steps and critical constraints.',
        },
        builder: {
            goal: 'Implement the solution or provide build-ready output based on specs.',
            output: `## Implementation
- Core logic
- Key files / modules

## Setup & Run
- Commands

## Notes
- ...`,
            handoff: 'End with "Handoff to Reviewer" listing what to review and known limitations.',
        },
        reviewer: {
            goal: 'Review output for bugs, gaps, and alignment with specs.',
            output: `## Review Summary
- Pass/Fail

## Issues & Risks
- ...

## Improvements
- ...

## Final Recommendation
- ...`,
            handoff: 'End with a concise acceptance recommendation.',
        },
    };

    const modeGuidance = (mode: 'simple' | 'governance' | 'full') => {
        if (mode === 'simple') {
            return 'Operate in Simple mode: be direct, concise, and focus on delivery.';
        }
        if (mode === 'governance') {
            return 'Operate in Governance mode: do not invent missing inputs, ask for clarification when required, follow constraints.';
        }
        return 'Operate in Full mode: follow CVF phases, document decisions, and enforce guardrails.';
    };

    const buildAgentPrompt = (
        agent: Agent,
        userRequest: string,
        previousOutputs: { agentId: string; content: string }[],
        mode: 'simple' | 'governance' | 'full'
    ) => {
        const history = previousOutputs.length
            ? previousOutputs.map((entry, idx) => {
                const label = AGENTS[entry.agentId as keyof typeof AGENTS]?.name || entry.agentId;
                const snippet = entry.content.length > 1600 ? `${entry.content.slice(0, 1600)}…` : entry.content;
                return `${idx + 1}. ${label} Output:\n${snippet}`;
            }).join('\n\n')
            : 'No previous outputs.';

        const directive = roleGuidelines[agent.role];

        // Build governance context if toolkit is enabled
        const governanceBlock = govState.toolkitEnabled
            ? `\n## CVF Governance Context\n${buildGovernanceSystemPrompt(govState, language)}\n`
            : '';

        return `# CVF Multi-Agent Context
Mode: ${mode}
${governanceBlock}
## User Request
${userRequest}

## Previous Outputs
${history}

## Your Role: ${agent.name}
Goal: ${directive.goal}

## Required Output Format
${directive.output}

## Handoff Requirement
${directive.handoff}
`;
    };

    // Start workflow execution
    const handleStartWorkflow = async (templateKey: keyof typeof WORKFLOW_TEMPLATES) => {
        if (!input.trim()) {
            setError(ui.errorNoInput);
            return;
        }

        setError(null);
        setOutputs({});
        setOutputLog([]);
        const wf = createWorkflow(templateKey);
        setWorkflowStatus('running');
        setIsRunning(true);

        // Execute agents sequentially
        let history: { agentId: string; content: string }[] = [];

        for (let i = 0; i < wf.agents.length; i++) {
            const agent = wf.agents[i];

            try {
                const mode = settings.preferences.defaultExportMode;
                const agentPrompt = buildAgentPrompt(agent, input, history, mode);

                const enforcement = evaluateEnforcement({
                    mode,
                    content: agentPrompt,
                    budgetOk: checkBudget().ok,
                });
                logEnforcementDecision({
                    source: 'multi_agent',
                    mode,
                    enforcement,
                    context: {
                        agent: agent.role,
                        workflow: wf.id,
                        governance: govState.toolkitEnabled ? {
                            phase: govState.phase,
                            role: govState.role,
                            riskLevel: govState.riskLevel,
                        } : undefined,
                    },
                });

                if (enforcement.status === 'BLOCK') {
                    setError(enforcement.reasons.join(' | ') || 'Execution blocked by policy');
                    setWorkflowStatus('failed');
                    setIsRunning(false);
                    return;
                }

                if (enforcement.status === 'CLARIFY') {
                    setError(ui.errorClarify);
                    setWorkflowStatus('failed');
                    setIsRunning(false);
                    return;
                }

                if (enforcement.status === 'NEEDS_APPROVAL') {
                    const prompt = `${ui.riskPrompt} (${enforcement.riskGate?.riskLevel || ''})`;
                    const approved = typeof window === 'undefined' ? true : window.confirm(prompt);
                    if (!approved) {
                        setError(ui.errorRiskStopped);
                        setWorkflowStatus('failed');
                        setIsRunning(false);
                        return;
                    }
                }

                // Add task
                const task = addTask(agent.id, agentPrompt);
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
                    setError(ui.errorNoApiKey);
                    setIsRunning(false);
                    return;
                }

                const aiProvider = createAIProvider(provider, { apiKey });

                // Build messages with system prompt + governance
                let systemPrompt = `${agent.systemPrompt}\n\n${modeGuidance(mode)}`;
                if (govState.toolkitEnabled) {
                    systemPrompt += `\n\n${buildGovernanceSystemPrompt(govState, language)}`;
                }
                const messages = [
                    { role: 'system' as const, content: systemPrompt },
                    { role: 'user' as const, content: agentPrompt },
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
                history = [...history, { agentId: agent.id, content: response }];
                setOutputLog(history);

                // Move to next agent
                moveToNextAgent();

            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(`Error with ${agent.name}: ${errorMsg}`);
                setWorkflowStatus('failed');
                setIsRunning(false);
                return;
            }
        }

        setIsRunning(false);
        setWorkflowStatus('completed');
        if (onComplete && wf.agents.length > 0) {
            const lastAgent = wf.agents[wf.agents.length - 1];
            onComplete(outputs[lastAgent.id] || '');
        }
    };

    // Reset and start over
    const handleReset = () => {
        reset();
        setOutputs({});
        setOutputLog([]);
        setError(null);
        setInput(initialInput || '');
    };

    // Self-UAT: call AI with governance + UAT prompt, return raw response
    const handleRunSelfUAT = async (prompt: string): Promise<string> => {
        const provider = settings.preferences.defaultProvider;
        const apiKey = settings.providers[provider]?.apiKey;

        if (!apiKey) {
            throw new Error(language === 'vi' ? 'Chưa cấu hình API key' : 'No API key configured');
        }

        const aiProvider = createAIProvider(provider, { apiKey });

        // Build system prompt with governance context
        const systemPrompt = buildGovernanceSystemPrompt(govState, language);

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: prompt },
        ];

        let response = '';
        const result = await aiProvider.chat(messages, (chunk) => {
            response += chunk.text;
        });
        return result.text || response;
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {ui.title}
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
                        {ui.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Governance Panel Toggle */}
                    <button
                        onClick={() => setShowGovernancePanel(prev => !prev)}
                        className={`p-2 rounded-lg transition-colors ${showGovernancePanel
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                            }`}
                        title={language === 'vi' ? 'Governance Panel' : 'Governance Panel'}
                    >
                        🛡️
                    </button>
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
                {!workflow ? (
                    // Step 1: Input and Select Workflow
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {ui.inputLabel}
                            </label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={ui.inputPlaceholder}
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

                        {/* GovernanceBar — CVF control mechanism */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                                {ui.governanceBar}
                            </h3>
                            <GovernanceBar
                                onStateChange={setGovState}
                                compact={true}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {ui.chooseWorkflow}
                            </label>
                            <WorkflowSelector onSelect={handleStartWorkflow} language={language} />
                        </div>

                        {/* Multi-Agent Mode Summary */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {ui.modeSummary}
                                </h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${settings.preferences.multiAgentMode === 'single'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                                    }`}>
                                    {settings.preferences.multiAgentMode === 'single' ? 'Single AI' : 'Multi AI'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">
                                {ui.configInSettings}
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
                                    {ui.singleAiAll}: {settings.preferences.defaultProvider}
                                </div>
                            )}
                        </div>

                        {/* Available Agents */}
                        <div className="mt-8">
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                {ui.availableAgents}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.values(AGENTS).map(agent => (
                                    <div
                                        key={agent.id}
                                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center"
                                    >
                                        <span className="text-2xl">{agent.icon}</span>
                                        <div className="text-sm font-medium mt-1">{agent.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {language === 'vi' ? agent.descriptionVi : agent.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Step 2: Workflow Execution
                    <div className="max-w-4xl mx-auto space-y-6">
                        <WorkflowProgress workflow={workflow} language={language} />

                        {/* Governance badge during execution */}
                        {govState.toolkitEnabled && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                                    🔐 Phase: {govState.phase}
                                </span>
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                                    👤 Role: {govState.role}
                                </span>
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium">
                                    ⚠️ Risk: {govState.riskLevel}
                                </span>
                            </div>
                        )}

                        {/* Agent Outputs */}
                        {Object.entries(outputs).length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    {ui.agentOutputs}
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
                                    {ui.startNew}
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium
                                                  hover:bg-blue-700 transition-colors"
                                    >
                                        {ui.done}
                                    </button>
                                )}
                            </div>
                        )}

                        {isRunning && (
                            <div className="flex items-center gap-3 text-blue-600">
                                <div className="animate-spin">⏳</div>
                                <span>{ui.processing}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Governance Panel Slide-over */}
            <GovernancePanel
                governanceState={govState}
                onRunSelfUAT={handleRunSelfUAT}
                isOpen={showGovernancePanel}
                onClose={() => setShowGovernancePanel(false)}
            />
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
