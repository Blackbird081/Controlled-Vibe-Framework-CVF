'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n';

type Lang = 'vi' | 'en';

interface OnboardingWizardProps {
    onComplete: () => void;
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
            vi: 'Là "người gác cổng" thông minh. Bạn cho biết ý định (Intent), CVF sẽ lo phần thực thi (Execution) để đảm bảo kết quả chuẩn xác.',
            en: 'A smart "gatekeeper". You provide the intent, CVF handles execution to ensure accurate results.',
        },
    },
    {
        icon: '📝',
        title: {
            vi: 'Q: Tôi không biết prompt?',
            en: "Q: I don't know how to write prompts?",
        },
        description: {
            vi: 'Không vấn đề! CVF không dùng prompt. Bạn chỉ cần chọn Template và điền form giống như khai báo y tế.',
            en: "No problem! CVF doesn't use prompts. Just pick a Template and fill out a form — like filling out a medical form.",
        },
    },
    {
        icon: '🚀',
        title: {
            vi: 'Q: Làm sao để bắt đầu?',
            en: 'Q: How do I get started?',
        },
        description: {
            vi: 'Chọn một Template phù hợp (Kinh doanh, Kỹ thuật, Nội dung...), điền thông tin và bấm Gửi. AI sẽ làm phần còn lại.',
            en: 'Pick a matching Template (Business, Technical, Content...), fill in the details and hit Submit. AI does the rest.',
        },
    },
    {
        icon: '🎯',
        title: {
            vi: 'Hướng dẫn 3 bước',
            en: '3-Step Guide',
        },
        description: {
            vi: 'Chỉ cần 3 bước đơn giản để có kết quả chuyên nghiệp từ AI.',
            en: 'Just 3 simple steps to get professional AI-powered results.',
        },
        hasQuickGuide: true,
    },
];

const LABELS: Record<Lang, { next: string; start: string; skip: string }> = {
    vi: { next: 'Tiếp tục →', start: 'Bắt đầu ngay 🚀', skip: 'Bỏ qua giới thiệu' },
    en: { next: 'Continue →', start: 'Get Started 🚀', skip: 'Skip intro' },
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
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {/* Step 1: Pick Template */}
                            <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-2xl mb-2">📋</div>
                                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">{language === 'vi' ? 'Bước 1' : 'Step 1'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Chọn Template' : 'Pick Template'}</span>
                            </div>
                            {/* Step 2: Fill Form */}
                            <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-2xl mb-2">✏️</div>
                                <span className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">{language === 'vi' ? 'Bước 2' : 'Step 2'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Điền Form' : 'Fill Form'}</span>
                            </div>
                            {/* Step 3: Get Result */}
                            <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center text-2xl mb-2">🎉</div>
                                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">{language === 'vi' ? 'Bước 3' : 'Step 3'}</span>
                                <span className="text-xs text-center text-gray-600 dark:text-gray-400">{language === 'vi' ? 'Nhận Kết quả' : 'Get Result'}</span>
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
                                onComplete();
                            }
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                    >
                        {step < STEPS.length - 1 ? labels.next : labels.start}
                    </button>

                    {step < STEPS.length - 1 && (
                        <button
                            onClick={onComplete}
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
