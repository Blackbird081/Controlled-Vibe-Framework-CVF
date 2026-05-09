'use client';

import { useState, useCallback } from 'react';

type Lang = 'vi' | 'en';

// Agent Types
export type AgentRole = 'architect' | 'builder' | 'reviewer' | 'orchestrator';

export interface Agent {
    id: string;
    name: string;
    role: AgentRole;
    systemPrompt: string;
    description: string;
    descriptionVi: string;
    icon: string;
    color: string;
}

export interface AgentTask {
    id: string;
    agentId: string;
    input: string;
    output?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: Date;
    endTime?: Date;
    error?: string;
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    agents: Agent[];
    tasks: AgentTask[];
    status: 'idle' | 'running' | 'completed' | 'failed';
    currentAgentIndex: number;
}

// Pre-defined Agents
export const AGENTS: Record<AgentRole, Agent> = {
    orchestrator: {
        id: 'orchestrator',
        name: 'Orchestrator',
        role: 'orchestrator',
        icon: '🎯',
        color: 'purple',
        description: 'Coordinates workflow between agents and manages task flow',
        descriptionVi: 'Điều phối workflow giữa các agents và quản lý luồng tác vụ',
        systemPrompt: `You are the Orchestrator Agent for CVF (Controlled Vibe Framework).
Your role is to:
1. Analyze user requirements and break them down into tasks
2. Delegate tasks to appropriate agents (Architect, Builder, Reviewer)
3. Monitor progress and ensure quality
4. Synthesize final results

Always structure your response with clear task assignments and reasoning.`,
    },
    architect: {
        id: 'architect',
        name: 'Architect',
        role: 'architect',
        icon: '📐',
        color: 'blue',
        description: 'Designs system architecture and creates specifications',
        descriptionVi: 'Thiết kế kiến trúc hệ thống và tạo đặc tả',
        systemPrompt: `You are the Architect Agent for CVF (Controlled Vibe Framework).
Your role is to:
1. Design system architecture and data flow
2. Create detailed specifications and API contracts
3. Define component structures and interfaces
4. Consider scalability, security, and best practices

Output structured specifications that the Builder agent can implement.`,
    },
    builder: {
        id: 'builder',
        name: 'Builder',
        role: 'builder',
        icon: '🔨',
        color: 'green',
        description: 'Implements code based on specifications',
        descriptionVi: 'Triển khai code dựa trên đặc tả',
        systemPrompt: `You are the Builder Agent for CVF (Controlled Vibe Framework).
Your role is to:
1. Implement code based on Architect specifications
2. Write clean, maintainable, and tested code
3. Follow best practices and coding standards
4. Document your implementation

Output working code with comments and usage examples.`,
    },
    reviewer: {
        id: 'reviewer',
        name: 'Reviewer',
        role: 'reviewer',
        icon: '🔍',
        color: 'orange',
        description: 'Reviews code and provides feedback',
        descriptionVi: 'Đánh giá code và phản hồi',
        systemPrompt: `You are the Reviewer Agent for CVF (Controlled Vibe Framework).
Your role is to:
1. Review code for bugs, security issues, and best practices
2. Suggest improvements and optimizations
3. Verify implementation matches specifications
4. Ensure code quality standards

Provide detailed review with specific line-level feedback.`,
    },
};

// Workflow Templates
export const WORKFLOW_TEMPLATES = {
    fullCycle: {
        name: 'Full Development Cycle',
        nameVi: 'Chu trình phát triển đầy đủ',
        description: 'Orchestrator → Architect → Builder → Reviewer',
        descriptionVi: 'Điều phối → Thiết kế → Xây dựng → Đánh giá',
        agents: [
            AGENTS.orchestrator,
            AGENTS.architect,
            AGENTS.builder,
            AGENTS.reviewer,
        ],
    },
    designOnly: {
        name: 'Architecture Design',
        nameVi: 'Thiết kế kiến trúc',
        description: 'Architect only - for planning and design',
        descriptionVi: 'Chỉ Architect — cho lập kế hoạch và thiết kế',
        agents: [AGENTS.architect],
    },
    buildReview: {
        name: 'Build & Review',
        nameVi: 'Xây dựng & Đánh giá',
        description: 'Builder → Reviewer - for implementation with review',
        descriptionVi: 'Builder → Reviewer — triển khai có đánh giá',
        agents: [AGENTS.builder, AGENTS.reviewer],
    },
    quickBuild: {
        name: 'Quick Build',
        nameVi: 'Xây dựng nhanh',
        description: 'Builder only - for quick implementation',
        descriptionVi: 'Chỉ Builder — triển khai nhanh',
        agents: [AGENTS.builder],
    },
};

