'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

type WorkflowMode = 'simple' | 'governance' | 'full';

interface WorkflowStep {
    id: string;
    label: string;
    labelVi: string;
    icon: string;
    description: string;
    descriptionVi: string;
}

const WORKFLOW_STEPS: Record<WorkflowMode, WorkflowStep[]> = {
    simple: [
        {
            id: 'input',
            label: 'Fill Form',
            labelVi: 'Điền Form',
            icon: '📝',
            description: 'Enter your requirements',
            descriptionVi: 'Nhập yêu cầu của bạn',
        },
        {
            id: 'export',
            label: 'Export Spec',
            labelVi: 'Xuất Spec',
            icon: '📋',
            description: 'Copy prompt to clipboard',
            descriptionVi: 'Copy prompt ra clipboard',
        },
        {
            id: 'paste',
            label: 'Paste to AI',
            labelVi: 'Paste vào AI',
            icon: '🤖',
            description: 'Use in ChatGPT, Claude, Gemini',
            descriptionVi: 'Dùng trong ChatGPT, Claude, Gemini',
        },
    ],
    governance: [
        {
            id: 'input',
            label: 'Fill Form',
            labelVi: 'Điền Form',
            icon: '📝',
            description: 'Enter your requirements',
            descriptionVi: 'Nhập yêu cầu của bạn',
        },
        {
            id: 'rules',
            label: 'Add Rules',
            labelVi: 'Thêm Quy Tắc',
            icon: '⚠️',
            description: 'Stop conditions & guardrails',
            descriptionVi: 'Stop conditions & guardrails',
        },
        {
            id: 'export',
            label: 'Export Spec',
            labelVi: 'Xuất Spec',
            icon: '📋',
            description: 'Copy prompt with rules',
            descriptionVi: 'Copy prompt có quy tắc',
        },
        {
            id: 'paste',
            label: 'Paste to AI',
            labelVi: 'Paste vào AI',
            icon: '🤖',
            description: 'AI follows governance rules',
            descriptionVi: 'AI tuân theo quy tắc',
        },
    ],
    full: [
        {
            id: 'discovery',
            label: 'Discovery',
            labelVi: 'Khám Phá',
            icon: '🔍',
            description: 'AI understands your needs',
            descriptionVi: 'AI hiểu yêu cầu của bạn',
        },
        {
            id: 'design',
            label: 'Design',
            labelVi: 'Thiết Kế',
            icon: '📐',
            description: 'AI proposes solution',
            descriptionVi: 'AI đề xuất giải pháp',
        },
        {
            id: 'build',
            label: 'Build',
            labelVi: 'Thực Thi',
            icon: '🔨',
            description: 'AI executes the plan',
            descriptionVi: 'AI thực thi kế hoạch',
        },
        {
            id: 'review',
            label: 'Review',
            labelVi: 'Đánh Giá',
            icon: '✅',
            description: 'Quality check & delivery',
            descriptionVi: 'Kiểm tra & bàn giao',
        },
    ],
};

const MODE_INFO = {
    simple: {
        name: 'Simple Mode',
        nameVi: 'Chế độ Đơn giản',
        description: 'Quick prompts, no rules. Best for simple tasks.',
        descriptionVi: 'Prompt nhanh, không có quy tắc. Phù hợp task đơn giản.',
        color: 'blue',
        badge: '⚡',
    },
    governance: {
        name: 'Governance Mode',
        nameVi: 'Chế độ Có Quy tắc',
        description: 'Adds stop conditions & guardrails for safer AI execution.',
        descriptionVi: 'Thêm stop conditions & guardrails để AI an toàn hơn.',
        color: 'amber',
        badge: '🛡️',
    },
    full: {
        name: 'CVF Full Mode',
        nameVi: 'CVF Full Mode',
        description: '4-Phase protocol: Discovery → Design → Build → Review',
        descriptionVi: 'Quy trình 4 giai đoạn: Khám phá → Thiết kế → Thực thi → Đánh giá',
        color: 'purple',
        badge: '🚀',
    },
};

interface WorkflowVisualizerProps {
    mode: WorkflowMode;
    currentStep?: number;
    compact?: boolean;
}

export function WorkflowVisualizer({ mode, currentStep = -1, compact = false }: WorkflowVisualizerProps) {
    const { language } = useLanguage();
    const steps = WORKFLOW_STEPS[mode];
    const modeInfo = MODE_INFO[mode];

    const colorClasses = {
        blue: {
            bg: 'bg-blue-500',
            light: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-500',
        },
        amber: {
            bg: 'bg-amber-500',
            light: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-500',
        },
        purple: {
            bg: 'bg-purple-500',
            light: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-500',
        },
    };

    const colors = colorClasses[modeInfo.color as keyof typeof colorClasses];

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-lg">{modeInfo.badge}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {language === 'vi' ? modeInfo.nameVi : modeInfo.name}
                </span>
                <div className="flex items-center gap-1">
                    {steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                                    ${idx <= currentStep ? colors.bg + ' text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                {step.icon}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`w-4 h-0.5 ${idx < currentStep ? colors.bg : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.light}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{modeInfo.badge}</span>
                <div>
                    <h3 className={`font-bold ${colors.text}`}>
                        {language === 'vi' ? modeInfo.nameVi : modeInfo.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'vi' ? modeInfo.descriptionVi : modeInfo.description}
                    </p>
                </div>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-between">
                {steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center text-center">
                            <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                                    transition-all duration-300
                                    ${idx <= currentStep
                                        ? colors.bg + ' text-white shadow-lg scale-110'
                                        : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            >
                                {step.icon}
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {language === 'vi' ? step.labelVi : step.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[80px]">
                                {language === 'vi' ? step.descriptionVi : step.description}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 mx-2">
                                <div
                                    className={`h-1 rounded-full transition-all duration-300
                                        ${idx < currentStep ? colors.bg : 'bg-gray-200 dark:bg-gray-700'}`}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Mode Selector with workflow preview
interface WorkflowModeSelectorProps {
    selectedMode: WorkflowMode;
    onModeChange: (mode: WorkflowMode) => void;
}

export function WorkflowModeSelector({ selectedMode, onModeChange }: WorkflowModeSelectorProps) {
    const { language } = useLanguage();
    const [hoveredMode, setHoveredMode] = useState<WorkflowMode | null>(null);

    const modes: WorkflowMode[] = ['simple', 'governance', 'full'];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {modes.map((mode) => {
                    const info = MODE_INFO[mode];
                    const isSelected = selectedMode === mode;

                    return (
                        <button
                            key={mode}
                            onClick={() => onModeChange(mode)}
                            onMouseEnter={() => setHoveredMode(mode)}
                            onMouseLeave={() => setHoveredMode(null)}
                            className={`p-4 rounded-xl border-2 transition-all text-left
                                ${isSelected
                                    ? `border-${info.color}-500 bg-${info.color}-50 dark:bg-${info.color}-900/20`
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{info.badge}</span>
                                <span className={`font-semibold ${isSelected ? `text-${info.color}-600` : 'text-gray-700 dark:text-gray-300'}`}>
                                    {language === 'vi' ? info.nameVi : info.name}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {language === 'vi' ? info.descriptionVi : info.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Preview workflow for hovered/selected mode */}
            <WorkflowVisualizer mode={hoveredMode || selectedMode} />
        </div>
    );
}

// Export types
export type { WorkflowMode };
