'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

// Types
export type ExecutionPhase = 'discovery' | 'design' | 'build' | 'review' | 'complete';

export interface ExecutionStep {
    id: string;
    phase: ExecutionPhase;
    label: string;
    status: 'pending' | 'active' | 'complete' | 'error';
    startTime?: Date;
    endTime?: Date;
    details?: string;
}

export interface ExecutionProgressProps {
    currentPhase: ExecutionPhase;
    steps: ExecutionStep[];
    isRunning: boolean;
    onCancel?: () => void;
    onRetry?: () => void;
    estimatedTime?: number; // seconds
    elapsedTime?: number; // seconds
}

// Phase config
const PHASES: { id: ExecutionPhase; icon: string; labelVi: string; labelEn: string; color: string }[] = [
    { id: 'discovery', icon: '🔍', labelVi: 'Khám phá', labelEn: 'Discovery', color: 'blue' },
    { id: 'design', icon: '📐', labelVi: 'Thiết kế', labelEn: 'Design', color: 'purple' },
    { id: 'build', icon: '🔨', labelVi: 'Thực thi', labelEn: 'Build', color: 'amber' },
    { id: 'review', icon: '✅', labelVi: 'Đánh giá', labelEn: 'Review', color: 'green' },
    { id: 'complete', icon: '🎉', labelVi: 'Hoàn thành', labelEn: 'Complete', color: 'emerald' },
];