// Hook for Multi-Agent Workflow
export function useMultiAgentWorkflow() {
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const createWorkflow = useCallback((
        templateKey: keyof typeof WORKFLOW_TEMPLATES,
        name?: string
    ): Workflow => {
        const template = WORKFLOW_TEMPLATES[templateKey];
        const newWorkflow: Workflow = {
            id: `workflow_${Date.now()}`,
            name: name || template.name,
            description: template.description,
            agents: [...template.agents],
            tasks: [],
            status: 'idle',
            currentAgentIndex: 0,
        };
        setWorkflow(newWorkflow);
        return newWorkflow;
    }, []);

    const addTask = useCallback((agentId: string, input: string) => {
        if (!workflow) return;

        const newTask: AgentTask = {
            id: `task_${Date.now()}`,
            agentId,
            input,
            status: 'pending',
        };

        setWorkflow(prev => prev ? {
            ...prev,
            tasks: [...prev.tasks, newTask],
        } : null);

        return newTask;
    }, [workflow]);

    const updateTaskStatus = useCallback((
        taskId: string,
        status: AgentTask['status'],
        output?: string,
        error?: string
    ) => {
        setWorkflow(prev => {
            if (!prev) return null;
            return {
                ...prev,
                tasks: prev.tasks.map(t =>
                    t.id === taskId
                        ? {
                            ...t,
                            status,
                            output,
                            error,
                            endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
                        }
                        : t
                ),
            };
        });
    }, []);

    const moveToNextAgent = useCallback(() => {
        setWorkflow(prev => {
            if (!prev) return null;
            const nextIndex = prev.currentAgentIndex + 1;
            if (nextIndex >= prev.agents.length) {
                return { ...prev, status: 'completed' };
            }
            return { ...prev, currentAgentIndex: nextIndex };
        });
    }, []);

    const setWorkflowStatus = useCallback((status: Workflow['status']) => {
        setWorkflow(prev => (prev ? { ...prev, status } : null));
    }, []);

    const getCurrentAgent = useCallback((): Agent | null => {
        if (!workflow) return null;
        return workflow.agents[workflow.currentAgentIndex] || null;
    }, [workflow]);

    const reset = useCallback(() => {
        setWorkflow(null);
        setIsRunning(false);
    }, []);

    return {
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
    };
}

// Agent Card Component
export function AgentCard({
    agent,
    isActive,
    isCompleted,
    onClick,
    language = 'en',
}: {
    agent: Agent;
    isActive?: boolean;
    isCompleted?: boolean;
    onClick?: () => void;
    language?: Lang;
}) {
    const colorClasses: Record<string, string> = {
        purple: 'from-purple-500 to-purple-600 border-purple-400',
        blue: 'from-blue-500 to-blue-600 border-blue-400',
        green: 'from-green-500 to-green-600 border-green-400',
        orange: 'from-orange-500 to-orange-600 border-orange-400',
    };

    const desc = language === 'vi' ? agent.descriptionVi : agent.description;

    return (
        <div
            onClick={onClick}
            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer
                       ${isActive
                    ? `bg-gradient-to-br ${colorClasses[agent.color]} text-white shadow-lg scale-105`
                    : isCompleted
                        ? 'bg-gray-100 dark:bg-gray-800 border-green-400 opacity-75'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                }`}
        >
            {isCompleted && (
                <div className="absolute top-2 right-2 text-green-500">✓</div>
            )}
            {isActive && (
                <div className="absolute top-2 right-2 animate-pulse">⚡</div>
            )}

            <div className="flex items-center gap-3">
                <span className="text-3xl">{agent.icon}</span>
                <div>
                    <h3 className={`font-bold ${isActive ? '' : 'text-gray-900 dark:text-white'}`}>
                        {agent.name}
                    </h3>
                    <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Workflow Selector Component
export function WorkflowSelector({
    onSelect,
    language = 'en',
}: {
    onSelect: (key: keyof typeof WORKFLOW_TEMPLATES) => void;
    language?: Lang;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(WORKFLOW_TEMPLATES) as [keyof typeof WORKFLOW_TEMPLATES, typeof WORKFLOW_TEMPLATES.fullCycle][]).map(([key, template]) => (
                <button
                    key={key}
                    onClick={() => onSelect(key)}
                    className="p-4 text-left rounded-xl border-2 border-gray-200 dark:border-gray-700
                              hover:border-blue-400 dark:hover:border-blue-500 transition-all
                              bg-white dark:bg-gray-900 group"
                >
                    <div className="flex items-center gap-2 mb-2">
                        {template.agents.map((a, i) => (
                            <span key={i} className="text-xl" title={a.name}>{a.icon}</span>
                        ))}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-500">
                        {language === 'vi' ? template.nameVi : template.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {language === 'vi' ? template.descriptionVi : template.description}
                    </p>
                </button>
            ))}
        </div>
    );
}

// Workflow Progress Component
export function WorkflowProgress({ workflow, language = 'en' }: { workflow: Workflow; language?: Lang }) {
    const STATUS_LABELS: Record<Lang, Record<string, string>> = {
        vi: { idle: 'CHỜ', running: 'ĐANG CHẠY', completed: 'HOÀN THÀNH', failed: 'THẤT BẠI' },
        en: { idle: 'IDLE', running: 'RUNNING', completed: 'COMPLETED', failed: 'FAILED' },
    };
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">{workflow.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${workflow.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                    workflow.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        workflow.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                    {STATUS_LABELS[language][workflow.status] || workflow.status.toUpperCase()}
                </span>
            </div>

            {/* Agent Pipeline */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflow.agents.map((agent, index) => (
                    <div key={agent.id} className="flex items-center">
                        <AgentCard
                            agent={agent}
                            isActive={index === workflow.currentAgentIndex && workflow.status === 'running'}
                            isCompleted={index < workflow.currentAgentIndex}
                            language={language}
                        />
                        {index < workflow.agents.length - 1 && (
                            <div className="px-2 text-gray-400">→</div>
                        )}
                    </div>
                ))}
            </div>

            {/* Tasks */}
            {workflow.tasks.length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-500">{language === 'vi' ? 'Tác vụ' : 'Tasks'}</h4>
                    {workflow.tasks.map(task => {
                        const agent = workflow.agents.find(a => a.id === task.agentId);
                        return (
                            <div
                                key={task.id}
                                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{agent?.icon}</span>
                                    <span className="font-medium">{agent?.name}</span>
                                    <span className={`ml-auto px-2 py-0.5 rounded text-xs ${task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            task.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {task.status}
                                    </span>
                                </div>
                                {task.output && (
                                    <div className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {task.output.substring(0, 150)}...
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
