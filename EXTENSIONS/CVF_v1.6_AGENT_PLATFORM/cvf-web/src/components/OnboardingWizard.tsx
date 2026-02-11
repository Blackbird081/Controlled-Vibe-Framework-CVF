'use client';

import { useState } from 'react';

interface OnboardingWizardProps {
    onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: 'Chào mừng đến CVF v1.6 Agent Platform',
            description: 'Nền tảng giúp bạn sử dụng AI an toàn, hiệu quả mà không cần kỹ năng kỹ thuật.',
            icon: '👋',
        },
        {
            title: 'Q: CVF là gì?',
            description: 'Là "người gác cổng" thông minh. Bạn cho biết ý định (Intent), CVF sẽ lo phần thực thi (Execution) để đảm bảo kết quả chuẩn xác.',
            icon: '🛡️',
        },
        {
            title: 'Q: Tôi không biết prompt?',
            description: 'Không vấn đề! CVF không dùng prompt. Bạn chỉ cần chọn Template và điền form giống như khai báo y tế.',
            icon: '📝',
        },
        {
            title: 'Q: Làm sao để bắt đầu?',
            description: 'Chọn một Template phù hợp (Kinh doanh, Kỹ thuật, Nội dung...), điền thông tin và bấm Gửi. AI sẽ làm phần còn lại.',
            icon: '🚀',
        },
        // NEW STEP: Quick Start Video / Tutorial
        {
            title: 'Hướng dẫn nhanh',
            description: 'Xem video ngắn (30s) để hiểu cách tạo Business Strategy đầu tiên của bạn.',
            icon: '📺',
            content: (
                <div className="mt-4 aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white mx-auto mb-2 cursor-pointer hover:scale-110 transition-transform shadow-lg">
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">Video hướng dẫn (sắp có)</p>
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="p-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
                        {currentStep.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                        {currentStep.title}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 text-center text-lg leading-relaxed mb-6">
                        {currentStep.description}
                    </p>

                    {currentStep.content}

                    {/* Step Indicators */}
                    <div className="flex justify-center gap-2 mb-8 mt-4">
                        {steps.map((_, i) => (
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
                            if (step < steps.length - 1) {
                                setStep(step + 1);
                            } else {
                                onComplete();
                            }
                        }}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
                    >
                        {step < steps.length - 1 ? 'Tiếp tục →' : 'Bắt đầu ngay 🚀'}
                    </button>

                    {step < steps.length - 1 && (
                        <button
                            onClick={onComplete}
                            className="w-full mt-3 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium"
                        >
                            Bỏ qua giới thiệu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