// Phase Progress Bar
function PhaseProgressBar({ currentPhase }: { currentPhase: ExecutionPhase }) {
    const currentIndex = PHASES.findIndex(p => p.id === currentPhase);
    const { language } = useLanguage();

    return (
        <div className="flex items-center justify-between mb-6">
            {PHASES.slice(0, 4).map((phase, idx) => {
                const isComplete = idx < currentIndex;
                const isActive = idx === currentIndex;
                const isPending = idx > currentIndex;

                return (
                    <div key={phase.id} className="flex items-center flex-1">
                        {/* Phase circle */}
                        <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                                           transition-all duration-500 ${isComplete
                                    ? 'bg-green-500 text-white scale-100'
                                    : isActive
                                        ? 'bg-blue-500 text-white scale-110 ring-4 ring-blue-200 dark:ring-blue-900'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}>
                                {isComplete ? '✓' : phase.icon}
                            </div>
                            <span className={`mt-2 text-xs font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                                }`}>
                                {language === 'vi' ? phase.labelVi : phase.labelEn}
                            </span>
                        </div>

                        {/* Connector line */}
                        {idx < 3 && (
                            <div className="flex-1 mx-2 h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={`h-full transition-all duration-500 ${isComplete ? 'w-full bg-green-500' : 'w-0 bg-blue-500'
                                        }`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Execution Timer
function ExecutionTimer({ elapsed, estimated }: { elapsed: number; estimated?: number }) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = estimated ? Math.min((elapsed / estimated) * 100, 100) : 0;

    return (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">⏱️ Elapsed: {formatTime(elapsed)}</span>
                    {estimated && (
                        <span className="text-gray-500">Est: ~{formatTime(estimated)}</span>
                    )}
                </div>
                {estimated && (
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Step Card
function StepCard({ step }: { step: ExecutionStep }) {
    const { language } = useLanguage();
    const phase = PHASES.find(p => p.id === step.phase);

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg transition-all ${step.status === 'active'
                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                : step.status === 'complete'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : step.status === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        : 'bg-gray-50 dark:bg-gray-800 border border-transparent'
            }`}>
            {/* Status icon */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step.status === 'active'
                    ? 'bg-blue-500 text-white'
                    : step.status === 'complete'
                        ? 'bg-green-500 text-white'
                        : step.status === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                {step.status === 'complete' ? '✓' : step.status === 'error' ? '!' : step.status === 'active' ? (
                    <span className="animate-spin">◌</span>
                ) : '○'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {step.label}
                    </span>
                    {phase && (
                        <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                            {language === 'vi' ? phase.labelVi : phase.labelEn}
                        </span>
                    )}
                </div>
                {step.details && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{step.details}</p>
                )}
            </div>

            {/* Duration */}
            {step.startTime && step.endTime && (
                <span className="text-xs text-gray-400">
                    {Math.round((step.endTime.getTime() - step.startTime.getTime()) / 1000)}s
                </span>
            )}
        </div>
    );
}

// Main Execution Progress Component
export function ExecutionProgress({
    currentPhase,
    steps,
    isRunning,
    onCancel,
    onRetry,
    estimatedTime,
    elapsedTime = 0,
}: ExecutionProgressProps) {
    const { language } = useLanguage();
    const [elapsed, setElapsed] = useState(elapsedTime);

    // Timer
    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const labels = {
        vi: {
            title: 'Đang thực thi...',
            cancel: 'Hủy',
            retry: 'Thử lại',
            complete: 'Hoàn thành!',
            steps: 'Các bước',
        },
        en: {
            title: 'Executing...',
            cancel: 'Cancel',
            retry: 'Retry',
            complete: 'Complete!',
            steps: 'Steps',
        },
    };
    const l = labels[language];

    const isComplete = currentPhase === 'complete';
    const hasError = steps.some(s => s.status === 'error');

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`p-6 ${isComplete
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : hasError
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                }`}>
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{isComplete ? '🎉' : hasError ? '❌' : '🚀'}</span>
                        <div>
                            <h3 className="font-bold text-lg">{isComplete ? l.complete : l.title}</h3>
                            <p className="text-sm opacity-80">CVF Agent Mode</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {isRunning && onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg 
                                          text-sm font-medium transition-colors"
                            >
                                {l.cancel}
                            </button>
                        )}
                        {hasError && onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-4 py-2 bg-white text-red-600 rounded-lg 
                                          text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                {l.retry}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                {/* Phase Progress */}
                <PhaseProgressBar currentPhase={currentPhase} />

                {/* Timer */}
                <ExecutionTimer elapsed={elapsed} estimated={estimatedTime} />

                {/* Steps */}
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">{l.steps}</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {steps.map(step => (
                            <StepCard key={step.id} step={step} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compact Progress Indicator (for use in chat or other places)
export function CompactProgress({ currentPhase, isRunning }: { currentPhase: ExecutionPhase; isRunning: boolean }) {
    const { language } = useLanguage();
    const phase = PHASES.find(p => p.id === currentPhase);
    const currentIndex = PHASES.findIndex(p => p.id === currentPhase);

    return (
        <div className="flex items-center gap-2">
            {/* Mini phase dots */}
            <div className="flex items-center gap-1">
                {PHASES.slice(0, 4).map((p, idx) => (
                    <div
                        key={p.id}
                        className={`w-2 h-2 rounded-full transition-all ${idx < currentIndex
                                ? 'bg-green-500'
                                : idx === currentIndex
                                    ? 'bg-blue-500 animate-pulse'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                    />
                ))}
            </div>

            {/* Current phase label */}
            {phase && (
                <span className={`text-xs font-medium ${isRunning ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                    }`}>
                    {phase.icon} {language === 'vi' ? phase.labelVi : phase.labelEn}
                </span>
            )}
        </div>
    );
}

// Hook for managing execution state
export function useExecutionProgress() {
    const [isRunning, setIsRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<ExecutionPhase>('discovery');
    const [steps, setSteps] = useState<ExecutionStep[]>([]);
    const [elapsedTime, setElapsedTime] = useState(0);

    const startExecution = useCallback(() => {
        setIsRunning(true);
        setCurrentPhase('discovery');
        setElapsedTime(0);
        setSteps([
            { id: '1', phase: 'discovery', label: 'Understanding requirements...', status: 'active' },
        ]);
    }, []);

    const advancePhase = useCallback((nextPhase: ExecutionPhase) => {
        setCurrentPhase(nextPhase);
        // Update current step to complete
        setSteps(prev => prev.map((s, idx) =>
            idx === prev.length - 1 ? { ...s, status: 'complete', endTime: new Date() } : s
        ));
    }, []);

    const addStep = useCallback((step: Omit<ExecutionStep, 'id' | 'startTime'>) => {
        setSteps(prev => [...prev, {
            ...step,
            id: `step_${Date.now()}`,
            startTime: new Date(),
        }]);
    }, []);

    const completeExecution = useCallback(() => {
        setCurrentPhase('complete');
        setIsRunning(false);
        setSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
    }, []);

    const cancelExecution = useCallback(() => {
        setIsRunning(false);
    }, []);

    const errorExecution = useCallback((stepId: string, error: string) => {
        setIsRunning(false);
        setSteps(prev => prev.map(s =>
            s.id === stepId ? { ...s, status: 'error', details: error } : s
        ));
    }, []);

    return {
        isRunning,
        currentPhase,
        steps,
        elapsedTime,
        startExecution,
        advancePhase,
        addStep,
        completeExecution,
        cancelExecution,
        errorExecution,
    };
}
