'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

type Lang = 'vi' | 'en';

interface OnboardingWizardProps {
    onComplete: (mode?: 'dismiss' | 'starter') => void;
}

interface StepData {
    title: Record<Lang, string>;
    description: Record<Lang, string>;
    icon: string;
    hasVideo?: boolean;
    hasQuickGuide?: boolean;
}

const STEPS: StepData[] = [
    {
        icon: '👋',
        title: {
            vi: 'Chào mừng đến CVF v1.6 Agent Platform',
            en: 'Welcome to CVF v1.6 Agent Platform',
        },
        description: {
            vi: 'Nền tảng giúp bạn sử dụng AI an toàn, hiệu quả mà không cần kỹ năng kỹ thuật.',
            en: 'A platform that helps you use AI safely and effectively — no technical skills required.',
        },
    },
    {
        icon: '🛡️',
        title: {
            vi: 'Q: CVF là gì?',
            en: 'Q: What is CVF?',
        },
        description: {
            vi: 'Là lớp governance điều hướng từ intent sang execute path có kiểm soát. CVF khóa phase, risk, approval và freeze evidence để kết quả có thể đối soát.',
            en: 'It is the governance layer that routes intent into a controlled execute path. CVF locks phase, risk, approvals, and freeze evidence so outcomes stay reviewable.',
        },
    },
    {
        icon: '📝',
        title: {
            vi: 'Q: Tôi không biết prompt?',
            en: "Q: I don't know how to write prompts?",
        },
        description: {
            vi: 'Không sao. Bạn không cần prompt engineering phức tạp. Chỉ cần chọn wizard/template phù hợp và điền brief có cấu trúc để CVF bind đúng governed path.',
            en: "That is fine. You do not need complex prompt engineering. Pick the right wizard/template and fill a structured brief so CVF can bind the correct governed path.",
        },
    },
    {
        icon: '🚀',
        title: {
            vi: 'Q: Làm sao để bắt đầu?',
            en: 'Q: How do I get started?',
        },
        description: {
            vi: 'Chọn wizard phù hợp, điền brief, review governed packet và chỉ launch live path khi bạn thấy đúng phạm vi. CVF giữ execution trong boundary đã khóa.',
            en: 'Pick the right wizard, fill the brief, review the governed packet, and only launch the live path when the scope looks right. CVF keeps execution inside the locked boundary.',
        },
    },
    {
        icon: '🎯',
        title: {
            vi: 'Governed starter path',
            en: 'Governed starter path',
        },
        description: {
            vi: 'Bắt đầu bằng một luồng ngắn, nhưng kết thúc bằng packet review, live run có kiểm soát, và freeze evidence rõ ràng.',
            en: 'Start with a short guided flow, but end with packet review, a controlled live run, and explicit freeze evidence.',
        },
        hasQuickGuide: true,
    },
];

const LABELS: Record<Lang, { next: string; start: string; skip: string }> = {
    vi: { next: 'Tiếp tục →', start: 'Mở governed starter path 🚀', skip: 'Bỏ qua giới thiệu' },
    en: { next: 'Continue →', start: 'Open governed starter path 🚀', skip: 'Skip intro' },
};

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const { language } = useLanguage();

    const currentStep = STEPS[step];
    const labels = LABELS[language];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                        {currentStep.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                        {currentStep.title[language]}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 text-center text-lg leading-relaxed mb-6">
                        {currentStep.description[language]}
                    </p>

                    {currentStep.hasQuickGuide && (
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-2xl mb-2">📋</div>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">{language === 'vi' ? 'Bước 1' : 'Step 1'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Chọn wizard' : 'Pick a wizard'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-2xl mb-2">✏️</div>
                                <span className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">{language === 'vi' ? 'Bước 2' : 'Step 2'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Điền brief' : 'Fill the brief'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center text-2xl mb-2">🧾</div>
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">{language === 'vi' ? 'Bước 3' : 'Step 3'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Review packet' : 'Review packet'}</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center text-2xl mb-2">🧊</div>
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">{language === 'vi' ? 'Bước 4' : 'Step 4'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Live run + freeze' : 'Live run + freeze'}</span>
                            </div>
                        </div>
                    )}

                    {/* Step Indicators */}
                    <div className="flex justify-center gap-2 mb-8 mt-4">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step
                                    ? 'w-6 bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            if (step < STEPS.length - 1) {
                                setStep(step + 1);
                            } else {
                                onComplete('starter');
                            }
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                    >
                        {step < STEPS.length - 1 ? labels.next : labels.start}
                    </button>

                    {step < STEPS.length - 1 && (
                        <button
                            onClick={() => onComplete('dismiss')}
                            className="w-full mt-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium"
                        >
                            {labels.skip}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
